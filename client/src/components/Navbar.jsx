import { ShoppingCart, Menu as MenuIcon, LogIn, User as UserIcon, ShoppingBag, Calendar, LogOut, X, AlertTriangle, Settings as SettingsIcon, ChevronRight, HelpCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { state, dispatch } = useCart();
  const { cartItems } = state;
  const { user, isSignedIn, loading: isLoading, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Orders', path: '/orders' },
    { name: 'History', path: '/order-history' },
    { name: 'Table', path: '/reservation' },
  ];

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = () => {
    setSigningOut(true);
    try {
      dispatch({ type: 'CLEAR_CART' });
      logout();
      setShowSignOutModal(false);
    } finally {
      setSigningOut(false);
    }
  };

  if (isLoading) return null;

  return (
    <>
      <nav className="bg-charcoal/80 backdrop-blur-md border-b border-gold/30 sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300">
        {/* Logo */}
        <Link to="/" className="text-2xl md:text-3xl font-serif font-bold text-gold tracking-wider z-50">
          AK-7 <span className="text-crimson">REST</span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex gap-8 items-center text-sm font-black uppercase tracking-widest">
          {navLinks.map(link => (
            <NavLink 
              key={link.path} 
              to={link.path} 
              end={link.path === '/'}
              className={({ isActive }) => 
                `transition-colors ${isActive ? 'text-gold' : 'text-gray-300 hover:text-gold'}`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Cart */}
          <Link to="/cart" className="relative flex items-center gap-2 group">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-gold group-hover:scale-110 transition-transform" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-crimson text-white text-[10px] w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
            {totalPrice > 0 && (
              <span className="hidden sm:block text-gold font-bold text-sm">Rs.{totalPrice.toFixed(0)}</span>
            )}
          </Link>

          {/* Auth */}
          {isSignedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-full border-2 border-gold/40 hover:border-gold transition-all duration-300"
                aria-label="User menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gold" />
                  </div>
                )}
                <span className="hidden lg:block text-gold/80 text-[10px] font-black uppercase tracking-widest pr-1">
                  {user?.firstName || 'Member'}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 w-56 bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden z-[200]"
                    >
                      <div className="px-5 py-5 border-b border-white/5 bg-white/[0.02]">
                        <p className="text-white font-bold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-gold/40 text-[9px] font-black uppercase tracking-widest truncate mt-0.5">{user?.email}</p>
                      </div>

                      <div className="py-2">

                        <Link
                          to="/reservation"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item border-l-2 border-transparent hover:border-gold"
                        >
                          <Calendar className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                          <span>Booking</span>
                        </Link>
                        <Link
                          to="/help"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item border-l-2 border-transparent hover:border-gold"
                        >
                          <HelpCircle className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                          <span>Help</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item border-l-2 border-transparent hover:border-gold"
                        >
                          <SettingsIcon className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-white/5 py-2">
                        <button
                          onClick={() => { setDropdownOpen(false); setShowSignOutModal(true); }}
                          className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all text-sm font-black uppercase tracking-widest"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/signin"
                className="flex items-center gap-2 bg-gold text-charcoal px-4 md:px-6 py-2 md:py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-105 active:scale-95 transition-all"
              >
                <LogIn size={14} className="md:w-4 md:h-4" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              className="md:hidden p-2 text-gold z-50 relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
            </button>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 transition-opacity duration-300"
                />
                <motion.div
                  initial={{ x: '100vw' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100vw' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#1a1a1a] shadow-[-30px_0_90px_rgba(0,0,0,0.9)] border-l border-white/10 z-[100] p-8 flex flex-col pt-32"
                >
                  <div className="flex flex-col gap-8">
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => 
                          `text-3xl font-serif font-black transition-colors flex items-center justify-between group py-2 ${isActive ? 'text-gold' : 'text-gray-400 hover:text-white'}`
                        }
                      >
                        <span className="group-hover:translate-x-2 transition-transform duration-300">{link.name}</span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className={`group-hover:scale-125 transition-transform ${location.pathname === link.path ? 'text-gold' : 'text-gold'}`}
                        >
                          <ChevronRight className="w-7 h-7" />
                        </motion.div>
                      </NavLink>
                    ))}
                    {isSignedIn && (
                      <Link
                        to="/settings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-3xl font-serif font-black text-white hover:text-gold transition-colors flex items-center justify-between group py-2 border-t border-white/5 pt-8"
                      >
                        <span className="group-hover:translate-x-2 transition-transform duration-300">Settings</span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="text-gold group-hover:scale-125 transition-transform"
                        >
                          <SettingsIcon className="w-7 h-7" />
                        </motion.div>
                      </Link>
                    )}
                  </div>

                  <div className="mt-auto pb-8">
                      {!isSignedIn ? (
                        <Link 
                           to="/signin" 
                           onClick={() => setIsMobileMenuOpen(false)}
                           className="w-full flex items-center justify-center gap-3 bg-gold text-charcoal py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-gold/20"
                        >
                           <LogIn className="w-6 h-6" /> Join Now
                        </Link>
                      ) : (
                        <button
                          onClick={() => { setIsMobileMenuOpen(false); setShowSignOutModal(true); }}
                          className="w-full flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all hover:bg-red-500/20"
                        >
                           <LogOut className="w-6 h-6" /> Sign Out
                        </button>
                      )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="bg-[#1a1a1a] border border-white/10 p-12 rounded-[4rem] max-w-md w-full shadow-[0_40px_100px_rgba(0,0,0,0.9)] text-center relative"
            >
              <button
                onClick={() => setShowSignOutModal(false)}
                className="absolute top-8 right-8 p-3 text-gray-500 hover:text-white transition-colors rounded-2xl hover:bg-white/5"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h2 className="text-4xl font-serif font-black text-white mb-4">Sign Out?</h2>
              <p className="text-gray-500 mb-10 text-sm leading-relaxed px-4">Your current gourmet session and preferences will be secured. Re-authentication will be required for future orders.</p>
              
              <div className="flex gap-4 mt-8 px-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-4.5 rounded-[2rem] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex-1 py-4.5 rounded-[2rem] bg-red-500 hover:bg-red-400 text-white font-black text-sm transition-all disabled:opacity-60 active:scale-95 shadow-xl shadow-red-500/20 uppercase tracking-widest"
                >
                  {signingOut ? '...' : 'Sign Out'}
                </button>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">Secure sign out</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
