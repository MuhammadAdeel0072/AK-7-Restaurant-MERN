import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const navigate = useNavigate();

  const removeFromCartHandler = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQtyHandler = (item, qty) => {
    if (qty > 0 && qty <= item.countInStock) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: { ...item, qty: Number(qty) },
      });
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  const checkoutHandler = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-10 text-gold flex items-center gap-4">
        <ShoppingBag className="w-10 h-10" /> Your Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center">
          <p className="text-2xl text-gray-400 mb-8">Your cart is empty.</p>
          <Link to="/menu" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back to Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.product} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 group hover:border-gold transition-all">
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{item.name}</h3>
                  <p className="text-gray-400 text-sm">{item.category}</p>
                </div>

                <div className="flex items-center gap-4 bg-charcoal p-2 rounded-xl border border-white/10">
                  <button 
                    onClick={() => updateQtyHandler(item, item.qty - 1)}
                    className="p-1 hover:text-gold transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-8 text-center font-bold">{item.qty}</span>
                  <button 
                    onClick={() => updateQtyHandler(item, item.qty + 1)}
                    className="p-1 hover:text-gold transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xl font-bold text-gold">
                  ${(item.qty * item.price).toFixed(2)}
                </div>

                <button 
                  onClick={() => removeFromCartHandler(item.product)}
                  className="text-crimson hover:bg-crimson/10 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl h-fit sticky top-28">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-gold font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-white pt-4 border-t border-white/10">
                <span>Total</span>
                <span className="text-gold">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={checkoutHandler}
              disabled={cartItems.length === 0}
              className="w-full btn-primary text-xl py-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gold/20"
            >
              Proceed to Checkout
            </button>
            <Link to="/menu" className="w-full mt-4 flex justify-center items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
