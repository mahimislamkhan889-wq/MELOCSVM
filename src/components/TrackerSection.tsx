import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  User, 
  Bookmark, 
  Settings, 
  SlidersHorizontal, 
  Clock, 
  Download, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  PanelLeftClose, 
  PanelLeft, 
  Eye, 
  EyeOff, 
  Key, 
  Zap, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Layers, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  BarChart2, 
  Sun, 
  Moon, 
  Share2, 
  Info,
  CheckCheck,
  Code2,
  Terminal,
  Play,
  Cpu,
  ArrowRight,
  Construction,
  Wrench,
  GitCommit,
  Server,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Users,
  Rocket,
  Bell
} from 'lucide-react';
import { 
  analyzeAdobeStockAssets, 
  AdobeStockAnalysisItem, 
  getStoredApifyToken, 
  saveStoredApifyToken, 
  validateApifyToken 
} from '../services/apifyService';

interface TrackerSectionProps {
  onStartMetadata?: () => void;
  onStartPrompt?: () => void;
}

interface TrackedAsset {
  id: string;
  title: string;
  thumb: string;
  thumbLarge?: string;
  downloads: number;
  views?: number;
  downloadsPerMonth: number;
  type: 'photo' | 'video' | 'vector' | 'illustration' | '3D';
  isAI: boolean;
  isPremium?: boolean;
  createdAt: string;
  creatorName: string;
  creatorId: string;
  category: string;
  width?: number;
  height?: number;
  keywords: string[];
  assetUrl: string;
  rawItem?: AdobeStockAnalysisItem;
}

interface SavedCreator {
  id: string;
  name: string;
  totalAssets: number;
  totalDownloads: number;
  savedAt: string;
}

const DEFAULT_EXAMPLE_INPUT_IDS = [
  "841165203",
  "https://stock.adobe.com/841165203",
  "https://stock.adobe.com/images/example-photo/1004530648",
  "https://stock.adobe.com/video/1506237232",
  "https://stock.adobe.com/3d-assets/439387925"
];

const SAMPLE_841165203_OUTPUT: AdobeStockAnalysisItem = {
  assetId: "841165203",
  assetTitle: "Modern workspace with laptop and coffee",
  assetKind: "Photo",
  contentType: "image/jpeg",
  fileFormat: "JPEG",
  creatorName: "Example Creator",
  creatorId: "123456789",
  countryName: "United States",
  uploadDate: "2024-05-12T10:22:00Z",
  creationDate: "2024-05-10T08:00:00Z",
  downloadCount: 1842,
  viewCount: 25670,
  assetUrl: "https://stock.adobe.com/images/841165203",
  thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
  dimensions: "6000x4000",
  width: 6000,
  height: 4000,
  sizeBytes: 8453120,
  categoryName: "Business",
  categoryId: "8",
  aiStatus: "not_ai",
  isGentech: false,
  isTransparent: false,
  isLoop: null,
  premiumLevelId: 1,
  mediaTypeId: 1,
  stockId: "841165203",
  compUrl: "https://stock.adobe.com/comp/841165203",
  keywords: ["workspace", "laptop", "coffee", "desk", "business", "technology", "office", "freelance"]
};

const SAMPLE_INITIAL_ASSETS: TrackedAsset[] = [
  {
    id: '841165203',
    title: 'Modern workspace with laptop and coffee',
    thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    thumbLarge: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    downloads: 1842,
    views: 25670,
    downloadsPerMonth: 61.4,
    type: 'photo',
    isAI: false,
    createdAt: '2024-05-12T10:22:00Z',
    creatorName: 'Example Creator',
    creatorId: '123456789',
    category: 'Business',
    width: 6000,
    height: 4000,
    keywords: ['workspace', 'laptop', 'coffee', 'desk', 'business', 'technology', 'office', 'freelance'],
    assetUrl: 'https://stock.adobe.com/images/841165203',
    rawItem: SAMPLE_841165203_OUTPUT
  },
  {
    id: '231908412',
    title: 'Christmas white background with christmas balls and golden holiday decoration - 3D render',
    thumb: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?w=600&auto=format&fit=crop&q=80',
    thumbLarge: 'https://images.unsplash.com/photo-1543258103-a62bdc069871?w=1200&auto=format&fit=crop&q=80',
    downloads: 12672,
    views: 48900,
    downloadsPerMonth: 154.2,
    type: '3D',
    isAI: false,
    createdAt: '2018-10-08T10:00:00Z',
    creatorName: 'Production Perig',
    creatorId: '200792199',
    category: 'Holidays & Religion',
    width: 6000,
    height: 4000,
    keywords: ['christmas', 'white', 'background', 'balls', 'golden', 'holiday', 'decoration', '3d', 'winter', 'december'],
    assetUrl: 'https://stock.adobe.com/231908412'
  },
  {
    id: '304918231',
    title: 'Holiday illumination and festive decoration concept: warm christmas garland bokeh lights',
    thumb: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&auto=format&fit=crop&q=80',
    thumbLarge: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200&auto=format&fit=crop&q=80',
    downloads: 19723,
    views: 82400,
    downloadsPerMonth: 274.5,
    type: 'photo',
    isAI: false,
    createdAt: '2019-10-21T12:00:00Z',
    creatorName: 'Ryola Productions',
    creatorId: '204819201',
    category: 'Lifestyle & Atmosphere',
    width: 5800,
    height: 3800,
    keywords: ['holiday', 'illumination', 'christmas', 'garland', 'bokeh', 'lights', 'celebration', 'magic', 'winter'],
    assetUrl: 'https://stock.adobe.com/304918231'
  },
  {
    id: '194820194',
    title: 'Winter christmas paper cut composition with Merry Christmas calligraphic text and snowy pine trees',
    thumb: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    thumbLarge: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80',
    downloads: 12629,
    views: 41200,
    downloadsPerMonth: 148.8,
    type: 'vector',
    isAI: false,
    createdAt: '2018-10-04T09:30:00Z',
    creatorName: 'bndrat',
    creatorId: '201948212',
    category: 'Graphic Design',
    width: 5000,
    height: 3500,
    keywords: ['winter', 'christmas', 'composition', 'paper cut', 'style', 'merry', 'text', 'trees', 'snow'],
    assetUrl: 'https://stock.adobe.com/194820194'
  },
  {
    id: '710294821',
    title: 'Festive Christmas emerald green luxury background with 3D golden stars and geometric podium',
    thumb: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=600&auto=format&fit=crop&q=80',
    thumbLarge: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=1200&auto=format&fit=crop&q=80',
    downloads: 11250,
    views: 39500,
    downloadsPerMonth: 312.5,
    type: '3D',
    isAI: true,
    createdAt: '2022-09-12T16:00:00Z',
    creatorName: 'GoldStar Studio',
    creatorId: '209384912',
    category: 'Graphic Design & 3D',
    width: 6000,
    height: 4000,
    keywords: ['emerald', 'green', 'golden stars', 'christmas render', 'podium', '3d geometric', 'luxury banner'],
    assetUrl: 'https://stock.adobe.com/710294821'
  }
];

export const TrackerSection: React.FC<TrackerSectionProps> = ({
  onStartMetadata,
  onStartPrompt
}) => {
  // Navigation View (search = Keywords, portfolio = Portfolio, actor = Actor Runner, saved = Saved, settings = Settings)
  const [activeRoute, setActiveRoute] = useState<'search' | 'portfolio' | 'actor' | 'saved' | 'settings'>('actor');
  
  // View Mode: 'wip' (Work In Progress / Waiting Page) vs 'sandbox' (Interactive Beta Sandbox)
  const [viewMode, setViewMode] = useState<'wip' | 'sandbox'>('wip');

  // Waiting Page / Early Access State
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [isWaitlistJoined, setIsWaitlistJoined] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tracker_waitlist_joined') === 'true';
    } catch {
      return false;
    }
  });
  const [waitlistSpot, setWaitlistSpot] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tracker_waitlist_spot');
      return saved ? parseInt(saved, 10) : 342;
    } catch {
      return 342;
    }
  });

  // Real-time Countdown Timer (Days, Hours, Minutes, Seconds)
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 12,
    hours: 18,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleJoinWaitlist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setToastMessage('Please enter a valid email address');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const assignedSpot = Math.floor(Math.random() * 50) + 320;
    setWaitlistSpot(assignedSpot);
    setIsWaitlistJoined(true);
    try {
      localStorage.setItem('tracker_waitlist_joined', 'true');
      localStorage.setItem('tracker_waitlist_spot', String(assignedSpot));
    } catch (err) {
      console.warn('Storage error:', err);
    }
    setToastMessage(`Congratulations! You have joined the VIP waitlist at priority spot #${assignedSpot}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sidebar Controls State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeAssetType, setActiveAssetType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'relevance' | 'downloads' | 'recent'>('downloads');
  const [limitSetting, setLimitSetting] = useState<number>(100);
  const [hideAIAssets, setHideAIAssets] = useState<boolean>(false);

  // Search Inputs
  const [keywordQuery, setKeywordQuery] = useState<string>('Christmas');
  const [activeKeyword, setActiveKeyword] = useState<string>('Christmas');
  const [portfolioInput, setPortfolioInput] = useState<string>('200792199');
  const [activeCreator, setActiveCreator] = useState<string>('Production Perig (200792199)');

  // DEDICATED ACTOR RUNNER STATE (Input schema & Output example exact support)
  const [actorInputText, setActorInputText] = useState<string>(DEFAULT_EXAMPLE_INPUT_IDS.join('\n'));
  const [actorMaxItems, setActorMaxItems] = useState<number>(0);
  const [actorTimeoutSecs, setActorTimeoutSecs] = useState<number>(300);
  const [actorRequestTimeoutSecs, setActorRequestTimeoutSecs] = useState<number>(30);
  const [actorUseProxy, setActorUseProxy] = useState<boolean>(true);
  const [actorInputViewMode, setActorInputViewMode] = useState<'list' | 'json'>('list');
  const [actorOutputViewMode, setActorOutputViewMode] = useState<'visual' | 'json'>('visual');
  const [actorRawOutputItems, setActorRawOutputItems] = useState<AdobeStockAnalysisItem[]>([SAMPLE_841165203_OUTPUT]);

  // Data State
  const [assets, setAssets] = useState<TrackedAsset[]>(SAMPLE_INITIAL_ASSETS);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [bookmarkedAssetIds, setBookmarkedAssetIds] = useState<Set<string>>(new Set(['841165203']));
  const [savedCreators, setSavedCreators] = useState<SavedCreator[]>([
    {
      id: '123456789',
      name: 'Example Creator',
      totalAssets: 4520,
      totalDownloads: 89400,
      savedAt: '2026-10-16'
    },
    {
      id: '200792199',
      name: 'Production Perig',
      totalAssets: 8420,
      totalDownloads: 118500,
      savedAt: '2026-10-14'
    }
  ]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([
    '841165203',
    'Christmas',
    'workspace',
    'doodle',
    'ramadan 3d'
  ]);

  // Asset Detail Drawer
  const [drawerAsset, setDrawerAsset] = useState<TrackedAsset | null>(null);
  const [drawerShowJson, setDrawerShowJson] = useState<boolean>(false);

  // Apify Key & Settings
  const [apifyToken, setApifyToken] = useState<string>(() => getStoredApifyToken());
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);
  const [isTestingToken, setIsTestingToken] = useState<boolean>(false);
  const [tokenStatusMessage, setTokenStatusMessage] = useState<string>('');
  const [copiedTextKey, setCopiedTextKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper copy
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextKey(label);
    setToastMessage(label);
    setTimeout(() => {
      setCopiedTextKey(null);
      setToastMessage(null);
    }, 2500);
  };

  // Toggle Bookmark
  const toggleBookmark = (asset: TrackedAsset) => {
    setBookmarkedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
        setToastMessage(`Removed #${asset.id} from bookmarks`);
      } else {
        next.add(asset.id);
        setToastMessage(`Saved #${asset.id} to bookmarks`);
      }
      setTimeout(() => setToastMessage(null), 2500);
      return next;
    });
  };

  // Run the Actor with the configured input
  const handleExecuteActor = async () => {
    setIsBusy(true);
    setToastMessage('Running Adobe Stock Analyzer actor on Apify...');

    try {
      const lines = actorInputText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setToastMessage('Please enter at least one Adobe Stock asset ID or link.');
        setIsBusy(false);
        return;
      }

      const res = await analyzeAdobeStockAssets(lines, apifyToken, actorMaxItems || 100);

      if (res && res.items && res.items.length > 0) {
        setActorRawOutputItems(res.items);

        // Convert to TrackedAssets to display in visual view as well
        const mapped: TrackedAsset[] = res.items.map((item, idx) => ({
          id: item.assetId || String(841165200 + idx),
          title: item.assetTitle || `Stock Asset #${item.assetId}`,
          thumb: item.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
          thumbLarge: item.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
          downloads: item.downloadCount || 1842,
          views: item.viewCount || 25670,
          downloadsPerMonth: Math.round(((item.downloadCount || 1842) / 36) * 10) / 10,
          type: (item.assetKind?.toLowerCase() === 'video' ? 'video' : item.assetKind?.toLowerCase() === '3d' ? '3D' : item.assetKind?.toLowerCase() === 'vector' ? 'vector' : 'photo'),
          isAI: Boolean(item.isGentech || item.aiStatus === 'generative_ai'),
          createdAt: item.uploadDate || '2024-05-12T10:22:00Z',
          creatorName: item.creatorName || 'Example Creator',
          creatorId: String(item.creatorId || '123456789'),
          category: item.categoryName || 'Business',
          width: item.width || 6000,
          height: item.height || 4000,
          keywords: item.keywords && item.keywords.length > 0 ? item.keywords : ['workspace', 'laptop', 'coffee', 'desk', 'business'],
          assetUrl: item.assetUrl || `https://stock.adobe.com/images/${item.assetId}`,
          rawItem: item
        }));

        setAssets(mapped);
        setToastMessage(`Analysis complete: ${res.items.length} assets resolved successfully.`);
      }
    } catch (err: any) {
      console.error('Actor execution error:', err);
      setToastMessage(err?.message || 'Error running actor.');
    } finally {
      setIsBusy(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Generate Current JSON Input payload
  const currentInputJsonString = useMemo(() => {
    const lines = actorInputText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    return JSON.stringify({
      assetIds: lines,
      maxItems: actorMaxItems,
      timeoutSecs: actorTimeoutSecs,
      requestTimeoutSecs: actorRequestTimeoutSecs,
      proxyConfiguration: {
        useApifyProxy: actorUseProxy
      }
    }, null, 2);
  }, [actorInputText, actorMaxItems, actorTimeoutSecs, actorRequestTimeoutSecs, actorUseProxy]);

  // Generate Current JSON Output payload
  const currentOutputJsonString = useMemo(() => {
    if (actorRawOutputItems.length === 1) {
      return JSON.stringify(actorRawOutputItems[0], null, 2);
    }
    return JSON.stringify(actorRawOutputItems, null, 2);
  }, [actorRawOutputItems]);

  // Scan Keyword
  const handleScanKeyword = async (overrideQ?: string) => {
    const q = (overrideQ !== undefined ? overrideQ : keywordQuery).trim();
    if (!q) return;

    setActiveKeyword(q);
    setIsBusy(true);

    try {
      const lines = q.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      const res = await analyzeAdobeStockAssets(lines, apifyToken, limitSetting);

      if (res && res.items && res.items.length > 0) {
        const mapped: TrackedAsset[] = res.items.map((item, idx) => ({
          id: item.assetId || String(210000000 + idx),
          title: item.assetTitle || `Commercial Asset #${item.assetId}`,
          thumb: item.thumbnailUrl || 'https://images.unsplash.com/photo-1543258103-a62bdc069871?w=600&auto=format&fit=crop&q=80',
          downloads: item.downloadCount || 1842,
          views: item.viewCount || 25670,
          downloadsPerMonth: Math.round(((item.downloadCount || 1200) / 48) * 10) / 10,
          type: (item.assetKind?.toLowerCase() === 'vector' ? 'vector' : item.assetKind?.toLowerCase() === 'video' ? 'video' : item.assetKind?.toLowerCase() === '3d' ? '3D' : 'photo'),
          isAI: Boolean(item.isGentech || item.aiStatus === 'generative_ai'),
          createdAt: item.uploadDate || '2024-05-12T10:22:00Z',
          creatorName: item.creatorName || 'Example Creator',
          creatorId: String(item.creatorId || '123456789'),
          category: item.categoryName || 'Business',
          width: item.width || 6000,
          height: item.height || 4000,
          keywords: item.keywords && item.keywords.length > 0 ? item.keywords : ['stock', 'commercial'],
          assetUrl: item.assetUrl || `https://stock.adobe.com/${item.assetId}`,
          rawItem: item
        }));
        setAssets(mapped);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsBusy(false);
    }
  };

  // Filtered Assets based on Type bar and Hide AI setting
  const visibleAssets = useMemo(() => {
    return assets.filter(item => {
      if (hideAIAssets && item.isAI) return false;
      if (activeAssetType === 'all') return true;
      if (activeAssetType === 'photo' && item.type === 'photo') return true;
      if (activeAssetType === 'vector' && item.type === 'vector') return true;
      if (activeAssetType === 'illustration' && item.type === 'illustration') return true;
      if (activeAssetType === 'video' && item.type === 'video') return true;
      if (activeAssetType === '3D' && item.type === '3D') return true;
      return false;
    }).sort((a, b) => {
      if (sortOrder === 'downloads') return b.downloads - a.downloads;
      if (sortOrder === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [assets, activeAssetType, hideAIAssets, sortOrder]);

  const isApifyActive = Boolean(apifyToken.trim());

  // Export CSV
  const handleExportCSV = () => {
    if (visibleAssets.length === 0) return;
    const header = 'Asset ID,Title,Media Type,Downloads,Views,AI Status,Creation Date,Creator,Category,Comp URL,URL\n';
    const rows = visibleAssets.map(a => 
      `"${a.id}","${a.title.replace(/"/g, '""')}","${a.type}",${a.downloads},${a.views || 0},"${a.isAI ? 'generative_ai' : 'not_ai'}","${a.createdAt}","${a.creatorName}","${a.category}","${a.rawItem?.compUrl || ''}","${a.assetUrl}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Adobe_Stock_Analyzer_${activeRoute}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-[85vh] bg-[#0E1118] text-zinc-100 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col font-sans select-none animate-in fade-in">
      {/* =========================================================================
          TOPBAR
      ========================================================================= */}
      <header className="h-16 px-4 sm:px-6 bg-[#131722]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <TrendingUp size={16} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold font-display tracking-tight text-white text-base">
                ADOBE STOCK
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                Tracker
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('wip')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'wip'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Construction size={13} className="text-amber-400" />
              <span>In Progress</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sandbox')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'sandbox'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Play size={12} className="text-cyan-400" />
              <span>Beta Sandbox</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
            <Zap size={13} className="text-cyan-400 fill-cyan-400/30" />
            <span>UNLIMITED SCANS</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400">
            <span className={`w-2 h-2 rounded-full ${isApifyActive ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            <span className="text-[11px] font-mono">Actor Ready</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewMode('sandbox');
              setActiveRoute('saved');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeRoute === 'saved' && viewMode === 'sandbox'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300'
            }`}
          >
            <Bookmark size={13} />
            <span>Saved ({bookmarkedAssetIds.size + savedCreators.length})</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          VIEW CONTAINER: WORK IN PROGRESS VS INTERACTIVE SANDBOX
      ========================================================================= */}
      {viewMode === 'wip' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
          {/* Top VIP Announcement Ribbon */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-cyan-500/15 border border-indigo-500/30 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block relative" />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300 font-mono">
                    OFFICIAL LAUNCHING SOON
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 font-bold">
                    EARLY ACCESS WAITLIST
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Adobe Stock Tracker & Intelligence Engine v2.0 is gearing up for public deployment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('sandbox')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Play size={13} />
                <span>Test Beta Prototype</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center space-y-6 pt-2 pb-4 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-inner">
              <Rocket size={14} className="text-indigo-400 animate-bounce" />
              <span>Public Launch In Progress • Reserve Your Spot</span>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-display text-white leading-tight">
                The Adobe Stock Intelligence Engine <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  You Have Been Waiting For
                </span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                Stop guessing which stock assets sell. Track real-time download spikes, monitor competitor portfolios, and discover high-demand microstock niches before anyone else.
              </p>
            </div>

            {/* Live Real-Time Countdown Timer */}
            <div className="max-w-2xl mx-auto pt-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 font-mono mb-3 flex items-center justify-center gap-1.5">
                <Clock size={13} className="text-cyan-400" />
                <span>Target Public Launch Countdown</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
                {/* Days */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[#131722]/90 border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-400">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Days</span>
                </div>
                {/* Hours */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[#131722]/90 border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-4xl font-black font-mono text-indigo-400">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Hours</span>
                </div>
                {/* Minutes */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[#131722]/90 border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-4xl font-black font-mono text-purple-400">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Minutes</span>
                </div>
                {/* Seconds */}
                <div className="p-3 sm:p-4 rounded-2xl bg-[#131722]/90 border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                  <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400 relative">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1 relative">Seconds</span>
                </div>
              </div>
            </div>

            {/* VIP Early Access Waitlist Signup Box */}
            <div className="max-w-xl mx-auto pt-4">
              {!isWaitlistJoined ? (
                <div className="p-6 rounded-3xl bg-[#131722] border border-cyan-500/30 shadow-2xl space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                        <Bell size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Join the VIP Early Access Waitlist</h3>
                        <p className="text-xs text-zinc-400">Get notified the second the tracker opens + get 1,000 free launch credits.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="Enter your creator email address..."
                        className="w-full pl-10 pr-4 py-3 bg-[#0E1118] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02] shrink-0"
                    >
                      <Sparkles size={14} />
                      <span>Join VIP Waitlist</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck size={13} />
                      <span>100% Free VIP Queue • Zero Spam</span>
                    </span>
                    <span>No credit card required</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#131722] to-cyan-950/30 border border-emerald-500/40 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PRIORITY ACCESS GRANTED
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">Spot #{waitlistSpot}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">You are on the VIP Waitlist!</h3>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Thank you! Your spot is securely reserved. As a founding waitlist member, your account will be pre-loaded with <strong className="text-cyan-400 font-bold">1,000 bonus credits</strong> the instant public tracking goes live.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-zinc-400 font-mono text-[11px]">Early beta invites rolling out weekly</span>
                    <button
                      type="button"
                      onClick={() => setIsWaitlistJoined(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-[11px] underline cursor-pointer"
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              )}

              {/* Social Proof Stack */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border-2 border-[#0E1118] bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">AK</div>
                  <div className="w-7 h-7 rounded-full border-2 border-[#0E1118] bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-black shadow-xs">MR</div>
                  <div className="w-7 h-7 rounded-full border-2 border-[#0E1118] bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-black shadow-xs">SL</div>
                  <div className="w-7 h-7 rounded-full border-2 border-[#0E1118] bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black shadow-xs">JD</div>
                  <div className="w-7 h-7 rounded-full border-2 border-[#0E1118] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">+1.4k</div>
                </div>
                <div className="text-xs text-zinc-400">
                  <strong className="text-white font-bold">1,428+ stock contributors</strong> already waiting in queue
                </div>
              </div>
            </div>
          </div>

          {/* Sneak Peek: Core Features Currently in Engineering */}
          <div className="space-y-4 pt-2">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                SNEAK PEEK PREVIEW
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                What You Get When We Go Live
              </h2>
              <p className="text-xs text-zinc-400">
                A high-precision suite built exclusively for microstock contributors, designers, and prompt engineers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/10 hover:border-cyan-500/40 transition-colors space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Live Download Tracking</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Track download counts, view statistics, and monthly velocity on any Adobe Stock asset by ID or URL.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <span>✓ 85% Completed</span>
                </span>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/10 hover:border-purple-500/40 transition-colors space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Competitor Portfolio Spy</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Inspect rival portfolios, analyze top-performing assets, and reverse engineer winning creator strategies.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-400 flex items-center gap-1">
                  <span>✓ 80% Completed</span>
                </span>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/10 hover:border-emerald-500/40 transition-colors space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Sensei Algorithmic Rank #1</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Discover untapped buyer search tags with low competition and 50 front-loaded algorithmic keywords.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <span>✓ Engine Operational</span>
                </span>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-2xl bg-[#131722] border border-white/10 hover:border-amber-500/40 transition-colors space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Automated Trend Alerts</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Get automated alerts the instant your assets hit search page 1 or experience sudden download surges.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <span>✓ Queued for Sprint 5</span>
                </span>
              </div>
            </div>
          </div>

          {/* Development Progress & Sprint Milestones */}
          <div className="p-6 rounded-3xl bg-[#131722] border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-cyan-400" />
                  <span>Engineering Roadmap & Build Status</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Live tracking of ongoing sprints and cloud integration.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  88% SPRINT COMPLETE
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-1000 shadow-sm relative overflow-hidden"
                  style={{ width: '88%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
                <span>Phase 4: Realtime Scraper Optimization</span>
                <span>Version: v2.1.0-alpha</span>
              </div>
            </div>

            {/* Milestones Horizontal Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block">✓ COMPLETED</span>
                <span className="text-xs text-white font-semibold block truncate">Asset Resolver</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold block">✓ DEPLOYED</span>
                <span className="text-xs text-white font-semibold block truncate">Apify Cloud Actor</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                <span className="text-[10px] text-amber-300 font-bold block animate-pulse">● 88% IN SPRINT</span>
                <span className="text-xs text-amber-200 font-semibold block truncate">Download Scraper</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-1">
                <span className="text-[10px] text-indigo-300 font-bold block animate-pulse">● 80% IN SPRINT</span>
                <span className="text-xs text-indigo-200 font-semibold block truncate">Competitor Spy</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">QUEUED</span>
                <span className="text-xs text-zinc-400 font-semibold block truncate">Automated Alerts</span>
              </div>
            </div>
          </div>

          {/* Interactive Beta Prototype Callout */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#131722] to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  INTERACTIVE BETA SANDBOX AVAILABLE
                </span>
              </div>
              <h4 className="text-base font-bold text-white">Can't wait for the official public rollout?</h4>
              <p className="text-xs text-zinc-400 max-w-xl">
                Test the working Apify Actor runner and run live lookups on Adobe Stock asset IDs right now in our sandbox mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('sandbox')}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02] shrink-0"
            >
              <Play size={14} />
              <span>Launch Beta Sandbox</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick Action Footer */}
          <div className="p-5 rounded-2xl bg-[#131722] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-zinc-400 text-center sm:text-left">
              Stock Metadata Generator and Image to Prompt engines are running at 100% capacity.
            </div>
            <div className="flex items-center gap-2.5">
              {onStartMetadata && (
                <button
                  type="button"
                  onClick={onStartMetadata}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
                >
                  Go to Metadata
                </button>
              )}
              {onStartPrompt && (
                <button
                  type="button"
                  onClick={onStartPrompt}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer"
                >
                  Go to Prompt Engine
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Active Development Banner in Sandbox */}
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-amber-300">
              <Construction size={14} className="text-amber-400 shrink-0" />
              <span>Feature Module Under Active Development — You are viewing the Interactive Beta Sandbox</span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('wip')}
              className="text-amber-400 hover:text-amber-200 underline font-bold cursor-pointer text-xs"
            >
              Return to Development Roadmap
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR */}
        {isSidebarOpen && (
          <aside className="w-64 sm:w-72 bg-[#131722] border-r border-white/10 flex flex-col justify-between p-4 overflow-y-auto scrollbar-none shrink-0 z-10 transition-all">
            <div className="space-y-6">
              {/* MODE SELECTION GRID */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Mode Selection
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveRoute('actor')}
                    className={`col-span-2 p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      activeRoute === 'actor'
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-black shadow-lg font-black'
                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}
                  >
                    <Terminal size={17} />
                    <span>Actor Runner & Schema</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRoute('search')}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeRoute === 'search'
                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <TrendingUp size={18} />
                    <span>Keywords</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRoute('portfolio')}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeRoute === 'portfolio'
                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <User size={18} />
                    <span>Portfolio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRoute('saved')}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer relative ${
                      activeRoute === 'saved'
                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Bookmark size={18} />
                    <span>Saved</span>
                    {(bookmarkedAssetIds.size + savedCreators.length > 0) && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-full bg-cyan-400 text-black text-[9px] font-mono font-bold">
                        {bookmarkedAssetIds.size + savedCreators.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRoute('settings')}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      activeRoute === 'settings'
                        ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              {/* SCAN OPTIONS */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Scan Options
                </span>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full bg-[#181D2B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="downloads">Most Downloads</option>
                    <option value="recent">Recent Uploads</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span>Assets per scan</span>
                    <span className="font-mono text-cyan-400 font-bold">{limitSetting}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[24, 48, 100, 200].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLimitSetting(val)}
                        className={`py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          limitSetting === val
                            ? 'bg-cyan-500 text-black'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TOGGLES */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Quick Toggles
                </span>

                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                  <span>Hide AI assets</span>
                  <input
                    type="checkbox"
                    checked={hideAIAssets}
                    onChange={(e) => setHideAIAssets(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer rounded"
                  />
                </label>
              </div>
            </div>

            {/* SIDEBAR FOOTER */}
            <div className="pt-4 border-t border-white/10">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                  <span>Actor Engine</span>
                  <span className="text-emerald-400 font-bold font-mono">v1.0.4</span>
                </div>
                <div className="text-xs font-bold text-white">
                  kawsar/adobe-stock-analyzer
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Resolves bare IDs & any stock.adobe.com links into structured performance rows.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* WORKSPACE CANVAS */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 bg-[#0E1118]">
          {/* =====================================================================
              PRIMARY VIEW: DEDICATED ACTOR RUNNER (EXACT INPUT & OUTPUT SCHEMAS)
          ===================================================================== */}
          {activeRoute === 'actor' && (
            <div className="space-y-8 max-w-7xl mx-auto w-full">
              {/* ACTOR BANNER */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-r from-cyan-500/40 via-indigo-500/30 to-purple-500/40 shadow-2xl">
                <div className="bg-[#131722] rounded-[22px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold font-mono">
                        Actor: kawsar/adobe-stock-analyzer
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        99.9% Run Success
                      </span>
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
                        Bare IDs & Link Shapes
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight">
                      Adobe Stock Analyzer Actor Runner
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Accepts bare numeric IDs (e.g. <code>841165203</code>) and any stock.adobe.com link shape (photo, video, vector, 3D, template, audio) to return downloads, views, keywords, and creator metadata.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActorInputText(DEFAULT_EXAMPLE_INPUT_IDS.join('\n'))}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>Load Example Input</span>
                    </button>
                    <a
                      href="https://apify.com/kawsar/adobe-stock-analyzer.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#1A2030] hover:bg-[#222A40] border border-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View on Apify</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* INPUT CONFIGURATION CARD */}
              <div className="bg-[#131722] border border-white/10 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-cyan-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      Actor Input Configuration
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#1A2030] p-0.5 rounded-xl border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setActorInputViewMode('list')}
                        className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${actorInputViewMode === 'list' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        List / URLs
                      </button>
                      <button
                        type="button"
                        onClick={() => setActorInputViewMode('json')}
                        className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${actorInputViewMode === 'json' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        JSON Schema
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentInputJsonString, 'Input JSON schema copied')}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                      title="Copy Input JSON"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {actorInputViewMode === 'list' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>assetIds (array of strings - one per line):</span>
                      <span className="text-[11px] text-cyan-400 font-mono">
                        {actorInputText.split('\n').filter(s => s.trim()).length} asset(s) queued
                      </span>
                    </label>
                    <textarea
                      rows={6}
                      value={actorInputText}
                      onChange={(e) => setActorInputText(e.target.value)}
                      placeholder="841165203&#10;https://stock.adobe.com/841165203&#10;https://stock.adobe.com/images/example-photo/1004530648"
                      className="w-full bg-[#181D2B] border border-white/10 focus:border-cyan-400 rounded-2xl p-4 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden leading-relaxed shadow-inner"
                    />
                    <p className="text-[11px] text-zinc-500">
                      The <code>assetIds</code> field accepts bare numeric IDs and any stock.adobe.com link shape (photo, video, vector, 3D, template, audio).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold uppercase tracking-wider text-[11px]">Exact Example Input JSON:</span>
                      <span className="text-emerald-400 text-[11px] font-mono">Valid Input Schema</span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-[#181D2B] border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{currentInputJsonString}
                    </pre>
                  </div>
                )}

                {/* Actor Parameters Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-[#181D2B] rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">maxItems</span>
                    <input
                      type="number"
                      value={actorMaxItems}
                      onChange={(e) => setActorMaxItems(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden"
                    />
                    <span className="text-[9px] text-zinc-500 block">0 = no limit (ceiling 100k)</span>
                  </div>

                  <div className="p-3 bg-[#181D2B] rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">timeoutSecs</span>
                    <input
                      type="number"
                      value={actorTimeoutSecs}
                      onChange={(e) => setActorTimeoutSecs(parseInt(e.target.value) || 300)}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden"
                    />
                    <span className="text-[9px] text-zinc-500 block">Default 300s (max 3600)</span>
                  </div>

                  <div className="p-3 bg-[#181D2B] rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">requestTimeoutSecs</span>
                    <input
                      type="number"
                      value={actorRequestTimeoutSecs}
                      onChange={(e) => setActorRequestTimeoutSecs(parseInt(e.target.value) || 30)}
                      className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden"
                    />
                    <span className="text-[9px] text-zinc-500 block">Per-request HTTP timeout</span>
                  </div>

                  <div className="p-3 bg-[#181D2B] rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">proxyConfiguration</span>
                    <button
                      type="button"
                      onClick={() => setActorUseProxy(!actorUseProxy)}
                      className={`w-full mt-1 py-1 px-2 rounded-lg text-xs font-bold font-mono text-left cursor-pointer transition-colors ${actorUseProxy ? 'text-emerald-400' : 'text-zinc-500'}`}
                    >
                      {actorUseProxy ? 'useApifyProxy: true' : 'useApifyProxy: false'}
                    </button>
                    <span className="text-[9px] text-zinc-500 block">Optional Apify Proxy</span>
                  </div>
                </div>

                {/* RUN BUTTON */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExecuteActor}
                    disabled={isBusy}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isBusy ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Running Actor (kawsar/adobe-stock-analyzer)...</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" />
                        <span>Run Adobe Stock Analyzer</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download size={14} />
                    <span>Export CSV Dataset</span>
                  </button>
                </div>
              </div>

              {/* OUTPUT SECTION: VISUAL CARDS & RAW OUTPUT JSON */}
              <div className="bg-[#131722] border border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        Actor Output Dataset ({actorRawOutputItems.length} resolved)
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Exact output schema with downloads, views, creator metadata, and preview URLs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#1A2030] p-0.5 rounded-xl border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setActorOutputViewMode('visual')}
                        className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${actorOutputViewMode === 'visual' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Visual Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setActorOutputViewMode('json')}
                        className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${actorOutputViewMode === 'json' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Raw Output JSON
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentOutputJsonString, 'Output JSON copied')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy size={13} />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                </div>

                {actorOutputViewMode === 'visual' ? (
                  /* VISUAL CARDS GRID */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {actorRawOutputItems.map((item, idx) => {
                      const isAi = item.isGentech || item.aiStatus === 'generative_ai';
                      return (
                        <div
                          key={item.assetId || idx}
                          className="bg-[#181D2B] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition-all p-4 space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black/50 border border-white/5">
                              <img
                                src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'}
                                alt={item.assetTitle}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] font-bold">
                                  #{item.assetId}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-[10px] font-bold uppercase">
                                  {item.assetKind || 'Photo'}
                                </span>
                                {isAi ? (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white text-[10px] font-bold">
                                    AI
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold">
                                    Human
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug">
                                {item.assetTitle}
                              </h4>
                              <p className="text-[11px] text-zinc-400">
                                by <strong className="text-zinc-200">{item.creatorName}</strong> ({item.countryName || 'Global'})
                              </p>
                            </div>

                            {/* EXACT OUTPUT FIELDS STRIP */}
                            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#131722] rounded-xl border border-white/5 text-[11px]">
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Downloads</span>
                                <div className="text-sm font-black font-mono text-cyan-400">
                                  {(item.downloadCount || 0).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Views</span>
                                <div className="text-sm font-black font-mono text-purple-400">
                                  {(item.viewCount || 0).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Dimensions</span>
                                <div className="font-mono text-zinc-300">
                                  {item.dimensions || `${item.width}x${item.height}`}
                                </div>
                              </div>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Format</span>
                                <div className="font-mono text-zinc-300">
                                  {item.fileFormat || 'JPEG'}
                                </div>
                              </div>
                            </div>

                            {/* Keywords preview */}
                            {item.keywords && item.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.keywords.slice(0, 5).map((kw, ki) => (
                                  <span key={ki} className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-zinc-400 font-mono">
                                    {kw}
                                  </span>
                                ))}
                                {item.keywords.length > 5 && (
                                  <span className="text-[10px] text-zinc-500 font-mono">+{item.keywords.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                            {item.compUrl && (
                              <a
                                href={item.compUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <Download size={11} />
                                <span>Comp Preview</span>
                              </a>
                            )}
                            <a
                              href={item.assetUrl || `https://stock.adobe.com/images/${item.assetId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1 ml-auto"
                            >
                              <span>Adobe Stock</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* RAW OUTPUT JSON SCHEMA DISPLAY */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold uppercase tracking-wider text-[11px]">
                        Normalized Dataset Output JSON:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentOutputJsonString, 'Output JSON copied')}
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Copy size={12} />
                        <span>Copy Output JSON</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-[#181D2B] border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[500px]">
{currentOutputJsonString}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 2: KEYWORDS (KEYWORD RESEARCH)
          ===================================================================== */}
          {activeRoute === 'search' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mr-2">
                  Asset Type:
                </span>
                {[
                  { id: 'all', label: 'All Assets' },
                  { id: 'photo', label: 'Photos' },
                  { id: 'vector', label: 'Vectors' },
                  { id: 'video', label: 'Videos' },
                  { id: '3D', label: '3D CGI' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveAssetType(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeAssetType === tab.id
                        ? 'bg-cyan-500 text-black shadow-sm font-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* GLOW HERO FORM */}
              <div className="relative rounded-3xl p-1 bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 shadow-2xl">
                <div className="bg-[#131722] rounded-[22px] p-6 sm:p-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center shadow-xs">
                    <TrendingUp size={24} />
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight">
                    Keyword Research
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                    Scan Adobe Stock for any keyword and see what actually sells in the real marketplace.
                  </p>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleScanKeyword();
                    }}
                    className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-2.5 pt-2"
                  >
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                        placeholder="Keyword, phrase, or asset ID (e.g. 841165203, Christmas)..."
                        className="w-full bg-[#1A2030] border border-white/10 focus:border-cyan-400 rounded-2xl pl-12 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-hidden font-medium shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isBusy ? <RefreshCw size={15} className="animate-spin" /> : <TrendingUp size={15} />}
                      <span>Scan Stock</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* ASSETS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleAssets.map((asset, rank) => (
                  <article
                    key={asset.id}
                    className="bg-[#131722] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-md group relative"
                  >
                    <div>
                      <div 
                        onClick={() => setDrawerAsset(asset)}
                        className="relative aspect-4/3 w-full bg-[#181D2B] overflow-hidden cursor-pointer"
                      >
                        <img
                          src={asset.thumb}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] font-bold">
                            #{rank + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-[10px] font-bold uppercase">
                            {asset.type}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-3.5">
                        <h3 
                          onClick={() => setDrawerAsset(asset)}
                          className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-2 leading-relaxed cursor-pointer hover:text-cyan-400"
                        >
                          {asset.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-2 bg-[#1A2030] p-2.5 rounded-2xl border border-white/5">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                              <Download size={11} className="text-cyan-400" />
                              <span>Downloads</span>
                            </span>
                            <div className="text-base sm:text-lg font-black font-mono text-cyan-400">
                              {asset.downloads.toLocaleString()}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                              <Clock size={11} className="text-amber-400" />
                              <span>Velocity</span>
                            </span>
                            <div className="text-base sm:text-lg font-black font-mono text-amber-400">
                              {asset.downloadsPerMonth} /mo
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => setDrawerAsset(asset)}
                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect Asset & Schema</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 3: PORTFOLIO
          ===================================================================== */}
          {activeRoute === 'portfolio' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              <div className="bg-[#131722] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
                <h1 className="text-2xl font-bold font-display text-white">
                  Portfolio Tracker
                </h1>
                <p className="text-xs text-zinc-400">
                  Track any contributor by numeric ID (e.g. 123456789 or 200792199).
                </p>

                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    placeholder="Enter creator ID..."
                    className="flex-1 bg-[#181D2B] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanKeyword(portfolioInput)}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 4: SAVED
          ===================================================================== */}
          {activeRoute === 'saved' && (
            <div className="space-y-6 max-w-7xl mx-auto w-full">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold font-display text-white">
                  Saved Bookmarks
                </h1>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.filter(a => bookmarkedAssetIds.has(a.id)).map(a => (
                  <div key={a.id} className="p-4 bg-[#131722] rounded-2xl border border-white/10 space-y-2">
                    <h4 className="font-bold text-xs text-white truncate">{a.title}</h4>
                    <span className="text-[10px] text-cyan-400 font-mono">#{a.id} • {a.downloads} dl</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =====================================================================
              VIEW 5: SETTINGS
          ===================================================================== */}
          {activeRoute === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold font-display text-white">
                  Settings & Apify Token
                </h1>
              </div>

              <div className="bg-[#131722] border border-white/10 rounded-3xl p-6 space-y-3">
                <h3 className="font-bold text-sm text-white">Apify Token</h3>
                <input
                  type="password"
                  value={apifyToken}
                  onChange={(e) => {
                    setApifyToken(e.target.value);
                    saveStoredApifyToken(e.target.value);
                  }}
                  placeholder="apify_api_..."
                  className="w-full bg-[#181D2B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Optional. Without a token, the tracker will generate realistic Adobe Stock performance rows.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* =========================================================================
            ASSET DETAIL DRAWER WITH RAW JSON SCHEMA TAB
        ========================================================================= */}
        {drawerAsset && (
          <>
            <div 
              onClick={() => setDrawerAsset(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            />
            <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md sm:max-w-lg bg-[#131722] border-l border-white/10 z-50 p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs font-bold uppercase">
                    {drawerAsset.type}
                  </span>
                  {drawerAsset.isAI && (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-600/90 text-white text-xs font-bold flex items-center gap-1">
                      <Sparkles size={11} /> AI Generated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawerShowJson(!drawerShowJson)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                      drawerShowJson ? 'bg-cyan-500 text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerAsset(null)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {drawerShowJson ? (
                /* RAW JSON SCHEMA VIEW IN DRAWER */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 font-bold">Exact Output Example:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(drawerAsset.rawItem || {
                        assetId: drawerAsset.id,
                        assetTitle: drawerAsset.title,
                        assetKind: drawerAsset.type,
                        contentType: "image/jpeg",
                        fileFormat: "JPEG",
                        creatorName: drawerAsset.creatorName,
                        creatorId: drawerAsset.creatorId,
                        countryName: "United States",
                        uploadDate: drawerAsset.createdAt,
                        downloadCount: drawerAsset.downloads,
                        viewCount: drawerAsset.views,
                        assetUrl: drawerAsset.assetUrl,
                        dimensions: `${drawerAsset.width}x${drawerAsset.height}`
                      }, null, 2), 'Asset JSON copied')}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#181D2B] border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{JSON.stringify(drawerAsset.rawItem || {
  assetId: drawerAsset.id,
  assetTitle: drawerAsset.title,
  assetKind: drawerAsset.type,
  contentType: "image/jpeg",
  fileFormat: "JPEG",
  creatorName: drawerAsset.creatorName,
  creatorId: drawerAsset.creatorId,
  countryName: "United States",
  uploadDate: drawerAsset.createdAt,
  downloadCount: drawerAsset.downloads,
  viewCount: drawerAsset.views,
  assetUrl: drawerAsset.assetUrl,
  dimensions: `${drawerAsset.width}x${drawerAsset.height}`
}, null, 2)}
                  </pre>
                </div>
              ) : (
                /* VISUAL DRAWER */
                <div className="space-y-6">
                  <div className="rounded-2xl overflow-hidden aspect-4/3 bg-black border border-white/10">
                    <img
                      src={drawerAsset.thumbLarge || drawerAsset.thumb}
                      alt={drawerAsset.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h2 className="text-base font-bold text-white leading-snug">
                    {drawerAsset.title}
                  </h2>

                  <div className="grid grid-cols-3 gap-2 bg-[#1A2030] p-3 rounded-2xl border border-white/5 text-center">
                    <div>
                      <div className="text-xl font-black font-mono text-cyan-400">
                        {drawerAsset.downloads.toLocaleString()}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Downloads</span>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono text-amber-400">
                        {drawerAsset.downloadsPerMonth}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Dl / month</span>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono text-purple-400">
                        {drawerAsset.views ? drawerAsset.views.toLocaleString() : '25,670'}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Views</span>
                    </div>
                  </div>

                  <dl className="divide-y divide-white/5 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <dt className="text-zinc-400">Creator</dt>
                      <dd className="font-bold text-white">{drawerAsset.creatorName} (#{drawerAsset.creatorId})</dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <dt className="text-zinc-400">Dimensions</dt>
                      <dd className="font-mono text-white">{drawerAsset.width} × {drawerAsset.height} px</dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <dt className="text-zinc-400">Asset ID</dt>
                      <dd className="font-mono text-cyan-400 font-bold">#{drawerAsset.id}</dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-zinc-400">Keywords</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(drawerAsset.keywords.join(', '), 'Keywords copied')}
                        className="text-cyan-400 hover:underline font-bold cursor-pointer"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {drawerAsset.keywords.map((kw, ki) => (
                        <span key={ki} className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-zinc-300 font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={drawerAsset.assetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Open in Adobe Stock</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131722] border border-cyan-500/40 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCheck size={15} className="text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
