import { ShoppingCart, Menu as MenuIcon, User as UserIcon, LogIn, Sun, Moon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useState } from 'react';
import AuthModal from './AuthModal';

const Navbar = () => {
  const { state } = useCart();
  const { cartItems } = state;
  const { user, isSignedIn } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return (
    <nav className="bg-charcoal/80 backdrop-blur-md border-b border-gold/30 sticky top-0 z-50 px-6 py-4 flex justify-between items-center transition-colors duration-300">
      <Link to="/" className="text-3xl font-serif font-bold text-gold tracking-wider">
        AK-7 <span className="text-crimson">REST</span>
      </Link>

      <div className="hidden md:flex gap-8 items-center text-lg font-medium">
        <Link to="/" className="hover:text-gold transition-colors">Home</Link>
        <Link to="/menu" className="hover:text-gold transition-colors">Menu</Link>
        <Link to="/orders" className="hover:text-gold transition-colors">Orders</Link>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={toggleTheme} className="text-gold hover:text-white transition-colors">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <Link to="/cart" className="relative flex items-center gap-2 group">
          <ShoppingCart className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-crimson text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
          <span className="hidden sm:block text-gold font-bold">${totalPrice.toFixed(2)}</span>
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden lg:block text-gold/80 text-sm">Hello, {user.firstName || 'User'}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold px-4 py-2 rounded-full border border-gold/50 transition-all active:scale-95"
            >
              <LogIn size={20} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
        
        <button className="md:hidden">
          <MenuIcon className="w-8 h-8 text-gold" />
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </nav>
  );
};

export default Navbar;
