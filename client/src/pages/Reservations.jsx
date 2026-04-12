import React, { useState, useEffect } from 'react';
import { createReservation, getMyReservations } from '../services/reservationService';
import { getPaymentConfig } from '../services/paymentService';
import { Calendar, Clock, Users, Phone, CheckCircle, Loader2, AlertCircle, Smartphone, Landmark, ExternalLink, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const PAYMENT_ACCOUNT = import.meta.env.VITE_PAYMENT_ACCOUNT || '0312-3456789';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { siteUpdate } = useSocket();
    const [isBooking, setIsBooking] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const [formData, setFormData] = useState({
        date: '',
        time: '19:00',
        numberOfPeople: 2,
        occasion: '',
        specialRequests: '',
        phone: '',
        paymentMethod: 'EasyPaisa',
    });

    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [paymentRef, setPaymentRef] = useState('');
    const [hasPaid, setHasPaid] = useState(false);
    const [lastReservation, setLastReservation] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getPaymentConfig();
                setPaymentConfig(data);
            } catch (error) {
                console.error('Failed to load payment config', error);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        if (siteUpdate?.type === 'reservationUpdate') {
            fetchReservations();
        }
        if (siteUpdate?.type === 'paymentUpdate') {
            const fetchConfig = async () => {
                try {
                    const data = await getPaymentConfig();
                    setPaymentConfig(data);
                } catch (error) {
                    console.error('Failed to reload payment config', error);
                }
            };
            fetchConfig();
        }
    }, [siteUpdate]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const data = await getMyReservations();
            setReservations(data);
        } catch {
            // silently fail — user may not be signed in
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // Validate Pakistani phone format: 03xx-xxxxxxx or 03xxxxxxxxx
    const validatePhone = (phone) => {
        const cleaned = phone.replace(/[-\s]/g, '');
        return /^03[0-9]{9}$/.test(cleaned);
    };

    const handlePhoneChange = (e) => {
        const val = e.target.value;
        setFormData({ ...formData, phone: val });
        if (val && !validatePhone(val)) {
            setPhoneError('Enter a valid number: 03xx-xxxxxxx');
        } else {
            setPhoneError('');
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();

        if (!validatePhone(formData.phone)) {
            setPhoneError('Enter a valid number: 03xx-xxxxxxx');
            return;
        }

        setIsBooking(true);
        try {
            const res = await createReservation({
                ...formData,
                numberOfGuests: Number(formData.numberOfPeople),
                reservationDate: formData.date,
                reservationTime: formData.time,
                paymentReference: paymentRef
            });
            setLastReservation(res);
            setShowPaymentInfo(true);
            toast.success('Reservation Request Sent!', { icon: '🍽️', duration: 4000 });
            fetchReservations();
            // Reset form but keep payment info visible
            setFormData({ date: '', time: '19:00', numberOfPeople: 2, occasion: '', specialRequests: '', phone: '', paymentMethod: 'EasyPaisa' });
            setPaymentRef('');
            setHasPaid(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    const getMinMaxDates = () => {
        const today = new Date();
        const max = new Date();
        max.setDate(today.getDate() + 7);
        return {
            min: today.toISOString().split('T')[0],
            max: max.toISOString().split('T')[0],
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
        <div className="container mx-auto px-6 py-12 max-w-6xl">
            {/* Header */}
            <div className="mb-12">
                <h1 className="text-5xl font-serif font-bold text-white mb-2">Book a Table</h1>
                <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">
                    Reserve up to 7 days in advance
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* ── Booking Form ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] sticky top-28">
                        <h3 className="text-2xl font-serif font-bold text-white mb-8">Booking Details</h3>

                        <form onSubmit={handleBooking} className="space-y-5">
                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Choose Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={min}
                                    max={max}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all [color-scheme:dark]"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            {/* Time + Guests */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Time
                                    </label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all [&>option]:bg-black [&>option]:text-white"
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
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Guests
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                                        value={formData.numberOfPeople}
                                        onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> Phone (for confirmation)
                                </label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="03xx-xxxxxxx"
                                    className={`w-full bg-white/5 border rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600 ${phoneError ? 'border-red-500/60' : 'border-white/10'}`}
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                />
                                {phoneError && (
                                    <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold ml-1">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        {phoneError}
                                    </div>
                                )}
                            </div>

                            {/* Occasion */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">
                                    Occasion <span className="text-white/20">(optional)</span>
                                </label>
                                <input
                                    placeholder="e.g. Birthday, Anniversary"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600"
                                    value={formData.occasion}
                                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                                />
                            </div>

                            {/* Special Requests */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">
                                    Special Requests <span className="text-white/20">(optional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. wheelchair access, high chair needed..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all placeholder:text-gray-600 resize-none"
                                    value={formData.specialRequests}
                                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gold/60 ml-1">
                                    Advance Payment Method
                                </label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all mb-4 [&>option]:bg-black [&>option]:text-white"
                                    value={formData.paymentMethod}
                                    onChange={(e) => { setFormData({ ...formData, paymentMethod: e.target.value }); setHasPaid(false); }}
                                >
                                    <option value="EasyPaisa">EasyPaisa</option>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>

                                {/* Payment Simulation UI inside form */}
                                <div className="p-5 bg-gold/5 border border-gold/10 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-widest">
                                        <HelpCircle className="w-4 h-4" />
                                        Instructions
                                    </div>

                                    {formData.paymentMethod === 'EasyPaisa' && (
                                        <div className="space-y-3">
                                            <p className="text-gray-400 text-xs mt-2">Send <span className="text-white font-bold">Rs. 1,000</span> to:</p>
                                            <div className="text-xl font-black text-gold tracking-widest bg-charcoal/50 p-3 rounded-lg border border-white/5 text-center">
                                                {paymentConfig?.easypaisaNumber || '0300 1234567'}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => window.open('https://easypaisa.com.pk')}
                                                className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold py-3 rounded-lg border border-gold/20 transition-all text-xs font-black uppercase tracking-widest mt-2"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Open EasyPaisa
                                            </button>
                                        </div>
                                    )}

                                    {formData.paymentMethod === 'JazzCash' && (
                                        <div className="space-y-3">
                                            <p className="text-gray-400 text-xs mt-2">Send <span className="text-white font-bold">Rs. 1,000</span> to:</p>
                                            <div className="text-xl font-black text-gold tracking-widest bg-charcoal/50 p-3 rounded-lg border border-white/5 text-center">
                                                {paymentConfig?.jazzcashNumber || '0300 7654321'}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => window.open('https://jazzcash.com.pk')}
                                                className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold py-3 rounded-lg border border-gold/20 transition-all text-xs font-black uppercase tracking-widest mt-2"
                                            >
                                                <ExternalLink className="w-4 h-4" /> Open JazzCash
                                            </button>
                                        </div>
                                    )}

                                    {formData.paymentMethod === 'Bank Transfer' && (
                                        <div className="space-y-3">
                                            <p className="text-gray-400 text-xs mt-2">Transfer <span className="text-white font-bold">Rs. 1,000</span> to:</p>
                                            <div className="bg-charcoal/50 p-4 rounded-lg border border-white/5 space-y-3 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 font-black uppercase">Bank</span>
                                                    <span className="text-white font-bold text-sm">{paymentConfig?.bankName || 'HBL'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 font-black uppercase">A/C #</span>
                                                    <span className="text-gold font-bold text-sm">{paymentConfig?.bankAccount || '1234...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 mt-2 border-t border-white/5">
                                        <input 
                                            type="text"
                                            placeholder="Transaction ID / Ref"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-gold outline-none text-white transition-all text-sm mb-4"
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
                                                toast.success('Advance Payment Recorded!', { icon: '💰' });
                                            }}
                                            className={`w-full py-3.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${hasPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gold text-charcoal'}`}
                                        >
                                            {hasPaid ? '✓ Payment Done' : 'I have paid Rs. 1000'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Advance notice */}
                            <div className="bg-gold/10 border border-gold/20 p-4 rounded-2xl">
                                <p className="text-[11px] text-gold font-bold leading-relaxed">
                                    ⚠️ Rs. 1,000 advance is required to confirm your booking. It will be deducted from your final bill.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isBooking || !!phoneError || !hasPaid}
                                className="w-full bg-gold text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gold/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
                            >
                                {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : hasPaid ? 'Confirm Booking' : 'Please Complete Payment'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── My Bookings ── */}
                <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-2xl font-serif font-bold text-white">My Bookings</h3>

                    {loading ? (
                        <div className="space-y-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-32 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/5 p-20 rounded-[3rem] text-center backdrop-blur-xl">
                            <Calendar className="w-12 h-12 text-gold/20 mx-auto mb-6" />
                            <p className="text-gray-500 font-medium">No bookings yet.</p>
                            <p className="text-gray-600 text-xs mt-2">Fill in the form to reserve your table.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {reservations.map((res) => (
                                <div
                                    key={res._id}
                                    className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-gold/20 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        {/* Date block */}
                                        <div className="w-16 h-16 bg-gold/10 rounded-2xl flex flex-col items-center justify-center shrink-0">
                                            <span className="text-gold font-black text-xl leading-none">
                                                {new Date(res.reservationDate).getDate()}
                                            </span>
                                            <span className="text-gold/60 text-[8px] uppercase font-black tracking-widest">
                                                {new Date(res.reservationDate).toLocaleString('default', { month: 'short' })}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-white font-bold text-lg mb-1">{res.occasion || 'Regular Visit'}</h4>
                                            <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gold/40" /> {res.reservationTime}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-gold/40" /> {res.numberOfGuests} Guests
                                                </span>
                                                {res.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3 text-gold/40" /> {res.phone}
                                                    </span>
                                                )}
                                            </div>
                                            {res.specialRequests && (
                                                <p className="text-gray-600 text-[10px] mt-1 italic">"{res.specialRequests}"</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColor(res.status)}`}>
                                            {res.status}
                                        </div>
                                        {res.paymentStatus === 'Pending' && (
                                            <span className="text-[8px] text-amber-400 font-black uppercase tracking-widest">
                                                Advance Pending
                                            </span>
                                        )}
                                        {res.paymentStatus === 'Paid' && (
                                            <span className="text-[8px] text-green-400 font-black uppercase tracking-widest">
                                                Advance Paid ✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Payment Instructions Modal ── */}
            <AnimatePresence>
                {showPaymentInfo && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-charcoal border border-white/10 p-10 md:p-14 rounded-[3rem] max-w-lg w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center relative"
                        >
                            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle className="w-10 h-10 text-gold" />
                            </div>
                            <h2 className="text-3xl font-serif font-black text-white mb-4">Almost Done!</h2>
                            <p className="text-gray-400 mb-8 leading-relaxed">
                                To confirm your booking, please send <strong className="text-white">Rs. 1,000</strong> to our account:
                            </p>

                            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 text-left space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold/40">Method</span>
                                    <span className="text-white font-bold">{lastReservation?.paymentMethod}</span>
                                </div>
                                <div className="border-t border-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold/40">Account Name</span>
                                    <span className="text-white font-bold">AK-7 RESTAURANT</span>
                                </div>
                                <div className="border-t border-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gold/40">Account Number</span>
                                    <span className="text-white font-bold text-lg tracking-wider">{PAYMENT_ACCOUNT}</span>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest font-black">
                                Send a screenshot to our WhatsApp after payment
                            </p>

                            <button
                                onClick={() => setShowPaymentInfo(false)}
                                className="w-full bg-gold text-charcoal font-black py-4 rounded-2xl shadow-xl shadow-gold/20 active:scale-95 transition-transform"
                            >
                                Got It — I Will Pay
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reservations;
