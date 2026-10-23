import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  ArrowLeft, 
  MessageSquarePlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  X, 
  Send, 
  Loader2, 
  Check, 
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ContributorReview, 
  subscribeToReviews, 
  submitContributorReview,
  computeInitials 
} from '../services/reviewService';

interface AllReviewsPageProps {
  onBack: () => void;
  onStartMetadata: () => void;
}

const PRESET_PLATFORMS = [
  'Adobe Stock Diamond Contributor',
  'Shutterstock Top Seller',
  'Freepik Exclusive Contributor',
  'Getty Images / iStock Artist',
  'Vecteezy Pro Contributor',
  'Generative AI Stock Creator'
];

const PRESET_BADGES = [
  'Vector Artist',
  'Commercial Photographer',
  '3D Render Artist',
  'Generative AI Pro',
  'Video & Drone Footage',
  'Graphic Designer'
];

const PRESET_STATS = [
  'Top 1% Global Rank',
  '99.4% Acceptance Rate',
  '15,000+ Monthly DLs',
  '24,000+ Assets Sold',
  'Studio Contributor',
  'Full-Time Stock Creator'
];

export const AllReviewsPage: React.FC<AllReviewsPageProps> = ({ onBack, onStartMetadata }) => {
  const [reviews, setReviews] = useState<ContributorReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | 'community'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest'>('newest');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState(PRESET_PLATFORMS[0]);
  const [badge, setBadge] = useState(PRESET_BADGES[0]);
  const [stats, setStats] = useState(PRESET_STATS[1]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to live reviews
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const unsubscribe = subscribeToReviews((updatedReviews) => {
      setReviews(updatedReviews);
    });
    return () => unsubscribe();
  }, []);

  // Compute metrics
  const statsSummary = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, count: 0, fiveStarPct: 100, verifiedCount: 0 };
    const total = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = (total / reviews.length).toFixed(1);
    const fiveStar = reviews.filter(r => (r.rating || 5) === 5).length;
    const fiveStarPct = Math.round((fiveStar / reviews.length) * 100);
    const verifiedCount = reviews.filter(r => r.isVerified !== false).length;
    return { avg, count: reviews.length, fiveStarPct, verifiedCount };
  }, [reviews]);

  // Filtered & Sorted reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.badge.toLowerCase().includes(q) ||
        r.quote.toLowerCase().includes(q) ||
        (r.stats && r.stats.toLowerCase().includes(q))
      );
    }

    // Rating filter
    if (filterRating === '5') {
      list = list.filter(r => (r.rating || 5) === 5);
    } else if (filterRating === '4') {
      list = list.filter(r => (r.rating || 5) >= 4);
    } else if (filterRating === 'community') {
      list = list.filter(r => r.id.startsWith('review_'));
    }

    // Tag / Specialization filter
    if (filterTag !== 'all') {
      list = list.filter(r => 
        r.badge.toLowerCase().includes(filterTag.toLowerCase()) ||
        r.role.toLowerCase().includes(filterTag.toLowerCase())
      );
    }

    // Sorting
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'highest') {
      list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    }

    return list;
  }, [reviews, searchQuery, filterRating, filterTag, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide your name or contributor alias.');
      return;
    }
    if (!quote.trim() || quote.trim().length < 10) {
      setErrorMessage('Please write at least 10 characters for your review message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitContributorReview({
        name: name.trim(),
        role: role.trim(),
        badge: badge.trim(),
        stats: stats.trim(),
        quote: quote.trim(),
        rating
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setIsModalOpen(false);
          setName('');
          setQuote('');
          setRating(5);
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred while saving review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-300/70 dark:border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Workspace</span>
        </button>

        <button
          onClick={() => {
            setErrorMessage(null);
            setSubmitSuccess(false);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
        >
          <MessageSquarePlus size={15} className="text-amber-400 dark:text-amber-500" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Hero Header & Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            <span>Community Wall</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Contributor Reviews & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            Read transparent reviews from stock creators worldwide using Melo to generate 50-keyword SEO architecture, embed EPS previews, and export 1-click marketplace CSVs.
          </p>
        </div>

        {/* Rating Card */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-[#DFE3EA]/90 dark:bg-[#151A26] border border-zinc-300/70 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Average Rating
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black font-display text-zinc-900 dark:text-zinc-50">
                {statsSummary.avg}
              </span>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                out of 5.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 pt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-300/60 dark:border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/40 dark:bg-white/5">
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{statsSummary.count}</div>
              <div className="text-[10px] text-zinc-500">Total Reviews</div>
            </div>
            <div className="p-2 rounded-xl bg-white/40 dark:bg-white/5">
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{statsSummary.fiveStarPct}%</div>
              <div className="text-[10px] text-zinc-500">5-Star Ratings</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="p-4 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews by name, marketplace, keyword, or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#151A26] border border-zinc-300/70 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-semibold whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#151A26] border border-zinc-300/70 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-zinc-400 font-semibold flex items-center gap-1 shrink-0 mr-1 text-[11px]">
            <SlidersHorizontal size={13} />
            Categories:
          </span>

          {[
            { id: 'all', label: 'All Reviews' },
            { id: '5', label: '5-Star Ratings' },
            { id: 'community', label: 'Community Added' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setFilterRating(r.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer text-xs ${
                filterRating === r.id
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs'
                  : 'bg-white dark:bg-[#151A26] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300/50 dark:border-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}

          <div className="h-4 w-px bg-zinc-300 dark:bg-white/10 mx-1 shrink-0" />

          {[
            { id: 'all', label: 'All Mediums' },
            { id: 'vector', label: 'Vectors' },
            { id: 'photo', label: 'Photos' },
            { id: 'adobe', label: 'Adobe Stock' },
            { id: 'shutter', label: 'Shutterstock' },
            { id: 'freepik', label: 'Freepik' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTag(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer text-xs ${
                filterTag === t.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-[#151A26] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300/50 dark:border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS GRID */}
      {displayedReviews.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-dashed border-zinc-300 dark:border-white/10 space-y-3">
          <Star size={36} className="mx-auto text-amber-500/40" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No matching reviews found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting filters to view all contributor experiences.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterRating('all');
              setFilterTag('all');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedReviews.map((item) => {
            const isUserGenerated = item.id.startsWith('review_');
            return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between relative overflow-hidden"
              >
                {isUserGenerated && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < (item.rating || 5) ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'} 
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isUserGenerated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Community
                        </span>
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                    "{item.quote}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-zinc-300/60 dark:border-white/5 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                      {item.initials || computeInitials(item.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </h4>
                        {item.isVerified && (
                          <span title="Verified Contributor" className="inline-flex">
                            <ShieldCheck size={12} className="text-blue-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {item.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {item.stats || 'Verified'}
                    </div>
                    <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center justify-end gap-1">
                      <Calendar size={9} />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* BOTTOM CTA */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-[#1C2232] dark:to-[#151A26] text-white border border-zinc-800 dark:border-white/10 shadow-lg text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold font-display">
          Ready to supercharge your microstock earnings?
        </h2>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto">
          Join thousands of contributors streamlining their metadata generation, approval rates, and marketplace CSV workflows for free.
        </p>
        <div className="pt-2">
          <button
            onClick={onStartMetadata}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            <span>Launch Melo Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* SUBMISSION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#181E2B] rounded-3xl border border-zinc-300/80 dark:border-white/15 shadow-2xl p-6 sm:p-8 my-8 text-zinc-900 dark:text-zinc-100 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                    <Sparkles size={14} />
                    <span>Contributor Showcase</span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-50">
                    Share Your Melo Experience
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto py-4 space-y-5 pr-1 scrollbar-thin">
                {submitSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center shadow-lg">
                      <Check size={32} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        Thank You! Your review has been published successfully!
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                        Your review has been permanently saved to the Melo Contributor Showcase and is now visible to stock artists worldwide.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating Picker */}
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#131722] border border-zinc-200 dark:border-white/5 space-y-2">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        Select Your Rating:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              onClick={() => setRating(star)}
                              className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                            >
                              <Star
                                size={28}
                                className={`transition-colors ${
                                  star <= (hoverRating ?? rating)
                                    ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                                    : 'text-zinc-300 dark:text-zinc-700'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                          {rating === 5 && 'Outstanding (5/5)'}
                          {rating === 4 && 'Very Good (4/5)'}
                          {rating === 3 && 'Good (3/5)'}
                          {rating === 2 && 'Fair (2/5)'}
                          {rating === 1 && 'Needs Improvement (1/5)'}
                        </span>
                      </div>
                    </div>

                    {/* Contributor Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                        <span>Your Full Name or Creator Handle *</span>
                        <span className="text-[10px] text-zinc-400">e.g. Mahim Islam, Alex Rivera</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>

                    {/* Contributor Role / Marketplace */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        Primary Marketplace / Contributor Role:
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Adobe Stock Contributor, Freepik Pro"
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESET_PLATFORMS.map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setRole(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                              role === preset 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Asset Medium / Badge */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                        Specialty / Medium Badge:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_BADGES.map((b) => (
                          <button
                            type="button"
                            key={b}
                            onClick={() => setBadge(b)}
                            className={`text-[11px] px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                              badge === b
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-300/40 dark:border-white/5'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stats or Achievement Pill */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                        <span>Milestone / Achievement Tag (Optional)</span>
                        <span className="text-[10px] text-zinc-400">Highlights on your card</span>
                      </label>
                      <input
                        type="text"
                        value={stats}
                        onChange={(e) => setStats(e.target.value)}
                        placeholder="e.g. 5,000+ Downloads, Top 5% Contributor"
                        className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {PRESET_STATS.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setStats(s)}
                            className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                              stats === s
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>Your Review & Experience *</span>
                        <span className={`text-[10px] ${quote.length < 10 ? 'text-amber-500' : 'text-zinc-400'}`}>
                          {quote.length}/500 chars (min 10)
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={quote}
                        onChange={(e) => setQuote(e.target.value.slice(0, 500))}
                        placeholder="Tell the contributor community how Melo helped your metadata workflow, approval rates, keyword indexing, or sales..."
                        required
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#131722] border border-zinc-300 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                      />
                    </div>

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Persistence Info */}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>
                        Your review will be stored permanently in cloud storage and displayed to all visitors.
                      </span>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || quote.trim().length < 10}
                        className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Publish Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
