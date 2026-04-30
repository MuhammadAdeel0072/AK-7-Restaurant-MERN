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
                    <h1 className="text-5xl font-serif font-bold text-white">
                        Current Order
                    </h1>
                </div>
                
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Tracking Active</span>
                </div>
            </div>

            {/* Main Tracker Card */}
            <div className="card-premium p-10 sm:p-14 mb-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
                <ETAIndicator estimatedTime={order.estimatedDeliveryTime} />
                
                <OrderStatusStepper currentStatus={order.status} />

                <div className="pt-12 border-t border-white/5 mt-4 grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Delivery Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Delivery To</h3>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white leading-tight mb-2">
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
                            <Phone className="w-4 h-4 text-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Support & Assistance</h3>
                        </div>
                        {order.rider ? (
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    <Package className="w-6 h-6 text-gold" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-1">Assigned Rider</p>
                                    <p className="text-lg font-bold text-white">{order.rider.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{order.rider.phone}</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    A professional rider will be assigned shortly as your order enters the delivery phase.
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
