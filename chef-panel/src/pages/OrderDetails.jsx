import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  CheckCircle,
  Flame,
  ChefHat
} from "lucide-react";

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                setError(null);
                const { data } = await api.get(`/chef/orders/${id}`);
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch order", error);
                setError("Failed to retrieve order details from the server.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="glass p-10 rounded-[3rem] border border-crimson/20 text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-crimson font-bold uppercase tracking-widest text-xs">Data Error</p>
            <p className="text-soft-white/60">{error}</p>
            <Link to="/orders" className="btn-gold scale-90 inline-block">BACK TO ORDERS</Link>
        </div>
    );

    if (!order) return (
        <div className="text-center py-20 glass rounded-[3rem] border border-white/5 max-w-2xl mx-auto">
            <h2 className="text-2xl text-white/50 font-serif">Order Not Found</h2>
            <p className="text-soft-white/20 text-xs uppercase tracking-widest mt-2">The requested order ID does not exist in the active records.</p>
            <Link to="/orders" className="text-gold underline mt-6 inline-block italic font-bold">Back to Kitchen Command</Link>
        </div>
    );

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20">
            <header className="flex items-center gap-6">
                <Link to="/orders" className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gold hover:bg-gold/10 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tighter">Order <span className="text-gold">Breakdown</span></h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold">In-depth Culinary Specification</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Side: Items and Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass rounded-[3rem] border border-white/5 p-10">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gold/40 tracking-widest uppercase">STATION SLIP</span>
                                <h2 className="text-3xl font-bold text-white tracking-tighter">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</h2>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                order.status === 'ready' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                order.status === 'preparing' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                'bg-gold/10 text-gold border-gold/20'
                            }`}>
                                {order.status}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {order.orderItems.map((item, i) => (
                                <div key={i} className="flex gap-6 items-start py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-all px-4 rounded-3xl group">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-2xl">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{item.name}</h3>
                                            <span className="text-gold font-sans font-black text-lg">x {item.qty}</span>
                                        </div>
                                        {item.customizations?.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 transition-all">
                                                {item.customizations.map((c, ci) => (
                                                    <div key={ci} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group/cust">
                                                        <span className="text-[10px] font-bold text-soft-white/30 uppercase tracking-tighter">{typeof c === 'string' ? "Preference" : c.name}</span>
                                                        <span className="text-xs font-bold text-gold/80">{typeof c === 'string' ? c : c.selection}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Operational Metadata */}
                <div className="space-y-8 h-fit lg:sticky lg:top-28">
                    <div className="glass rounded-[2.5rem] border border-white/5 p-8 space-y-8 bg-gold/[0.02]">
                        <h3 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4">Operational Summary</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gold/40 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-soft-white/30 uppercase tracking-tighter">Patron</p>
                                    <p className="font-bold text-white">{order.user?.firstName} {order.user?.lastName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gold/40 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-soft-white/30 uppercase tracking-tighter">Time Received</p>
                                    <p className="font-bold text-white">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gold/40 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-soft-white/30 uppercase tracking-tighter">Settlement</p>
                                    <p className="font-bold text-gold uppercase tracking-tighter">{order.paymentMethod}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-crimson/10 flex items-center justify-center border border-crimson/20">
                           <ChefHat className="text-crimson w-8 h-8" />
                        </div>
                        <p className="text-soft-white font-bold italic">"Maintain perfection in every artisan request."</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
