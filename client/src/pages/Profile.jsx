import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, MapPin, CreditCard, History, Bell, Shield, LogOut, 
  Camera, CheckCircle, ChevronRight, Loader2, Save, Trash2, Plus, 
  Lock, Smartphone, Mail, X, AlertTriangle, Calendar, Clock, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import OrderHistory from './OrderHistory';
import { getMyReservations } from '../services/reservationService';

const Profile = () => {
    const { user, loading: isLoading, logout, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('personal');
    const [isSaving, setIsSaving] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState(false);
    
    // Form States
    const [personalInfo, setPersonalInfo] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const tabs = [
        { id: 'personal', label: 'Personal Information', icon: User },
        { id: 'address', label: 'Address', icon: MapPin },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Password & Security', icon: Shield },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag },
        { id: 'bookings', label: 'Booking History', icon: Calendar },
    ];

    useEffect(() => {
        if (activeTab === 'bookings') {
            fetchReservations();
        }
    }, [activeTab]);

    const fetchReservations = async () => {
        try {
            setLoadingReservations(true);
            const data = await getMyReservations();
            setReservations(data || []);
        } catch (error) {
            console.error('Failed to load reservations');
        } finally {
            setLoadingReservations(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!personalInfo.firstName || !personalInfo.lastName) {
            toast.error('Name fields are required');
            return;
        }
        setIsSaving(true);
        const loadingToast = toast.loading('Updating profile...');
        try {
            await updateProfile(personalInfo);
            toast.success('Information updated', { id: loadingToast });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            const loadingToast = toast.loading('Uploading photo...');
            try {
                await updateProfile({ avatar: base64 });
                toast.success('Photo updated', { id: loadingToast });
            } catch (error) {
                toast.error('Upload failed', { id: loadingToast });
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error('Please fill all fields');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setIsSaving(true);
        const loadingToast = toast.loading('Updating security credentials...');
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed', { id: loadingToast });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-gold animate-spin" />
            </div>
        );
    }

    const reservationStatusColor = (status) => {
        switch (status) {
            case 'Confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-gold bg-gold/10 border-gold/20';
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Sidebar */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 sticky top-24 backdrop-blur-xl shadow-2xl">
                        {/* User Header */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="relative group mb-6">
                                <div className="w-24 h-24 rounded-full border-2 border-gold/30 p-1 bg-charcoal overflow-hidden shadow-xl">
                                    <img 
                                        src={user?.avatar || 'https://via.placeholder.com/150'} 
                                        alt="profile" 
                                        className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-gold rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border border-charcoal">
                                    <Camera className="w-4 h-4 text-charcoal" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <h2 className="text-2xl font-serif font-black text-white mb-1">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-[10px] font-black text-gold/40 uppercase tracking-[0.2em]">{user?.email}</p>
                        </div>

                        {/* Navigation Links */}
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${isActive ? 'bg-gold text-charcoal shadow-lg shadow-gold/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-charcoal' : 'text-gold/60'}`} />
                                            <span className="text-xs font-black uppercase tracking-[0.1em]">{tab.label}</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                                    </button>
                                );
                            })}
                            
                            <div className="pt-6 mt-6 border-t border-white/5">
                                <button 
                                    onClick={() => setShowLogoutModal(true)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-crimson hover:bg-crimson/10 transition-all group"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-8 md:p-14 min-h-[650px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] backdrop-blur-3xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/[0.02] blur-[120px] -z-10"></div>

                            {activeTab === 'personal' && (
                                <div className="space-y-10">
                                    <div className="flex items-center gap-5 mb-4">
                                        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                            <User className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-white">Personal Information</h3>
                                            <p className="text-gray-500 text-sm mt-1">Manage your basic account identity</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">First Name</label>
                                            <input 
                                                type="text"
                                                value={personalInfo.firstName}
                                                onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                                                className="w-full bg-black/20 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Last Name</label>
                                            <input 
                                                type="text"
                                                value={personalInfo.lastName}
                                                onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                                                className="w-full bg-black/20 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Email Address</label>
                                            <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-gray-500 font-bold flex items-center justify-between cursor-not-allowed">
                                                <span className="text-sm">{user?.email}</span>
                                                <Lock className="w-4 h-4 text-white/10" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Phone Number</label>
                                            <input 
                                                type="tel"
                                                value={personalInfo.phone}
                                                onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                                                className="w-full bg-black/20 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                                placeholder="03xx-xxxxxxx"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-10">
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="bg-gold hover:bg-yellow-400 text-charcoal px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-gold/20 flex items-center gap-3 disabled:opacity-50 active:scale-95"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            UPDATE
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'address' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                                <MapPin className="w-6 h-6 text-gold" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-serif font-black text-white">Addresses</h3>
                                                <p className="text-gray-500 text-sm mt-1">Saved delivery locations</p>
                                            </div>
                                        </div>
                                        <button className="bg-white/5 hover:bg-white/10 text-gold px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
                                            Add New
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(user?.addresses || []).length > 0 ? user.addresses.map((addr, idx) => (
                                            <div key={idx} className="bg-black/20 border border-white/10 p-8 rounded-[2.5rem] relative group hover:border-gold/30 transition-all shadow-lg">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                                        <MapPin className="w-6 h-6 text-gold/60" />
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                                    </div>
                                                </div>
                                                <h4 className="text-white font-black mb-1 uppercase tracking-widest text-[10px] text-gold">{addr.label || 'Home Location'}</h4>
                                                <p className="text-gray-400 text-sm leading-relaxed font-medium">{addr.address}, {addr.area}<br/>{addr.city}</p>
                                            </div>
                                        )) : (
                                            <div className="col-span-2 py-32 text-center bg-black/10 rounded-[3.5rem] border border-dashed border-white/5">
                                                <MapPin className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                                <p className="text-gray-600 font-black uppercase tracking-widest text-xs">No saved locations found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                            <Bell className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-white">Notifications</h3>
                                            <p className="text-gray-500 text-sm mt-1">Control how we alert you</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { title: 'Order Status', desc: 'Real-time updates on your active gourmet orders.', enabled: true },
                                            { title: 'Meal Plan Reminders', desc: 'Alerts for your upcoming scheduled deliveries.', enabled: true },
                                            { title: 'Gourmet Offers', desc: 'Special seasonal deals and personalized rewards.', enabled: false },
                                            { title: 'Security Alerts', desc: 'Immediate notification for account access changes.', enabled: true },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-8 bg-black/20 border border-white/5 rounded-3xl hover:border-white/10 transition-all group">
                                                <div className="flex-1 pr-6">
                                                    <h4 className="text-white font-black uppercase tracking-tight text-sm mb-1">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                                                </div>
                                                <button className={`w-14 h-7 rounded-full p-1 transition-all relative shrink-0 ${item.enabled ? 'bg-gold' : 'bg-white/10'}`}>
                                                    <div className={`w-5 h-5 rounded-full bg-charcoal transition-all shadow-md ${item.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                            <Shield className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-white">Security</h3>
                                            <p className="text-gray-500 text-sm mt-1">Protect your gourmet account</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-8 bg-black/20 p-10 rounded-[3rem] border border-white/5 shadow-inner">
                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Current Password</label>
                                                <input 
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                                    className="w-full bg-black/40 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">New Password</label>
                                                    <input 
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                                        className="w-full bg-black/40 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-2">Confirm New Password</label>
                                                    <input 
                                                        type="password"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                                        className="w-full bg-black/40 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-white/5 hover:bg-gold text-white hover:text-charcoal px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 hover:border-gold active:scale-95 flex items-center gap-3 shadow-xl"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            Update Credentials
                                        </button>
                                    </form>

                                    <div className="bg-crimson/5 border border-crimson/10 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="text-center md:text-left">
                                            <h4 className="text-white font-black uppercase tracking-tight text-base mb-1">Delete Account</h4>
                                            <p className="text-xs text-gray-500 font-medium">Permanently terminate your gourmet identity and data.</p>
                                        </div>
                                        <button className="bg-crimson/10 hover:bg-crimson text-crimson hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-crimson/20 transition-all active:scale-95">
                                            Terminate Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                            <ShoppingBag className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-white">Order History</h3>
                                            <p className="text-gray-500 text-sm mt-1">Review your past gourmet experiences</p>
                                        </div>
                                    </div>
                                    <div className="-mx-8 md:-mx-14">
                                        <OrderHistory hideHeader={true} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bookings' && (
                                <div className="space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                                                <Calendar className="w-6 h-6 text-gold" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-serif font-black text-white">Booking History</h3>
                                                <p className="text-gray-500 text-sm mt-1">Your table reservations and status</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/reservation')}
                                            className="bg-gold hover:bg-yellow-400 text-charcoal px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-gold/20 active:scale-95"
                                        >
                                            Book New Table
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {loadingReservations ? (
                                            <div className="space-y-4">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="h-24 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                                                ))}
                                            </div>
                                        ) : reservations.length > 0 ? reservations.map((res) => (
                                            <div key={res._id} className="bg-black/20 border border-white/10 p-6 rounded-[2.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-gold/20 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:bg-gold/5 group-hover:border-gold/10 transition-all">
                                                        <span className="text-gold font-black text-xl leading-none">{new Date(res.reservationDate).getDate()}</span>
                                                        <span className="text-gold/40 text-[8px] uppercase font-black tracking-widest mt-1">{new Date(res.reservationDate).toLocaleString('default', { month: 'short' })}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black uppercase tracking-tight text-sm mb-1.5 flex items-center gap-3">
                                                            {res.occasion || 'Table Reservation'}
                                                            <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${reservationStatusColor(res.status)}`}>
                                                                {res.status}
                                                            </span>
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-gold/40" /> {res.reservationTime}</span>
                                                            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-gold/40" /> {res.numberOfGuests} Guests</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-white/5">
                                                    {res.paymentStatus === 'Paid' ? (
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">Paid</div>
                                                    ) : (
                                                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">Pending</div>
                                                    )}
                                                    <button onClick={() => navigate('/reservation')} className="p-3 text-gold/40 hover:text-gold transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-32 text-center bg-black/10 rounded-[3.5rem] border border-dashed border-white/5">
                                                <Calendar className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                                <p className="text-gray-600 font-black uppercase tracking-widest text-xs">No reservation history found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/10 p-12 rounded-[4rem] max-w-md w-full shadow-[0_60px_120px_rgba(0,0,0,0.8)] text-center relative"
                        >
                            <button onClick={() => setShowLogoutModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-500/20">
                                <LogOut className="w-12 h-12 text-red-500" />
                            </div>
                            <h2 className="text-4xl font-serif font-black text-white mb-4">Gourmet Logout?</h2>
                            <p className="text-gray-500 mb-10 text-sm leading-relaxed px-4">
                                Securely terminate your current session? You will need to authenticate again for future gourmet orders.
                            </p>
                            <div className="flex gap-4 px-2">
                                <button 
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-5 rounded-[2rem] border border-white/10 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-white transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="flex-1 py-5 rounded-[2rem] bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
