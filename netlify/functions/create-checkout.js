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
    const { priceId, email } = JSON.parse(event.body);

    console.log("Key prefix:", process.env.STRIPE_SECRET_KEY?.slice(0, 8));
    console.log("Price ID:", priceId);
    console.log("Email:", email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      trial_period_days: 14,
      success_url: "https://rewards.xhibitur.com/#/dashboard?upgraded=true",
      cancel_url: "https://rewards.xhibitur.com/#/pricing",
    });

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
