// netlify/functions/record-redemption.js
// Records a reward redemption event for analytics.
// Also enforces the per-guest check-in cooldown server-side, so clearing
// localStorage or switching browsers no longer earns a second stamp.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Hours a guest must wait between stamps. Override with COOLDOWN_HOURS in Netlify env.
const COOLDOWN_HOURS = parseFloat(process.env.COOLDOWN_HOURS || "4");
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const sbHeaders = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
};

function waitMessage(ms) {
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `Come back in ${mins} minute${mins === 1 ? "" : "s"} to earn another stamp`;
  const hrs = Math.ceil(ms / 3600000);
  return `Come back in ${hrs} hour${hrs === 1 ? "" : "s"} to earn another stamp`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { slug, reward } = body;
  if (!slug) return { statusCode: 400, headers, body: JSON.stringify({ error: "slug required" }) };

  const email = (body.email || "").trim().toLowerCase();
  const rewardLabel = reward || "__unknown__";

  // Page-view scans are not stamps - never rate limited, and they carry no email.
  const isScan = rewardLabel === "__scan__";

  // ---- Server-side cooldown -------------------------------------------------
  // Only applies to real stamp/reward events tied to an email address.
  if (!isScan && email) {
    try {
      const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();
      const q =
        `${SUPABASE_URL}/rest/v1/redemptions` +
        `?business_slug=eq.${encodeURIComponent(slug)}` +
        `&email=eq.${encodeURIComponent(email)}` +
        `&reward=neq.__scan__` +
        `&created_at=gte.${encodeURIComponent(cutoff)}` +
        `&select=created_at&order=created_at.desc&limit=1`;

      const recent = await fetch(q, { headers: sbHeaders });

      if (recent.ok) {
        const rows = await recent.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const lastAt = new Date(rows[0].created_at).getTime();
          const retryAfterMs = Math.max(0, COOLDOWN_MS - (Date.now() - lastAt));
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              error: "cooldown",
              retryAfterMs,
              lastCheckIn: rows[0].created_at,
              message: waitMessage(retryAfterMs),
            }),
          };
        }
      } else {
        // Query failed (schema mismatch, transient outage). Log and let the
        // check-in through rather than blocking a paying guest at the counter.
        console.error("cooldown lookup failed:", recent.status, await recent.text());
      }
    } catch (e) {
      console.error("cooldown lookup error:", e.message);
    }
  }

  // ---- Record the event -----------------------------------------------------
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/redemptions`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        id: `${slug}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        business_slug: slug,
        email: email || null,
        reward: rewardLabel,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("record-redemption insert failed:", errText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: errText }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
