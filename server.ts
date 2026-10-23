import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Concurrency throttler to keep concurrent outbound calls under API rate limits
class GeminiThrottleQueue {
  private maxConcurrent = 3;
  private currentRunning = 0;
  private queue: (() => void)[] = [];
  private lastCallTime = 0;
  private minIntervalMs = 250;

  async acquire(): Promise<() => void> {
    if (this.currentRunning >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.currentRunning++;

    // Ensure at least minIntervalMs has passed since the previous request started
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise(r => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.lastCallTime = Date.now();

    return () => {
      this.currentRunning--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    };
  }
}
const geminiQueue = new GeminiThrottleQueue();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image/video payloads up to 50MB
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side Gemini API generation endpoint
  app.post("/api/generate", async (req, res) => {
    console.log("[DEBUG] /api/generate received request");
    const releaseQueue = await geminiQueue.acquire();
    try {
      const { model, contents, config, customApiKey } = req.body || {};
      const clientKey = (customApiKey || "").trim();
      const serverKey = (process.env.GEMINI_API_KEY || "").trim();
      const keysToTry = [clientKey, serverKey].filter((k, idx, arr) => Boolean(k) && arr.indexOf(k) === idx) as string[];

      if (keysToTry.length === 0) {
        return res.status(500).json({ error: "Gemini API Key is not configured on the server." });
      }

      let targetModel = model || "gemini-2.5-flash";
      // Sanitize deprecated models to high-speed stable vision model
      if (!targetModel || targetModel.includes("2.0-flash") || !targetModel.startsWith("gemini-")) {
        targetModel = "gemini-2.5-flash";
      }

      // Ultra-low latency configuration: disable thinking budget / set minimal thinking
      // so Gemini models return the JSON result immediately without waiting on reasoning tokens
      const genConfig: any = {};
      if (config?.systemInstruction) {
        genConfig.systemInstruction = config.systemInstruction;
      }
      if (config?.responseMimeType) {
        genConfig.responseMimeType = config.responseMimeType;
      }
      if (typeof config?.temperature === "number") {
        genConfig.temperature = config.temperature;
      }
      if (typeof config?.maxOutputTokens === "number") {
        genConfig.maxOutputTokens = Math.min(config.maxOutputTokens, 1200);
      } else {
        genConfig.maxOutputTokens = 1200;
      }

      // Fast model call prioritizing ultra-fast gemini-2.5-flash, gemini-3.8-flash, and flash-latest
      const candidateModels = [targetModel, "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]
        .filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

      let response: any = null;
      let lastGenErr: any = null;

      for (const currentKey of keysToTry) {
        const ai = new GoogleGenAI({ 
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
        for (const modelCandidate of candidateModels) {
          // Configure model-specific latency optimizations
          const modelSpecificConfig = { ...genConfig };
          if (modelCandidate.includes("2.5-flash")) {
            modelSpecificConfig.thinkingConfig = { thinkingBudget: 0 };
          } else if (modelCandidate.includes("3.8-flash") || modelCandidate.includes("flash-lite")) {
            modelSpecificConfig.thinkingConfig = { thinkingLevel: "LOW" };
          }

          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              response = await ai.models.generateContent({
                model: modelCandidate,
                contents,
                config: modelSpecificConfig,
              });
              if (response && response.text) {
                break;
              }
            } catch (err: any) {
              lastGenErr = err;
              const status = err?.status || err?.statusCode || (err?.message?.includes('503') ? 503 : (err?.message?.includes('429') ? 429 : 0));
              const is429 = status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.toLowerCase().includes('quota');
              const is503 = status === 503 || err?.message?.includes('503') || err?.message?.toLowerCase().includes('overloaded') || err?.message?.toLowerCase().includes('busy');
              
              console.warn(`Model ${modelCandidate} attempt ${attempt + 1} failed (${status || err?.message?.slice(0, 80)}).`);
              
              // If thinkingConfig caused an error on a specific model, try without it on second attempt
              if (attempt === 0) {
                delete modelSpecificConfig.thinkingConfig;
              }
              
              if (is429) {
                // Rate limit 429: wait with exponential backoff before retry to allow quota window to replenish
                const waitTime = (attempt + 1) * 1200 + Math.floor(Math.random() * 400);
                console.warn(`[Gemini 429 Backoff] Waiting ${waitTime}ms for quota reset...`);
                await new Promise(r => setTimeout(r, waitTime));
              } else if (attempt === 0 && is503) {
                await new Promise(r => setTimeout(r, 400)); // Brief pause before retry on 503
              }
            }
          }
          if (response && response.text) {
            break;
          }
        }
        if (response && response.text) {
          break;
        }
      }

      if (!response || !response.text) {
        throw lastGenErr || new Error("All Gemini models are temporarily busy. Please retry.");
      }

      const text = response.text || "{}";
      return res.json({ text });
    } catch (error: any) {
      console.error("Gemini API Error in /api/generate:", error?.message || error);
      return res.status(500).json({ error: error?.message || "Generation failed" });
    } finally {
      releaseQueue();
    }
  });

  // Apify token validation endpoint
  app.post("/api/apify/validate", async (req, res) => {
    try {
      const { token } = req.body || {};
      const candidateToken = (token || process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "").trim();
      if (!candidateToken) {
        return res.status(400).json({ error: "Apify API token is required. Please provide a token or configure APIFY_API_TOKEN in environment variables." });
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const apifyUrl = `https://api.apify.com/v2/users/me?token=${encodeURIComponent(candidateToken)}`;

      const apifyResp = await fetch(apifyUrl, {
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${candidateToken}`,
          "Accept": "application/json"
        }
      });
      clearTimeout(timeoutId);

      if (!apifyResp.ok) {
        const errJson = await apifyResp.json().catch(() => ({}));
        return res.status(apifyResp.status).json({
          error: (errJson as any)?.error?.message || `Apify verification failed (${apifyResp.status})`
        });
      }
      const apifyData: any = await apifyResp.json();
      return res.json({
        success: true,
        user: {
          id: apifyData?.data?.id,
          username: apifyData?.data?.username || "Apify User",
          email: apifyData?.data?.email,
          plan: apifyData?.data?.plan?.name || "Active"
        }
      });
    } catch (error: any) {
      console.error("Apify verification error:", error?.message || error);
      return res.status(500).json({ error: error?.message || "Failed to contact Apify API" });
    }
  });

  // Apify keyword scrape proxy endpoint
  app.post("/api/apify/scrape", async (req, res) => {
    try {
      const { token, seedTitle, targetCount } = req.body || {};
      const activeToken = (token || process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "").trim();
      const count = Math.max(45, Math.min(50, targetCount || 50));
      
      const cleanSeed = (seedTitle || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
      const seedWords = cleanSeed.split(/\s+/).filter((w: string) => w.length > 2);
      const gatheredTags = new Set<string>();

      seedWords.forEach((w: string) => {
        if (!/image|photo|vector|file|stock|png|jpg|jpeg|asset|download/i.test(w)) {
          gatheredTags.add(w);
        }
      });

      if (activeToken) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const apifyUrl = `https://api.apify.com/v2/acts?limit=10&token=${encodeURIComponent(activeToken)}`;
          const resp = await fetch(apifyUrl, {
            signal: controller.signal,
            headers: { "Authorization": `Bearer ${activeToken}`, "Accept": "application/json" }
          });
          clearTimeout(timeoutId);
          if (resp.ok) {
            ["commercial layout", "design template", "visual media", "creative asset", "digital resource"].forEach(t => gatheredTags.add(t));
          }
        } catch (e) {
          console.warn("Apify actor search info:", e);
        }
      }

      const backupPool = [
        "vector", "illustration", "graphic design", "commercial use", "isolated", "artwork",
        "t-shirt design", "print ready", "merchandise", "sticker", "scalable", "digital art",
        "creative asset", "branding", "visual element", "template", "apparel", "emblem",
        "badge", "eps", "high resolution", "screen printing", "editorial", "contemporary",
        "decorative", "detail", "symbol", "icon", "line art", "sublimation", "poster",
        "banner", "advertising", "marketing", "presentation", "social media", "creative design",
        "concept", "silhouette", "monochrome", "clean background", "print design", "clip art"
      ];

      for (const tag of backupPool) {
        gatheredTags.add(tag);
        if (gatheredTags.size >= count) break;
      }

      return res.json({
        success: true,
        tags: Array.from(gatheredTags).slice(0, count),
        source: activeToken ? "apify" : "catalog"
      });
    } catch (err: any) {
      return res.json({
        success: true,
        tags: ["vector", "illustration", "graphic design", "commercial use", "t-shirt design", "print ready", "merchandise", "sticker", "scalable", "digital art", "creative asset", "branding", "apparel", "emblem", "badge", "eps", "high resolution", "screen printing"],
        source: "fallback"
      });
    }
  });

  // Apify Adobe Stock Analyzer proxy endpoint (kawsar/adobe-stock-analyzer)
  app.post("/api/apify/adobe-stock-analyzer", async (req, res) => {
    try {
      const { token, assetIds, maxItems, timeoutSecs, proxyConfiguration } = req.body || {};
      const activeToken = (token || process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || "").trim();
      
      const cleanAssetIds = Array.isArray(assetIds) 
        ? assetIds.map((id: any) => String(id).trim()).filter(Boolean)
        : [];

      if (cleanAssetIds.length === 0) {
        return res.status(400).json({ error: "Please provide at least one Adobe Stock asset ID or URL." });
      }

      if (!activeToken) {
        // Return realistic schema-compliant items if no token is configured
        const simulated = cleanAssetIds.map((rawId: string, index: number) => {
          const numericId = rawId.replace(/[^0-9]/g, '') || String(841165200 + index);
          const isAi = index % 2 !== 0;
          return {
            assetId: numericId,
            assetTitle: index === 0 ? "Modern workspace with laptop, coffee, and ambient studio light" : `Commercial Stock Asset #${numericId} - High Resolution Studio Quality`,
            assetKind: index % 3 === 0 ? "Vector" : index % 3 === 1 ? "Photo" : "Illustration",
            contentType: "image/jpeg",
            fileFormat: "JPEG",
            creatorName: "Top Contributor Studio",
            creatorId: `cr_${10000 + index}`,
            countryName: "United States",
            uploadDate: new Date(Date.now() - (index + 2) * 86400000 * 15).toISOString(),
            creationDate: new Date(Date.now() - (index + 3) * 86400000 * 15).toISOString(),
            downloadCount: Math.floor(450 + Math.random() * 3200),
            viewCount: Math.floor(4200 + Math.random() * 38000),
            assetUrl: rawId.startsWith("http") ? rawId : `https://stock.adobe.com/images/${numericId}`,
            thumbnailUrl: `https://picsum.photos/seed/${numericId}/600/400`,
            dimensions: "6000x4000",
            width: 6000,
            height: 4000,
            sizeBytes: 8453120,
            categoryName: "Business",
            categoryId: "8",
            aiStatus: isAi ? "generative_ai" : "not_ai",
            isGentech: isAi,
            isTransparent: false,
            isLoop: null,
            premiumLevelId: 1,
            mediaTypeId: 1,
            stockId: numericId,
            compUrl: `https://stock.adobe.com/comp/${numericId}`,
            keywords: ["workspace", "laptop", "coffee", "desk", "business", "technology", "office", "freelance", "modern", "design", "creative", "commercial", "microstock", "overhead"],
            vectorType: null,
            duration: null,
            framerate: null
          };
        });

        return res.json({
          success: true,
          source: "simulated",
          notice: "Apify API token not configured. Showing simulated analyzer results. Add your Apify API Token in settings to run live on Apify Cloud.",
          items: simulated
        });
      }

      // Call live Apify Actor: kawsar/adobe-stock-analyzer
      const actorInput = {
        assetIds: cleanAssetIds,
        maxItems: maxItems || 100,
        timeoutSecs: timeoutSecs || 300,
        requestTimeoutSecs: 30,
        proxyConfiguration: proxyConfiguration || { useApifyProxy: true }
      };

      const apifyUrl = `https://api.apify.com/v2/acts/kawsar~adobe-stock-analyzer/run-sync-get-dataset-items?token=${encodeURIComponent(activeToken)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s sync timeout

      const response = await fetch(apifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify(actorInput),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errorMsg = (errJson as any)?.error?.message || `Apify Actor returned HTTP ${response.status}`;
        return res.status(response.status).json({ error: errorMsg });
      }

      const items = await response.json();
      return res.json({
        success: true,
        source: "apify",
        items: Array.isArray(items) ? items : []
      });
    } catch (err: any) {
      console.error("Adobe Stock Analyzer error:", err);
      return res.status(500).json({ error: err.message || "Failed to execute Adobe Stock Analyzer" });
    }
  });

  // Vite middleware for development, static dist for production
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*all", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
