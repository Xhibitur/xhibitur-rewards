// netlify/functions/stripe-webhook.js
// Listens for checkout.session.completed and sets the user's plan to "pro" in Supabase

const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64")
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // ── Handle checkout.session.completed ─────────────────────────────────────
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const email = session.customer_details?.email || session.customer_email;

    if (!email) {
      console.error("No email found on checkout session:", session.id);
      return { statusCode: 200, body: JSON.stringify({ received: true, warning: "no email" }) };
    }

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ plan: "pro" }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Supabase update failed:", errText);
        return { statusCode: 500, body: JSON.stringify({ error: errText }) };
      }

      const updated = await res.json();
      console.log(`Plan updated to pro for ${email}`, updated);
    } catch (e) {
      console.error("Error updating Supabase:", e.message);
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
