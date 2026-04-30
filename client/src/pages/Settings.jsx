import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Camera, Loader2, X, AlertTriangle, Shield, Trophy, Star, RefreshCw, Zap, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';

const Section = ({ title, icon: Icon, children }) => (
    <div className="card-premium p-8 sm:p-10 mb-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 group-hover:bg-gold/50 transition-colors"></div>
        <div className="flex items-center gap-5 mb-10">
            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                <Icon className="w-5 h-5 text-gold" />
            </div>
            <div>
                <h2 className="text-xl font-serif font-black text-white tracking-tight">{title}</h2>
                <p className="text-[9px] text-gold/40 font-black uppercase tracking-[0.2em] mt-0.5">Active</p>
            </div>
        </div>
        {children}
    </div>
);

const Settings = () => {
    const { user, loading: isLoading, logout, updateProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isSavingName, setIsSavingName] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fileInputRef = React.useRef(null);

    if (isLoading) return (
        <div className="flex items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
        </div>
    );

    const handleSaveName = async () => {
        if (!firstName.trim()) { toast.error('First name cannot be empty'); return; }
        setIsSavingName(true);
        const loadingToast = toast.loading('Updating profile...');
        try {
            await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
            toast.dismiss(loadingToast);
            toast.success('Profile updated successfully ✅');
        } catch (e) {
            toast.dismiss(loadingToast);
            toast.error(e.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally { setIsSavingName(false); }
    };

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Validation failed: Please type DELETE to confirm');
            return;
        }

        setIsDeleting(true);
        const loadingToast = toast.loading('Terminating Account Protocol...');
        try {
            await apiClient.delete('/auth/delete');
            toast.success('Account Successfully Terminated', { id: loadingToast });
            logout();
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Protocol termination failed', { id: loadingToast });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                const loadingToast = toast.loading('Uploading photo...');
                try {
                    await updateProfile({ avatar: base64String });
                    toast.dismiss(loadingToast);
                    toast.success('Profile picture updated ✅');
                } catch (err) {
                    toast.dismiss(loadingToast);
                    toast.error('Failed to update photo');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error('Passwords do not match ❌');
            return;
        }
        setIsChangingPassword(true);
        const loadingToast = toast.loading('Changing password...');
        try {
            await apiClient.post('/auth/change-password', { currentPassword, newPassword });
            toast.dismiss(loadingToast);
            toast.success('Password updated successfully ✅');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };



    return (
        <div className="container mx-auto px-6 py-16 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-14 text-center sm:text-left"
            >
                <h1 className="text-4xl font-serif font-black text-white mb-3">Settings</h1>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <span className="h-[1px] w-12 bg-gold/40"></span>
                    <p className="text-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">
                        Your Account Settings
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="card-premium p-10 bg-gold/5 border-gold/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
                            <Wallet className="w-8 h-8 text-gold" />
                        </div>
                        <button 
                            onClick={async () => {
                                const amount = prompt('Enter top-up amount:');
                                if (!amount || isNaN(amount) || amount <= 0) return;
                                try {
                                    const response = await apiClient.post('/subscriptions/wallet/topup', { amount });
                                    if (response.data) {
                                        toast.success('Wallet topped up! 💰');
                                        refreshProfile();
                                    }
                                } catch (error) { toast.error('Top-up failed'); }
                            }}
                            className="bg-gold text-charcoal px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/10"
                        >
                            TOP UP
                        </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 mb-1 relative z-10">Wallet Balance</p>
                    <h3 className="text-4xl font-serif font-black text-white mb-2 tracking-tighter relative z-10">
                        Rs. {user?.walletBalance || 0}
                    </h3>
                    <p className="text-gray-500 text-[10px] font-medium relative z-10">Ready for automated gourmet orders</p>
                </div>

                <div className="card-premium p-10 bg-white/[0.02] border-white/10 group hover:border-gold/40 transition-all cursor-pointer overflow-hidden relative" onClick={() => navigate('/subscriptions')}>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 w-fit mb-8 group-hover:bg-gold/10 group-hover:border-gold/20 transition-all">
                        <Zap className="w-8 h-8 text-white group-hover:text-gold transition-colors" />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-white mb-2">Meal Plans</h3>
                    <div className="flex items-center gap-3 text-gold font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                        Manage Subscriptions
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* ── PROFILE ── */}
                <Section title="Your Profile" icon={User}>
                    <div className="flex flex-col sm:flex-row items-center gap-10 mb-12 p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem]">
                        <div className="relative shrink-0 group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-full border-4 border-gold/30 overflow-hidden bg-charcoal flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.15)] relative">
                                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-gold/20" />}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <p className="text-white font-serif font-black text-4xl mb-1">{user?.firstName} {user?.lastName}</p>
                            <p className="text-gold/40 text-[11px] font-black uppercase tracking-[0.2em] mb-6">{user?.email}</p>
                            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                                <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">Verified</span>
                                <span className="px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-[9px] font-black uppercase tracking-widest text-gold capitalize">{user?.role || 'Customer'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">First Name</label>
                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold shadow-inner" placeholder="First Name" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Last Name</label>
                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold shadow-inner" placeholder="Last Name" />
                        </div>
                    </div>

                    <div className="space-y-3 mb-12">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Email Address</label>
                        <div className="w-full bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-gray-500 font-bold flex items-center justify-between">
                            {user?.email || 'Not available'}
                            <span className="text-[8px] bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase not-italic">Saved</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="w-full bg-gold text-charcoal font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] text-xs transition-all hover:bg-yellow-400 hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-2xl shadow-gold/10"
                    >
                        {isSavingName ? 'Saving...' : 'Save Changes'}
                    </button>
                </Section>

                {/* ── ACCOUNT SECURITY ── */}
                <Section title="Login & Security" icon={Shield}>
                    <p className="text-gray-500 text-sm mb-10 leading-relaxed font-medium">
                        Change your password or manage your account.
                    </p>

                    <form onSubmit={handleChangePassword} className="space-y-6 mb-12 p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem]">
                        <h3 className="text-white font-serif font-black text-xl mb-4">Change Password</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Current Password</label>
                                <input 
                                    type="password"
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold" 
                                    placeholder="Current Password" 
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">New Password</label>
                                    <input 
                                        type="password"
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold" 
                                        placeholder="New Password" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Confirm New Password</label>
                                    <input 
                                        type="password"
                                        value={confirmNewPassword} 
                                        onChange={(e) => setConfirmNewPassword(e.target.value)} 
                                        className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold" 
                                        placeholder="Confirm Password" 
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPassword || !currentPassword || !newPassword}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.3em] text-[10px] transition-all"
                        >
                            {isChangingPassword ? 'Saving...' : 'Update Password'}
                        </button>
                    </form>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setShowSignOutModal(true)}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-5 rounded-[2rem] uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <X className="w-4 h-4" /> Sign Out
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 font-black py-5 rounded-[2rem] uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <AlertTriangle className="w-4 h-4" /> Delete Account
                        </button>
                    </div>
                </Section>
            </div>

            {/* Sign Out Modal */}
            <AnimatePresence>
                {showSignOutModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/10 p-12 rounded-[4rem] max-w-md w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center relative"
                        >
                            <button onClick={() => setShowSignOutModal(false)} className="absolute top-8 right-8 p-3 text-gray-600 hover:text-white transition-colors rounded-2xl hover:bg-white/5">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/20">
                                <Shield className="w-10 h-10 text-gold" />
                            </div>
                            <h2 className="text-4xl font-serif font-black text-white mb-4">Sign Out?</h2>
                             <p className="text-gray-500 mb-10 text-sm leading-relaxed font-medium">
                                Are you sure you want to sign out?
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowSignOutModal(false)} className="flex-1 py-5 rounded-[2rem] border border-white/10 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                                <button onClick={handleSignOut} className="flex-1 py-5 rounded-[2rem] bg-gold hover:bg-yellow-400 text-charcoal font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-gold/10 active:scale-95">Sign Out</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/10 p-12 rounded-[4rem] max-w-md w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center relative"
                        >
                            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} className="absolute top-8 right-8 p-3 text-gray-600 hover:text-white transition-colors rounded-2xl hover:bg-white/5">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-4xl font-serif font-black text-white mb-4">Delete Account?</h2>
                            <p className="text-gray-500 mb-8 text-sm leading-relaxed font-medium">
                                Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
                            </p>

                            <div className="mb-8 space-y-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Type DELETE to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-red-500 rounded-2xl p-5 outline-none text-white transition-all font-bold text-center tracking-widest shadow-inner"
                                    placeholder="DELETE"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} className="flex-1 py-5 rounded-[2rem] border border-white/10 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                    className="flex-1 py-5 rounded-[2rem] bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-red-500/20 disabled:opacity-30"
                                >
                                    {isDeleting ? 'Terminating...' : 'Confirm'}
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
