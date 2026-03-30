import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { socket } from '../services/api';
import { useEffect, useState } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.emit('joinKitchen');
    console.log('Admin joined kitchen room for live updates');
  }, []);

  return (
    <div className="flex h-screen bg-charcoal text-soft-white selection:bg-gold selection:text-charcoal overflow-hidden relative">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 p-3 bg-charcoal border border-white/10 rounded-2xl text-gold shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-[55]"
          />
        )}
      </AnimatePresence>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent)] relative mt-20 lg:mt-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
