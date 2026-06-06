const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Send email notification via Resend
async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log("No RESEND_API_KEY set — skipping email");
    return;
  }
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
    console.log("Email sent:", data.id || data.error);
  } catch (err) {
    console.log("Email error:", err.message);
  }
}

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook error:", err.message);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }

  // ── Checkout completed ────────────────────────────────────────────────────
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;
    const metadata = session.metadata || {};

    console.log("Checkout completed:", email, "mode:", session.mode);

    // ── Sticker order ───────────────────────────────────────────────────────
    if (metadata.type === "sticker_order") {
      console.log("STICKER ORDER:", JSON.stringify(metadata));

      // Notify James at info@xhibitur.com
      await sendEmail({
        to: "info@xhibitur.com",
        subject: `New Sticker Order — ${metadata.bizName || email}`,
        html: `
          <h2 style="color:#D4A017">New Sticker Order Received</h2>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Business</td><td style="padding:8px">${metadata.bizName || "N/A"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Customer Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Ship To</td><td style="padding:8px">${metadata.address || "N/A"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Amount</td><td style="padding:8px">$29.99</td></tr>
          </table>
          <br/>
          <p style="color:#555">Log into Sticker Mule to fulfill this order:</p>
          <a href="https://www.stickermule.com" style="background:#D4A017;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold">Open Sticker Mule</a>
          <br/><br/>
          <p style="color:#999;font-size:12px">Xhibitur LLC · rewards.xhibitur.com</p>
        `,
      });

      // Send confirmation to customer
      await sendEmail({
        to: email,
        subject: "Your Xhibitur Sticker Order is Confirmed!",
        html: `
          <h2 style="color:#D4A017">Order Confirmed! 🎉</h2>
          <p>Hi ${metadata.bizName || "there"},</p>
          <p>Your 10 co-branded QR stickers are on their way. Here are your order details:</p>
          <table style="border-collapse:collapse;width:100%;max-width:500px">
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Order</td><td style="padding:8px">10 Co-Branded QR Stickers</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Shipping To</td><td style="padding:8px">${metadata.address || "N/A"}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Estimated Delivery</td><td style="padding:8px">7-10 business days</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5">Total</td><td style="padding:8px">$29.99</td></tr>
          </table>
          <br/>
          <p>While you wait, set up your Smart QR code and print a temporary sign to display at your counter today:</p>
          <a href="https://rewards.xhibitur.com/#/dashboard/qr" style="background:#D4A017;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold">Go to dashboard →</a>
          <br/><br/>
          <p>Questions? Email us at info@xhibitur.com</p>
          <p style="color:#999;font-size:12px">Xhibitur LLC · rewards.xhibitur.com</p>
        `,
      });
    }

    // ── Subscription payment ────────────────────────────────────────────────
    if (session.mode === "subscription") {
      if (email) {
        const { error } = await supabase
          .from("users")
          .upsert(
            {
              email: email.toLowerCase(),
              plan: "pro",
              stripe_customer_id: customerId,
              stripe_subscription_id: session.subscription,
            },
            { onConflict: "email" }
          );
        if (error) console.log("Supabase error:", error.message);
        else console.log("Plan upgraded to pro for:", email);
      }
    }
  }

  // ── Invoice paid (recurring) ──────────────────────────────────────────────
  if (stripeEvent.type === "invoice.payment_succeeded") {
    const session = stripeEvent.data.object;
    const email = session.customer_email || session.customer_details?.email;
    const customerId = session.customer;

    if (email) {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            email: email.toLowerCase(),
            plan: "pro",
            stripe_customer_id: customerId,
          },
          { onConflict: "email" }
        );
      if (error) console.log("Supabase error:", error.message);
      else console.log("Plan confirmed pro for:", email);
    }
  }

  // ── Subscription cancelled ────────────────────────────────────────────────
  if (stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    const email = customer.email;

    if (email) {
      await supabase
        .from("users")
        .update({ plan: "trial" })
        .eq("email", email.toLowerCase());
      console.log("Plan downgraded for:", email);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
