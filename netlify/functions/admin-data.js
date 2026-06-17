// netlify/functions/admin-data.js
// Secure admin-only endpoint — only responds to info@xhibitur.com

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL = "info@xhibitur.com";

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

  // Guard — only admin email can request this data
  if (!body.adminEmail || body.adminEmail.toLowerCase() !== ADMIN_EMAIL) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const sbHeaders = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const [usersRes, membersRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, { headers: sbHeaders }),
      fetch(`${SUPABASE_URL}/rest/v1/loyalty_members?select=*&order=created_at.desc`, { headers: sbHeaders }),
    ]);

    const users = await usersRes.json();
    const members = await membersRes.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: Array.isArray(users) ? users : [],
        members: Array.isArray(members) ? members : [],
      }),
    };
  } catch (e) {
    console.error("admin-data error:", e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
