import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../services/orderService';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, ChevronRight, Package } from 'lucide-react';
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
      } catch {
        toast.error('Could not load order history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'out-for-delivery': return 'text-gold bg-gold/10 border-gold/20';
      case 'ready':            return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'preparing':        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'cancelled':        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:                 return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-white mb-2">My Orders</h1>
        <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Your full order history</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gold/40" />
          </div>
          <p className="text-xl text-white font-serif mb-6">You haven't placed an order yet.</p>
          <Link to="/menu" className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all text-sm">
            Browse the Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-gold/20 rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-300 group">
              {/* Item thumbnails */}
              <div className="flex gap-2 shrink-0">
                {order.orderItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {order.orderItems.length > 3 && (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 font-black shrink-0">
                    +{order.orderItems.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/50">Order</span>
                  <h3 className="text-lg font-bold text-white">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</h3>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                    {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-white">
                    Total: <span className="text-gold">Rs. {order.totalPrice?.toFixed(0)}</span>
                  </span>
                </div>
              </div>

              {/* View Details */}
              <Link
                to={`/track/${order._id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-white/5 hover:bg-gold hover:text-charcoal border border-white/10 hover:border-gold px-6 py-3.5 rounded-2xl font-bold text-sm transition-all group/btn"
              >
                View Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
