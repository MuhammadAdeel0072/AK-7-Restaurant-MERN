import { useState, useEffect } from "react";
import { getReadyOrders, updateOrderStatus } from "../services/api";
import socket from "../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  User,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";

const ReadyQueue = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await getReadyOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch ready orders", error);
            setError("Failed to fetch ready orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        if (socket) {
            socket.on('orderUpdate', fetchOrders);
            socket.on('incomingOrder', fetchOrders);
        }
        return () => {
            if (socket) {
                socket.off('orderUpdate');
                socket.off('incomingOrder');
            }
        };
    }, []);

    const handleMarkDelivered = async (id) => {
        try {
            await updateOrderStatus(id, 'delivered');
            toast.success('Order Dispatched', {
                style: { background: '#121212', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
            });
            setOrders(prev => prev.filter(o => o._id !== id));
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black mb-1 tracking-tighter italic">
                        Ready <span className="text-gold ml-1">Orders Queue</span>
                    </h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold italic">Awaiting dispatch and customer pickup</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
                    Total: {orders?.length || 0}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center glass rounded-[3rem] border border-white/5"
                        >
                            <Package className="w-16 h-16 text-white/5 mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white/20 uppercase tracking-widest">No Ready Orders</h2>
                        </motion.div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                layout
                                key={order?._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group transition-all duration-500 hover:border-green-500/20"
                            >
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Ready</span>
                                            <h3 className="text-xl font-bold text-white mt-1 uppercase tracking-tighter">
                                                #{order?.orderNumber || order?._id?.slice(-6).toUpperCase()}
                                            </h3>
                                        </div>
                                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-soft-white/60">
                                            <User className="w-4 h-4 text-gold/60" />
                                            <span className="text-xs font-bold">{order?.user?.firstName || 'Customer'} {order?.user?.lastName || ''}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-soft-white/60">
                                            <ShoppingBag className="w-4 h-4 text-gold/60" />
                                            <span className="text-xs uppercase tracking-widest">{order?.orderType || 'Standard'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-soft-white/40 font-mono text-[10px]">
                                            <Clock className="w-3.5 h-3.5" />
                                            Ready Since: {new Date(order?.readyAt || order?.updatedAt).toLocaleTimeString()}
                                        </div>
                                    </div>

                                    <div className="py-4 border-t border-white/5">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Items Counter</div>
                                        <div className="space-y-2">
                                            {order?.orderItems?.slice(0, 2).map((item, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span className="text-soft-white/70">{item.name}</span>
                                                    <span className="text-gold font-bold">x{item.qty}</span>
                                                </div>
                                            ))}
                                            {order?.orderItems?.length > 2 && (
                                                <div className="text-[10px] text-soft-white/30 italic">+{order.orderItems.length - 2} Items...</div>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleMarkDelivered(order?._id)}
                                        className="w-full bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        Order Dispatched <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReadyQueue;
