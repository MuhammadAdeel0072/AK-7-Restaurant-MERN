import { ShoppingCart, Menu as MenuIcon, User as UserIcon, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useUser, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useState } from 'react';
import AuthModal from './AuthModal';

const Navbar = () => {
  const { state } = useCart();
  const { cartItems } = state;
  const { user, isSignedIn, isLoaded } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  // Handle loading state with a premium shimmer
  if (!isLoaded) {
    return (
      <nav className="bg-charcoal/90 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50 px-8 py-5 flex justify-between items-center overflow-hidden">
        <Link to="/" className="text-4xl font-serif font-black text-gold tracking-tighter flex items-center gap-2">
          AK-7 <span className="text-white/20 text-sm font-sans tracking-[0.3em] font-light">EXECUTIVE</span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-full animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-charcoal/80 backdrop-blur-md border-b border-gold/30 sticky top-0 z-50 px-6 py-4 flex justify-between items-center transition-colors duration-300">
      <Link to="/" className="text-3xl font-serif font-bold text-gold tracking-wider">
        AK-7 <span className="text-crimson">REST</span>
      </Link>

      <div className="hidden md:flex gap-8 items-center text-sm font-black uppercase tracking-widest">
        <Link to="/" className="hover:text-gold transition-colors">Home</Link>
        <Link to="/menu" className="hover:text-gold transition-colors">Menu</Link>
        <Link to="/orders" className="hover:text-gold transition-colors">Orders</Link>
        <Link to="/reservations" className="hover:text-gold transition-colors">Table</Link>
        <Link to="/profile" className="hover:text-gold transition-colors">Profile</Link>
      </div>

      <div className="flex items-center gap-6">
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
          <SignedIn>
            <div className="flex items-center gap-3">
              <span className="hidden lg:block text-gold/80 text-[10px] font-black uppercase tracking-widest">
                {user?.firstName ? `Chef ${user.firstName}` : 'Gourmet Member'}
              </span>
              <div className="p-0.5 rounded-full border-2 border-gold/50 hover:border-gold transition-all duration-300">
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9"
                    }
                  }}
                />
              </div>
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
        </div>
        
        <button className="md:hidden">
          <MenuIcon className="w-8 h-8 text-gold" />
        </button>
      </div>

      </nav>
    );
};

export default Navbar;
