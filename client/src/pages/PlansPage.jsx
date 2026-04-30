import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, ArrowLeft, Wallet, ChevronRight, Package, Loader2, Play, Pause } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const PlansPage = () => {
  const { user, refreshProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/subscriptions');
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await apiClient.put(`/subscriptions/${id}/toggle`);
      toast.success('Plan status updated');
      fetchSubscriptions();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this plan?')) return;
    try {
      await apiClient.delete(`/subscriptions/${id}`);
      toast.success('Plan cancelled');
      fetchSubscriptions();
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-gold bg-gold/10 border-gold/20';
      case 'PAUSED': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">Meal Plans</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Your Weekly Schedule - Automated Gourmet Experience</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-3.5 flex items-center gap-4">
            <div className="p-2 bg-gold/10 rounded-xl text-gold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gold/60">Wallet Balance</p>
              <p className="text-lg font-bold text-white">Rs. {user?.walletBalance || 0}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/plans/new')}
            className="bg-gold hover:bg-yellow-400 text-charcoal px-8 py-4 rounded-2xl font-bold text-sm tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-gold/10"
          >
            <Plus className="w-4 h-4" /> NEW PLAN
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 bg-white/[0.03] rounded-[2.5rem] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
          <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gold/40" />
          </div>
          <p className="text-xl text-white font-serif mb-6">No active meal plans</p>
          <Link to="/plans/new" className="text-gold font-bold underline underline-offset-8 decoration-gold/30 hover:decoration-gold transition-all text-sm uppercase tracking-widest font-black">
            Create First Plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {subscriptions.map((plan) => (
            <div key={plan._id} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-gold/20 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 group">
              {/* Plan Type Icon */}
              <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 shrink-0 group-hover:bg-gold/10 group-hover:border-gold/20 transition-all">
                <Clock className="w-8 h-8 text-gold" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-2xl font-serif font-bold text-white">
                    Weekly Meal Plan
                  </h3>
                  <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(plan.status)}`}>
                    {plan.status}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {plan.schedule.map(s => s.day).join(', ')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    {plan.schedule.reduce((acc, s) => acc + s.items.length, 0)} Items
                  </span>
                  <span className="text-white font-bold">
                    Weekly Total: <span className="text-gold ml-1">Rs. {plan.schedule.reduce((acc, s) => acc + s.items.reduce((ia, i) => ia + (i.price * i.qty), 0), 0)}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => toggleStatus(plan._id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs transition-all ${
                    plan.status === 'ACTIVE' 
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20' 
                      : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                  }`}
                >
                  {plan.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {plan.status === 'ACTIVE' ? 'PAUSE' : 'RESUME'}
                </button>
                <button
                  onClick={() => deletePlan(plan._id)}
                  className="p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl transition-all"
                  title="Cancel Plan"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                   onClick={() => navigate(`/plans/edit/${plan._id}`)}
                   className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all"
                >
                   <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansPage;
