import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { createOrder, createPaymentIntent } from '../services/orderService';
import { getPaymentConfig } from '../services/paymentService';
import { Truck, CreditCard, CheckCircle, ChevronRight, ChevronLeft, MapPin, Loader2, Smartphone, Landmark, ExternalLink, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postalCode || '',
    country: 'USA',
  });

  const [paymentMethod, setPaymentMethod] = useState('EasyPaisa');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

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
  const tax = subtotal * 0.1;
  const deliveryFee = subtotal > 50 ? 0 : 5;
  const total = subtotal + tax + deliveryFee;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const submitHandler = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create Order
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item.product,
          name: item.name,
          qty: item.qty,
          image: item.image,
          price: item.price,
          customizations: item.customizations || []
        })),
        shippingAddress,
        paymentMethod,
        paymentReference: paymentRef,
        isPaid: hasPaid,
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: deliveryFee,
        totalPrice: total,
      };

      const createdOrder = await createOrder(orderData);
      
      // 2. If Stripe, we might need a separate step or modal for Card Element
      // For now, we'll mark as paid or redirect to success assuming COD/Mock
      
      toast.success('Order placed successfully!');
      dispatch({ type: 'CLEAR_CART' });
      navigate(`/order-success?id=${createdOrder._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Delivery', icon: MapPin },
    { id: 2, title: 'Payment', icon: CreditCard },
    { id: 3, title: 'Review', icon: CheckCircle },
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
              step >= s.id ? 'bg-gold border-gold text-charcoal' : 'bg-charcoal border-white/10 text-gray-500'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${step >= s.id ? 'text-gold' : 'text-gray-500'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl">
                  <h2 className="text-3xl font-serif font-bold text-white mb-8">Delivery Destination</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gold/60 tracking-widest ml-1">Street Address</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-gold/60 tracking-widest ml-1">City</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-gold/60 tracking-widest ml-1">Postal Code</label>
                            <input 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-gold outline-none text-white transition-all"
                                value={shippingAddress.postalCode}
                                onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                            />
                        </div>
                    </div>
                  </div>
                  <button onClick={nextStep} className="mt-10 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
                    Procced to Payment <ChevronRight className="w-4 h-4" />
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
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl">
                  <h2 className="text-3xl font-serif font-bold text-white mb-8">Payment Selection</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        onClick={() => { setPaymentMethod('EasyPaisa'); setHasPaid(false); }}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'EasyPaisa' ? 'border-gold bg-gold/5' : 'border-white/5 hover:border-gold/20'}`}
                    >
                        <Smartphone className={`w-8 h-8 mb-4 ${paymentMethod === 'EasyPaisa' ? 'text-gold' : 'text-gray-500'}`} />
                        <h3 className="font-bold text-lg">EasyPaisa</h3>
                        <p className="text-gray-500 text-[10px] uppercase font-black">Mobile Wallet</p>
                    </div>
                    <div 
                        onClick={() => { setPaymentMethod('JazzCash'); setHasPaid(false); }}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'JazzCash' ? 'border-gold bg-gold/5' : 'border-white/5 hover:border-gold/20'}`}
                    >
                        <Smartphone className={`w-8 h-8 mb-4 ${paymentMethod === 'JazzCash' ? 'text-gold' : 'text-gray-500'}`} />
                        <h3 className="font-bold text-lg">JazzCash</h3>
                        <p className="text-gray-500 text-[10px] uppercase font-black">Mobile Wallet</p>
                    </div>
                    <div 
                        onClick={() => { setPaymentMethod('Bank Transfer'); setHasPaid(false); }}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'Bank Transfer' ? 'border-gold bg-gold/5' : 'border-white/5 hover:border-gold/20'}`}
                    >
                        <Landmark className={`w-8 h-8 mb-4 ${paymentMethod === 'Bank Transfer' ? 'text-gold' : 'text-gray-500'}`} />
                        <h3 className="font-bold text-lg">Bank</h3>
                        <p className="text-gray-500 text-[10px] uppercase font-black">Direct Transfer</p>
                    </div>
                  </div>

                  {/* Payment Instructions Simulation */}
                  <div className="mt-8 p-8 bg-gold/5 border border-gold/20 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="text-white font-serif font-bold text-lg mb-4 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-gold" />
                      Payment Instructions
                    </h4>
                    
                    {paymentMethod === 'EasyPaisa' && (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Send <span className="text-white font-bold">Rs. {total.toFixed(0)}</span> to the EasyPaisa number below:</p>
                        <div className="text-2xl font-black text-gold tracking-widest bg-charcoal/50 p-4 rounded-xl border border-white/5 text-center">
                          {paymentConfig?.easypaisaNumber || '0300 1234567'}
                        </div>
                        <button 
                          onClick={() => window.open('https://easypaisa.com.pk')}
                          className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold py-3 rounded-xl border border-gold/20 transition-all text-xs font-black uppercase tracking-widest"
                        >
                          <ExternalLink className="w-4 h-4" /> Open EasyPaisa
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'JazzCash' && (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Send <span className="text-white font-bold">Rs. {total.toFixed(0)}</span> to the JazzCash number below:</p>
                        <div className="text-2xl font-black text-gold tracking-widest bg-charcoal/50 p-4 rounded-xl border border-white/5 text-center">
                          {paymentConfig?.jazzcashNumber || '0300 7654321'}
                        </div>
                        <button 
                          onClick={() => window.open('https://jazzcash.com.pk')}
                          className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold py-3 rounded-xl border border-gold/20 transition-all text-xs font-black uppercase tracking-widest"
                        >
                          <ExternalLink className="w-4 h-4" /> Open JazzCash
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'Bank Transfer' && (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Transfer <span className="text-white font-bold">Rs. {total.toFixed(0)}</span> to the following bank account:</p>
                        <div className="bg-charcoal/50 p-6 rounded-xl border border-white/5 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-500 text-[10px] font-black uppercase">Bank</span>
                            <span className="text-white font-bold text-sm">{paymentConfig?.bankName || 'Habib Bank Limited (HBL)'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 text-[10px] font-black uppercase">Account #</span>
                            <span className="text-gold font-bold text-sm">{paymentConfig?.bankAccount || '1234567890123456'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 text-[10px] font-black uppercase">Account Title</span>
                            <span className="text-white font-bold text-sm">{paymentConfig?.accountTitle || 'AK-7 RESTAURANT'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/5">
                      <p className="text-gray-500 text-xs mb-4">After payment, please enter your transaction ID or reference below:</p>
                      <input 
                        type="text"
                        placeholder="TRX-123456789"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-gold outline-none text-white transition-all text-sm mb-4"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          if (!paymentRef.trim()) {
                            toast.error('Please enter payment reference');
                            return;
                          }
                          setHasPaid(true);
                          toast.success('Payment recorded! You can now proceed.', { icon: '💰' });
                        }}
                        className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${hasPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gold text-charcoal shadow-lg shadow-gold/10'}`}
                      >
                        {hasPaid ? '✓ Reference Recorded' : 'I have paid'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button onClick={prevStep} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                      onClick={nextStep} 
                      disabled={!hasPaid}
                      className="flex-[2] bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Review Order <ChevronRight className="w-4 h-4" />
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
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl">
                  <h2 className="text-3xl font-serif font-bold text-white mb-8">Exquisite Selection Review</h2>
                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                    {cartItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-6 group">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                <p className="text-[10px] text-gray-500 font-medium">{item.qty} x ₹{item.price}</p>
                            </div>
                            <div className="font-black text-gold text-sm tracking-tighter">₹{(item.qty * item.price)}</div>
                        </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center bg-gold/5 p-5 rounded-2xl border border-gold/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                                <MapPin className="text-gold w-5 h-5" />
                            </div>
                            <div className="text-xs">
                                <p className="text-white font-black uppercase tracking-widest text-[8px] mb-1 opacity-50">Delivery Address</p>
                                <p className="text-white font-bold">{shippingAddress.address}</p>
                                <p className="text-gray-500 font-medium">{shippingAddress.city}, {shippingAddress.postalCode}</p>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button onClick={prevStep} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button 
                        onClick={submitHandler} 
                        disabled={isSubmitting}
                        className="flex-[2] bg-gold text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gold/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Executive Order'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mini Summary */}
        <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] sticky top-28 backdrop-blur-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-colors"></div>
                
                <h3 className="text-xl font-serif font-bold text-white mb-8 border-b border-white/5 pb-4">Order Summary</h3>
                <div className="space-y-5 mb-8">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="text-white font-bold">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">GST & Services (10%)</span>
                        <span className="text-white font-bold">₹{tax.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Delivery Surcharge</span>
                        <span className={`font-bold ${deliveryFee === 0 ? 'text-green-500' : 'text-white'}`}>
                            {deliveryFee === 0 ? 'COMPLIMENTARY' : `₹${deliveryFee}`}
                        </span>
                    </div>
                </div>
                <div className="flex justify-between items-end pt-6 border-t-2 border-dashed border-white/10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-1">Total Amount</p>
                        <p className="text-4xl font-serif font-black text-gold tracking-tighter">₹{total.toFixed(0)}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
