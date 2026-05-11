import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Coffee, Utensils, Pizza, Cake, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserOrderHistory } from '../services/orderService';
import useReorder from '../hooks/useReorder';
import { useState, useEffect } from 'react';

const Home = () => {
  const { isSignedIn } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { handleReorder, reordering } = useReorder();

  const [moodProducts, setMoodProducts] = useState([]);
  const [moodLoading, setMoodLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const handleMoodClick = async (moodId) => {
    setSelectedMood(moodId);
    setMoodLoading(true);
    setMoodProducts([]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/products/mood/${moodId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMoodProducts(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setMoodLoading(false);
    }
  };

  // Lazy-load recent orders for signed-in users
  useEffect(() => {
    if (isSignedIn) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await getUserOrderHistory();
          setRecentOrders((data.orders || []).slice(0, 3));
        } catch (err) {
          console.error('Failed to load recent orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isSignedIn]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-black">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
        </motion.div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="text-gold font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Midnight Gourmet</span>
            <h1 className="text-5xl md:text-8xl font-serif font-black mb-8 text-white tracking-tighter leading-none">
              Delicious Food, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold">Delivered Fast</span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Order your favorite meals easily and enjoy a luxury dining experience right at your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/menu" className="group relative bg-gold text-charcoal px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gold/20">
                <span className="relative z-10 flex items-center gap-2">
                  View Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </Link>
              <Link to="/cart" className="group px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest text-white border border-white/10 hover:bg-white/5 transition-all">
                Order Now
              </Link>
            </div>
          </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <div className="w-px h-12 bg-white"></div>
        </div>
      </section>

      {/* Mood-Based Ordering Section */}
      <section className="py-16 bg-charcoal px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
            How are you <span className="text-gold">feeling today?</span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base mb-12 uppercase tracking-[0.3em] font-black">Select your mood & we'll handle the rest</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { id: 'hungry', label: "I'm Very Hungry", emoji: "😋", color: "from-orange-500/20 to-crimson/20" },
              { id: 'budget', label: "Budget Meal", emoji: "💸", color: "from-green-500/20 to-emerald-500/20" },
              { id: 'quick', label: "Quick Snack", emoji: "🍕", color: "from-blue-500/20 to-indigo-500/20" },
              { id: 'premium', label: "Premium Dinner", emoji: "❤️", color: "from-gold/20 to-yellow-500/20" }
            ].map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood.id)}
                className={`group relative overflow-hidden p-8 rounded-[2.5rem] border ${selectedMood === mood.id ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02]' : 'border-white/5'} bg-gradient-to-br ${mood.color} transition-all duration-500 hover:scale-[1.02] hover:border-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] text-left w-full`}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">{mood.emoji}</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-gold transition-colors">{mood.label}</h3>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>

          {/* Mood Recommendations Display */}
          {(moodLoading || selectedMood) && (
            <div className="mt-16 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gold rounded-full"></span>
                Recommended for you
              </h3>

              {moodLoading && (
                <div className="flex flex-col items-center justify-center py-16 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                  <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
                  <p className="text-gold/80 uppercase tracking-widest font-black text-sm animate-pulse">Loading recommendations...</p>
                </div>
              )}

              {!moodLoading && selectedMood && moodProducts.length === 0 && (
                <div className="text-center py-16 bg-white/[0.02] rounded-[2.5rem] border border-white/5">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-gray-400 text-lg mb-4">No items found for this mood</p>
                  <button onClick={() => setSelectedMood(null)} className="text-gold text-sm font-black uppercase tracking-widest hover:underline hover:text-white transition-colors">Clear Selection</button>
                </div>
              )}

              {!moodLoading && moodProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {moodProducts.map(item => (
                    <div key={item._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-4 hover:border-gold/30 hover:bg-white/[0.07] transition-all duration-500 flex flex-col group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                      <div className="h-48 rounded-2xl overflow-hidden mb-4 relative shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80"></div>
                        <div className="absolute top-3 right-3 bg-charcoal/80 backdrop-blur-xl px-3 py-1.5 rounded-xl text-gold font-black text-xs border border-white/10 shadow-lg">Rs. {item.price}</div>
                        <div className="absolute bottom-3 left-3 flex gap-1">
                          {item.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="bg-gold/20 text-gold border border-gold/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest backdrop-blur-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <h4 className="text-white font-serif font-bold text-lg mb-2 group-hover:text-gold transition-colors leading-tight">{item.name}</h4>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-6 flex-grow font-medium">"{item.description}"</p>
                      <Link to={`/menu`} className="w-full py-3 rounded-xl bg-gold/10 text-gold font-black text-[10px] uppercase tracking-widest text-center hover:bg-gold hover:text-charcoal transition-all border border-gold/20 hover:border-gold flex items-center justify-center gap-2 group/btn">
                        Order Now <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Subscription Banner */}
      <section className="relative py-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gold/20 via-charcoal to-crimson/20 border border-gold/30 rounded-[3rem] p-10 md:p-16 relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[100px] group-hover:bg-gold/20 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-2/3 text-center lg:text-left">
                <span className="bg-gold text-charcoal px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 inline-block">Exclusive Meal Plans</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Set Your <span className="text-gold">Weekly Meal Plan</span> & Relax</h2>
                <p className="text-gray-400 text-lg md:text-xl font-medium mb-10 max-w-2xl leading-relaxed">Automate your favorites. Schedule your orders for any day of the week and we will deliver them precisely when you are hungry.</p>
                <Link to="/plans" className="inline-flex items-center gap-4 bg-gold text-charcoal px-10 py-5 rounded-[2rem] font-bold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gold/30 group/btn">
                  Get Started <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                </Link>
              </div>
              <div className="lg:w-1/3 flex justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gold/20 rounded-[3rem] rotate-12 group-hover:rotate-6 transition-transform duration-700"></div>
                  <div className="absolute inset-0 bg-white/[0.05] border border-white/10 rounded-[3rem] backdrop-blur-xl flex flex-col items-center justify-center p-8 group-hover:-translate-y-4 transition-transform duration-700">
                    <Pizza className="w-20 h-20 text-gold mb-4 group-hover:scale-110 transition-transform" />
                    <div className="text-center">
                      <p className="text-white font-black text-xl font-serif">Mondays</p>
                      <p className="text-gold/60 font-black text-xs uppercase tracking-widest">at 8:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reorder Your Favorites Section */}
      {isSignedIn && (
        <section className="py-16 bg-charcoal px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px bg-gold/20 flex-1"></div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-center flex items-center gap-3">
                <RotateCcw className="w-7 h-7 text-gold" />
                <span>Reorder Your <span className="text-gold">Favorites</span></span>
              </h2>
              <div className="h-px bg-gold/20 flex-1"></div>
            </div>

            {loadingOrders ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No previous orders to reorder. <Link to="/menu" className="text-gold font-bold hover:underline">Browse the menu</Link></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-gold/20 rounded-3xl p-6 transition-all duration-300 group backdrop-blur-sm"
                  >
                    {/* Item thumbnails */}
                    <div className="flex gap-2 mb-4">
                      {order.orderItems.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img src={item.currentImage || item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.orderItems.length > 4 && (
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 font-black shrink-0">
                          +{order.orderItems.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Order info */}
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/50 mb-1">
                        {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 truncate">
                        {order.orderItems.map(i => i.name).join(', ')}
                      </p>
                      <p className="text-lg font-bold text-gold mt-2">Rs. {order.totalPrice?.toFixed(0)}</p>
                    </div>

                    {/* Availability indicators */}
                    {order.orderItems.some(i => !i.isAvailable) && (
                      <p className="text-[10px] text-crimson/70 font-bold mb-3 uppercase tracking-widest">
                        ⚠ Some items may be unavailable
                      </p>
                    )}

                    {/* Reorder button */}
                    <button
                      onClick={() => handleReorder(order._id)}
                      disabled={reordering}
                      className="w-full flex items-center justify-center gap-2 bg-gold/10 hover:bg-gold hover:text-charcoal border border-gold/20 hover:border-gold text-gold px-4 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {reordering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      Reorder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
