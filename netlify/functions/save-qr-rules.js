// netlify/functions/save-qr-rules.js
function fixUrl(url) {
  if (!url || !url.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "https://" + u;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };

  try {
    const { slug, name, destinations, fallback, rewardGoal, rewardName, programName } = JSON.parse(event.body);

    if (!slug || !name) return { statusCode:400, headers, body: JSON.stringify({ error:"Slug and name required" }) };

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50);
    if (!cleanSlug) return { statusCode:400, headers, body: JSON.stringify({ error:"Invalid slug" }) };

    const fixedFallback = fixUrl(fallback) || `https://rewards.xhibitur.com/#/checkin/${cleanSlug}`;

    const fixedDestinations = (destinations||[])
      .map(d=>({ label:d.label||"", url:fixUrl(d.url), rules:(d.rules||[]).map(r=>({ type:r.type, condition:r.type==="time"?`${r.tf||"09:00"}-${r.tt||"17:00"}`:r.cond||"", from:r.tf||"", to:r.tt||"" })) }))
      .filter(d=>d.url);

    const kvValue = JSON.stringify({
      name,
      fallback: fixedFallback,
      destinations: fixedDestinations,
      rewardGoal: rewardGoal || 10,
      rewardName: rewardName || "Free item",
      programName: programName || "",
    });

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/${cleanSlug}`;

    const cfRes = await fetch(cfUrl, {
      method:"PUT",
      headers:{ "Authorization":`Bearer ${process.env.CF_API_TOKEN}`, "Content-Type":"text/plain" },
      body: kvValue,
    });

    if (!cfRes.ok) throw new Error(`Cloudflare KV error: ${cfRes.status}`);

    console.log(`Saved: ${cleanSlug} | Goal: ${rewardGoal} stamps | Reward: ${rewardName}`);

    return { statusCode:200, headers, body: JSON.stringify({ success:true, slug:cleanSlug, url:`https://${cleanSlug}.qr.xhibitur.com` }) };

  } catch(err) {
    console.log("save-qr-rules error:", err.message);
    return { statusCode:500, headers, body: JSON.stringify({ error:err.message }) };
  }
};
