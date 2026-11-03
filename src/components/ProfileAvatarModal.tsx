import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Camera, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  AVATAR_PRESETS, 
  resolveUserAvatar, 
  processImageFileToDataUrl, 
  getFallbackAvatarUrl 
} from '../lib/avatarHelper';

interface ProfileAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdateAvatar: (newPhotoURL: string) => Promise<void>;
}

export const ProfileAvatarModal: React.FC<ProfileAvatarModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateAvatar
}) => {
  const currentInitialAvatar = resolveUserAvatar(currentUser);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentInitialAvatar);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    try {
      const dataUrl = await processImageFileToDataUrl(file, 300);
      setSelectedAvatar(dataUrl);
      setCustomUrl('');
      setNotification({ type: 'success', message: 'Photo loaded! Click Save to apply.' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to process image. Try a smaller file.' });
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatar(customUrl.trim());
    setNotification({ type: 'success', message: 'Custom image URL applied! Click Save to confirm.' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      await onUpdateAvatar(selectedAvatar);
      setNotification({ type: 'success', message: 'Profile picture updated successfully!' });
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSaving(false);
      setNotification({ type: 'error', message: err.message || 'Failed to update profile picture.' });
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300/80 dark:border-white/10 shadow-2xl p-6 text-zinc-900 dark:text-zinc-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Customize Profile Picture
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-5 space-y-2">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#252E42] shadow-xl bg-zinc-200 dark:bg-zinc-700">
              <img 
                src={selectedAvatar} 
                alt="Profile Preview" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getFallbackAvatarUrl(currentUser?.email || 'melo');
                }}
                className="w-full h-full object-cover" 
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-all active:scale-95"
              title="Upload new image"
            >
              <Upload size={14} />
            </button>
          </div>
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {currentUser?.displayName || 'Melo Creator'}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Visible across Header, Admin Control Center & Contributor workspace
          </p>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`mb-4 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
              : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
            <span className="flex-1">{notification.message}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Section 1: Upload from Device */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Choose or Upload Photo
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload size={11} />
              <span>Upload from device</span>
            </button>
          </div>

          {/* Curated Presets Grid */}
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedAvatar === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(preset.url);
                    setCustomUrl('');
                  }}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer group shadow-2xs ${
                    isSelected 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105' 
                      : 'border-zinc-200 dark:border-white/10 hover:border-zinc-400 opacity-80 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom URL Input */}
        <div className="space-y-1.5 mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Or Paste Custom Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-white dark:bg-[#131722] border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              disabled={!customUrl.trim()}
              className="px-3 py-2 bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-200 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} />
                <span>Save Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
