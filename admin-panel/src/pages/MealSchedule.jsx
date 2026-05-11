import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Save, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, Power, Users, Search,
  Mail, Phone, Package, ChevronRight, User
} from 'lucide-react';

const MealSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();

    // Listen for new subscriptions
    socket.on('subscription_created', (newSub) => {
      setSubscriptions(prev => [newSub, ...prev]);
    });

    return () => {
      socket.off('subscription_created');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, subRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/admin/subscriptions')
      ]);
      setSchedule(scheduleRes.data);
      setSubscriptions(subRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id) => {
    setSchedule(prev => prev.map(day =>
      day._id === id ? { ...day, isOpen: !day.isOpen } : day
    ));
  };

  const handleTimeChange = (id, field, value) => {
    setSchedule(prev => prev.map(day =>
      day._id === id ? { ...day, [field]: value } : day
    ));
  };

  const handleSave = async () => {
    const openDays = schedule.filter(d => d.isOpen);
    if (openDays.length === 0) {
      toast.error('At least one day must be marked as Open');
      return;
    }

    setSaving(true);
    try {
      await api.put('/schedule', { weeklySchedule: schedule });
      toast.success('Restaurant schedule updated');
    } catch (error) {
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub =>
    sub.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-serif font-black text-white mb-2 uppercase tracking-tight">
            Meal <span className="text-gold">Operations</span>
          </h1>
          <p className="text-gold/40 text-[10px] font-black uppercase tracking-[0.4em]">Schedule & Customer Controller</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold text-charcoal px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          SAVE CONFIGURATION
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* LEFT: SCHEDULE CONFIG */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-gold" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Weekly Schedule</h2>
          </div>

          <div className="space-y-4">
            {schedule.map((day) => (
              <div
                key={day._id}
                className={`glass p-6 rounded-3xl border transition-all ${day.isOpen ? 'border-white/10' : 'border-white/5 opacity-40'}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggle(day._id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${day.isOpen ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/20 border border-white/5'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <span className="font-serif font-bold text-lg text-white">{day.day}</span>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full ${day.isOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {day.isOpen ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>

                {day.isOpen && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gold/40 ml-2">Open</label>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleTimeChange(day._id, 'openTime', e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-gold/30 [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gold/40 ml-2">Close</label>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleTimeChange(day._id, 'closeTime', e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-gold/30 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CUSTOMER LIST */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Subscribed Customers</h2>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold opacity-70" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-soft-white outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSubs.length === 0 ? (
              <div className="glass p-20 rounded-[2.5rem] text-center border border-white/5">
                <User className="w-10 h-10 text-white/10 mx-auto mb-4" />
                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No subscribers found</p>
              </div>
            ) : (
              filteredSubs.map((sub, idx) => (
                <motion.div
                  key={sub._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass p-6 rounded-[2rem] border border-white/5 hover:border-gold/20 transition-all flex items-center gap-6 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gold/5 flex items-center justify-center border border-gold/10 group-hover:bg-gold transition-all duration-500">
                    <User className="w-6 h-6 text-gold group-hover:text-charcoal transition-colors" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-serif font-bold text-lg mb-1">{sub.customerName}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {sub.email}</span>
                      <span className="flex items-center gap-1.5"><Package className="w-3 h-3" /> {sub.duration} Plan</span>
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <p className="text-gold font-black text-xs mb-1 tracking-wider uppercase">Active</p>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Since {new Date(sub.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight className="w-4 h-4 text-gold" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealSchedule;
