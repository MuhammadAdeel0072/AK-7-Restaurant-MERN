import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { socket } from '../services/api';
import { useEffect } from 'react';

const AdminLayout = () => {
  useEffect(() => {
    socket.emit('joinKitchen');
    console.log('Admin joined kitchen room for live updates');
  }, []);

  return (
    <div className="flex h-screen bg-charcoal text-soft-white selection:bg-gold selection:text-charcoal overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent)]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
