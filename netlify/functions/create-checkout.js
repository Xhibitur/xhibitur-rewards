const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { priceId, email, mode, metadata } = JSON.parse(event.body);

    // Determine if this is a one-time payment or subscription
    const checkoutMode = mode || "subscription";

    const sessionConfig = {
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: checkoutMode,
      success_url: checkoutMode === "payment"
        ? "https://rewards.xhibitur.com/#/dashboard/stickers?ordered=true"
        : "https://rewards.xhibitur.com/#/dashboard?upgraded=true",
      cancel_url: checkoutMode === "payment"
        ? "https://rewards.xhibitur.com/#/dashboard/stickers"
        : "https://rewards.xhibitur.com/#/pricing",
    };

    // Add trial only for subscriptions
    if (checkoutMode === "subscription") {
      sessionConfig.subscription_data = { trial_period_days: 14 };
    }

    // Add metadata if provided
    if (metadata) {
      sessionConfig.metadata = metadata;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.log("Stripe error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
