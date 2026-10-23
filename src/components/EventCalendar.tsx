import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  Sparkles, 
  Copy, 
  Check, 
  Lightbulb, 
  Clock, 
  ArrowUpRight, 
  Flame, 
  X,
  Compass,
  CalendarDays,
  Share2
} from 'lucide-react';
import { STOCK_EVENTS_2026, StockEvent } from '../data/eventsData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CATEGORIES = [
  'All',
  'International',
  'Cultural',
  'Religious',
  'Islamic',
  'Business',
  'Tech',
  'Health',
  'Fun',
  'National',
  'US_UK',
  'Family',
  'Event'
];

function getCategoryBadge(cat: string) {
  const norm = cat.toLowerCase();
  if (norm.includes('islamic')) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  if (norm.includes('relig')) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  }
  if (norm.includes('tech')) {
    return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  }
  if (norm.includes('business')) {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
  if (norm.includes('health')) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
  if (norm.includes('fun')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
  if (norm.includes('us_uk')) {
    return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }
  if (norm.includes('cultur')) {
    return 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20';
  }
  return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
}

function generatePromptForEvent(event: StockEvent): string {
  return `High quality, commercially viable photorealistic stock photo representing ${event.title}, concept: ${event.idea}. Professional studio lighting, rich depth of field, vivid detail, authentic candid moment, 8k resolution, copy space for text, commercial microstock ready.`;
}

interface EventCalendarProps {
  onUseInPromptTab?: (prompt: string) => void;
}

export function EventCalendar({ onUseInPromptTab }: EventCalendarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Fast reference date computed once per session
  const todayMidnight = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  // Filter events with ultra-fast zero-allocation date checks
  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return STOCK_EVENTS_2026.filter(ev => {
      // Direct string slice: ev.date is "YYYY-MM-DD"
      const evMonth = parseInt(ev.date.slice(5, 7), 10) - 1;

      if (selectedMonth !== 'all' && evMonth !== selectedMonth) {
        return false;
      }

      if (selectedCategory !== 'All') {
        if (selectedCategory === 'International') {
          if (!['International', 'Cultural', 'National', 'Event'].includes(ev.category)) {
            return false;
          }
        } else if (ev.category !== selectedCategory) {
          return false;
        }
      }

      if (term) {
        const matchesTitle = ev.title.toLowerCase().includes(term);
        const matchesIdea = ev.idea.toLowerCase().includes(term);
        const matchesCategory = ev.category.toLowerCase().includes(term);
        const matchesDate = ev.date.includes(term);
        if (!matchesTitle && !matchesIdea && !matchesCategory && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, selectedMonth, selectedCategory]);

  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  const handleCopyPrompt = (ev: StockEvent, index: number) => {
    const prompt = generatePromptForEvent(ev);
    navigator.clipboard.writeText(prompt);
    const id = `${ev.date}-${index}`;
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyIdea = (ev: StockEvent, index: number) => {
    navigator.clipboard.writeText(`${ev.title}: ${ev.idea}`);
    const id = `idea-${ev.date}-${index}`;
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const calculateDaysDiff = (dateStr: string) => {
    const y = parseInt(dateStr.slice(0, 4), 10);
    const m = parseInt(dateStr.slice(5, 7), 10) - 1;
    const d = parseInt(dateStr.slice(8, 10), 10);
    const targetMidnight = new Date(y, m, d).getTime();
    return Math.ceil((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Top Banner / Hero Header */}
      <div className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFE3EA] dark:bg-white/5 border border-zinc-300/60 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <CalendarDays size={14} className="text-indigo-500" />
              <span>Stock Event Calendar 2026</span>
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{STOCK_EVENTS_2026.length} Global Events</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              Commercial Events & AI Stock Prompts
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Explore 770+ international observances, cultural festivals, and trending seasonal topics. 
              Stock contributors: upload and index your photos, vectors, and videos <strong className="text-zinc-800 dark:text-zinc-200">30–60 days ahead</strong> for peak search volume.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert('Calendar link copied to clipboard!');
              }}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#DFE3EA] hover:bg-[#D5D9E2] dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-300/70 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
              title="Share calendar"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCount(24);
              }}
              placeholder="Search event name, idea concept (e.g. Ramadan, Christmas, Earth Day)..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#DFE3EA] dark:bg-[#161B26] border border-zinc-300/70 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredEvents.length}</span> Events Found
            </div>

            {(searchTerm || selectedMonth !== 'all' || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedMonth('all');
                  setSelectedCategory('All');
                  setVisibleCount(24);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector Pills */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon size={13} className="text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filter by Month</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('all');
                setVisibleCount(24);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                selectedMonth === 'all'
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              )}
            >
              All 2026
            </button>
            {MONTH_NAMES.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setSelectedMonth(idx);
                  setVisibleCount(24);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                  selectedMonth === idx
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                )}
              >
                {MONTH_SHORT[idx]}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter size={13} className="text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Categories</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(24);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border",
                  selectedCategory === cat
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs font-semibold"
                    : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                )}
              >
                {cat.replace('_', ' & ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {displayedEvents.length === 0 ? (
        <div className="bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DFE3EA] dark:bg-white/5 flex items-center justify-center mx-auto text-zinc-400">
            <CalendarIcon size={22} />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No events found matching your filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search keyword or clearing the month and category filters to see all 777 events.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedMonth('all');
              setSelectedCategory('All');
            }}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEvents.map((ev, index) => {
            const mIdx = parseInt(ev.date.slice(5, 7), 10) - 1;
            const monthStr = MONTH_SHORT[mIdx] || '';
            const dayNum = parseInt(ev.date.slice(8, 10), 10);
            const daysDiff = calculateDaysDiff(ev.date);
            const promptCopied = copiedId === `${ev.date}-${index}`;
            const ideaCopied = copiedId === `idea-${ev.date}-${index}`;

            return (
              <div
                key={`${ev.date}-${index}`}
                className="fast-event-card bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/60 dark:border-white/10 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-zinc-400/60 dark:hover:border-white/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top bar: Date & Category & Countdown */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Calendar Date Block */}
                      <div className="flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-[#DFE3EA] dark:bg-[#141824] border border-zinc-300/60 dark:border-white/10 text-center shrink-0">
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                          {monthStr}
                        </span>
                        <span className="text-base font-extrabold text-zinc-900 dark:text-white leading-none">
                          {dayNum}
                        </span>
                      </div>

                      <div>
                        <span className={cn(
                          "inline-block text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border",
                          getCategoryBadge(ev.category)
                        )}>
                          {ev.category.replace('_', ' & ')}
                        </span>
                        <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          <span>
                            {daysDiff > 0 ? `In ${daysDiff} days` : daysDiff === 0 ? 'Today' : `${Math.abs(daysDiff)} days ago`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {daysDiff > 0 && daysDiff <= 45 && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Flame size={10} />
                        <span>Submit Now</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {ev.title}
                  </h3>

                  {/* Concept Idea Box */}
                  <div className="p-3 rounded-xl bg-[#DFE3EA]/80 dark:bg-[#141824] border border-zinc-300/50 dark:border-white/5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      <Lightbulb size={11} className="text-amber-500" />
                      <span>Stock Visual Idea</span>
                    </div>
                    <p className="line-clamp-3" title={ev.idea}>
                      {ev.idea}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-zinc-300/40 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(ev, index)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-indigo-200 dark:border-indigo-500/20"
                  >
                    {promptCopied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span>Copied Prompt!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Copy AI Prompt</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyIdea(ev, index)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {ideaCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{ideaCopied ? 'Copied' : 'Copy Idea'}</span>
                    </button>

                    {onUseInPromptTab && (
                      <button
                        type="button"
                        onClick={() => onUseInPromptTab(generatePromptForEvent(ev))}
                        className="py-1.5 px-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                        title="Use in Image to Prompt"
                      >
                        <ArrowUpRight size={12} />
                        <span>Use</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {displayedEvents.length < filteredEvents.length && (
        <div className="text-center pt-4 pb-8">
          <button
            type="button"
            onClick={() => setVisibleCount(c => c + 24)}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-[#18181B] hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-sm transition-all cursor-pointer hover:shadow active:scale-95"
          >
            Load More Events ({filteredEvents.length - displayedEvents.length} remaining)
          </button>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 pt-4 border-t border-zinc-200 dark:border-white/5">
        <span>Stock Event Calendar 2026 — Daily Trending Ideas & Commercial AI Prompts for Contributors</span>
      </div>
    </div>
  );
}
