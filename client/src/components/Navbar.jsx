import { ShoppingCart, Menu as MenuIcon, LogIn, User as UserIcon, ShoppingBag, Calendar, LogOut, X, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, useClerk } from '@clerk/clerk-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { state } = useCart();
  const { cartItems } = state;
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef(null);

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setShowSignOutModal(false);
    } catch {
      // sign-out failed silently
    } finally {
      setSigningOut(false);
    }
  };

  // Loading shimmer
  if (!isLoaded) {
    return (
      <nav className="bg-charcoal/90 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 px-8 py-5 flex justify-between items-center overflow-hidden">
        <Link to="/" className="text-3xl font-serif font-bold text-gold tracking-wider">
          AK-7 <span className="text-crimson">REST</span>
        </Link>
        <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-charcoal/80 backdrop-blur-md border-b border-gold/30 sticky top-0 z-50 px-6 py-4 flex justify-between items-center transition-colors duration-300">
        {/* Logo */}
        <Link to="/" className="text-3xl font-serif font-bold text-gold tracking-wider">
          AK-7 <span className="text-crimson">REST</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex gap-8 items-center text-sm font-black uppercase tracking-widest">
          <Link to="/"            className="text-gray-300 hover:text-gold transition-colors">Home</Link>
          <Link to="/menu"        className="text-gray-300 hover:text-gold transition-colors">Menu</Link>
          <Link to="/orders"      className="text-gray-300 hover:text-gold transition-colors">Orders</Link>
          <Link to="/reservations" className="text-gray-300 hover:text-gold transition-colors">Table</Link>
          <Link to="/profile"     className="text-gray-300 hover:text-gold transition-colors">Profile</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">
          {/* Cart */}
          <Link to="/cart" className="relative flex items-center gap-2 group">
            <ShoppingCart className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-crimson text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
            {totalPrice > 0 && (
              <span className="hidden sm:block text-gold font-bold text-sm">Rs.{totalPrice.toFixed(0)}</span>
            )}
          </Link>

          {/* Auth */}
          <SignedIn>
            <div className="relative" ref={dropdownRef}>
              {/* Avatar button */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1 rounded-full border-2 border-gold/40 hover:border-gold transition-all duration-300"
                aria-label="User menu"
              >
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gold" />
                  </div>
                )}
                <span className="hidden lg:block text-gold/80 text-[10px] font-black uppercase tracking-widest pr-1">
                  {user?.firstName || 'Member'}
                </span>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 w-56 bg-charcoal border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden z-[200]"
                  >
                    {/* User info header */}
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-white font-bold text-sm truncate">{user?.fullName || user?.firstName}</p>
                      <p className="text-gray-500 text-[10px] truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item"
                      >
                        <ShoppingBag className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/reservations"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item"
                      >
                        <Calendar className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                        <span>My Bookings</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group/item"
                      >
                        <SettingsIcon className="w-4 h-4 text-gold/50 group-hover/item:text-gold transition-colors" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-white/5 py-2">
                      <button
                        onClick={() => { setDropdownOpen(false); setShowSignOutModal(true); }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SignedIn>

          <SignedOut>
            <Link
              to="/sign-in"
              className="flex items-center gap-2 bg-gold text-charcoal px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:scale-105 active:scale-95 transition-all"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Link>
          </SignedOut>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2">
            <MenuIcon className="w-7 h-7 text-gold" />
          </button>
        </div>
      </nav>

      {/* ── Sign Out Confirmation Modal ── */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-charcoal border border-white/10 p-10 rounded-[3rem] max-w-sm w-full shadow-[0_40px_80px_rgba(0,0,0,0.9)] text-center relative"
            >
              {/* Close */}
              <button
                onClick={() => setShowSignOutModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              <h2 className="text-2xl font-serif font-black text-white mb-3">Sign Out?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                You will be signed out of your account. Your cart and saved items will be cleared.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-bold text-sm transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                >
                  {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
