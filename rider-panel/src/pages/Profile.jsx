import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Shield, LogOut, Award, Camera, Lock, CheckCircle, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { t } = useTranslation();
    const { user, logout, updateProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

    const handleEditPhone = () => {
        let currentPhone = user?.phone || '';
        if (currentPhone.startsWith('+92 ')) currentPhone = currentPhone.substring(4);
        else if (currentPhone.startsWith('+92')) currentPhone = currentPhone.substring(3);
        setPhoneInput(currentPhone.trim());
        setIsEditingPhone(true);
    };

    const handleSavePhone = async () => {
        if (!phoneInput) return;
        
        const numericPhone = phoneInput.replace(/\D/g, '');
        if (numericPhone.length !== 10) {
            toast.error('Please enter exactly 10 digits (e.g. 300 1234567)');
            return;
        }

        setIsUpdatingPhone(true);
        const loadingToast = toast.loading('Updating phone number...');
        try {
            const formattedPhone = `+92 ${phoneInput.trim()}`;
            await updateProfile({ phone: formattedPhone });
            toast.dismiss(loadingToast);
            toast.success('Phone number updated ✅');
            setIsEditingPhone(false);
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Failed to update phone number');
        } finally {
            setIsUpdatingPhone(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;
                setIsUpdatingAvatar(true);
                const loadingToast = toast.loading('Uploading photo...');
                try {
                    await updateProfile({ avatar: base64String });
                    toast.dismiss(loadingToast);
                    toast.success('Profile picture updated ✅');
                } catch (err) {
                    toast.dismiss(loadingToast);
                    toast.error('Failed to update photo');
                } finally {
                    setIsUpdatingAvatar(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) return;
        
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match! ❌');
            return;
        }

        setIsChangingPassword(true);
        const loadingToast = toast.loading('Changing password...');
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            toast.dismiss(loadingToast);
            toast.success('Password updated successfully ✅');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {/* Header Section */}
            <header className="flex flex-col items-center justify-center text-center py-8 card-premium relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent)]">
                <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-28 h-28 rounded-2xl p-0.5 bg-gradient-to-tr from-gold to-crimson shadow-[0_0_30px_rgba(212,175,55,0.1)] flex items-center justify-center relative overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-[0.9rem] border-2 border-charcoal" />
                        ) : (
                            <div className="flex flex-col items-center text-gold/20">
                                <User size={40} strokeWidth={1} />
                                <span className="text-[7px] font-black uppercase tracking-widest mt-1">Upload Photo</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[0.9rem]">
                            <Camera className="text-white w-6 h-6" />
                        </div>
                    </div>
                    {isUpdatingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-charcoal/60 rounded-2xl backdrop-blur-sm">
                            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                <h1 className="text-3xl font-serif font-black tracking-tighter mb-1 uppercase">
                    {user?.firstName} <span className="text-gold">{user?.lastName}</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">AK-7 Delivery Team</p>
                
                <div className="flex items-center gap-2 mt-6 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-soft-white/40">Verified Logistics</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Account Details */}
                <section className="card-premium p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center border border-gold/20">
                            <Shield className="w-4 h-4 text-gold" />
                        </div>
                        <h3 className="text-lg font-serif font-black text-white uppercase tracking-tight">Security</h3>
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">Current Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter Current Password"
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-xl py-3 pl-10 pr-4 outline-none text-white text-sm transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">New Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter New Password"
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-xl py-3 pl-10 pr-4 outline-none text-white text-sm transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm New Password"
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold rounded-xl py-3 pl-10 pr-4 outline-none text-white text-sm transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gold hover:text-charcoal transition-all disabled:opacity-30"
                        >
                            {isChangingPassword ? 'Processing...' : 'Update Password'}
                        </button>
                    </form>
                </section>

                {/* Account Info & Logout */}
                <section className="space-y-4">
                    <div className="card-premium p-8 space-y-5">
                        <div className="flex items-center gap-4 pb-5 border-b border-white/5">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                <Mail className="w-5 h-5 text-gold/40" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-0.5">Email Registered</p>
                                <p className="text-xs font-bold text-white">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pb-5 border-b border-white/5">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                <Phone className="w-5 h-5 text-gold/40" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-0.5">Contact Number</p>
                                {isEditingPhone ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 flex items-center bg-white/[0.05] border border-white/10 rounded focus-within:border-gold overflow-hidden transition-all">
                                            <span className="px-2.5 py-1.5 text-xs font-bold text-white/50 bg-white/5 border-r border-white/10">+92</span>
                                            <input 
                                                type="tel" 
                                                value={phoneInput} 
                                                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                                className="flex-1 bg-transparent px-2.5 py-1.5 text-xs font-bold text-white outline-none placeholder:text-white/20"
                                                placeholder="3XX XXXXXXX"
                                            />
                                        </div>
                                        <button onClick={handleSavePhone} disabled={isUpdatingPhone} className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded transition-colors shrink-0">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setIsEditingPhone(false)} disabled={isUpdatingPhone} className="p-1.5 bg-crimson/20 text-crimson hover:bg-crimson hover:text-white rounded transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-white">{user?.phone || '+92 3XX XXXXXXX'}</p>
                                        <button onClick={handleEditPhone} className="p-1.5 text-white/40 hover:text-gold transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={logout}
                            className="w-full py-5 mt-2 bg-crimson/5 border border-crimson/10 rounded-2xl text-crimson text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-crimson hover:text-white transition-all group"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Terminate Session
                        </button>
                    </div>

                    <div className="p-6 glass rounded-[2rem] border border-white/5 text-center">
                        <p className="text-[8px] font-bold text-soft-white/20 uppercase tracking-[0.2em] leading-relaxed">
                            Authorized personnel only. Access logged for security.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Profile;
