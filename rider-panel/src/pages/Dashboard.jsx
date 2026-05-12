import React, { useState } from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    CheckCircle,
    AlertCircle,
    Zap,
    PlusCircle,
    Target,
    Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRider } from '../hooks/useRider';
import OrderCard from '../components/OrderCard';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { BrandLogo } from '../components/BrandingUtils';

const Dashboard = () => {
    const { t } = useTranslation();
    const {
        availableOrders,
        myOrders,
        stats,
        loading,
        refreshData,
        claim,
        accept,
        pickup,
        arrive,
        collect,
        deliver,
        batchToRoute,
        routeInfo
    } = useRider();

    const [loadingOrders, setLoadingOrders] = useState({});

    // Filter active missions for the dashboard
    const activeOrders = myOrders.filter(o => ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ARRIVED'].includes(o.status));

    const handleAction = async (orderId, type) => {
        setLoadingOrders(prev => ({ ...prev, [orderId]: true }));
        const loadingToast = toast.loading(`Processing: ${type.toUpperCase()}...`);
        try {
            switch (type) {
                case 'claim': await claim(orderId); break;
                case 'batch': await batchToRoute(orderId); break;
                case 'accept': await accept(orderId); break;
                case 'pickup': await pickup(orderId); break;
                case 'arrive': await arrive(orderId); break;
                case 'collect': await collect(orderId); break;
                case 'deliver': await deliver(orderId); break;
                default: throw new Error("Invalid protocol type");
            }
            toast.dismiss(loadingToast);
            toast.success(`Action ${type.toUpperCase()} complete! ✅`);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || `Action failed: ${type.toUpperCase()} ❌`);
        } finally {
            setLoadingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const mainCards = [
        { title: 'Deliveries Completed', value: `${stats?.completedToday || 0} / ${stats?.totalDeliveries || 0}`, icon: Target, color: 'text-gold' },
        { title: 'Estimated Earnings', value: `Rs. ${(stats?.completedToday || 0) * 100}`, icon: Trophy, color: 'text-green-400' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 md:space-y-8 pb-24 max-w-7xl mx-auto px-4 pt-6"
        >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4 border-b border-white/5">
                <div>
                    <BrandLogo size="lg" className="mb-2" />
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mt-2">Operational Command Center</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {mainCards.map((card, idx) => (
                        <div key={idx} className="glass p-4 md:p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-gold/20 transition-all duration-500">
                            <div className={`p-3 rounded-xl bg-white/5 ${card.color} shadow-inner`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-soft-white/40 text-[9px] font-black uppercase tracking-widest leading-none">{card.title}</p>
                                <h3 className="text-xl font-bold font-sans text-soft-white mt-1.5">{card.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Active Delivery Section */}
                <section className="lg:col-span-7 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-3">
                            <LayoutDashboard className="w-5 h-5" /> Active Deliveries
                        </h2>
                        {activeOrders.length > 0 && (
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                {routeInfo.totalDistance} KM Route
                            </span>
                        )}
                    </div>

                    <div className="min-h-[400px] space-y-8">
                        <AnimatePresence mode="popLayout">
                            {activeOrders.length > 0 ? (
                                activeOrders.map((order, index) => (
                                    <div key={order._id} className="relative">
                                        <div className="absolute -left-4 top-0 bottom-0 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shadow-xl z-10 border-2 ${index === 0 ? 'bg-gold text-charcoal border-white/20' : 'bg-white/5 text-white/30 border-white/5'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            {index < activeOrders.length - 1 && (
                                                <div className="flex-1 w-0.5 bg-gradient-to-b from-white/10 to-transparent my-2" />
                                            )}
                                        </div>
                                        <div className="pl-8">
                                            <OrderCard
                                                order={order}
                                                onAction={handleAction}
                                                actionLoading={loadingOrders[order._id]}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[350px] glass rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-12"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                        <AlertCircle className="w-8 h-8 text-white/5" />
                                    </div>
                                    <h3 className="text-xl font-serif text-white/20 uppercase tracking-[0.2em]">Idle</h3>
                                    <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest mt-4">Waiting for delivery assignment...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>                {/* Available Queue Section */}
                <section className="lg:col-span-5 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-soft-white/60 flex items-center gap-3">
                            <ShoppingBag className="w-5 h-5 text-gold" /> Ready Orders
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Queue</span>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[800px] overflow-y-auto no-scrollbar pr-2">
                        <AnimatePresence mode="popLayout">
                            {availableOrders.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-12 glass rounded-[2.5rem] border border-dashed border-white/5 text-center shadow-inner flex flex-col items-center justify-center bg-white/[0.01]"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5 rotate-12">
                                        <Zap className="w-8 h-8 text-white/5" />
                                    </div>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] leading-none mb-2">Network Scanning</p>
                                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest">Awaiting dispatch signals...</p>
                                </motion.div>
                            ) : (
                                availableOrders.map((order) => (
                                    <motion.div 
                                        key={order._id} 
                                        className="relative group"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        {order.onRoute && (
                                            <div className="absolute -top-2 -right-1 z-20">
                                                <div className="bg-emerald-500 text-charcoal text-[7px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-1 border border-white/20">
                                                    <Zap size={8} className="fill-charcoal" /> On Route
                                                </div>
                                            </div>
                                        )}
                                        <OrderCard
                                            order={order}
                                            onAction={(id) => handleAction(id, order.onRoute ? 'batch' : 'claim')}
                                            actionLoading={loadingOrders[order._id]}
                                            compact={true}
                                        />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default Dashboard;

