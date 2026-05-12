import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Plus, Minus, Check, ChevronRight, Loader2, Package, ShoppingCart, Trash2, Edit3, X, Zap, CalendarDays } from 'lucide-react';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const PlanEditor = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [activeEditingDay, setActiveEditingDay] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [restaurantSchedule, setRestaurantSchedule] = useState([]);

  // Subscription Logic States
  const [duration, setDuration] = useState('1W'); // '1W', '2W', '1M', '2M'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [selectedDays, setSelectedDays] = useState([]);
  const [schedule, setSchedule] = useState({}); // { 'Monday': { time: '20:00', items: [] } }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const durationOptions = [
    { label: '1 Week', value: '1W', weeks: 1 },
    { label: '2 Weeks', value: '2W', weeks: 2 },
    { label: '1 Month', value: '1M', weeks: 4 },
    { label: '2 Months', value: '2M', weeks: 8 },
  ];

  const getAvailableTimes = (day) => {
    const dayConfig = restaurantSchedule.find(d => d.day === day);
    if (!dayConfig || !dayConfig.isOpen) return [];

    const times = [];
    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    let startMinutes = parseTime(dayConfig.openTime);
    let endMinutes = parseTime(dayConfig.closeTime);

    if (endMinutes <= startMinutes) endMinutes += 1440; // Add 24 hours for midnight crossing

    for (let m = startMinutes; m <= endMinutes; m += 30) {
        const h = Math.floor(m / 60) % 24;
        const mins = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        times.push({ label: `${displayH}:${String(mins).padStart(2, '0')} ${ampm}`, value: timeStr });
    }
    return times;
  };

  useEffect(() => {
    fetchProducts();
    fetchRestaurantSchedule();
    if (id) fetchPlan();
  }, [id]);

  const fetchRestaurantSchedule = async () => {
    try {
      const { data } = await apiClient.get('/schedule');
      setRestaurantSchedule(data || []);
    } catch (err) {
      console.error('Failed to load schedule', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get('/products');
      setProducts(data || []);
    } catch (err) {
      toast.error('Failed to load menu');
    }
  };

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/subscriptions/${id}`);
      if (data && data.schedule) {
        const newSchedule = {};
        const newSelectedDays = [];
        
        data.schedule.forEach(s => {
          newSelectedDays.push(s.day);
          newSchedule[s.day] = {
            time: s.time,
            items: s.items.map(i => ({
              itemKey: `${i.product?._id || i.product}-${i.size}`,
              _id: i.product?._id || i.product,
              name: i.name,
              qty: i.qty,
              size: i.size,
              price: i.price,
              image: i.product?.image || ''
            }))
          };
        });
        
        setSelectedDays(newSelectedDays);
        setSchedule(newSchedule);
        if (data.duration) {
          const opt = durationOptions.find(o => o.label === data.duration);
          if (opt) setDuration(opt.value);
        }
        if (data.startDate) setStartDate(new Date(data.startDate).toISOString().split('T')[0]);
      }
    } catch (err) {
      toast.error('Failed to load plan details');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const endDate = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const option = durationOptions.find(o => o.value === duration);
    const end = new Date(start);
    end.setDate(start.getDate() + (option.weeks * 7));
    return end.toISOString().split('T')[0];
  }, [startDate, duration]);

  const toggleDay = (day) => {
    const dayConfig = restaurantSchedule.find(d => d.day === day);
    if (dayConfig && !dayConfig.isOpen) {
        toast.error(`DineXis is closed on ${day}`, {
            icon: '🏪',
            style: { background: '#1a1d21', color: '#fff', border: '1px solid rgba(212,175,55,0.2)' }
        });
        return;
    }

    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const newSchedule = { ...schedule };
      delete newSchedule[day];
      setSchedule(newSchedule);
    } else {
      const availableTimes = getAvailableTimes(day);
      const defaultTime = availableTimes.length > 0 ? availableTimes[0].value : '20:00';
      
      setSelectedDays([...selectedDays, day]);
      setSchedule({
        ...schedule,
        [day]: { time: defaultTime, items: [] }
      });
    }
  };

  const handleTimeChange = (day, time) => {
    setSchedule({
      ...schedule,
      [day]: { ...schedule[day], time }
    });
  };

  const openMenuForDay = (day) => {
    setActiveEditingDay(day);
    setShowMenuModal(true);
  };

  const toggleItemForDay = (product, variantName, variantPrice) => {
    const dayData = schedule[activeEditingDay];
    const itemKey = `${product._id}-${variantName}`;
    const exists = dayData.items.find(i => i.itemKey === itemKey);

    let newItems;
    if (exists) {
      newItems = dayData.items.filter(i => i.itemKey !== itemKey);
    } else {
      newItems = [
        ...dayData.items,
        {
          itemKey,
          _id: product._id,
          name: product.name,
          qty: 1,
          size: variantName,
          price: variantPrice,
          image: product.image
        }
      ];
    }

    setSchedule({
      ...schedule,
      [activeEditingDay]: { ...dayData, items: newItems }
    });
  };

  const updateQtyForDay = (day, itemKey, delta) => {
    const dayData = schedule[day];
    const newItems = dayData.items.map(i => {
      if (i.itemKey === itemKey) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    });

    setSchedule({
      ...schedule,
      [day]: { ...dayData, items: newItems }
    });
  };

  const removeItemFromDay = (day, itemKey) => {
    const dayData = schedule[day];
    const newItems = dayData.items.filter(i => i.itemKey !== itemKey);
    setSchedule({
      ...schedule,
      [day]: { ...dayData, items: newItems }
    });
  };

  const calculateWeeklyTotal = () => {
    return Object.values(schedule).reduce((acc, dayData) => {
      return acc + dayData.items.reduce((dayAcc, item) => dayAcc + (item.price * item.qty), 0);
    }, 0);
  };

  const calculateFullTotal = () => {
    const weekly = calculateWeeklyTotal();
    const weeks = durationOptions.find(o => o.value === duration).weeks;
    return weekly * weeks;
  };

  const totalMeals = () => {
    const dailyMeals = Object.values(schedule).reduce((acc, dayData) => {
      return acc + dayData.items.reduce((dayAcc, item) => dayAcc + item.qty, 0);
    }, 0);
    const weeks = durationOptions.find(o => o.value === duration).weeks;
    return dailyMeals * weeks;
  };

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast.error('Select at least one day for your plan');
      return;
    }

    for (const day of selectedDays) {
      if (!schedule[day].items || schedule[day].items.length === 0) {
        toast.error(`Please select items for ${day}`);
        return;
      }
      
      // Time Validation
      const dayConfig = restaurantSchedule.find(d => d.day === day);
      if (dayConfig && dayConfig.isOpen) {
        const selectedTime = schedule[day].time;
        const { openTime, closeTime } = dayConfig;
        
        const isWithinRange = (time, open, close) => {
          if (open <= close) {
            return time >= open && time <= close;
          } else {
            // Handles midnight span (e.g., 17:00 to 02:00)
            return time >= open || time <= close;
          }
        };

        if (!isWithinRange(selectedTime, openTime, closeTime)) {
          toast.error(`${day} delivery must be between ${openTime} and ${closeTime}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || user.phoneNumber,
        address: user.address || (user.addresses && user.addresses[0]?.address) || 'Profile Address',
        duration: durationOptions.find(o => o.value === duration).label,
        mealsPerDay: selectedDays.length > 0 ? schedule[selectedDays[0]].items.reduce((acc, i) => acc + i.qty, 0) : 1,
        deliveryDays: selectedDays,
        deliveryTime: selectedDays.length > 0 ? schedule[selectedDays[0]].time : '20:00',
        startDate,
        endDate,
        totalPrice: calculateFullTotal(),
        schedule: selectedDays.map(day => ({
          day,
          time: schedule[day].time,
          items: schedule[day].items.map(i => ({
            product: i._id,
            name: i.name,
            qty: i.qty,
            size: i.size,
            price: i.price,
            customizations: i.customizations
          }))
        }))
      };

      if (id) {
        await apiClient.put(`/subscriptions/${id}`, payload);
        toast.success('Gourmet plan updated successfully');
        navigate('/plans');
      } else {
        const { data } = await apiClient.post('/subscriptions', payload);
        setPendingSubscriptionId(data._id);
        setShowPaymentModal(true);
        toast.success('Plan created. Please complete payment to activate.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setIsActivating(true);
    try {
      await apiClient.post(`/subscriptions/${pendingSubscriptionId}/activate`);
      toast.success('Payment successful! Your gourmet plan is now active.', {
        icon: '💎',
        duration: 5000
      });
      navigate('/plans');
    } catch (err) {
      toast.error('Payment verification failed. Please contact support.');
    } finally {
      setIsActivating(false);
      setShowPaymentModal(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
        <div>
          <Link to="/plans" className="flex items-center gap-2 text-white/40 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-4 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Plans
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
            {id ? 'Edit' : 'Start'} Food Plan
          </h1>
          <p className="text-gold/60 font-black uppercase tracking-widest text-[10px] mt-2">Tailor your weekly gourmet schedule</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl w-full xl:w-auto">
            <div className="grid grid-cols-2 gap-8 pr-8 border-r border-white/5">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-1">Total Meals</p>
                   <p className="text-2xl font-black text-white">{totalMeals()} <span className="text-xs text-gray-600">Items</span></p>
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-1">Total Price</p>
                   <p className="text-2xl font-black text-white">Rs. {calculateFullTotal()}</p>
                </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSubmitting || selectedDays.length === 0}
              className="bg-gold hover:bg-yellow-400 text-charcoal px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-[0_20px_40px_rgba(212,175,55,0.2)] disabled:opacity-30 disabled:grayscale active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {id ? 'UPDATE' : 'START PLAN'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT COLUMN: CONFIG */}
        <div className="lg:col-span-1 space-y-8">
            {/* Step 1: Duration & Dates */}
            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 group-hover:bg-gold transition-colors"></div>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-serif font-black text-white uppercase tracking-tight">How long?</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-10">
                {durationOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={`px-4 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      duration === opt.value ? 'bg-gold text-charcoal border-gold shadow-lg shadow-gold/10' : 'bg-white/5 border-white/5 text-gray-500 hover:border-gold/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                  <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gold/60 ml-2">Start Date</label>
                      <input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-gold rounded-2xl p-5 outline-none text-white transition-all font-bold text-sm [color-scheme:dark]"
                      />
                  </div>
                  <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gold/60 ml-2">Ends on</label>
                      <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-gray-500 font-bold flex items-center justify-between shadow-inner">
                        <span className="text-sm">{endDate || '---'}</span>
                        <CalendarDays className="w-4 h-4 text-white/10" />
                      </div>
                  </div>
              </div>
            </section>

            {/* Step 2: Day Selection */}
            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
               <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-xl font-serif font-black text-white uppercase tracking-tight">Days</h2>
               </div>
              
              <div className="flex flex-wrap gap-2">
                {days.map(d => {
                  const dayConfig = restaurantSchedule.find(sch => sch.day === d);
                  const isClosed = dayConfig && !dayConfig.isOpen;
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      disabled={isClosed}
                      className={`px-4 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all relative ${
                        selectedDays.includes(d) 
                          ? 'bg-gold/20 text-gold border-gold/50' 
                          : isClosed
                            ? 'bg-white/[0.01] border-white/5 text-white/10 cursor-not-allowed'
                            : 'bg-white/5 border-white/5 text-gray-600 hover:border-gold/30'
                      }`}
                    >
                      {d}
                      {isClosed && (
                        <div className="absolute -top-1 -right-1">
                          <X className="w-3 h-3 text-red-500/40" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedDays.length === 0 && (
                  <p className="text-[9px] text-gray-600 mt-4 italic">Please select at least one recurring day.</p>
              )}
            </section>
          </div>

        {/* RIGHT COLUMN: PER-DAY CONFIG */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {selectedDays.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-32 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center"
                        >
                            <Package className="w-16 h-16 text-white/5 mb-6" />
                            <h3 className="text-xl font-serif font-black text-white/20 uppercase tracking-widest">Select recurring days to begin</h3>
                        </motion.div>
                    ) : (
                        selectedDays.map(day => (
                        <motion.div
                            key={day}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl flex flex-col hover:border-gold/30 transition-all group h-full shadow-lg"
                        >
                            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01]">
                                <div>
                                    <h3 className="text-2xl font-serif font-black text-white">{day}</h3>
                                    {restaurantSchedule.find(d => d.day === day) && (
                                        <p className="text-[9px] font-black text-gold/40 uppercase tracking-widest mt-1">
                                            Open: {restaurantSchedule.find(d => d.day === day).openTime} - {restaurantSchedule.find(d => d.day === day).closeTime}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Delivery:</span>
                                    <select
                                        value={schedule[day]?.time}
                                        onChange={(e) => handleTimeChange(day, e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gold outline-none focus:border-gold/50 cursor-pointer"
                                    >
                                        {getAvailableTimes(day).map(opt => (
                                            <option key={opt.value} value={opt.value} className="bg-charcoal text-white">{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-8 flex-grow flex flex-col">
                            <div className="space-y-4 mb-8 flex-grow">
                                {schedule[day]?.items.length === 0 ? (
                                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center h-full">
                                    <Plus className="w-8 h-8 text-white/5 mb-4" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">Empty Slot</p>
                                </div>
                                ) : (
                                schedule[day]?.items.map(item => (
                                    <div key={item.itemKey} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 group/item hover:border-gold/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                        <p className="text-white font-black text-sm leading-tight uppercase tracking-tight">{item.name}</p>
                                        <p className="text-[10px] text-gold/60 font-black uppercase tracking-widest mt-1">{item.size} • Rs. {item.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/5">
                                        <button onClick={() => updateQtyForDay(day, item.itemKey, -1)} className="p-1 hover:text-gold transition-colors text-white/40"><Minus className="w-3 h-3" /></button>
                                        <span className="text-xs font-black w-4 text-center text-white">{item.qty}</span>
                                        <button onClick={() => updateQtyForDay(day, item.itemKey, 1)} className="p-1 hover:text-gold transition-colors text-white/40"><Plus className="w-3 h-3" /></button>
                                        </div>
                                        <button onClick={() => removeItemFromDay(day, item.itemKey)} className="text-white/10 hover:text-crimson transition-colors">
                                        <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    </div>
                                ))
                                )}
                            </div>

                            <button
                                onClick={() => openMenuForDay(day)}
                                className="w-full py-5 rounded-2xl border border-gold/10 text-gold hover:bg-gold hover:text-charcoal transition-all font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 shadow-inner"
                            >
                                <Edit3 className="w-4 h-4" /> {schedule[day]?.items.length > 0 ? 'EDIT MEALS' : 'ASSIGN MEALS'}
                            </button>
                            </div>
                        </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* Menu Selection Modal */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-charcoal/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-charcoal border border-white/10 rounded-[3rem] md:rounded-[4rem] overflow-hidden max-w-6xl w-full h-[90vh] shadow-[0_60px_120px_rgba(0,0,0,0.8)] flex flex-col relative"
            >
              <div className="p-10 md:p-14 border-b border-white/5 flex justify-between items-center sticky top-0 bg-charcoal/80 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-4xl font-serif font-black text-white mb-2 uppercase tracking-tight">Gourmet Selection <span className="text-gold">/ {activeEditingDay}</span></h2>
                  <p className="text-gold/40 text-[10px] font-black uppercase tracking-[0.4em]">Assigning to {schedule[activeEditingDay]?.time} slot</p>
                </div>
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="p-5 bg-white/5 hover:bg-gold text-white hover:text-charcoal rounded-[1.5rem] transition-all border border-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-10 md:p-14 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.filter(p => p.isAvailable).map(product => (
                    <div key={product._id} className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col group/prod hover:border-gold/20 transition-all">
                      <div className="h-56 overflow-hidden relative">
                        <img src={product.image} className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
                        <h4 className="absolute bottom-6 left-8 text-white font-serif font-black text-2xl leading-none">{product.name}</h4>
                      </div>
                      
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gold/40 mb-2">Available Variants</p>
                          <div className="flex flex-col gap-2">
                            {(product.variants && product.variants.length > 0 ? product.variants : [{ name: 'Regular', price: product.price }]).map(v => {
                              const itemKey = `${product._id}-${v.name}`;
                              const isSelected = schedule[activeEditingDay]?.items.find(i => i.itemKey === itemKey);
                              return (
                                <button
                                  key={v.name}
                                  onClick={() => toggleItemForDay(product, v.name, v.price)}
                                  className={`px-6 py-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/v ${
                                    isSelected ? 'bg-gold text-charcoal border-gold shadow-xl shadow-gold/10' : 'bg-black/20 border-white/5 text-gray-500 hover:border-gold/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-charcoal' : 'bg-gold'}`} />
                                      <span>{v.name}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className={isSelected ? 'text-charcoal/60' : 'text-gold'}>Rs. {v.price}</span>
                                      {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 opacity-20 group-hover/v:opacity-100 transition-opacity" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 md:p-14 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-8">
                 <div className="flex items-center gap-6">
                     <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-1">Selected</p>
                        <p className="text-2xl font-black text-white">{schedule[activeEditingDay]?.items.length} <span className="text-xs text-gray-600 uppercase tracking-widest">Meals</span></p>
                     </div>
                     <div className="w-px h-10 bg-white/5"></div>
                     <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gold/40 mb-1">Daily Subtotal</p>
                        <p className="text-2xl font-black text-white">Rs. {schedule[activeEditingDay]?.items.reduce((acc, i) => acc + (i.price * i.qty), 0)}</p>
                     </div>
                 </div>
                 <button
                   onClick={() => setShowMenuModal(false)}
                   className="w-full sm:w-auto bg-gold text-charcoal px-14 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                 >
                   Confirm Slot Meals
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-charcoal border border-gold/20 rounded-[3rem] overflow-hidden max-w-lg w-full shadow-[0_0_100px_rgba(212,175,55,0.15)] relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
              
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                   <ShoppingCart className="w-10 h-10 text-gold" />
                </div>
                
                <h2 className="text-3xl font-serif font-black text-white mb-4 uppercase tracking-tight">Secure Checkout</h2>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
                  You are about to start your <span className="text-white">Gourmet Food Plan</span>. 
                  Payment of <span className="text-gold font-black">Rs. {calculateFullTotal()}</span> is required to activate your weekly delivery schedule.
                </p>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-10 space-y-4 text-left">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gold/40">Subscription</span>
                      <span className="text-white">{durationOptions.find(o => o.value === duration).label}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gold/40">Start Date</span>
                      <span className="text-white">{startDate}</span>
                   </div>
                   <div className="h-px bg-white/5 w-full"></div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-white">Total Due</span>
                      <span className="text-xl font-black text-gold">Rs. {calculateFullTotal()}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handlePaymentSuccess}
                    disabled={isActivating}
                    className="bg-gold hover:bg-yellow-400 text-charcoal py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-xl shadow-gold/20 active:scale-95 disabled:opacity-50"
                  >
                    {isActivating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>CONFIRM & PAY NOW</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate('/plans');
                    }}
                    disabled={isActivating}
                    className="py-5 text-[9px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-white transition-all"
                  >
                    Pay Later
                  </button>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-3 opacity-20 grayscale">
                   <Check className="w-3 h-3 text-gold" />
                   <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Bank Grade Security SSL</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanEditor;
