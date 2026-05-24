const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.log("Webhook signature failed:", err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }

  // Handle successful payment
  if (
    stripeEvent.type === "checkout.session.completed" ||
    stripeEvent.type === "invoice.payment_succeeded"
  ) {
    const session = stripeEvent.data.object;
    const customerEmail = session.customer_email || session.customer_details?.email;

    console.log("Payment succeeded for:", customerEmail);

    // For now just log it — once Supabase is connected
    // this is where you update the user's plan to "pro"
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
