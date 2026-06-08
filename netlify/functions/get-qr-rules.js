// netlify/functions/get-qr-rules.js
// Reads a business's QR rules and reward settings from Cloudflare KV
// Called by the check-in page to show the right stamp goal and reward name

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Slug required" }),
      };
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 50);

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/${cleanSlug}`;

    const cfRes = await fetch(cfUrl, {
      headers: {
        "Authorization": `Bearer ${process.env.CF_API_TOKEN}`,
      },
    });

    if (!cfRes.ok) {
      // Not found — return defaults
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          name: cleanSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          rewardGoal: 10,
          rewardName: "Free item",
        }),
      };
    }

    const data = JSON.parse(await cfRes.text());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: data.name || cleanSlug,
        rewardGoal: data.rewardGoal || 10,
        rewardName: data.rewardName || "Free item",
        programName: data.programName || "",
      }),
    };

  } catch (err) {
    console.log("get-qr-rules error:", err.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ rewardGoal: 10, rewardName: "Free item" }),
    };
  }
};
