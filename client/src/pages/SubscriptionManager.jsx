import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Wallet, Minus, ShoppingCart, Loader2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

import apiClient from '../services/apiClient';

const SubscriptionManager = () => {
    const { user, refreshProfile } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Subscription State
    const [newSub, setNewSub] = useState({
        day: 'Monday',
        time: '20:00',
        items: [],
        duration: 'Weekly'
    });

    useEffect(() => {
        fetchSubscriptions();
        fetchProducts();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const { data } = await apiClient.get('/subscriptions');
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await apiClient.get('/products');
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleCreateSubscription = async () => {
        if (newSub.items.length === 0) {
            toast.error('Please select at least one item');
            return;
        }

        // Conflict check
        const conflict = subscriptions.find(s => 
            s.isActive && 
            s.schedule.some(sc => sc.day === newSub.day && sc.time === newSub.time)
        );

        if (conflict) {
            toast.error(`You already have a subscription on ${newSub.day} at ${newSub.time}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const endDate = new Date();
            if (newSub.duration === 'Weekly') {
                endDate.setDate(endDate.getDate() + 7);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            await apiClient.post('/subscriptions', {
                schedule: [{
                    day: newSub.day,
                    time: newSub.time,
                    items: newSub.items.map(i => ({
                        product: i._id,
                        qty: i.qty || 1,
                        selectedSize: i.selectedSize
                    }))
                }],
                endDate: endDate.toISOString()
            });

            toast.success('Meal plan activated! 🎉');
            setShowAdd(false);
            setNewSub({ day: 'Monday', time: '20:00', items: [], duration: 'Weekly' });
            fetchSubscriptions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create plan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSubscription = async (id) => {
        try {
            await apiClient.put(`/subscriptions/${id}/toggle`);
            toast.success('Status updated');
            fetchSubscriptions();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const deleteSubscription = async (id) => {
        if (!window.confirm('Cancel this meal plan?')) return;
        try {
            await apiClient.delete(`/subscriptions/${id}`);
            toast.success('Plan cancelled');
            fetchSubscriptions();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const topUpWallet = async () => {
        const amount = prompt('Enter top-up amount:');
        if (!amount || isNaN(amount) || amount <= 0) return;

        try {
            await apiClient.post('/subscriptions/wallet/topup', { amount });
            toast.success('Wallet topped up! 💰');
            refreshProfile();
        } catch (error) {
            toast.error('Top-up failed');
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const subtotal = newSub.items.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);

    return (
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <Link to="/settings" className="flex items-center gap-2 text-gold/40 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Profile
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-serif font-black text-white italic leading-tight">Weekly <span className="text-gold">Meal Plans</span></h1>
                    <p className="text-gray-500 font-medium italic mt-2">Automate your gourmet experience</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-xl">
                        <div className="p-2 bg-gold/10 rounded-xl text-gold">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Wallet Balance</p>
                            <p className="text-xl font-bold text-white">Rs. {user?.walletBalance || 0}</p>
                        </div>
                        <button onClick={topUpWallet} className="ml-4 p-2 bg-gold/20 hover:bg-gold text-gold hover:text-charcoal rounded-xl transition-all">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="bg-gold text-charcoal px-8 py-4 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-gold/20"
                    >
                        <Plus className="w-4 h-4" /> NEW PLAN
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[3rem]" />)}
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="card-premium p-24 text-center border-dashed border-white/10 bg-white/[0.01]">
                    <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/20">
                        <Calendar className="w-10 h-10 text-gold/40" />
                    </div>
                    <h2 className="text-3xl font-serif text-white font-black mb-4 italic">No active meal plans</h2>
                    <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed font-medium italic">"The only thing you should worry about is the appetite. Let us handle the schedule."</p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="bg-gold/10 border border-gold/30 text-gold px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-gold hover:text-charcoal transition-all shadow-xl"
                    >
                        Create Your First Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {subscriptions.map(sub => (
                        <div key={sub._id} className={`card-premium p-8 border ${sub.isActive ? 'border-gold/30 bg-gold/[0.02]' : 'border-white/5 opacity-60'} transition-all group relative`}>
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-[1.5rem] ${sub.isActive ? 'bg-gold/10 text-gold shadow-lg shadow-gold/10' : 'bg-white/5 text-gray-500'}`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">{sub.schedule[0].day}</p>
                                        <p className="text-2xl font-serif font-black text-white italic tracking-tight">at {sub.schedule[0].time}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSubscription(sub._id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md ${
                                        sub.isActive ? 'bg-gold text-charcoal' : 'bg-white/10 text-white'
                                    }`}
                                >
                                    {sub.isActive ? 'ACTIVE' : 'PAUSED'}
                                </button>
                            </div>

                            <div className="space-y-4 mb-8 max-h-48 overflow-y-auto no-scrollbar pr-2">
                                {sub.schedule[0].items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                <img src={item.product?.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-xs">{item.qty}x {item.product?.name || 'Item'}</p>
                                                {item.selectedSize && <p className="text-[9px] text-gold/50 font-black uppercase tracking-widest">{item.selectedSize.name}</p>}
                                            </div>
                                        </div>
                                        <span className="text-gold font-black text-sm tracking-tighter">Rs. {(item.product?.price || 0) * item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                                    <Clock className="w-3 h-3" /> Next delivery: {sub.schedule[0].day} {sub.schedule[0].time}
                                </div>
                                <div className="flex items-center gap-4">
                                    <Trash2 
                                        onClick={() => deleteSubscription(sub._id)}
                                        className="w-4 h-4 text-gray-600 hover:text-red-500 cursor-pointer transition-colors" 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Subscription Modal */}
            <AnimatePresence>
            {showAdd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-charcoal border border-white/10 rounded-[4rem] p-12 max-w-4xl w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row gap-12 relative"
                    >
                        <button 
                            onClick={() => setShowAdd(false)}
                            className="absolute top-8 right-8 p-3 text-gray-500 hover:text-white rounded-2xl hover:bg-white/5 transition-all"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>

                        <div className="md:w-1/2 space-y-10">
                            <h2 className="text-4xl font-serif font-black text-white italic">Create <span className="text-gold">Plan</span></h2>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">1. Select Delivery Day</label>
                                    <div className="flex flex-wrap gap-2">
                                        {days.map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setNewSub({...newSub, day: d})}
                                                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    newSub.day === d ? 'bg-gold text-charcoal border-gold shadow-lg shadow-gold/20' : 'bg-white/5 border-white/5 text-gray-500 hover:border-gold/30'
                                                }`}
                                            >
                                                {d.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">2. Select Preferred Time</label>
                                    <input
                                        type="time"
                                        value={newSub.time}
                                        onChange={(e) => setNewSub({...newSub, time: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-gold font-black tracking-widest shadow-inner text-xl"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">3. Duration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Weekly', 'Monthly'].map(dur => (
                                            <button
                                                key={dur}
                                                onClick={() => setNewSub({...newSub, duration: dur})}
                                                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                                                    newSub.duration === dur ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/5 text-gray-500'
                                                }`}
                                            >
                                                {dur}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-1/2 flex flex-col">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-6">4. Select Items</label>
                            
                            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 overflow-hidden flex flex-col shadow-inner">
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-6 pr-2">
                                    {products.map(p => {
                                        const selected = newSub.items.find(i => i._id === p._id);
                                        return (
                                            <div
                                                key={p._id}
                                                onClick={() => {
                                                    const exists = newSub.items.find(i => i._id === p._id);
                                                    const newItems = exists
                                                        ? newSub.items.filter(i => i._id !== p._id)
                                                        : [...newSub.items, { ...p, qty: 1 }];
                                                    setNewSub({...newSub, items: newItems});
                                                }}
                                                className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                                                    selected ? 'border-gold bg-gold/10' : 'border-white/5 bg-white/5 hover:border-gold/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img src={p.image} className="w-12 h-12 object-cover rounded-xl shadow-lg" />
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{p.name}</p>
                                                        <p className="text-[10px] text-gold/60 font-black">Rs. {p.price}</p>
                                                    </div>
                                                </div>
                                                {selected && (
                                                    <div className="flex items-center gap-3 bg-charcoal/40 p-1.5 rounded-xl border border-white/5" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => {
                                                            const newItems = newSub.items.map(i => i._id === p._id ? {...i, qty: Math.max(1, i.qty - 1)} : i);
                                                            setNewSub({...newSub, items: newItems});
                                                        }} className="w-6 h-6 flex items-center justify-center text-white hover:text-gold transition-colors"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-xs font-black text-white w-4 text-center">{selected.qty}</span>
                                                        <button onClick={() => {
                                                            const newItems = newSub.items.map(i => i._id === p._id ? {...i, qty: i.qty + 1} : i);
                                                            setNewSub({...newSub, items: newItems});
                                                        }} className="w-6 h-6 flex items-center justify-center text-white hover:text-gold transition-colors"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Projected Total</p>
                                            <p className="text-3xl font-black text-white font-serif">Rs. {subtotal}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Wallet Left</p>
                                            <p className={`text-xl font-bold ${(user?.walletBalance || 0) < subtotal ? 'text-red-500' : 'text-green-500'}`}>Rs. {(user?.walletBalance || 0) - subtotal}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateSubscription}
                                        disabled={isSubmitting || newSub.items.length === 0}
                                        className="w-full bg-gold text-charcoal py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-gold/20 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                        ACTIVATE PLAN
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default SubscriptionManager;
