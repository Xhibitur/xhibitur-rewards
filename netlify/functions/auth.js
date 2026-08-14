// netlify/functions/auth.js
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { action, email, password, name, token, newPassword, partnerId } = JSON.parse(event.body || "{}");

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

      // Insert into users table
      await supabase.from("users").upsert({
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        plan: "trial",
        trial_start: new Date().toISOString(),
        partner_id: (typeof partnerId === "string" && partnerId.trim()) ? partnerId.trim().toLowerCase().slice(0, 50) : null,
      });

      // Sign in to get token
      const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        return { statusCode: 200, headers, body: JSON.stringify({ user: { id: data.user.id, email: email.toLowerCase(), name, plan: "trial" } }) };
      }

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          user: { id: data.user.id, email: email.toLowerCase(), name, plan: "trial" },
          token: session.session?.access_token,
          refreshToken: session.session?.refresh_token,
        }),
      };
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
        return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid email or password." }) };
      }

      // Fetch user record for name and plan
      const { data: userRow } = await supabase
        .from("users")
        .select("name, plan")
        .eq("email", email.toLowerCase())
        .single();

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          user: {
            id: data.user.id,
            email: data.user.email,
            name: userRow?.name || data.user.user_metadata?.name || "",
            plan: userRow?.plan || data.user.user_metadata?.plan || "trial",
          },
          token: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
        }),
      };
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    if (action === "forgot-password") {
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
      }

      // Generate a password reset link via Supabase
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase(),
        options: {
          redirectTo: "https://rewards.xhibitur.com/#/reset-password",
        },
      });

      if (error) {
        // Return success even if email not found (security best practice)
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      const resetLink = data.properties?.action_link;
      if (!resetLink) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // Send via Resend
      await resend.emails.send({
        from: "Xhibitur Rewards <notifications@xhibitur.com>",
        to: email.toLowerCase(),
        subject: "Reset your Xhibitur Rewards password",
        html: `
          <div style="font-family:Inter,sans-serif;background:#000;padding:32px;min-height:100vh">
            <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden">
              <div style="background:#0a0a0a;padding:24px 28px;border-bottom:1px solid #1a1a1a">
                <span style="font-size:18px;font-weight:800;color:#fff">Xhibitur</span>
                <span style="font-size:16px;font-weight:700;color:#D4A017">Rewards</span>
              </div>
              <div style="padding:28px">
                <h2 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 12px">Reset your password</h2>
                <p style="color:#a3a3a3;font-size:14px;line-height:1.65;margin:0 0 24px">
                  We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
                </p>
                <div style="text-align:center;margin-bottom:24px">
                  <a href="${resetLink}" style="display:inline-block;background:#D4A017;color:#000;padding:14px 32px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Reset my password →</a>
                </div>
                <p style="color:#525252;font-size:13px;line-height:1.6">If you didn't request this, ignore this email — your password won't change.</p>
                <p style="font-size:12px;color:#333;text-align:center;margin-top:20px">Powered by Xhibitur Rewards · rewards.xhibitur.com</p>
              </div>
            </div>
          </div>
        `,
      });

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

      // Use the access_token to create a user-scoped Supabase client
      // then call updateUser — this is the correct way to use recovery tokens
      const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY  // anon key for user-scoped client
      );

      // Set the session using the recovery access token
      const { data: sessionData, error: sessionError } = await userSupabase.auth.setSession({
        access_token: token,
        refresh_token: token, // recovery tokens act as both
      });

      if (sessionError) {
        // Fallback: try to decode the JWT to get user ID and use admin client
        try {
          const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          const userId = payload.sub;
          if (!userId) throw new Error("No user ID in token");

          const { error: adminError } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword,
          });

          if (adminError) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or expired reset link. Please request a new one." }) };
          }

          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        } catch (decodeErr) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or expired reset link. Please request a new one." }) };
        }
      }

      // Update password using the user-scoped client
      const { error: updateError } = await userSupabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or expired reset link. Please request a new one." }) };
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
