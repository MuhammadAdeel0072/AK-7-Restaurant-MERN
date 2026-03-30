import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { ShoppingBag, Clock, CheckCircle, Truck, PackageCheck, Search, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    
    // Listen for real-time order updates
    socket.on('orderUpdate', fetchOrders);
    socket.on('incomingOrder', (order) => {
      setOrders(prev => [order, ...prev]);
    });
    
    return () => {
      socket.off('orderUpdate');
      socket.off('incomingOrder');
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const stats = {
    pending: orders.filter(o => o.status === 'placed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    dispatched: orders.filter(o => o.status === 'out-for-delivery').length,
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 md:space-y-10"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <header>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">Order <span className="text-gold">Logistics</span></h1>
          <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">AK-7 REST LIVE OPERATION TRACKER</p>
        </header>
        
        <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['all', 'placed', 'preparing', 'out-for-delivery', 'delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 md:px-5 py-2 rounded-xl text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex-1 lg:flex-none ${
                filter === s ? 'bg-gold text-charcoal shadow-lg' : 'text-soft-white/40 hover:text-soft-white'
              }`}
            >
              {s.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Awaiting Prep', value: stats.pending, icon: Clock, color: 'text-gold' },
          { label: 'In Kitchen', value: stats.preparing, icon: PackageCheck, color: 'text-orange-400' },
          { label: 'On Route', value: stats.dispatched, icon: Truck, color: 'text-blue-400' },
        ].map((item, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl border border-white/5 flex items-center gap-5">
            <div className={`p-4 rounded-xl bg-white/5 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-soft-white/30 text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
              <h3 className="text-2xl font-bold text-soft-white">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-soft-white/40 text-[8px] sm:text-[10px] uppercase tracking-[0.2em]">
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold">Patron & Order ID</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold">Investment</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold">Current State</th>
                <th className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-right">Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-soft-white/30 italic">No orders currently in this state.</td></tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredOrders.map((order) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={order._id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 sm:px-8 py-6 sm:py-8">
                        <div>
                          <p className="font-bold text-soft-white text-base sm:text-lg">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-soft-white/40 text-[10px] sm:text-sm mt-1">{order.user?.firstName} {order.user?.lastName || 'Guest Patron'}</p>
                          <p className="text-[8px] sm:text-[10px] text-gold/50 mt-2 uppercase tracking-tighter">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 font-serif font-bold text-soft-white text-base sm:text-lg">
                        Rs. {order.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8">
                        <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          order.status === 'out-for-delivery' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          order.status === 'preparing' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-gold/10 text-gold border-gold/20'
                        }`}>
                          {order.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 text-right">
                        <div className="flex justify-end gap-2">
                          <select 
                            className="bg-charcoal border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-soft-white focus:outline-none focus:border-gold/50 transition-all cursor-pointer hover:bg-white/5"
                            value={order.status}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                          >
                            <option value="placed">Placed</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="out-for-delivery">Dispatch</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Void</option>
                          </select>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderManagement;
