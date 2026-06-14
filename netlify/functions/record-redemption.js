// netlify/functions/record-redemption.js
// Records a reward redemption event for analytics

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { slug, email, reward } = body;
  if (!slug) return { statusCode: 400, headers, body: JSON.stringify({ error: "slug required" }) };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/redemptions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: `${slug}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        business_slug: slug,
        email: email || null,
        reward: reward || null,
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
