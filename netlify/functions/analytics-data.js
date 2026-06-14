// netlify/functions/analytics-data.js
// Returns member count, redemption count, and scan count for a business's check-in pages

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const slugify = (s) => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { userEmail } = body;
  if (!userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: "userEmail required" }) };

  const sbHeaders = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };

  try {
    // Load this user's QR codes to get their check-in page slugs
    const qrRes = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?user_email=eq.${encodeURIComponent(userEmail)}&select=name`, { headers: sbHeaders });
    const qrCodes = await qrRes.json();
    const slugs = (Array.isArray(qrCodes) ? qrCodes : []).map(q => slugify(q.name)).filter(Boolean);

    if (slugs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ members: 0, redemptions: 0, scans: 0 }) };
    }

    const slugFilter = slugs.map(s => `"${s}"`).join(",");

    // Count loyalty members across all of this user's check-in pages
    const membersRes = await fetch(`${SUPABASE_URL}/rest/v1/loyalty_members?business_slug=in.(${slugFilter})&select=id`, {
      headers: { ...sbHeaders, Prefer: "count=exact" },
    });
    const membersCount = parseInt(membersRes.headers.get("content-range")?.split("/")[1] || "0") || 0;

    // Count redemptions across all of this user's check-in pages
    let redemptionsCount = 0;
    const redRes = await fetch(`${SUPABASE_URL}/rest/v1/redemptions?business_slug=in.(${slugFilter})&select=id`, {
      headers: { ...sbHeaders, Prefer: "count=exact" },
    });
    if (redRes.ok) {
      redemptionsCount = parseInt(redRes.headers.get("content-range")?.split("/")[1] || "0") || 0;
    }

    return { statusCode: 200, headers, body: JSON.stringify({ members: membersCount, redemptions: redemptionsCount, scans: 0 }) };
  } catch (e) {
    console.error("analytics-data error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
