import { GoogleGenAI } from "@google/genai";

export async function handler(event: any, context: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed. Please use POST." })
    };
  }

  try {
    const { model, contents, config, customApiKey } = JSON.parse(event.body || "{}");
    const clientKey = (customApiKey || "").trim();
    const serverKey = (process.env.GEMINI_API_KEY || "").trim();
    const keysToTry = [clientKey, serverKey].filter((k, idx, arr) => Boolean(k) && arr.indexOf(k) === idx) as string[];

    if (keysToTry.length === 0) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Gemini API Key is not configured on Netlify environment variables." })
      };
    }

    let targetModel = model || "gemini-3.1-flash-lite";
    if (!targetModel || targetModel === "gemini-2.5-flash" || targetModel.includes("2.0-flash") || !targetModel.startsWith("gemini-")) {
      targetModel = "gemini-3.1-flash-lite";
    }

    const candidateModels = [targetModel, "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
      .filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let response: any = null;
    let lastGenErr: any = null;

    for (const currentKey of keysToTry) {
      const genAI = new GoogleGenAI({
        apiKey: currentKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      for (const modelCandidate of candidateModels) {
        try {
          response = await genAI.models.generateContent({
            model: modelCandidate,
            contents,
            config: {
              ...config,
              systemInstruction: config?.systemInstruction
            }
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastGenErr = err;
          console.warn(`Netlify model ${modelCandidate} failed (${err?.status || err?.message?.slice(0, 80)}). Trying fallback...`);
        }
      }
      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastGenErr || new Error("All Gemini models are temporarily busy. Please retry.");
    }

    const text = response.text || '{}';
    return {
      statusCode: 200,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    };
  } catch (error: any) {
    const errorMessage = error.message || "";
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

    if (!isQuotaError) {
      console.error("Gemini Proxy Error:", error);
    }

    if (errorMessage.includes("API key not valid") || errorMessage.includes("400")) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid Gemini API Key. Please check your settings and try again." })
      };
    }

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return {
        statusCode: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "API Quota Exceeded. Please try again in 1 minute, or use a different API key." })
      };
    }

    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: errorMessage || "Internal Server Error" })
    };
  }
}
