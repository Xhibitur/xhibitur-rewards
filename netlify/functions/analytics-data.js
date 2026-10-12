// netlify/functions/analytics-data.js
// Returns account totals plus a per-QR-code breakdown of scans, members and redemptions.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Cap on rows pulled for the per-code breakdown. Headline totals are counted
// exactly and are unaffected by this; only the breakdown is capped.
const BREAKDOWN_LIMIT = 100000;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const slugify = (s) => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);

const REAL_REDEMPTION = "reward=neq.__scan__&reward=neq.__unknown__&reward=not.is.null";

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { userEmail } = body;
  if (!userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: "userEmail required" }) };

  const sbHeaders = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
  const countHeaders = { ...sbHeaders, Prefer: "count=exact" };

  const countOf = async (url) => {
    const r = await fetch(url, { headers: countHeaders });
    if (!r.ok) return 0;
    return parseInt(r.headers.get("content-range")?.split("/")[1] || "0") || 0;
  };

  const rowsOf = async (url) => {
    const r = await fetch(url, { headers: sbHeaders });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  };

  try {
    // This user's QR codes. created_at gives a stable order for codes with no activity.
    const qrCodes = await rowsOf(
      `${SUPABASE_URL}/rest/v1/qr_codes?user_email=eq.${encodeURIComponent(userEmail)}&select=name,created_at&order=created_at.asc`
    );

    // Map slug -> display name. Several codes can slugify to the same value;
    // the first one wins, which matches how the check-in pages resolve.
    const nameBySlug = {};
    const slugs = [];
    for (const q of qrCodes) {
      const sl = slugify(q.name);
      if (!sl) continue;
      if (!(sl in nameBySlug)) { nameBySlug[sl] = q.name; slugs.push(sl); }
    }

    if (slugs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ members: 0, redemptions: 0, scans: 0, byCode: [] }) };
    }

    const filter = slugs.map(s => `"${s}"`).join(",");
    const inSlugs = `business_slug=in.(${filter})`;

    const [
      membersCount, redemptionsCount, scansCount,
      scanRows, redRows, memberRows,
    ] = await Promise.all([
      // Exact headline totals
      countOf(`${SUPABASE_URL}/rest/v1/loyalty_members?${inSlugs}&select=id`),
      countOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&${REAL_REDEMPTION}&select=id`),
      countOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&reward=eq.__scan__&select=id`),
      // Slug-only rows for the per-code split
      rowsOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&reward=eq.__scan__&select=business_slug&limit=${BREAKDOWN_LIMIT}`),
      rowsOf(`${SUPABASE_URL}/rest/v1/redemptions?${inSlugs}&${REAL_REDEMPTION}&select=business_slug&limit=${BREAKDOWN_LIMIT}`),
      rowsOf(`${SUPABASE_URL}/rest/v1/loyalty_members?${inSlugs}&select=business_slug&limit=${BREAKDOWN_LIMIT}`),
    ]);

    const tally = (rows) => rows.reduce((acc, r) => {
      const k = r.business_slug;
      if (k) acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const scansBy = tally(scanRows);
    const redsBy  = tally(redRows);
    const memsBy  = tally(memberRows);

    // Every code is listed, including those with no activity yet - a code
    // sitting at zero is the most useful thing on this screen.
    const byCode = slugs.map(sl => ({
      slug: sl,
      name: nameBySlug[sl],
      scans: scansBy[sl] || 0,
      redemptions: redsBy[sl] || 0,
      members: memsBy[sl] || 0,
      checkinUrl: `https://rewards.xhibitur.com/#/checkin/${sl}`,
    })).sort((a, b) => b.scans - a.scans || a.name.localeCompare(b.name));

    return { statusCode: 200, headers, body: JSON.stringify({
      members: membersCount,
      redemptions: redemptionsCount,
      scans: scansCount,
      byCode,
      breakdownCapped: scanRows.length >= BREAKDOWN_LIMIT,
    })};
  } catch (e) {
    console.error("analytics-data error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
