// Avatar utilities to guarantee user profile pictures are always visible and customizable

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'sneaker-creator',
    name: 'Sneaker & Streetwear Pro',
    url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=200&q=80',
    category: 'Creative'
  },
  {
    id: 'photographer-lens',
    name: 'Studio Photographer',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    category: 'Photography'
  },
  {
    id: '3d-artist',
    name: '3D Designer & CGI',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    category: '3D Art'
  },
  {
    id: 'digital-illustrator',
    name: 'Digital Illustrator',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    category: 'Illustration'
  },
  {
    id: 'stock-contributor',
    name: 'Microstock Contributor',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    category: 'Stock'
  },
  {
    id: 'creative-director',
    name: 'Creative Director',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    category: 'Leadership'
  }
];

export function getFallbackAvatarUrl(seedStr?: string): string {
  const seed = encodeURIComponent(seedStr || 'melo_creator');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Resolves a profile picture URL. Always returns a valid, high-resolution URL.
 * Never returns null or empty string so an avatar image is always visible.
 */
export function resolveUserAvatar(
  user?: { photoURL?: string | null; name?: string; displayName?: string; email?: string; id?: string } | null
): string {
  if (user?.photoURL && typeof user.photoURL === 'string' && user.photoURL.trim().length > 0) {
    return user.photoURL.trim();
  }
  const seed = user?.displayName || user?.name || user?.email || user?.id || 'creator';
  return getFallbackAvatarUrl(seed);
}

/**
 * Resizes an uploaded image file to a lightweight data URL for profile pictures.
 */
export function processImageFileToDataUrl(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
