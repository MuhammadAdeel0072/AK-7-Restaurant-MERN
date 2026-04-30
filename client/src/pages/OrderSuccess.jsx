import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, MapPin, Clock, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOrderById } from '../services/orderService';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
    const location = useLocation();
    const orderId = new URLSearchParams(location.search).get('id');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (orderId) {
                    const data = await getOrderById(orderId);
                    setOrder(data);
                }
            } catch (error) {
                toast.error('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    // Calculate ETA (35-45 mins from order time)
    const getETA = () => {
        if (!order) return '35-45 mins';
        const orderTime = new Date(order.createdAt);
        const minETA = new Date(orderTime.getTime() + 35 * 60000);
        const maxETA = new Date(orderTime.getTime() + 45 * 60000);
        return `${minETA.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${maxETA.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-charcoal">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-20 min-h-screen flex flex-col items-center">
            <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="mb-12"
            >
                <div className="bg-gold/10 p-12 rounded-full shadow-[0_0_100px_rgba(212,175,55,0.2)] border border-gold/20 relative">
                    <CheckCircle className="w-24 h-24 text-gold" />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-gold/5 rounded-full"
                    />
                </div>
            </motion.div>
            
            <div className="text-center max-w-3xl border-b border-white/5 pb-16 mb-16">
                <h1 className="text-5xl font-serif font-black mb-6 text-white uppercase tracking-tighter">Order Placed Successfully 🎉</h1>
                <p className="text-xl text-gray-400 font-medium leading-relaxed">
                    Your order has been sent to our kitchen. We'll start preparing it right away!
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
                <div className="card-premium p-8 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <Clock className="w-6 h-6 text-gold" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold/40 mb-2">Estimated Arrival</p>
                    <h3 className="text-xl font-serif font-bold text-white">{getETA()}</h3>
                </div>

                <div className="card-premium p-8 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <CreditCard className="w-6 h-6 text-gold" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold/40 mb-2">Total Amount</p>
                    <h3 className="text-xl font-serif font-bold text-white">Rs. {order?.totalPrice?.toFixed(0)}</h3>
                </div>

                <div className="card-premium p-8 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <MapPin className="w-6 h-6 text-gold" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold/40 mb-2">Order ID</p>
                    <h3 className="text-xl font-serif font-bold text-white">#{order?.orderNumber}</h3>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center w-full">
                <Link 
                    to={`/track/${orderId}`} 
                    className="group relative bg-gold text-charcoal px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gold/20 flex items-center gap-3"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10">Track Order</span>
                    <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2" />
                </Link>
                
                <Link 
                    to="/" 
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-black uppercase tracking-[0.3em] text-[10px] group"
                >
                    <Home className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
                    Go to Home
                </Link>
            </div>
        </div>
    );
};

export default OrderSuccess;
