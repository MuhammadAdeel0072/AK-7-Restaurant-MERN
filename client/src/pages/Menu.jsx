import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { ShoppingCart, CheckCircle } from 'lucide-react';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const { dispatch } = useCart();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/products');
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products', error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCartHandler = (product) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { ...product, product: product._id, qty: 1 },
    });
    setFeedback(`${product.name} added to cart!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const categories = ['All', 'Drinks', 'Food', 'Dishes', 'Sweets'];

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Category Selection (Hick's Law) */}
      <div className="flex flex-wrap gap-4 mb-12 justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-2 rounded-full border-2 transition-all font-bold ${
              activeCategory === cat 
                ? 'bg-gold border-gold text-charcoal' 
                : 'border-gold text-gold hover:bg-gold/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {feedback && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <span className="font-bold">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="bg-charcoal/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-gold group transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <div className="h-60 overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-crimson text-white px-3 py-1 rounded-full text-sm font-bold">
                  {product.category}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-gold transition-colors">{product.name}</h3>
                <p className="text-gray-400 font-sans text-sm mb-4 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-bold text-gold">${product.price.toFixed(2)}</span>
                  <button 
                    onClick={() => addToCartHandler(product)}
                    className="bg-gold text-charcoal p-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg active:scale-95"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-60 bg-white/10"></div>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-white/10 rounded w-3/4"></div>
      <div className="h-4 bg-white/10 rounded w-full"></div>
      <div className="h-4 bg-white/10 rounded w-5/6"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-8 bg-white/10 rounded w-1/4"></div>
        <div className="h-10 bg-white/10 rounded w-10"></div>
      </div>
    </div>
  </div>
);

export default Menu;
