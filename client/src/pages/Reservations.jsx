import React, { useState, useEffect } from 'react';
import { createReservation, getMyReservations } from '../services/reservationService';
import { Calendar, Clock, Users, MapPin, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '19:00',
    numberOfPeople: 2,
    occasion: '',
    phone: '',
    paymentMethod: 'EasyPaisa'
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getMyReservations();
      setReservations(data);
    } catch (error) {
      // toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    try {
      await createReservation({
          ...formData,
          numberOfGuests: formData.numberOfPeople, // Sync with backend field name if needed
          reservationDate: formData.date,
          reservationTime: formData.time
      });
      toast.success('Table booked! Please pay Rs. 1000 advance.', {
          icon: '💳',
          duration: 5000
      });
      fetchReservations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">Book a Table</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Save your spot for a great meal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Reservation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] sticky top-28">
            <h3 className="text-2xl font-serif font-bold text-white mb-8">Reservation Details</h3>
            <form onSubmit={handleBooking} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Date</label>
                    <input 
                        type="date"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Time</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                            value={formData.time}
                            onChange={(e) => setFormData({...formData, time: e.target.value})}
                        >
                            <option value="18:00">18:00</option>
                            <option value="19:00">19:00</option>
                            <option value="20:00">20:00</option>
                            <option value="21:00">21:00</option>
                            <option value="22:00">22:00</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Guests</label>
                        <input 
                            type="number"
                            min="1"
                            max="20"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                            value={formData.numberOfPeople}
                            onChange={(e) => setFormData({...formData, numberOfPeople: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Phone Number</label>
                    <input 
                        type="tel"
                        required
                        placeholder="03xx xxxxxxx"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Reason (Optional)</label>
                    <input 
                        placeholder="Birthday, Anniversary, etc."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                        value={formData.occasion}
                        onChange={(e) => setFormData({...formData, occasion: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">Pay Advance (Rs. 1000)</label>
                    <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                        <option value="EasyPaisa">EasyPaisa</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                </div>
                <div className="bg-gold/10 border border-gold/20 p-4 rounded-2xl">
                    <p className="text-[10px] text-gold font-bold leading-relaxed">
                        Note: Rs. 1000 will be adjusted in your final bill. If you don't show up, it will not be refunded.
                    </p>
                </div>
                <button 
                    type="submit"
                    disabled={isBooking}
                    className="w-full bg-gold text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gold/20 active:scale-95 transition-transform disabled:opacity-50 mt-4"
                >
                    {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reservation'}
                </button>
            </form>
          </div>
        </div>

        {/* Reservations List */}
        <div className="lg:col-span-2 space-y-8">
            <h3 className="text-2xl font-serif font-bold text-white mb-8">My Bookings</h3>
            {loading ? (
                <div className="space-y-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : reservations.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
                    <Calendar className="w-12 h-12 text-gold/20 mx-auto mb-6" />
                    <p className="text-gray-500 italic">No bookings found yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reservations.map((res) => (
                        <div key={res._id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-gold/20 transition-all">
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex flex-col items-center justify-center">
                                    <span className="text-gold font-black text-xl">{new Date(res.date).getDate()}</span>
                                    <span className="text-gold/60 text-[8px] uppercase font-black">{new Date(res.date).toLocaleString('default', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg mb-1">{res.occasion}</h4>
                                    <div className="flex gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {res.time}</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {res.numberOfPeople} Guests</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                                res.status === 'confirmed' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-gold bg-gold/10 border-gold/20'
                            }`}>
                                {res.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
