import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Clock, CheckCircle, Truck, Package } from 'lucide-react';
import axios from 'axios';

const Orders = () => {
    const { userId, isLoaded } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (isLoaded && userId) {
                try {
                    // This endpoint would need to be implemented on the backend
                    // For now, we simulate or fetch if it exists
                    const response = await axios.get('/api/orders/myorders');
                    setOrders(response.data);
                } catch (err) {
                    console.error('Failed to fetch orders:', err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchOrders();
    }, [userId, isLoaded]);

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold mb-10 text-gold text-center">Your Order History</h1>
            
            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">No orders found yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-gold/50 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1 font-mono uppercase tracking-tighter">Order #{order._id}</p>
                                    <p className="text-lg font-bold">Total: ${order.totalPrice.toFixed(2)}</p>
                                </div>
                                <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${order.isPaid ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                    {order.isPaid ? 'Paid' : 'Pending'}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Clock size={16} /> {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    {order.isDelivered ? (
                                        <><CheckCircle size={16} className="text-green-500" /> Delivered</>
                                    ) : (
                                        <><Truck size={16} className="text-orange-500" /> Out for Delivery</>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
