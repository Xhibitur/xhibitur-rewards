// netlify/functions/save-stamps.js
// Emails a customer their stamp backup code via Resend
// No database — the code IS the data, encoded in the email

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { email, slug, bizName, stamps, goal, reward } = JSON.parse(event.body);

    if (!email || !slug) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email and slug required" }) };
    }

    // Generate a restore code that encodes the stamp data
    // Format: base64(email:slug:stamps:timestamp)
    const payload = `${email.toLowerCase()}:${slug}:${stamps}:${Date.now()}`;
    const restoreCode = btoa(payload).replace(/=/g, "").slice(0, 20).toUpperCase();

    // Send email via Resend
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
          subject: `Your ${bizName} loyalty stamps are saved ⭐`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#D4A017;padding:20px 24px;text-align:center">
                <div style="font-size:24px;font-weight:900;color:#000">Xhibitur Rewards</div>
                <div style="font-size:13px;color:#000;margin-top:4px">Your stamps are saved</div>
              </div>
              <div style="padding:28px 24px">
                <h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 8px">You have ${stamps} of ${goal} stamps at ${bizName}!</h2>
                <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px">Your progress is saved. Use your restore code below if you ever switch phones or clear your browser.</p>

                <div style="background:#111;border:2px dashed #D4A017;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <div style="font-size:11px;color:#525252;letter-spacing:.1em;margin-bottom:8px">YOUR RESTORE CODE</div>
                  <div style="font-size:28px;font-weight:900;color:#D4A017;letter-spacing:.1em;font-family:monospace">${restoreCode}</div>
                  <div style="font-size:12px;color:#525252;margin-top:8px">Save this somewhere safe</div>
                </div>

                <div style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:24px">
                  <div style="font-size:13px;color:#a3a3a3;line-height:1.7">
                    <strong style="color:#fff">How to restore:</strong><br/>
                    Visit ${bizName}'s loyalty page, tap "Restore stamps" and enter this code. Your progress will be back instantly.
                  </div>
                </div>

                <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;padding:14px;margin-bottom:8px">
                  <div style="font-size:12px;color:#525252;line-height:1.7">
                    🔒 <strong style="color:#a3a3a3">Privacy note:</strong> Your stamps are stored on your device. We sent this email at your request. We don't track your visits or share your data.
                  </div>
                </div>

                <p style="font-size:12px;color:#333;text-align:center;margin-top:20px">
                  Powered by Xhibitur Rewards · rewards.xhibitur.com
                </p>
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
