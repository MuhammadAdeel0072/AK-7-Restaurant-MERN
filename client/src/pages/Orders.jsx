import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../services/orderService';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, ChevronRight, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        toast.error('Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'out-for-delivery': return 'text-gold bg-gold/10 border-gold/20';
      case 'ready': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'preparing': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">My Orders</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">View your previous orders</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gold/40" />
          </div>
          <p className="text-xl text-white font-serif mb-6">You haven't placed an order yet.</p>
          <Link to="/menu" className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all">
            Browse the Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-300 group">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/50 block mb-1">Order Number</span>
                    <h3 className="text-xl font-bold text-white">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</h3>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{order.orderItems.length} Items</span>
                  </div>
                  <div className="font-bold text-white">
                    Total: <span className="text-gold">Rs. {order.totalPrice.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <Link 
                  to={`/track/${order._id}`}
                  className="flex-1 md:flex-none bg-white/5 hover:bg-gold hover:text-charcoal border border-white/10 hover:border-gold px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
                >
                  View Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
