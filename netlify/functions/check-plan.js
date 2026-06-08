// netlify/functions/check-plan.js
// Checks Stripe directly to see if a customer has an active subscription
// Called on login to update the user's plan status without needing a database

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
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ plan: "trial" }),
      };
    }

    // Search for customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (!customers.data.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ plan: "trial" }),
      };
    }

    const customer = customers.data[0];

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5,
    });

    const active = subscriptions.data.find(s =>
      s.status === "active" ||
      s.status === "trialing"
    );

    if (active) {
      const plan = active.status === "trialing" ? "trial" : "pro";
      console.log(`Plan check for ${email}: ${plan} (${active.status})`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ plan, status: active.status }),
      };
    }

    // Check for cancelled but still within period
    const cancelled = subscriptions.data.find(s =>
      s.status === "canceled" && s.current_period_end * 1000 > Date.now()
    );

    if (cancelled) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ plan: "pro", status: "canceled_active" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ plan: "trial" }),
    };

  } catch (err) {
    console.log("check-plan error:", err.message);
    // On error default to trial — don't lock users out
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ plan: "trial" }),
    };
  }
};
