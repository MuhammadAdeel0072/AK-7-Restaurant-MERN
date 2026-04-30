import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../services/orderService';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, ChevronRight, Package, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import OrderDetailModal from '../components/OrderDetailModal';
import NextDeliveryBanner from '../components/NextDeliveryBanner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { siteUpdate } = useSocket();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        const allOrders = data.orders || data || [];
        // Filter to show only active orders (not delivered)
        const activeOrders = allOrders.filter(order => order.status !== 'DELIVERED');
        setOrders(activeOrders);
      } catch (err) {
        console.error('Failed to load orders:', err);
        toast.error('Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [siteUpdate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'ARRIVED':          return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'PICKED_UP':        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'ACCEPTED':         return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'ASSIGNED':         return 'text-blue-300 bg-blue-300/10 border-blue-300/20';
      case 'READY_FOR_DELIVERY': return 'text-gold bg-gold/10 border-gold/20';
      case 'PREPARING':        return 'text-orange-300 bg-orange-300/10 border-orange-300/20';
      case 'RECEIVED':         return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case 'SCHEDULED':        return 'text-gray-400 bg-white/5 border-white/10';
      case 'PENDING':          return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'CANCELLED':        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:                 return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-white mb-2">My Orders</h1>
        <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Active Orders - Track Your Status</p>
      </div>

      <NextDeliveryBanner />

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
          <p className="text-xl text-white font-serif mb-6">No orders found</p>
          <Link to="/menu" className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all text-sm uppercase tracking-widest font-black">
            Menu
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
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover shadow-lg" />
                  </div>
                ))}
                {order.orderItems.length > 3 && (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 font-black shrink-0 shadow-lg">
                    +{order.orderItems.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/50">Order Number</span>
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
                    {order.orderItems.length} Items
                  </span>
                  <span className="font-bold text-white">
                    Total: <span className="text-gold ml-1">Rs. {order.totalPrice?.toFixed(0)}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all group/btn"
                >
                  <Info className="w-4 h-4" /> Details
                </button>
                <Link
                  to={`/track/${order._id}`}
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-charcoal px-6 py-3.5 rounded-2xl font-bold text-sm transition-all group/btn"
                >
                  Track Order <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal 
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Orders;

