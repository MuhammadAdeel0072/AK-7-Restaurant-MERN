import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { ShoppingBag, DollarSign, Users, TrendingUp, Calendar, Pause, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from '../components/BrandingUtils';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/analytics/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    let debounceTimer = null;

    const handleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchStats();
      }, 500);
    };

    socket.on('orderUpdate', handleUpdate);
    socket.on('incomingOrder', handleUpdate);
    socket.on('reservationUpdated', handleUpdate);
    socket.on('subscription_updated', handleUpdate);
    socket.on('subscription_created', handleUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      socket.off('orderUpdate', handleUpdate);
      socket.off('incomingOrder', handleUpdate);
      socket.off('reservationUpdated', handleUpdate);
      socket.off('subscription_updated', handleUpdate);
      socket.off('subscription_created', handleUpdate);
    };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const mainCards = [
    { title: 'Total Revenue', value: `Rs. ${(stats?.totalSales + (stats?.subscriptionStats?.revenue || 0))?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-gold' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { title: 'Active Plans', value: stats?.subscriptionStats?.active || 0, icon: Calendar, color: 'text-green-400' },
    { title: 'Orders Today', value: stats?.orderStats?.find(s => s._id === 'placed')?.count || 0, icon: ShoppingBag, color: 'text-orange-400' },
  ];

  const subCards = [
    { title: 'Active Plans', value: stats?.subscriptionStats?.active || 0, icon: Calendar, color: 'text-green-400' },
    { title: 'Paused Plans', value: stats?.subscriptionStats?.paused || 0, icon: Pause, color: 'text-orange-400' },
    { title: 'Ending Soon', value: stats?.subscriptionStats?.expiring || 0, icon: AlertCircle, color: 'text-crimson' },
    { title: 'Plan Sales', value: `Rs. ${stats?.subscriptionStats?.revenue?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-gold' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-10"
    >
      <header>
        <BrandLogo size="lg" className="mb-2" />
        <p className="text-soft-white/40 tracking-[0.4em] uppercase text-[8px] md:text-[10px] font-black">Culinary Control Center</p>
      </header>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {mainCards.map((card, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="glass p-5 md:p-8 rounded-2xl border border-white/5 flex flex-col justify-between h-32 md:h-40 hover:border-gold/30 transition-all duration-500 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-soft-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">{card.title}</span>
              <card.icon className={`w-5 h-5 ${card.color} opacity-70 group-hover:scale-110 transition-transform`} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold font-sans text-soft-white mt-4">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Subscription Insights Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px bg-white/5 flex-1"></div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/60 whitespace-nowrap">Plan Overview</h2>
          <div className="h-px bg-white/5 flex-1"></div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {subCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-white/5 p-4 md:p-6 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all"
            >
              <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-soft-white/30 text-[9px] font-black uppercase tracking-widest">{card.title}</p>
                <h4 className="text-lg md:text-xl font-bold text-soft-white">{card.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <motion.div variants={itemVariants} className="glass p-5 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <h2 className="text-lg md:text-xl font-serif font-bold text-gold mb-6 md:mb-8 flex items-center gap-3">
            <div className="w-1 h-6 bg-gold rounded-full"></div>
            Popular Items
          </h2>
          <div className="space-y-6">
            {stats?.popularItems?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between group/item">
                <span className="text-soft-white/70 group-hover/item:text-soft-white transition-colors">{item._id}</span>
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.totalSold / stats.popularItems[0].totalSold) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gold/40"
                    />
                  </div>
                  <span className="font-bold text-gold text-sm">{item.totalSold} sold</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
          <h2 className="text-xl font-serif font-bold text-gold mb-8 flex items-center gap-3">
            <div className="w-1 h-6 bg-gold rounded-full"></div>
            Order Statistics
          </h2>
          <div className="space-y-6">
            {stats?.orderStats?.map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold/40"></div>
                  <span className="capitalize text-soft-white/70">{stat._id.replace(/-/g, ' ')}</span>
                </div>
                <span className="font-bold text-soft-white px-3 py-1 bg-white/5 rounded-lg text-sm">{stat.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
