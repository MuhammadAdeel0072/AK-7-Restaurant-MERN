import React, { useState, useRef } from 'react';
import { 
    Clock, 
    MapPin, 
    ShoppingBag, 
    CheckCircle, 
    Navigation,
    Truck,
    Phone,
    User,
    ChevronRight,
    Map,
    PlusCircle,
    Route as RouteIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderCard = ({ 
    order, 
    onAction, 
    actionLoading, 
    customActionLabel, 
    isSequence, 
    sequenceNumber,
    isNearby 
}) => {
    const [holdProgress, setHoldProgress] = useState(0);
    const holdTimer = useRef(null);

    if (!order || !order._id) return null;

    const getStatusConfig = (status) => {
        switch (status) {
            case 'READY_FOR_DELIVERY': return { color: 'text-gold', bg: 'bg-gold/10', label: 'READY' };
            case 'ASSIGNED': return { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'ASSIGNED' };
            case 'ACCEPTED': return { color: 'text-indigo-400', bg: 'bg-indigo-400/10', label: 'ACCEPTED' };
            case 'PICKED_UP': return { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'PICKED UP' };
            case 'ARRIVED': return { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'ARRIVED' };
            case 'DELIVERED': return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'DELIVERED' };
            default: return { color: 'text-soft-white', bg: 'bg-white/5', label: status };
        }
    };

    const config = getStatusConfig(order.status);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress?.address + ', ' + (order.shippingAddress?.city || ''))}`;

    const startHold = () => {
        if (actionLoading) return;
        holdTimer.current = setInterval(() => {
            setHoldProgress(prev => {
                if (prev >= 100) {
                    clearInterval(holdTimer.current);
                    onAction(order._id, 'deliver');
                    return 100;
                }
                return prev + 5;
            });
        }, 50);
    };

    const stopHold = () => {
        clearInterval(holdTimer.current);
        if (holdProgress < 100) setHoldProgress(0);
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card-premium p-5 sm:p-6 flex flex-col gap-5 relative overflow-hidden transition-all duration-500 ${isSequence ? 'border-l-4 border-l-gold' : ''}`}
        >
            {/* Status Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 ${isSequence ? 'bg-gold/10 border-gold/20' : ''}`}>
                        {isSequence ? <RouteIcon className="w-5 h-5 text-gold" /> : <ShoppingBag className="w-5 h-5 text-gold/60" />}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
                            {isSequence ? `Stop #${sequenceNumber}` : 'Order'} <span className="text-gold">#{order.orderNumber || order._id.slice(-6)}</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${config.bg} ${config.color} border border-current/10`}>
                                {config.label}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] text-soft-white/40 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] font-black text-soft-white/40 uppercase tracking-widest mb-0.5">Amount</p>
                    <p className="text-lg font-bold text-white leading-none mb-2">Rs.{order.totalPrice}</p>
                    
                    {order.distance && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/10">
                            <Navigation size={10} className="text-gold" />
                            <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">{order.distance} KM</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                            <User className="w-4 h-4 text-gold/60" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-soft-white/40 uppercase tracking-widest">Customer</p>
                            <p className="text-xs font-semibold text-white tracking-wide">{order.user?.firstName} {order.user?.lastName}</p>
                            {order.shippingAddress?.phoneNumber && (
                                <a href={`tel:${order.shippingAddress.phoneNumber}`} className="flex items-center gap-1.5 mt-1.5 text-blue-400 hover:text-blue-300 transition-colors w-fit bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span className="text-[10px] font-bold tracking-widest">{order.shippingAddress.phoneNumber}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                            <MapPin className="w-4 h-4 text-crimson/60" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-soft-white/40 uppercase tracking-widest">Address</p>
                            <p className="text-[11px] font-medium text-white leading-relaxed line-clamp-2">
                                {order.shippingAddress?.address}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-bold text-soft-white/40 uppercase tracking-widest">Payment</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${order.paymentMethod === 'cod' ? 'text-gold' : 'text-green-400'}`}>
                                {order.paymentMethod === 'cod' ? 'Collect Cash' : 'Paid'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-soft-white/40 uppercase tracking-widest">Items</span>
                            <span className="text-[10px] font-bold text-white tracking-widest">{order.orderItems?.length}</span>
                        </div>
                    </div>

                    <a 
                        href={googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-white"
                    >
                        <Map className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Open Map</span>
                    </a>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-1">
                <AnimatePresence mode="wait">
                    {order.status === 'READY_FOR_DELIVERY' && (
                        <motion.button 
                            key="claim"
                            onClick={() => onAction(order._id, 'claim')}
                            disabled={actionLoading}
                            className="w-full py-3.5 bg-gold text-[#0f1115] rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                        >
                            {customActionLabel || (actionLoading ? 'Connecting...' : 'Accept Delivery')} <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    )}

                    {order.status === 'ASSIGNED' && (
                        <motion.button 
                            key="accept"
                            onClick={() => onAction(order._id, 'accept')}
                            disabled={actionLoading}
                            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors"
                        >
                            <CheckCircle className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Confirm Order'}
                        </motion.button>
                    )}

                    {order.status === 'ACCEPTED' && (
                        <motion.button 
                            key="pickup"
                            onClick={() => onAction(order._id, 'pickup')}
                            disabled={actionLoading}
                            className="w-full py-3.5 bg-orange-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors"
                        >
                            <ShoppingBag className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Picked Up'}
                        </motion.button>
                    )}

                    {order.status === 'PICKED_UP' && (
                        <motion.button 
                            key="arrive"
                            onClick={() => onAction(order._id, 'arrive')}
                            disabled={actionLoading}
                            className="w-full py-3.5 bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-purple-500 transition-colors"
                        >
                            <Truck className="w-4 h-4" /> {actionLoading ? 'Processing...' : 'Arrived at Destination'}
                        </motion.button>
                    )}

                    {order.status === 'ARRIVED' && (
                        <div className="relative group">
                            <motion.div 
                                className="relative w-full h-14 bg-white/5 rounded-xl overflow-hidden border border-white/10 cursor-pointer shadow-inner"
                                onMouseDown={startHold}
                                onMouseUp={stopHold}
                                onMouseLeave={stopHold}
                                onTouchStart={startHold}
                                onTouchEnd={stopHold}
                            >
                                <motion.div 
                                    className="absolute left-0 top-0 h-full bg-green-500/30"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${holdProgress}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${holdProgress > 0 ? 'border-green-500 bg-green-500' : 'border-white/10'}`}>
                                        <CheckCircle className={`w-3 h-3 transition-colors ${holdProgress > 0 ? 'text-charcoal' : 'text-white/10'}`} />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-white select-none">
                                        {holdProgress >= 100 ? 'Completed' : holdProgress > 0 ? 'Hold...' : 'Hold to Complete'}
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default OrderCard;
