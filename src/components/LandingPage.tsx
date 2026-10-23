import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  UploadCloud, 
  FileSpreadsheet, 
  Layers, 
  CalendarDays, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  FileCode2, 
  Image as ImageIcon, 
  Video, 
  TrendingUp, 
  ChevronDown, 
  Eye, 
  HelpCircle,
  Copy, 
  Check, 
  Rabbit, 
  Star, 
  ExternalLink, 
  X, 
  FileText, 
  Lock, 
  Users, 
  Download, 
  Table, 
  Sliders, 
  CheckCircle,
  Clock,
  Sparkle,
  Upload,
  Layers as LayersIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReviewsSection } from './ReviewsSection';

interface LandingPageProps {
  onStartMetadata: () => void;
  onStartPrompt: () => void;
  onOpenCalendar: () => void;
  onViewAllReviews?: () => void;
}

interface DemoCardItem {
  id: string;
  title: string;
  platform: 'Adobe Stock' | 'Shutterstock' | 'Freepik';
  image: string;
  filename: string;
  resolution: string;
  category: string;
  keywords: string[];
}

const MOCKUP_CARDS: DemoCardItem[] = [
  {
    id: 'coffee',
    title: 'Fresh Hot Latte Coffee with Leaf Foam Art on Rustic Wooden Table',
    platform: 'Adobe Stock',
    image: '/samples/coffee_barista_latte_art.jpg',
    filename: 'latte_art_rustic_wood.jpg',
    resolution: '4800 × 3200 px',
    category: 'Food & Beverage',
    keywords: ['coffee', 'latte art', 'barista', 'espresso', 'cappuccino', 'wooden table', 'cafe interior', 'morning coffee', 'rustic wood', 'breakfast', '+40 more']
  },
  {
    id: 'workspace',
    title: 'Minimalist Freelancer Workspace with Laptop and Notebook Overhead Flat Lay',
    platform: 'Shutterstock',
    image: '/samples/modern_creative_workspace.jpg',
    filename: 'freelance_desk_flatlay.jpg',
    resolution: '5400 × 3600 px',
    category: 'Business & Tech',
    keywords: ['workspace', 'laptop', 'desk', 'freelancer', 'minimalist', 'flat lay', 'top view', 'technology', 'office', 'remote work', '+40 more']
  },
  {
    id: 'tropical',
    title: 'Aerial Overhead Drone Shot of Turquoise Ocean Waves on White Sand Shore',
    platform: 'Freepik',
    image: '/samples/tropical_aerial_coastline.jpg',
    filename: 'tropical_ocean_drone.jpg',
    resolution: '4K UHD • 60 FPS',
    category: 'Travel & Nature',
    keywords: ['beach', 'ocean', 'aerial', 'sea', 'turquoise', 'tropical', 'coast', 'water', 'drone view', 'summer', '+40 more']
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartMetadata,
  onStartPrompt,
  onOpenCalendar,
  onViewAllReviews,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedDemoCard, setSelectedDemoCard] = useState<string>('coffee');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [demoCsvModalOpen, setDemoCsvModalOpen] = useState(false);
  const [demoPlatform, setDemoPlatform] = useState<'adobe' | 'shutterstock' | 'freepik'>('adobe');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [socialModalInfo, setSocialModalInfo] = useState<{ name: string; url: string; details: string } | null>(null);

  const activeAsset = MOCKUP_CARDS.find(c => c.id === selectedDemoCard) || MOCKUP_CARDS[0];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyTitle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSocialClick = (platform: 'Facebook' | 'WhatsApp' | 'Support Group') => {
    if (platform === 'Facebook') {
      window.open('https://www.facebook.com/mainul.islam389', '_blank', 'noopener,noreferrer');
    } else if (platform === 'WhatsApp') {
      window.open('https://whatsapp.com', '_blank', 'noopener,noreferrer');
    } else {
      setSocialModalInfo({
        name: 'Melo Contributor Community',
        url: 'https://www.facebook.com/mainul.islam389',
        details: 'Join professional microstock contributors on the official Melo community by Mainul. Share submission tips, monthly bestsellers, and get direct assistance.'
      });
    }
  };

  const handleDownloadDemoCsv = () => {
    const filename = `melo_${demoPlatform}_sample.csv`;
    const header = "Filename,Title,Description,Keywords,Category\n";
    const title = activeAsset.title;
    const desc = `${activeAsset.title}. Ideal for commercial advertising and editorial publication.`;
    const kw = `"${activeAsset.keywords.join(', ')}"`;
    const row = `"${activeAsset.filename}","${title.replace(/"/g, '""')}","${desc.replace(/"/g, '""')}",${kw},"${activeAsset.category}"\n`;
    
    const blob = new Blob([header + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const faqs = [
    {
      q: 'How does Melo generate stock-ready metadata for all file types?',
      a: 'Melo uses neural computer vision powered by high-speed Google Gemini models. It analyzes the visual composition, subject matter, style, and lighting of your JPG, PNG, SVG, EPS, AI, and MP4 files to craft high-converting titles, descriptions, and 50 search-ranked keywords.'
    },
    {
      q: 'Why are the first 10 keywords prioritized for stock algorithms?',
      a: 'Microstock search engines on Adobe Sensei, Shutterstock mSearch, and Freepik heavily weight the initial 5 to 10 keywords. Melo places your core literal subjects in positions 1-10, secondary descriptors in 11-20, followed by commercial themes, styles, and buyer intent tags.'
    },
    {
      q: 'Can I upload vector EPS, AI, and SVG files directly in bulk?',
      a: 'Yes! Melo features built-in vector thumbnail extraction. It decodes embedded vector headers from EPS and AI files and rasterizes SVG vectors in real-time in your browser without requiring Adobe Illustrator or external converters.'
    },
    {
      q: 'How does the 1-click CSV export work for Adobe Stock, Freepik & Shutterstock?',
      a: 'Each marketplace enforces different CSV column structures (e.g. Adobe Stock needs Filename, Title, Keywords; Shutterstock needs Description and Keywords; Freepik requires specific file_name headers). Melo exports pre-formatted, error-free CSV files ready for direct bulk upload.'
    },
    {
      q: 'How does the 5-item batch processing work?',
      a: 'When you upload multiple files, Melo processes them in strict, controlled batches of 5 files. All 5 files in each batch complete together and transition from PROCESSING to SUCCESS simultaneously, ensuring maximum browser performance and zero memory lag.'
    },
    {
      q: 'Is Melo really 100% free with unlimited generation?',
      a: 'Yes! Melo by Mainul is built with a creator-first philosophy. There are no paid subscriptions, credit locks, or paywalls. You can use the built-in free tier or plug in your own Google Gemini API key with 100% client-side privacy.'
    }
  ];

  return (
    <div className="w-full space-y-16 sm:space-y-20 animate-fade-in pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 pb-2 text-center">
        {/* Soft background ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-6 px-4">
          
          {/* Subtle announcement kicker */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFE3EA] dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <Sparkles size={14} className="text-amber-500" />
            <span>AI-Powered Stock Metadata Suite</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">100% Free for All File Types</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-[1.1] text-balance">
            Adobe Stock Tracker &<br/>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
              Metadata Generator
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed text-balance">
            The ultimate tool for microstock contributors. Upload images, videos, SVGs, and EPS in bulk. Automatically generate high-converting titles, descriptions, and 50 search-ranked keywords with 1-click CSV export for Adobe Stock, Freepik, and Shutterstock.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onStartMetadata}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-zinc-900/10 hover:shadow-2xl transition-all cursor-pointer group"
            >
              <UploadCloud size={18} />
              <span>Get Started</span>
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onStartPrompt}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#ECEEF4] hover:bg-[#DFE3EA] dark:bg-[#1C2232] dark:hover:bg-[#252D3F] text-zinc-800 dark:text-zinc-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-zinc-300/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles size={16} className="text-amber-500" />
              <span>Image to Prompt</span>
            </button>

            <button
              onClick={onOpenCalendar}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#ECEEF4] hover:bg-[#DFE3EA] dark:bg-[#1C2232] dark:hover:bg-[#252D3F] text-zinc-800 dark:text-zinc-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-zinc-300/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs"
            >
              <CalendarDays size={16} className="text-rose-500" />
              <span>2026 Event Calendar</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>50 Free Welcome Credits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Daily +10 Bonus Credits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>1 File = 1 Credit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>100% Free Lifetime Tier</span>
            </div>
          </div>
        </div>

        {/* WIREFRAME APP SHOWCASE MOCKUP (Exact replica of screenshot - no visuals) */}
        <div className="mt-16 relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-zinc-300/80 dark:border-white/10 bg-[#ECEEF4] dark:bg-[#141824] shadow-2xl overflow-hidden text-left">
            
            {/* Top window bar */}
            <div className="h-10 border-b border-zinc-300/60 dark:border-white/10 bg-[#DFE3EA] dark:bg-[#191F2E] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg bg-[#ECEEF4] dark:bg-[#10141E] border border-zinc-300/40 dark:border-white/5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  melo.app/generator
                </div>
              </div>
            </div>

            {/* Inner Content Area */}
            <div className="p-5 sm:p-6 bg-gradient-to-b from-[#ECEEF4]/60 to-[#DFE3EA]/40 dark:from-[#141824] dark:to-[#0F121A]">
              <div className="flex flex-col lg:flex-row gap-4">
                
                {/* Sidebar */}
                <div className="w-full lg:w-56 flex-shrink-0 hidden lg:block">
                  <div className="rounded-xl border border-zinc-300/70 dark:border-white/10 bg-[#DFE3EA] dark:bg-[#1B2232] p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-xs">
                        <Rabbit size={18} strokeWidth={2.4} />
                      </div>
                      <span className="text-sm font-bold font-display text-zinc-900 dark:text-zinc-100">Melo</span>
                      <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-200/90 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                        PRO
                      </span>
                    </div>

                    <div 
                      onClick={onStartMetadata}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 cursor-pointer shadow-xs"
                    >
                      Generator
                    </div>
                    <div 
                      onClick={onOpenCalendar}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      Events
                    </div>
                    <div 
                      onClick={onStartPrompt}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      Pricing
                    </div>
                  </div>
                </div>

                {/* Right Area: Upload Files & Generated Results (Pure Wireframe, No Visuals) */}
                <div className="flex-1 space-y-4">
                  {/* Upload Files Box */}
                  <div className="rounded-xl border border-zinc-300/70 dark:border-white/10 bg-[#DFE3EA] dark:bg-[#1B2232] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UploadCloud size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Upload Files</span>
                    </div>
                    <div 
                      onClick={onStartMetadata}
                      className="border-2 border-dashed border-zinc-300/80 dark:border-white/15 hover:border-zinc-400 dark:hover:border-white/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                    >
                      <ImageIcon size={32} className="text-zinc-400/50 dark:text-zinc-500/30 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Drag &amp; drop files here</span>
                    </div>
                  </div>

                  {/* Generated Results Box */}
                  <div className="rounded-xl border border-zinc-300/70 dark:border-white/10 bg-[#DFE3EA] dark:bg-[#1B2232] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Generated Results</span>
                    </div>
                    
                    {/* Wireframe Cards Grid: No photo visuals, clean placeholder blocks */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div className="rounded-lg bg-[#ECEEF4] dark:bg-white/5 p-3 space-y-2 border border-zinc-300/40 dark:border-white/5">
                        <div className="w-full aspect-square rounded-lg bg-zinc-300/60 dark:bg-white/10 animate-pulse"></div>
                        <div className="h-2 w-3/4 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                        <div className="h-2 w-1/2 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                      </div>
                      <div className="rounded-lg bg-[#ECEEF4] dark:bg-white/5 p-3 space-y-2 border border-zinc-300/40 dark:border-white/5">
                        <div className="w-full aspect-square rounded-lg bg-zinc-300/60 dark:bg-white/10 animate-pulse"></div>
                        <div className="h-2 w-3/4 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                        <div className="h-2 w-1/2 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                      </div>
                      <div className="rounded-lg bg-[#ECEEF4] dark:bg-white/5 p-3 space-y-2 border border-zinc-300/40 dark:border-white/5 col-span-2 md:col-span-1">
                        <div className="w-full aspect-square rounded-lg bg-zinc-300/60 dark:bg-white/10 animate-pulse"></div>
                        <div className="h-2 w-3/4 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                        <div className="h-2 w-1/2 rounded bg-zinc-300/60 dark:bg-white/10"></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-4 -z-10 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent rounded-3xl blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* STATS STRIP (Directly modeled after csvnest.com) */}
      <section className="border-y border-zinc-300/70 dark:border-white/10 bg-[#ECEEF4]/60 dark:bg-[#161B26]/60 backdrop-blur-xs py-10 rounded-2xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <p className="text-3xl md:text-5xl font-display font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                500+
              </p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Files per batch upload
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-3xl md:text-5xl font-display font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                6
              </p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Major stock agencies ready
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-3xl md:text-5xl font-display font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                50
              </p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Rank-ordered keywords
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-3xl md:text-5xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                100%
              </p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Free Forever with BYOK
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED MICROSTOCK MARKETPLACES STRIP */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Pre-Formatted CSVs for Major Stock Platforms
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Adobe Stock', badge: 'Title + 50 Tags' },
            { name: 'Freepik', badge: 'Vector & Photo CSV' },
            { name: 'Shutterstock', badge: 'Caption + Keywords' },
            { name: 'Getty / iStock', badge: 'Controlled Vocabulary' },
            { name: 'Vecteezy', badge: 'Vector Graphic Tags' },
            { name: 'Pond5', badge: 'Video Footage CSV' }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/60 dark:border-white/10 text-center space-y-1 shadow-2xs hover:border-zinc-400 transition-colors"
            >
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.name}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.badge}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CORE FEATURES BENTO GRID ("Everything you need to optimize your workflow") */}
      <section id="features" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Features
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Everything you need to<br/>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              optimize your workflow
            </span>
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Eliminate rejection risks, speed up batch tagging, and maximize download sales across every microstock marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: AI Metadata */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">AI-Powered Metadata</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Generate titles, descriptions, and keywords automatically using high-speed Google Gemini Vision AI with deep contextual awareness.
            </p>
          </div>

          {/* Card 2: Batch Processing */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Batch Processing</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Upload up to 500+ files in a single drag-and-drop. Strictly processes in batches of 5, transitioning simultaneously into SUCCESS state.
            </p>
          </div>

          {/* Card 3: Accurate Keywords */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Accurate 50 Keywords</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Algorithmic prioritization ensures your core visual subjects land in the crucial first 10 slots to maximize ranking on Adobe Sensei.
            </p>
          </div>

          {/* Card 4: CSV Export */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">1-Click CSV Export</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Download clean CSV spreadsheets pre-formatted with exact column headers for Adobe Stock, Shutterstock, and Freepik.
            </p>
          </div>

          {/* Card 5: Native Vector EPS & SVG */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileCode2 size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Native Vector EPS & SVG Parsing</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Extracts high-resolution embedded thumbnails directly from binary EPS vectors and renders SVG files on-the-fly without third-party converters.
            </p>
          </div>

          {/* Card 6: Image to Prompt */}
          <div className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-3 group">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ImageIcon size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Image to Prompt Engine</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Reverse-engineer prompts from any reference image into studio-grade Midjourney v6.1 and Flux prompts with 1:1 recreation or creative variations.
            </p>
          </div>
        </div>
      </section>

      {/* THREE SIMPLE STEPS (Modeled after csvnest.com "Three simple steps") */}
      <section id="how-it-works" className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm space-y-10 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Three Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Automate your stock portfolio from upload to submission in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="relative text-center p-6 rounded-2xl bg-[#DFE3EA]/80 dark:bg-[#151A26] border border-zinc-300/60 dark:border-white/10 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Step 01</p>
              <h3 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">Upload Your Files</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Drag and drop your images, videos, SVGs, or vector EPS files. Process up to 500 files at once with real-time thumbnail extraction.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative text-center p-6 rounded-2xl bg-[#DFE3EA]/80 dark:bg-[#151A26] border border-zinc-300/60 dark:border-white/10 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md">
              <Sparkles size={24} className="text-amber-400 dark:text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Step 02</p>
              <h3 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">AI Generates Metadata</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Computer vision scans your content, generating SEO titles, descriptions, and 50 search-ranked keywords tailored to your target platform.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative text-center p-6 rounded-2xl bg-[#DFE3EA]/80 dark:bg-[#151A26] border border-zinc-300/60 dark:border-white/10 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md">
              <FileSpreadsheet size={24} className="text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Step 03</p>
              <h3 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">Export & Upload</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Download your mapped CSV spreadsheet and upload directly to Adobe Stock, Shutterstock, or Freepik without manual corrections.
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onStartMetadata}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            <span>Start Your Batch</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* COMMUNITY REVIEWS SECTION ("Loved by creators") */}
      <ReviewsSection onStartMetadata={onStartMetadata} onViewAllReviews={onViewAllReviews} />

      {/* PRICING & TRANSPARENCY SECTION */}
      <section id="pricing" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <Zap size={14} />
            <span>Fair & Unrestricted</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100">
            Unlimited Generations, 100% Free Forever
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Why pay monthly subscription fees or buy expensive credit packs? Melo provides unrestricted batch generation with Bring-Your-Own-Key (BYOK) freedom.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-3xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 size={14} />
                <span>Zero Subscription • Zero Hidden Fees</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100">
                Melo Contributor Edition
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Connect your free Google Gemini API key or use your preferred LLM. Your keys stay saved in your browser local storage, and your creative stock assets are never stored on external servers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {[
                  "Unlimited Batch Image & Vector Meta",
                  "Ordered 50-Keyword Architecture",
                  "Embedded EPS & SVG Thumbnail Previews",
                  "1-Click Adobe, Shutter & Freepik CSV",
                  "Marketplace Approval Risk Scanner",
                  "Reverse Image to Prompt Engine",
                  "2026 Global Stock Event Calendar",
                  "100% Client-Side Privacy"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#DFE3EA]/90 dark:bg-[#151A26] border border-zinc-300/60 dark:border-white/10 text-center space-y-4">
              <div>
                <span className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 font-display">
                  $0
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400"> / Free Short Time</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs">
                Free Google Gemini API tier included. No credit card required.
              </p>
              <button
                onClick={onStartMetadata}
                className="w-full py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Launch Melo Workspace</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <Lock size={12} />
                <span>Runs securely on your device</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-[#DFE3EA]/80 dark:bg-[#161B26] border border-zinc-300/60 dark:border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-300/40 dark:border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER ("Ready to automate your workflow?") */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 p-8 sm:p-14 text-center space-y-6 shadow-xl">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight">
            Ready to Automate Your Microstock Workflow?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-600 max-w-lg mx-auto leading-relaxed">
            Stop spending hours manually writing metadata. Generate rank-ready titles and 50 keywords with 1-click CSV export today.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStartMetadata}
            className="px-8 py-3.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg inline-flex items-center gap-2 group"
          >
            <span>Launch Generator</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={onStartPrompt}
            className="px-7 py-3.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white dark:bg-zinc-200 dark:hover:bg-zinc-300 dark:text-zinc-900 font-semibold text-xs tracking-wider transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Try Image to Prompt</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-8 pb-4 border-t border-zinc-300/70 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 cursor-pointer group w-fit"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center shadow-md text-white dark:text-zinc-950 transition-all duration-300 group-hover:scale-105">
                <Rabbit size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-50 leading-none">Melo</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-400/80 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/25 px-2 py-0.5 rounded-full leading-none">FREE</span>
                </div>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">By Mainul</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              AI-powered stock metadata generator and prompt engine for microstock contributors worldwide. Developed by Mainul.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Features</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  Batch Processing
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={onOpenCalendar} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  2026 Event Calendar
                </button>
              </li>
              <li>
                <button onClick={onStartPrompt} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  Image to Prompt
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setTermsModalOpen(true)} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left">
                  FAQ & Guidelines
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Community & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Community</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.facebook.com/mainul.islam389" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 text-left"
                >
                  <span>Facebook Profile</span>
                  <ExternalLink size={11} className="opacity-60" />
                </a>
              </li>
              <li>
                <button onClick={() => handleSocialClick('WhatsApp')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-left">
                  <span>WhatsApp Contact</span>
                  <ExternalLink size={11} className="opacity-60" />
                </button>
              </li>
              <li>
                <button onClick={() => handleSocialClick('Support Group')} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-left">
                  <span>Support Community</span>
                  <ExternalLink size={11} className="opacity-60" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar strictly highlighting Melo & Mainul */}
        <div className="pt-4 border-t border-zinc-300/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            © 2026 Melo. All rights reserved. Built for microstock creators.
          </div>
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium text-xs sm:text-sm">
            <span>Developed By</span>
            <a
              href="https://www.facebook.com/mainul.islam389"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-zinc-950 dark:text-white tracking-tight bg-zinc-200/90 dark:bg-white/15 hover:bg-zinc-300 dark:hover:bg-white/25 transition-all px-3 py-1 rounded-lg text-sm sm:text-base inline-flex items-center gap-1.5 shadow-2xs group cursor-pointer"
              title="Mainul's Facebook Profile"
            >
              <span className="font-extrabold text-zinc-900 dark:text-zinc-50">©Mainul</span>
              <ExternalLink size={13} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </footer>

      {/* PRIVACY POLICY MODAL */}
      <AnimatePresence>
        {privacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-300/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-500" />
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-50">Privacy Policy</h3>
                </div>
                <button
                  onClick={() => setPrivacyModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Last Updated: 2026 • Melo Stock Metadata Suite
                </p>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">1. Client-Side Privacy First</h4>
                  <p>All image and vector analysis runs strictly in-memory inside your browser session. Melo never saves, trains on, or collects your proprietary stock assets.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">2. Bring Your Own Key (BYOK) Security</h4>
                  <p>When you enter your Google Gemini API key, it is stored securely in your browser's local storage and communicated solely with the respective official LLM endpoints.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">3. Zero Data Harvesting</h4>
                  <p>We do not track, sell, or monetize user data. Generated CSVs, keywords, and titles belong 100% to you for your commercial microstock portfolio.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPrivacyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TERMS OF SERVICE MODAL */}
      <AnimatePresence>
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-300/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-50">Terms of Service</h3>
                </div>
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Fair Usage & Commercial Rights for Contributors
                </p>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">1. Commercial Freedom</h4>
                  <p>All metadata, keyword sequences, descriptions, and CSV spreadsheets generated by Melo are 100% royalty-free and can be submitted to Adobe Stock, Shutterstock, Freepik, Getty, or any marketplace without restriction.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">2. Accuracy & Reviewer Compliance</h4>
                  <p>While Melo uses advanced AI vision to optimize metadata and check for trademark risks, creators are encouraged to conduct a final inspection before submitting to stock agency review queues.</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">3. Free Access Commitment</h4>
                  <p>Melo is provided as a community-first, free utility by Mainul for stock contributors worldwide.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEMO CSV ROW PREVIEW MODAL */}
      <AnimatePresence>
        {demoCsvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-300/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Table size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-zinc-900 dark:text-zinc-50">
                      Standard Microstock CSV Row Preview
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Ready for direct upload to Adobe Stock, Shutterstock, Freepik & ESP/Getty
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDemoCsvModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Platform selector inside CSV modal */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">Format Template:</span>
                  <div className="inline-flex p-1 rounded-xl bg-[#DFE3EA] dark:bg-[#141822] border border-zinc-300/60 dark:border-white/10">
                    {(['adobe', 'shutterstock', 'freepik'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setDemoPlatform(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          demoPlatform === p
                            ? 'bg-white dark:bg-[#252D3F] text-zinc-950 dark:text-white shadow-2xs'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500">
                  Encoding: <span className="font-mono text-zinc-700 dark:text-zinc-300">UTF-8 / RFC 4180</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-zinc-300/60 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#121620]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE3EA]/70 dark:bg-[#161B26] border-b border-zinc-300/60 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 w-40">Filename</th>
                        <th className="p-3 w-56">Title</th>
                        <th className="p-3">Keywords ({activeAsset.keywords.length})</th>
                        <th className="p-3 w-32">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-zinc-800 dark:text-zinc-200">
                      <tr className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 align-top">
                          {activeAsset.filename}
                        </td>
                        <td className="p-3 font-medium align-top">
                          {activeAsset.title}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 align-top leading-relaxed max-w-xs break-words">
                          {activeAsset.keywords.join(', ')}
                        </td>
                        <td className="p-3 align-top">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700">
                            {activeAsset.category}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw CSV Text block */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Raw CSV Output String</span>
                <pre className="p-3 rounded-xl bg-[#DFE3EA]/80 dark:bg-[#121620] border border-zinc-300/60 dark:border-white/10 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all select-all">
                  Filename,Title,Description,Keywords,Category{"\n"}
                  "{activeAsset.filename}","{activeAsset.title.replace(/"/g, '""')}","{activeAsset.title.replace(/"/g, '""')}","{activeAsset.keywords.join(', ')}","{activeAsset.category}"
                </pre>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Filename,Title,Description,Keywords,Category\n"${activeAsset.filename}","${activeAsset.title.replace(/"/g, '""')}","${activeAsset.title.replace(/"/g, '""')}","${activeAsset.keywords.join(', ')}","${activeAsset.category}"`
                    );
                    setCopiedId('csv');
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#DFE3EA] dark:bg-[#252D3F] text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-300/60 dark:border-white/10 hover:bg-[#D5D9E2] dark:hover:bg-[#2F384E] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {copiedId === 'csv' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedId === 'csv' ? 'Copied CSV Row!' : 'Copy Raw CSV Text'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDemoCsvModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadDemoCsv}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Download size={13} />
                    <span>Download .CSV File</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOCIAL COMMUNITY MODAL */}
      <AnimatePresence>
        {socialModalInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-zinc-300/60 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-indigo-500" />
                  <h3 className="font-display font-bold text-base text-zinc-900 dark:text-zinc-50">{socialModalInfo.name}</h3>
                </div>
                <button
                  onClick={() => setSocialModalInfo(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {socialModalInfo.details}
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSocialModalInfo(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.open(socialModalInfo.url, '_blank', 'noopener,noreferrer');
                    setSocialModalInfo(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Community</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
