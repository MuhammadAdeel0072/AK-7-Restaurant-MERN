import React, { useState, useEffect } from 'react';
import { createReservation, getMyReservations } from '../services/reservationService';
import { getPaymentConfig } from '../services/paymentService';
import { Calendar, Clock, Users, Phone, CheckCircle, Loader2, AlertCircle, Smartphone, Landmark, ExternalLink, HelpCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const PAYMENT_ACCOUNT = import.meta.env.VITE_PAYMENT_ACCOUNT || '0312-3456789';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { siteUpdate } = useSocket();
    const [activeTab, setActiveTab] = useState('book');
    const [bookingStep, setBookingStep] = useState(1);
    const [isBooking, setIsBooking] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [paymentRef, setPaymentRef] = useState('');
    const [hasPaid, setHasPaid] = useState(false);
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);

    const [formData, setFormData] = useState({
        date: '',
        time: '19:00',
        numberOfPeople: '2',
        occasion: '',
        specialRequests: '',
        phone: '',
        paymentMethod: 'EasyPaisa'
    });

    useEffect(() => {
        fetchReservations();
        fetchPaymentConfig();
    }, [siteUpdate]);

    const fetchReservations = async () => {
        try {
            const data = await getMyReservations();
            setReservations(data);
        } catch (error) {
            toast.error('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentConfig = async () => {
        try {
            const config = await getPaymentConfig();
            setPaymentConfig(config);
        } catch (error) {
            console.error('Failed to load payment config', error);
        }
    };

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 11) val = val.slice(0, 11); // Limit to 11 digits
        
        let formatted = val;
        if (val.length > 4) {
            formatted = val.slice(0, 4) + '-' + val.slice(4);
        }
        
        setFormData({ ...formData, phone: formatted });
        
        if (formatted && !/^03\d{2}-\d{7}$/.test(formatted)) {
            setPhoneError('Format: 03xx-xxxxxxx');
        } else {
            setPhoneError('');
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!hasPaid) {
            toast.error('Please complete payment verification first');
            return;
        }
        
        setIsBooking(true);
        try {
            await createReservation({
                ...formData,
                reservationDate: formData.date,
                reservationTime: formData.time,
                numberOfGuests: formData.numberOfPeople,
                paymentReference: paymentRef
            });
            setShowPaymentInfo(true);
            setFormData({
                date: '',
                time: '19:00',
                numberOfPeople: '2',
                occasion: '',
                specialRequests: '',
                phone: '',
                paymentMethod: 'EasyPaisa'
            });
            setPaymentRef('');
            setHasPaid(false);
            setBookingStep(1);
            fetchReservations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book table');
        } finally {
            setIsBooking(false);
        }
    };

    const getMinMaxDates = () => {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 7);
        return {
            min: today.toISOString().split('T')[0],
            max: maxDate.toISOString().split('T')[0],
        };
    };

    const { min, max } = getMinMaxDates();

    const statusColor = (status) => {
        switch (status) {
            case 'Confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'Completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-gold bg-gold/10 border-gold/20';
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-5xl">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">Table Reservation</h1>
                <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">
                    Secure your spot for an unforgettable experience
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-3 mb-10">
                <button 
                    onClick={() => { setActiveTab('book'); setBookingStep(1); }}
                    className={`px-6 md:px-10 py-3 md:py-4 rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all ${activeTab === 'book' ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'}`}
                >
                    Book a Table
                </button>
                <button 
                    onClick={() => setActiveTab('bookings')}
                    className={`px-6 md:px-10 py-3 md:py-4 rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'}`}
                >
                    My Bookings
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'book' ? (
                    <motion.div 
                        key="book"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full mx-auto"
                    >
                        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl mx-auto">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-gold" />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-white">Booking Details</h3>
                                    <p className="text-gray-400 text-xs mt-1">Fill in the details to reserve your table</p>
                                </div>
                            </div>

                            <form onSubmit={handleBooking} className="w-full">
                                {/* Stepper Header */}
                                <div className="flex items-center justify-center mb-10">
                                    <div className={`flex items-center gap-3 transition-colors duration-300 ${bookingStep >= 1 ? 'text-gold' : 'text-gray-500'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${bookingStep >= 1 ? 'bg-gold text-charcoal shadow-gold/20' : 'bg-white/5 border border-white/10'}`}>1</div>
                                        <span className="font-bold text-xs uppercase tracking-widest hidden sm:block">Details</span>
                                    </div>
                                    <div className={`h-[2px] w-16 sm:w-24 mx-4 rounded-full transition-colors duration-300 ${bookingStep === 2 ? 'bg-gold' : 'bg-white/10'}`}></div>
                                    <div className={`flex items-center gap-3 transition-colors duration-300 ${bookingStep === 2 ? 'text-gold' : 'text-gray-500'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${bookingStep === 2 ? 'bg-gold text-charcoal shadow-gold/20' : 'bg-white/5 border border-white/10'}`}>2</div>
                                        <span className="font-bold text-xs uppercase tracking-widest hidden sm:block">Contact</span>
                                    </div>
                                </div>

                                <div className="bg-white/[0.01] border border-white/5 p-6 md:p-8 rounded-[2rem] relative overflow-hidden min-h-[400px]">
                                    <AnimatePresence mode="wait">
                                        {bookingStep === 1 ? (
                                            <motion.div 
                                                key="step1"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    {/* Date */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" /> Date *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            required
                                                            min={min}
                                                            max={max}
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all [color-scheme:dark] text-sm"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                        />
                                                    </div>

                                                    {/* Time */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                                            <Clock className="w-3 h-3" /> Time *
                                                        </label>
                                                        <select
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all [&>option]:bg-[#1a1a1a] [&>option]:text-white text-sm"
                                                            value={formData.time}
                                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                        >
                                                            <option value="12:00">12:00 PM</option>
                                                            <option value="13:00">1:00 PM</option>
                                                            <option value="14:00">2:00 PM</option>
                                                            <option value="18:00">6:00 PM</option>
                                                            <option value="19:00">7:00 PM</option>
                                                            <option value="20:00">8:00 PM</option>
                                                            <option value="21:00">9:00 PM</option>
                                                            <option value="22:00">10:00 PM</option>
                                                        </select>
                                                    </div>

                                                    {/* Guests */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                                            <Users className="w-3 h-3" /> Guests *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="20"
                                                            required
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all text-sm"
                                                            value={formData.numberOfPeople}
                                                            onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                                                        />
                                                    </div>

                                                    {/* Occasion */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">
                                                            Occasion <span className="text-white/20">(optional)</span>
                                                        </label>
                                                        <input
                                                            placeholder="e.g. Birthday"
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600 text-sm"
                                                            value={formData.occasion}
                                                            onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Special Requests */}
                                                <div className="space-y-2 mt-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">
                                                        Special Requests <span className="text-white/20">(optional)</span>
                                                    </label>
                                                    <textarea
                                                        rows={3}
                                                        placeholder="e.g. wheelchair access, high chair needed..."
                                                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600 resize-none text-sm"
                                                        value={formData.specialRequests}
                                                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                                    />
                                                </div>

                                                <div className="pt-6">
                                                    <button
                                                        type="button"
                                                        disabled={!formData.date || !formData.time || !formData.numberOfPeople}
                                                        onClick={() => setBookingStep(2)}
                                                        className="w-full sm:w-1/2 ml-auto bg-gold hover:bg-gold/90 text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest uppercase"
                                                    >
                                                        Next Step <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6 max-w-xl mx-auto"
                                            >
                                                <div className="space-y-4 flex-1">
                                                    {/* Phone */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                                            <Phone className="w-3 h-3" /> Phone *
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            placeholder="03xx-xxxxxxx"
                                                            className={`w-full bg-black/20 border rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600 text-sm ${phoneError ? 'border-red-500/60' : 'border-white/10'}`}
                                                            value={formData.phone}
                                                            onChange={handlePhoneChange}
                                                        />
                                                        {phoneError && <p className="text-red-500 text-[10px] ml-1 font-bold">{phoneError}</p>}
                                                    </div>
                                                    
                                                    {/* Payment Method */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                                            <Landmark className="w-3 h-3" /> Payment Method
                                                        </label>
                                                        <select
                                                            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all [&>option]:bg-[#1a1a1a] [&>option]:text-white text-sm"
                                                            value={formData.paymentMethod}
                                                            onChange={(e) => { setFormData({ ...formData, paymentMethod: e.target.value }); setHasPaid(false); setPaymentRef(''); }}
                                                        >
                                                            <option value="EasyPaisa">EasyPaisa</option>
                                                            <option value="JazzCash">JazzCash</option>
                                                            <option value="Bank Transfer">Bank Transfer</option>
                                                        </select>
                                                    </div>

                                                    {/* Compact Payment Info Box */}
                                                    <div className="bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 rounded-2xl p-6 relative overflow-hidden group mt-6">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>
                                                        <div className="flex flex-col gap-5 relative z-10">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-widest">
                                                                    <AlertCircle className="w-4 h-4" /> Advance (Rs. 1,000)
                                                                </div>
                                                                <p className="text-gray-400 text-xs">
                                                                    Send <strong className="text-white">Rs. 1,000</strong> to verify booking:
                                                                </p>
                                                                {formData.paymentMethod === 'EasyPaisa' && (
                                                                    <div className="text-lg font-black text-gold tracking-widest font-mono bg-black/20 p-3 rounded-xl border border-white/5 inline-block">
                                                                        {paymentConfig?.easypaisaNumber || '0300 1234567'}
                                                                    </div>
                                                                )}
                                                                {formData.paymentMethod === 'JazzCash' && (
                                                                    <div className="text-lg font-black text-gold tracking-widest font-mono bg-black/20 p-3 rounded-xl border border-white/5 inline-block">
                                                                        {paymentConfig?.jazzcashNumber || '0300 7654321'}
                                                                    </div>
                                                                )}
                                                                {formData.paymentMethod === 'Bank Transfer' && (
                                                                    <div className="text-base font-bold text-gold bg-black/20 p-3 rounded-xl border border-white/5 inline-block">
                                                                        {paymentConfig?.bankName || 'HBL'} - {paymentConfig?.bankAccount || '1234...'}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col gap-3">
                                                                <input 
                                                                    type="text"
                                                                    placeholder="Enter Transaction ID / Ref here"
                                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 focus:border-gold outline-none text-white transition-all text-sm"
                                                                    value={paymentRef}
                                                                    onChange={(e) => setPaymentRef(e.target.value)}
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!paymentRef.trim()) {
                                                                            toast.error('Please enter payment reference');
                                                                            return;
                                                                        }
                                                                        setHasPaid(true);
                                                                        toast.success('Payment Recorded!', { icon: '💰' });
                                                                    }}
                                                                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${hasPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-green-500/10' : 'bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20'}`}
                                                                >
                                                                    {hasPaid ? '✓ Verified' : 'Verify'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBookingStep(1)}
                                                        className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/10 text-xs tracking-widest uppercase"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" /> Back
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isBooking || !!phoneError || !hasPaid}
                                                        className="flex-1 bg-gold hover:bg-gold/90 text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs tracking-widest uppercase"
                                                    >
                                                        {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : hasPaid ? 'Confirm Booking' : 'Complete Payment'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="bookings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-4xl mx-auto"
                    >
                        {loading ? (
                            <div className="grid gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-28 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                                ))}
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="bg-white/[0.02] border border-white/5 p-16 rounded-[3rem] text-center backdrop-blur-xl">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-10 h-10 text-gold/40" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-white mb-2">No Reservations Yet</h3>
                                <p className="text-gray-400 mb-6 text-sm">Your booking history will appear here once you make a reservation.</p>
                                <button
                                    onClick={() => setActiveTab('book')}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors border border-white/10"
                                >
                                    Make a Booking
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {reservations.map((res) => (
                                    <div
                                        key={res._id}
                                        className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:bg-white/[0.04] hover:border-gold/20 transition-all group"
                                    >
                                        <div className="flex items-center gap-5 w-full sm:w-auto">
                                            {/* Date block */}
                                            <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/10 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-inner">
                                                <span className="text-gold font-black text-lg leading-none">
                                                    {new Date(res.reservationDate).getDate()}
                                                </span>
                                                <span className="text-gold/60 text-[9px] uppercase font-black tracking-widest mt-0.5">
                                                    {new Date(res.reservationDate).toLocaleString('default', { month: 'short' })}
                                                </span>
                                            </div>

                                            <div className="flex-1">
                                                <h4 className="text-white font-bold text-base mb-1.5 flex items-center gap-2">
                                                    {res.occasion || 'Regular Dining'}
                                                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${statusColor(res.status)}`}>
                                                        {res.status}
                                                    </span>
                                                </h4>
                                                <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                                                        <Clock className="w-3.5 h-3.5 text-gold" /> {res.reservationTime}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                                                        <Users className="w-3.5 h-3.5 text-gold" /> {res.numberOfGuests} Guests
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 shrink-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-none">
                                            {res.paymentStatus === 'Pending' ? (
                                                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                                                    <AlertCircle className="w-3 h-3" /> Advance Pending
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-widest bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                                                    <CheckCircle className="w-3 h-3" /> Advance Paid
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Payment Instructions Modal ── */}
            <AnimatePresence>
                {showPaymentInfo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1a1a1a] border border-white/10 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] max-w-md w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center relative"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-green-500/20">
                                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-serif font-black text-white mb-3">Booking Requested!</h2>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                Your reservation has been placed successfully. Please ensure your advance payment is completed.
                            </p>

                            <button
                                onClick={() => {
                                    setShowPaymentInfo(false);
                                    setActiveTab('bookings');
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-colors border border-white/10 text-sm tracking-widest uppercase"
                            >
                                View My Bookings
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reservations;

