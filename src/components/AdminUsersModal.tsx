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
  UserCheck
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
  }>({
    name: '',
    email: '',
    role: 'Staff User',
    status: 'Active',
    credits: 50,
    idNumber: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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
        // Determine clean role display
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

        // Determine clean status
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
          photoURL: data.photoURL || data.profilePic || null,
          createdAt: data.createdAt
        });
      });

      // Sort with Administrators on top, then by credits
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
    }
  }, [isOpen]);

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
        idNumber: ''
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
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        displayName: formData.name,
        name: formData.name,
        email: formData.email,
        role: formData.role === 'Administrator' ? 'admin' : (formData.role === 'Account Owner' ? 'owner' : 'staff'),
        status: formData.status,
        credits: Number(formData.credits),
        idNumber: formData.idNumber || editingUser.idNumber,
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
        <div className="flex items-center justify-between pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-white">
                User Control Panel
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage members, roles, permissions, and credit allocations
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
                idNumber: ''
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
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name.slice(0, 2).toUpperCase()
                            )}
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
                                idNumber: user.idNumber
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
