import { useState, useEffect } from 'react';
import { getKitchenStats } from '../services/api';
import socket from '../services/socket';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, 
    Clock, 
    CheckCircle, 
    Flame, 
    AlertTriangle, 
    Activity,
    Utensils,
    Timer
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ 
        totalToday: 0,
        pending: 0, 
        preparing: 0, 
        ready: 0,
        delayed: 0,
        avgPrepTime: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setError(null);
            const data = await getKitchenStats();
            if (data) {
                setStats({
                    totalToday: data.totalToday ?? 0,
                    pending: data.pending ?? 0,
                    preparing: data.preparing ?? 0,
                    ready: data.ready ?? 0,
                    delayed: data.delayed ?? 0,
                    avgPrepTime: data.avgPrepTime ?? 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setError('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
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

    const cards = [
        { title: 'Total Orders', value: stats.totalToday, icon: ShoppingBag, color: 'text-gold' },
        { title: 'Active Cooking', value: stats.preparing, icon: Flame, color: 'text-blue-400' },
        { title: 'Late Orders', value: stats.delayed, icon: AlertTriangle, color: stats.delayed > 0 ? 'text-crimson' : 'text-soft-white/20' },
        { title: 'Avg Prep Time', value: `${stats.avgPrepTime}m`, icon: Timer, color: 'text-green-400' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 md:space-y-10"
        >
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-serif font-black mb-1 md:mb-2 tracking-tighter italic">
                        <span className="text-gold">AK-7</span> <span className="text-crimson ml-1">REST</span>
                    </h1>
                    <p className="text-soft-white/40 tracking-[0.4em] uppercase text-[8px] md:text-[10px] font-black italic">Kitchen Intelligence Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-soft-white/40 uppercase tracking-widest">Live Sync Active</span>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {cards.map((card, idx) => (
                    <div 
                        key={idx} 
                        className={`glass p-5 md:p-8 rounded-3xl border flex flex-col justify-between h-32 md:h-44 transition-all duration-500 group relative overflow-hidden ${
                            card.title === 'Late Orders' && stats.delayed > 0 ? 'border-crimson/30 shadow-[0_0_40px_rgba(220,38,38,0.1)]' : 'border-white/5'
                        }`}
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-soft-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest">{card.title}</span>
                            <card.icon className={`${card.color} w-5 h-5`} />
                        </div>
                        <h3 className={`text-4xl font-bold font-sans mt-4 relative z-10 ${card.title === 'Late Orders' && stats.delayed > 0 ? 'text-crimson' : 'text-white'}`}>{card.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                <div className="glass p-5 md:p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                    <h2 className="text-lg md:text-xl font-serif font-bold text-gold mb-6 md:mb-10 flex items-center gap-3 px-2">
                        <Activity className="w-5 h-5" />
                        Queue Dynamics
                    </h2>
                    <div className="space-y-8 px-2">
                        {[
                            { label: 'Pending', count: stats.pending, color: 'bg-gold' },
                            { label: 'Preparing', count: stats.preparing, color: 'bg-blue-400' },
                            { label: 'Ready', count: stats.ready, color: 'bg-green-400' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex flex-col gap-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-soft-white/60 text-xs font-bold uppercase tracking-widest">{stat.label}</span>
                                    <span className="font-sans font-black text-xl text-white">{stat.count}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stat.count / Math.max(stats.totalToday || (stats.pending + stats.preparing + stats.ready), 1)) * 100}%` }}
                                        transition={{ duration: 1.5 }}
                                        className={`h-full ${stat.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-5 md:p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                    <h2 className="text-xl font-serif font-bold text-gold mb-8 flex items-center gap-3">
                        <Utensils className="w-5 h-5" />
                        Station Health Check
                    </h2>
                    <div className="space-y-6">
                        <div className={`p-6 rounded-2xl border flex items-center justify-between ${stats.delayed > 0 ? 'bg-crimson/5 border-crimson/20' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <AlertTriangle className={stats.delayed > 0 ? 'text-crimson' : 'text-white/20'} />
                                <div>
                                    <p className="text-sm font-bold text-white tracking-tight">Latency Status</p>
                                    <p className="text-[10px] text-soft-white/40 font-bold uppercase tracking-widest">{stats.avgPrepTime + 10}m Target</p>
                                </div>
                            </div>
                            <span className={`text-xl font-black ${stats.delayed > 0 ? 'text-crimson' : 'text-green-500'}`}>
                                {stats.delayed > 0 ? 'Critical' : 'Optimal'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Dine-In Wait', val: '~12m' },
                                { title: 'Rider ETA', val: '~18m' }
                            ].map((h, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[9px] font-black text-soft-white/30 uppercase tracking-[0.2em] mb-2">{h.title}</p>
                                    <p className="text-xl font-bold text-soft-white tracking-tighter">{h.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
