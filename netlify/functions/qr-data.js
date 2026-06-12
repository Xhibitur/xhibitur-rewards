// netlify/functions/qr-data.js
// Handles GET (load) and POST (save) for QR codes per user

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const { action, userEmail, qr } = JSON.parse(event.body || "{}");

  if (!userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: "userEmail required" }) };

  // ── LOAD all QR codes for user ────────────────────────────────────────────
  if (action === "load") {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/qr_codes?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.asc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const data = await res.json();
    // Map snake_case back to camelCase for the frontend
    const codes = (Array.isArray(data) ? data : []).map(r => ({
      id: r.id,
      name: r.name,
      workerUrl: r.worker_url,
      destinations: r.destinations || [],
      fallback: r.fallback,
      fg: r.fg,
      linkedProgram: r.linked_program,
    }));
    return { statusCode: 200, headers, body: JSON.stringify({ codes }) };
  }

  // ── SAVE (upsert) a QR code ───────────────────────────────────────────────
  if (action === "save") {
    if (!qr) return { statusCode: 400, headers, body: JSON.stringify({ error: "qr required" }) };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/qr_codes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: qr.id,
        user_email: userEmail,
        name: qr.name,
        worker_url: qr.workerUrl,
        destinations: qr.destinations,
        fallback: qr.fallback,
        fg: qr.fg,
        linked_program: qr.linkedProgram,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // ── DELETE a QR code ──────────────────────────────────────────────────────
  if (action === "delete") {
    const { qrId } = JSON.parse(event.body || "{}");
    await fetch(`${SUPABASE_URL}/rest/v1/qr_codes?id=eq.${qrId}&user_email=eq.${encodeURIComponent(userEmail)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
};
