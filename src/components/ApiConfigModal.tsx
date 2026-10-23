import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Sparkles, Globe, Moon, Bot, Zap, Plus, Key, Cpu, Sparkle, Link, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { ApiProvider, GenerationSettings, testApiConnection } from '../services/geminiService';
import { cn } from '../lib/utils';

import { PROVIDER_MODELS } from '../lib/models';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  setSettings: React.Dispatch<React.SetStateAction<GenerationSettings>>;
}

const PROVIDER_INFO = [
  { id: 'google', name: 'Google Gemini', icon: Sparkles, url: 'https://aistudio.google.com/app/apikey', subtitle: 'Powerful multimodal AI by Google', badge: 'FREE & PAID', models: PROVIDER_MODELS.google },
  { id: 'openrouter', name: 'OpenRouter', icon: Globe, url: 'https://openrouter.ai/keys', subtitle: 'Unified API for all LLMs', badge: 'PAID', models: PROVIDER_MODELS.openrouter },
  { id: 'openai', name: 'OpenAI', icon: Moon, url: 'https://platform.openai.com/api-keys', subtitle: 'Industry standard models', badge: 'PAID', models: PROVIDER_MODELS.openai },
  { id: 'mistral', name: 'Mistral AI', icon: Bot, url: 'https://console.mistral.ai/api-keys/', subtitle: 'Open-weight models', badge: 'PAID', models: PROVIDER_MODELS.mistral },
  { id: 'groq', name: 'Groq Cloud', icon: Zap, url: 'https://console.groq.com/keys', subtitle: 'Near-instant inference powered by LPUs', badge: 'FREE & PAID', models: PROVIDER_MODELS.groq },
  { id: 'custom', name: 'Custom OpenAI/Local', icon: Cpu, url: '', subtitle: 'Use your own OpenAI-compliant API endpoint', badge: 'CUSTOM', models: PROVIDER_MODELS.custom },
] as const;

export function ApiConfigModal({ isOpen, onClose, settings, setSettings }: ApiConfigModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<ApiProvider>(settings.apiProvider || 'google');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  if (!isOpen) return null;

  const info = PROVIDER_INFO.find(p => p.id === selectedProviderId) || PROVIDER_INFO[0];

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('idle');
    setTestError('');
    try {
      let config = settings.apiConfigs[info.id as ApiProvider] || { apiKey: '', model: info.models[0]?.id };
      if (!info.models.find(m => m.id === config.model)) {
        config = { ...config, model: info.models[0]?.id || '' };
      }
      await testApiConnection(info.id as ApiProvider, config);
      setTestResult('success');
      setTimeout(() => setTestResult('idle'), 3000);
    } catch (err: any) {
      setTestResult('error');
      let message = err.message || 'Connection failed';
      
      try {
        const parsed = JSON.parse(message);
        if (parsed.error && parsed.error.message) {
          message = parsed.error.message;
        }
      } catch (e) {
        // Not JSON, just use the message
      }
      setTestError(message);
    } finally {
      setIsTesting(false);
    }
  };

  const activeConfig = settings.apiConfigs[info.id as ApiProvider] || { apiKey: '', model: info.models[0]?.id };
  const savedKeys = activeConfig.savedKeys || [];

  const handleSaveKey = () => {
    if (!activeConfig.apiKey) return;
    
    // Support bulk adding: split by newline, comma, or space
    const keys = activeConfig.apiKey
      .split(/[\n,\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5); // Basic validation to avoid empty strings or tiny snippets

    if (keys.length === 0) return;

    setSettings(s => {
      const currentSavedKeys = s.apiConfigs[info.id as ApiProvider]?.savedKeys || [];
      const newKeysToAdd = keys.filter(k => !currentSavedKeys.some(sk => sk.key === k));
      
      const formattedNewKeys = newKeysToAdd.map((key, index) => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
        key,
        name: `S${currentSavedKeys.length + index + 1}`
      }));

      const allSavedKeys = [...currentSavedKeys, ...formattedNewKeys];

      return {
        ...s,
        apiConfigs: {
          ...s.apiConfigs,
          [info.id]: {
            ...activeConfig,
            savedKeys: allSavedKeys,
            apiKey: keys[0] // Keep active key set so it is immediately ready
          }
        }
      };
    });
  };

  const handleDeleteKey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSettings(s => {
      const currentConfig = s.apiConfigs[info.id as ApiProvider] || { apiKey: '', model: info.models[0]?.id };
      const currentSavedKeys = currentConfig.savedKeys || [];
      const newSavedKeys = currentSavedKeys
        .filter(k => k.id !== id)
        .map((k, index) => ({ ...k, name: `S${index + 1}` }));

      return {
        ...s,
        apiConfigs: {
          ...s.apiConfigs,
          [info.id]: {
            ...currentConfig,
            savedKeys: newSavedKeys
          }
        }
      };
    });
  };

  const handleSelectKey = (key: string) => {
    setSettings(s => ({
      ...s,
      apiConfigs: {
        ...s.apiConfigs,
        [info.id]: {
          ...activeConfig,
          apiKey: key
        }
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-neutral-100/80 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="relative w-full max-w-2xl bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl flex overflow-hidden min-h-[440px] max-h-[85vh]"
      >
        {/* Sidebar */}
        <div className="w-[180px] bg-white/50 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-white/5 flex flex-col p-3 shrink-0">
          <div className="flex items-center gap-2 px-2 mb-4 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[0.15em] mt-2 text-center w-full justify-center">
            <ShieldCheck size={14} /> PROVIDERS
          </div>
          
          <div className="flex-1 space-y-0.5">
            {PROVIDER_INFO.map(provider => {
              const Icon = provider.icon;
              const isSelected = selectedProviderId === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProviderId(provider.id as ApiProvider);
                    setTestResult('idle');
                    setTestError('');
                    setSettings(s => ({ ...s, apiProvider: provider.id as ApiProvider }));
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-xs font-semibold",
                    isSelected 
                      ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white shadow-sm ring-1 ring-cyan-500/50 shadow-md"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white/5"
                  )}
                >
                  <Icon size={14} className={isSelected ? 'text-black dark:text-white' : 'text-neutral-500 dark:text-neutral-400'} />
                  {provider.name}
                </button>
              );
            })}
          </div>

          <div className="mt-6 px-2 pb-2 text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Keys are stored<br/>locally in your browser.
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 sm:p-6 relative flex flex-col overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-white p-2 rounded-lg hover:bg-neutral-100 dark:bg-white/5 transition-colors">
            <X size={18} />
          </button>

          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">{info.name}</h2>
              <span className="px-2 py-0.5 text-[9px] font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-white/20 bg-neutral-200/50 dark:bg-white/10 rounded uppercase tracking-widest">{info.badge}</span>
            </div>
            
            {info.url && (
              <a href={info.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-black dark:text-white border border-neutral-300 dark:border-white/20 rounded-lg hover:bg-white/10 transition-colors">
                <ExternalLink size={14} /> Get Key
              </a>
            )}
          </div>

          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-5">{info.subtitle}</p>

          <div className="max-w-[480px] space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[0.2em] flex items-center gap-2 uppercase">
                <Cpu size={12} /> MODEL
              </label>
              <div className="relative">
                {info.id === 'custom' ? (
                  <input 
                    type="text"
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-neutral-600"
                    placeholder="e.g. meta-llama/Llama-3-70b"
                    value={settings.apiConfigs[info.id]?.model || ''}
                    onChange={(e) => {
                      setSettings(s => ({
                        ...s,
                        apiConfigs: { ...s.apiConfigs, [info.id]: { ...(s.apiConfigs[info.id as ApiProvider] || {apiKey: ''}), model: e.target.value } }
                      }));
                    }}
                  />
                ) : (
                  <>
                    <select
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-black dark:text-white appearance-none outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer"
                      value={settings.apiConfigs[info.id as ApiProvider]?.model || info.models[0]?.id}
                      onChange={(e) => {
                        setSettings(s => ({
                          ...s,
                          apiConfigs: { ...s.apiConfigs, [info.id]: { ...(s.apiConfigs[info.id as ApiProvider] || {apiKey: ''}), model: e.target.value } }
                        }));
                      }}
                    >
                      {info.models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {(info.id === 'custom' || info.id === 'openai') && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[0.2em] flex items-center gap-2 uppercase">
                  <Link size={12} /> BASE URL
                </label>
                <input
                  type="text"
                  className="w-full bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-neutral-600 font-mono"
                  placeholder={info.id === 'custom' ? "http://localhost:11434/v1" : "https://api.openai.com/v1"}
                  value={settings.apiConfigs[info.id as ApiProvider]?.baseUrl || ''}
                  onChange={(e) => {
                    setSettings(s => ({
                      ...s,
                      apiConfigs: { ...s.apiConfigs, [info.id]: { ...(s.apiConfigs[info.id as ApiProvider] || {apiKey: '', model: info.models[0]?.id}), baseUrl: e.target.value } }
                    }));
                  }}
                />
              </div>
            )}

            {info.id === 'google' && (
              <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <Sparkles size={14} className="text-emerald-500 shrink-0" />
                  <span>Works on Netlify, Cloud & Browser</span>
                </div>
                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                  Keys saved here stay permanently in your browser (<span className="font-semibold">LocalStorage</span>) so your deployed Netlify site works seamlessly. You can also configure <code className="px-1.5 py-0.5 rounded bg-emerald-500/15 font-mono text-[10px]">GEMINI_API_KEY</code> in Netlify Environment Variables.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <ShieldCheck size={12} className="text-black dark:text-white/50" /> API KEY
              </label>
              <div className="flex gap-3 items-stretch">
                <div className="relative flex-1 group">
                  <textarea
                    className="w-full min-h-[52px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-2xl px-5 py-3.5 pr-12 text-sm font-medium text-black dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-black/30 dark:border-white/30 transition-all placeholder:text-neutral-600 resize-none leading-relaxed scrollbar-hide"
                    style={{ 
                      WebkitTextSecurity: isKeyVisible ? 'none' : 'disc',
                      textSecurity: isKeyVisible ? 'none' : 'disc' 
                    } as any}
                    placeholder="Paste your Gemini API key (AIzaSy...) here....."
                    value={settings.apiConfigs[info.id as ApiProvider]?.apiKey || ''}
                    rows={Math.max(1, Math.min(5, (settings.apiConfigs[info.id as ApiProvider]?.apiKey || '').split('\n').length))}
                    onChange={(e) => {
                      setSettings(s => ({
                        ...s,
                        apiConfigs: { ...s.apiConfigs, [info.id]: { ...(s.apiConfigs[info.id as ApiProvider] || {model: info.models[0]?.id}), apiKey: e.target.value } }
                      }));
                    }}
                  />
                  <button 
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-black dark:text-white transition-colors"
                  >
                    {isKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex gap-2 shrink-0 self-start mt-0.5">
                  <button 
                    onClick={handleTest}
                    disabled={isTesting || !settings.apiConfigs[info.id as ApiProvider]?.apiKey}
                    className="h-[48px] px-5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-700 text-black dark:text-white text-[12px] font-black rounded-2xl border border-neutral-200 dark:border-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 min-w-[90px]"
                  >
                    {isTesting ? <Loader2 size={16} className="animate-spin" /> : "TEST"}
                  </button>

                  <button 
                    onClick={handleSaveKey}
                    disabled={!settings.apiConfigs[info.id as ApiProvider]?.apiKey}
                    className="h-[48px] px-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-black dark:border-white shadow-[0_0_20px_rgba(16,185,129,0.05)] disabled:opacity-30 group active:scale-95 text-xs font-bold uppercase tracking-wider"
                    title="Save key to local storage"
                  >
                    <Plus size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {testResult !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex items-center gap-3 text-sm p-4 rounded-2xl border transition-all duration-300",
                      testResult === 'success' 
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30" 
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
                    )}
                  >
                    {testResult === 'success' ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="font-semibold text-xs sm:text-sm">API connection successful!</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                          <AlertCircle size={16} />
                        </div>
                        <span className="font-semibold text-xs sm:text-sm">{testError}</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {savedKeys.length > 0 && (
                <div className="mt-6 border-t border-neutral-200 dark:border-white/10 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 tracking-[0.2em] uppercase">
                      STORED KEYS ({savedKeys.length})
                    </div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      Click key to switch
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {savedKeys.map((k, index) => {
                      const isSelected = activeConfig.apiKey === k.key;
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => handleSelectKey(k.key)}
                          className={cn(
                            "flex flex-col items-center justify-center min-w-[58px] h-[58px] px-2.5 rounded-xl border transition-all cursor-pointer relative group active:scale-95 shadow-sm",
                            isSelected 
                              ? "bg-white dark:bg-neutral-800 border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/20" 
                              : "bg-white/70 dark:bg-neutral-900/60 border-neutral-200 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/30 hover:bg-white dark:hover:bg-neutral-800/80"
                          )}
                        >
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm animate-pulse" />
                          )}
                          <Key 
                            size={13} 
                            className={cn(
                              "mb-1 transition-colors", 
                              isSelected 
                                ? "text-neutral-900 dark:text-white" 
                                : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                            )} 
                          />
                          <span className={cn(
                            "text-[10px] tracking-tight transition-colors", 
                            isSelected 
                              ? "font-black text-neutral-900 dark:text-white" 
                              : "font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                          )}>
                            {k.name || `S${index + 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    {savedKeys.map((k, index) => {
                      const isSelected = activeConfig.apiKey === k.key;
                      return (
                        <div 
                          key={'detail-'+k.id} 
                          onClick={() => !isSelected && handleSelectKey(k.key)}
                          className={cn(
                            "border rounded-xl px-3.5 py-2.5 flex items-center justify-between group transition-all cursor-pointer",
                            isSelected 
                              ? "bg-white dark:bg-neutral-800/90 border-neutral-300 dark:border-white/20 shadow-sm ring-1 ring-neutral-900/5 dark:ring-white/10" 
                              : "bg-white/50 dark:bg-neutral-900/40 border-neutral-200/80 dark:border-white/5 hover:bg-white dark:hover:bg-neutral-900/80 hover:border-neutral-300 dark:hover:border-white/15"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                              isSelected 
                                ? "bg-neutral-200/80 dark:bg-neutral-700 text-neutral-900 dark:text-white" 
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                            )}>
                              {k.name || `S${index + 1}`}
                            </span>
                            <div className="flex items-center text-neutral-600 dark:text-neutral-300 font-mono text-xs tracking-wider">
                              <span className="text-neutral-400 dark:text-neutral-500 tracking-[0.2em] mr-1 select-none">•••••</span>
                              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                {k.key.length > 4 ? k.key.slice(-4) : k.key}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isSelected && (
                              <span className="text-[10px] font-bold text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-opacity opacity-0 group-hover:opacity-100">
                                USE
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteKey(k.id, e)}
                              className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete key"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
