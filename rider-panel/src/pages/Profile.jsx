import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Mail, Shield, LogOut, Award, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRider } from '../context/RiderContext';

const Profile = () => {
    const { user, logout } = useAuth();
    const { stats } = useRider();

    const menuItems = [
        { icon: User, label: 'Full Name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A' },
        { icon: Mail, label: 'Email Terminal', value: user?.email || 'N/A' },
        { icon: Phone, label: 'Communications', value: '+92 300 1234567' },
        { icon: Shield, label: 'Access Level', value: 'Authorized Rider', color: 'text-gold' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col items-center justify-center text-center py-10 card-premium relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent)]">
                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-xl p-1 bg-gradient-to-tr from-gold to-crimson shadow-[0_0_40px_rgba(212,175,55,0.2)] flex items-center justify-center">
                        {user?.avatar
                            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-md border-4 border-charcoal" />
                            : <User className="w-16 h-16 text-gold/40" />
                        }
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gold rounded-md flex items-center justify-center border-4 border-charcoal shadow-xl">
                        <Award className="w-5 h-5 text-charcoal" />
                    </div>
                </div>

                <h1 className="text-4xl font-serif font-black tracking-tighter italic mb-1 uppercase">{user?.firstName} <span className="text-gold">{user?.lastName}</span></h1>
                <p className="label-caps italic tracking-[0.3em]">Logistic Division Station #AK-07</p>

                <div className="flex items-center gap-4 mt-8 px-8 py-3 glass rounded-full border border-white/5">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <span className="text-xs font-black text-white italic">4.9</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <span className="label-caps lowercase">Master Rider</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                {/* Stats Section */}
                <div className="md:col-span-8 space-y-8">
                    <section className="card-premium p-10">
                        <h3 className="label-caps mb-10 border-l-2 border-gold pl-4 italic opacity-60">System Credentials</h3>
                        <div className="grid grid-cols-1 gap-8">
                            {menuItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 group">
                                    <div className="w-12 h-12 rounded-md bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-gold/20 transition-all">
                                        <item.icon className={`w-5 h-5 ${item.color || 'text-soft-white/30'}`} />
                                    </div>
                                    <div className="flex-1 border-b border-white/5 pb-4">
                                        <p className="label-caps mb-1 italic opacity-40">{item.label}</p>
                                        <p className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Actions Section */}
                <div className="md:col-span-4 space-y-6">
                    <div className="card-premium p-8 flex flex-col items-center">
                        <div className="w-full space-y-4">
                            <button className="w-full py-4 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-charcoal transition-all">
                                Performance Data
                            </button>
                            <button className="w-full py-4 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-charcoal transition-all">
                                Shift Settings
                            </button>
                            <div className="h-px bg-white/5 my-4" />
                            <button
                                onClick={logout}
                                className="w-full py-4 rounded-md bg-crimson/10 border border-crimson/20 text-[10px] font-black text-crimson uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-crimson hover:text-white transition-all shadow-lg shadow-crimson/5 group"
                            >
                                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> TERMINATE SESSION
                            </button>
                        </div>
                    </div>

                    <div className="glass-gold p-8 rounded-[2rem] border border-gold/10 text-center">
                        <h4 className="label-caps mb-4 italic text-gold">Operational Status</h4>
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[8px] font-black uppercase tracking-widest leading-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Deployment Ready
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
