import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { ShoppingBag, DollarSign, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Listen for real-time updates to refresh analytics
    socket.on('orderUpdate', fetchStats);
    socket.on('incomingOrder', fetchStats);
    socket.on('reservationUpdated', fetchStats);
    
    return () => {
      socket.off('orderUpdate');
      socket.off('incomingOrder');
      socket.off('reservationUpdated');
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

  const cards = [
    { title: 'Total Revenue', value: `Rs. ${stats?.totalSales?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-gold' },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400' },
    { title: 'Orders Today', value: stats?.orderStats?.find(s => s._id === 'placed')?.count || 0, icon: ShoppingBag, color: 'text-orange-400' },
    { title: 'Popular Item', value: stats?.popularItems?.[0]?._id || 'N/A', icon: TrendingUp, color: 'text-purple-400' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10"
    >
      <header>
        <h1 className="text-4xl font-serif font-black text-soft-white mb-2 tracking-tighter">AK-7 <span className="text-gold">REST</span></h1>
        <p className="text-soft-white/50 tracking-[0.3em] uppercase text-[10px] font-bold">Culinary Control Center</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            className="glass p-8 rounded-2xl border border-white/5 flex flex-col justify-between h-40 hover:border-gold/30 transition-all duration-500 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-soft-white/40 text-xs font-bold uppercase tracking-widest">{card.title}</span>
              <card.icon className={`w-5 h-5 ${card.color} opacity-70 group-hover:scale-110 transition-transform`} />
            </div>
            <h3 className="text-3xl font-bold font-sans text-soft-white mt-4">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <motion.div variants={itemVariants} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <h2 className="text-xl font-serif font-bold text-gold mb-8 flex items-center gap-3">
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
