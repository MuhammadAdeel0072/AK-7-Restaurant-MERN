import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProfile } from './AuthContext';
import socket, { connectSocket, disconnectSocket, subscribeToOrderUpdates, unsubscribeFromOrderUpdates, subscribeToAdminActions, unsubscribeFromAdminActions } from '../services/socketService';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { profile, isSignedIn } = useProfile();
  const [notifications, setNotifications] = useState([]);
  const [siteUpdate, setSiteUpdate] = useState(null);

  useEffect(() => {
    if (isSignedIn && profile) {
      connectSocket(profile._id);

      subscribeToOrderUpdates((data) => {
        // data: { orderId, status, orderNumber }
        const message = `Order ${data.orderNumber} is now ${data.status}!`;
        
        toast.success(message, {
          duration: 6000,
          icon: '🥘',
          style: {
            background: '#1a1a1a',
            color: '#D4AF37',
            border: '1px solid #D4AF37',
          },
        });

        setNotifications((prev) => [{ ...data, message, timestamp: new Date() }, ...prev]);
        
        // Trigger site-wide update to refresh components (Orders, OrderHistory, etc)
        setSiteUpdate({ type: 'orderUpdate', ...data, timestamp: new Date() });
      });

      subscribeToAdminActions((data) => {
        // data: { type: 'menuUpdate' | 'reservationUpdate' | 'paymentUpdate' }
        setSiteUpdate({ ...data, timestamp: new Date() });
        
        if (data.type === 'menuUpdate') {
          toast('Chef has refined our culinary selection!', {
            icon: '📜',
            style: { background: '#121212', color: '#D4AF37', border: '1px solid #D4AF37/20' }
          });
        }
      });

      return () => {
        unsubscribeFromOrderUpdates();
        unsubscribeFromAdminActions();
        disconnectSocket();
      };
    }
  }, [isSignedIn, profile]);

  return (
    <SocketContext.Provider value={{ notifications, siteUpdate, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
