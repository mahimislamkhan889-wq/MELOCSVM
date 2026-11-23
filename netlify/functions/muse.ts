import firebaseConfig from "../../src/firebase-applet-config.json";

const FIREBASE_PROJECT_ID = firebaseConfig.projectId || "gen-lang-client-0726884324";
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || "ai-studio-3718de38-6701-4bd2-af32-0e8da99c8c33";
const ADMIN_EMAILS = new Set(["mahimislamkhan889@gmail.com"]);
const ADMIN_PHONES = new Set(["+8801948481216"]);

const ALLOWED_MUSE_HOSTS = new Set([
  "api.meta.ai",
  "api.llama.com",
  "openrouter.ai",
  "api.orcarouter.ai",
  "api.openai.com",
  "api.together.xyz",
  "api.groq.com",
  "generativelanguage.googleapis.com",
]);

function loadFirebaseWebApiKey(): string {
  if (process.env.FIREBASE_WEB_API_KEY) {
    return process.env.FIREBASE_WEB_API_KEY.trim();
  }
  return (firebaseConfig.apiKey || "").trim();
}

function validateMuseBaseUrl(rawUrl: string): { ok: boolean; url?: string; error?: string } {
  const trimmed = (rawUrl || "https://api.meta.ai/v1").trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Invalid Muse AI endpoint URL format." };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Muse AI endpoint must use HTTPS." };
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return { ok: false, error: "Private or local network hosts are not allowed." };
  }
  if (!ALLOWED_MUSE_HOSTS.has(host)) {
    return {
      ok: false,
      error: `Host "${host}" is not on the approved Muse AI gateway list.`,
    };
  }
  return { ok: true, url: trimmed };
}

function sanitizeMuseModel(rawModel?: string): string {
  const m = (rawModel || "muse-spark-1.3").trim();
  if (/^[a-zA-Z0-9._:/-]{1,120}$/.test(m)) {
    return m;
  }
  return "muse-spark-1.3";
}

function maskKey(key: string): string {
  const clean = (key || "").trim();
  if (!clean) return "";
  if (clean.length <= 8) return "••••" + clean.slice(-2);
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

async function verifyAdminRequest(
  headers: Record<string, string | undefined>
): Promise<{ ok: boolean; email?: string; uid?: string; status?: number; error?: string }> {
  const authHeader = headers.authorization || headers.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Admin authentication required. Please sign in as Administrator." };
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 8192) {
    return { ok: false, status: 401, error: "Invalid authentication token." };
  }

  const firebaseApiKey = loadFirebaseWebApiKey();
  if (!firebaseApiKey) {
    return { ok: false, status: 500, error: "Server auth verification config unavailable." };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return { ok: false, status: 401, error: "Session expired or unauthorized. Please sign in again." };
    }
    const data: any = await resp.json();
    const user = data?.users?.[0];
    if (!user) {
      return { ok: false, status: 401, error: "Unable to verify user identity." };
    }
    const email = String(user.email || "").toLowerCase().trim();
    const phone = String(user.phoneNumber || "").trim();
    if (!ADMIN_EMAILS.has(email) && !ADMIN_PHONES.has(phone)) {
      return { ok: false, status: 403, error: "Forbidden: Administrator privileges required." };
    }
    return { ok: true, email: email || phone, uid: String(user.localId || "") };
  } catch {
    return { ok: false, status: 401, error: "Authentication verification failed. Please retry." };
  }
}

interface WarmMuseState {
  runtimeApiKey: string;
  signedOutOverride: boolean;
  enabled: boolean;
  accountName: string;
  accountEmail: string;
  model: string;
  baseUrl: string;
  fallbackToGemini: boolean;
  requestIntervalMs: number;
  customSystemDirective: string;
  connectedAt: string | null;
  hydratedFromFirestore: boolean;
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastRequestAt: string | null;
    lastModelUsed: string | null;
  };
}

const initialEnvKey = (process.env.MUSE_API_KEY || process.env.MODEL_API_KEY || "").trim();
const initialBase = validateMuseBaseUrl(process.env.MUSE_BASE_URL || "https://api.meta.ai/v1");

const warmState: WarmMuseState = {
  runtimeApiKey: "",
  signedOutOverride: false,
  enabled: Boolean(initialEnvKey),
  accountName: initialEnvKey ? "Muse AI Account" : "",
  accountEmail: "",
  model: sanitizeMuseModel(process.env.MUSE_MODEL || "muse-spark-1.3"),
  baseUrl: initialBase.ok && initialBase.url ? initialBase.url : "https://api.meta.ai/v1",
  fallbackToGemini: false,
  requestIntervalMs: 1200,
  customSystemDirective: "",
  connectedAt: initialEnvKey ? new Date().toISOString() : null,
  hydratedFromFirestore: false,
  stats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastRequestAt: null,
    lastModelUsed: null,
  },
};

async function hydrateNonSecretProfileFromFirestore() {
  if (warmState.hydratedFromFirestore) return;
  warmState.hydratedFromFirestore = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/system_config/muse_ai`;
    const resp = await fetch(docUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) return;
    const docData: any = await resp.json();
    const fields = docData?.fields;
    if (!fields) return;

    if (fields.accountEmail?.stringValue && !warmState.accountEmail) {
      warmState.accountEmail = fields.accountEmail.stringValue.slice(0, 160);
    }
    if (fields.accountName?.stringValue && (!warmState.accountName || warmState.accountName === "Muse AI Account")) {
      warmState.accountName = fields.accountName.stringValue.slice(0, 120);
    }
    if (fields.model?.stringValue) {
      warmState.model = sanitizeMuseModel(fields.model.stringValue);
    }
    if (fields.baseUrl?.stringValue) {
      const check = validateMuseBaseUrl(fields.baseUrl.stringValue);
      if (check.ok && check.url) {
        warmState.baseUrl = check.url;
      }
    }
  } catch {
    // optional non-secret metadata sync
  }
}

function getEffectiveKey(): { key: string; source: "admin_session" | "server_env" | "none" } {
  if (warmState.signedOutOverride) {
    return { key: "", source: "none" };
  }
  if (warmState.runtimeApiKey.trim()) {
    return { key: warmState.runtimeApiKey.trim(), source: "admin_session" };
  }
  const envKey = (process.env.MUSE_API_KEY || process.env.MODEL_API_KEY || "").trim();
  if (envKey) {
    return { key: envKey, source: "server_env" };
  }
  return { key: "", source: "none" };
}

function getSanitizedStatus() {
  const { key, source } = getEffectiveKey();
  const hasApiKey = Boolean(key);
  return {
    enabled: warmState.enabled && hasApiKey,
    routingToggleOn: warmState.enabled,
    connected: hasApiKey,
    hasApiKey,
    keySource: source,
    keyHint: maskKey(key),
    accountName: warmState.accountName,
    accountEmail: warmState.accountEmail,
    model: warmState.model,
    baseUrl: warmState.baseUrl,
    fallbackToGemini: warmState.fallbackToGemini,
    requestIntervalMs: warmState.requestIntervalMs,
    customSystemDirective: warmState.customSystemDirective,
    connectedAt: warmState.connectedAt,
    isServerless: true,
    stats: { ...warmState.stats },
  };
}

async function callMuseChatCompletions(params: {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemInstruction?: string;
  userPrompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxTokens?: number;
  requireJson?: boolean;
}): Promise<{ text: string; model: string; usage?: any }> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const messages: any[] = [];
  if (params.systemInstruction && params.systemInstruction.trim()) {
    messages.push({ role: "system", content: params.systemInstruction.trim() });
  }

  if (params.imageBase64 && params.imageBase64.trim()) {
    const allowedMimes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
    const safeMime = allowedMimes.has((params.imageMimeType || "").toLowerCase())
      ? params.imageMimeType!.toLowerCase()
      : "image/jpeg";
    const cleanBase64 = params.imageBase64.includes(",")
      ? params.imageBase64.split(",")[1]
      : params.imageBase64;
    messages.push({
      role: "user",
      content: [
        { type: "text", text: params.userPrompt },
        { type: "image_url", image_url: { url: `data:${safeMime};base64,${cleanBase64}` } },
      ],
    });
  } else {
    messages.push({ role: "user", content: params.userPrompt });
  }

  const doRequest = async (useJsonFormat: boolean) => {
    const reqBody: Record<string, any> = {
      model: params.model,
      messages,
      temperature: typeof params.temperature === "number" ? Math.max(0, Math.min(params.temperature, 1.5)) : 0.35,
      max_tokens: typeof params.maxTokens === "number" ? Math.max(64, Math.min(params.maxTokens, 8192)) : 4096,
    };
    if (useJsonFormat) {
      reqBody.response_format = { type: "json_object" };
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 24000);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${params.apiKey}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(reqBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return resp;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  let resp = await doRequest(Boolean(params.requireJson));
  if (resp.status === 400 && params.requireJson) {
    const errTxt = await resp.text().catch(() => "");
    if (errTxt.toLowerCase().includes("response_format") || errTxt.toLowerCase().includes("json_object")) {
      resp = await doRequest(false);
    } else {
      let msg = errTxt || "Muse AI rejected the request (400).";
      try {
        const parsed = JSON.parse(errTxt);
        msg = parsed?.error?.message || parsed?.message || msg;
      } catch {}
      const e: any = new Error(msg);
      e.status = 400;
      throw e;
    }
  }

  if (!resp.ok) {
    const errTxt = await resp.text().catch(() => "");
    let msg = `Muse AI error (HTTP ${resp.status})`;
    try {
      const parsed = JSON.parse(errTxt);
      msg = parsed?.error?.message || parsed?.message || msg;
    } catch {}
    const e: any = new Error(msg);
    e.status = resp.status;
    throw e;
  }

  const data: any = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((p: any) => (typeof p === "string" ? p : p?.text || "")).join("")
      : "";

  return {
    text: text || "{}",
    model: data?.model || params.model,
    usage: data?.usage,
  };
}

function extractSubRoute(rawPath: string): string {
  const clean = (rawPath || "").replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);
  return (parts[parts.length - 1] || "").toLowerCase();
}

export async function handler(event: any) {
  const jsonHeaders = {
    "Content-Type": "application/json",
    "Vary": "Origin",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }

  await hydrateNonSecretProfileFromFirestore();

  const route = extractSubRoute(event.path || "");

  // 1. GET /api/muse/status
  if (route === "status" || event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        success: true,
        ...getSanitizedStatus(),
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let body: any = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  // 2. POST /api/muse/verify (Admin only)
  if (route === "verify") {
    const authCheck = await verifyAdminRequest(event.headers || {});
    if (!authCheck.ok) {
      return {
        statusCode: authCheck.status || 401,
        headers: jsonHeaders,
        body: JSON.stringify({ success: false, error: authCheck.error || "Unauthorized" }),
      };
    }

    try {
      const keyToTest = (typeof body.apiKey === "string" && body.apiKey.trim())
        ? body.apiKey.trim()
        : getEffectiveKey().key;
      if (!keyToTest) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ success: false, error: "Please enter your Muse AI access token to verify." }),
        };
      }
      const urlCheck = validateMuseBaseUrl(typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl : warmState.baseUrl);
      if (!urlCheck.ok || !urlCheck.url) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ success: false, error: urlCheck.error || "Invalid endpoint URL." }),
        };
      }
      const targetModel = sanitizeMuseModel(typeof body.model === "string" ? body.model : warmState.model);
      const startMs = Date.now();
      const result = await callMuseChatCompletions({
        apiKey: keyToTest,
        baseUrl: urlCheck.url,
        model: targetModel,
        systemInstruction: "You are Muse AI connected to the Melo app. Reply briefly.",
        userPrompt: "Reply OK",
        temperature: 0,
        maxTokens: 20,
        requireJson: false,
      });
      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: true,
          model: result.model,
          latencyMs: Date.now() - startMs,
          reply: result.text.slice(0, 120),
        }),
      };
    } catch (err: any) {
      const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
      return {
        statusCode: status,
        headers: jsonHeaders,
        body: JSON.stringify({ success: false, error: err?.message || "Failed to connect to Muse AI." }),
      };
    }
  }

  // 3. POST /api/muse/config (Admin only)
  if (route === "config") {
    const authCheck = await verifyAdminRequest(event.headers || {});
    if (!authCheck.ok) {
      return {
        statusCode: authCheck.status || 401,
        headers: jsonHeaders,
        body: JSON.stringify({ success: false, error: authCheck.error || "Unauthorized" }),
      };
    }

    try {
      if (body.action === "disconnect") {
        warmState.runtimeApiKey = "";
        warmState.signedOutOverride = true;
        warmState.enabled = false;
        warmState.accountName = "";
        warmState.accountEmail = "";
        warmState.connectedAt = null;
        return {
          statusCode: 200,
          headers: jsonHeaders,
          body: JSON.stringify({
            success: true,
            status: getSanitizedStatus(),
          }),
        };
      }

      const urlCheck = validateMuseBaseUrl(
        typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl : warmState.baseUrl
      );
      if (!urlCheck.ok || !urlCheck.url) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ success: false, error: urlCheck.error || "Invalid Muse AI endpoint URL." }),
        };
      }

      const nextModel = sanitizeMuseModel(typeof body.model === "string" && body.model.trim() ? body.model : warmState.model);
      const providedKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
      const envKey = (process.env.MUSE_API_KEY || process.env.MODEL_API_KEY || "").trim();
      const effectiveKey = providedKey || warmState.runtimeApiKey || envKey;

      if (!effectiveKey) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ success: false, error: "Muse AI access token is required to sign in." }),
        };
      }

      let verifiedLatencyMs: number | undefined;
      if (body.verifyFirst) {
        const startMs = Date.now();
        await callMuseChatCompletions({
          apiKey: effectiveKey,
          baseUrl: urlCheck.url,
          model: nextModel,
          systemInstruction: "You are Muse AI connected to the Melo app.",
          userPrompt: "Reply OK",
          temperature: 0,
          maxTokens: 20,
          requireJson: false,
        });
        verifiedLatencyMs = Date.now() - startMs;
      }

      warmState.signedOutOverride = false;
      if (providedKey) {
        warmState.runtimeApiKey = providedKey;
      }
      if (typeof body.accountName === "string") {
        warmState.accountName = body.accountName.trim().slice(0, 120);
      }
      if (typeof body.accountEmail === "string") {
        warmState.accountEmail = body.accountEmail.trim().slice(0, 160);
      }
      warmState.baseUrl = urlCheck.url;
      warmState.model = nextModel;
      warmState.enabled = true;
      warmState.fallbackToGemini = false;
      warmState.connectedAt = new Date().toISOString();

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: true,
          verifiedLatencyMs,
          status: getSanitizedStatus(),
        }),
      };
    } catch (err: any) {
      const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
      return {
        statusCode: status,
        headers: jsonHeaders,
        body: JSON.stringify({ success: false, error: err?.message || "Failed to sign in to Muse AI." }),
      };
    }
  }

  // 4. POST /api/muse/generate (Primary background execution for all user uploads)
  if (route === "generate") {
    const startMs = Date.now();
    try {
      const { key: activeKey } = getEffectiveKey();
      if (!activeKey || !warmState.enabled) {
        return {
          statusCode: 503,
          headers: jsonHeaders,
          body: JSON.stringify({
            error: "Muse AI account is not signed in on Netlify yet. Sign in via Admin Control Center or add MUSE_API_KEY in Netlify Environment Variables.",
          }),
        };
      }

      const { systemInstruction, userPrompt, imageBase64, imageMimeType, temperature, maxTokens } = body;
      if (typeof userPrompt !== "string" || !userPrompt.trim()) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: "A valid command prompt is required." }),
        };
      }

      warmState.stats.totalRequests += 1;
      const result = await callMuseChatCompletions({
        apiKey: activeKey,
        baseUrl: warmState.baseUrl,
        model: warmState.model,
        systemInstruction: typeof systemInstruction === "string" ? systemInstruction.trim() : "",
        userPrompt: userPrompt.trim(),
        imageBase64: typeof imageBase64 === "string" ? imageBase64 : undefined,
        imageMimeType: typeof imageMimeType === "string" ? imageMimeType : undefined,
        temperature: typeof temperature === "number" ? temperature : 0.35,
        maxTokens: typeof maxTokens === "number" ? maxTokens : 4096,
        requireJson: true,
      });

      warmState.stats.successfulRequests += 1;
      warmState.stats.lastRequestAt = new Date().toISOString();
      warmState.stats.lastModelUsed = result.model;

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          success: true,
          text: result.text,
          model: result.model,
          provider: "muse",
          latencyMs: Date.now() - startMs,
        }),
      };
    } catch (err: any) {
      warmState.stats.failedRequests += 1;
      const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
      return {
        statusCode: status,
        headers: jsonHeaders,
        body: JSON.stringify({ error: err?.message || "Muse AI execution failed. Please retry." }),
      };
    }
  }

  return {
    statusCode: 404,
    headers: jsonHeaders,
    body: JSON.stringify({ error: "Unknown Muse AI endpoint." }),
  };
}
