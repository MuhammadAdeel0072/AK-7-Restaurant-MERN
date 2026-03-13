import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, CheckCircle } from 'lucide-react';

const Checkout = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('PayPal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      dispatch({ type: 'CLEAR_CART' });
      setIsSubmitting(false);
      navigate('/order-success');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-10 text-gold text-center">Checkout</h1>

      <form onSubmit={submitHandler} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Shipping Information */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/10 pb-4">
            <Truck className="w-6 h-6 text-gold" /> Shipping Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Address</label>
              <input 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-gold outline-none transition-all"
                placeholder="123 Main St"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">City</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-gold outline-none transition-all"
                  placeholder="New York"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Postal Code</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-gold outline-none transition-all"
                  placeholder="10001"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Country</label>
              <input 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-gold outline-none transition-all"
                placeholder="USA"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-white/10 pb-4">
              <CreditCard className="w-6 h-6 text-gold" /> Payment Method
            </h2>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${paymentMethod === 'PayPal' ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-gold/50'}`}>
                <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('PayPal')} checked={paymentMethod === 'PayPal'} />
                <span className="font-bold">PayPal</span>
              </label>
              <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${paymentMethod === 'Stripe' ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-gold/50'}`}>
                <input type="radio" name="payment" className="hidden" onChange={() => setPaymentMethod('Stripe')} checked={paymentMethod === 'Stripe'} />
                <span className="font-bold">Stripe</span>
              </label>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xl font-bold mb-4">Total Amount</h3>
            <div className="text-4xl font-bold text-gold">${totalPrice.toFixed(2)}</div>
            <p className="text-gray-400 text-sm">By placing this order, you agree to our Terms and Conditions.</p>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-xl py-4 mt-4 flex justify-center items-center gap-2 shadow-xl shadow-gold/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-charcoal border-t-white rounded-full animate-spin"></div>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
