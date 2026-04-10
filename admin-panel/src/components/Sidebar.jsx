import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Utensils, ShoppingBag, Calendar, CreditCard, Users, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo, typographyClasses } from './BrandingUtils';

const Sidebar = ({ isOpen, onClose }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Menu', path: '/menu', icon: Utensils },
    { title: 'Orders', path: '/orders', icon: ShoppingBag },
    { title: 'Reservations', path: '/reservations', icon: Calendar },
    { title: 'Payments', path: '/payments', icon: CreditCard },
    { title: 'Users', path: '/users', icon: Users },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        x: isOpen || isDesktop ? 0 : -300,
        opacity: isOpen || isDesktop ? 1 : 0
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`
        fixed lg:sticky top-0 left-0 bottom-0 w-72 glass border-r border-white/5 
        flex flex-col h-screen z-[60] shadow-2xl transition-all duration-300
        ${!isOpen && !isDesktop ? 'pointer-events-none' : 'pointer-events-auto'}
      `}
    >
      {/* Logo Section */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <BrandLogo size="md" className="flex-1" />
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-gold/10 text-gold border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                  : 'text-soft-white/60 hover:bg-white/5 hover:text-soft-white border border-transparent'
              }`
            }
          >
            <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110`} />
            <span className="font-semibold tracking-wide">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center space-x-4 w-full px-5 py-4 text-crimson hover:bg-crimson/5 rounded-xl transition-all duration-300 group border border-transparent hover:border-crimson/20"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span className="font-bold tracking-wider">LOGOUT</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
