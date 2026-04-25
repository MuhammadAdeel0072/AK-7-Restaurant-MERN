import React, { useState } from 'react';
import { Bell, Package, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertContext } from '../context/AlertContext';

const NotificationTray = () => {
  const { alerts, markRead, clearAll } = useAlertContext();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter(a => !a.read).length;

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      // Mark all as read when opening
      alerts.forEach(alert => {
        if (!alert.read) {
          markRead(alert.id);
        }
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group"
      >
        <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'text-gold fill-gold/10 animate-pulse' : 'text-soft-white/40'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-crimson rounded-full border-2 border-[#121418] flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 sm:w-96 bg-charcoal border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden z-[110] transition-all"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gold/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gold">Kitchen Alerts</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-gold/10 text-gold rounded-full">{alerts.length} ACTIVE</span>
              </div>

              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {alerts.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                      <CheckCircle className="w-6 h-6 text-white/10" />
                    </div>
                    <p className="text-[10px] text-soft-white/20 font-black uppercase tracking-widest">All systems nominal</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {alerts.map((notif) => {
                      const IconComponent = notif.type === 'priority' ? AlertTriangle : Package;
                      const colorClass = notif.type === 'priority' ? 'text-crimson' : 'text-gold';
                      
                      return (
                      <div key={notif.id} className={`p-4 hover:bg-white/[0.02] transition-colors relative group ${!notif.read ? 'bg-white/[0.02]' : ''}`}>
                        <div className="flex gap-4">
                          <div className={`mt-1 p-2 rounded-lg bg-[#1a1d23] border border-white/5 ${colorClass}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-[11px] font-bold text-soft-white">{notif.title}</h4>
                            <p className="text-[10px] text-soft-white/40 leading-relaxed font-medium">{notif.message}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(notif.id);
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-gold transition-colors rounded-lg hover:bg-white/5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>

              {alerts.length > 0 && (
                <button
                  onClick={() => clearAll()}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-soft-white/20 hover:text-crimson hover:bg-crimson/5 border-t border-white/5 transition-all text-center"
                >
                  Clear Intelligence Stream
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationTray;
