import React from 'react';
import {
    User,
    MapPin,
    Navigation,
    ChevronRight,
    CheckCircle2,
    Truck,
    PackageCheck,
    Zap,
    Phone,
    Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';

const OrderCard = ({
    order,
    onAction,
    actionLoading,
    isNearby,
    cashCollected = order.codCollected,
    compact = false
}) => {
    if (!order || !order._id) return null;

    const getDistanceLabel = (dist) => {
        const d = parseFloat(dist);
        if (isNaN(d)) return { label: 'Nearby', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
        if (d < 2) return { label: 'Near', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
        if (d < 5) return { label: 'Medium', color: 'bg-gold/10 text-gold border-gold/20' };
        return { label: 'Far', color: 'bg-crimson/10 text-crimson border-crimson/20' };
    };

    const distInfo = getDistanceLabel(order.distance);

    const getStatusBadge = () => {
        const s = order.status;
        if (['READY_FOR_DELIVERY', 'DISPATCHED'].includes(s)) return { label: 'Dispatch Ready', style: 'bg-gold/10 text-gold border-gold/20' };
        if (s === 'ASSIGNED') return { label: 'Assigned', style: 'bg-blue-400/10 text-blue-400 border-blue-400/20' };
        if (s === 'ACCEPTED') return { label: 'Accepted', style: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20' };
        if (s === 'PICKED_UP') return { label: 'Out for Delivery', style: 'bg-orange-400/10 text-orange-400 border-orange-400/20' };
        if (s === 'ARRIVED') return { label: 'Arrived', style: 'bg-purple-400/10 text-purple-400 border-purple-400/20' };
        if (s === 'DELIVERED') return { label: 'Delivered', style: 'bg-green-500/10 text-green-500 border-green-500/20' };
        return { label: s, style: 'bg-white/5 text-white/40 border-white/10' };
    };

    const getMainAction = () => {
        switch (order.status) {
            case 'READY_FOR_DELIVERY':
            case 'DISPATCHED':
                return {
                    label: isNearby ? 'Accept Nearby Order' : 'Accept Order',
                    icon: <PackageCheck className="w-4 h-4" />,
                    type: isNearby ? 'batch' : 'claim'
                };
            case 'ASSIGNED':
            case 'ACCEPTED':
                return {
                    label: 'Start Delivery',
                    icon: <Truck className="w-4 h-4" />,
                    type: 'pickup'
                };
            case 'PICKED_UP':
                return {
                    label: 'I Have Arrived',
                    icon: <Navigation className="w-4 h-4" />,
                    type: 'arrive'
                };
            case 'ARRIVED': {
                const isCOD = order.paymentMethod?.toLowerCase() === 'cod';
                if (isCOD && !cashCollected) {
                    return {
                        label: `Collect Rs. ${order.totalPrice}`,
                        icon: <Banknote className="w-4 h-4" />,
                        type: 'collect'
                    };
                }
                return {
                    label: 'Mark Delivered',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    type: 'deliver'
                };
            }
            default:
                return null;
        }
    };

    const action = getMainAction();
    const statusBadge = getStatusBadge();

    if (compact) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-[1.5rem] border border-white/5 p-4 flex flex-col gap-3 relative overflow-hidden hover:border-gold/30 transition-all duration-500 group cursor-pointer"
                onClick={() => onAction(order._id, action.type)}
            >
                {/* Compact Header: Area & Distance */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                            <MapPin className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-soft-white leading-tight">
                                {order.shippingAddress?.area || 'Nearby'}
                            </p>
                            <p className="text-[10px] font-bold text-soft-white/40 uppercase tracking-widest">{distInfo.label} • {order.distance || '0'} KM</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-base font-bold text-soft-white">Rs. {order.totalPrice}</p>
                    </div>
                </div>

                {/* Footer: Status & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${statusBadge.style}`}>
                        {statusBadge.label}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(order._id, action.type); }}
                        disabled={actionLoading}
                        className="bg-gold hover:bg-yellow-400 text-charcoal px-4 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-gold/10"
                    >
                        {actionLoading ? (
                            <div className="w-3 h-3 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                        ) : (
                            <>
                                {action.icon}
                                <span>{action.label}</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/5 p-4 md:p-5 flex flex-col gap-4 relative overflow-hidden hover:border-gold/30 transition-all duration-500 group"
        >
            {/* Top Bar — Badges */}
            <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${statusBadge.style}`}>
                    {statusBadge.label}
                </span>
                <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${distInfo.color}`}>
                    {order.distance || '0'} KM
                </span>
                <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-soft-white/60 ml-auto`}>
                    {order.paymentMethod?.toLowerCase() === 'cod' ? 'COD' : 'Prepaid'}
                </span>
            </div>

            {/* Middle Section — Info Grid */}
            <div className="flex flex-col gap-4 pt-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                            <User className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-soft-white tracking-tight leading-none">
                                {order.user?.firstName} {order.user?.lastName}
                            </h3>
                        </div>
                    </div>
                    <div className="text-right mt-1 sm:mt-0">
                        <p className="text-xl font-bold text-soft-white">Rs. {order.totalPrice}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-soft-white/60 shrink-0 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-soft-white leading-tight">
                                {order.shippingAddress?.address}
                            </p>
                            {order.shippingAddress?.area && (
                                <p className="text-[11px] font-bold text-soft-white/60 mt-1 uppercase tracking-wider">{order.shippingAddress.area}</p>
                            )}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-start gap-3 sm:border-l sm:border-white/5 sm:pl-4">
                        <Phone className="w-4 h-4 text-soft-white/60 shrink-0 mt-1" />
                        <div className="flex-1">
                            <p className="text-base font-bold text-soft-white tracking-wider">{order.shippingAddress?.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href={`tel:${order.shippingAddress?.phoneNumber?.replace(/[^0-9+]/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-lg bg-white/5 text-soft-white/80 flex items-center justify-center border border-white/10 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                                <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                                href={`https://wa.me/${order.shippingAddress?.phoneNumber?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20 hover:bg-green-500 hover:text-charcoal transition-all active:scale-95"
                            >
                                <Zap className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* COD Warning */}
                {order.status === 'ARRIVED' && (order.paymentMethod?.toLowerCase() === 'cod') && (
                    <div className={`p-3 rounded-xl flex items-center gap-3 border ${cashCollected ? 'glass border-green-500/20' : 'glass-gold border-gold/20'}`}>
                        {cashCollected ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <Banknote className="w-5 h-5 text-gold shrink-0" />}
                        <div>
                            <p className={`text-[11px] font-bold tracking-wide ${cashCollected ? 'text-green-500' : 'text-gold'}`}>
                                {cashCollected ? `Rs. ${order.totalPrice} Collected` : `Collect Cash: Rs. ${order.totalPrice}`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom Section — Compact Action Buttons */}
                {action && (
                    <div className="pt-3 flex justify-end items-center gap-3 border-t border-white/5 mt-1">
                        {['PICKED_UP', 'ARRIVED'].includes(order.status) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const lat = order.shippingAddress?.lat;
                                    const lng = order.shippingAddress?.lng;
                                    if (lat && lng) {
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
                                    } else {
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.shippingAddress?.address)}&travelmode=driving`, '_blank');
                                    }
                                }}
                                className="px-4 py-1.5 rounded-md font-bold transition-all text-gold border border-gold/20 hover:bg-gold/10 active:scale-95 text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Navigation className="w-3 h-3" /> Navigate
                            </button>
                        )}
                        {order.status === 'READY_FOR_DELIVERY' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); /* Future reject logic */ }}
                                className="px-5 py-2 rounded-md font-bold transition-all text-soft-white/40 border border-white/10 hover:bg-white/5 active:scale-95 text-[10px] uppercase tracking-widest"
                            >
                                Reject
                            </button>
                        )}
                        <button
                            onClick={() => onAction(order._id, action.type)}
                            disabled={actionLoading}
                            className="btn-gold px-5 py-1.5 flex items-center justify-center gap-2 relative overflow-hidden group/btn text-[10px] shadow-none"
                        >
                            {actionLoading ? (
                                <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
                            ) : (
                                <>
                                    {action.icon}
                                    <span className="relative z-10 uppercase tracking-widest">{action.label}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default OrderCard;
