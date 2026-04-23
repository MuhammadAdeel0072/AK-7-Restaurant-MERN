import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { getPaymentConfig } from '../services/paymentService';
import { Truck, CreditCard, CheckCircle, ChevronRight, ChevronLeft, MapPin, Loader2, Smartphone, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const { user: profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    phoneNumber: '',
    address: '',
  });

  // Autofill User Info Logic
  useEffect(() => {
    if (profile) {
      setShippingAddress({
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = 0;
  const deliveryFee = subtotal > 50 ? 0 : 5;
  const total = subtotal + tax + deliveryFee;

  useEffect(() => {
    if (cartItems.length === 0 && !isSuccess) {
      navigate('/cart');
    }
  }, [cartItems, navigate, isSuccess]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const submitHandler = async () => {
    if (!shippingAddress.phoneNumber || !shippingAddress.address) {
      return toast.error('Phone and Address are required');
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Placing order...');
    try {
      const orderData = {
        orderItems: cartItems
          .filter(item => item.product) // Data Clean: Prevent errors by removing null IDs
          .map(item => ({
            product: item.product,
            name: item.name,
            qty: item.qty,
            image: item.image,
            price: item.price,
            customizations: item.customizations || []
          })),
        shippingAddress: {
          phoneNumber: shippingAddress.phoneNumber,
          address: shippingAddress.address
        },
        paymentMethod,
        paymentReference: paymentRef,
        isPaid: hasPaid,
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: deliveryFee,
        totalPrice: total,
      };

      const createdOrder = await createOrder(orderData);
      setIsSuccess(true);
      toast.dismiss(loadingToast);
      toast.success('Order placed successfully 🎉');
      dispatch({ type: 'CLEAR_CART' });
      navigate('/orders');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMsg = error.response?.data?.message || error.message || 'Order placement failed ❌';
      toast.error(errorMsg);
      console.error('Order submission failure:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Delivery', icon: MapPin },
    { id: 2, title: 'Payment Method', icon: CreditCard },
    { id: 3, title: 'Review Order', icon: CheckCircle },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      {/* Progress Stepper */}
      <div className="flex justify-between items-center mb-16 max-w-2xl mx-auto relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 -z-10"></div>
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gold transition-all duration-500 -translate-y-1/2 -z-10"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${step >= s.id ? 'bg-gold border-gold text-charcoal' : 'bg-charcoal border-white/10 text-gray-500'
              }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${step >= s.id ? 'text-gold' : 'text-gray-500'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="card-premium p-10 sm:p-12 shadow-2xl group hover:border-gold/20 transition-all">
                  <h2 className="text-3xl font-serif font-black text-white mb-10 border-b border-white/5 pb-6">Delivery Details</h2>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-gold tracking-widest block ml-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 focus:border-gold outline-none text-white transition-all font-bold shadow-inner"
                        placeholder="03XXXXXXXXX"
                        value={shippingAddress.phoneNumber}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value })}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-gold tracking-widest block ml-1">Complete Address</label>
                      <input
                        type="text"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 focus:border-gold outline-none text-white transition-all font-bold shadow-inner"
                        placeholder="House no, street, area, city"
                        value={shippingAddress.address}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const { phoneNumber, address } = shippingAddress;
                      if (!phoneNumber || !address) {
                        return toast.error('Both fields are required');
                      }
                      if (phoneNumber.length < 10) {
                        return toast.error('Check your phone number');
                      }
                      nextStep();
                    }}
                    className="mt-12 w-full bg-gold text-charcoal font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs shadow-2xl shadow-gold/20 hover:bg-yellow-400 active:scale-95 transition-all"
                  >
                    Continue to Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="card-premium p-10 sm:p-12 shadow-2xl group hover:border-gold/20 transition-all">
                  <h2 className="text-3xl font-serif font-black text-white mb-10 border-b border-white/5 pb-6">Payment Mode</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'EasyPaisa', icon: Smartphone, label: 'EasyPaisa' },
                      { id: 'JazzCash', icon: Smartphone, label: 'JazzCash' },
                      { id: 'Bank', icon: Landmark, label: 'Bank' },
                      { id: 'cod', icon: Truck, label: 'COD' }
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => { setPaymentMethod(m.id); setHasPaid(m.id === 'cod'); }}
                        className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${paymentMethod === m.id ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-white/5 bg-white/[0.01] hover:border-white/20'}`}
                      >
                        <m.icon className={`w-8 h-8 ${paymentMethod === m.id ? 'text-gold' : 'text-gray-500'}`} />
                        <h3 className={`font-black text-[10px] uppercase tracking-widest ${paymentMethod === m.id ? 'text-white' : 'text-gray-600'}`}>{m.label}</h3>
                      </div>
                    ))}
                  </div>

                  {paymentMethod !== 'cod' && (
                    <div className="mt-10 p-8 card-premium bg-gold/5 border border-gold/20 rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-center space-y-6">
                        <p className="text-gray-500 text-xs font-medium italic">Please send the total amount to the number below</p>
                        <div className="text-3xl font-black text-gold tracking-[0.2em] bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                          0300 0000000
                        </div>
                        <div className="space-y-3 text-left">
                          <label className="text-[10px] uppercase font-black text-gold/60 tracking-widest ml-1">Transaction Reference</label>
                          <input
                            type="text"
                            placeholder="Enter TRX-ID / REF-ID"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 focus:border-gold outline-none text-white transition-all text-center font-black tracking-widest shadow-inner placeholder:text-gray-700"
                          />
                        </div>
                        <button
                          onClick={() => {
                            if (paymentRef) { setHasPaid(true); toast.success('Payment Received'); }
                          }}
                          className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 ${hasPaid ? 'bg-green-500 text-white shadow-green-500/20 shadow-xl' : 'bg-gold text-charcoal shadow-gold/20 shadow-xl'}`}
                        >
                          {hasPaid ? 'Confirmed ✓' : 'Register Payment'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 mt-12">
                    <button onClick={prevStep} className="flex-1 bg-white/5 text-gray-500 hover:text-white font-black py-5 rounded-[2rem] border border-white/5 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] transition-all">
                      <ChevronLeft className="w-4 h-4" /> Go Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!hasPaid}
                      className="flex-[2] bg-gold text-charcoal font-black py-5 rounded-[2rem] border border-gold/20 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs shadow-2xl shadow-gold/20 hover:bg-yellow-400 active:scale-95 disabled:opacity-20 transition-all"
                    >
                      Review Reservation <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="card-premium p-10 sm:p-12 shadow-2xl group hover:border-gold/20 transition-all">
                  <h2 className="text-3xl font-serif font-black text-white mb-10 border-b border-white/5 pb-8">Order Review</h2>
                  <div className="space-y-8 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar mb-10">
                    {cartItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-8 group/item bg-white/[0.01] p-4 rounded-3xl border border-white/5">
                        <div className="w-20 h-20 shrink-0 relative">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-2xl shadow-lg" />
                          <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover/item:border-gold/30 transition-colors"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-serif font-bold text-white text-xl mb-1">{item.name}</h4>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            <span>Qty: {item.qty}</span>
                            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                            <span>Rs. {item.price} each</span>
                          </div>
                        </div>
                        <div className="font-black text-gold text-xl tracking-tighter">Rs. {(item.qty * item.price)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 border-t border-white/5">
                    <div className="card-premium bg-gold/5 border border-gold/10 p-8 flex items-center gap-6">
                      <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 shrink-0 shadow-lg">
                        <MapPin className="text-gold w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gold/60 font-black uppercase tracking-[0.2em] text-[10px] mb-2 opacity-80">Delivery Address</p>
                        <p className="text-white font-serif font-bold text-2xl truncate mb-1">{shippingAddress.address}</p>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-[9px]">Direct Delivery</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-12">
                    <button onClick={prevStep} className="flex-1 bg-white/5 text-gray-500 hover:text-white font-black py-5 rounded-[2rem] border border-white/5 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] transition-all">
                      <ChevronLeft className="w-4 h-4" /> Go Back
                    </button>
                    <button
                      onClick={submitHandler}
                      disabled={isSubmitting}
                      className="flex-[2] bg-crimson text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl shadow-crimson/20 active:scale-95 hover:bg-red-500 transition-all disabled:opacity-30 uppercase tracking-[0.2em] text-xs"
                    >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Order'}
                      {!isSubmitting && <CheckCircle className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2">
          <div className="card-premium p-10 sticky top-28 shadow-2xl bg-[#1a1a1a]/40 group hover:border-gold/30">
            <h3 className="text-2xl font-serif font-black text-white mb-10 border-b border-white/10 pb-6 uppercase tracking-widest">Summary</h3>
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                <span>Cart Subtotal</span>
                <span className="text-white text-base font-black">Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                <span>Exclusive Tax</span>
                <span className="text-white text-base font-black">Rs. {tax.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-sm">
                <span>Delivery Fee</span>
                <span className={`text-base font-black ${deliveryFee === 0 ? 'text-green-500' : 'text-white'}`}>
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                </span>
              </div>
            </div>
            <div className="pt-10 border-t border-white/10 flex flex-col gap-2">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-gold/60 mb-2">Total Amount</p>
              <p className="text-6xl font-serif font-black text-gold tracking-tighter leading-none">Rs. {total.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
