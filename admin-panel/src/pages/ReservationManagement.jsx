import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, Users, Phone, Check, X, Clock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
    
    // Listen for reservation updates
    socket.on('reservationUpdated', fetchReservations);
    return () => socket.off('reservationUpdated');
  }, []);

  const fetchReservations = async () => {
    try {
      const { data } = await api.get('/reservations');
      setReservations(data);
    } catch (error) {
      console.error('Failed to fetch reservations', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const loadingToast = toast.loading('Updating reservation status...');
    try {
      await api.put(`/reservations/${id}/status`, { status });
      socket.emit('adminAction', { type: 'reservationUpdate' });
      toast.dismiss(loadingToast);
      const statusLabel = status === 'Confirmed' ? 'Confirmed ✅' : 'Cancelled 🗑️';
      toast.success(`Reservation ${statusLabel}`);
      fetchReservations();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update reservation ❌');
      console.error('Failed to update reservation', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">Table <span className="text-gold">Archives</span></h1>
          <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">AK-7 REST RESERVATION CONTROL</p>
        </div>
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to remove all outdated reservations from the system?')) {
              try {
                const { data } = await api.delete('/reservations/outdated');
                toast.success(data.message);
                fetchReservations();
              } catch (error) {
                toast.error('Failed to clear outdated reservations');
              }
            }
          }}
          className="bg-crimson/10 hover:bg-crimson/20 text-crimson border border-crimson/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          Clear Outdated
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-soft-white/30 italic glass rounded-3xl">No reservations currently registered.</div>
        ) : (
          <AnimatePresence>
            {reservations.map((res) => (
              <motion.div 
                layout
                key={res._id} 
              className={`glass rounded-[2rem] sm:rounded-3xl border ${res.status === 'Confirmed' ? 'border-gold/20' : 'border-white/5'} overflow-hidden group hover:border-gold/40 transition-all duration-500`}
              >
                <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                        <Users className="text-gold w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-soft-white text-base sm:text-xl">{res.user?.firstName} {res.user?.lastName}</h3>
                        <p className="text-gold/60 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">{res.numberOfGuests} Guests</p>
                      </div>
                    </div>
                    <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      res.status === 'Confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      res.status === 'Cancelled' ? 'bg-crimson/10 text-crimson border-crimson/10' : 
                      'bg-gold/10 text-gold border-gold/20'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-soft-white/50">
                      <Calendar className="w-4 h-4 text-gold/40" />
                      <span className="text-sm">{new Date(res.reservationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-soft-white/50">
                      <Clock className="w-4 h-4 text-gold/40" />
                      <span className="text-sm">{res.reservationTime}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-3 text-soft-white/40 hover:text-soft-white transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{res.user?.email || 'No email provided'}</span>
                    </div>
                    {res.phone && (
                      <div className="flex items-center gap-3 text-soft-white/40 hover:text-soft-white transition-colors">
                         <Phone className="w-4 h-4" />
                         <span className="text-sm font-medium">{res.phone}</span>
                      </div>
                    )}
                  </div>

                  {res.status === 'Pending' && (
                    <div className="pt-4 flex gap-4">
                      <button 
                        onClick={() => updateStatus(res._id, 'Confirmed')}
                        className="flex-1 btn-gold py-3 text-[10px] tracking-widest flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        CONFIRM
                      </button>
                      <button 
                        onClick={() => updateStatus(res._id, 'Cancelled')}
                        className="btn-close-gold p-3"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default ReservationManagement;
