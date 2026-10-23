export async function handler(event: any, context: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed." })
    };
  }

  try {
    let token = "";
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        token = parsed.token || "";
      } catch {}
    }
    
    // Check query string if GET or token wasn't in body
    if (!token && event.queryStringParameters?.token) {
      token = event.queryStringParameters.token;
    }

    // Check Netlify environment variables
    if (!token) {
      token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || process.env.VITE_APIFY_API_TOKEN || process.env.VITE_APIFY_TOKEN || "";
    }

    if (!token || typeof token !== "string" || !token.trim()) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Apify API token is required. Please provide a token or configure APIFY_API_TOKEN in Netlify Environment Variables." })
      };
    }

    const cleanToken = token.trim();
    // Use AbortSignal for 10-second timeout to prevent hanging on Netlify
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apifyUrl = `https://api.apify.com/v2/users/me?token=${encodeURIComponent(cleanToken)}`;
    const apifyResp = await fetch(apifyUrl, {
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${cleanToken}`,
        "Accept": "application/json"
      }
    });
    clearTimeout(timeoutId);

    if (!apifyResp.ok) {
      const errJson = await apifyResp.json().catch(() => ({}));
      return {
        statusCode: apifyResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          error: (errJson as any)?.error?.message || `Apify verification failed (${apifyResp.status})`
        })
      };
    }

    const apifyData: any = await apifyResp.json();
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        user: {
          id: apifyData?.data?.id,
          username: apifyData?.data?.username || "Apify User",
          email: apifyData?.data?.email,
          plan: apifyData?.data?.plan?.name || "Active"
        }
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error?.message || "Failed to contact Apify API" })
    };
  }
}
