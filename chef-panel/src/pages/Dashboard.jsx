import { useState, useEffect } from 'react';
import { getKitchenStats } from '../services/api';
import socket from '../services/socket';
import { motion } from 'framer-motion';
import { ShoppingBag, Clock, CheckCircle, Flame } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setError(null);
            const data = await getKitchenStats();
            if (data) {
                setStats({
                    pending: data.pending ?? 0,
                    preparing: data.preparing ?? 0,
                    ready: data.ready ?? 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setError("Failed to synchronize kitchen statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        
        // Listen for updates to refresh stats
        if (socket) {
            socket.on('orderUpdate', fetchStats);
            socket.on('incomingOrder', fetchStats);
        }
        
        return () => {
            if (socket) {
                socket.off('orderUpdate');
                socket.off('incomingOrder');
            }
        };
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="glass p-10 rounded-[3rem] border border-crimson/20 text-center space-y-4">
            <p className="text-crimson font-bold uppercase tracking-widest text-xs">Synchronization Error</p>
            <p className="text-soft-white/60">{error}</p>
            <button onClick={fetchStats} className="btn-gold scale-90">RETRY SYNC</button>
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
        { title: 'New Orders', value: stats.pending, icon: ShoppingBag, color: 'text-gold' },
        { title: 'In Preparation', value: stats.preparing, icon: Flame, color: 'text-blue-400' },
        { title: 'Ready for Service', value: stats.ready, icon: CheckCircle, color: 'text-green-400' },
        { title: 'Active Station', value: 'LIVE', icon: Clock, color: 'text-crimson' },
    ];

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 md:space-y-10"
        >
            <header>
                <h1 className="text-3xl md:text-5xl font-serif font-black mb-1 md:mb-2 tracking-tighter italic transition-all duration-700">
                    <span className="text-gold">AK-7</span> <span className="text-crimson ml-1">REST</span>
                </h1>
                <p className="text-soft-white/40 tracking-[0.4em] uppercase text-[8px] md:text-[10px] font-black italic">Kitchen Control Center</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {cards.map((card, idx) => (
                    <motion.div 
                        key={idx} 
                        variants={itemVariants}
                        className="glass p-5 md:p-8 rounded-2xl border border-white/5 flex flex-col justify-between h-32 md:h-40 hover:border-gold/30 transition-all duration-500 group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-soft-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">{card.title}</span>
                            <card.icon className={`w-5 h-5 ${card.color} opacity-70 group-hover:scale-110 transition-transform`} />
                        </div>
                        <h3 className="text-3xl font-bold font-sans text-soft-white mt-4">{card.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <motion.div variants={itemVariants} className="glass p-5 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                    <h2 className="text-lg md:text-xl font-serif font-bold text-gold mb-6 md:mb-8 flex items-center gap-3">
                        <div className="w-1 h-6 bg-gold rounded-full"></div>
                        Station Status Distribution
                    </h2>
                    <div className="space-y-6">
                        {[
                            { label: 'Pending Confirmation', count: stats.pending, color: 'bg-gold/40' },
                            { label: 'Kitchen Preparing', count: stats.preparing, color: 'bg-blue-400/40' },
                            { label: 'Awaiting Service', count: stats.ready, color: 'bg-green-400/40' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex items-center justify-between group/item">
                                <span className="text-soft-white/70 group-hover/item:text-soft-white transition-colors">{stat.label}</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.count / Math.max(stats.pending + stats.preparing + stats.ready, 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className={`h-full ${stat.color}`}
                                        />
                                    </div>
                                    <span className="font-bold text-gold text-sm">{stat.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                    <h2 className="text-xl font-serif font-bold text-gold mb-8 flex items-center gap-3">
                        <div className="w-1 h-6 bg-gold rounded-full"></div>
                        Operational Protocol
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: "Order Reception", status: "Active" },
                            { step: "Preparation Phase", status: "Strict" },
                            { step: "Quality Control", status: "Mandatory" }
                        ].map((protocol, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gold/40"></div>
                                    <span className="capitalize text-soft-white/70">{protocol.step}</span>
                                </div>
                                <span className="font-bold text-soft-white px-3 py-1 bg-white/5 rounded-lg text-[10px] tracking-widest uppercase">{protocol.status}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
