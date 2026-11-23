import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Pencil
} from 'lucide-react';
import {
  MUSE_AI_MODELS,
  MUSE_GATEWAY_PRESETS,
  MuseEngineStatus,
  fetchMuseStatus,
  verifyMuseConnection,
  saveMuseAccountConfig,
  disconnectMuseAccount
} from '../services/museAiService';

interface MuseAiAdminPanelProps {
  currentAdminEmail?: string;
  onStatusChange?: (status: MuseEngineStatus) => void;
  onNotify?: (notice: { type: 'success' | 'error'; message: string }) => void;
}

const OFFICIAL_MUSE_PORTAL_URL = 'https://dev.meta.ai';

export const MuseAiAdminPanel: React.FC<MuseAiAdminPanelProps> = ({
  currentAdminEmail,
  onStatusChange,
  onNotify
}) => {
  const [status, setStatus] = useState<MuseEngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [accountEmail, setAccountEmail] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [portalOpened, setPortalOpened] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://api.meta.ai/v1');
  const [model, setModel] = useState('muse-spark-1.3');

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const applyStatus = (s: MuseEngineStatus) => {
    setStatus(s);
    onStatusChange?.(s);
    setAccountEmail(s.accountEmail || s.accountName || '');
    setBaseUrl(s.baseUrl || 'https://api.meta.ai/v1');
    setModel(s.model || 'muse-spark-1.3');
    if (!s.connected) {
      setIsEditing(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchMuseStatus(true)
      .then((s) => {
        if (mounted) applyStatus(s);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setApiKeyInput(text.trim());
          setFeedback(null);
        }
      }
    } catch {
      // ignore clipboard denial
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() && !status?.hasApiKey) {
      setFeedback({
        type: 'error',
        message: 'Paste the Muse AI key (LLM_...) you copied from dev.meta.ai to connect.'
      });
      return;
    }

    setIsSigningIn(true);
    setFeedback(null);
    try {
      const cleanEmail = accountEmail.trim();
      const displayName = cleanEmail.includes('@')
        ? cleanEmail.split('@')[0]
        : cleanEmail || 'Muse AI Account';

      const res = await saveMuseAccountConfig({
        action: 'connect',
        apiKey: apiKeyInput.trim() || undefined,
        accountName: displayName,
        accountEmail: cleanEmail,
        baseUrl: baseUrl.trim() || 'https://api.meta.ai/v1',
        model: model.trim() || 'muse-spark-1.3',
        enabled: true,
        fallbackToGemini: false,
        requestIntervalMs: 1200,
        customSystemDirective: '',
        verifyFirst: true,
        adminEmail: currentAdminEmail
      });

      if (res.success && res.status) {
        applyStatus(res.status);
        setApiKeyInput('');
        setPortalOpened(false);
        setIsEditing(false);
        setFeedback({
          type: 'success',
          message: 'Muse AI connected. All user uploads now run through Muse AI in the background.'
        });
        onNotify?.({
          type: 'success',
          message: 'Muse AI account connected and active in background.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Could not connect Muse AI. Please verify your key from dev.meta.ai.'
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    setFeedback(null);
    try {
      const res = await verifyMuseConnection({
        baseUrl: status?.baseUrl || baseUrl,
        model: status?.model || model
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Muse AI connection is active (${res.latencyMs ?? 0}ms).`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Connection check failed.'
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setFeedback(null);
    try {
      const res = await disconnectMuseAccount(currentAdminEmail);
      if (res.success && res.status) {
        applyStatus(res.status);
        setApiKeyInput('');
        setIsEditing(true);
        onNotify?.({
          type: 'success',
          message: 'Signed out of Muse AI account.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to sign out.'
        });
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-zinc-500 dark:text-zinc-400">
        <Loader2 size={22} className="animate-spin text-zinc-900 dark:text-white" />
        <span className="text-xs font-medium">Checking Muse AI session...</span>
      </div>
    );
  }

  const isSignedIn = Boolean(status?.connected && status?.enabled);
  const accountDisplay = status?.accountEmail || status?.accountName || 'Muse AI Account';

  return (
    <div className="flex-1 overflow-y-auto py-4 px-1 flex items-start justify-center">
      <div className="w-full max-w-lg bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-white/10">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              {isSignedIn && !isEditing ? 'Muse AI Account' : 'Connect Muse AI Account'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {isSignedIn && !isEditing
                ? 'Your Muse AI account is running silently in the background for every file uploaded by users.'
                : 'Sign in on the official Muse AI portal, copy your key once, and paste it below so every user upload runs through Muse AI in the background.'}
            </p>
          </div>
          <a
            href={OFFICIAL_MUSE_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setPortalOpened(true)}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Muse Portal</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Signed-In Account View */}
        {isSignedIn && !isEditing ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center shrink-0">
                {accountDisplay.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {accountDisplay}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Signed in</span>
                  <span aria-hidden="true">·</span>
                  <span>Background active</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px]">{status?.model}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-white/10 pt-4 grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-0.5">Access Token</div>
                <div className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {status?.keyHint || '••••••'}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-0.5">Execution Scope</div>
                <div className="text-zinc-900 dark:text-zinc-100 font-medium">All user uploads</div>
              </div>
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-0.5">Session Sync</div>
                <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {status?.keySource === 'server_env' ? 'Netlify / Server Env' : 'Active Server Session'}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 dark:text-zinc-400 mb-0.5">Endpoint</div>
                <div className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                  {status?.baseUrl}
                </div>
              </div>
            </div>

            {status?.isServerless && status?.keySource !== 'server_env' && (
              <div className="pt-3 border-t border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For permanent 24/7 Netlify background execution across deploys, add{' '}
                <code className="font-mono text-[11px] text-zinc-900 dark:text-zinc-200">MUSE_API_KEY</code>{' '}
                in Netlify Site configuration &gt; Environment variables and redeploy.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={handleCheckConnection}
                disabled={isChecking}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {isChecking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                <span>Check Connection</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setFeedback(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-zinc-300 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil size={13} />
                <span>Switch Account</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="ml-auto px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {isSigningOut ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Clean 2-Step Official Portal Link + Connect Flow */
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Step 1: Direct Official Portal Sign-In Link */}
            <div className="space-y-2 pb-4 border-b border-zinc-200 dark:border-white/10">
              <div className="text-xs font-medium text-zinc-900 dark:text-white">
                01. Sign in on the official Muse AI Portal
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Log in with your Muse email &amp; verification code on <span className="font-mono text-zinc-700 dark:text-zinc-300">dev.meta.ai</span>, open <strong>API keys</strong>, and copy your <span className="font-mono">LLM_...</span> key.
              </p>
              <a
                href={OFFICIAL_MUSE_PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setPortalOpened(true)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-white/15 bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-900 dark:text-white flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Open Official Muse AI Portal (dev.meta.ai)</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Step 2: Paste Key & Activate */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-zinc-900 dark:text-white">
                  02. Paste your Muse AI key to link this app
                </div>
                {portalOpened && (
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Portal opened · paste key below
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="muse-access-token"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Muse AI API Key
                  </label>
                  {status?.hasApiKey && (
                    <span className="text-[11px] font-mono text-zinc-400">
                      Current: {status.keyHint}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    id="muse-access-token"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder={
                      status?.hasApiKey
                        ? 'Leave blank to keep saved key, or paste new key'
                        : 'LLM_... (Paste key from dev.meta.ai)'
                    }
                    className="w-full pl-3.5 pr-20 py-2.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/25 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20"
                  />
                  <div className="absolute right-2 flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      aria-label={showApiKey ? 'Hide key' : 'Show key'}
                      className="p-1.5 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                    >
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    {!apiKeyInput && (
                      <button
                        type="button"
                        onClick={handlePaste}
                        aria-label="Paste key"
                        className="p-1.5 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="muse-account-email"
                  className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Muse Account Email <span className="text-zinc-400 font-normal">(optional label)</span>
                </label>
                <input
                  id="muse-account-email"
                  type="text"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="name@meta.ai"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/25 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20"
                />
              </div>

              {/* Optional Advanced Endpoint/Model Disclosure */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>Endpoint &amp; model options</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/10 space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Endpoint URL
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {MUSE_GATEWAY_PRESETS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setBaseUrl(p.url)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                              baseUrl.replace(/\/+$/, '') === p.url
                                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                                : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/25 text-zinc-900 dark:text-white focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Muse Model
                      </label>
                      <select
                        value={MUSE_AI_MODELS.some((m) => m.id === model) ? model : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setModel(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/25 text-zinc-900 dark:text-white focus:outline-hidden"
                      >
                        {MUSE_AI_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isSigningIn}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    <span>Connect Muse AI</span>
                  </>
                )}
              </button>

              {isSignedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setApiKeyInput('');
                    setFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pt-2 border-t border-zinc-200 dark:border-white/10">
              For Netlify deployments, add <code className="font-mono text-zinc-800 dark:text-zinc-200">MUSE_API_KEY</code> in Netlify Environment Variables so your Muse AI account stays connected after every push.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
