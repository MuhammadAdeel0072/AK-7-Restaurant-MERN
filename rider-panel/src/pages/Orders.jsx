import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, ShoppingBag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRider } from '../context/RiderContext';
import OrderCard from '../components/OrderCard';
import { updateDeliveryStatus, updateLocationData } from '../services/api';
import toast from 'react-hot-toast';

const Orders = () => {
    const { myOrders, loading, refreshData } = useRider();
    const [actionLoading, setActionLoading] = useState(false);

    // Live Tracking Logic: Signals coordination with the client tracking terminal
    useEffect(() => {
        let locationInterval;
        const activeDelivery = myOrders.find(o => o.status === 'out-for-delivery');
        
        if (activeDelivery) {
            console.log("📍 Initializing Live Telemetry for Order:", activeDelivery._id);
            locationInterval = setInterval(() => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        try {
                            await updateLocationData(
                                activeDelivery._id, 
                                position.coords.latitude, 
                                position.coords.longitude
                            );
                        } catch (err) {
                            console.error("Telemetry Sync Failed:", err);
                        }
                    });
                }
            }, 10000); // 10s sync cycle
        }

        return () => {
            if (locationInterval) clearInterval(locationInterval);
        };
    }, [myOrders]);

    const handleAction = async (orderId, type) => {
        setActionLoading(true);
        const loadingToast = toast.loading(`Updating delivery status...`);
        try {
            await updateDeliveryStatus(orderId, type);
            toast.dismiss(loadingToast);
            const statusLabel = type === 'accepted' ? 'Accepted 🚴' : type === 'out-for-delivery' ? 'Out for Delivery 📦' : 'Delivered ✅';
            toast.success(`Delivery ${statusLabel}`);
            refreshData();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Failed to update order ❌');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const activeOrders = myOrders.filter(o => o.status !== 'delivered');
    const completedOrders = myOrders.filter(o => o.status === 'delivered');

    return (
        <div className="space-y-12 pb-20 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                   <h1 className="text-4xl font-serif font-black tracking-tighter italic mb-1 uppercase">
                       Order <span className="text-gold ml-1">History</span>
                   </h1>
                   <p className="label-caps italic tracking-[0.25em]">Your Previous Deliveries</p>
                </div>
            </header>

            <div className="space-y-16">
                {/* Current Active Mission */}
                <section>
                    <h2 className="label-caps italic text-gold/40 flex items-center gap-3 mb-8 border-l-2 border-gold/20 pl-4">
                       <Truck className="w-4 h-4" /> Current Order
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <AnimatePresence mode="popLayout">
                            {activeOrders.length === 0 ? (
                                <motion.div 
                                    className="col-span-full py-20 card-premium border-dashed border-white/10 flex flex-col items-center justify-center text-center p-10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <ShoppingBag className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                    <p className="label-caps italic opacity-40">No active orders found.</p>
                                </motion.div>
                            ) : (
                                activeOrders.map((order) => (
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

                {/* History Section */}
                <section>
                    <h2 className="label-caps italic text-soft-white/20 flex items-center gap-3 mb-8 border-l-2 border-white/5 pl-4">
                       <Clock className="w-4 h-4" /> Delivered Orders
                    </h2>
                    
                    <div className="space-y-6">
                        {completedOrders.length === 0 ? (
                            <p className="label-caps text-center py-10 opacity-20 italic">No historical data available.</p>
                        ) : (
                            completedOrders.map((order) => (
                                <div key={order._id} className="card-premium p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center border border-white/5">
                                            <CheckCircle2 className="w-6 h-6 text-green-500/40" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white tracking-widest italic leading-none mb-2">ORDER #{order._id.slice(-6).toUpperCase()}</h4>
                                            <div className="flex items-center gap-4">
                                                <p className="label-caps !tracking-widest opacity-40 italic">{order.address?.street || 'Delivered'}</p>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <p className="text-[10px] text-white/20 font-mono tracking-tighter uppercase italic line-clamp-1">{order._id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] text-soft-white/20 font-bold uppercase tracking-widest mb-1 italic">Delivered At</p>
                                        <p className="text-sm font-bold text-gold/40 tracking-wider font-mono uppercase">{new Date(order.deliveredAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Orders;
