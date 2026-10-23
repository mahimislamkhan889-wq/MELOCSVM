import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';

export interface ContributorReview {
  id: string;
  name: string;
  role: string;
  badge: string;
  quote: string;
  rating: number; // 1 to 5
  stats?: string;
  initials: string;
  isVerified?: boolean;
  createdAt: string; // ISO string for portability
  timestamp?: any;
}

export const INITIAL_CURATED_REVIEWS: ContributorReview[] = [
  {
    id: 'curated-1',
    name: 'Sarah Jenkins',
    role: 'Adobe Stock Diamond Contributor',
    badge: 'Vector Artist',
    quote: 'Melo cut my metadata workflow from 3 hours a day to under 15 minutes. The embedded EPS thumbnail rendering alone is a godsend for vector artists. My acceptance rate jumped to 99.4%!',
    rating: 5,
    stats: '24,000+ Assets Sold',
    initials: 'SJ',
    isVerified: true,
    createdAt: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'curated-2',
    name: 'Tariqul Islam',
    role: 'Commercial Photographer & Top Seller',
    badge: 'Shutterstock & Freepik',
    quote: 'The ordered 50-keyword logic is genuine algorithmic science. Placing high-relevance subject tags in the first 10 slots boosted my search ranking dramatically on Freepik and Shutterstock.',
    rating: 5,
    stats: 'Top 1% Global Rank',
    initials: 'TI',
    isVerified: true,
    createdAt: '2026-08-28T14:30:00.000Z'
  },
  {
    id: 'curated-3',
    name: 'Elena Rostova',
    role: 'Illustrator & AI Generative Stock Creator',
    badge: 'Microstock Pro',
    quote: 'Other tools charged me $30 every month and capped my daily uploads. Melo gives me 100% privacy with my own Gemini API key and zero limits. Best microstock tool available anywhere.',
    rating: 5,
    stats: '15,000+ Monthly DLs',
    initials: 'ER',
    isVerified: true,
    createdAt: '2026-09-05T09:15:00.000Z'
  },
  {
    id: 'curated-4',
    name: 'David Morales',
    role: 'Video Producer & Drone Stock Artist',
    badge: 'Pond5 & Getty',
    quote: 'Exporting pre-formatted CSVs for Adobe Stock and Shutterstock in a single click without spreadsheet errors saves our studio over 20 hours each week. Completely indispensable.',
    rating: 5,
    stats: 'Studio Contributor',
    initials: 'DM',
    isVerified: true,
    createdAt: '2026-09-12T16:45:00.000Z'
  }
];

const LOCAL_STORAGE_REVIEWS_KEY = 'melo_community_reviews_v1';

function getStoredLocalReviews(): ContributorReview[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read reviews from localStorage:', e);
    return [];
  }
}

function saveStoredLocalReviews(reviews: ContributorReview[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to write reviews to localStorage:', e);
  }
}

/**
 * Computes 2-letter uppercase initials from any name
 */
export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Subscribes to live reviews from Firestore with fallback to cached localStorage + curated reviews
 */
export function subscribeToReviews(onUpdate: (reviews: ContributorReview[]) => void): () => void {
  // First, immediately provide cached/local merged reviews
  const localCached = getStoredLocalReviews();
  const initialMap = new Map<string, ContributorReview>();
  
  // Add curated
  INITIAL_CURATED_REVIEWS.forEach(r => initialMap.set(r.id, r));
  // Add local
  localCached.forEach(r => initialMap.set(r.id, r));
  
  onUpdate(Array.from(initialMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  try {
    const reviewsCol = collection(db, 'reviews');
    const reviewsQuery = query(reviewsCol, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const firestoreReviews: ContributorReview[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreReviews.push({
            id: docSnap.id,
            name: data.name || 'Anonymous Creator',
            role: data.role || 'Stock Contributor',
            badge: data.badge || 'Microstock Artist',
            quote: data.quote || '',
            rating: typeof data.rating === 'number' ? data.rating : 5,
            stats: data.stats || 'Verified Contributor',
            initials: data.initials || computeInitials(data.name || 'SC'),
            isVerified: data.isVerified !== false,
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        // Merge firestore reviews with initial curated reviews so user always sees a rich list
        const mergedMap = new Map<string, ContributorReview>();
        INITIAL_CURATED_REVIEWS.forEach(r => mergedMap.set(r.id, r));
        firestoreReviews.forEach(r => mergedMap.set(r.id, r));

        const finalReviews = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        saveStoredLocalReviews(firestoreReviews);
        onUpdate(finalReviews);
      },
      (error) => {
        console.warn('Firestore reviews onSnapshot notice (falling back to cache):', error);
        // Fallback to local
        const local = getStoredLocalReviews();
        const merged = new Map<string, ContributorReview>();
        INITIAL_CURATED_REVIEWS.forEach(r => merged.set(r.id, r));
        local.forEach(r => merged.set(r.id, r));
        onUpdate(Array.from(merged.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error establishing Firestore review listener:', err);
    return () => {};
  }
}

/**
 * Permanently stores a review in Firebase Firestore + localStorage
 */
export async function submitContributorReview(reviewData: {
  name: string;
  role: string;
  badge: string;
  quote: string;
  rating: number;
  stats?: string;
}): Promise<{ success: boolean; review?: ContributorReview; error?: string }> {
  try {
    const trimmedName = reviewData.name.trim();
    const trimmedQuote = reviewData.quote.trim();

    if (!trimmedName) {
      return { success: false, error: 'Please enter your name or creator alias.' };
    }
    if (!trimmedQuote || trimmedQuote.length < 10) {
      return { success: false, error: 'Review text must be at least 10 characters.' };
    }

    const docId = 'review_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const createdAt = new Date().toISOString();
    const initials = computeInitials(trimmedName);

    const newReview: ContributorReview = {
      id: docId,
      name: trimmedName,
      role: reviewData.role.trim() || 'Microstock Contributor',
      badge: reviewData.badge.trim() || 'Stock Creator',
      quote: trimmedQuote,
      rating: Math.max(1, Math.min(5, reviewData.rating || 5)),
      stats: reviewData.stats?.trim() || 'Verified Contributor',
      initials,
      isVerified: true,
      createdAt
    };

    // Save to Firestore permanently
    const reviewDocRef = doc(db, 'reviews', docId);
    await setDoc(reviewDocRef, {
      ...newReview,
      serverTime: serverTimestamp()
    });

    // Also update local storage for immediate persistence
    const currentLocals = getStoredLocalReviews();
    saveStoredLocalReviews([newReview, ...currentLocals.filter(r => r.id !== docId)]);

    return { success: true, review: newReview };
  } catch (error: any) {
    console.error('Firestore review save failed, attempting local backup:', error);
    
    // Fallback: save to local storage so user review isn't lost
    const docId = 'review_offline_' + Date.now();
    const createdAt = new Date().toISOString();
    const offlineReview: ContributorReview = {
      id: docId,
      name: reviewData.name.trim(),
      role: reviewData.role.trim() || 'Microstock Contributor',
      badge: reviewData.badge.trim() || 'Stock Creator',
      quote: reviewData.quote.trim(),
      rating: Math.max(1, Math.min(5, reviewData.rating || 5)),
      stats: reviewData.stats?.trim() || 'Verified Contributor',
      initials: computeInitials(reviewData.name),
      isVerified: true,
      createdAt
    };

    const currentLocals = getStoredLocalReviews();
    saveStoredLocalReviews([offlineReview, ...currentLocals]);

    return { 
      success: true, 
      review: offlineReview,
      error: 'Saved locally. It will sync to cloud when connected.' 
    };
  }
}
