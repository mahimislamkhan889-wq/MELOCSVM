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
    const clientKeys = (customApiKey || "")
      .split(/[\n,;]+/)
      .map((k: string) => k.trim())
      .filter(Boolean);

    const serverKeys = (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || "")
      .split(/[\n,;]+/)
      .map((k: string) => k.trim())
      .filter(Boolean);

    const keysToTry = Array.from(new Set([...clientKeys, ...serverKeys]));

    if (keysToTry.length === 0) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Gemini API Key is not configured on Netlify environment variables." })
      };
    }

    let targetModel = model || "gemini-3.8-flash";
    if (!targetModel || targetModel.includes("2.0-flash") || targetModel === "gemini-2.5-flash" || !targetModel.startsWith("gemini-")) {
      targetModel = "gemini-3.8-flash";
    }

    const candidateModels = [targetModel, "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
      .filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

    let response: any = null;
    let lastGenErr: any = null;

    for (const currentKey of keysToTry) {
      const genAI = new GoogleGenAI({
        apiKey: currentKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      for (const modelCandidate of candidateModels) {
        try {
          const modelConfig: any = {
            systemInstruction: config?.systemInstruction,
            responseMimeType: config?.responseMimeType || "application/json",
            maxOutputTokens: typeof config?.maxOutputTokens === "number" ? Math.min(config.maxOutputTokens, 8192) : 4096,
          };

          if (modelCandidate.includes("3.8-flash") || modelCandidate.includes("flash-lite")) {
            modelConfig.thinkingConfig = { thinkingLevel: "LOW" };
          }

          response = await genAI.models.generateContent({
            model: modelCandidate,
            contents,
            config: modelConfig
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastGenErr = err;
          console.warn(`Netlify model ${modelCandidate} failed (${err?.status || err?.message?.slice(0, 80)}).`);
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
    const errorMessage = error?.message || String(error || "");
    const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

    if (!isQuotaError) {
      console.error("Gemini Proxy Error:", error);
    }

    const isApiKeyError = errorMessage.includes("API key not valid") || 
                          errorMessage.includes("API_KEY_INVALID") || 
                          errorMessage.includes("403") ||
                          errorMessage.includes("PERMISSION_DENIED");

    if (isApiKeyError) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid or missing Gemini API Key. Please verify your GEMINI_API_KEY in Netlify Site configuration > Environment variables, or click 'Configure API Key' in the app." })
      };
    }

    if (isQuotaError) {
      return {
        statusCode: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Gemini API Quota Exceeded (429). Please wait a moment or click 'Configure API Key' to use your own API key." })
      };
    }

    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: errorMessage || "Generation failed. Please try again." })
    };
  }
}
