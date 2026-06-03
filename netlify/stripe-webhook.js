const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

  if (
    stripeEvent.type === "checkout.session.completed" ||
    stripeEvent.type === "invoice.payment_succeeded"
  ) {
    const session = stripeEvent.data.object;
    const email =
      session.customer_email ||
      session.customer_details?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    console.log("Payment succeeded:", email);

    if (email) {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            email: email.toLowerCase(),
            plan: "pro",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          },
          { onConflict: "email" }
        );

      if (error) {
        console.log("Supabase error:", error.message);
      } else {
        console.log("Plan upgraded to pro for:", email);
      }
    }
  }

  if (stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object;
    const customerId = subscription.customer;

    const customer = await stripe.customers.retrieve(customerId);
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
