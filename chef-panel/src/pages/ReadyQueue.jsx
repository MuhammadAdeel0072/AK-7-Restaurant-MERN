import { useState } from "react";
import toast from "react-hot-toast";
import { useOrderContext } from "../context/OrderContext";
import { dispatchOrder } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    ChefHat,
    AlertCircle
} from "lucide-react";
import OrderCard from "../components/OrderCard";

const ReadyQueue = () => {
    const { orders, loading, error } = useOrderContext();
    const [feedbacks, setFeedbacks] = useState({});

    // Ready Queue shows READY_FOR_DELIVERY, READY, COOKED, PACKED
    const validStatuses = ['READY_FOR_DELIVERY', 'READY', 'COOKED', 'PACKED'];
    const filteredOrders = orders.filter(o => validStatuses.includes(o.status?.toUpperCase()));

    const handleDispatch = async (id) => {
        const loadingToast = toast.loading("Dispatching order...");
        try {
            const feedback = feedbacks[id] || "";
            await dispatchOrder(id, feedback);

            toast.dismiss(loadingToast);
            toast.success("Dispatched Successfully! 🚚");

            // Clear feedback for this order
            setFeedbacks(prev => {
                const New = { ...prev };
                delete New[id];
                return New;
            });
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Failed to dispatch order. Please try again.");
            console.error(error);
        }
    };

    const updateFeedback = (id, val) => {
        setFeedbacks(prev => ({ ...prev, [id]: val }));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="glass p-10 rounded-[3rem] border border-crimson/20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-crimson mx-auto mb-2" />
            <p className="text-crimson font-bold uppercase tracking-widest text-xs">Operation Error</p>
            <p className="text-soft-white/60">{error}</p>
        </div>
    );

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black mb-1 tracking-tighter">
                        Ready <span className="text-gold ml-1">Queue</span>
                    </h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold italic">Awaiting Dispatch</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4 animate-pulse" />
                        Ready: {filteredOrders?.length || 0}
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
                            <ChefHat className="w-16 h-16 text-green-500/10 mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white/20 uppercase tracking-widest">No Ready Orders</h2>
                            <p className="text-soft-white/10 text-[10px] mt-2 font-bold italic tracking-widest">Station is clear</p>
                        </motion.div>
                    ) : (
                        filteredOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                actionText="Ready for Dispatch"
                                onMainAction={() => handleDispatch(order._id)}
                            >
                                <div className="space-y-2 mt-2">
                                    <p className="text-[8px] font-black text-gold/40 uppercase tracking-[0.2em]">Chef Feedback (Optional)</p>
                                    <textarea
                                        value={feedbacks[order._id] || ""}
                                        onChange={(e) => updateFeedback(order._id, e.target.value)}
                                        placeholder="Add notes for the staff..."
                                        className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-soft-white/80 placeholder:text-soft-white/20 focus:outline-none focus:border-gold/30 transition-all resize-none h-16"
                                    />
                                </div>
                            </OrderCard>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReadyQueue;
