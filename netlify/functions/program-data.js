// netlify/functions/program-data.js
// Handles load and save for Rewards Programs per user

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const body = JSON.parse(event.body || "{}");
  const { action, userEmail, program, programId } = body;

  if (!userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: "userEmail required" }) };

  // ── LOAD all programs for user ────────────────────────────────────────────
  if (action === "load") {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/programs?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.asc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const data = await res.json();
    const programs = (Array.isArray(data) ? data : []).map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      active: r.active,
      members: r.members,
      redemptions: r.redemptions,
      scans: r.scans,
      cfg: r.cfg,
      col: r.col,
    }));
    return { statusCode: 200, headers, body: JSON.stringify({ programs }) };
  }

  // ── SAVE (upsert) a program ───────────────────────────────────────────────
  if (action === "save") {
    if (!program) return { statusCode: 400, headers, body: JSON.stringify({ error: "program required" }) };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/programs`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: program.id,
        user_email: userEmail,
        name: program.name,
        type: program.type,
        active: program.active,
        members: program.members || 0,
        redemptions: program.redemptions || 0,
        scans: program.scans || 0,
        cfg: program.cfg,
        col: program.col,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  // ── DELETE a program ──────────────────────────────────────────────────────
  if (action === "delete") {
    await fetch(`${SUPABASE_URL}/rest/v1/programs?id=eq.${programId}&user_email=eq.${encodeURIComponent(userEmail)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
    });
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
};
