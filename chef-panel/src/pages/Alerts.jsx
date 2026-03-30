import { Bell, ShoppingBag, CheckCircle, AlertTriangle, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlertContext } from "../context/AlertContext";

const Alerts = () => {
    const { alerts, markRead, clearAll } = useAlertContext();

    const getIcon = (type, priority) => {
        if (priority === 'urgent' || priority === 'vip') return <AlertTriangle className="text-crimson" />;
        if (type === 'new-order') return <ShoppingBag className="text-gold" />;
        if (type === 'status-update') return <CheckCircle className="text-green-500" />;
        return <Bell className="text-soft-white/40" />;
    };

    return (
        <div className="space-y-10 pb-20 max-w-4xl mx-auto">
            <header className="flex items-center justify-between">
                <div className="text-left">
                    <h1 className="text-4xl font-serif font-black mb-1 tracking-tighter">
                        Alerts <span className="text-gold ml-1">Hub</span>
                    </h1>
                    <p className="text-soft-white/40 tracking-[0.2em] uppercase text-[10px] font-bold italic">Real-time Kitchen Operational Pulse</p>
                </div>
                <button 
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-crimson/10 text-crimson rounded-xl border border-crimson/20 text-[10px] font-bold uppercase tracking-widest hover:bg-crimson hover:text-white transition-all shadow-lg active:scale-95"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
            </header>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {alerts.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="py-20 text-center glass rounded-[3rem] border border-white/5"
                        >
                            <Bell className="w-16 h-16 text-gold/10 mx-auto mb-6" />
                            <h2 className="text-2xl font-serif text-white/20 uppercase tracking-widest">No Alerts</h2>
                        </motion.div>
                    ) : (
                        alerts.map((alert) => (
                            <motion.div
                                layout
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => markRead(alert.id)}
                                className={`
                                    glass p-6 rounded-2xl border flex items-center gap-6 cursor-pointer transition-all group
                                    ${alert.read ? 'border-white/5 opacity-60' : 'border-gold/20 bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.05)]'}
                                    ${(alert.priority === 'urgent' || alert.priority === 'vip') && !alert.read ? 'border-crimson/30 animate-pulse-slow' : ''}
                                `}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${alert.read ? 'bg-white/5' : 'bg-gold/10'}`}>
                                    {getIcon(alert.type, alert.priority)}
                                </div>
                                
                                <div className="flex-1 text-left">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold text-lg tracking-tight ${alert.read ? 'text-soft-white/60' : 'text-white'}`}>
                                            {alert.type === 'new-order' ? 'New Order' : alert.title}
                                            {alert.priority === 'vip' && <span className="ml-3 text-[10px] bg-gold text-charcoal px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">VIP</span>}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-soft-white/30 uppercase">
                                            <Clock className="w-3 h-3" />
                                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <p className={`text-sm tracking-wide ${alert.read ? 'text-soft-white/40' : 'text-soft-white/70'}`}>
                                        {alert.message}
                                    </p>
                                </div>

                                {!alert.read && <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Alerts;
