// netlify/functions/auth.js
// Handles all authentication via Supabase Auth
// signup | signin | signout | forgot-password | reset-password | session

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
        email_confirm: true, // auto-confirm so they don't need to verify email
        user_metadata: { name, plan: "trial", trialStart: new Date().toISOString() },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "An account with this email already exists. Please sign in." }) };
        }
        return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
      }

      // Also save to users table
      await supabase.from("users").upsert({
        id: data.user.id,
        email: email.toLowerCase(),
        name,
        plan: "trial",
        trial_start: new Date().toISOString(),
      }, { onConflict: "email" });

      // Sign them in immediately
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

      // Get user profile from users table
      const { data: profile } = await supabase
        .from("users")
        .select("name, plan")
        .eq("email", email.toLowerCase())
        .single();

      // Check Stripe for real plan status
      let plan = profile?.plan || "trial";
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
        if (customers.data.length) {
          const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
          if (subs.data.length) plan = "pro";
        }
      } catch(e) { /* keep existing plan */ }

      const name = profile?.name || data.user.user_metadata?.name || email.split("@")[0];

      return { statusCode: 200, headers, body: JSON.stringify({
        success: true,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: { id: data.user.id, email: email.toLowerCase(), name, plan }
      })};
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    if (action === "forgot-password") {
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email required" }) };
      }

      // Check if user exists first
      const { data: profile } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (!profile) {
        // Don't reveal if email exists — security best practice
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }

      // Generate reset token via Supabase
      const { error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: email.toLowerCase(),
        options: {
          redirectTo: "https://rewards.xhibitur.com/#/reset-password",
        }
      });

      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to send reset email" }) };
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

      // Verify the token and update password
      const { data, error } = await supabase.auth.admin.updateUserById(token, {
        password: newPassword,
      });

      if (error) {
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
