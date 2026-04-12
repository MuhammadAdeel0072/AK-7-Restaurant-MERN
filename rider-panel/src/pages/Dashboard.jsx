import React, { useState } from 'react';
import {
    LayoutDashboard,
    ArrowRight,
    ShoppingBag,
    CheckCircle,
    Truck,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRider } from '../context/RiderContext';
import OrderCard from '../components/OrderCard';
import { acceptOrder, updateDeliveryStatus } from '../services/api';
import toast from 'react-hot-toast';
const Dashboard = () => {
    const { availableOrders, myOrders, stats, loading, refreshData } = useRider();
    const [actionLoading, setActionLoading] = useState(false);

    const handleAction = async (orderId, type) => {
        setActionLoading(true);
        try {
            if (type === 'accept') {
                await acceptOrder(orderId);
                toast.success('Order accepted! Head to the kitchen.');
            } else {
                await updateDeliveryStatus(orderId, type);
                toast.success(`Order status updated: ${type.replace(/-/g, ' ')}`);
            }
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update order');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const activeOrder = myOrders.length > 0 ? myOrders[0] : null;

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tighter italic mb-1 uppercase">
                        Rider <span className="text-gold ml-1">Dashboard</span>
                    </h1>
                    <p className="label-caps italic tracking-[0.25em]">Live Order Tracking</p>
                </div>

                <div className="flex items-center gap-8 glass p-6 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                        <span className="label-caps mb-1">Earnings</span>
                        <span className="text-2xl font-serif font-black text-white italic tracking-tighter">Rs. {(stats?.completedToday || 0) * 150}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="label-caps mb-1">Success Rate</span>
                        <span className="text-2xl font-serif font-black text-gold italic tracking-tighter">98.4%</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Active Delivery Section */}
                <section className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-soft-white/60 flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-gold" /> Current Order
                        </h2>
                    </div>

                    <div className="min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {activeOrder ? (
                                <OrderCard
                                    key={activeOrder._id}
                                    order={activeOrder}
                                    onAction={handleAction}
                                    actionLoading={actionLoading}
                                />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-10"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                        <AlertCircle className="w-8 h-8 text-soft-white/10" />
                                    </div>
                                    <h3 className="text-xl font-serif text-white/20 uppercase tracking-widest leading-none">No Active Orders</h3>
                                    <p className="text-[10px] text-soft-white/10 font-bold uppercase tracking-widest mt-3 italic">Waiting for a new order...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Available Queue Section */}
                <section className="lg:col-span-5 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-soft-white/60 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gold" /> Available Orders
                    </h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                        <AnimatePresence mode="popLayout">
                            {availableOrders.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-8 glass rounded-3xl border border-white/5 text-center"
                                >
                                    <CheckCircle className="w-10 h-10 text-gold/10 mx-auto mb-4" />
                                    <p className="text-[10px] text-soft-white/30 font-bold uppercase tracking-widest leading-none italic">All clear! No orders pending.</p>
                                </motion.div>
                            ) : (
                                availableOrders.map((order) => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        onAction={handleAction}
                                        actionLoading={actionLoading}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
