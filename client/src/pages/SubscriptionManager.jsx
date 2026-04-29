import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const SubscriptionManager = () => {
    const { token } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [products, setProducts] = useState([]);

    // New Subscription State
    const [newSub, setNewSub] = useState({
        day: 'Monday',
        time: '12:00',
        items: []
    });

    useEffect(() => {
        fetchSubscriptions();
        fetchProducts();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSubscriptions(data);
            }
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleCreateSubscription = async () => {
        if (newSub.items.length === 0) {
            toast.error('Please select at least one item');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    schedule: [{
                        day: newSub.day,
                        time: newSub.time,
                        items: newSub.items.map(i => ({
                            product: i._id,
                            qty: i.qty || 1
                        }))
                    }]
                })
            });

            if (response.ok) {
                toast.success('Subscription active! We will handle the rest.');
                setShowAdd(false);
                fetchSubscriptions();
            } else {
                const err = await response.json();
                toast.error(err.message || 'Failed to create subscription');
            }
        } catch (error) {
            toast.error('Connection error');
        }
    };

    const toggleSubscription = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success('Status updated');
                fetchSubscriptions();
            }
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="container mx-auto px-6 py-12 max-w-5xl">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <Link to="/settings" className="flex items-center gap-2 text-gold/40 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Profile
                    </Link>
                    <h1 className="text-5xl font-serif font-black text-white italic">Recurring <span className="text-gold">Orders</span></h1>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="bg-gold text-charcoal px-8 py-4 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-gold/20"
                >
                    <Plus className="w-4 h-4" /> NEW SCHEDULE
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[3rem]" />)}
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="card-premium p-24 text-center border-dashed border-white/10">
                    <Calendar className="w-16 h-16 text-gold/20 mx-auto mb-6" />
                    <h2 className="text-2xl font-serif text-white mb-2">No active subscriptions</h2>
                    <p className="text-gray-500 mb-8">Automate your favorite meals on your preferred days.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {subscriptions.map(sub => (
                        <div key={sub._id} className={`card-premium p-8 border ${sub.isActive ? 'border-gold/30' : 'border-white/5 opacity-60'} transition-all group`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${sub.isActive ? 'bg-gold/10 text-gold' : 'bg-white/5 text-gray-500'}`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">{sub.schedule[0].day}</p>
                                        <p className="text-xl font-serif font-black text-white italic">at {sub.schedule[0].time}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSubscription(sub._id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        sub.isActive ? 'bg-gold text-charcoal' : 'bg-white/10 text-white'
                                    }`}
                                >
                                    {sub.isActive ? 'ACTIVE' : 'PAUSED'}
                                </button>
                            </div>

                            <div className="space-y-3 mb-8">
                                {sub.schedule[0].items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">{item.qty}x {item.product?.name || 'Item'}</span>
                                        <span className="text-white font-bold">Rs. {(item.product?.price || 0) * item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <Clock className="w-3 h-3" /> Last order: {sub.lastOrderedAt ? new Date(sub.lastOrderedAt).toLocaleDateString() : 'Never'}
                                </div>
                                <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-500 cursor-pointer transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Subscription Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-charcoal border border-white/10 rounded-[3rem] p-12 max-w-2xl w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                    >
                        <h2 className="text-3xl font-serif font-black text-white mb-8 italic">New <span className="text-gold">Schedule</span></h2>
                        
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">Select Day</label>
                                <select
                                    value={newSub.day}
                                    onChange={(e) => setNewSub({...newSub, day: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-gold"
                                >
                                    {days.map(d => <option key={d} value={d} className="bg-charcoal">{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">Select Time</label>
                                <input
                                    type="time"
                                    value={newSub.time}
                                    onChange={(e) => setNewSub({...newSub, time: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-gold"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 mb-10">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">Select Product</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {products.map(p => (
                                    <div
                                        key={p._id}
                                        onClick={() => {
                                            const exists = newSub.items.find(i => i._id === p._id);
                                            const newItems = exists
                                                ? newSub.items.filter(i => i._id !== p._id)
                                                : [...newSub.items, p];
                                            setNewSub({...newSub, items: newItems});
                                        }}
                                        className={`shrink-0 w-24 p-2 rounded-2xl border transition-all cursor-pointer ${
                                            newSub.items.find(i => i._id === p._id) ? 'border-gold bg-gold/10' : 'border-white/5 bg-white/5'
                                        }`}
                                    >
                                        <img src={p.image} className="w-full h-16 object-cover rounded-xl mb-2" />
                                        <p className="text-[8px] font-bold text-white truncate text-center">{p.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="flex-1 py-4 border border-white/10 rounded-2xl text-white font-black text-xs tracking-widest"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleCreateSubscription}
                                className="flex-1 py-4 bg-gold text-charcoal rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-gold/20"
                            >
                                ACTIVATE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManager;
