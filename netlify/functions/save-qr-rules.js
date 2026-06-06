// netlify/functions/save-qr-rules.js
// Saves a customer's QR routing rules to Cloudflare KV
// Called automatically when a user creates or updates a QR code in the dashboard

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { slug, name, destinations, fallback } = JSON.parse(event.body);

    // Validate required fields
    if (!slug || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Slug and name are required" }),
      };
    }

    // Sanitize slug — lowercase, dashes only, max 50 chars
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    if (!cleanSlug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid slug — use letters and numbers only" }),
      };
    }

    // Build the KV value
    const kvValue = JSON.stringify({
      name,
      fallback: fallback || "https://rewards.xhibitur.com",
      destinations: (destinations || []).map(d => ({
        label: d.label || "",
        url: d.url || "",
        rules: (d.rules || []).map(r => ({
          type: r.type,
          condition: r.type === "time"
            ? `${r.tf || "09:00"}-${r.tt || "17:00"}`
            : r.cond || "",
          from: r.tf || "",
          to: r.tt || "",
        }))
      }))
    });

    // Save to Cloudflare KV
    const cfAccountId    = process.env.CF_ACCOUNT_ID;
    const cfApiToken     = process.env.CF_API_TOKEN;
    const cfKvNamespace  = process.env.CF_KV_NAMESPACE_ID;

    if (!cfAccountId || !cfApiToken || !cfKvNamespace) {
      throw new Error("Missing Cloudflare environment variables");
    }

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/storage/kv/namespaces/${cfKvNamespace}/values/${cleanSlug}`;

    const cfRes = await fetch(cfUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${cfApiToken}`,
        "Content-Type": "text/plain",
      },
      body: kvValue,
    });

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      console.log("Cloudflare KV error:", errText);
      throw new Error(`Cloudflare KV error: ${cfRes.status}`);
    }

    const qrUrl = `https://${cleanSlug}.qr.xhibitur.com`;

    console.log(`QR rules saved for ${cleanSlug} → ${qrUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        slug: cleanSlug,
        url: qrUrl,
      }),
    };

  } catch (err) {
    console.log("save-qr-rules error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
