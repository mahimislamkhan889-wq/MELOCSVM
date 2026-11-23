import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Grid2x2,
  Layers,
  Sparkles,
  Wand2,
  Scissors,
  Palette,
  Plus,
  Trash2,
  Pencil,
  X,
  ExternalLink,
  Clock,
  Loader2,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

export type DesignToolIconKey =
  | 'cutout'
  | 'grid'
  | 'cube'
  | 'motion'
  | 'palette'
  | 'collage'
  | 'wand'
  | 'layers'
  | 'image';

export interface DesignToolItem {
  id: string;
  title: string;
  category: string;
  description: string;
  url?: string;
  embeddedHtmlPath?: string;
  icon: DesignToolIconKey;
  ctaLabel?: string;
  isDefault?: boolean;
}

const DEFAULT_DESIGN_TOOLS: DesignToolItem[] = [
  {
    id: 'default-melo-bg-pro',
    title: 'Melo BG Pro',
    category: 'FLAGSHIP',
    description: 'Procedural 4K background generator with 37 design families, 16 palettes, custom filters, and SVG, PNG & JPG export.',
    embeddedHtmlPath: '/assets/aistudio/Melo_BG_Pro_2462b481.html',
    icon: 'palette',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
  {
    id: 'default-melo-fx-pix',
    title: 'Melo FX PIX',
    category: 'FLAGSHIP',
    description: 'Procedural 4K visual FX generator with 648 effect styles across 27 families, 24 palettes, transparent & split overlays, and PNG/JPG export.',
    embeddedHtmlPath: '/assets/aistudio/Melo_FX_Pix_15cce269.html',
    icon: 'wand',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
  {
    id: 'default-melo-light-fx',
    title: 'Melo Light FX',
    category: 'FLAGSHIP',
    description: 'Pure vector glitter & light FX generator with 532 styles, 26 sliders, optional text overlays, custom colors, and SVG, PNG & JPG export.',
    embeddedHtmlPath: '/assets/aistudio/Melo_Light_FX_ef016291.html',
    icon: 'layers',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
  {
    id: 'default-melo-glow',
    title: 'Melo Glow',
    category: 'GLOW & GRAIN',
    description: 'Soft-feathered glow & film-grain background generator with 6 compositions, Adobe Stock presets, custom palettes, and PNG, JPG, SVG & Grain exports.',
    embeddedHtmlPath: '/assets/aistudio/Melo_Glow_aaeb47f2.html',
    icon: 'motion',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
  {
    id: 'default-melo-poster-set',
    title: 'Melo Poster Set',
    category: 'POSTER STUDIO',
    description: 'Generate 5 matching geometric gradient posters per click across 26 patterns & 12 palettes, with full-set and individual SVG/PNG exports.',
    embeddedHtmlPath: '/assets/aistudio/Melo_Poster_Set_9cbc4dec.html',
    icon: 'grid',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
  {
    id: 'default-melo-pos',
    title: 'Melo Pos',
    category: 'VECTOR POSTER',
    description: 'Stock-style poster set creator with 18 sphere, arc, line-art & geometric patterns, custom gradient palettes, editable typography, and true vector SVG & PNG export.',
    embeddedHtmlPath: '/assets/aistudio/Melo_Pos_1c80d1e4.html',
    icon: 'collage',
    ctaLabel: 'Open tool',
    isDefault: true,
  },
];

const ICON_OPTIONS: { key: DesignToolIconKey; label: string }[] = [
  { key: 'cutout', label: 'Cutout' },
  { key: 'grid', label: 'Icon Grid' },
  { key: 'cube', label: '3D Cube' },
  { key: 'motion', label: 'Motion' },
  { key: 'palette', label: 'Palette' },
  { key: 'collage', label: 'Collage' },
  { key: 'wand', label: 'Magic' },
  { key: 'layers', label: 'Layers' },
  { key: 'image', label: 'Image' },
];

function renderToolIcon(key: DesignToolIconKey) {
  switch (key) {
    case 'cutout':
      return <Scissors size={19} strokeWidth={1.8} />;
    case 'grid':
      return <Grid2x2 size={19} strokeWidth={1.8} />;
    case 'cube':
      return <Box size={19} strokeWidth={1.8} />;
    case 'motion':
      return <Sliders size={19} strokeWidth={1.8} />;
    case 'palette':
      return <Palette size={19} strokeWidth={1.8} />;
    case 'collage':
      return <Layers size={19} strokeWidth={1.8} />;
    case 'wand':
      return <Wand2 size={19} strokeWidth={1.8} />;
    case 'image':
      return <ImageIcon size={19} strokeWidth={1.8} />;
    case 'layers':
    default:
      return <Sparkles size={19} strokeWidth={1.8} />;
  }
}

function sanitizeToolUrl(raw?: string): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

interface DesignSectionProps {
  isAdmin?: boolean;
}

export const DesignSection: React.FC<DesignSectionProps> = ({ isAdmin = false }) => {
  const [customTools, setCustomTools] = useState<DesignToolItem[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [previewTool, setPreviewTool] = useState<DesignToolItem | null>(null);
  const [activeEmbeddedTool, setActiveEmbeddedTool] = useState<DesignToolItem | null>(null);

  // Admin Add / Edit Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('DESIGN TOOL');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState<DesignToolIconKey>('wand');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTools = async () => {
    setLoadingTools(true);
    try {
      const q = query(collection(db, 'design_tools'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const loaded: DesignToolItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || 'Untitled Tool'),
          category: String(data.category || 'DESIGN TOOL'),
          description: String(data.description || ''),
          url: typeof data.url === 'string' ? data.url : '',
          icon: (data.icon as DesignToolIconKey) || 'wand',
          ctaLabel: data.url ? 'Open tool' : 'Learn more',
        };
      });
      setCustomTools(loaded);
    } catch {
      // Fallback gracefully if collection doesn't exist yet
      setCustomTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Show admin's custom tools first if added, or default showcase grid when empty
  const displayedTools: DesignToolItem[] =
    customTools.length > 0 ? [...customTools, ...DEFAULT_DESIGN_TOOLS] : DEFAULT_DESIGN_TOOLS;

  const openAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('FLAGSHIP');
    setFormDescription('');
    setFormUrl('');
    setFormIcon('wand');
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditModal = (tool: DesignToolItem) => {
    setEditingId(tool.id);
    setFormTitle(tool.title);
    setFormCategory(tool.category);
    setFormDescription(tool.description);
    setFormUrl(tool.url || '');
    setFormIcon(tool.icon);
    setFormError('');
    setIsEditorOpen(true);
  };

  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      setFormError('Please enter both a tool title and short description.');
      return;
    }
    const cleanUrl = formUrl.trim();
    if (cleanUrl && !sanitizeToolUrl(cleanUrl)) {
      setFormError('Tool URL must start with https:// or http://');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const payload = {
        title: formTitle.trim().slice(0, 80),
        category: (formCategory.trim() || 'DESIGN TOOL').toUpperCase().slice(0, 28),
        description: formDescription.trim().slice(0, 260),
        url: cleanUrl,
        icon: formIcon,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'design_tools', editingId), payload);
      } else {
        await addDoc(collection(db, 'design_tools'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setIsEditorOpen(false);
      await loadTools();
    } catch (err: any) {
      setFormError(err?.message || 'Could not save tool. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'design_tools', id));
      setCustomTools((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // ignore error
    }
  };

  if (activeEmbeddedTool?.embeddedHtmlPath) {
    return (
      <div className="space-y-4 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveEmbeddedTool(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1C2232] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>Back to Design Tools</span>
            </button>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                {activeEmbeddedTool.title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeEmbeddedTool.category}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shadow-xl bg-[#111216]">
          <iframe
            src={activeEmbeddedTool.embeddedHtmlPath}
            title={activeEmbeddedTool.title}
            className="w-full h-[calc(100vh-195px)] min-h-[680px] border-0 block"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">
            Design Tools
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Curated creative utilities for stock contributors, icon designers, and visual creators.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus size={14} />
            <span>Add Tool</span>
          </button>
        )}
      </div>

      {/* 3-Column Dark-First / Dual-Theme Bento Tool Grid */}
      {loadingTools ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-64 rounded-[20px] border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-[#111018] animate-pulse p-7"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTools.map((tool) => {
            const safeHref = sanitizeToolUrl(tool.url);
            return (
              <div
                key={tool.id}
                onClick={() => {
                  if (tool.embeddedHtmlPath) {
                    setActiveEmbeddedTool(tool);
                  }
                }}
                className={cn(
                  'group relative rounded-[20px] p-6 sm:p-7 flex flex-col justify-between min-h-[256px] transition-all duration-200',
                  'bg-white hover:bg-zinc-50/90 border border-zinc-200/90 hover:border-violet-400/50 shadow-2xs hover:shadow-md',
                  'dark:bg-[#111018] dark:hover:bg-[#151320] dark:border-white/[0.09] dark:hover:border-violet-400/35',
                  'dark:bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.10),transparent_58%)]',
                  tool.embeddedHtmlPath && 'cursor-pointer'
                )}
              >
                <div>
                  {/* Top Row: Square Icon Tile + Category Label */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-500/10 dark:bg-[#1F1A30] border border-violet-500/20 dark:border-violet-400/25 flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0 transition-transform duration-200 group-hover:scale-[1.03]">
                      {renderToolIcon(tool.icon)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 dark:text-zinc-400">
                        {tool.category}
                      </span>

                      {isAdmin && !tool.isDefault && (
                        <div
                          className="flex items-center gap-0.5 ml-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditModal(tool)}
                            aria-label={`Edit ${tool.title}`}
                            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTool(tool.id)}
                            aria-label={`Delete ${tool.title}`}
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-6 text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {tool.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {tool.description}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="mt-7 pt-1">
                  {tool.embeddedHtmlPath ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEmbeddedTool(tool);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 transition-colors cursor-pointer"
                    >
                      <span>{tool.ctaLabel || 'Open tool'}</span>
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  ) : safeHref ? (
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 transition-colors"
                    >
                      <span>{tool.ctaLabel || 'Open tool'}</span>
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewTool(tool)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 transition-colors cursor-pointer"
                    >
                      <span>{tool.ctaLabel || 'Learn more'}</span>
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tool Detail / Upcoming Modal */}
      {previewTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPreviewTool(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#14131E] border border-zinc-200 dark:border-white/10 p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 dark:bg-[#1F1A30] border border-violet-500/20 dark:border-violet-400/25 flex items-center justify-center text-violet-600 dark:text-violet-300">
                {renderToolIcon(previewTool.icon)}
              </div>
              <button
                type="button"
                onClick={() => setPreviewTool(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-violet-600 dark:text-violet-300">
                {previewTool.category} · Upcoming
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {previewTool.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {previewTool.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/10">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Clock size={13} />
                <span>Launching soon</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewTool(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add / Edit Design Tool Modal */}
      {isAdmin && isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsEditorOpen(false)}
        >
          <form
            onSubmit={handleSaveTool}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#14131E] border border-zinc-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {editingId ? 'Edit Design Tool' : 'Add Design Tool'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tool Name
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Background Remover"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/30 text-zinc-900 dark:text-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Category Label
                </label>
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. FLAGSHIP, ANIMATE"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/30 text-zinc-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Short 2-line description of what this tool does..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/30 text-zinc-900 dark:text-white focus:outline-hidden resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Tool Link URL <span className="text-zinc-400 font-normal">(optional — leave blank for Upcoming)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://your-tool-link.com"
                  className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-xl border border-zinc-300 dark:border-white/15 bg-white dark:bg-black/30 text-zinc-900 dark:text-white focus:outline-hidden"
                />
                <ExternalLink size={13} className="absolute right-3 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Card Icon
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFormIcon(opt.key)}
                    className={cn(
                      'p-2 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors',
                      formIcon === opt.key
                        ? 'bg-violet-500/15 border-violet-500/50 text-violet-700 dark:text-violet-200'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                    )}
                  >
                    {renderToolIcon(opt.key)}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isSaving && <Loader2 size={13} className="animate-spin" />}
                <span>{editingId ? 'Save Changes' : 'Add Tool'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
