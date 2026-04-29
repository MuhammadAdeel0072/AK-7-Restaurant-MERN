import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/menuService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ShoppingCart, Heart, Search, Filter, Plus, Minus, X, Package, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [qty, setQty] = useState(1);
  const { dispatch } = useCart();
  const { user: profile, isSignedIn, updateProfile } = useAuth();
  const { siteUpdate } = useSocket();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          const categoryNames = Array.isArray(data) 
            ? data.map(cat => typeof cat === 'string' ? cat : cat.name)
            : [];
          setCategories(categoryNames);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      }
    };
    
    const fetchDeals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/deals?isActive=true`);
        if (response.ok) {
          const data = await response.json();
          setDeals(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      }
    };
    
    fetchProducts();
    fetchCategories();
    fetchDeals();
  }, []);

  useEffect(() => {
    if (siteUpdate?.type === 'menuUpdate') {
      const fetchProducts = async () => {
        const data = await getProducts();
        if (data && data.length > 0) setProducts(data);
      };
      fetchProducts();
    }

    // Handle category updates
    if (siteUpdate?.type === 'categoryAdded' || siteUpdate?.type === 'categoryUpdated' || siteUpdate?.type === 'categoryDeleted') {
      const fetchCategories = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/categories`);
          if (response.ok) {
            const data = await response.json();
            const categoryNames = Array.isArray(data) 
              ? data.map(cat => typeof cat === 'string' ? cat : cat.name)
              : [];
            setCategories(categoryNames);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }
  }, [siteUpdate]);

  const addToCartHandler = (product, quantity = 1, e, finalCustoms = []) => {
    if (e) e.stopPropagation();
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        product: product._id,
        qty: quantity,
        customizations: finalCustoms
      },
    });
    toast.success(`${product.name} added!`, {
      icon: '🛒',
      duration: 3000,
    });
    if (selectedProduct) {
      setSelectedProduct(null);
      setQty(1);
      setCustomizations({});
    }
  };

  const toggleFavoriteHandler = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!isSignedIn) {
      toast.error('Sign in to save favorites');
      return;
    }
    
    try {
      const isFavorite = profile?.favorites?.includes(productId);
      const newFavorites = isFavorite
        ? profile.favorites.filter(id => id !== productId)
        : [...(profile.favorites || []), productId];
        
      await updateProfile({ favorites: newFavorites });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites', { icon: '❤️' });
    } catch (error) {
      // Handled by context
    }
  };

  const getDealForProduct = (productId, category) => {
    return deals.find(deal => 
      (deal.productId && (deal.productId._id === productId || deal.productId === productId)) ||
      (deal.category === category && !deal.productId)
    );
  };

  const categoryList = ['All', ...categories];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-6 mb-8 md:mb-12 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search food or drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-gold/20 rounded-2xl py-3.5 md:py-4 pl-12 pr-6 focus:border-gold outline-none text-white transition-all placeholder:text-gray-500 shadow-inner text-sm md:text-base"
          />
        </div>

        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex flex-nowrap lg:flex-wrap gap-2 md:gap-3 pb-2 lg:pb-0 justify-start lg:justify-center min-w-max lg:min-w-0">
            {categoryList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-2.5 md:py-3 rounded-2xl transition-all font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105 border-transparent'
                    : 'bg-white/5 text-gray-400 hover:text-gold border border-white/5 hover:border-gold/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch min-h-[500px]">
          {filteredProducts.map(product => {
            const isFav = profile?.favorites?.includes(product._id);
            const deal = getDealForProduct(product._id, product.category);
            let discountedPrice = product.price;
            if (deal) {
              if (deal.discountPercentage > 0) {
                discountedPrice = product.price - (product.price * (deal.discountPercentage / 100));
              } else if (deal.discountAmount > 0) {
                discountedPrice = product.price - deal.discountAmount;
              }
              discountedPrice = Math.max(0, discountedPrice);
            }

            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-gold/40 group transition-all duration-700 transform hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative cursor-pointer flex flex-col h-full"
              >
                <div className="h-64 overflow-hidden relative shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80"></div>

                  <button
                    onClick={(e) => toggleFavoriteHandler(product._id, e)}
                    className={`absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                      isFav ? 'bg-white/10 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-charcoal/60 text-white hover:text-red-400 border border-white/10'
                    }`}
                  >
                    {isFav ? (
                      <span className="text-lg leading-none drop-shadow-md transform hover:scale-110 transition-transform">❤️</span>
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                  </button>

                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {deal && (
                      <div className="bg-crimson text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border border-crimson/50 whitespace-nowrap">
                        {deal.discountPercentage > 0 
                          ? `🔥 ${deal.discountPercentage}% OFF`
                          : `💰 Rs. ${deal.discountAmount} OFF`
                        }
                      </div>
                    )}
                    {product.isBestSeller && (
                      <div className="bg-crimson text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                        Popular
                      </div>
                    )}
                    {product.isSpecial && (
                      <div className="bg-gold text-charcoal px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Chef Special
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${product.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-white/50 text-[10px] font-medium">{product.preparationTime} mins</div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-gold transition-colors leading-tight">{product.name}</h3>
                    <div className="flex flex-col items-end">
                      {deal ? (
                        <>
                          <span className="text-gray-500 font-bold text-xs line-through shrink-0">Rs. {product.price}</span>
                          <span className="text-gold font-black text-lg tracking-tighter shrink-0">Rs. {Math.round(discountedPrice)}</span>
                        </>
                      ) : (
                        <span className="text-gold font-black text-lg tracking-tighter shrink-0">Rs. {product.price}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium italic">"{product.description}"</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {product.dietaryInfo?.map(info => (
                      <span key={info} className="px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold text-[8px] font-black uppercase tracking-widest rounded-md">
                        {info}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => addToCartHandler({ ...product, price: Math.round(discountedPrice) }, 1, e)}
                    className="mt-auto w-full flex items-center justify-between bg-white/5 hover:bg-gold/10 border border-white/5 group-hover:border-gold/30 hover:border-gold/50 px-5 py-3.5 rounded-2xl transition-all duration-300 group/btn"
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-gold transition-colors">Add to Cart</span>
                    <ShoppingCart className="w-4 h-4 text-gold/40 group-hover/btn:text-gold group-hover/btn:scale-110 transition-all" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/5">
          <Filter className="w-16 h-16 text-gold/20 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-white mb-2">No food found</h2>
          <p className="text-gray-500">Try searching something else</p>
          <button
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
            className="mt-6 text-gold underline underline-offset-4 hover:text-white transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Modal - Simplified view for details */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const deal = getDealForProduct(selectedProduct._id, selectedProduct.category);
          let discountedPrice = selectedProduct.price;
          if (deal) {
            if (deal.discountPercentage > 0) {
              discountedPrice = selectedProduct.price - (selectedProduct.price * (deal.discountPercentage / 100));
            } else if (deal.discountAmount > 0) {
              discountedPrice = selectedProduct.price - deal.discountAmount;
            }
            discountedPrice = Math.max(0, discountedPrice);
          }

          return (
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
                  </div>
                  <h2 className="text-4xl font-serif font-black text-white mb-4 leading-tight">
                    {selectedProduct.name}
                    {deal && (
                      <span className="ml-4 inline-block align-middle bg-crimson text-white px-3 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg border border-crimson/50 whitespace-nowrap">
                        {deal.discountPercentage > 0 
                          ? `🔥 ${deal.discountPercentage}% OFF`
                          : `💰 Rs. ${deal.discountAmount} OFF`
                        }
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-400 text-base italic leading-relaxed mb-6 font-medium">"{selectedProduct.description}"</p>
                  <div className="flex items-center gap-4 mb-8">
                    {deal && (
                      <span className="text-gray-500 font-bold text-2xl line-through">Rs. {selectedProduct.price}</span>
                    )}
                    <span className="text-4xl font-black text-gold tracking-tighter">Rs. {Math.round(discountedPrice)}</span>
                  </div>
                </div>

                <div className="mt-auto space-y-6 overflow-y-auto no-scrollbar max-h-[40vh] pr-2">
                  {/* Dynamic Customizations */}
                  {selectedProduct.customizations?.length > 0 && (
                    <div className="space-y-6">
                      {selectedProduct.customizations.map((custom, idx) => (
                        <div key={idx} className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-gold/60 flex justify-between">
                            {custom.name}
                            {custom.isRequired && <span className="text-crimson">* Required</span>}
                          </label>
                          
                          {custom.type === 'multi-select' ? (
                            <div className="grid grid-cols-2 gap-2">
                              {custom.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                    const currentSelections = customizations[custom.name] || [];
                                    const isSelected = currentSelections.includes(opt.name);
                                    const newSelections = isSelected
                                      ? currentSelections.filter(s => s !== opt.name)
                                      : [...currentSelections, opt.name];
                                    setCustomizations({ ...customizations, [custom.name]: newSelections });
                                  }}
                                  className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    (customizations[custom.name] || []).includes(opt.name)
                                      ? 'bg-gold/20 border-gold text-gold'
                                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-gold/30'
                                  }`}
                                >
                                  {opt.name} {opt.extraPrice > 0 && `(+${opt.extraPrice})`}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <select
                              value={customizations[custom.name] || ''}
                              onChange={(e) => setCustomizations({ ...customizations, [custom.name]: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs outline-none focus:border-gold transition-all"
                            >
                              <option value="">Select {custom.name}</option>
                              {custom.options.map((opt, oIdx) => (
                                <option key={oIdx} value={opt.name}>
                                  {opt.name} {opt.extraPrice > 0 ? `(+Rs. ${opt.extraPrice})` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                    <span className="text-xs font-black uppercase tracking-widest text-gold/60">Portions</span>
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
                    onClick={(e) => {
                      const finalCustoms = Object.entries(customizations).map(([name, selection]) => ({
                        name,
                        selection: Array.isArray(selection) ? selection.join(', ') : selection,
                        extraPrice: 0 // In a real app, calculate this
                      }));
                      addToCartHandler({ ...selectedProduct, price: Math.round(discountedPrice) }, qty, e, finalCustoms);
                    }}
                    className="w-full bg-gold text-charcoal font-black py-5 rounded-[2rem] flex items-center justify-center gap-4 text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    ADD TO CART (Rs. {Math.round(discountedPrice * qty)})
                  </button>

                  <div className="flex justify-center gap-8 text-[10px] items-center">
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {selectedProduct.preparationTime || 25} READY
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
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

const SkeletonCard = () => (
    <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="h-64 bg-white/[0.05]" />
        <div className="p-6 space-y-4">
            <div className="h-5 bg-white/[0.05] rounded-lg w-1/2" />
            <div className="h-4 bg-white/[0.05] rounded-lg w-full" />
            <div className="h-12 bg-white/[0.05] rounded-2xl w-full mt-4" />
        </div>
    </div>
);

export default Menu;
