import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu as MenuIcon, Clock } from "lucide-react";
import socket, { joinKitchen } from "../services/socket";
import toast, { Toaster } from 'react-hot-toast';

const ChefLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (socket) {
      try {
        joinKitchen();
        
        // Listen for new orders
        socket.on('incomingOrder', (order) => {
          if (order) {
            toast.success(`New Order #${order.orderNumber || 'Pending'} Received!`, {
              duration: 8000,
              position: 'top-right',
              style: {
                background: '#121212',
                color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '1rem',
                fontSize: '12px',
                fontWeight: 'bold'
              },
            });
          }
        });
      } catch (error) {
        console.error("Socket initialization failed", error);
      }
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      if (socket) {
        socket.off('incomingOrder');
      }
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-charcoal text-soft-white selection:bg-gold selection:text-charcoal relative">
      <Toaster />
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Header Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-40 p-3 bg-charcoal border border-white/10 rounded-2xl text-gold shadow-2xl backdrop-blur-md"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent)] relative mt-20 lg:mt-0">
        {/* Top Header Stats */}
        <header className="hidden lg:flex items-center justify-end px-10 py-6 border-b border-white/5 bg-charcoal/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gold/40 tracking-[0.2em]">KITCHEN TIME</span>
              <div className="flex items-center gap-2 text-gold font-mono font-bold">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gold/40 tracking-[0.2em]">OPERATION MODE</span>
              <span className="text-white font-bold text-xs">LIVE - ACTIVE</span>
            </div>
          </div>
        </header>

        <section className="p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-300">
            <div className="max-w-7xl mx-auto">
                <Outlet />
            </div>
        </section>
      </main>
    </div>
  );
};

export default ChefLayout;
