import { createContext, useContext, useState, useEffect, useCallback } from "react";
import socket from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const OrderContext = createContext();

export const useOrderContext = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoaded, isSignedIn } = useAuth();
    
    // Retrieve settings
    const getSettings = () => {
        const stored = localStorage.getItem("chefSettings");
        if (stored) return JSON.parse(stored);
        return { sound: true, notifications: true, language: 'en' };
    };

    const triggerAlert = (type, order) => {
        const settings = getSettings();
        if (!settings.notifications) return;
        
        let message = '';
        if (type === 'NEW_ORDER') {
            message = `🔥 New Order Arrived: #${order.orderNumber}`;
            toast.success(message, { icon: '🛎️' });
        } else if (type === 'URGENT') {
            message = `🚨 URGENT Order: #${order.orderNumber}`;
            toast.error(message, { icon: '🔥' });
        } else if (type === 'DELAYED') {
            message = `⏰ Delayed Order: #${order.orderNumber} > 10m`;
            toast.error(message, { icon: '⏳' });
        }
        
        if (settings.sound) {
            // Optional basic beep using Web Audio API or just standard log
            try {
                const audio = new Audio('/alert.mp3'); // Fails gracefully if not present
                audio.play().catch(() => {});
            } catch(e) {}
        }
    };

    const fetchOrders = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            setLoading(true);
            const res = await api.get(`/chef/orders`);
            // We fetch all and allow components to filter by status
            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
            setError("Network Error: Could not sync orders.");
        } finally {
            setLoading(false);
        }
    }, [isSignedIn]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchOrders();
        }
    }, [isLoaded, isSignedIn, fetchOrders]);

    useEffect(() => {
        if (!socket || !isSignedIn) return;

        const handleOrderUpdated = (updatedOrder) => {
            setOrders(prev => {
                const exists = prev.find(o => o._id === updatedOrder._id);
                if (exists) {
                    return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                } else {
                    return [updatedOrder, ...prev];
                }
            });
        };

        const handleNewOrder = (newOrder) => {
             setOrders(prev => {
                 const exists = prev.find(o => o._id === newOrder._id);
                 if (exists) return prev;
                 return [newOrder, ...prev];
             });
             if (newOrder.status === 'PENDING' || newOrder.status === 'CONFIRMED' || newOrder.status === 'placed' || newOrder.status === 'PLACED') {
                 triggerAlert('NEW_ORDER', newOrder);
             }
             if (newOrder.priority === 'URGENT' || newOrder.priority === 'urgent') {
                 triggerAlert('URGENT', newOrder);
             }
        };

        socket.on("orderUpdated", handleOrderUpdated);
        socket.on("orderUpdate", handleOrderUpdated);
        socket.on("orderDispatchReady", handleOrderUpdated);
        socket.on("newOrder", handleNewOrder);
        socket.on("NEW_ORDER", handleNewOrder);

        return () => {
            socket.off("orderUpdated", handleOrderUpdated);
            socket.off("orderUpdate", handleOrderUpdated);
            socket.off("orderDispatchReady", handleOrderUpdated);
            socket.off("newOrder", handleNewOrder);
            socket.off("NEW_ORDER", handleNewOrder);
        };
    }, [isSignedIn]);

    // Timer logic to check for delayed orders could run here periodically
    useEffect(() => {
        if (orders.length === 0) return;
        
        const interval = setInterval(() => {
            const now = Date.now();
            orders.forEach(order => {
                // Check items in CONFIRMED / placed state
                if (order.status === 'CONFIRMED' || order.status === 'placed' || order.status === 'PLACED' || order.status === 'confirmed') {
                    const minutes = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);
                    // simple naive tracking to avoid spamming toast: only toast once at exactly 10 min mark
                    if (minutes === 10) {
                        triggerAlert('DELAYED', order);
                    }
                }
            });
        }, 60000); // Check every minute
        
        return () => clearInterval(interval);
    }, [orders]);

    return (
        <OrderContext.Provider value={{ orders, loading, error, splitOrders: fetchOrders }}>
            {children}
        </OrderContext.Provider>
    );
};
