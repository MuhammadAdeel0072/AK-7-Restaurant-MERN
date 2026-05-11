import React, { useEffect, useState } from 'react';
import { 
    Calendar, Clock, Plus, Trash2, Play, Pause, 
    CalendarDays, Zap, Settings, Info, Package
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import apiClient from '../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const PlansPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
    
    if (socket) {
        socket.on('subscriptionUpdated', (updatedSub) => {
            setSubscriptions(prev => prev.map(s => s._id === updatedSub._id ? updatedSub : s));
        });
        
        socket.on('subscriptionPaused', (updatedSub) => {
            setSubscriptions(prev => prev.map(s => s._id === updatedSub._id ? updatedSub : s));
            toast.success('Plan paused');
        });

        socket.on('subscriptionResumed', (updatedSub) => {
            setSubscriptions(prev => prev.map(s => s._id === updatedSub._id ? updatedSub : s));
            toast.success('Plan active');
        });

        socket.on('subscriptionCompleted', ({ message }) => {
            fetchSubscriptions();
            toast.success(message);
        });
    }
    
    return () => {
        if (socket) {
            socket.off('subscriptionUpdated');
            socket.off('subscriptionPaused');
            socket.off('subscriptionResumed');
            socket.off('subscriptionCompleted');
        }
    };
  }, [socket]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/subscriptions');
      setSubscriptions(data || []);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    try {
      await apiClient.put(`/subscriptions/${id}/pause`);
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to pause');
    }
  };

  const handleResume = async (id) => {
    try {
      await apiClient.put(`/subscriptions/${id}/resume`);
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to resume');
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Cancel this meal plan?')) return;
    try {
      await apiClient.put(`/subscriptions/${id}/cancel`, { reason: 'User request' });
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PAUSED': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'EXPIRED': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      case 'PENDING': return 'text-gold bg-gold/10 border-gold/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">My Food Plans</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Your active plans</p>
        </div>
        
        <button
          onClick={() => navigate('/plans/new')}
          className="bg-gold hover:bg-yellow-400 text-charcoal px-8 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Start New Plan
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gold/40" />
          </div>
          <p className="text-xl text-white font-serif mb-6">No plans found</p>
          <button 
            onClick={() => navigate('/plans/new')}
            className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all text-sm uppercase tracking-widest font-black"
          >
            Start your plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((plan) => (
            <motion.div 
                key={plan._id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-gold/20 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 group"
            >
              {/* Days Left Indicator */}
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10 shrink-0">
                <span className="text-gold font-bold text-2xl leading-none">{plan.remainingDays}</span>
                <span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest mt-1">Days</span>
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">
                    {plan.duration} Food Plan
                  </h3>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(plan.status)}`}>
                    {plan.status === 'ACTIVE' ? 'Active' : plan.status === 'PAUSED' ? 'Paused' : plan.status === 'PENDING' ? 'Unpaid' : plan.status === 'CANCELLED' ? 'Stopped' : 'Done'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    {plan.deliveryDays?.join(', ')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {plan.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-gray-500" />
                    {plan.mealsPerDay} Meals / Day
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-white/60 font-bold">Price: <span className="text-gold ml-1">Rs. {plan.totalPrice?.toLocaleString()}</span></span>
                    <span className="text-white/30">Ends on: {new Date(plan.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Simple Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {plan.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handlePause(plan._id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-orange-500/20 text-orange-400 border border-white/10 rounded-2xl font-bold text-xs transition-all"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : plan.status === 'PAUSED' ? (
                  <button
                    onClick={() => handleResume(plan._id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-2xl font-bold text-xs transition-all"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                ) : plan.status === 'PENDING' ? (
                  <button
                    onClick={() => navigate(`/checkout/${plan._id}`)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-charcoal rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-gold/20"
                  >
                    <ShoppingCart className="w-4 h-4" /> Pay Now
                  </button>
                ) : null}

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/plans/edit/${plan._id}`)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => deletePlan(plan._id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        Stop
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansPage;
