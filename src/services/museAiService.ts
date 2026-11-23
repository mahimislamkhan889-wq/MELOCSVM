/**
 * Muse AI Engine Service
 * Manages Admin Muse AI Account authentication (via server-side credential vault),
 * non-secret Firestore routing metadata sync, and primary execution of all user file tasks.
 */

import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface MuseModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export const MUSE_AI_MODELS: MuseModelOption[] = [
  {
    id: 'muse-spark-1.3',
    name: 'Muse Spark 1.3',
    badge: 'Recommended',
    description: 'Flagship multimodal vision & SEO reasoning (1M context)',
  },
  {
    id: 'muse-spark-1.3-contributor',
    name: 'Muse Spark 1.3 Contributor',
    badge: 'High Volume',
    description: 'Discounted high-throughput tier for large stock batches',
  },
  {
    id: 'muse-wonder-1.0',
    name: 'Muse Wonder 1.0',
    badge: 'Deep Agent',
    description: 'Maximum precision for complex forensic Image-to-Prompt tasks',
  },
  {
    id: 'muse-spark-1.2',
    name: 'Muse Spark 1.2',
    badge: 'Stable',
    description: 'Previous stable generation multimodal model',
  },
];

export const MUSE_GATEWAY_PRESETS = [
  {
    id: 'meta',
    label: 'Meta Model API (Official)',
    url: 'https://api.meta.ai/v1',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter Gateway',
    url: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'orcarouter',
    label: 'OrcaRouter Gateway',
    url: 'https://api.orcarouter.ai/v1',
  },
];

export interface MuseEngineStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastRequestAt: string | null;
  lastModelUsed: string | null;
}

export interface MuseEngineStatus {
  enabled: boolean;
  routingToggleOn: boolean;
  connected: boolean;
  hasApiKey: boolean;
  keySource: 'admin_session' | 'server_env' | 'none';
  keyHint: string;
  accountName: string;
  accountEmail: string;
  model: string;
  baseUrl: string;
  fallbackToGemini: boolean;
  requestIntervalMs: number;
  customSystemDirective: string;
  connectedAt: string | null;
  isServerless?: boolean;
  stats: MuseEngineStats;
}

const DEFAULT_MUSE_STATUS: MuseEngineStatus = {
  enabled: false,
  routingToggleOn: false,
  connected: false,
  hasApiKey: false,
  keySource: 'none',
  keyHint: '',
  accountName: '',
  accountEmail: '',
  model: 'muse-spark-1.3',
  baseUrl: 'https://api.meta.ai/v1',
  fallbackToGemini: false,
  requestIntervalMs: 1200,
  customSystemDirective: '',
  connectedAt: null,
  stats: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastRequestAt: null,
    lastModelUsed: null,
  },
};

let cachedMuseStatus: MuseEngineStatus = { ...DEFAULT_MUSE_STATUS };
let lastStatusFetchTs = 0;
const statusListeners = new Set<(status: MuseEngineStatus) => void>();

function updateCachedStatus(next: MuseEngineStatus) {
  cachedMuseStatus = next;
  lastStatusFetchTs = Date.now();
  statusListeners.forEach((listener) => {
    try {
      listener(next);
    } catch {}
  });
}

export function subscribeMuseStatus(listener: (status: MuseEngineStatus) => void): () => void {
  statusListeners.add(listener);
  listener(cachedMuseStatus);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getCachedMuseStatus(): MuseEngineStatus {
  return cachedMuseStatus;
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('Could not fetch Firebase auth token:', err);
  }
  return headers;
}

/**
 * Fetches sanitized Muse AI Engine status from the server and merges non-secret
 * profile metadata from Firestore (system_config/muse_ai).
 */
export async function fetchMuseStatus(forceRefresh = false): Promise<MuseEngineStatus> {
  if (!forceRefresh && lastStatusFetchTs > 0 && Date.now() - lastStatusFetchTs < 5000) {
    return cachedMuseStatus;
  }

  let serverData: Partial<MuseEngineStatus> | null = null;
  try {
    const resp = await fetch('/api/muse/status', { method: 'GET' });
    if (resp.ok) {
      const json = await resp.json();
      serverData = json;
    }
  } catch (err) {
    console.warn('Muse AI server status check notice:', err);
  }

  let firestoreMeta: Record<string, any> | null = null;
  try {
    const snap = await getDoc(doc(db, 'system_config', 'muse_ai'));
    if (snap.exists()) {
      firestoreMeta = snap.data();
    }
  } catch {
    // Firestore optional fallback
  }

  const merged: MuseEngineStatus = {
    ...DEFAULT_MUSE_STATUS,
    ...(serverData || {}),
    accountName: serverData?.accountName || firestoreMeta?.accountName || '',
    accountEmail: serverData?.accountEmail || firestoreMeta?.accountEmail || '',
    model: serverData?.model || firestoreMeta?.model || 'muse-spark-1.3',
    baseUrl: serverData?.baseUrl || firestoreMeta?.baseUrl || 'https://api.meta.ai/v1',
    customSystemDirective:
      typeof serverData?.customSystemDirective === 'string' && serverData.customSystemDirective.length > 0
        ? serverData.customSystemDirective
        : (firestoreMeta?.customSystemDirective || ''),
    fallbackToGemini:
      typeof serverData?.fallbackToGemini === 'boolean'
        ? serverData.fallbackToGemini
        : Boolean(firestoreMeta?.fallbackToGemini),
    requestIntervalMs:
      typeof serverData?.requestIntervalMs === 'number'
        ? serverData.requestIntervalMs
        : (typeof firestoreMeta?.requestIntervalMs === 'number' ? firestoreMeta.requestIntervalMs : 1200),
    stats: serverData?.stats || DEFAULT_MUSE_STATUS.stats,
  };

  updateCachedStatus(merged);
  return merged;
}

/**
 * Live server-side verification of Muse AI credentials before/after saving.
 */
export async function verifyMuseConnection(params: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{ success: boolean; model?: string; latencyMs?: number; reply?: string; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch('/api/muse/verify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        apiKey: params.apiKey?.trim() || undefined,
        baseUrl: params.baseUrl?.trim() || 'https://api.meta.ai/v1',
        model: params.model?.trim() || 'muse-spark-1.3',
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data?.success) {
      return {
        success: true,
        model: data.model,
        latencyMs: data.latencyMs,
        reply: data.reply,
      };
    }
    return {
      success: false,
      error: data?.error || `Verification failed (HTTP ${resp.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unable to reach server for Muse AI verification.',
    };
  }
}

/**
 * Connects or updates the Admin's Muse AI account on the server.
 * Secret API key is transmitted only to the authenticated server endpoint and NEVER stored in Firestore or localStorage.
 */
export async function saveMuseAccountConfig(params: {
  action: 'connect' | 'update';
  apiKey?: string;
  accountName: string;
  accountEmail: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
  fallbackToGemini: boolean;
  requestIntervalMs: number;
  customSystemDirective: string;
  verifyFirst?: boolean;
  adminEmail?: string;
}): Promise<{ success: boolean; status?: MuseEngineStatus; verifiedLatencyMs?: number; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch('/api/muse/config', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: params.action,
        apiKey: params.apiKey?.trim() || undefined,
        accountName: params.accountName.trim().slice(0, 120),
        accountEmail: params.accountEmail.trim().slice(0, 160),
        baseUrl: params.baseUrl.trim().slice(0, 240),
        model: params.model.trim().slice(0, 120),
        enabled: params.enabled,
        fallbackToGemini: params.fallbackToGemini,
        requestIntervalMs: params.requestIntervalMs,
        customSystemDirective: params.customSystemDirective.trim().slice(0, 2000),
        verifyFirst: Boolean(params.verifyFirst),
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `Failed to save Muse AI config (HTTP ${resp.status})`,
      };
    }

    const updatedStatus: MuseEngineStatus = {
      ...DEFAULT_MUSE_STATUS,
      ...(data.status || {}),
    };
    updateCachedStatus(updatedStatus);

    // Sync ONLY non-secret metadata to Firestore (never write secret API keys to Firestore)
    try {
      await setDoc(
        doc(db, 'system_config', 'muse_ai'),
        {
          enabled: updatedStatus.enabled,
          connected: updatedStatus.connected,
          accountName: updatedStatus.accountName.slice(0, 120),
          accountEmail: updatedStatus.accountEmail.slice(0, 160),
          model: updatedStatus.model.slice(0, 120),
          baseUrl: updatedStatus.baseUrl.slice(0, 240),
          fallbackToGemini: updatedStatus.fallbackToGemini,
          requestIntervalMs: updatedStatus.requestIntervalMs,
          customSystemDirective: updatedStatus.customSystemDirective.slice(0, 2000),
          keyHint: updatedStatus.keyHint.slice(0, 40),
          updatedBy: (params.adminEmail || 'admin').slice(0, 160),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Firestore non-secret sync notice:', fsErr);
    }

    return {
      success: true,
      status: updatedStatus,
      verifiedLatencyMs: data.verifiedLatencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while connecting Muse AI.',
    };
  }
}

/**
 * Signs out / disconnects the active Muse AI account from the server runtime.
 */
export async function disconnectMuseAccount(adminEmail?: string): Promise<{
  success: boolean;
  status?: MuseEngineStatus;
  error?: string;
}> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch('/api/muse/config', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'disconnect' }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      return { success: false, error: data?.error || 'Failed to disconnect Muse AI.' };
    }

    const updatedStatus: MuseEngineStatus = {
      ...DEFAULT_MUSE_STATUS,
      ...(data.status || {}),
    };
    updateCachedStatus(updatedStatus);

    try {
      await setDoc(
        doc(db, 'system_config', 'muse_ai'),
        {
          enabled: false,
          connected: false,
          accountName: '',
          accountEmail: '',
          keyHint: '',
          updatedBy: (adminEmail || 'admin').slice(0, 160),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}

    return { success: true, status: updatedStatus };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error disconnecting Muse AI.' };
  }
}

/**
 * Executes an uploaded file task through the server-side Muse AI engine according to Melo app commands.
 */
export async function executeMuseVisionTask(params: {
  systemInstruction: string;
  userPrompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<{ text: string; model: string; latencyMs?: number }> {
  const resp = await fetch('/api/muse/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      systemInstruction: params.systemInstruction,
      userPrompt: params.userPrompt,
      imageBase64: params.imageBase64 || undefined,
      imageMimeType: params.imageMimeType || undefined,
      temperature: params.temperature ?? 0.35,
      maxTokens: params.maxTokens ?? 4096,
    }),
  });

  if (!resp.ok) {
    const errJson = await resp.json().catch(() => ({}));
    throw new Error(errJson?.error || `Muse AI execution error (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  return {
    text: data?.text || '{}',
    model: data?.model || cachedMuseStatus.model || 'muse-spark-1.3',
    latencyMs: data?.latencyMs,
  };
}

/**
 * Runs a live Admin Sandbox test command against Muse AI to verify app command adherence.
 */
export async function testMuseCommandSandbox(params: {
  subject: string;
  mode: 'metadata' | 'prompt';
  model?: string;
}): Promise<{
  success: boolean;
  parsed?: any;
  rawText?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
}> {
  const startMs = performance.now();
  try {
    const headers = await getAdminAuthHeaders();
    const systemInstruction =
      params.mode === 'metadata'
        ? `You are Muse AI powering the Melo Microstock SEO Generator. Return ONLY valid JSON with keys: "title" (20-28 words, no trailing period, never use the word "commercial"), "description" (1-2 clean sentences), "keywords" (comma-separated string of 35-45 high-demand stock tags), "category".`
        : `You are Muse AI powering the Melo Prompt Architect. Return ONLY valid JSON with keys: "detectedSubject", "detectedStyle", "prompt" (detailed studio-grade 50-70 word image generation prompt, never use the word "commercial"), "negativePrompt".`;

    const userPrompt =
      params.mode === 'metadata'
        ? `Generate top-selling Adobe Stock SEO metadata JSON for this visual concept: "${params.subject.trim()}".`
        : `Engineer a production-grade AI image generation prompt JSON for this visual concept: "${params.subject.trim()}".`;

    const resp = await fetch('/api/muse/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        systemInstruction,
        userPrompt,
        temperature: 0.35,
        maxTokens: 2048,
        modelOverride: params.model?.trim() || undefined,
        sandbox: true,
      }),
    });

    const latencyMs = Math.round(performance.now() - startMs);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        success: false,
        latencyMs,
        error: data?.error || `Muse AI Sandbox error (HTTP ${resp.status})`,
      };
    }

    const rawText = String(data?.text || '');
    let parsed: any = null;
    try {
      const s = rawText.indexOf('{');
      const e = rawText.lastIndexOf('}');
      if (s !== -1 && e > s) {
        parsed = JSON.parse(rawText.slice(s, e + 1));
      }
    } catch {
      parsed = null;
    }

    // Refresh stats in background
    fetchMuseStatus(true).catch(() => {});

    return {
      success: true,
      parsed,
      rawText,
      model: data?.model || params.model || cachedMuseStatus.model,
      latencyMs: data?.latencyMs || latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - startMs),
      error: err?.message || 'Sandbox command execution failed.',
    };
  }
}
