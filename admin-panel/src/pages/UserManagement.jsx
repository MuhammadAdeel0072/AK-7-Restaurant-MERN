import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Mail, Shield, ShieldCheck, ShoppingCart, CalendarRange, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      <header>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">User <span className="text-gold">Directory</span></h1>
        <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">AK-7 REST USER MANAGEMENT</p>
      </header>

      <div className="glass rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left py-6 px-4 sm:px-6 text-[13px] font-black uppercase tracking-[0.15em] text-gold">Customer Name</th>
                <th className="text-center py-6 px-4 sm:px-6 text-[13px] font-black uppercase tracking-[0.15em] text-gold">User Role</th>
                <th className="text-center py-6 px-4 sm:px-6 text-[13px] font-black uppercase tracking-[0.15em] text-gold">Status</th>
                <th className="text-left py-6 px-4 sm:px-6 text-[13px] font-black uppercase tracking-[0.15em] text-gold">Joined Date</th>
                <th className="text-right py-6 px-4 sm:px-6 text-[13px] font-black uppercase tracking-[0.15em] text-gold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-soft-white/30 italic">No users registered yet.</td></tr>
              ) : (
                <AnimatePresence>
                  {users.map((user) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={user._id} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 sm:px-8 py-6 sm:py-8">
                        <div className="flex items-center gap-3 sm:gap-5">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 text-gold font-serif font-bold text-base sm:text-xl group-hover:bg-gold group-hover:text-charcoal transition-all duration-500">
                            {user.firstName ? user.firstName[0] : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-soft-white text-base sm:text-lg tracking-tight">{user.firstName} {user.lastName}</p>
                            <p className="text-soft-white/40 text-[10px] sm:text-xs mt-1 flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gold/40" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 text-center">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/5 bg-white/5 transition-all group-hover:border-gold/20">
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                              <span className="text-[8px] sm:text-[10px] font-bold text-gold uppercase tracking-widest">Admin</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-soft-white/30" />
                              <span className="text-[8px] sm:text-[10px] font-bold text-soft-white/40 uppercase tracking-widest">User</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 sm:gap-1.5 text-gold mb-1">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-gold/20" />
                            <span className="font-bold text-base sm:text-lg">{user.loyaltyPoints || 0}</span>
                          </div>
                          <span className="text-[8px] sm:text-[10px] font-bold text-soft-white/30 uppercase tracking-[0.15em]">
                            {user.loyaltyTier || 'Novice'} Tier
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 text-soft-white/40 font-mono text-[10px] sm:text-xs">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-8 py-6 sm:py-8 text-right">
                        <button className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/10 text-soft-white/30 hover:text-gold hover:border-gold/30 hover:bg-gold/10 transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default UserManagement;
