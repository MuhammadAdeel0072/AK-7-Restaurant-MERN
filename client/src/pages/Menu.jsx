import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/menuService';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/UserContext';
import { ShoppingCart, Heart, Search, Filter, Plus, Minus, X, Package, Clock, Flame, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { dispatch } = useCart();
  const { profile, isSignedIn } = useProfile();

const fallbackItems = [
    // Drinks
    { _id: 'd1', name: 'Mint Margarita', category: 'Drinks', price: 250, description: 'Cool and refreshing mint drink', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', preparationTime: 5, isVegetarian: true },
    { _id: 'd2', name: 'Cold Coffee', category: 'Drinks', price: 350, description: 'Creamy coffee with ice cream', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500', preparationTime: 8, isVegetarian: true },
    { _id: 'd3', name: 'Fresh Orange Juice', category: 'Drinks', price: 300, description: 'Freshly squeezed oranges', image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500', preparationTime: 5, isVegetarian: true },
    // Foods
    { _id: 'f1', name: 'Zinger Burger', category: 'Food', price: 450, description: 'Crispy chicken burger with cheese', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', preparationTime: 15, isVegetarian: false, isBestSeller: true },
    { _id: 'f2', name: 'Chicken Sandwich', category: 'Food', price: 350, description: 'Grilled chicken with fresh salad', image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=500', preparationTime: 10, isVegetarian: false },
    // Sweets
    { _id: 's1', name: 'Chocolate Cake', category: 'Sweets', price: 400, description: 'Rich and moist chocolate delight', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', preparationTime: 5, isVegetarian: true },
    { _id: 's2', name: 'Brownie', category: 'Sweets', price: 300, description: 'Warm fudgy brownie with nuts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', preparationTime: 5, isVegetarian: true },
    // Dishes
    { _id: 'di1', name: 'Chicken Karahi', category: 'Dishes', price: 1200, description: 'Spicy traditional chicken curry', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', preparationTime: 25, isVegetarian: false },
    { _id: 'di2', name: 'Biryani', category: 'Dishes', price: 600, description: 'Fragrant rice with spicy chicken', image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=500', preparationTime: 20, isVegetarian: false, isSpecial: true },
];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        if (data && data.length > 0) {
            setProducts(data);
        } else {
            setProducts(fallbackItems);
        }
      } catch (error) {
        console.error('API Error, using fallback menu');
        setProducts(fallbackItems);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCartHandler = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: { 
        ...product, 
        product: product._id, 
        qty: quantity,
        customizations: []
      },
    });
    toast.success(`${product.name} added to cart!`, {
        icon: '🛒',
        style: {
          background: '#1a1a1a',
          color: '#D4AF37',
          border: '1px solid #D4AF37',
        },
    });
    if (selectedProduct) {
        setSelectedProduct(null);
        setQty(1);
    }
  };

  const toggleFavoriteHandler = async (productId) => {
    if (!isSignedIn) {
      toast.error('Please sign in to favorite items');
      return;
    }

    const isFavorite = profile?.favorites?.includes(productId);
    try {
      if (isFavorite) {
        await removeFavorite(productId);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(productId);
        toast.success('Added to favorites', { icon: '❤️' });
      }
      // Reload profile to update favorites
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const categories = ['All', 'Food', 'Dishes', 'Sweets', 'Drinks'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search our gourmet menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-gold/20 rounded-2xl py-4 pl-12 pr-6 focus:border-gold outline-none text-white transition-all placeholder:text-gray-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${
                activeCategory === cat
                  ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105'
                  : 'bg-white/5 text-gray-400 hover:text-gold border border-white/5 hover:border-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => {
            const isFav = profile?.favorites?.includes(product._id);
            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-gold/40 group transition-all duration-700 transform hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative cursor-pointer"
              >
                <div className="h-72 overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80"></div>

                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteHandler(product._id);
                    }}
                    className={`absolute top-6 left-6 p-3 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                        isFav ? 'bg-gold text-charcoal' : 'bg-charcoal/60 text-white hover:text-gold border border-white/10'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    {product.isBestSeller && (
                      <div className="bg-crimson text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                        Best Seller
                      </div>
                    )}
                    {product.isSpecial && (
                      <div className="bg-gold text-charcoal px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Daily Special
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="flex gap-2">
                      <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${product.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      {product.spicyLevel > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rotate-45 ${i < product.spicyLevel ? 'bg-orange-500' : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-white/50 text-[10px] font-medium">{product.preparationTime} mins</div>
                  </div>
                </div>

                <div className="p-8 pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-serif font-bold text-white group-hover:text-gold transition-colors leading-tight">{product.name}</h3>
                    <span className="text-gold font-black text-xl tracking-tighter">₹{product.price}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium italic">"{product.description}"</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {product.dietaryInfo?.map(info => (
                      <span key={info} className="px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold text-[8px] font-black uppercase tracking-widest rounded-md">
                        {info}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-gold/20 transition-all">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Freshly Made</span>
                    <ShoppingCart className="w-5 h-5 text-gold/40 group-hover:text-gold transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/5">
            <Filter className="w-16 h-16 text-gold/20 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-white mb-2">No food found</h2>
            <p className="text-gray-500">Try searching for something else</p>
            <button
                onClick={() => {setActiveCategory('All'); setSearchQuery('');}}
                className="mt-6 text-gold underline underline-offset-4 hover:text-white transition-colors"
            >
                Clear search
            </button>
        </div>
      )}
      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden max-w-4xl w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-8 right-8 z-10 p-3 bg-charcoal/60 hover:bg-gold text-white hover:text-charcoal rounded-2xl transition-all backdrop-blur-xl border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="md:w-1/2 h-80 md:h-auto overflow-hidden">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="md:w-1/2 p-10 md:p-14 flex flex-col">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-gold font-black text-xs uppercase tracking-widest">{selectedProduct.category}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <div className="flex gap-2">
                      <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${selectedProduct.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedProduct.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      {selectedProduct.spicyLevel > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rotate-45 ${i < selectedProduct.spicyLevel ? 'bg-crimson shadow-[0_0_10px_rgba(220,20,60,0.5)]' : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <h2 className="text-5xl font-serif font-black text-white mb-4 leading-tight">{selectedProduct.name}</h2>
                  <p className="text-gray-400 text-lg italic leading-relaxed mb-6 font-medium">"{selectedProduct.description}"</p>
                  <div className="text-4xl font-black text-gold tracking-tighter mb-8">₹{selectedProduct.price}</div>
                </div>

                <div className="mt-auto space-y-8">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                    <span className="text-xs font-black uppercase tracking-widest text-gold/60 ml-2">Portions</span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-gold hover:text-charcoal transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold text-white w-4 text-center">{qty}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setQty(Math.min(selectedProduct.countInStock || 20, qty + 1)); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-gold hover:text-charcoal transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCartHandler(selectedProduct, qty); }}
                    className="w-full bg-gold text-charcoal font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 text-xl shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <ShoppingCart className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    ADD TO CART
                  </button>
                  
                  <div className="flex justify-center gap-8 text-[10px] items-center">
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {selectedProduct.preparationTime || 25} MINS READY
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest">
                        <Package className="w-3 h-3" /> SAFE PACKING
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SkeletonCard = () => (
    <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
      <div className="h-64 relative bg-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
      </div>
      <div className="p-8 space-y-4">
        <div className="flex justify-between">
          <div className="h-6 bg-white/[0.05] rounded-lg w-1/2 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.1s]"></div>
          </div>
          <div className="h-6 bg-white/[0.05] rounded-lg w-1/4 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.2s]"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-white/[0.05] rounded-lg w-full relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/2 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.3s]"></div>
          </div>
          <div className="h-4 bg-white/[0.05] rounded-lg w-5/6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/2 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.4s]"></div>
          </div>
        </div>
        <div className="h-12 bg-white/[0.05] rounded-2xl w-full mt-4 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.5s]"></div>
        </div>
      </div>
    </div>
);

export default Menu;
