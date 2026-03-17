import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  User, Lock, Trash2, Mail, LogIn, Calendar, Shield,
  ChevronRight, AlertTriangle, CheckCircle, X, Camera, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]   = useState(user?.lastName  || '');
  const [isSavingName, setIsSavingName]   = useState(false);
  const [isUploading, setIsUploading]     = useState(false);
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isLoaded) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
    </div>
  );

  // ── Handlers ──────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!firstName.trim()) { toast.error('First name cannot be empty'); return; }
    setIsSavingName(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success('Name updated!', { icon: '✅' });
    } catch (e) {
      toast.error(e?.errors?.[0]?.message || 'Could not update name');
    } finally { setIsSavingName(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setIsUploading(true);
    try {
      await user.setProfileImage({ file });
      toast.success('Profile photo updated!', { icon: '📸' });
    } catch (e) {
      toast.error('Could not upload photo');
    } finally { setIsUploading(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await user.delete();
      toast.success('Account deleted.');
    } catch (e) {
      toast.error(e?.errors?.[0]?.message || 'Could not delete account');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch { /* silent */ }
  };

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const lastSignIn = user?.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  // ── Section Card wrapper ──────────────────────────────────────
  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-gold" />
        </div>
        <h2 className="text-xl font-serif font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Divider = () => <div className="border-t border-white/5 my-6" />;

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-5xl font-serif font-bold text-white mb-2">Settings</h1>
        <p className="text-gold/60 text-xs font-black uppercase tracking-widest">
          Manage your account, privacy, and preferences
        </p>
      </div>

      <div className="space-y-6">

        {/* ── 1. PROFILE ── */}
        <Section title="Profile" icon={User}>
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-gold/40 overflow-hidden bg-charcoal flex items-center justify-center">
                {user?.imageUrl
                  ? <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-9 h-9 text-gold/40" />
                }
              </div>
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-1 -right-1 w-7 h-7 bg-gold rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg ${isUploading ? 'opacity-60 cursor-wait' : ''}`}
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 text-charcoal animate-spin" /> : <Camera className="w-3.5 h-3.5 text-charcoal" />}
              </label>
              <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user?.fullName || user?.firstName || 'Member'}</p>
              <p className="text-gray-500 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-black">Click the camera to change photo</p>
            </div>
          </div>

          <Divider />

          {/* Name edit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-1">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/5 border border-gold/20 focus:border-gold rounded-2xl p-4 outline-none text-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-1">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/5 border border-gold/20 focus:border-gold rounded-2xl p-4 outline-none text-white transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleSaveName}
            disabled={isSavingName}
            className="bg-gold text-charcoal font-black px-8 py-3 rounded-2xl text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {isSavingName ? 'Saving…' : 'Save Name'}
          </button>
        </Section>

        {/* ── 2. PRIVACY ── */}
        <Section title="Privacy & Security" icon={Lock}>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Manage your account settings below
          </p>

          {/* Single Manage Account button → opens Clerk's full panel */}
          <button
            onClick={() => openUserProfile()}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/30 px-6 py-5 rounded-2xl transition-all group mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <Shield className="w-5 h-5 text-gold" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-bold">Manage Account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gold transition-colors" />
          </button>

          <Divider />

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 px-6 py-4 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-400/70" />
              <div className="text-left">
                <p className="text-red-400 text-sm font-bold">Delete Account</p>
                <p className="text-red-400/50 text-xs">This action is permanent and cannot be undone</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400/30 group-hover:text-red-400 transition-colors" />
          </button>
        </Section>

        {/* ── 3. ACCOUNT INFO ── */}
        <Section title="Account Info" icon={Calendar}>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold/40">Account Created</span>
              <span className="text-white text-sm font-medium">{createdAt}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold/40">Last Sign In</span>
              <span className="text-white text-sm font-medium">{lastSignIn}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold/40">User ID</span>
              <span className="text-gray-500 text-xs font-mono">{user?.id?.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-gold/40">Email Verified</span>
              <span className={`text-xs font-black uppercase tracking-widest ${user?.primaryEmailAddress?.verification?.status === 'verified' ? 'text-green-400' : 'text-amber-400'}`}>
                {user?.primaryEmailAddress?.verification?.status === 'verified' ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </Section>

        {/* ── Sign Out ── */}
        <button
          onClick={() => setShowSignOutModal(true)}
          className="w-full bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 text-red-400 font-black py-4 rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-95"
        >
          Sign Out of Account
        </button>

      </div>

      {/* ── Delete Account Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-charcoal/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="bg-charcoal border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-[0_40px_80px_rgba(0,0,0,0.9)] text-center relative"
            >
              <button onClick={() => setShowDeleteModal(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-serif font-black text-white mb-3">Delete Account?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                This will permanently delete your account, orders, and all saved data. <strong className="text-white">This cannot be undone.</strong>
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 hover:text-white font-bold text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm transition-all disabled:opacity-60 active:scale-95">
                  {isDeleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sign Out Confirmation Modal ── */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-charcoal/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="bg-charcoal border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-[0_40px_80px_rgba(0,0,0,0.9)] text-center relative"
            >
              <button onClick={() => setShowSignOutModal(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-serif font-black text-white mb-3">Sign Out?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowSignOutModal(false)} className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 hover:text-white font-bold text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleSignOut} className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm transition-all active:scale-95">
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
