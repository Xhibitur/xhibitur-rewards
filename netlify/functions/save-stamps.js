// netlify/functions/save-stamps.js
// Emails a customer their stamp backup code AND saves their visit to Supabase
// This gives win-back emails the data they need

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { email, slug, bizName, stamps, goal, reward, winbackDays, winbackOffer } = JSON.parse(event.body);

    if (!email || !slug) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email and slug required" }) };
    }

    // Generate restore code
    const payload = `${email.toLowerCase()}:${slug}:${stamps}:${Date.now()}`;
    const restoreCode = Buffer.from(payload).toString("base64").replace(/[+=\/]/g,"").slice(0,20).toUpperCase();

    // ── Save to Supabase for win-back ─────────────────────────────────────────
    try {
      await supabase.from("loyalty_members").upsert({
        email: email.toLowerCase(),
        business_slug: slug,
        business_name: bizName || slug,
        stamps: stamps || 0,
        goal: goal || 10,
        reward: reward || "Free item",
        last_visit: new Date().toISOString(),
        winback_days: winbackDays || 60,
        winback_offer: winbackOffer || "We miss you — come back and earn your next stamp!",
        restore_code: restoreCode,
      }, { onConflict: "email,business_slug" });
    } catch(dbErr) {
      console.log("Supabase save error:", dbErr.message);
      // Continue — don't fail the email just because DB save failed
    }

    // ── Send restore code email via Resend ────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Xhibitur Rewards <notifications@xhibitur.com>",
          to: email,
          subject: `Your ${bizName || "loyalty"} stamps are saved ⭐`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#D4A017;padding:20px 24px;text-align:center">
                <div style="font-size:24px;font-weight:900;color:#000">Xhibitur Rewards</div>
                <div style="font-size:13px;color:#000;margin-top:4px">Your stamps are saved</div>
              </div>
              <div style="padding:28px 24px">
                <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 8px">You have ${stamps} of ${goal} stamps at ${bizName}!</h2>
                <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px">Use the restore code below if you ever switch phones or clear your browser.</p>

                <div style="background:#111;border:2px dashed #D4A017;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <div style="font-size:11px;color:#525252;letter-spacing:.1em;margin-bottom:8px">YOUR RESTORE CODE</div>
                  <div style="font-size:24px;font-weight:900;color:#D4A017;letter-spacing:.08em;font-family:monospace">${restoreCode}</div>
                  <div style="font-size:12px;color:#525252;margin-top:8px">Save this somewhere safe</div>
                </div>

                <div style="background:#111;border-radius:10px;padding:14px;margin-bottom:20px">
                  <div style="font-size:13px;color:#a3a3a3;line-height:1.7">
                    <strong style="color:#fff">How to restore:</strong><br/>
                    Visit ${bizName}'s loyalty page, tap "Have a restore code?" and enter this code.
                  </div>
                </div>

                <div style="font-size:11px;color:#333;text-align:center">
                  🔒 Your stamps are stored on your device. We sent this at your request. We never track your visits or share your data.<br/><br/>
                  Powered by <a href="https://rewards.xhibitur.com" style="color:#D4A017">Xhibitur Rewards</a>
                </div>
              </div>
            </div>
          `,
        }),
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, restoreCode }),
    };

  } catch (err) {
    console.log("save-stamps error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
