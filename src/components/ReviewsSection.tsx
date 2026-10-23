import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  MessageSquarePlus, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  X, 
  User, 
  Award, 
  ThumbsUp, 
  Send, 
  Loader2, 
  TrendingUp,
  SlidersHorizontal,
  Check,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ContributorReview, 
  subscribeToReviews, 
  submitContributorReview,
  computeInitials 
} from '../services/reviewService';

interface ReviewsSectionProps {
  onStartMetadata?: () => void;
  onViewAllReviews?: () => void;
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

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ onStartMetadata, onViewAllReviews }) => {
  const [reviews, setReviews] = useState<ContributorReview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'community' | '5stars' | 'vectors' | 'photos'>('all');
  const [visibleCount, setVisibleCount] = useState(6);

  // Form states
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

  // Subscribe to live Firestore reviews
  useEffect(() => {
    const unsubscribe = subscribeToReviews((updatedReviews) => {
      setReviews(updatedReviews);
    });
    return () => unsubscribe();
  }, []);

  // Compute aggregate stats
  const aggregate = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, count: 0, fiveStarCount: 0 };
    const total = reviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    const avg = (total / reviews.length).toFixed(1);
    const fiveStarCount = reviews.filter(r => (r.rating || 5) === 5).length;
    return { avg, count: reviews.length, fiveStarCount };
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterType === '5stars') return (r.rating || 5) === 5;
      if (filterType === 'community') return r.id.startsWith('review_');
      if (filterType === 'vectors') return r.badge.toLowerCase().includes('vector') || r.role.toLowerCase().includes('vector');
      if (filterType === 'photos') return r.badge.toLowerCase().includes('photo') || r.role.toLowerCase().includes('photo');
      return true;
    });
  }, [reviews, filterType]);

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
          // Reset form fields
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
    <section id="testimonials" className="space-y-8 scroll-mt-24">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-zinc-300/60 dark:border-white/10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Star size={13} className="fill-amber-500 text-amber-500" />
            <span>Community Verified Stories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Trusted by Thousands of Stock Creators
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Real microstock contributors, vector illustrators, and commercial studios share how Melo eliminated rejections and maximized their microstock royalty revenue.
          </p>
        </div>

        {/* Action Button & Overall Rating */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs">
            <div className="text-2xl font-black font-display text-zinc-900 dark:text-zinc-50">
              {aggregate.avg}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-500 text-amber-500" />
                ))}
              </div>
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Based on <span className="font-bold text-zinc-700 dark:text-zinc-200">{aggregate.count}</span> verified reviews
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setErrorMessage(null);
              setSubmitSuccess(false);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <MessageSquarePlus size={16} className="text-amber-400 dark:text-amber-500" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="text-zinc-400 font-semibold flex items-center gap-1 shrink-0 mr-1 text-[11px]">
          <SlidersHorizontal size={13} />
          Filter:
        </span>
        {[
          { id: 'all', label: `All Reviews (${reviews.length})` },
          { id: 'community', label: 'Community Added' },
          { id: '5stars', label: '5-Star Ratings' },
          { id: 'vectors', label: 'Vector Artists' },
          { id: 'photos', label: 'Photographers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer text-xs ${
              filterType === tab.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs'
                : 'bg-[#ECEEF4] dark:bg-[#1C2232] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300/50 dark:border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REVIEWS GRID */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-dashed border-zinc-300 dark:border-white/10 space-y-3">
          <Star size={32} className="mx-auto text-amber-500/50" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No reviews found in this filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Be the first creator to share your story or switch to "All Reviews" to view contributor testimonials.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold"
          >
            Leave Your Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.slice(0, visibleCount).map((item) => {
            const isUserGenerated = item.id.startsWith('review_');
            return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6 rounded-2xl bg-[#ECEEF4] dark:bg-[#1C2232] border border-zinc-300/70 dark:border-white/10 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle top indicator for user reviews */}
                {isUserGenerated && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />
                )}

                <div className="space-y-3">
                  {/* Rating + Badge Header */}
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

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic line-clamp-6">
                    "{item.quote}"
                  </p>
                </div>

                {/* Reviewer Details */}
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

      {/* VIEW ALL REVIEWS BUTTON (When reviews exceed 6) */}
      {reviews.length > 6 && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              if (onViewAllReviews) {
                onViewAllReviews();
              } else {
                setVisibleCount(prev => prev + 6);
              }
            }}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 group"
          >
            <span>View All Reviews ({reviews.length})</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

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
                      {/* Presets Chips */}
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

                    {/* Error display */}
                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                        {errorMessage}
                      </div>
                    )}

                    {/* Live Preview Card */}
                    <div className="p-4 rounded-xl bg-zinc-100/70 dark:bg-[#131722]/80 border border-zinc-200 dark:border-white/5 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Live Preview:
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-300 dark:text-zinc-700'} 
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                          {badge}
                        </span>
                      </div>
                      <p className="text-xs italic text-zinc-600 dark:text-zinc-300 line-clamp-2">
                        "{quote.trim() || 'Your review description will preview right here...'}"
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-white/5 text-[10px]">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {name.trim() || 'Your Name'} • <span className="text-zinc-500 font-normal">{role}</span>
                        </span>
                        <span className="text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {stats}
                        </span>
                      </div>
                    </div>

                    {/* Persistence Info Note */}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>
                        Your review will be stored permanently in cloud storage and displayed to all visitors.
                      </span>
                    </div>

                    {/* Modal Footer / Submit Button */}
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
    </section>
  );
};
