// netlify/functions/send-broadcast.js
// Sends a broadcast email to all loyalty members for a given business slug
// Uses Resend for delivery and Supabase to fetch member list

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { businessSlug, businessName, subject, message, userEmail } = body;

  if (!businessSlug || !businessName || !subject || !message) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "businessSlug, businessName, subject, and message are required" }) };
  }

  // ── Fetch members from Supabase ───────────────────────────────────────────
  const supabaseRes = await fetch(
    `${SUPABASE_URL}/rest/v1/loyalty_members?business_slug=eq.${encodeURIComponent(businessSlug)}&select=email,stamps,goal,reward`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const members = await supabaseRes.json();

  if (!Array.isArray(members) || members.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, message: "No members found for this business." }) };
  }

  // ── Rate limit: max 2 broadcasts per day (checked via simple timestamp in KV — skip for now) ──

  let sent = 0;
  const errors = [];

  for (const member of members) {
    const stampsLeft = Math.max(0, (member.goal || 10) - (member.stamps || 0));
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#000;color:#fff;border-radius:12px;overflow:hidden">
        <!-- Header -->
        <div style="background:#D4A017;padding:20px 24px;text-align:center">
          <div style="font-size:22px;font-weight:900;color:#000;letter-spacing:-0.02em">${businessName}</div>
          <div style="font-size:12px;color:#000;margin-top:3px;opacity:0.7">Loyalty Rewards</div>
        </div>

        <!-- Body -->
        <div style="padding:28px 24px">
          <div style="font-size:15px;color:#d4d4d4;line-height:1.7;white-space:pre-wrap;margin-bottom:24px">${message}</div>

          <!-- Stamp progress -->
          <div style="background:#171717;border:1px solid #252525;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center">
            <div style="font-size:11px;font-weight:700;color:#525252;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Your loyalty progress</div>
            <div style="font-size:28px;font-weight:900;color:#D4A017;letter-spacing:-0.04em">${member.stamps || 0} / ${member.goal || 10}</div>
            <div style="font-size:13px;color:#a3a3a3;margin-top:4px">
              ${stampsLeft === 0
                ? `You've earned your <strong style="color:#D4A017">${member.reward || "reward"}</strong>! Come in to redeem.`
                : `Only <strong style="color:#D4A017">${stampsLeft} more visit${stampsLeft !== 1 ? "s" : ""}</strong> until your <strong style="color:#D4A017">${member.reward || "free reward"}</strong>`
              }
            </div>
          </div>

          <p style="color:#525252;font-size:12px;line-height:1.6;text-align:center;margin:0">
            You're receiving this because you joined ${businessName}'s loyalty rewards program.<br/>
            <a href="mailto:info@xhibitur.com?subject=Unsubscribe&body=Please unsubscribe ${member.email} from ${businessName} messages." style="color:#525252">Unsubscribe</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#0a0a0a;padding:14px 24px;text-align:center;border-top:1px solid #1a1a1a">
          <div style="font-size:11px;color:#333">Powered by <strong style="color:#D4A017">Xhibitur Rewards</strong> · rewards.xhibitur.com</div>
        </div>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${businessName} via Xhibitur Rewards <notifications@xhibitur.com>`,
          to: member.email,
          subject,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const err = await res.json();
        errors.push({ email: member.email, error: err.message });
      }
    } catch (e) {
      errors.push({ email: member.email, error: e.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, sent, total: members.length, errors }),
  };
};
