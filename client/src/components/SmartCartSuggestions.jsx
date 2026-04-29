import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, TrendingUp, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SmartCartSuggestions = () => {
    const { state, dispatch } = useCart();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [idleTime, setIdleTime] = useState(0);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (state.cartItems.length === 0) {
                setRecommendations([]);
                return;
            }

            try {
                setLoading(true);
                const itemIds = state.cartItems.map(item => item.product).join(',');
                const response = await fetch(`${API_BASE_URL}/recommendations?cartItems=${itemIds}`);
                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data);
                }
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [state.cartItems.length]);

    // Idle detection for anti-abandonment popup
    useEffect(() => {
        const interval = setInterval(() => {
            setIdleTime(prev => prev + 1);
        }, 1000);

        const resetIdle = () => setIdleTime(0);
        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keydown', resetIdle);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keydown', resetIdle);
        };
    }, []);

    useEffect(() => {
        if (idleTime >= 15 && state.cartItems.length > 0 && !showPopup) {
            setShowPopup(true);
        }
    }, [idleTime, state.cartItems.length]);

    const addToCart = (product) => {
        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                ...product,
                product: product._id,
                qty: 1,
                customizations: []
            }
        });
        toast.success(`Great choice! ${product.name} added.`, { icon: '✨' });
        setShowPopup(false);
    };

    if (recommendations.length === 0) return null;

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-gold animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Complete Your Meal</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {recommendations.map((item, idx) => (
                    <motion.div
                        key={item._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="min-w-[200px] bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex flex-col gap-3 group hover:border-gold/30 transition-all"
                    >
                        <div className="h-28 rounded-2xl overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                            <p className="text-gold font-black text-sm mt-1">Rs. {item.price}</p>
                        </div>
                        <button
                            onClick={() => addToCart(item)}
                            className="w-full py-2 bg-white/5 hover:bg-gold text-white hover:text-charcoal rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-3 h-3" /> Add Now
                        </button>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showPopup && recommendations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-8 right-8 z-[1000] max-w-xs bg-charcoal/90 backdrop-blur-2xl border border-gold/40 rounded-[2.5rem] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20">
                                <TrendingUp className="w-6 h-6 text-gold" />
                            </div>
                            <button onClick={() => setShowPopup(false)} className="text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <h4 className="text-xl font-serif font-black text-white mb-2 leading-tight">Don't miss out!</h4>
                        <p className="text-gray-400 text-sm mb-6 font-medium">Your cart is waiting. Why not add our best-selling <span className="text-gold font-bold">{recommendations[0].name}</span> for just Rs. {recommendations[0].price}?</p>
                        <button
                            onClick={() => addToCart(recommendations[0])}
                            className="w-full bg-gold text-charcoal font-black py-4 rounded-2xl text-xs tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            YES, ADD IT!
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartCartSuggestions;
