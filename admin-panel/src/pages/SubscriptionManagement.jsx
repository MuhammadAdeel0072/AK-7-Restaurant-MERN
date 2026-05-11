import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, Search, ChevronRight, User, Phone, 
  MapPin, Settings, Pause, Play, X, Trash2, Info, 
  CheckCircle, AlertCircle, RefreshCw, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedSub, setSelectedSub] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    duration: '',
    status: '',
    mealsPerDay: 1,
    deliveryTime: '',
    remainingDays: 0,
    endDate: '',
    deliveryDays: []
  });

  useEffect(() => {
    fetchSubscriptions();
    
    // Real-time updates
    socket.on('subscription_updated', (updatedSub) => {
      setSubscriptions(prev => prev.map(s => s._id === updatedSub._id ? updatedSub : s));
    });
    
    socket.on('subscription_created', (newSub) => {
      setSubscriptions(prev => [newSub, ...prev]);
    });
    
    return () => {
      socket.off('subscription_updated');
      socket.off('subscription_created');
    };
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/subscriptions/admin/all');
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to fetch plans', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, reason = '') => {
    const loadingToast = toast.loading(`Updating plan...`);
    try {
      let endpoint = `/subscriptions/admin/${id}`;
      let method = 'put';
      let payload = { status };

      if (status === 'PAUSED') endpoint = `/subscriptions/${id}/pause`;
      if (status === 'ACTIVE') endpoint = `/subscriptions/${id}/resume`;
      if (status === 'CANCELLED') {
        endpoint = `/subscriptions/${id}/cancel`;
        payload = { reason };
      }

      const { data } = await api[method](endpoint, payload);
      toast.success(`Plan updated`, { id: loadingToast });
      fetchSubscriptions();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed', { id: loadingToast });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');
    try {
      const { data } = await api.put(`/subscriptions/admin/${selectedSub._id}`, editForm);
      toast.success('Saved successfully', { id: loadingToast });
      fetchSubscriptions();
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed', { id: loadingToast });
    }
  };

  const openEditModal = (sub) => {
    setSelectedSub(sub);
    setEditForm({
      duration: sub.duration,
      status: sub.status,
      mealsPerDay: sub.mealsPerDay,
      deliveryTime: sub.deliveryTime,
      remainingDays: sub.remainingDays,
      endDate: sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : '',
      deliveryDays: sub.deliveryDays || []
    });
    setIsEditModalOpen(true);
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = 
      sub.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.phone?.includes(searchTerm) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    paused: subscriptions.filter(s => s.status === 'PAUSED').length,
    expiring: subscriptions.filter(s => s.status === 'ACTIVE' && s.remainingDays <= 3).length
  };

  const statusColors = {
    ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
    PAUSED: 'bg-orange-500/10 text-orange-500 border-orange-400/20',
    CANCELLED: 'bg-crimson/10 text-crimson border-crimson/20',
    COMPLETED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    EXPIRED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    PENDING: 'bg-gold/10 text-gold border-gold/20'
  };

  const getStatusText = (status) => {
    switch (status) {
        case 'ACTIVE': return 'On';
        case 'PAUSED': return 'Paused';
        case 'CANCELLED': return 'Stopped';
        case 'COMPLETED': return 'Done';
        case 'EXPIRED': return 'Ended';
        case 'PENDING': return 'Unpaid';
        default: return status;
    }
  };

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-serif font-black text-soft-white tracking-tighter">Plan <span className="text-gold">Management</span></h1>
          <p className="text-soft-white/40 mt-2 uppercase text-[10px] font-black tracking-[0.3em]">Customer Plans & Schedules</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['all', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === s ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-soft-white/40 hover:text-soft-white hover:bg-white/5'
              }`}
            >
              {s === 'all' ? 'All' : getStatusText(s)}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Active Plans', value: stats.active, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Paused Plans', value: stats.paused, icon: Pause, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Ending Soon', value: stats.expiring, icon: AlertCircle, color: 'text-crimson', bg: 'bg-crimson/10' },
        ].map((item, idx) => (
          <div key={idx} className="glass p-8 rounded-[2rem] border border-white/5 flex items-center gap-6 group hover:border-white/10 transition-all shadow-xl">
            <div className={`p-5 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-500`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-soft-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-3xl font-black text-soft-white">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold opacity-70 group-focus-within:opacity-100 transition-opacity" />
          <input 
            type="text" 
            placeholder="Find by customer, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-soft-white placeholder:text-soft-white/20 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
          />
        </div>
        <button 
          onClick={fetchSubscriptions}
          className="bg-white/5 hover:bg-white/10 border border-white/5 text-gold p-5 rounded-2xl transition-all active:scale-95 shadow-lg"
          title="Refresh List"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Table Section */}
      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60">Customer</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60">Plan</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60 text-center">Days left</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60">Schedule</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60">Payment</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60">Status</th>
                <th className="py-7 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-gold/60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gold/40 text-[10px] font-black uppercase tracking-widest animate-pulse">Syncing Plans...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Calendar className="w-16 h-16 text-soft-white" />
                      <p className="text-soft-white text-sm font-bold">No plans found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredSubs.map((sub) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={sub._id} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedSub(sub);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <td className="px-8 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20 font-black text-lg shadow-inner">
                            {sub.customerName?.[0] || 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-soft-white text-base leading-tight">{sub.customerName}</p>
                            <p className="text-soft-white/40 text-[11px] mt-1 font-medium">{sub.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div>
                          <p className="text-soft-white font-bold text-sm tracking-tight">{sub.duration} Plan</p>
                          <p className="text-gold/50 text-[10px] mt-1 font-black uppercase tracking-widest">{sub.mealsPerDay} Meals / Day</p>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                        <div className={`inline-flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${sub.remainingDays <= 3 ? 'border-crimson/30 bg-crimson/5' : 'border-white/10 bg-white/5 shadow-inner'}`}>
                          <span className={`text-xl font-black ${sub.remainingDays <= 3 ? 'text-crimson' : 'text-soft-white'}`}>{sub.remainingDays}</span>
                          <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Days</span>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-soft-white/70 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-gold/60" />
                            {sub.deliveryTime}
                          </div>
                          <div className="flex gap-1">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                              const isActive = sub.deliveryDays?.includes(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]);
                              return (
                                <span key={i} className={`w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black border ${isActive ? 'bg-gold/20 text-gold border-gold/30' : 'bg-white/5 text-white/10 border-white/5'}`}>
                                  {day}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${sub.paymentStatus === 'PAID' ? 'text-green-400 border-green-400/20 bg-green-400/5' : 'text-orange-400 border-orange-400/20 bg-orange-400/5'}`}>
                          {sub.paymentStatus || 'UNPAID'}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${statusColors[sub.status]}`}>
                          {getStatusText(sub.status)}
                        </span>
                      </td>
                      <td className="px-8 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => openEditModal(sub)}
                            className="p-3 bg-white/5 hover:bg-gold text-white hover:text-charcoal border border-white/10 rounded-xl transition-all shadow-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            Edit
                          </button>
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

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedSub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-charcoal border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gold/10 flex items-center justify-center text-gold border border-gold/20 font-black text-2xl shadow-inner">
                    {selectedSub.customerName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-black text-soft-white">{selectedSub.customerName}</h2>
                    <p className="text-gold/60 text-xs font-black uppercase tracking-[0.2em] mt-1">Ref ID: {selectedSub._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-soft-white/40 hover:text-soft-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40 mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                        Customer Info
                      </h4>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                          <Phone className="w-5 h-5 text-gold/60" />
                          <div>
                            <p className="text-soft-white font-bold">{selectedSub.phone}</p>
                            <p className="text-soft-white/30 text-[10px] font-black uppercase tracking-widest mt-0.5">Phone</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <MapPin className="w-5 h-5 text-gold/60" />
                          <div>
                            <p className="text-soft-white font-bold">{selectedSub.address}</p>
                            <p className="text-soft-white/30 text-[10px] font-black uppercase tracking-widest mt-0.5">Address</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40 mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                        Plan Summary
                      </h4>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-soft-white/40 font-bold text-xs uppercase tracking-widest">Plan Name</span>
                          <span className="text-soft-white font-black">{selectedSub.duration} Plan</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-soft-white/40 font-bold text-xs uppercase tracking-widest">Daily Meals</span>
                          <span className="text-soft-white font-black">{selectedSub.mealsPerDay} Meals</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40 mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                    Delivery Schedule
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isActive = selectedSub.deliveryDays?.includes(day);
                      return (
                        <div key={day} className={`p-5 rounded-[1.5rem] border flex flex-col items-center gap-3 transition-all ${isActive ? 'bg-gold/10 border-gold/30 shadow-lg' : 'bg-white/[0.02] border-white/5 opacity-30'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gold' : 'text-soft-white/40'}`}>{day.slice(0, 3)}</span>
                          {isActive && <div className="w-2 h-2 rounded-full bg-gold shadow-lg"></div>}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/40 mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-gold rounded-full"></span>
                    Activity History
                  </h4>
                  <div className="space-y-4">
                    {selectedSub.historyLogs?.map((log, idx) => (
                      <div key={idx} className="flex gap-6 items-start">
                        <div className="w-px h-full bg-white/5 relative min-h-[60px]">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold/40 border border-gold/20"></div>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gold font-black uppercase tracking-widest text-[9px]">{log.action}</span>
                            <span className="text-soft-white/20 text-[9px] font-bold">{new Date(log.date).toLocaleString()}</span>
                          </div>
                          <p className="text-soft-white/60 text-xs font-medium">{log.note}</p>
                          <p className="text-soft-white/20 text-[8px] mt-2 uppercase font-black tracking-widest">By: {log.performedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-10 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
                {selectedSub.status === 'ACTIVE' ? (
                  <button 
                    onClick={() => handleStatusUpdate(selectedSub._id, 'PAUSED')}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-orange-500/20 text-orange-500 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    <Pause className="w-4 h-4" /> Pause Plan
                  </button>
                ) : selectedSub.status === 'PAUSED' ? (
                  <button 
                    onClick={() => handleStatusUpdate(selectedSub._id, 'ACTIVE')}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-green-500/20 text-green-500 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    <Play className="w-4 h-4" /> Resume Plan
                  </button>
                ) : null}
                <button 
                  onClick={() => openEditModal(selectedSub)}
                  className="flex items-center gap-3 px-8 py-4 bg-gold text-charcoal rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                >
                  <Edit3 className="w-4 h-4" /> Change Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedSub && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-charcoal border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-serif font-black text-soft-white flex items-center gap-3">
                  <Settings className="w-6 h-6 text-gold" />
                  Change Plan <span className="text-gold/40">Details</span>
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-soft-white/40 hover:text-soft-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Duration</label>
                    <select 
                      value={editForm.duration}
                      onChange={e => setEditForm({...editForm, duration: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {['1 Week', '2 Weeks', '1 Month', '2 Months'].map(d => (
                        <option key={d} value={d} className="bg-black text-white">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Plan Status</label>
                    <select 
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map(s => (
                        <option key={s} value={s} className="bg-black text-white">{getStatusText(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Meals Per Day</label>
                    <input 
                      type="number"
                      min="1"
                      max="5"
                      value={editForm.mealsPerDay}
                      onChange={e => setEditForm({...editForm, mealsPerDay: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Delivery Time</label>
                    <input 
                      type="time"
                      value={editForm.deliveryTime}
                      onChange={e => setEditForm({...editForm, deliveryTime: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Days left</label>
                    <input 
                      type="number"
                      min="0"
                      value={editForm.remainingDays}
                      onChange={e => setEditForm({...editForm, remainingDays: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Ends on</label>
                    <input 
                      type="date"
                      value={editForm.endDate}
                      onChange={e => setEditForm({...editForm, endDate: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-soft-white focus:outline-none focus:border-gold/50 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gold/50 ml-2">Delivery Days</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isActive = editForm.deliveryDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const newDays = isActive 
                              ? editForm.deliveryDays.filter(d => d !== day)
                              : [...editForm.deliveryDays, day];
                            setEditForm({...editForm, deliveryDays: newDays});
                          }}
                          className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            isActive ? 'bg-gold/20 border-gold/40 text-gold shadow-lg' : 'bg-white/5 border-white/5 text-soft-white/20'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-5 rounded-[2rem] border border-white/10 text-soft-white/40 font-black text-[10px] uppercase tracking-widest hover:text-soft-white transition-all active:scale-95"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 rounded-[2rem] bg-gold text-charcoal font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManagement;
