import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, UploadCloud, FileImage, Settings, Image as ImageIcon, Tags, Tag, Zap, Trash2, CheckCircle2, AlertCircle, LogOut, User, ShieldCheck, Key, ChevronDown, ChevronUp, Cpu, Bot, RefreshCw, Copy, Check, Eye, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Video, FileCode2, FileType2, Target, Rabbit, Sparkles, CalendarDays, Play, Clock, TrendingUp } from 'lucide-react';
import { AppMode, Platform, GenerationSettings, GeneratedResult, processMedia } from './services/geminiService';
import { cn, exportToCSV, generateId } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, X, Moon, Sun, Camera, Lock } from 'lucide-react';


import { db, auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';


import { EventCalendar } from './components/EventCalendar';
import { LandingPage } from './components/LandingPage';
import { AllReviewsPage } from './components/AllReviewsPage';
import { AuthModal } from './components/AuthModal';
import { CreditModal } from './components/CreditModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { TrackerSection } from './components/TrackerSection';
import { 
  UserCreditData, 
  getLocalUserCredits, 
  subscribeUserCredits, 
  deductCredits, 
  COST_PER_FILE 
} from './services/creditService';
import { extractEmbeddedVectorThumbnail, rasterizeSvgToPng } from './lib/vectorUtils';

interface MediaFile {
  id: string;
  file: File;
  previewUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: GeneratedResult;
  error?: string;
  processingTimeMs?: number;
}

type TabType = AppMode | 'admin' | 'builder' | 'calendar' | 'landing' | 'reviews' | 'tracker';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function App() {
  const [tab, setTab] = useState<TabType>('landing');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('melo_theme') || localStorage.getItem('mainul_meta_gen_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('melo_theme', 'dark');
      localStorage.setItem('mainul_meta_gen_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('melo_theme', 'light');
      localStorage.setItem('mainul_meta_gen_theme', 'light');
    }
  }, [isDarkMode]);

  // User Authentication State (Google Gmail, Email & Mobile Phone)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('melo_creator_auth');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // User Credits State (Real-time Firestore + Local Cache Sync)
  const [userCredits, setUserCredits] = useState<UserCreditData>(() => 
    getLocalUserCredits(currentUser?.uid || 'guest')
  );
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState(false);
  const [insufficientFilesCount, setInsufficientFilesCount] = useState<number | undefined>(undefined);

  const isAdmin = currentUser?.email === 'mahimislamkhan889@gmail.com' || currentUser?.role === 'admin' || currentUser?.phoneNumber === '+8801948481216';

  useEffect(() => {
    const uid = currentUser?.uid || 'guest';
    const unsubscribe = subscribeUserCredits(uid, (data) => {
      setUserCredits(data);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem('melo_creator_auth', JSON.stringify({
            uid: user.uid,
            displayName: user.displayName || 'Melo Creator',
            email: user.email || user.phoneNumber || 'Authenticated User',
            photoURL: user.photoURL || null
          }));
        } catch {}
      }
    });
    return () => unsubscribe();
  }, []);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsUserMenuOpen(false);
    if (isUserMenuOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session tracking: from "Process" click until "all ok" (all chunks completed)
  const [isProcessingSession, setIsProcessingSession] = useState<boolean>(false);
  const isProcessing = isProcessingSession || processingFiles.size > 0;

  // Processing stopwatch timer for live UI display (tracks minutes and seconds from click until all ok)
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastProcessingTime, setLastProcessingTime] = useState<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (isProcessingSession) {
      const start = Date.now();
      sessionStartTimeRef.current = start;
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(Date.now() - start);
      }, 100);
    } else {
      if (sessionStartTimeRef.current) {
        setLastProcessingTime(Date.now() - sessionStartTimeRef.current);
        sessionStartTimeRef.current = null;
      }
    }
    return () => clearInterval(interval);
  }, [isProcessingSession]);

  // Format duration in minutes and seconds (e.g. "0m 05s", "1m 24s", "3m 45s")
  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0m 00s';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Memoized file groupings to guarantee 60fps/120fps UI responsiveness
  const groupedFiles = useMemo(() => {
    if (files.length === 0) return {} as Record<string, MediaFile[]>;
    const getFileGroup = (file: File) => {
      const type = file.type.toLowerCase();
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return 'Videos';
      } else if (['svg', 'eps', 'ai'].includes(ext) || type.includes('svg') || type.includes('postscript') || type.includes('illustrator')) {
        return 'Vector Graphics';
      } else if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
        return 'Raster Images';
      } else {
        return 'Other Files';
      }
    };

    return files.reduce((acc, file) => {
      const group = getFileGroup(file.file);
      if (!acc[group]) acc[group] = [];
      acc[group].push(file);
      return acc;
    }, {} as Record<string, MediaFile[]>);
  }, [files]);

  const [settings, setSettings] = useState<GenerationSettings>({
    titleWords: 26,
    keywordWords: 50,
    descriptionEnabled: true,
    descriptionWords: 32,
    platform: 'adobe',
    singleWordKeywords: false,
    silhouette: false,
    transparentBackground: false,
    whiteBackground: false,
    extraText: false,
    avoidSimilarity: false,
    exactRecreation: true,
    promptTargetEngine: 'universal',
    promptStylePreset: 'auto',
    customPromptEnabled: false,
    customPromptText: '',
    apiProvider: (localStorage.getItem('mainul_meta_gen_api_provider') as any) || 'google',
    apiConfigs: (() => {
      try {
        const stored = localStorage.getItem('mainul_meta_gen_api_configs');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            if (!parsed.google) {
              parsed.google = { apiKey: '', model: 'gemini-2.5-flash' };
            } else if (!parsed.google.model || parsed.google.model === 'gemini-3.1-flash-lite' || parsed.google.model.includes('2.0-flash')) {
              parsed.google.model = 'gemini-2.5-flash';
            }
            return parsed;
          }
        }
      } catch (e) {}
      return {
        google: { apiKey: '', model: 'gemini-2.5-flash' },
        openai: { apiKey: '', model: '' },
        openrouter: { apiKey: '', model: '' },
        mistral: { apiKey: '', model: '' },
        groq: { apiKey: '', model: '' },
        custom: { apiKey: '', model: '', baseUrl: '' }
      };
    })(),
  });

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [showApiSettings, setShowApiSettings] = useState(false);
  const [vectorFormat, setVectorFormat] = useState<'None' | 'EPS' | 'AI'>('None');
  const [isVectorDropdownOpen, setIsVectorDropdownOpen] = useState(false);

  // Save config to local storage when it changes
  useEffect(() => {
    if (settings.apiProvider) localStorage.setItem('mainul_meta_gen_api_provider', settings.apiProvider);
    localStorage.setItem('mainul_meta_gen_api_configs', JSON.stringify(settings.apiConfigs));
  }, [settings.apiProvider, settings.apiConfigs]);

  const handleFilesAdded = async (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const fileList = Array.from(newFiles);
    const incoming: MediaFile[] = [];

    for (const file of fileList) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isRasterOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'bmp', 'tiff', 'heic', 'mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
      
      let previewUrl: string | null = null;

      if (ext === 'svg' || file.type === 'image/svg+xml') {
        try {
          const raster = await rasterizeSvgToPng(file);
          previewUrl = raster;
        } catch (e) {
          previewUrl = URL.createObjectURL(file);
        }
      } else if (ext === 'eps' || ext === 'ai' || file.type.includes('postscript') || file.type.includes('illustrator')) {
        try {
          const thumb = await extractEmbeddedVectorThumbnail(file);
          previewUrl = thumb;
        } catch (e) {
          previewUrl = null;
        }
      } else if (isRasterOrVideo) {
        previewUrl = URL.createObjectURL(file);
      } else {
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (e) {
          previewUrl = null;
        }
      }

      incoming.push({
        id: generateId(),
        file,
        previewUrl,
        status: 'pending' as const,
      });
    }

    setFiles(prev => [...prev, ...incoming]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesAdded(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      abortControllersRef.current.get(f.id)?.abort();
      abortControllersRef.current.delete(f.id);
    });
    setFiles([]);
    setProcessingFiles(new Set());
    setIsProcessingSession(false);
    setElapsedTime(0);
    setLastProcessingTime(null);
    sessionStartTimeRef.current = null;
  };

  const processBatch = async (itemsToProcess: MediaFile[], useSettings?: GenerationSettings) => {
    // Enforcement: Processing strictly requires authentication (Gmail or Mobile Number)
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // Only process files that aren't already being processed
    const eligibleItems = itemsToProcess.filter(item => !processingFiles.has(item.id));
    if (eligibleItems.length === 0) return;

    // Start session tracking from the moment Process is clicked
    setIsProcessingSession(true);

    const activeMode = (tab === 'admin' || tab === 'builder') ? 'metadata' : tab as AppMode;
    const currentSettings = useSettings || settingsRef.current;
    const BATCH_SIZE = 5;

    // Split eligible items into strict batches of 5 files
    const chunks: MediaFile[][] = [];
    for (let i = 0; i < eligibleItems.length; i += BATCH_SIZE) {
      chunks.push(eligibleItems.slice(i, i + BATCH_SIZE));
    }

    try {
      // Process batch by batch: wait for all 5 files in current batch to finish and transition to SUCCESS together at once
      for (const chunk of chunks) {
        // Mark current batch items as processing
        setProcessingFiles(prev => {
          const next = new Set(prev);
          chunk.forEach(item => next.add(item.id));
          return next;
        });

        setFiles(prev => prev.map(f => 
          chunk.some(p => p.id === f.id) ? { ...f, status: 'processing', error: undefined } : f
        ));

        // Process files in the current 5-item batch with a slight 200ms stagger to prevent 429 burst rate limits
        const batchPromises = chunk.map(async (item, itemIdx) => {
          if (!filesRef.current.some(f => f.id === item.id)) {
            return { id: item.id, status: 'cancelled' as const };
          }

          if (itemIdx > 0) {
            await new Promise(r => setTimeout(r, itemIdx * 200));
          }

          const abortController = new AbortController();
          abortControllersRef.current.set(item.id, abortController);
          const itemStartTime = Date.now();
          
          try {
            const result = await processMedia(
              item.file, 
              activeMode, 
              currentSettings, 
              (provider, newKey, failedKeys, invalidKeys) => {
                setSettings(prev => {
                  const currentConfig = prev.apiConfigs[provider];
                  let newSavedKeys = currentConfig.savedKeys || [];
                  
                  if (invalidKeys && invalidKeys.length > 0) {
                    newSavedKeys = newSavedKeys.filter(sk => !invalidKeys.includes(sk.key));
                  }
                  newSavedKeys = newSavedKeys.map((k, idx) => ({ ...k, name: `S${idx + 1}` }));
                  
                  let finalNewKey = newKey || currentConfig.apiKey;
                  if (!newKey && failedKeys && failedKeys.includes(finalNewKey)) {
                    finalNewKey = newSavedKeys.length > 0 ? newSavedKeys[0].key : '';
                  }
                  
                  return {
                    ...prev,
                    apiConfigs: {
                      ...prev.apiConfigs,
                      [provider]: {
                        ...currentConfig,
                        apiKey: finalNewKey,
                        savedKeys: newSavedKeys
                      }
                    }
                  };
                });
              }, 
              abortController.signal
            );

            const durationMs = Date.now() - itemStartTime;
            return { id: item.id, status: 'done' as const, result, processingTimeMs: durationMs };
          } catch (err: any) {
            const durationMs = Date.now() - itemStartTime;
            if (err.name === 'AbortError') {
              return { id: item.id, status: 'cancelled' as const, processingTimeMs: durationMs };
            }
            return { id: item.id, status: 'error' as const, error: err instanceof Error ? err.message : 'Processing failed', processingTimeMs: durationMs };
          } finally {
            abortControllersRef.current.delete(item.id);
          }
        });

        // Wait for all 5 items in this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Deduct credits for successfully processed files
        const successCount = batchResults.filter(r => r.status === 'done').length;
        if (successCount > 0 && currentUser?.uid) {
          deductCredits(
            currentUser.uid, 
            successCount * COST_PER_FILE, 
            `Generated SEO metadata for ${successCount} file(s)`
          ).catch((e) => console.warn('Credit deduction error:', e));
        }

        // Atomically update ALL 5 files from PROCESSING to SUCCESS together at the exact same moment!
        const resultMap = new Map(batchResults.map(r => [r.id, r]));

        setFiles(prev => prev.map(f => {
          const itemRes = resultMap.get(f.id);
          if (!itemRes || itemRes.status === 'cancelled') return f;
          if (itemRes.status === 'done') {
            return { ...f, status: 'done', result: itemRes.result, processingTimeMs: itemRes.processingTimeMs };
          }
          if (itemRes.status === 'error') {
            return { ...f, status: 'error', error: itemRes.error, processingTimeMs: itemRes.processingTimeMs };
          }
          return f;
        }));

        // Remove batch items from processingFiles together
        setProcessingFiles(prev => {
          const next = new Set(prev);
          chunk.forEach(item => next.delete(item.id));
          return next;
        });
      }
    } finally {
      // Entire session finished across all chunks ("process all ok")
      setIsProcessingSession(false);
    }
  };

  const handleProcess = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const toProcess = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (toProcess.length === 0) return;

    // Check if user has enough credits
    const requiredCredits = toProcess.length * COST_PER_FILE;
    if (userCredits.credits < requiredCredits) {
      setInsufficientFilesCount(toProcess.length);
      setIsCreditModalOpen(true);
      return;
    }

    await processBatch(toProcess);
  };

  const handleRegenerate = async (id: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (userCredits.credits < COST_PER_FILE) {
      setInsufficientFilesCount(1);
      setIsCreditModalOpen(true);
      return;
    }
    const fileToProcess = files.find(f => f.id === id);
    if (!fileToProcess) return;
    await processBatch([fileToProcess]);
  };

  const handlePlatformChange = async (plat: Platform) => {
    const newSettings = { 
      ...settings, 
      platform: plat,
      descriptionEnabled: plat === 'shutterstock' || plat === 'general'
    };
    setSettings(newSettings);
    
    // Auto-reprocess done items for the new marketplace if authenticated
    const doneFiles = files.filter(f => f.status === 'done');
    if (doneFiles.length > 0 && currentUser) {
      processBatch(doneFiles, newSettings);
    }
  };

  const handleToggleExactRecreation = async (enabled: boolean) => {
    const newSettings = { 
      ...settings, 
      exactRecreation: enabled,
      avoidSimilarity: !enabled
    };
    setSettings(newSettings);
    
    // If in prompt mode and we have files that were already processed, re-process with the new mode
    if (tab === 'prompt') {
      const doneFiles = files.filter(f => f.status === 'done');
      if (doneFiles.length > 0) {
        processBatch(doneFiles, newSettings);
      }
    }
  };

  const handleDownloadSinglePrompt = (file: MediaFile) => {
    if (!file.result?.prompt) return;
    const promptText = file.result.prompt.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const content = [
      `# Prompt for: ${file.file.name}`,
      file.result.detectedSubject ? `Subject: ${file.result.detectedSubject}` : null,
      file.result.detectedStyle ? `Style: ${file.result.detectedStyle}` : null,
      '',
      '## Master Prompt:',
      promptText,
      '',
      '## Midjourney v6.1 Command:',
      `/imagine prompt: ${promptText} --v 6.1 --style raw`,
      file.result.negativePrompt ? `\n## Negative Prompt:\n${file.result.negativePrompt}` : null,
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const baseName = file.file.name.replace(/\.[^/.]+$/, '');
    link.setAttribute("href", url);
    link.setAttribute("download", `${baseName}_prompt.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getOutputFilename = (originalName: string) => {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    if (vectorFormat === 'EPS') return `${baseName}.eps`;
    if (vectorFormat === 'AI') return `${baseName}.ai`;
    return originalName;
  };

  const handleDownloadSingleMetadata = (file: MediaFile) => {
    if (!file.result) return;
    const outName = getOutputFilename(file.file.name);
    const p = settings.platform;
    
    const safeTitle = (file.result.title || '').replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
    let contentParts: string[] = [];
    if (p === 'adobe') {
      contentParts = [
        `Title: ${safeTitle}`,
        `Keywords: ${file.result.keywords || ''}`
      ];
    } else if (p === 'shutterstock') {
      const desc = file.result.description || file.result.title || '';
      contentParts = [
        `Description: ${desc}`,
        `Keywords: ${file.result.keywords || ''}`
      ];
    } else if (p === 'freepik') {
      contentParts = [
        `Title: ${safeTitle}`,
        `Keywords: ${file.result.keywords || ''}`
      ];
    } else {
      // General: Title, Keywords, Description
      contentParts = [
        `Title: ${safeTitle}`,
        `Keywords: ${file.result.keywords || ''}`,
        `Description: ${file.result.description || ''}`
      ];
    }

    const content = contentParts.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const baseName = outName.replace(/\.[^/.]+$/, '');
    link.setAttribute("href", url);
    link.setAttribute("download", `${baseName}_${p}_metadata.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const activeMode = (tab === 'admin' || tab === 'builder') ? 'metadata' : tab as AppMode;
    const doneFiles = files.filter(f => f.status === 'done' && f.result);
    if (!doneFiles.length) return;

    if (activeMode === 'prompt') {
      const promptTexts = doneFiles.map(f => {
        const p = f.result?.prompt || '';
        return p.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }).filter(Boolean);
      
      // 2 line space means 3 carriage returns
      const txtString = promptTexts.join('\r\n\r\n\r\n');
      const blob = new Blob([txtString], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `MainulMetaGen_Prompts_${new Date().getTime()}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const data = doneFiles.map(f => {
      const r = f.result!;
      const outName = getOutputFilename(f.file.name);
      
      const safeTitle = (r.title || '').replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
      
      // Metadata Mode mapping based strictly on Platform
      if (settings.platform === 'adobe') {
        // Adobe Stock: Title, Keywords
        return {
          Filename: outName,
          Title: safeTitle,
          Keywords: r.keywords || ''
        };
      } else if (settings.platform === 'shutterstock') {
        // Shutterstock: Description, Keywords
        return {
          Filename: outName,
          Description: r.description || safeTitle || '',
          Keywords: r.keywords || ''
        };
      } else if (settings.platform === 'freepik') {
        // Freepik: Title, Keywords
        return {
          file_name: outName,
          title: safeTitle,
          keywords: r.keywords || ''
        };
      } else {
        // General: Title, Keywords, Description
        return {
          Filename: outName,
          Title: safeTitle,
          Keywords: r.keywords || '',
          Description: r.description || ''
        };
      }
    });

    const timestamp = new Date().getTime();
    exportToCSV(data, `MainulMetaGen_${activeMode}_${settings.platform}_${timestamp}.csv`);
  };

  

  return (
      <div className="min-h-screen bg-[#DFE2E8] dark:bg-[#131722] text-[#181D27] dark:text-[#E2E6F0] font-sans selection:bg-black/10 dark:selection:bg-white/20 relative transition-colors duration-300">
      
      <header className="bg-[#ECEEF4]/95 dark:bg-[#171C28]/95 backdrop-blur-md border-b border-zinc-300/70 dark:border-white/10 sticky top-0 z-50 shadow-2xs gpu-accelerated transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => setTab('landing')}
            className="flex items-center gap-2.5 text-left z-10 select-none group cursor-pointer"
            title="Go to Home"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shadow-md text-white dark:text-zinc-950 transition-all duration-300 group-hover:scale-105">
              <Rabbit size={20} strokeWidth={2.2} className="transition-transform duration-300 group-hover:-rotate-6" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 leading-none">
                <h1 className="font-display font-bold text-[19px] tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                  Melo
                </h1>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-400/80 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/25 px-2 py-0.5 rounded-full tracking-wider leading-none">
                  FREE
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 tracking-wider leading-none">
                By Mainul
              </span>
            </div>
          </div>

          {tab === 'landing' ? (
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <button
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                How it works
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('testimonials');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Testimonials
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('pricing');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('faq');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </button>
            </nav>
          ) : (
            <div className="absolute left-1/2 -translate-x-1/2 flex bg-[#D5D9E2] dark:bg-[#202738] p-1 rounded-full border border-zinc-300/60 dark:border-white/10 overflow-x-auto z-10 whitespace-nowrap max-w-[calc(100vw-140px)] sm:max-w-none scrollbar-none animate-in fade-in duration-200">
              <button
                onClick={() => setTab('metadata')}
                className={cn(
                  "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer",
                  tab === 'metadata' ? 'bg-[#ECEEF4] dark:bg-[#2A334A] text-zinc-900 dark:text-zinc-50 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <Settings size={15}/> <span>Metadata</span>
              </button>
              <button
                onClick={() => setTab('prompt')}
                className={cn(
                  "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer",
                  tab === 'prompt' ? 'bg-[#ECEEF4] dark:bg-[#2A334A] text-zinc-900 dark:text-zinc-50 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                 <ImageIcon size={15}/> <span>Image to Prompt</span>
              </button>
              <button
                onClick={() => setTab('tracker')}
                className={cn(
                  "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer",
                  tab === 'tracker' ? 'bg-[#ECEEF4] dark:bg-[#2A334A] text-zinc-900 dark:text-zinc-50 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <TrendingUp size={15}/> <span>Tracker</span>
              </button>
              <button
                onClick={() => setTab('calendar')}
                className={cn(
                  "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer",
                  tab === 'calendar' ? 'bg-[#ECEEF4] dark:bg-[#2A334A] text-zinc-900 dark:text-zinc-50 shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <CalendarDays size={15}/> <span>Event Calendar</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-full bg-[#D5D9E2] dark:bg-[#22293C] flex items-center justify-center text-zinc-800 dark:text-zinc-200 hover:bg-[#CBD0DB] dark:hover:bg-[#2A3248] transition-colors border border-zinc-300/60 dark:border-white/10 cursor-pointer shadow-2xs"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {tab === 'landing' ? (
              <button
                onClick={() => setTab('metadata')}
                className="flex items-center gap-1.5 px-4.5 sm:px-5 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs sm:text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap group"
                title="Open Metadata Workspace"
              >
                <span>Open App</span>
                <ArrowRight size={14} strokeWidth={2.4} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={() => setTab('landing')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#D5D9E2] dark:bg-[#22293C] text-zinc-700 dark:text-zinc-300 font-medium text-xs hover:bg-[#CBD0DB] dark:hover:bg-[#2A3248] transition-all border border-zinc-300/60 dark:border-white/10 cursor-pointer whitespace-nowrap shadow-2xs"
                title="Back to Landing Page"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span className="hidden sm:inline">Landing Page</span>
                <span className="sm:hidden">Home</span>
              </button>
            )}

            {/* User Account / Profile Section (Credits now located inside) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentUser) {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-zinc-300/80 dark:border-white/20 hover:border-zinc-500 dark:hover:border-white/50 overflow-hidden flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 group relative bg-[#DFE3EA] dark:bg-[#1E2536]"
                title={currentUser ? (currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'User Profile & Credits') : 'Sign In / Register with Gmail or Mobile'}
              >
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Avatar'} 
                    className="w-full h-full object-cover" 
                  />
                ) : currentUser ? (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-bold text-xs uppercase">
                    {(currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'U').slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  /* Styled avatar matching sneaker / creative creator avatar */
                  <div className="w-full h-full flex items-center justify-center bg-[#8EA838] dark:bg-[#688220] text-white">
                    <span className="text-sm select-none" role="img" aria-label="Sneaker Avatar">👟</span>
                  </div>
                )}
              </button>

              {/* User Account & Credits Dropdown Menu */}
              {currentUser && isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#ECEEF4] dark:bg-[#1E2536] border border-zinc-300/80 dark:border-white/10 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Account Header */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-zinc-300/60 dark:border-white/10">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (currentUser.displayName || currentUser.email || currentUser.phoneNumber || 'U').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                        {currentUser.displayName || 'Melo Creator'}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {currentUser.email || currentUser.phoneNumber || 'Authenticated User'}
                      </p>
                    </div>
                  </div>

                  {/* Dedicated Credits Section inside Account */}
                  <div className="bg-white/80 dark:bg-black/35 rounded-xl p-3.5 mb-3 border border-amber-500/20 dark:border-amber-500/20 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Zap size={12} className="text-amber-500 fill-amber-500" />
                        Credit Balance
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {userCredits.plan ? userCredits.plan.toUpperCase() : 'FREE'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-zinc-900 dark:text-white tracking-tight">
                          {userCredits.credits}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          Credits
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        Used: <strong className="text-zinc-700 dark:text-zinc-200">{userCredits.creditsUsed}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setInsufficientFilesCount(undefined);
                        setIsCreditModalOpen(true);
                      }}
                      className="w-full py-2 text-xs font-bold text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 rounded-xl transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      <Zap size={13} className="fill-zinc-950" />
                      <span>Manage Credits & Top-up</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAdminUsersModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all cursor-pointer text-left border border-indigo-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span>Admin Users & Credits</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 uppercase font-mono">
                          Live
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        signOut(auth).catch(() => {});
                        setCurrentUser(null);
                        try {
                          localStorage.removeItem('melo_creator_auth');
                        } catch {}
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", tab === 'landing' || tab === 'reviews' ? "pt-6 sm:pt-8 pb-2" : "py-8")}>
        {tab === 'landing' ? (
          <LandingPage 
            onStartMetadata={() => setTab('metadata')}
            onStartPrompt={() => setTab('prompt')}
            onOpenCalendar={() => setTab('calendar')}
            onViewAllReviews={() => setTab('reviews')}
          />
        ) : tab === 'reviews' ? (
          <AllReviewsPage 
            onBack={() => setTab('landing')}
            onStartMetadata={() => setTab('metadata')}
          />
        ) : tab === 'calendar' ? (
          <EventCalendar 
            onUseInPromptTab={(prompt) => {
              setSettings(s => ({ ...s, customPromptEnabled: true, customPromptText: prompt }));
              setTab('prompt');
            }}
          />
        ) : tab === 'tracker' ? (
          <TrackerSection 
            onStartMetadata={() => setTab('metadata')}
            onStartPrompt={() => setTab('prompt')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Settings */}
          <div className="w-full lg:col-span-4 flex-shrink-0 space-y-6">
            <div className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/60 dark:border-white/10 rounded-3xl p-6 shadow-sm transition-colors duration-300">
              <div className="space-y-6">
                
                {tab === 'metadata' ? (
                  <>
                    {/* SEO Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Settings size={20} className="text-zinc-900 dark:text-zinc-50" />
                      </div>
                      <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 tracking-wide uppercase">
                        SEO CUSTOMIZATION
                      </h2>
                    </div>

                    {/* Platform Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">Platform Target</label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlatformChange('adobe')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border-2 cursor-pointer",
                            settings.platform === 'adobe' 
                              ? "bg-zinc-200 dark:bg-white/10 border-zinc-400 dark:border-white text-zinc-900 dark:text-zinc-50 shadow-xs" 
                              : "bg-zinc-50 dark:bg-black/40 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                          )}
                        >
                          <span className="text-lg font-bold mb-0.5">A</span>
                          <span className="text-[9px] font-bold tracking-wider">ADOBE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlatformChange('shutterstock')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border-2 cursor-pointer",
                            settings.platform === 'shutterstock' 
                              ? "bg-zinc-200 dark:bg-white/10 border-zinc-400 dark:border-white text-zinc-900 dark:text-zinc-50 shadow-xs" 
                              : "bg-zinc-50 dark:bg-black/40 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                          )}
                        >
                          <span className="text-lg font-bold mb-0.5">S</span>
                          <span className="text-[9px] font-bold tracking-wider">SHUTTER</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlatformChange('freepik')}
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border-2 cursor-pointer",
                            settings.platform === 'freepik' 
                              ? "bg-zinc-200 dark:bg-white/10 border-zinc-400 dark:border-white text-zinc-900 dark:text-zinc-50 shadow-xs" 
                              : "bg-zinc-50 dark:bg-black/40 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                          )}
                        >
                          <span className="text-lg font-bold mb-0.5">F</span>
                          <span className="text-[9px] font-bold tracking-wider">FREEPIK</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlatformChange('general')}
                          title="Universal / General Market: Generates Title, Keywords, and Description"
                          className={cn(
                            "flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border-2 cursor-pointer",
                            settings.platform === 'general' 
                              ? "bg-zinc-200 dark:bg-white/10 border-zinc-400 dark:border-white text-zinc-900 dark:text-zinc-50 shadow-xs" 
                              : "bg-zinc-50 dark:bg-black/40 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                          )}
                        >
                          <span className="text-lg font-bold mb-0.5">G</span>
                          <span className="text-[9px] font-bold tracking-wider">GENERAL</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Prompt Config Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Settings size={20} className="text-zinc-900 dark:text-zinc-50" />
                      </div>
                      <h2 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50 tracking-wide uppercase">
                        PROMPT CONFIG
                      </h2>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/5 w-full my-6" />

                <div className="space-y-6">
                  {tab === 'metadata' && (
                    <>
                      <div className="space-y-6">
                        {settings.platform !== 'shutterstock' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <label className="text-zinc-500 dark:text-zinc-400 font-bold text-[11px] tracking-wider">Title Words (Long & Rich)</label>
                              <span className="text-zinc-900 dark:text-zinc-50 font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 text-zinc-900 dark:text-zinc-50 rounded text-xs">{settings.titleWords}</span>
                            </div>
                            <input 
                              type="range" min="18" max="35" 
                              value={settings.titleWords}
                              onChange={(e) => setSettings(s => ({ ...s, titleWords: parseInt(e.target.value) }))}
                              className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 dark:bg-black/50 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <label className="text-zinc-500 dark:text-zinc-400 font-bold text-[11px] tracking-wider">Keywords count (40+ tags)</label>
                            <span className="text-zinc-900 dark:text-zinc-50 font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 text-zinc-900 dark:text-zinc-50 rounded text-xs">{settings.keywordWords}</span>
                          </div>
                          <input 
                            type="range" min="40" max="50"
                            value={Math.max(40, settings.keywordWords || 50)}
                            onChange={(e) => setSettings(s => ({ ...s, keywordWords: parseInt(e.target.value) }))}
                            className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 dark:bg-black/50 rounded-full appearance-none cursor-pointer"
                          />
                        </div>

                        {(settings.platform === 'shutterstock' || settings.platform === 'general') && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <label className="text-zinc-500 dark:text-zinc-400 font-bold text-[11px] tracking-wider">
                                Description Words
                              </label>
                              <span className="text-zinc-900 dark:text-zinc-50 font-mono bg-zinc-100 dark:bg-white/10 px-2 py-0.5 text-zinc-900 dark:text-zinc-50 rounded text-xs">{settings.descriptionWords}</span>
                            </div>
                            <input 
                              type="range" min="10" max="60"
                              value={settings.descriptionWords}
                              onChange={(e) => setSettings(s => ({ ...s, descriptionWords: parseInt(e.target.value), descriptionEnabled: true }))}
                              className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 dark:bg-black/50 rounded-full appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Prompt Specific Controls */}
                  {tab === 'prompt' && (
                    <div className="space-y-4 mb-2">
                      {/* Same Image Replica Toggle Card */}
                      <div className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-300",
                        settings.exactRecreation
                          ? "bg-indigo-50/90 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5"
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "p-2 rounded-xl transition-colors",
                              settings.exactRecreation
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            )}>
                              <Sparkles size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                  Same Image Prompt
                                </span>
                                <span className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase",
                                  settings.exactRecreation
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                )}>
                                  {settings.exactRecreation ? "ON" : "OFF"}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                                {settings.exactRecreation
                                  ? "Exact recreation prompt of the input image"
                                  : "Standard prompt with natural variation"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={settings.exactRecreation}
                            onClick={() => handleToggleExactRecreation(!settings.exactRecreation)}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              settings.exactRecreation ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                settings.exactRecreation ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Toggles */}
                  <div className={cn("space-y-3", tab === 'metadata' ? "border-t border-white/5 pt-5" : "border-t border-zinc-200 dark:border-white/5 pt-3")}>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Modifiers</label>

                    {tab === 'prompt' && (
                      <ToggleRow 
                        label="Anti-Similar (Balanced Variation)" 
                        checked={!settings.exactRecreation && (settings.avoidSimilarity !== false)}
                        onChange={(v) => {
                          handleToggleExactRecreation(!v);
                        }}
                      >
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                          {settings.exactRecreation 
                            ? "Standard variation mode." 
                            : "High fidelity to original image with subtle angle & lighting variation to avoid duplicate flags."}
                        </p>
                      </ToggleRow>
                    )}
                    
                    {tab === 'metadata' && (
                      <ToggleRow 
                        label="Single Word Keywords" 
                        checked={settings.singleWordKeywords}
                        onChange={(v) => setSettings(s => ({ ...s, singleWordKeywords: v }))}
                      />
                    )}

                    <ToggleRow 
                      label="Silhouette" 
                      checked={settings.silhouette}
                      onChange={(v) => setSettings(s => ({ ...s, silhouette: v }))}
                    />

                    <ToggleRow 
                      label="Transparent Background" 
                      checked={settings.transparentBackground}
                      onChange={(v) => setSettings(s => ({ ...s, transparentBackground: v }))}
                    />

                    <ToggleRow 
                      label="White Background" 
                      checked={settings.whiteBackground}
                      onChange={(v) => setSettings(s => ({ ...s, whiteBackground: v }))}
                    />

                    <ToggleRow 
                      label="Extra Text" 
                      checked={settings.extraText || false}
                      onChange={(v) => setSettings(s => ({ ...s, extraText: v }))}
                    />
                  </div>
                  </div>
                </div>
              </div>
            </div>

{/* Right Column: Upload & Results */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Upload Zone */}
              <div 
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative group transition-all duration-300 active:scale-[0.99] cursor-pointer mb-6"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-zinc-100 dark:bg-white/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative h-full border border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 overflow-hidden bg-[#ECEEF4]/90 dark:bg-[#171C28]/90 backdrop-blur-xl border-zinc-300/80 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20 hover:bg-[#E5E8EF] dark:hover:bg-[#1C2232] py-8 px-6 md:py-10">
                  <input 
                     type="file" multiple ref={fileInputRef} className="hidden"
                     accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml,video/mp4,video/quicktime,.eps,.ai,.svg"
                     onChange={(e) => handleFilesAdded(e.target.files)}
                  />
                  
                  {/* Upload Icon inside rounded box */}
                  <div className="bg-[#DFE3EA] dark:bg-[#202738] border border-zinc-300/60 dark:border-white/10 p-5 rounded-2xl shadow-2xs group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500 mb-6 flex items-center justify-center w-20 h-20">
                    <UploadCloud size={32} className="text-zinc-900 dark:text-zinc-50" strokeWidth={2} />
                  </div>
                  
                  {/* Category Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-[#DFE3EA] dark:bg-[#202738] text-zinc-800 dark:text-zinc-200 rounded-full text-sm font-bold tracking-wide shadow-2xs border border-zinc-300/50 dark:border-white/5">
                      <ImageIcon size={16} className="text-zinc-900 dark:text-zinc-50" /> Images
                    </span>
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-[#DFE3EA] dark:bg-[#202738] text-zinc-800 dark:text-zinc-200 rounded-full text-sm font-bold tracking-wide shadow-2xs border border-zinc-300/50 dark:border-white/5">
                      <Video size={16} className="text-zinc-900 dark:text-zinc-50" /> Videos
                    </span>
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-[#DFE3EA] dark:bg-[#202738] text-zinc-800 dark:text-zinc-200 rounded-full text-sm font-bold tracking-wide shadow-2xs border border-zinc-300/50 dark:border-white/5">
                      <FileCode2 size={16} className="text-zinc-900 dark:text-zinc-50" /> SVG
                    </span>
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-[#DFE3EA] dark:bg-[#202738] text-zinc-800 dark:text-zinc-200 rounded-full text-sm font-bold tracking-wide shadow-2xs border border-zinc-300/50 dark:border-white/5">
                      <FileType2 size={16} className="text-zinc-900 dark:text-zinc-50" /> EPS & AI
                    </span>
                  </div>

                  <h3 className="text-[17px] font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Drag & drop files here, or <span className="border-b border-zinc-400 dark:border-zinc-500 pb-0.5">browse</span>
                  </h3>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-3 text-center font-medium">
                    Supports image, video, SVG, EPS & AI • Unlimited files
                  </p>
                </div>
              </div>

              {/* Status Summary Bar theme-reliable */}
              <div className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/60 dark:border-white/10 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm mb-6 transition-colors duration-300">
                <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100 font-bold text-sm tracking-wide">
                  <span className="text-zinc-900 dark:text-zinc-200">Generated Data</span>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <span className="bg-[#DFE3EA] dark:bg-[#22293C] text-zinc-700 dark:text-zinc-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-zinc-300/50 dark:border-white/5">
                    {files.length} ITEMS
                  </span>
                </div>
                <div className="flex items-center gap-4 sm:gap-7 text-xs font-bold tracking-wider flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-zinc-500 dark:text-zinc-400">SUCCESS:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{String(files.filter(f => f.status === 'done').length).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse" />
                    <span className="text-zinc-500 dark:text-zinc-400">PROCESSING:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{String(files.filter(f => f.status === 'processing').length).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-zinc-500 dark:text-zinc-400">FAILED:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">{String(files.filter(f => f.status === 'error').length).padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-3 sm:border-l border-zinc-300/70 dark:border-white/10">
                    <Clock size={13} className={cn("text-amber-500", isProcessing && "animate-spin")} />
                    <span className="text-zinc-500 dark:text-zinc-400">TIME:</span>
                    <span className={cn(
                      "font-mono px-2 py-0.5 rounded-md text-xs font-bold transition-all",
                      isProcessing 
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse border border-amber-500/30" 
                        : lastProcessingTime 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {isProcessing 
                        ? formatDuration(elapsedTime) 
                        : lastProcessingTime 
                          ? formatDuration(lastProcessingTime) 
                          : '0m 00s'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-2 min-h-[48px] flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <h2 className="text-lg sm:text-[22px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
                    Files
                    <span className="bg-[#D5D9E2] dark:bg-[#202738] text-zinc-900 dark:text-zinc-50 text-[10px] px-2 py-1 rounded-full border-none font-bold tabular-nums">
                      {files.length} ITEMS
                    </span>
                  </h2>

                  {/* Vector Format Dropdown - ONLY in Metadata tab */}
                  {tab === 'metadata' && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsVectorDropdownOpen(!isVectorDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ECEEF4] dark:bg-[#1C2232] hover:bg-[#DFE3EA] dark:hover:bg-[#22293C] text-zinc-800 dark:text-zinc-100 rounded-xl border border-zinc-300/70 dark:border-zinc-700/80 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none"
                      >
                        <FileCode2 size={13} className="text-zinc-500 dark:text-zinc-400" />
                        <span>{vectorFormat}</span>
                        <ChevronDown size={12} className={cn("text-zinc-500 dark:text-zinc-400 transition-transform", isVectorDropdownOpen && "rotate-180")} />
                      </button>

                      {isVectorDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-32 bg-[#ECEEF4] dark:bg-[#1E2536] border border-zinc-300/70 dark:border-zinc-700/80 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                          {(['None', 'EPS', 'AI'] as const).map((fmt) => {
                            const isSelected = vectorFormat === fmt;
                            return (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => {
                                  setVectorFormat(fmt);
                                  setIsVectorDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer",
                                  isSelected 
                                    ? "bg-[#DFE3EA] dark:bg-[#262F44] text-emerald-600 dark:text-emerald-400" 
                                    : "text-zinc-700 dark:text-zinc-300 hover:bg-[#DFE3EA] dark:hover:bg-[#262F44] hover:text-zinc-900 dark:hover:text-white"
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <FileCode2 size={13} className={isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"} />
                                  {fmt}
                                </span>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'prompt' && (
                    <button
                      type="button"
                      onClick={() => handleToggleExactRecreation(!settings.exactRecreation)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-2xs select-none shrink-0",
                        settings.exactRecreation
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                          : "bg-[#DFE3EA] hover:bg-[#D5D9E2] dark:bg-[#202738] dark:hover:bg-[#283146] text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-white/10"
                      )}
                      title={settings.exactRecreation ? "Same Image mode is ON (click to disable)" : "Click to enable Same Image mode"}
                    >
                      <Sparkles size={12} className={settings.exactRecreation ? "text-white" : "text-zinc-400"} />
                      <span>Recreate Same Image:</span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        settings.exactRecreation ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                      )}>
                        {settings.exactRecreation ? "ON" : "OFF"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
                  {files.some(f => f.status === 'error') && (
                    <button 
                      onClick={() => {
                        const failedFiles = files.filter(f => f.status === 'error');
                        processBatch(failedFiles);
                      }}
                      className="px-3 py-1.5 bg-[#ECEEF4] dark:bg-[#1C2232] hover:bg-[#DFE3EA] dark:hover:bg-[#22293C] text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-zinc-300/60 dark:border-white/10 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <RefreshCw size={13} /> RETRY FAILED
                    </button>
                  )}
                  {files.length > 0 && (
                    <button 
                      onClick={clearAllFiles}
                      className="px-3 py-1.5 bg-[#ECEEF4] dark:bg-[#1C2232] hover:bg-[#DFE3EA] dark:hover:bg-[#22293C] text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-zinc-300/60 dark:border-white/10 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={13} /> Clear All
                    </button>
                  )}
                  {files.some(f => f.status === 'done') && (
                    <button 
                      onClick={handleDownloadCSV}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      <Download size={14} /> Export {tab === 'prompt' ? 'TXT' : 'CSV'}
                    </button>
                  )}
                  {(() => {
                    const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
                    const hasEnoughCredits = userCredits.credits >= pendingCount;

                    return (
                      <button 
                        onClick={() => {
                          if (!currentUser) {
                            setIsAuthModalOpen(true);
                            return;
                          }
                          if (!hasEnoughCredits) {
                            setInsufficientFilesCount(pendingCount);
                            setIsCreditModalOpen(true);
                            return;
                          }
                          handleProcess();
                        }}
                        disabled={files.length === 0 || pendingCount === 0}
                        className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed active:scale-95 cursor-pointer shrink-0"
                        title={!currentUser ? "Login required to process files" : !hasEnoughCredits ? "Insufficient credits - Click to recharge" : "Process eligible files"}
                      >
                        {isProcessing ? (
                          <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900 rounded-full animate-spin"/> Processing...</>
                        ) : !currentUser ? (
                          <><Lock size={13} /> Process All (Login Required)</>
                        ) : !hasEnoughCredits ? (
                          <><Zap size={13} className="text-amber-400 fill-amber-400" /> Need {pendingCount} Credits (Recharge)</>
                        ) : (
                          <><Zap size={14} className="fill-white dark:fill-zinc-900" /> Process All ({pendingCount} {pendingCount === 1 ? 'Credit' : 'Credits'})</>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Notice when files uploaded but user not logged in */}
              {!currentUser && files.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Lock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100">Authentication Required</p>
                      <p className="text-zinc-600 dark:text-zinc-300 text-xs">Please sign in with Gmail, Email, or Mobile to process assets and generate metadata.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <span>Login with Gmail / Mobile</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Results List */}
              <div className="space-y-12">
                <AnimatePresence>
                  {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
                    <div
                      key={groupName}
                      className="space-y-4"
                    >
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-50 pl-3 border-l-2 border-zinc-900 dark:border-zinc-50 py-1">
                        {groupName} <span className="text-zinc-500 dark:text-zinc-400 ml-2 font-mono">({(groupFiles as MediaFile[]).length})</span>
                      </h3>
                      <div className="space-y-6">
                        {(groupFiles as MediaFile[]).map(file => (
                          <div 
                            key={file.id} 
                            className="fast-card bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm dark:shadow-xl transition-colors duration-200"
                          >
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                                {/* LEFT COLUMN: Source Image */}
                                <div className="flex flex-col h-full">
                                  <div className="flex items-center justify-between mb-3 px-0.5">
                                    <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                      Source Image:
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      {/* Status Badge */}
                                      <div className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border",
                                        file.status === 'pending' && "bg-[#DFE3EA] dark:bg-[#161B26] text-zinc-600 dark:text-zinc-400 border-zinc-300/60 dark:border-white/10",
                                        file.status === 'processing' && "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 animate-pulse",
                                        file.status === 'done' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                                        file.status === 'error' && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                      )}>
                                        {file.status === 'pending' && 'Ready'}
                                        {file.status === 'processing' && (
                                          <>
                                            <div className="w-2.5 h-2.5 border-2 border-t-amber-500 dark:border-t-amber-400 rounded-full animate-spin border-transparent" />
                                            <span>Processing</span>
                                          </>
                                        )}
                                        {file.status === 'done' && (
                                          <>
                                            <CheckCircle2 size={12} strokeWidth={2.5} />
                                            <span>Completed</span>
                                          </>
                                        )}
                                        {file.status === 'error' && (
                                          <>
                                            <AlertCircle size={12} strokeWidth={2.5} />
                                            <span>Error</span>
                                          </>
                                        )}
                                      </div>

                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeFile(file.id);
                                        }}
                                        title="Remove asset"
                                        className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Source Image Frame */}
                                  <div 
                                    onClick={() => {
                                      setViewingFileId(file.id);
                                      setZoomLevel(1);
                                    }}
                                    className="relative rounded-xl overflow-hidden border border-zinc-300/70 dark:border-white/10 bg-[#DFE3EA] dark:bg-[#141824] flex items-center justify-center min-h-[260px] max-h-[380px] group/preview cursor-pointer shadow-2xs dark:shadow-md"
                                  >
                                    {file.previewUrl ? (
                                      file.file.type.startsWith('video/') ? (
                                        <video 
                                          src={file.previewUrl} 
                                          className="w-full h-full max-h-[360px] object-cover rounded-xl"
                                          muted loop autoPlay
                                        />
                                      ) : (
                                        <img 
                                          src={file.previewUrl} 
                                          alt={file.file.name} 
                                          className="w-full h-full max-h-[360px] object-cover rounded-xl transition-transform duration-500 group-hover/preview:scale-105" 
                                        />
                                      )
                                    ) : (
                                      <div className="text-center p-6">
                                        <div className="w-16 h-16 mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 flex flex-col items-center justify-center p-2 mb-2 text-zinc-700 dark:text-zinc-300">
                                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 dark:black/40 mb-1 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                                            {file.file.name.split('.').pop()?.toUpperCase()}
                                          </span>
                                          <FileImage size={20} className="opacity-80" />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vector Asset</p>
                                      </div>
                                    )}

                                    {/* Enlarge Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/30 dark:bg-black/50 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center gap-1.5 transition-all duration-200 backdrop-blur-xs">
                                      <span className="px-3 py-1.5 bg-white/95 dark:bg-black/80 hover:bg-white dark:hover:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-md">
                                        <Eye size={14} /> Click to enlarge
                                      </span>
                                    </div>
                                  </div>

                                  {/* Asset Sub-details */}
                                  <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <span className="truncate max-w-full font-medium" title={getOutputFilename(file.file.name)}>{getOutputFilename(file.file.name)}</span>
                                  </div>
                                </div>

                                {/* RIGHT COLUMN: Generated Prompt / Results */}
                                <div className="flex flex-col h-full">
                                  <div className="flex items-center justify-between mb-3 px-0.5">
                                    <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                      {tab === 'prompt' ? 'Generated Prompt:' : 'Generated Metadata:'}
                                    </h3>

                                  </div>

                                  {/* Inner Content Box (Responsive Theme Matching Image.png) */}
                                  <div className="bg-[#DFE3EA]/90 dark:bg-[#151A26] border border-zinc-300/60 dark:border-white/10 rounded-xl p-5 md:p-6 flex flex-col justify-between flex-1 min-h-[260px] md:min-h-[320px] shadow-2xs relative transition-colors duration-300">
                                    {file.status === 'error' ? (
                                      <div className="my-auto py-6 text-center space-y-3">
                                        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 mb-1">
                                          <AlertCircle size={24} />
                                        </div>
                                        <p className="text-sm text-red-600 dark:text-red-300 font-medium max-w-md mx-auto">{file.error}</p>
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                                          <button 
                                            onClick={() => setShowApiSettings(true)}
                                            className="px-3.5 py-2 bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                                          >
                                            <Key size={13} /> Configure API Key
                                          </button>
                                          <button 
                                            onClick={() => handleRegenerate(file.id)}
                                            className="px-3.5 py-2 bg-[#ECEEF4] dark:bg-[#1C2232] hover:bg-[#DFE3EA] dark:hover:bg-[#22293C] text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-zinc-300/70 dark:border-white/10 cursor-pointer shadow-2xs"
                                          >
                                            Retry Generation
                                          </button>
                                        </div>
                                      </div>
                                    ) : file.status === 'processing' ? (
                                      <div className="my-auto py-12 text-center space-y-4">
                                        <div className="w-8 h-8 mx-auto border-2 border-t-zinc-800 dark:border-t-white border-zinc-300 dark:border-zinc-700 rounded-full animate-spin" />
                                        <div className="space-y-1.5">
                                          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                            Analyzing visual design...
                                          </div>
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {settings.exactRecreation 
                                              ? "Forensic reverse-engineering 1:1 exact image prompt"
                                              : "Engineering production-grade prompt with balanced anti-similarity"}
                                          </p>
                                        </div>
                                      </div>
                                    ) : file.result ? (
                                      tab === 'prompt' ? (
                                        <>
                                          <div className="space-y-3.5">
                                            {/* The Main Prompt Text */}
                                            <p className="text-zinc-800 dark:text-zinc-200 text-sm md:text-[15px] font-normal leading-relaxed tracking-normal select-text">
                                              {file.result.prompt?.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || ''}
                                            </p>
                                          </div>

                                          {/* Bottom Action Buttons */}
                                          <div className="mt-6 pt-4 border-t border-zinc-300/60 dark:border-white/10 flex items-center justify-between gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const currentIsExact = file.result?.usedExactMode ?? settings.exactRecreation;
                                                const newExact = !currentIsExact;
                                                const newSettings = { ...settings, exactRecreation: newExact };
                                                setSettings(newSettings);
                                                processBatch([file], newSettings);
                                              }}
                                              className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shadow-2xs",
                                                (file.result?.usedExactMode ?? settings.exactRecreation)
                                                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
                                                  : "bg-[#D5D9E2] hover:bg-[#CBD0DB] dark:bg-[#202738] dark:hover:bg-[#2A334A] text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-white/10"
                                              )}
                                              title={(file.result?.usedExactMode ?? settings.exactRecreation) ? "Same Image mode is ON (click to disable)" : "Click to generate prompt in Same Image mode"}
                                            >
                                              <Sparkles size={13} className={(file.result?.usedExactMode ?? settings.exactRecreation) ? "text-indigo-500" : "text-zinc-400"} />
                                              <span>{(file.result?.usedExactMode ?? settings.exactRecreation) ? "Same Image (ON)" : "Recreate Same Image"}</span>
                                            </button>

                                            <div className="flex items-center gap-2">
                                              <ScreenshotCopyButton text={file.result.prompt?.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || ''} />
                                              <ScreenshotDownloadButton onDownload={() => handleDownloadSinglePrompt(file)} />
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        /* Metadata Mode in the same 2-column layout */
                                        <>
                                          <div className="space-y-3.5">
                                            {/* Stock Friendly Policy Compliance Badge */}
                                            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
                                              <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight">
                                                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                                <span>Stock-Friendly Verified</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
                                                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                                                  <Check size={10} className="text-emerald-500" /> Zero Trademarks
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                                                  <Check size={10} className="text-emerald-500" /> Adobe Safe
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                                                  <Check size={10} className="text-emerald-500" /> Ranked Tags
                                                </span>
                                              </div>
                                            </div>

                                            {/* Title: Shown for Adobe, Freepik, and General */}
                                            {settings.platform !== 'shutterstock' && (file.result.title || file.result.description) && (() => {
                                              const safeTitle = (file.result.title || file.result.description || '').replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
                                              return (
                                                <div className="space-y-1">
                                                  <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                                                    <span>
                                                      Title ({safeTitle.length} Chars • {safeTitle.split(/\s+/).filter(Boolean).length} Words)
                                                    </span>
                                                    <CopyButton text={safeTitle} />
                                                  </div>
                                                  <div className="bg-[#ECEEF4] dark:bg-[#1A202F] p-3 rounded-lg border border-zinc-300/60 dark:border-white/10">
                                                    <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold">
                                                      {safeTitle}
                                                    </p>
                                                  </div>
                                                </div>
                                              );
                                            })()}

                                            {/* Description: Shown for Shutterstock and General */}
                                            {(settings.platform === 'shutterstock' || settings.platform === 'general') && (file.result.description || file.result.title) && (
                                              <div className="space-y-1">
                                                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                                                  <span>
                                                    Description ({(file.result.description || file.result.title || '').length} Chars)
                                                  </span>
                                                  <CopyButton text={file.result.description || file.result.title || ''} />
                                                </div>
                                                <div className="bg-[#ECEEF4] dark:bg-[#1A202F] p-3 rounded-lg border border-zinc-300/60 dark:border-white/10">
                                                  <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold leading-relaxed">
                                                    {file.result.description || file.result.title}
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            {/* Keywords: Shown for all platforms */}
                                            {file.result.keywords && (
                                              <div className="space-y-1">
                                                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                                                  <span>
                                                    Keywords ({file.result.keywords.split(',').filter(Boolean).length} Tags)
                                                  </span>
                                                  <CopyButton text={file.result.keywords} />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 bg-[#ECEEF4] dark:bg-[#1A202F] p-3 rounded-lg border border-zinc-300/60 dark:border-white/10 max-h-32 overflow-y-auto">
                                                  {file.result.keywords.split(',').map((kw, idx) => (
                                                    <span
                                                      key={idx}
                                                      className="px-2 py-0.5 text-[11px] rounded border transition-colors bg-[#D5D9E2] dark:bg-[#22293C] text-zinc-700 dark:text-zinc-300 border-zinc-300/50 dark:border-white/5"
                                                    >
                                                      {kw.trim()}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          <div className="mt-6 pt-4 border-t border-zinc-300/60 dark:border-white/10 flex items-center justify-end gap-2">
                                            <ScreenshotCopyButton 
                                              text={(() => {
                                                const p = settings.platform;
                                                const titleVal = (file.result.title || file.result.description || '').replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
                                                const descVal = file.result.description || file.result.title || '';
                                                const kwVal = file.result.keywords || '';

                                                if (p === 'adobe' || p === 'freepik') {
                                                  return [
                                                    titleVal ? 'Title: ' + titleVal : '',
                                                    kwVal ? 'Keywords: ' + kwVal : ''
                                                  ].filter(Boolean).join('\n\n');
                                                } else if (p === 'shutterstock') {
                                                  return [
                                                    descVal ? 'Description: ' + descVal : '',
                                                    kwVal ? 'Keywords: ' + kwVal : ''
                                                  ].filter(Boolean).join('\n\n');
                                                } else {
                                                  // General: Title, Keywords, Description
                                                  return [
                                                    titleVal ? 'Title: ' + titleVal : '',
                                                    kwVal ? 'Keywords: ' + kwVal : '',
                                                    descVal ? 'Description: ' + descVal : ''
                                                  ].filter(Boolean).join('\n\n');
                                                }
                                              })()}
                                            />
                                            <ScreenshotDownloadButton onDownload={() => handleDownloadSingleMetadata(file)} />
                                          </div>
                                        </>
                                      )
                                    ) : (
                                      <div className="my-auto py-12 text-center text-zinc-400 dark:text-zinc-600 space-y-2">
                                        <Cpu size={36} className="mx-auto opacity-40" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Ready for generation</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </AnimatePresence>
                
                {files.length === 0 && (
                   <div className="text-center py-20 text-zinc-500 dark:text-zinc-400 font-medium border border-zinc-300/60 dark:border-white/10 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232]">
                     No files added yet. Start by uploading above.
                   </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox / Fullscreen File Viewer Modal */}
      <AnimatePresence>
        {viewingFileId !== null && (() => {
          const activeFile = files.find(f => f.id === viewingFileId);
          if (!activeFile) return null;

          const activeIndex = files.findIndex(f => f.id === viewingFileId);
          const hasPrev = activeIndex > 0;
          const hasNext = activeIndex < files.length - 1;

          const handlePrev = () => {
            if (hasPrev) {
              setViewingFileId(files[activeIndex - 1].id);
              setZoomLevel(1);
            }
          };

          const handleNext = () => {
            if (hasNext) {
              setViewingFileId(files[activeIndex + 1].id);
              setZoomLevel(1);
            }
          };

          const ext = activeFile.file.name.split('.').pop()?.toUpperCase() || '';
          const formattedSize = activeFile.file.size > 1024 * 1024
            ? (activeFile.file.size / (1024 * 1024)).toFixed(2) + ' MB'
            : (activeFile.file.size / 1024).toFixed(1) + ' KB';

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-2xl flex flex-col overflow-hidden select-none"
            >
              {/* Top Header Bar */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-3 truncate">
                  <span className="px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-white/20 text-black dark:text-white border border-black/30 dark:border-white/30 font-bold text-xs uppercase tracking-wider">
                    {ext}
                  </span>
                  <div className="truncate">
                    <h4 className="text-black dark:text-white font-bold text-base truncate max-w-md">{activeFile.file.name}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">{formattedSize} • {activeFile.file.type || 'Media Asset'}</p>
                  </div>
                </div>

                {/* Zoom & View Controls */}
                <div className="flex items-center gap-2">
                  {activeFile.previewUrl && !activeFile.file.type.startsWith('video/') && (
                    <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-200 dark:border-white/5 mr-2">
                      <button
                        onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-all"
                        title="Zoom Out"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <span className="text-xs font-mono font-bold text-black dark:text-white px-2 min-w-[50px] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-all"
                        title="Zoom In"
                      >
                        <ZoomIn size={18} />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-all ml-1"
                        title="Reset Zoom"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  )}

                  {activeFile.previewUrl && (
                    <a
                      href={activeFile.previewUrl}
                      download={activeFile.file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-2 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-700 text-black dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-zinc-200 dark:border-white/5 transition-all"
                    >
                      <Download size={16} /> Download
                    </a>
                  )}

                  <button
                    onClick={() => setViewingFileId(null)}
                    className="p-2 bg-black dark:bg-zinc-800/50/20 text-black dark:text-white hover:bg-black dark:bg-zinc-800/50 hover:text-white rounded-xl transition-all active:scale-95 border border-black/30 dark:border-white/30"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 relative flex items-center justify-center p-8 overflow-auto">
                {/* Previous File Arrow */}
                {hasPrev && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/80 dark:bg-zinc-900/80 hover:bg-black dark:bg-zinc-800/50 hover:text-white dark:hover:text-black text-black dark:text-white rounded-2xl border border-zinc-200 dark:border-white/5 shadow-xl transition-all duration-300 z-30 active:scale-90"
                    title="Previous Asset"
                  >
                    <ChevronLeft size={28} />
                  </button>
                )}

                {/* Next File Arrow */}
                {hasNext && (
                  <button
                    onClick={handleNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/80 dark:bg-zinc-900/80 hover:bg-black dark:bg-zinc-800/50 hover:text-white dark:hover:text-black text-black dark:text-white rounded-2xl border border-zinc-200 dark:border-white/5 shadow-xl transition-all duration-300 z-30 active:scale-90"
                    title="Next Asset"
                  >
                    <ChevronRight size={28} />
                  </button>
                )}

                {/* Display Preview */}
                <div className="max-w-full max-h-full flex items-center justify-center overflow-auto p-4 transition-all duration-300">
                  {activeFile.previewUrl ? (
                    activeFile.file.type.startsWith('video/') ? (
                      <video
                        src={activeFile.previewUrl}
                        controls
                        autoPlay
                        className="max-h-[75vh] max-w-full rounded-2xl shadow-xl border border-zinc-200 dark:border-white/5"
                      />
                    ) : (
                      <img
                        src={activeFile.previewUrl}
                        alt={activeFile.file.name}
                        style={{ transform: `scale(${zoomLevel})` }}
                        className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-xl border border-zinc-200 dark:border-white/5 transition-transform duration-200"
                      />
                    )
                  ) : (
                    <div className="text-center p-12 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl max-w-md shadow-xl">
                      <FileImage size={64} className="mx-auto text-black dark:text-white mb-4 opacity-80" />
                      <h3 className="text-xl font-bold text-black dark:text-white uppercase tracking-tight">{ext} Vector File</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
                        Vector source file loaded and ready for Gemini AI processing.
                      </p>
                      <div className="mt-6 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white font-mono text-xs">
                        {activeFile.file.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Info & Metadata Summary */}
              {activeFile.result && (
                <div className="px-6 py-4 bg-white/80 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-white/5 z-20 max-h-48 overflow-y-auto">
                  <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-start justify-between">
                    {/* Title: Adobe, Freepik, General */}
                    {settings.platform !== 'shutterstock' && (activeFile.result.title || activeFile.result.description) && (
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">
                          {settings.platform === 'adobe' ? 'Adobe Stock Title' : settings.platform === 'freepik' ? 'Freepik Title' : 'Title'}
                        </span>
                        <p className="text-black dark:text-white text-sm font-bold mt-1">{activeFile.result.title || activeFile.result.description}</p>
                      </div>
                    )}
                    {/* Description: Shutterstock, General */}
                    {(settings.platform === 'shutterstock' || settings.platform === 'general') && (activeFile.result.description || activeFile.result.title) && (
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">
                          {settings.platform === 'shutterstock' ? 'Shutterstock Description' : 'Description'}
                        </span>
                        <p className="text-black dark:text-white text-sm font-bold mt-1">{activeFile.result.description || activeFile.result.title}</p>
                      </div>
                    )}
                    {activeFile.result.keywords && (
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">Keywords</span>
                        <p className="text-zinc-900 dark:text-zinc-50 text-xs mt-1 line-clamp-2">{activeFile.result.keywords}</p>
                      </div>
                    )}
                    {activeFile.result.prompt && (
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">AI Prompt</span>
                        <p className="text-black dark:text-zinc-900 dark:text-zinc-50 text-xs mt-1 line-clamp-2 italic font-display">"{activeFile.result.prompt}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Auth Modal for Gmail & Mobile Phone Login */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={(user) => {
            if (user) {
              setCurrentUser(user);
              try {
                localStorage.setItem('melo_creator_auth', JSON.stringify({
                  uid: user.uid,
                  displayName: user.displayName || 'Melo Creator',
                  email: user.email || user.phoneNumber || 'Authenticated User',
                  photoURL: user.photoURL || null
                }));
              } catch {}
            }
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {/* Credit System Modal */}
      {isCreditModalOpen && (
        <CreditModal
          isOpen={isCreditModalOpen}
          onClose={() => {
            setIsCreditModalOpen(false);
            setInsufficientFilesCount(undefined);
          }}
          uid={currentUser?.uid || 'guest'}
          userCredits={userCredits}
          onOpenAuth={() => {
            setIsCreditModalOpen(false);
            setIsAuthModalOpen(true);
          }}
          isLoggedIn={!!currentUser}
          insufficientForCount={insufficientFilesCount}
        />
      )}

      {/* Admin User & Credit Tracker Modal */}
      {isAdmin && isAdminUsersModalOpen && (
        <AdminUsersModal
          isOpen={isAdminUsersModalOpen}
          onClose={() => setIsAdminUsersModalOpen(false)}
          currentAdminEmail={currentUser?.email || currentUser?.phoneNumber || 'Admin'}
        />
      )}
    </div>
  );
}

// Reusable Copy Button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
        copied 
          ? "bg-black/20 dark:bg-white/20 text-black dark:text-white border border-black/30 dark:border-white/30 shadow-sm" 
          : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-white border border-zinc-200 dark:border-white/5 hover:bg-white/10"
      )}
    >
      {copied ? (
        <><Check size={14} strokeWidth={3} /> Copied</>
      ) : (
        <><Copy size={14} strokeWidth={3} /> Copy</>
      )}
    </button>
  );
}

// Special Engine Copy Button component
function CopySpecialButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer shadow-2xs select-none",
        copied 
          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30" 
          : "bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 active:scale-95"
      )}
    >
      {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={2.5} />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}

// Screenshot-style Copy Button (Dark pill matching user image)
function ScreenshotCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-2xs select-none",
        copied 
          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40" 
          : "bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-300 hover:border-zinc-400 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700/80 dark:hover:border-zinc-500 active:scale-95"
      )}
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

// Screenshot-style Download Button (Dark pill matching user image)
function ScreenshotDownloadButton({ onDownload }: { onDownload: () => void }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-2xs select-none",
        downloaded
          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40"
          : "bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border-zinc-300 hover:border-zinc-400 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700/80 dark:hover:border-zinc-500 active:scale-95"
      )}
    >
      {downloaded ? <Check size={13} strokeWidth={2.5} /> : <Download size={13} strokeWidth={2} />}
      <span>{downloaded ? 'Downloaded' : 'Download'}</span>
    </button>
  );
}

// Reuseable toggle component
function ToggleRow({ label, checked, onChange, disabled, children }: { label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean, children?: React.ReactNode }) {
  return (
    <div className={cn("py-2", disabled && "opacity-60 cursor-not-allowed")}>
      <div 
        className={cn("flex items-center justify-between group", disabled ? "cursor-not-allowed" : "cursor-pointer")}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
      >
        <span className="text-zinc-900 dark:text-zinc-50 text-sm font-medium group-hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">{label}</span>
        <button 
          type="button"
          disabled={disabled}
          aria-label={label}
          className={cn(
            "w-10 h-5 rounded-full relative transition-colors duration-300 ease-in-out",
            checked ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700",
            disabled && "cursor-not-allowed"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ease-in-out",
            checked ? "translate-x-5 bg-white dark:bg-zinc-900 shadow-sm" : "translate-x-0 bg-white"
          )} />
        </button>
      </div>
      {children}
    </div>
  );
}


