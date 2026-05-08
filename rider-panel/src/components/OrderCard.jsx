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
    CreditCard,
    Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';

const OrderCard = ({ 
    order, 
    onAction, 
    actionLoading, 
    isNearby 
}) => {
    if (!order || !order._id) return null;

    const getDistanceLabel = (dist) => {
        const d = parseFloat(dist);
        if (isNaN(d)) return { label: 'Nearby', color: 'bg-near' };
        if (d < 2) return { label: 'Near', color: 'bg-near' };
        if (d < 5) return { label: 'Medium', color: 'bg-medium' };
        return { label: 'Far', color: 'bg-far' };
    };

    const distInfo = getDistanceLabel(order.distance);

    const getMainAction = () => {
        switch (order.status) {
            case 'READY_FOR_DELIVERY':
                return {
                    label: isNearby ? 'Accept Nearby Order' : 'Accept Order',
                    icon: <PackageCheck className="w-4 h-4" />,
                    class: 'btn-primary-large',
                    type: isNearby ? 'batch' : 'claim'
                };
            case 'ASSIGNED':
            case 'ACCEPTED':
                return {
                    label: 'Start Delivery',
                    icon: <Truck className="w-4 h-4" />,
                    class: 'btn-primary-large',
                    type: 'pickup'
                };
            case 'PICKED_UP':
                return {
                    label: 'I Have Arrived',
                    icon: <Navigation className="w-4 h-4" />,
                    class: 'btn-primary-large',
                    type: 'arrive'
                };
            case 'ARRIVED':
                return {
                    label: order.paymentMethod === 'cod' ? `Collect Rs. ${order.totalPrice} & Deliver` : 'Mark Delivered',
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    class: 'btn-success-large',
                    type: 'deliver'
                };
            default:
                return null;
        }
    };

    const action = getMainAction();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-minimal p-6 flex flex-col gap-6 relative overflow-hidden"
        >
            {/* Status Badge */}
            <div className="absolute top-0 right-0">
                <div className={`${distInfo.color} text-charcoal px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg`}>
                    {distInfo.label} • {order.distance || '0'} KM
                </div>
            </div>

            {/* Simple Header */}
            <div className="flex justify-between items-start pt-2">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                        <User className="w-7 h-7 text-gold" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                            {order.user?.firstName} {order.user?.lastName}
                        </h3>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">MISSION ID: {order.orderNumber || order._id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-near/10 flex items-center justify-center border border-near/20 shrink-0">
                        <MapPin className="w-5 h-5 text-near" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Destination</p>
                        <p className="text-sm font-medium text-white/80 leading-snug">
                            {order.shippingAddress?.address}
                        </p>
                        <p className="text-[10px] font-bold text-near mt-1 uppercase tracking-wider">{order.shippingAddress?.area}</p>
                    </div>
                </div>

                {/* Contact & Payment */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                <Phone className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">Contact</p>
                                <p className="text-sm font-bold text-white tracking-wider">{order.shippingAddress?.phoneNumber}</p>
                            </div>
                        </div>
                        <a 
                            href={`https://wa.me/${order.shippingAddress?.phoneNumber?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-full bg-near text-charcoal flex items-center justify-center shadow-lg active:scale-90 transition-all"
                        >
                            <Zap className="w-4 h-4 fill-charcoal" />
                        </a>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                                {order.paymentMethod === 'cod' ? <Banknote className="w-5 h-5 text-gold" /> : <CreditCard className="w-5 h-5 text-gold" />}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">Payment</p>
                                <p className="text-sm font-bold text-gold uppercase tracking-wider">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-serif font-black text-white">Rs. {order.totalPrice}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Large Action Button */}
            {action && (
                <div className="flex flex-col gap-3">
                    {order.status === 'ARRIVED' && order.paymentMethod === 'cod' && (
                        <div className="bg-near/10 border border-near/20 p-4 rounded-xl mb-1">
                            <p className="text-[10px] font-black text-near uppercase tracking-widest flex items-center gap-2">
                                <Banknote size={14} /> Payment Required: Rs. {order.totalPrice}
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={() => onAction(order._id, action.type)}
                        disabled={actionLoading}
                        className={`${action.class} relative overflow-hidden group/btn active:scale-95 transition-all`}
                    >
                        {actionLoading ? (
                            <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                {action.icon}
                                <span className="relative z-10">{action.label}</span>
                                <ChevronRight className="w-4 h-4 ml-auto opacity-30 group-hover/btn:translate-x-1 transition-transform relative z-10" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default OrderCard;


