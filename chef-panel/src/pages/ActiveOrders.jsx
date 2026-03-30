import { useState, useEffect } from "react";
import { getActiveOrders } from "../services/api";
import socket from "../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, 
  Activity,
  AlertCircle
} from "lucide-react";
import OrderCard from "../components/OrderCard";

const ActiveOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchOrders = async () => {
        try {
            setError(null);
            const data = await getActiveOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch active orders", error);
            setError("Failed to fetch active orders");
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

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'urgent') return o.priority === 'urgent' || o.priority === 'vip';
        if (filter === 'preparing') return o.status === 'preparing';
        return true;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="glass p-10 rounded-[3rem] border border-crimson/20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-crimson mx-auto mb-2" />
            <p className="text-crimson font-bold uppercase tracking-widest text-xs">Operation Error</p>
            <p className="text-soft-white/60">{error}</p>
            <button onClick={fetchOrders} className="btn-gold scale-90">RETRY SYSTEM SYNC</button>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black mb-1 tracking-tighter italic">
                        Live <span className="text-gold ml-1">Orders Queue</span>
                    </h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold italic">Real-time Kitchen Workflow Synchronization</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'all', label: 'All Orders' },
                            { id: 'preparing', label: 'Cooking' },
                            { id: 'urgent', label: 'Urgent' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                    filter === f.id ? 'bg-gold text-charcoal shadow-lg' : 'text-soft-white/30 hover:text-soft-white'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold rounded-xl border border-gold/20 text-[10px] font-bold uppercase tracking-widest">
                        <Activity className="w-4 h-4 animate-pulse" />
                        Queue: {orders?.length || 0}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOrders.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center glass rounded-[3rem] border border-white/5"
                        >
                            <ChefHat className="w-16 h-16 text-gold/10 mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white/20 uppercase tracking-widest">No Active Orders</h2>
                            <p className="text-soft-white/10 text-[10px] mt-2 font-bold italic tracking-widest">Awaiting incoming data streams...</p>
                        </motion.div>
                    ) : (
                        filteredOrders.map((order) => (
                            <OrderCard 
                                key={order._id} 
                                order={order} 
                                onUpdate={fetchOrders} 
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActiveOrders;
