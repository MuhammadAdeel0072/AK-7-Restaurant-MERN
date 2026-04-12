import React from 'react';
import { 
    Clock, 
    MapPin, 
    ShoppingBag, 
    ArrowRight, 
    CheckCircle, 
    Navigation 
} from 'lucide-react';
import { motion } from 'framer-motion';
const OrderCard = ({ order, onAction, actionLoading }) => {
    
    const getStatusConfig = (status) => {
        switch (status) {
            case 'ready': return { color: 'text-gold', bg: 'bg-gold/10', label: 'READY' };
            case 'accepted': return { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'ACCEPTED' };
            case 'picked-up': return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'ON WAY' };
            case 'delivered': return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'DELIVERED' };
            default: return { color: 'text-soft-white', bg: 'bg-white/5', label: status };
        }
    };

    const config = getStatusConfig(order.status);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-premium p-6 sm:p-8 flex flex-col gap-6"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/10">
                        <ShoppingBag className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider italic">
                            Order <span className="text-gold">#{order._id.slice(-6)}</span>
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                                {config.label}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] text-soft-white/30 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <p className="text-[10px] font-bold text-soft-white/20 uppercase tracking-widest mb-1 italic">Order Total</p>
                    <p className="text-lg font-serif font-black text-white italic">Rs. {order.totalPrice}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <div className="w-px h-full bg-gold/20" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-soft-white/20 uppercase tracking-widest leading-none mb-1">Pick Up From</p>
                            <p className="text-xs font-bold text-white tracking-tight uppercase tracking-wider italic">AK-7 REST — Main Kitchen</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-crimson" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-soft-white/20 uppercase tracking-widest leading-none mb-1">Deliver To</p>
                            <p className="text-xs font-bold text-white tracking-tight uppercase tracking-wider italic">{order.address?.street || 'Customer Location'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <div className="flex flex-col items-end gap-2">
                         <div className="flex -space-x-2">
                             {order.items.slice(0, 3).map((item, idx) => (
                                 <img key={idx} src={item.image} className="w-10 h-10 rounded-full border-2 border-charcoal object-cover" alt="food" />
                             ))}
                             {order.items.length > 3 && (
                                 <div className="w-10 h-10 rounded-full border-2 border-charcoal bg-white/5 flex items-center justify-center text-[10px] font-bold text-soft-white/40">
                                     +{order.items.length - 3}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {order.status === 'ready' && (
                    <button 
                        onClick={() => onAction(order._id, 'accept')}
                        disabled={actionLoading}
                        className="btn-gold flex-1 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-gold/20"
                    >
                        ACCEPT ORDER <Navigation className="w-4 h-4" />
                    </button>
                )}
                
                {order.status === 'accepted' && (
                    <button 
                        onClick={() => onAction(order._id, 'picked-up')}
                        disabled={actionLoading}
                        className="btn-gold flex-1 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        START DELIVERY <ArrowRight className="w-4 h-4" />
                    </button>
                )}

                {order.status === 'picked-up' && (
                    <button 
                        onClick={() => onAction(order._id, 'delivered')}
                        disabled={actionLoading}
                        className="btn-gold flex-1 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        MARK DELIVERED <CheckCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default OrderCard;
