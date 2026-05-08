import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Package, Phone, HelpCircle } from 'lucide-react';
import { useOrderTracking } from '../hooks/useOrderTracking';
import OrderStatusStepper from '../components/OrderStatusStepper';
import ETAIndicator from '../components/ETAIndicator';

const TrackOrderPage = () => {
    const { id } = useParams();
    const { order, loading, error } = useOrderTracking(id);

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-24 max-w-4xl space-y-12">
                <div className="h-10 w-48 bg-white/5 animate-pulse rounded-xl" />
                <div className="h-64 bg-white/5 animate-pulse rounded-[3rem]" />
                <div className="space-y-4">
                    <div className="h-8 w-full bg-white/5 animate-pulse rounded-xl" />
                    <div className="h-8 w-2/3 bg-white/5 animate-pulse rounded-xl" />
                </div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="container mx-auto px-6 py-32 text-center max-w-xl">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                    <HelpCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{error}</h2>
                <Link to="/orders" className="text-gold font-black uppercase tracking-widest text-[10px] hover:underline">
                    Return to Order History
                </Link>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                    <Link to="/orders" className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-6 group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to History
                    </Link>
                    <h1 className="text-5xl font-serif font-black text-white">
                        Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </h1>
                </div>
                
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Tracking Active</span>
                </div>
            </div>

            {/* Main Tracker Card */}
            <div className="card-premium p-10 sm:p-14 mb-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px] -z-10"></div>
                
                <div className="mb-10">
                    <ETAIndicator estimatedTime={order.estimatedDeliveryTime} />
                </div>
                
                {/* Status Stepper */}
                <OrderStatusStepper currentStatus={order.status} />

                {/* Map Section */}
                <div className="mt-12 h-80 rounded-[2.5rem] bg-white/5 border border-white/10 overflow-hidden relative group">
                    {(order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP' || order.status === 'ARRIVED') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent)]"></div>
                            {/* In a real production app, we would mount the Map component here */}
                            {/* Since Leaflet/GoogleMaps keys might be missing, I'll show a high-fidelity visual tracker */}
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="z-10 text-center px-10"
                            >
                                <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/20 relative">
                                    <div className="absolute inset-0 bg-gold/20 rounded-full animate-ping"></div>
                                    <Truck className="w-10 h-10 text-gold" />
                                </div>
                                <h4 className="text-xl font-serif font-black text-white uppercase tracking-widest mb-2">Live Tracking Active</h4>
                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Courier is en route to your location</p>
                            </motion.div>
                            
                            {/* Coordinates HUD */}
                            {order.riderLocation && (
                                <div className="absolute bottom-6 right-6 glass px-4 py-2 rounded-xl border border-white/10">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live Coordinates</p>
                                    <p className="text-[10px] font-mono text-gold">{order.riderLocation.lat.toFixed(4)}, {order.riderLocation.lng.toFixed(4)}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center px-10">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                <Package className="w-8 h-8 text-white/20" />
                            </div>
                            <h4 className="text-sm font-black text-white/20 uppercase tracking-widest">Live Map will activate when courier departs</h4>
                        </div>
                    )}
                </div>

                <div className="pt-12 border-t border-white/5 mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Delivery Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Delivery Destination</h3>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-inner">
                            <p className="text-xl font-serif font-black text-white leading-tight mb-2">
                                {order.shippingAddress.fullName || 'Valued Customer'}
                            </p>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                {order.shippingAddress.address}, {order.shippingAddress.area}<br />
                                {order.shippingAddress.city}
                            </p>
                        </div>
                    </div>

                    {/* Rider Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-4 h-4 text-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Gourmet Courier</h3>
                        </div>
                        {order.rider ? (
                            <div className="bg-gold/5 p-6 rounded-[2rem] border border-gold/20 flex flex-col sm:flex-row items-center gap-6 relative group">
                                <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg ${
                                    order.status === 'DELIVERED' ? 'bg-green-500 text-white' : 'bg-gold text-charcoal'
                                }`}>
                                    {order.status === 'DELIVERED' ? 'Delivered' : 'En Route'}
                                </div>
                                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 overflow-hidden shrink-0">
                                    <div className="w-full h-full flex items-center justify-center bg-gold/5">
                                        <Truck className="w-8 h-8 text-gold" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <p className="text-xl font-serif font-black text-white mb-1">{order.rider.name}</p>
                                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4">Midnight Professional</p>
                                    <a 
                                        href={`tel:${order.rider.phone}`}
                                        className="inline-flex items-center gap-2 bg-gold text-charcoal px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/10"
                                    >
                                        <Phone className="w-3 h-3 fill-current" /> Contact Rider
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-center h-full">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                                    <Clock className="w-5 h-5 text-gray-500" />
                                </div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest max-w-[200px]">
                                    Assigning courier...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Help Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 px-10 text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    Issues with your order? Reach out to our concierge at <span className="text-white/40">+92 300 0000000</span>
                </p>
                <Link to="/help" className="text-[10px] font-black uppercase tracking-widest text-gold hover:underline">
                    Visit Help Center
                </Link>
            </div>
        </div>
    );
};

export default TrackOrderPage;
