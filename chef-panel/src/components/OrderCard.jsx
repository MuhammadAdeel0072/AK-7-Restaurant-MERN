import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, 
    ChefHat, 
    CheckCircle, 
    User, 
    ShoppingBag,
    UtensilsCrossed,
    Info,
    Timer
} from 'lucide-react';
import { updateOrderStatus, updateItemStatus } from '../services/api';
import toast from 'react-hot-toast';

const OrderCard = ({ order, onUpdate }) => {
    const [elapsed, setElapsed] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const calculateElapsed = () => {
            const start = new Date(order.createdAt).getTime();
            const now = Date.now();
            setElapsed(Math.floor((now - start) / 60000));
        };
        calculateElapsed();
        const interval = setInterval(calculateElapsed, 10000);
        return () => clearInterval(interval);
    }, [order.createdAt]);

    const estimatedLimit = order.estimatedPrepTime || 20;
    const isDelayed = elapsed > estimatedLimit;
    const isCloseToDelay = elapsed > estimatedLimit * 0.75;

    const getStatusColor = () => {
        if (order.status === 'ready') return 'border-green-500/30 bg-green-500/5';
        if (isDelayed) return 'border-crimson/40 bg-crimson/5 shadow-[0_0_50px_rgba(220,38,38,0.1)]';
        if (isCloseToDelay) return 'border-gold/30 bg-gold/5';
        if (order.status === 'preparing') return 'border-blue-400/30 bg-blue-400/5';
        return 'border-white/10 bg-white/5';
    };

    const handleItemToggle = async (itemId, currentStatus) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const nextStatus = currentStatus === 'ready' ? 'preparing' : 'ready';
        try {
            await updateItemStatus(order._id, itemId, nextStatus);
            onUpdate();
        } catch (error) {
            toast.error('Failed to update item status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleMainAction = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            const nextStatus = order.status === 'preparing' ? 'ready' : 'preparing';
            await updateOrderStatus(order._id, nextStatus);
            onUpdate();
            toast.success(`Order #${order.orderNumber || '...'} ${nextStatus.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to update order status');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <motion.div
            layout
            className={`glass rounded-[2rem] border overflow-hidden transition-all duration-500 group relative ${getStatusColor()}`}
        >
            {order.priority === 'vip' && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gold shadow-[0_0_20px_rgba(212,175,55,1)]"></div>
            )}

            <div className="p-7 space-y-6 text-left">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-white tracking-tighter">
                                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            </h3>
                            {order.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                    order.priority === 'vip' ? 'bg-gold text-charcoal shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-crimson text-white'
                                }`}>
                                    {order.priority}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-soft-white/30 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5" /> 
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/20"></div>
                            <span className="text-[10px] font-black text-gold/60 uppercase tracking-widest">{order.orderType}</span>
                        </div>
                    </div>

                    <div className={`flex flex-col items-end ${isDelayed ? 'text-crimson' : isCloseToDelay ? 'text-gold' : 'text-soft-white/40'}`}>
                        <div className="flex items-center gap-2 font-mono font-bold text-xl">
                            <Timer className="w-4 h-4" />
                            {elapsed}m
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-right">Elapsed Time</span>
                    </div>
                </div>

                {order.specialInstructions && (
                    <div className="p-4 rounded-2xl bg-crimson/10 border border-crimson/20 flex items-start gap-3 animate-pulse-slow">
                        <div className="space-y-1 text-left">
                            <p className="text-[8px] font-black text-crimson uppercase tracking-[0.2em]">Special Notes</p>
                            <p className="text-xs font-bold text-white tracking-tight leading-relaxed italic">"{order.specialInstructions}"</p>
                        </div>
                    </div>
                )}

                <div className="space-y-3 py-4 border-y border-white/5 font-sans">
                    {order.orderItems.map((item, idx) => (
                        <div key={item._id || idx} className="flex items-center justify-between group/item p-2 rounded-xl hover:bg-white/5 transition-all">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/5 bg-charcoal shrink-0 grayscale group-hover/item:grayscale-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-white text-sm tracking-tight">{item.name}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                         <span className="text-gold font-black text-xs">x{item.qty}</span>
                                         {item.customizations?.map((c, ci) => (
                                              <span key={ci} className="text-[8px] bg-white/5 text-soft-white/40 px-1.5 py-0.5 rounded border border-white/5">{typeof c === 'string' ? c : c.selection}</span>
                                         ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleItemToggle(item._id, item.status)}
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                    item.status === 'ready' 
                                        ? 'bg-green-500/20 text-green-500 border-green-500/20' 
                                        : 'bg-white/5 text-soft-white/40 border-white/5 hover:border-gold/30 hover:text-gold'
                                }`}
                            >
                                {item.status === 'ready' ? 'Done' : 'Pending'}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleMainAction}
                        disabled={isUpdating}
                        className={`flex-1 relative font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg group/btn  ${
                            order.status === 'ready' 
                                ? 'bg-green-500 text-white cursor-default' 
                                : order.status === 'preparing' 
                                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                    : 'bg-gold text-charcoal hover:bg-gold/90'
                        }`}
                    >
                        {isUpdating && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                        {order.status === 'ready' ? <CheckCircle className="w-5 h-5" /> : <ChefHat className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />}
                        <span className="text-[10px] tracking-[0.2em] uppercase">
                            {order.status === 'ready' ? 'Ready' : order.status === 'preparing' ? 'Mark as Ready' : 'Start Cooking'}
                        </span>
                    </button>
                    
                    <button className="w-14 h-14 bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/10 text-gold flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default OrderCard;
