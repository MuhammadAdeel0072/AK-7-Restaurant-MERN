import React, { useEffect, useState } from 'react';
import { getMyOrders } from '../services/orderService';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, ChevronRight, Package, Calendar, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import OrderDetailModal from '../components/OrderDetailModal';
import useReorder from '../hooks/useReorder';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { siteUpdate } = useSocket();
  const { handleReorder, reordering } = useReorder();

  const groupOrdersByTime = (orders) => {
    const now = new Date();
    const groups = {
      'This Week': [],
      '1 Week Ago': [],
      '2 Weeks Ago': [],
      '3 Weeks Ago': [],
    };

    orders.forEach(order => {
      const createdAt = new Date(order.createdAt);
      const diffTime = Math.abs(now - createdAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        groups['This Week'].push(order);
      } else if (diffDays <= 14) {
        groups['1 Week Ago'].push(order);
      } else if (diffDays <= 21) {
        groups['2 Weeks Ago'].push(order);
      } else if (diffDays <= 28) {
        groups['3 Weeks Ago'].push(order);
      } else {
        const monthYear = createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(order);
      }
    });

    // Remove empty standard groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0 && ['This Week', '1 Week Ago', '2 Weeks Ago', '3 Weeks Ago'].includes(key)) {
        delete groups[key];
      }
    });

    return groups;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders();
        const allOrders = data.orders || data || [];
        // Filter to show only delivered orders
        const deliveredOrders = allOrders.filter(order => order.status === 'DELIVERED');

        // Sort orders by date descending
        deliveredOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOrders(deliveredOrders);
        setGroupedOrders(groupOrdersByTime(deliveredOrders));
      } catch (err) {
        console.error('Failed to load order history:', err);
        toast.error('Failed to load order history');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [siteUpdate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'ARRIVED': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'PICKED_UP': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'ACCEPTED': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'ASSIGNED': return 'text-blue-300 bg-blue-300/10 border-blue-300/20';
      case 'READY_FOR_DELIVERY': return 'text-gold bg-gold/10 border-gold/20';
      case 'PREPARING': return 'text-orange-300 bg-orange-300/10 border-orange-300/20';
      case 'PENDING': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-white mb-2">Order History</h1>
        <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Your Completed Orders</p>
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
          <p className="text-xl text-white font-serif mb-6">No completed orders yet</p>
          <Link to="/menu" className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all text-sm uppercase tracking-widest font-black">
            Order Now
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedOrders).map(([group, groupOrders]) => (
            <div key={group} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold/40 flex items-center gap-2">
                  <Calendar size={14} className="opacity-50" /> {group}
                </h3>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {groupOrders.map((order) => (
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

                    {/* Action Buttons */}
                    <div className="flex flex-shrink-0 gap-3">
                      {/* Reorder Button */}
                      <button
                        onClick={() => handleReorder(order._id)}
                        disabled={reordering}
                        className="flex items-center gap-2 bg-gold/10 hover:bg-gold hover:text-charcoal border border-gold/20 hover:border-gold text-gold px-5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        {reordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Reorder
                      </button>

                      {/* View Details */}
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-gold hover:text-charcoal border border-white/10 hover:border-gold px-6 py-3.5 rounded-2xl font-bold text-sm transition-all group/btn"
                      >
                        Details <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
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

export default OrderHistory;
