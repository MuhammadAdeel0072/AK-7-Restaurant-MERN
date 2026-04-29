import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, CheckCircle } from 'lucide-react';
import SmartCartSuggestions from '../components/SmartCartSuggestions';

const Cart = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const navigate = useNavigate();

  const removeFromCartHandler = (item) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: item });
    toast.success(`${item.name} removed from cart 🗑️`);
  };

  const updateQtyHandler = (item, qty) => {
    if (qty > 0 && (item.countInStock === undefined || qty <= item.countInStock)) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: { ...item, qty: Number(qty) },
      });
      toast.success(`${item.name} quantity updated ✅`);
    } else if (qty > item.countInStock) {
      toast.error('Not enough stock available ❌');
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const tax = 0;
  const deliveryFee = subtotal > 50 ? 0 : 5;
  const total = subtotal + tax + deliveryFee;
  const estimatedPoints = Math.floor(total * 10);

  const checkoutHandler = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-serif font-bold text-white mb-2">My Cart</h1>
          <p className="text-gold/60 font-medium tracking-widest uppercase text-xs italic">Order Summary</p>
        </div>
        <Link to="/menu" className="flex items-center gap-2 text-gray-400 hover:text-gold transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Menu
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="card-premium p-24 text-center">
          <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-gold/20">
            <ShoppingBag className="w-12 h-12 text-gold/60" />
          </div>
          <p className="text-4xl text-white font-serif font-black mb-10">Your cart is empty</p>
          <Link to="/menu" className="inline-flex items-center gap-4 bg-gold text-charcoal px-12 py-5 rounded-[2rem] font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gold/30 uppercase tracking-[0.2em] text-xs">
            Begin Dining <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-10">
            {cartItems.map((item, index) => (
              <div key={`${item.product}-${index}`} className="card-premium p-10 flex flex-col md:flex-row items-center gap-10 group hover:border-gold/30">
                <div className="w-40 h-40 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-700">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[2.5rem] shadow-2xl" />
                  <div className="absolute inset-0 rounded-[2.5rem] border-2 border-white/10 group-hover:border-gold/30 transition-colors"></div>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-3xl font-serif font-black text-white group-hover:text-gold transition-colors">{item.name}</h3>
                    <div className="text-3xl font-black text-gold">Rs. {(item.qty * item.price).toFixed(0)}</div>
                  </div>
                  <p className="text-gray-500 text-sm mb-8 line-clamp-2 italic font-medium">"{item.description}"</p>
                  
                  <div className="flex items-center justify-center md:justify-start gap-8">
                    <div className="flex items-center gap-5 bg-white/[0.03] p-2 rounded-[1.5rem] border border-white/10 shadow-inner">
                      <button 
                        onClick={() => updateQtyHandler(item, item.qty - 1)}
                        className="p-3 bg-white/5 hover:bg-gold hover:text-charcoal rounded-xl transition-all active:scale-90"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-10 text-center font-black text-2xl text-white">{item.qty}</span>
                      <button 
                        onClick={() => updateQtyHandler(item, item.qty + 1)}
                        className="p-3 bg-white/5 hover:bg-gold hover:text-charcoal rounded-xl transition-all active:scale-90"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCartHandler(item)}
                      className="text-gray-600 hover:text-red-500 p-3 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-500/20 rounded-2xl"
                    >
                      <Trash2 className="w-5 h-5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Smart Recommendations */}
            <SmartCartSuggestions />
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card-premium p-12 sticky top-28 shadow-2xl bg-[#1a1a1a]/40 group hover:border-gold/30">
              <h2 className="text-3xl font-serif font-black mb-10 text-white border-b border-white/5 pb-8">Order Summary</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex justify-between text-gray-500 text-sm font-black uppercase tracking-widest">
                  <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} Items)</span>
                  <span className="text-white">Rs. {subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm font-black uppercase tracking-widest">
                  <span>Service Tax</span>
                  <span className="text-green-500">Free</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm font-black uppercase tracking-widest">
                  <span>Logistics</span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-500 font-black tracking-[0.2em] bg-green-500/10 px-3 py-1.5 rounded-full text-[9px]">COMPLIMENTARY</span>
                  ) : (
                    <span className="text-white">Rs. {deliveryFee.toFixed(0)}</span>
                  )}
                </div>
                
                <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                   <div className="flex justify-between items-center w-full text-4xl font-serif font-black text-white">
                    <span>Total</span>
                    <span className="text-gold">Rs. {total.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gold/60 bg-gold/5 w-fit px-4 py-2 rounded-full mt-3 border border-gold/10">
                    <CheckCircle className="w-4 h-4 text-gold" /> Earning {estimatedPoints} Reward Points
                  </div>
                </div>
              </div>

              <button 
                onClick={checkoutHandler}
                className="w-full bg-gold text-charcoal text-lg font-black py-6 rounded-[2.5rem] flex justify-center items-center gap-4 transition-all transform hover:scale-[1.02] hover:shadow-[0_30px_60px_rgba(212,175,55,0.3)] active:scale-95 group shadow-2xl uppercase tracking-[0.2em] text-xs"
              >
                Proceed to Checkout
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
              
              <p className="text-center text-[9px] text-gray-600 mt-8 uppercase tracking-[0.3em] font-black italic">Encrypted Secure Transaction</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
