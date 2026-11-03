import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Pencil, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  CheckCircle2,
  Mail,
  UserCheck,
  Bot,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  Sparkles,
  Sliders,
  Play,
  Layers,
  Database,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { 
  resolveUserAvatar, 
  getFallbackAvatarUrl, 
  AVATAR_PRESETS 
} from '../lib/avatarHelper';
import { 
  validateApifyToken, 
  getStoredApifyToken, 
  saveStoredApifyToken, 
  getStoredApifyUser, 
  isApifyAutoScrapeEnabled, 
  setApifyAutoScrapeEnabled,
  fetchApifyConfigFromFirestore,
  saveApifyConfigToFirestore,
  testApifyScrapeSandbox,
  ApifyUser
} from '../services/apifyService';

export type UserStatus = 'Active' | 'Non -login' | 'Unconfirmed';
export type UserRole = 'Staff User' | 'Administrator' | 'Account Owner' | 'Contributor';

export interface AdminUserItem {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  idNumber: string;
  status: UserStatus;
  credits: number;
  creditsUsed: number;
  photoURL?: string | null;
  createdAt?: any;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdminEmail?: string;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentAdminEmail
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Modals inside Admin
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    credits: number;
    idNumber: string;
    photoURL: string;
  }>({
    name: '',
    email: '',
    role: 'Staff User',
    status: 'Active',
    credits: 50,
    idNumber: '',
    photoURL: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Active Tab: Users or Apify Integration
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'apify'>('users');

  // Apify Integration State
  const [apifyToken, setApifyToken] = useState<string>(() => getStoredApifyToken());
  const [showApifyToken, setShowApifyToken] = useState(false);
  const [isApifyTesting, setIsApifyTesting] = useState(false);
  const [apifyTestResult, setApifyTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [apifyStatusMessage, setApifyStatusMessage] = useState('');
  const [apifyUser, setApifyUser] = useState<ApifyUser | null>(() => getStoredApifyUser());
  const [apifyAutoScrape, setApifyAutoScrape] = useState(() => isApifyAutoScrapeEnabled());
  const [apifyPlatforms, setApifyPlatforms] = useState<string[]>(['adobe', 'shutterstock', 'freepik']);
  const [apifyMaxKeywords, setApifyMaxKeywords] = useState<number>(50);
  const [isApifySaving, setIsApifySaving] = useState(false);
  const [isApifySavedRecently, setIsApifySavedRecently] = useState(false);

  // Sandbox Tester State
  const [sandboxQuery, setSandboxQuery] = useState('isometric 3d illustration icon clean white background');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxTags, setSandboxTags] = useState<string[]>([]);
  const [sandboxSource, setSandboxSource] = useState<string>('');
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);
  const [sandboxError, setSandboxError] = useState<string>('');
  const [sandboxCopied, setSandboxCopied] = useState(false);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    setNotification(null);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: AdminUserItem[] = [];

      snap.forEach((d) => {
        const data = d.data();
        let userRole: UserRole = 'Staff User';
        if (data.role === 'admin' || data.email === 'mahimislamkhan889@gmail.com') {
          userRole = 'Administrator';
        } else if (data.role === 'owner') {
          userRole = 'Account Owner';
        } else if (data.role === 'contributor') {
          userRole = 'Contributor';
        } else if (data.role === 'staff') {
          userRole = 'Staff User';
        }

        let userStatus: UserStatus = 'Active';
        if (data.status === 'Non -login' || data.status === 'non-login' || !data.lastActive) {
          userStatus = data.status === 'Unconfirmed' ? 'Unconfirmed' : (data.creditsUsed === 0 && !data.lastActive ? 'Non -login' : 'Active');
        }
        if (data.status === 'Unconfirmed' || data.isUnconfirmed) {
          userStatus = 'Unconfirmed';
        }

        const idNum = data.idNumber || data.uid?.slice(0, 5) || d.id.slice(0, 5);

        list.push({
          id: d.id,
          name: data.displayName || data.name || (data.email ? data.email.split('@')[0] : 'Contributor'),
          role: userRole,
          email: data.email || data.phoneNumber || d.id,
          idNumber: idNum,
          status: (data.status as UserStatus) || userStatus,
          credits: typeof data.credits === 'number' ? data.credits : 50,
          creditsUsed: typeof data.creditsUsed === 'number' ? data.creditsUsed : 0,
          photoURL: resolveUserAvatar({
            photoURL: data.photoURL || data.profilePic || null,
            name: data.displayName || data.name || (data.email ? data.email.split('@')[0] : 'Contributor'),
            email: data.email || data.phoneNumber || d.id,
            id: d.id
          }),
          createdAt: data.createdAt
        });
      });

      list.sort((a, b) => {
        if (a.role === 'Administrator' && b.role !== 'Administrator') return -1;
        if (b.role === 'Administrator' && a.role !== 'Administrator') return 1;
        return b.credits - a.credits;
      });

      setUsers(list);
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Failed to fetch users: ' + (e.message || 'Error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchApifyConfigFromFirestore().then((cfg) => {
        if (cfg) {
          if (cfg.token) setApifyToken(cfg.token);
          if (cfg.user) setApifyUser(cfg.user);
          if (typeof cfg.autoScrape === 'boolean') setApifyAutoScrape(cfg.autoScrape);
          if (cfg.targetPlatforms) setApifyPlatforms(cfg.targetPlatforms);
          if (cfg.maxKeywords) setApifyMaxKeywords(cfg.maxKeywords);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleTestApify = async () => {
    if (!apifyToken.trim()) {
      setApifyTestResult('error');
      setApifyStatusMessage('Please enter an Apify API token first.');
      return;
    }
    setIsApifyTesting(true);
    setApifyTestResult('idle');
    setApifyStatusMessage('');
    try {
      const res = await validateApifyToken(apifyToken.trim());
      if (res.success && res.user) {
        setApifyTestResult('success');
        setApifyUser(res.user);
        setApifyStatusMessage(`Connected as @${res.user.username} (${res.user.plan || 'Active'})`);
      } else {
        setApifyTestResult('error');
        setApifyStatusMessage(res.error || 'Token validation failed. Please check credentials.');
      }
    } catch (err: any) {
      setApifyTestResult('error');
      setApifyStatusMessage(err?.message || 'Error communicating with Apify API.');
    } finally {
      setIsApifyTesting(false);
    }
  };

  const handleSaveApify = async () => {
    setIsApifySaving(true);
    try {
      const ok = await saveApifyConfigToFirestore({
        token: apifyToken.trim(),
        autoScrape: apifyAutoScrape,
        user: apifyUser,
        targetPlatforms: apifyPlatforms,
        maxKeywords: apifyMaxKeywords,
        adminEmail: currentAdminEmail
      });
      if (ok) {
        setIsApifySavedRecently(true);
        setNotification({ type: 'success', message: 'Apify API credentials and scraper settings saved successfully!' });
        setTimeout(() => setIsApifySavedRecently(false), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to save Apify settings to Firestore.' });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e?.message || 'Error saving settings' });
    } finally {
      setIsApifySaving(false);
    }
  };

  const handlePasteApifyToken = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setApifyToken(text.trim());
          setApifyTestResult('idle');
          setApifyStatusMessage('');
        }
      }
    } catch {}
  };

  const handleClearApify = () => {
    setApifyToken('');
    setApifyUser(null);
    setApifyTestResult('idle');
    setApifyStatusMessage('');
  };

  const handleRunSandboxScrape = async () => {
    if (!sandboxQuery.trim()) return;
    setIsSandboxRunning(true);
    setSandboxError('');
    try {
      const res = await testApifyScrapeSandbox(sandboxQuery.trim(), apifyToken.trim(), apifyMaxKeywords);
      if (res.success) {
        setSandboxTags(res.tags);
        setSandboxSource(res.source);
        setSandboxLatency(res.latencyMs);
      } else {
        setSandboxError(res.error || 'Failed to retrieve tags');
      }
    } catch (e: any) {
      setSandboxError(e?.message || 'Scrape request failed');
    } finally {
      setIsSandboxRunning(false);
    }
  };

  if (!isOpen) return null;

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add New Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setNotification({ type: 'error', message: 'Please enter a valid email or phone.' });
      return;
    }

    try {
      const userId = 'user_' + Date.now();
      const newDocRef = doc(db, 'users', userId);
      const randomIdNumber = formData.idNumber || String(Math.floor(10 + Math.random() * 900));

      const finalAvatar = formData.photoURL || resolveUserAvatar({
        name: formData.name,
        email: formData.email,
        id: userId
      });

      const payload = {
        displayName: formData.name || 'New Member',
        name: formData.name || 'New Member',
        email: formData.email,
        role: formData.role === 'Administrator' ? 'admin' : (formData.role === 'Account Owner' ? 'owner' : 'staff'),
        status: formData.status,
        idNumber: randomIdNumber,
        credits: Number(formData.credits) || 50,
        creditsUsed: 0,
        plan: 'free',
        photoURL: finalAvatar,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(newDocRef, payload, { merge: true });

      setNotification({ type: 'success', message: `Member ${formData.name || formData.email} created successfully!` });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'Staff User',
        status: 'Active',
        credits: 50,
        idNumber: '',
        photoURL: ''
      });
      fetchUsers();
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to create member: ' + (err.message || 'Error') });
    }
  };

  // Edit Member Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const finalAvatar = formData.photoURL || editingUser.photoURL || resolveUserAvatar({
        name: formData.name,
        email: formData.email,
        id: editingUser.id
      });

      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        displayName: formData.name,
        name: formData.name,
        email: formData.email,
        role: formData.role === 'Administrator' ? 'admin' : (formData.role === 'Account Owner' ? 'owner' : 'staff'),
        status: formData.status,
        credits: Number(formData.credits),
        idNumber: formData.idNumber || editingUser.idNumber,
        photoURL: finalAvatar,
        updatedAt: serverTimestamp()
      });

      setNotification({ type: 'success', message: `Updated details for ${formData.name || formData.email}` });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to update member: ' + (err.message || 'Error') });
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingUserId(null);
      setNotification({ type: 'success', message: 'Member successfully removed.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to remove member: ' + (err.message || 'Error') });
    }
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.idNumber && u.idNumber.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        className="bg-[#F8F9FB] dark:bg-[#121622] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-6xl w-full p-4 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-left relative"
      >
        {/* Top Close Button & Title Bar */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-white">
                Admin Control Center
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage members, roles, credits, and system API integrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation: Members vs Apify Integration */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveAdminTab('users')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeAdminTab === 'users'
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5"
            )}
          >
            <UserCheck size={14} />
            <span>Members & Credits</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
              activeAdminTab === 'users'
                ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            )}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('apify')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeAdminTab === 'apify'
                ? "bg-[#00A699] text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5"
            )}
          >
            <Bot size={14} />
            <span>Apify API Integration</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1",
              Boolean(apifyToken.trim())
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", Boolean(apifyToken.trim()) ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
              {Boolean(apifyToken.trim()) ? (apifyUser ? `@${apifyUser.username}` : "Configured") : "Not Set"}
            </span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`mb-3 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border shrink-0 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab 1: Users & Credits Management */}
        {activeAdminTab === 'users' && (
          <>
            {/* Toolbar exact replica of screenshot: [Search] [Filter] [Status] ------- [+ Add New Members] */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs min-w-[200px]">
              <Search size={16} className="absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
              />
            </div>

            {/* Filter Button with Dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-2xs ${
                  roleFilter !== 'All' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <Filter size={14} className="text-zinc-500" />
                <span>{roleFilter === 'All' ? 'Filter' : roleFilter}</span>
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-40">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-white/5">
                    Filter by Role
                  </div>
                  {['All', 'Staff User', 'Administrator', 'Account Owner', 'Contributor'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setRoleFilter(role);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer ${
                        roleFilter === role ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{role}</span>
                      {roleFilter === role && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer shadow-2xs ${
                  statusFilter !== 'All' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <span>{statusFilter === 'All' ? 'Status' : statusFilter}</span>
                <ChevronDown size={14} className="text-zinc-500" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl shadow-xl py-1.5 z-40">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-white/5">
                    Filter by Status
                  </div>
                  {['All', 'Active', 'Non -login', 'Unconfirmed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer ${
                        statusFilter === st ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{st}</span>
                      {statusFilter === st && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Refresh users"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Right Action: + Add New Members (Exact Green Button from Screenshot) */}
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                role: 'Staff User',
                status: 'Active',
                credits: 50,
                idNumber: '',
                photoURL: ''
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2E8B57] hover:bg-[#27784A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Add New Members</span>
          </button>
        </div>

        {/* Main Table Card (Exact Replica of User's Image) */}
        <div className="flex-1 overflow-auto rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white dark:bg-[#1A202E] shadow-xs">
          <table className="w-full border-collapse text-left min-w-[760px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-white/10 bg-[#FAFAFC] dark:bg-white/[0.02] text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-bold">NAME</th>
                <th className="py-3.5 px-4 font-bold">ROLE</th>
                <th className="py-3.5 px-4 font-bold">EMAIL</th>
                <th className="py-3.5 px-4 font-bold">ID / CREDITS</th>
                <th className="py-3.5 px-4 font-bold text-center">STATUS</th>
                <th className="py-3.5 pr-6 pl-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-200/70 dark:divide-white/5 text-xs text-zinc-800 dark:text-zinc-200">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-emerald-600" />
                      <span>Loading member control list...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400 text-xs">
                    No members match your criteria. Click "+ Add New Members" to register a user.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isChecked = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors ${
                        isChecked ? 'bg-emerald-50/30 dark:bg-emerald-500/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(user.id)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-200 shrink-0 border border-zinc-200/60 dark:border-white/10 shadow-2xs">
                            <img 
                              src={resolveUserAvatar(user)} 
                              alt={user.name} 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(user.email || user.name);
                              }}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {user.role}
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                        {user.email}
                      </td>

                      {/* ID Number / Credits */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-white font-bold">{user.credits}</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center font-sans font-semibold">
                            <Zap size={10} className="fill-amber-500" /> credits
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            (#{user.idNumber})
                          </span>
                        </div>
                      </td>

                      {/* Status Pills Matching Screenshot Exactly */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {user.status === 'Active' && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF2FF] text-[#2F65CB] dark:bg-blue-500/15 dark:text-blue-300">
                            Active
                          </span>
                        )}
                        {user.status === 'Non -login' && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F3F5] text-[#636E7B] dark:bg-white/10 dark:text-zinc-400">
                            Non -login
                          </span>
                        )}
                        {user.status === 'Unconfirmed' && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF8E7] text-[#D98E04] dark:bg-amber-500/15 dark:text-amber-300">
                            Unconfirmed
                          </span>
                        )}
                      </td>

                      {/* Action Icons (Trash & Pen) */}
                      <td className="py-3 pr-6 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 text-zinc-400">
                          <button
                            type="button"
                            onClick={() => setDeletingUserId(user.id)}
                            className="p-1.5 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                status: user.status,
                                credits: user.credits,
                                idNumber: user.idNumber,
                                photoURL: user.photoURL || ''
                              });
                            }}
                            className="p-1.5 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit Member"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Selection Bar */}
        <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 shrink-0">
          <div>
            Showing <strong className="text-zinc-900 dark:text-white">{filteredUsers.length}</strong> of{' '}
            <strong className="text-zinc-900 dark:text-white">{users.length}</strong> total registered members
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span>{selectedIds.size} selected</span>
              <button
                onClick={async () => {
                  for (const id of Array.from(selectedIds)) {
                    const u = users.find(x => x.id === id);
                    if (u) {
                      await updateDoc(doc(db, 'users', id), {
                        credits: u.credits + 50,
                        updatedAt: serverTimestamp()
                      });
                    }
                  }
                  setNotification({ type: 'success', message: `Granted +50 Credits to ${selectedIds.size} members.` });
                  fetchUsers();
                }}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] cursor-pointer"
              >
                +50 Credits All
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs cursor-pointer transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </>
    )}

    {/* Tab 2: Apify API Integration Panel */}
    {activeAdminTab === 'apify' && (
      <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-6 text-zinc-900 dark:text-zinc-100">
        {/* Top Overview & Status Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#00A699]/15 via-emerald-500/10 to-teal-500/10 border border-[#00A699]/30 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00A699] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Apify API Integration & Stock Scraper
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                  Live Stock Engine
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 max-w-xl">
                Configure your personal or organization Apify API token. It powers automatic microstock competitor keyword scraping across Adobe Stock, Shutterstock, and Freepik, and persists securely in Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/60 dark:bg-black/30 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-white/10">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                Connection Status
              </div>
              <div className="text-xs font-bold flex items-center justify-end gap-1.5 mt-0.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  Boolean(apifyToken.trim()) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-zinc-400"
                )} />
                <span className={Boolean(apifyToken.trim()) ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}>
                  {Boolean(apifyToken.trim()) ? (apifyUser ? `@${apifyUser.username}` : "Token Saved") : "Not Configured"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Left: Credentials & Auth, Right: Scraper & Automation Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: API Token & Cloud Sync */}
          <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-[#00A699]" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Apify API Credentials
                </h4>
              </div>
              <a
                href="https://console.apify.com/account/integrations"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Get API Token <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Apify API Token
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Secret Key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showApifyToken ? "text" : "password"}
                  value={apifyToken}
                  onChange={(e) => {
                    setApifyToken(e.target.value);
                    setApifyTestResult('idle');
                    setApifyStatusMessage('');
                  }}
                  placeholder="apify_api_..."
                  className="w-full pl-3 pr-24 py-2.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#00A699]/30"
                />

                <div className="absolute right-2 flex items-center gap-1 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setShowApifyToken(!showApifyToken)}
                    title={showApifyToken ? "Hide Token" : "Show Token"}
                    className="p-1 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                  >
                    {showApifyToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {!apifyToken && (
                    <button
                      type="button"
                      onClick={handlePasteApifyToken}
                      title="Paste from clipboard"
                      className="p-1 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                    >
                      <Copy size={15} />
                    </button>
                  )}
                  {apifyToken && (
                    <button
                      type="button"
                      onClick={handleClearApify}
                      title="Clear Token"
                      className="p-1 hover:text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Stored persistently in Firestore (system_config/apify) so it synchronizes across all sessions.
              </p>
            </div>

            {/* Validation Message Banner */}
            {apifyStatusMessage && (
              <div className={cn(
                "p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-200 border",
                apifyTestResult === 'success'
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800/40 text-red-800 dark:text-red-300"
              )}>
                {apifyTestResult === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{apifyStatusMessage}</span>
              </div>
            )}

            {/* Connected User Card */}
            {apifyUser && (
              <div className="p-3 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200 dark:border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Connected User:</span>
                  <strong className="text-zinc-900 dark:text-white">@{apifyUser.username}</strong>
                </div>
                {apifyUser.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Account Email:</span>
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{apifyUser.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Plan Tier:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{apifyUser.plan || 'Active'}</span>
                </div>
              </div>
            )}

            {/* Actions: Save & Test */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveApify}
                disabled={isApifySaving}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs",
                  isApifySavedRecently
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 active:scale-98"
                )}
              >
                {isApifySaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isApifySavedRecently ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <span>Saved to Database!</span>
                  </>
                ) : (
                  <>
                    <Database size={14} />
                    <span>Save Apify Configuration</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isApifyTesting || !apifyToken.trim()}
                onClick={handleTestApify}
                className={cn(
                  "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer",
                  !apifyToken.trim()
                    ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-white/5 text-zinc-400"
                    : "bg-white dark:bg-white/5 border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-98"
                )}
              >
                {isApifyTesting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Scraper & Automation Settings */}
          <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-[#00A699]" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Scraping & Stock Extraction Settings
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Actor: apify/web-scraper
              </span>
            </div>

            {/* Auto Scrape Switch */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-black/20 rounded-xl border border-zinc-200/80 dark:border-white/5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  Auto-Enrich Stock Metadata
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  Automatically query competitor stock keywords during batch processing
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={apifyAutoScrape}
                onClick={() => {
                  const next = !apifyAutoScrape;
                  setApifyAutoScrape(next);
                  setApifyAutoScrapeEnabled(next);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                  apifyAutoScrape ? "bg-[#00A699]" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    apifyAutoScrape ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Target Platforms */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Target Competitor Stock Markets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'adobe', label: 'Adobe Stock' },
                  { id: 'shutterstock', label: 'Shutterstock' },
                  { id: 'freepik', label: 'Freepik' },
                  { id: 'getty', label: 'Getty / iStock' }
                ].map((p) => {
                  const isSel = apifyPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          if (apifyPlatforms.length > 1) {
                            setApifyPlatforms(apifyPlatforms.filter(x => x !== p.id));
                          }
                        } else {
                          setApifyPlatforms([...apifyPlatforms, p.id]);
                        }
                      }}
                      className={cn(
                        "py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer",
                        isSel
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/5 text-zinc-500"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyword Target Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Scraped Keywords Target Density
                </label>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">
                  {apifyMaxKeywords} keywords
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="50"
                value={apifyMaxKeywords}
                onChange={(e) => setApifyMaxKeywords(parseInt(e.target.value))}
                className="w-full accent-[#00A699] h-1.5 bg-zinc-200 dark:bg-black/50 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>30 keywords</span>
                <span>40 keywords</span>
                <span>50 keywords (Recommended)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Live Scraper Sandbox */}
        <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Play size={16} className="text-[#00A699]" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Live Scraper Test Sandbox
              </h4>
              <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded font-mono">
                Admin Diagnostic
              </span>
            </div>
            {sandboxTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  Extracted <strong className="text-zinc-900 dark:text-white">{sandboxTags.length}</strong> keywords
                </span>
                {sandboxLatency !== null && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {sandboxLatency}ms
                  </span>
                )}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Source: {sandboxSource}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={sandboxQuery}
                onChange={(e) => setSandboxQuery(e.target.value)}
                placeholder="Enter stock subject (e.g. ramadan kareem golden crescent, 3d business character)"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#00A699]/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunSandboxScrape();
                }}
              />
            </div>

            <button
              type="button"
              disabled={isSandboxRunning || !sandboxQuery.trim()}
              onClick={handleRunSandboxScrape}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap",
                isSandboxRunning
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-[#00A699] hover:bg-[#009085] text-white active:scale-98"
              )}
            >
              {isSandboxRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Test Scrape Now</span>
                </>
              )}
            </button>
          </div>

          {sandboxError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/40 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{sandboxError}</span>
            </div>
          )}

          {sandboxTags.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Extracted Microstock Keywords ({sandboxTags.length}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sandboxTags.join(', '));
                    setSandboxCopied(true);
                    setTimeout(() => setSandboxCopied(false), 2000);
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {sandboxCopied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{sandboxCopied ? 'Copied All!' : 'Copy All Keywords'}</span>
                </button>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-black/30 rounded-xl border border-zinc-200 dark:border-white/5 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {sandboxTags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 shadow-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

        {/* Modal 1: Add New Member Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-600" />
                  Add New Member
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Cooper"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Email or Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. deanna.curtis@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="Staff User">Staff User</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Account Owner">Account Owner</option>
                      <option value="Contributor">Contributor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="Active">Active</option>
                      <option value="Non -login">Non -login</option>
                      <option value="Unconfirmed">Unconfirmed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Initial Credits</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 34, 512-A"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Profile Picture / Avatar Selector */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1.5">Profile Picture</label>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-2xs">
                      <img 
                        src={formData.photoURL || resolveUserAvatar({ name: formData.name, email: formData.email })} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="Photo URL (or click a preset below)"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      className="flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-zinc-400">Presets:</span>
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, photoURL: p.url })}
                        className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer ${
                          formData.photoURL === p.url ? 'ring-2 ring-emerald-500 border-white' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-sm"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Edit Member & Adjust Credits */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Pencil size={15} className="text-blue-600" />
                  Edit Member & Credits
                </h3>
                <button onClick={() => setEditingUser(null)} className="cursor-pointer text-zinc-400 hover:text-zinc-600">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Email / Phone</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-zinc-900 dark:text-white"
                    >
                      <option value="Staff User">Staff User</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Account Owner">Account Owner</option>
                      <option value="Contributor">Contributor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-zinc-900 dark:text-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Non -login">Non -login</option>
                      <option value="Unconfirmed">Unconfirmed</option>
                    </select>
                  </div>
                </div>

                {/* Credits Adjuster */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-600 dark:text-zinc-300 font-medium flex items-center gap-1">
                      <Zap size={13} className="text-amber-500 fill-amber-500" />
                      Credits Allocation
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, credits: prev.credits + 50 }))}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold cursor-pointer"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, credits: prev.credits + 100 }))}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold cursor-pointer"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white font-mono font-bold"
                  />
                </div>

                {/* Profile Picture / Avatar Selector for Edit */}
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-300 font-medium mb-1.5">Profile Picture</label>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0 border border-zinc-200/80 dark:border-white/10 shadow-2xs">
                      <img 
                        src={formData.photoURL || resolveUserAvatar({ name: formData.name, email: formData.email, id: editingUser.id })} 
                        alt="Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="Photo URL (or choose preset below)"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      className="flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-zinc-400">Presets:</span>
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, photoURL: p.url })}
                        className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer ${
                          formData.photoURL === p.url ? 'ring-2 ring-emerald-500 border-white' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Delete Confirmation */}
        {deletingUserId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1A202E] border border-zinc-200 dark:border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 mx-auto flex items-center justify-center">
                <Trash2 size={22} />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Delete Member?
              </h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to remove this member? This action will erase their account data and credit history.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeletingUserId(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 font-bold text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMember(deletingUserId)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
