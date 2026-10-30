// netlify/functions/analytics-data.js
// Account totals, a per-QR-code breakdown, the recency risk ladder, and
// win-back attribution (who came back after an email, and what it was worth).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ROW_LIMIT = 100000;   // rows pulled for breakdowns; totals stay exact
const PEOPLE_LIMIT = 2000;  // people returned to the dashboard

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const slugify = (s) => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
const REAL = "reward=neq.__scan__&reward=neq.__unknown__&reward=not.is.null";
const DAY = 86400000;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { userEmail, action, avgCheck } = body;
  if (!userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: "userEmail required" }) };

  const sb = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const sbJson = { ...sb, "Content-Type": "application/json" };

  const rowsOf = async (url) => {
    const r = await fetch(url, { headers: sb });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  };
  const countOf = async (url) => {
    const r = await fetch(url, { headers: { ...sb, Prefer: "count=exact" } });
    if (!r.ok) return 0;
    return parseInt(r.headers.get("content-range")?.split("/")[1] || "0") || 0;
  };

  try {
    // ---- Save the average check -------------------------------------------
    if (action === "saveAvgCheck") {
      const v = Number(avgCheck);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}`, {
        method: "PATCH",
        headers: { ...sbJson, Prefer: "return=minimal" },
        body: JSON.stringify({ avg_check: isFinite(v) && v > 0 ? v : null }),
      });
      if (!r.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: await r.text() }) };
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ---- This user's locations --------------------------------------------
    const qrCodes = await rowsOf(
      `${SUPABASE_URL}/rest/v1/qr_codes?user_email=eq.${encodeURIComponent(userEmail)}&select=name,created_at&order=created_at.asc`
    );
    const nameBySlug = {}; const slugs = [];
    for (const q of qrCodes) {
      const sl = slugify(q.name);
      if (!sl || (sl in nameBySlug)) continue;
      nameBySlug[sl] = q.name; slugs.push(sl);
    }

    const userRows = await rowsOf(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=avg_check&limit=1`
    );
    const avg = Number(userRows[0]?.avg_check) || 0;

    const empty = {
      members:0, redemptions:0, scans:0, byCode:[], avgCheck:avg,
      bands:{active:0,cooling:0,risk:0,lapsed:0}, people:[],
      winback:{sent:0,returned:0,recovered:0,visitsBack:0},
    };
    if (slugs.length === 0) return { statusCode: 200, headers, body: JSON.stringify(empty) };

    const inSlugs = `business_slug=in.(${slugs.map(s=>`"${s}"`).join(",")})`;

    const [membersCount, redemptionsCount, scansCount, scanRows, redRows, memberRows] = await Promise.all([
      countOf(`${SUPABASE_URL}/rest/v1/loyalty_members?${inSlugs}&select=id`),
      countOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&${REAL}&select=id`),
      countOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&reward=eq.__scan__&select=id`),
      rowsOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&reward=eq.__scan__&select=business_slug&limit=${ROW_LIMIT}`),
      rowsOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&${REAL}&select=business_slug,email,created_at&limit=${ROW_LIMIT}`),
      rowsOf(`${SUPABASE_URL}/rest/v1/loyalty_members?${inSlugs}&select=email,business_slug,business_name,stamps,goal,reward,last_visit,winback_sent_at,email_opt_in&limit=${ROW_LIMIT}`),
    ]);

    // ---- Per-code breakdown -----------------------------------------------
    const tally = (rows) => rows.reduce((a,r)=>{ if(r.business_slug) a[r.business_slug]=(a[r.business_slug]||0)+1; return a; },{});
    const scansBy = tally(scanRows);
    const redsBy  = tally(redRows);
    const memsBy  = tally(memberRows);

    const byCode = slugs.map(sl => ({
      slug: sl, name: nameBySlug[sl],
      scans: scansBy[sl]||0, redemptions: redsBy[sl]||0, members: memsBy[sl]||0,
      checkinUrl: `https://rewards.xhibitur.com/#/checkin/${sl}`,
    })).sort((a,b)=> b.scans-a.scans || a.name.localeCompare(b.name));

    // ---- Per-person history from the redemptions log ----------------------
    // Everyone who ever checked in with an email, not just those who saved.
    const hist = {};
    for (const r of redRows) {
      const em = (r.email||"").trim().toLowerCase();
      if (!em) continue;
      const k = em + "|" + r.business_slug;
      const t = new Date(r.created_at).getTime();
      if (!isFinite(t)) continue;
      const h = hist[k] || (hist[k] = { email:em, slug:r.business_slug, visits:0, last:0, first:Infinity, times:[] });
      h.visits++; h.times.push(t);
      if (t > h.last) h.last = t;
      if (t < h.first) h.first = t;
    }

    // Member records carry stamps, consent, and the win-back timestamp.
    const mem = {};
    for (const m of memberRows) {
      const em = (m.email||"").trim().toLowerCase();
      if (!em) continue;
      mem[em + "|" + m.business_slug] = m;
    }
    // A saved member with no logged check-in still belongs in the ladder.
    for (const k in mem) {
      if (hist[k]) continue;
      const m = mem[k];
      const t = m.last_visit ? new Date(m.last_visit).getTime() : 0;
      hist[k] = { email:m.email.trim().toLowerCase(), slug:m.business_slug, visits:0, last:t||0, first:t||0, times:[] };
    }

    const now = Date.now();
    const bands = { active:0, cooling:0, risk:0, lapsed:0 };
    let sent = 0, returned = 0, visitsBack = 0;

    const people = Object.keys(hist).map(k => {
      const h = hist[k];
      const m = mem[k] || null;
      const lastTs = Math.max(h.last, m && m.last_visit ? new Date(m.last_visit).getTime() : 0);
      const days = lastTs ? Math.floor((now - lastTs) / DAY) : null;

      let band = "lapsed";
      if (days === null) band = "lapsed";
      else if (days < 15) band = "active";
      else if (days < 30) band = "cooling";
      else if (days < 60) band = "risk";
      bands[band]++;

      const wbTs = m && m.winback_sent_at ? new Date(m.winback_sent_at).getTime() : 0;
      let came = false, since = 0;
      if (wbTs) {
        sent++;
        since = h.times.filter(t => t > wbTs).length;
        came = since > 0 || lastTs > wbTs;
        if (came) { returned++; visitsBack += Math.max(since, 1); }
      }

      return {
        email: h.email,
        slug: h.slug,
        location: nameBySlug[h.slug] || h.slug,
        days,
        visits: h.visits,
        firstSeen: isFinite(h.first) && h.first ? new Date(h.first).toISOString() : null,
        lastVisit: lastTs ? new Date(lastTs).toISOString() : null,
        stamps: m ? (m.stamps || 0) : 0,
        goal: m ? (m.goal || 10) : 10,
        band,
        winbackSent: !!wbTs,
        returned: came,
        optIn: m ? m.email_opt_in !== false : true,
        saved: !!m,
        value: avg > 0 ? Math.round(h.visits * avg) : null,
      };
    })
    .sort((a,b) => (b.value||b.visits*1000) - (a.value||a.visits*1000) || (b.visits - a.visits))
    .slice(0, PEOPLE_LIMIT);

    return { statusCode: 200, headers, body: JSON.stringify({
      members: membersCount,
      redemptions: redemptionsCount,
      scans: scansCount,
      byCode,
      avgCheck: avg,
      bands,
      people,
      winback: { sent, returned, visitsBack, recovered: avg > 0 ? Math.round(visitsBack * avg) : 0 },
      reachable: people.filter(p => p.optIn).length,
      unreachable: people.filter(p => !p.optIn).length,
    })};
  } catch (e) {
    console.error("analytics-data error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
