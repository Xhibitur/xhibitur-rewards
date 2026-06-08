// netlify/functions/get-qr-rules.js
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };

  try {
    const slug = event.queryStringParameters?.slug;
    if (!slug) return { statusCode:400, headers, body: JSON.stringify({ error:"Slug required" }) };

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g,"").slice(0,50);

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/${cleanSlug}`,
      { headers:{ "Authorization":`Bearer ${process.env.CF_API_TOKEN}` } }
    );

    if (!cfRes.ok) {
      return { statusCode:200, headers, body: JSON.stringify({
        name: cleanSlug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase()),
        rewardGoal: 10, rewardName: "Free item",
      })};
    }

    const data = JSON.parse(await cfRes.text());

    return { statusCode:200, headers, body: JSON.stringify({
      name:        data.name || cleanSlug,
      rewardGoal:  data.rewardGoal  || 10,
      rewardName:  data.rewardName  || "Free item",
      programName: data.programName || "",
      tiers:       data.tiers       || null,
      refEnabled:  data.refEnabled  || false,
      refBonus:    data.refBonus    || "1 bonus stamp",
    })};

  } catch(err) {
    return { statusCode:200, headers, body: JSON.stringify({ rewardGoal:10, rewardName:"Free item" }) };
  }
};
