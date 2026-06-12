// netlify/functions/auth.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Send email via Resend
async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) { console.log("No RESEND_API_KEY"); return false; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Xhibitur Rewards <notifications@xhibitur.com>",
        to,
        subject,
        html,
      }),
    });
    const data = await res.json();
    console.log("Email result:", JSON.stringify(data));
    return res.ok;
  } catch(e) {
    console.log("Email error:", e.message);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { action, email, password, name, token, newPassword } = JSON.parse(event.body || "{}");

    // ── SIGN UP ───────────────────────────────────────────────────────────────
    if (action === "signup") {
      if (!email || !password || !name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "All fields required" }) };
      }
      if (password.length < 8) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Password must be at least 8 characters" }) };
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name, plan: "trial", trialStart: new Date().toISOString() },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "An account with this email already exists. Please sign in." }) };
        }
        return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      }

      // Save to users table
      await supabase.from("users").upsert({
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        plan: "trial",
        trial_start: new Date().toISOString(),
      }, { onConflict: "email" });

      // Sign in immediately
      const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInErr) {
        return { statusCode: 200, headers, body: JSON.stringify({
          success: true,
          user: { id: data.user.id, email: email.toLowerCase(), name, plan: "trial" }
        })};
      }

      // Send welcome email
      await sendEmail({
        to: email,
        subject: "Welcome to Xhibitur Rewards! 🎉",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:12px;overflow:hidden">
            <div style="background:#D4A017;padding:20px 24px;text-align:center">
              <div style="font-size:24px;font-weight:900;color:#000">Xhibitur Rewards</div>
            </div>
            <div style="padding:28px 24px">
              <h2 style="color:#fff;margin:0 0 12px">Welcome, ${name}! 👋</h2>
              <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 20px">Your 14-day free trial has started. Set up your first Smart QR code and rewards program today.</p>
              <div style="text-align:center;margin-bottom:24px">
                <a href="https://rewards.xhibitur.com/#/dashboard" style="display:inline-block;background:#D4A017;color:#000;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Go to dashboard →</a>
              </div>
              <p style="font-size:12px;color:#333;text-align:center">Powered by Xhibitur Rewards · rewards.xhibitur.com</p>
            </div>
          </div>
        `,
      });

      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        token: session.session.access_token,
        refreshToken: session.session.refresh_token,
        user: { id: data.user.id, email: email.toLowerCase(), name, plan: "trial" }
      })};
    }

    // ── SIGN IN ───────────────────────────────────────────────────────────────
    if (action === "signin") {
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email and password required" }) };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid email or password" }) };
      }

      const { data: profile } = await supabase
        .from("users")
        .select("name, plan")
        .eq("email", email.toLowerCase())
        .single();

      let plan = profile?.plan || "trial";
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
        if (customers.data.length) {
          const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
          if (subs.data.length) plan = "pro";
        }
      } catch(e) {}

      const userName = profile?.name || data.user.user_metadata?.name || email.split("@")[0];

      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: { id: data.user.id, email: email.toLowerCase(), name: userName, plan }
      })};
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    if (action === "forgot-password") {
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
      }

      // Generate a secure reset token using Supabase
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase(),
        options: {
          redirectTo: "https://rewards.xhibitur.com/#/reset-password",
        }
      });

      // Always return success — don't reveal if email exists
      if (error) {
        console.log("generateLink error:", error.message);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // Send the reset email ourselves via Resend
      const resetLink = data?.properties?.action_link;
      if (resetLink) {
        await sendEmail({
          to: email,
          subject: "Reset your Xhibitur Rewards password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:12px;overflow:hidden">
              <div style="background:#D4A017;padding:20px 24px;text-align:center">
                <div style="font-size:24px;font-weight:900;color:#000">Xhibitur Rewards</div>
                <div style="font-size:13px;color:#000;margin-top:4px">Password Reset</div>
              </div>
              <div style="padding:28px 24px">
                <h2 style="color:#fff;margin:0 0 12px">Reset your password</h2>
                <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 24px">We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
                <div style="text-align:center;margin-bottom:24px">
                  <a href="${resetLink}" style="display:inline-block;background:#D4A017;color:#000;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Reset my password →</a>
                </div>
                <p style="color:#525252;font-size:13px;line-height:1.6">If you didn't request this, ignore this email — your password won't change.</p>
                <p style="font-size:12px;color:#333;text-align:center;margin-top:20px">Powered by Xhibitur Rewards · rewards.xhibitur.com</p>
              </div>
            </div>
          `,
        });
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── RESET PASSWORD ────────────────────────────────────────────────────────
    if (action === "reset-password") {
      if (!token || !newPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Token and new password required" }) };
      }
      if (newPassword.length < 8) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Password must be at least 8 characters" }) };
      }
const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or expired reset link. Please request a new one." }) };
      }
      const { error } = await supabase.auth.admin.updateUserById(userData.user.id, {
        password: newPassword,
      });
      if (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Failed to update password. Please request a new reset link." }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
     
    }

    // ── UPDATE NAME ───────────────────────────────────────────────────────────
    if (action === "update-name") {
      if (!email || !name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email and name required" }) };
      }
      await supabase.from("users").update({ name }).eq("email", email.toLowerCase());
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.log("Auth error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong. Please try again." }) };
  }
};
