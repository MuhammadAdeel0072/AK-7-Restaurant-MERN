import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Save, RefreshCw, Landmark, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentManagement = () => {
  const [config, setConfig] = useState({
    easypaisaNumber: '',
    jazzcashNumber: '',
    bankAccount: '',
    accountTitle: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/payments/config');
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch payment config', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const loadingToast = toast.loading('Updating payment configuration...');
    try {
      await api.put('/payments/config', config);
      socket.emit('adminAction', { type: 'paymentUpdate' });
      toast.dismiss(loadingToast);
      toast.success('Payment gateway configuration updated ✅');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update transaction protocols ❌');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-10"
    >
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">Payment <span className="text-gold">Gateway</span></h1>
        <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">AK-7 REST PAYMENT MANAGEMENT</p>
      </header>

      <form onSubmit={handleSave} className="glass rounded-[2rem] sm:rounded-[32px] border border-white/5 p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] ml-1">EasyPaisa Number</label>
            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-gold transition-colors" />
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-soft-white text-sm sm:text-base focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all" 
                placeholder="03xx xxxxxxx"
                value={config.easypaisaNumber}
                onChange={(e) => setConfig({...config, easypaisaNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] ml-1">JazzCash Number</label>
            <div className="relative group">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-gold transition-colors" />
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-soft-white text-sm sm:text-base focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all" 
                placeholder="03xx xxxxxxx"
                value={config.jazzcashNumber}
                onChange={(e) => setConfig({...config, jazzcashNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-3 pt-4 border-t border-white/5">
             <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] ml-1">Bank Name</label>
              <div className="relative group">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-gold transition-colors" />
                <input 
                 className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-soft-white text-sm sm:text-base focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all" 
                 placeholder="Name of the established bank"
                 value={config.bankName}
                 onChange={(e) => setConfig({...config, bankName: e.target.value})}
               />
              </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] ml-1">Account Number / IBAN</label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-gold transition-colors" />
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-10 sm:px-12 py-3 sm:py-4 text-soft-white text-sm sm:text-base focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all" 
                placeholder="IBAN or Account Number"
                value={config.bankAccount}
                onChange={(e) => setConfig({...config, bankAccount: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] ml-1">Account Title</label>
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-6 py-3 sm:py-4 text-soft-white text-sm sm:text-base focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all" 
              placeholder="Full Registered Name"
              value={config.accountTitle}
              onChange={(e) => setConfig({...config, accountTitle: e.target.value})}
            />
          </div>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-crimson/10 text-crimson border-crimson/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/5">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-gold px-8 sm:px-10 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 disabled:opacity-50 group text-xs sm:text-sm"
          >
            {saving ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />}
            <span>{saving ? 'UPDATING...' : 'SAVE CONFIGURATION'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PaymentManagement;
