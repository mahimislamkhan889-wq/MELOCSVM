import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, Copy, ExternalLink, ShieldCheck, Loader2, AlertCircle, RefreshCw, Trash2, ChevronDown, ChevronUp, Bot, Sparkles, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  validateApifyToken, 
  getStoredApifyToken, 
  saveStoredApifyToken, 
  getStoredApifyUser, 
  isApifyAutoScrapeEnabled, 
  setApifyAutoScrapeEnabled 
} from '../services/apifyService';

interface ApifyApiSectionProps {
  className?: string;
  onTokenChange?: (token: string) => void;
}

export function ApifyApiSection({ className, onTokenChange }: ApifyApiSectionProps) {
  const [token, setToken] = useState<string>(() => getStoredApifyToken());
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [connectedUser, setConnectedUser] = useState<{ username: string; plan?: string } | null>(() => getStoredApifyUser());
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  // Section is always slide collapsed/hidden by default as requested
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScrapeTags, setAutoScrapeTags] = useState(() => isApifyAutoScrapeEnabled());

  const isConfigured = Boolean(token.trim());

  useEffect(() => {
    if (onTokenChange) {
      onTokenChange(token);
    }
  }, [token, onTokenChange]);

  const handleSave = () => {
    const cleanToken = token.trim();
    saveStoredApifyToken(cleanToken);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = text.trim();
          setToken(clean);
          saveStoredApifyToken(clean);
          setIsSavedRecently(true);
          setTimeout(() => setIsSavedRecently(false), 2000);
        }
      }
    } catch (e) {
      // Clipboard permission denied or unavailable
    }
  };

  const handleClear = () => {
    setToken('');
    setConnectedUser(null);
    setTestResult('idle');
    setStatusMessage('');
    saveStoredApifyToken('');
  };

  const handleTestConnection = async () => {
    if (!token.trim()) {
      setTestResult('error');
      setStatusMessage('Please enter an Apify API token first.');
      return;
    }

    setIsTesting(true);
    setTestResult('idle');
    setStatusMessage('');

    try {
      const result = await validateApifyToken(token.trim());

      if (result.success && result.user) {
        setTestResult('success');
        const userObj = {
          username: result.user.username || 'Apify User',
          plan: result.user.plan || 'Active'
        };
        setConnectedUser(userObj);
        setStatusMessage(`Connected as @${userObj.username} (${userObj.plan})`);
      } else {
        setTestResult('error');
        setStatusMessage(result.error || 'Authentication failed. Please check your token.');
      }
    } catch (err: any) {
      setTestResult('error');
      setStatusMessage(err?.message || 'Error validating Apify token.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleAutoScrape = (val: boolean) => {
    setAutoScrapeTags(val);
    setApifyAutoScrapeEnabled(val);
  };

  return (
    <div className={cn(
      "border rounded-2xl transition-all duration-300 overflow-hidden",
      isConfigured 
        ? "bg-gradient-to-b from-white/80 to-zinc-50/80 dark:from-white/[0.04] dark:to-transparent border-zinc-300/80 dark:border-white/10 shadow-xs" 
        : "bg-white/40 dark:bg-black/20 border-zinc-300/60 dark:border-white/10",
      className
    )}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3.5 cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {/* Apify Icon Badge */}
          <div className={cn(
            "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs transition-colors",
            isConfigured 
              ? "bg-[#00A699] text-white" 
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          )}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Apify API
              </span>
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1",
                isConfigured
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConfigured ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                )} />
                {isConfigured ? (connectedUser ? `@${connectedUser.username}` : "Configured") : "Not Set"}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Stock keyword & microstock scraper
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
          aria-label={isExpanded ? "Collapse Apify settings" : "Expand Apify settings"}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Collapsible Slide Content */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-zinc-200/60 dark:border-white/5">
            {/* Token Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  API Token
                </label>
                <a 
                  href="https://console.apify.com/account/integrations" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Get Token <ExternalLink size={10} />
                </a>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setTestResult('idle');
                    setStatusMessage('');
                  }}
                  placeholder="apify_api_..."
                  className="w-full pl-3 pr-20 py-2 text-xs font-mono rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/40 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/30"
                />

                <div className="absolute right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    title={showToken ? "Hide Token" : "Show Token"}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {!token && (
                    <button
                      type="button"
                      onClick={handlePaste}
                      title="Paste from clipboard"
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                  {token && (
                    <button
                      type="button"
                      onClick={handleClear}
                      title="Clear Token"
                      className="p-1 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 rounded cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Test & Save Actions */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
                  isSavedRecently
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98]"
                )}
              >
                {isSavedRecently ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Key</span>
                )}
              </button>

              <button
                type="button"
                disabled={isTesting || !token.trim()}
                onClick={handleTestConnection}
                className={cn(
                  "py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                  !token.trim()
                    ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-white/5 text-zinc-400"
                    : "bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-[0.98]"
                )}
              >
                {isTesting ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-zinc-500" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} />
                    <span>Test</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Feedback Message */}
            {statusMessage && (
              <div className={cn(
                "p-2 rounded-xl text-[11px] flex items-start gap-1.5 leading-snug animate-in fade-in duration-200",
                testResult === 'success'
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300"
              )}>
                {testResult === 'success' ? (
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={13} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{statusMessage}</span>
              </div>
            )}

            {/* Microstock Scraper Toggle */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block">
                  Auto-Discover Tags
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">
                  Extract competitor microstock tags
                </span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={autoScrapeTags}
                onClick={() => handleToggleAutoScrape(!autoScrapeTags)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  autoScrapeTags ? "bg-[#00A699]" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    autoScrapeTags ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
