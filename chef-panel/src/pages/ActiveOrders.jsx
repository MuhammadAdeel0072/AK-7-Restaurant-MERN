import { useState, useEffect } from "react";
import { getActiveOrders, updateOrderStatus } from "../services/api";
import socket from "../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  CheckCircle, 
  MessageSquare, 
  Utensils,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const ActiveOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await getActiveOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch active orders", error);
            setError("Failed to fetch active orders from the kitchen server.");
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

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateOrderStatus(id, status);
            toast.success(`Order set to ${status}`, {
                style: { background: '#121212', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }
            });
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="glass p-10 rounded-[3rem] border border-crimson/20 text-center space-y-4">
            <p className="text-crimson font-bold uppercase tracking-widest text-xs">Operation Error</p>
            <p className="text-soft-white/60">{error}</p>
            <button onClick={fetchOrders} className="btn-gold scale-90">RETRY CONNECTION</button>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black mb-1 tracking-tighter">Kitchen <span className="text-gold">Command</span></h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold">Active Station Workflow</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-xl border border-gold/20 text-[10px] font-bold uppercase tracking-widest">
                        Total Orders: {orders?.length || 0}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                    {!orders || orders.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center glass rounded-[3rem] border border-white/5"
                        >
                            <ChefHat className="w-16 h-16 text-gold/20 mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white/50">Kitchen Station Clear</h2>
                            <p className="text-soft-white/20 uppercase tracking-widest text-[10px] mt-2 font-bold">Awaiting New Culinary Requests</p>
                        </motion.div>
                    ) : (
                        orders.map((order) => (
                            <motion.div
                                layout
                                key={order?._id || Math.random()}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`glass rounded-[2rem] border overflow-hidden flex flex-col group transition-all duration-500  ${
                                    order?.status === 'preparing' ? 'border-orange-500/20' : 
                                    order?.status === 'ready' ? 'border-green-500/20' : 'border-white/5'
                                }`}
                            >
                                <div className="p-8 space-y-6">
                                    {/* Card Header: Order ID & Status */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-gold/50 uppercase tracking-[0.2em]">Order</span>
                                                <h3 className="text-2xl font-bold text-white tracking-tighter">
                                                    #{order?.orderNumber || (order?._id ? order._id.slice(-6).toUpperCase() : 'N/A')}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-soft-white/40 uppercase font-black tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {order?.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                                                <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                                <span className="text-gold/60">{order?.paymentMethod === 'cod' ? 'CASH SETTLEMENT' : 'PRE-PAID'}</span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                            order?.status === 'ready' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            order?.status === 'preparing' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                            'bg-gold/10 text-gold border-gold/20'
                                        }`}>
                                            {order?.status || 'Unknown'}
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-4 py-6 border-y border-white/5">
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-soft-white/20">
                                            <span>CULINARY REQUESTS</span>
                                            <span>QUANTITY</span>
                                        </div>
                                        {order?.orderItems?.map((item, i) => (
                                            <div key={i} className="flex items-start justify-between group/item">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 shrink-0 grayscale group-hover/item:grayscale-0 transition-all duration-500">
                                                        <img src={item?.image || '/placeholder.png'} alt={item?.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-soft-white text-lg group-hover/item:text-gold transition-colors">{item?.name || 'Unknown Item'}</p>
                                                        {item?.customizations?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {item.customizations.map((c, ci) => (
                                                                    <span key={ci} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] text-white/50 border border-white/5">{typeof c === 'string' ? c : c?.selection || 'N/A'}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-gold font-bold text-lg border border-white/5">x{item?.qty || 0}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-4 pt-4">
                                        {order?.status === 'confirmed' || order?.status === 'placed' ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(order?._id, 'preparing')}
                                                className="flex-1 bg-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                                            >
                                                <ChefHat className="w-5 h-5" /> START PREPARING
                                            </button>
                                        ) : order?.status === 'preparing' ? (
                                            <button 
                                                onClick={() => handleStatusUpdate(order?._id, 'ready')}
                                                className="flex-1 bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] text-sm tracking-widest"
                                            >
                                                <CheckCircle className="w-5 h-5" /> MARK AS READY
                                            </button>
                                        ) : (
                                            <div className="flex-1 py-4 text-center text-green-500/50 font-black text-xs uppercase tracking-[0.3em] bg-green-500/5 rounded-2xl border border-green-500/10">
                                                Awaiting Service Dispatch
                                            </div>
                                        )}
                                        <button className="w-14 h-14 bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/10 text-gold flex items-center justify-center rounded-2xl transition-all group/info">
                                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActiveOrders;
