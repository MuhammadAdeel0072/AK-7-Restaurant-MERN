import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const OrderSuccess = () => {
  return (
    <div className="container mx-auto px-6 py-24 text-center">
      <div className="flex justify-center mb-8">
        <div className="bg-gold p-6 rounded-full shadow-2xl shadow-gold/20 animate-bounce">
          <CheckCircle className="w-16 h-16 text-charcoal" />
        </div>
      </div>
      <h1 className="text-5xl font-bold mb-6 text-white">Order Placed Successfully!</h1>
      <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
        Your delicious food is being prepared. We will notify you when it's out for delivery.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/menu" className="btn-primary flex items-center gap-2">
          Order More <ArrowRight className="w-5 h-5" />
        </Link>
        <Link to="/" className="bg-white/10 text-white px-8 py-3 rounded-md font-bold hover:bg-white/20 transition-all border border-white/10">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
