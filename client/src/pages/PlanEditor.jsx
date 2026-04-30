import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Plus, Minus, Check, ChevronRight, Loader2, Package, ShoppingCart, Trash2, Edit3, X } from 'lucide-react';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PlanEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [activeEditingDay, setActiveEditingDay] = useState(null);

  // Form State
  const [selectedDays, setSelectedDays] = useState([]);
  const [schedule, setSchedule] = useState({}); // { 'Monday': { time: '20:00', items: [] } }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeOptions = [
    { label: '12:00 PM', value: '12:00' },
    { label: '02:00 PM', value: '14:00' },
    { label: '04:00 PM', value: '16:00' },
    { label: '06:00 PM', value: '18:00' },
    { label: '08:00 PM', value: '20:00' },
    { label: '10:00 PM', value: '22:00' },
  ];

  useEffect(() => {
    fetchProducts();
    if (id) fetchPlan();
  }, [id]);

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
              itemKey: `${i.product._id || i.product}-${i.size}`,
              _id: i.product._id || i.product,
              name: i.name,
              qty: i.qty,
              size: i.size,
              price: i.price,
              image: i.product.image
            }))
          };
        });
        
        setSelectedDays(newSelectedDays);
        setSchedule(newSchedule);
      }
    } catch (err) {
      toast.error('Failed to load plan details');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const newSchedule = { ...schedule };
      delete newSchedule[day];
      setSchedule(newSchedule);
    } else {
      setSelectedDays([...selectedDays, day]);
      setSchedule({
        ...schedule,
        [day]: { time: '20:00', items: [] }
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

  const toggleItemForDay = (product, sizeObj) => {
    const dayData = schedule[activeEditingDay];
    const itemKey = `${product._id}-${sizeObj.name}`;
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
          size: sizeObj.name,
          price: sizeObj.price,
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

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast.error('Select at least one day for your plan');
      return;
    }

    // Validation: Each day must have at least one item
    for (const day of selectedDays) {
      if (!schedule[day].items || schedule[day].items.length === 0) {
        toast.error(`Please select items for ${day}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        schedule: selectedDays.map(day => ({
          day,
          time: schedule[day].time,
          items: schedule[day].items.map(i => ({
            product: i._id,
            name: i.name,
            qty: i.qty,
            size: i.size,
            price: i.price
          }))
        }))
      };

      if (id) {
        await apiClient.put(`/subscriptions/${id}`, payload);
        toast.success('Plan updated successfully');
      } else {
        await apiClient.post('/subscriptions', payload);
        toast.success('Meal plan activated');
      }
      navigate('/plans');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return Object.values(schedule).reduce((acc, dayData) => {
      return acc + dayData.items.reduce((dayAcc, item) => dayAcc + (item.price * item.qty), 0);
    }, 0);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <Link to="/plans" className="flex items-center gap-2 text-gold/40 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </Link>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">{id ? 'Edit' : 'Create'} Plan</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs">Configure your recurring gourmet schedule</p>
        </div>

        <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gold/40 mb-1">Weekly Subtotal</p>
              <p className="text-3xl font-bold text-white">Rs. {calculateTotal()}</p>
           </div>
           <button
             onClick={handleSave}
             disabled={isSubmitting || selectedDays.length === 0}
             className="bg-gold hover:bg-yellow-400 text-charcoal px-10 py-5 rounded-[1.5rem] font-bold text-sm tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-gold/20 disabled:opacity-30 disabled:grayscale"
           >
             {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
             {id ? 'UPDATE' : 'ACTIVATE'}
           </button>
        </div>
      </div>

      <div className="space-y-12">
        {/* Step 1: Day Selection */}
        <section className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                <Calendar className="w-5 h-5 text-gold" />
             </div>
             <h2 className="text-2xl font-serif font-bold text-white">Select Days</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {days.map(d => (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={`px-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedDays.includes(d) ? 'bg-gold text-charcoal border-gold shadow-lg shadow-gold/20' : 'bg-white/5 border-white/5 text-gray-500 hover:border-gold/30'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Per-Day Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {selectedDays.map(day => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl flex flex-col hover:border-gold/30 transition-all group"
              >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <h3 className="text-2xl font-serif font-bold text-white">{day}</h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={schedule[day]?.time}
                      onChange={(e) => handleTimeChange(day, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gold outline-none focus:border-gold/50 cursor-pointer"
                    >
                      {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-charcoal text-white">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-8 flex-grow">
                  <div className="space-y-4 mb-8">
                    {schedule[day]?.items.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                        <Package className="w-10 h-10 text-white/5 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No items assigned</p>
                      </div>
                    ) : (
                      schedule[day]?.items.map(item => (
                        <div key={item.itemKey} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group/item">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                              <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
                              <p className="text-[10px] text-gold/60 font-black uppercase tracking-widest mt-1">{item.size} • Rs. {item.price}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                              <button onClick={() => updateQtyForDay(day, item.itemKey, -1)} className="p-1 hover:text-gold transition-colors"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateQtyForDay(day, item.itemKey, 1)} className="p-1 hover:text-gold transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => removeItemFromDay(day, item.itemKey)} className="text-gray-600 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => openMenuForDay(day)}
                    className="w-full py-5 rounded-[1.5rem] border border-gold/20 text-gold hover:bg-gold hover:text-charcoal transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                  >
                    <Edit3 className="w-4 h-4" /> {schedule[day]?.items.length > 0 ? 'EDIT ITEMS' : 'ASSIGN FOOD'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-charcoal border border-white/10 rounded-[3.5rem] overflow-hidden max-w-5xl w-full h-[85vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col relative"
            >
              <div className="p-10 border-b border-white/5 flex justify-between items-center sticky top-0 bg-charcoal/90 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-white mb-2">Select Food for <span className="text-gold">{activeEditingDay}</span></h2>
                  <p className="text-gold/40 text-[10px] font-black uppercase tracking-widest">Assigning to {schedule[activeEditingDay]?.time} slot</p>
                </div>
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="p-4 bg-white/5 hover:bg-gold text-white hover:text-charcoal rounded-2xl transition-all"
                >
                  <Check className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {products.filter(p => p.isAvailable).map(product => (
                    <div key={product._id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                      <div className="h-48 overflow-hidden relative">
                        <img src={product.image} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <h4 className="absolute bottom-6 left-6 text-white font-bold text-xl">{product.name}</h4>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gold/40">Choose Size & Add</p>
                          <div className="flex flex-wrap gap-2">
                            {(product.sizes || [{ name: 'Regular', price: product.price }]).map(size => {
                              const itemKey = `${product._id}-${size.name}`;
                              const isSelected = schedule[activeEditingDay]?.items.find(i => i.itemKey === itemKey);
                              return (
                                <button
                                  key={size.name}
                                  onClick={() => toggleItemForDay(product, size)}
                                  className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-3 ${
                                    isSelected ? 'bg-gold text-charcoal border-gold shadow-lg shadow-gold/20' : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold/40'
                                  }`}
                                >
                                  <span className="text-lg">{size.name}</span>
                                  <span className={`font-black text-lg ${isSelected ? 'text-charcoal/60' : 'text-gold'}`}>Rs. {size.price}</span>
                                  {isSelected && <Check className="w-4 h-4" />}
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

              <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                 <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {schedule[activeEditingDay]?.items.length} Items Selected
                 </div>
                 <button
                   onClick={() => setShowMenuModal(false)}
                   className="bg-gold text-charcoal px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gold/20 hover:scale-105 transition-all"
                 >
                   Confirm Selection
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanEditor;
