import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import socket, { joinKitchen } from "../services/socket";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const OrderContext = createContext();

export const useOrderContext = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error("useOrderContext must be used within an OrderProvider");
    }
    return context;
};

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoaded, isSignedIn, user } = useAuth();
    
    const isFetchingRef = useRef(false);
    const lastFetchRef = useRef(0);
    const refreshTimer = useRef(null);

    // Retrieve settings
    const getSettings = useCallback(() => {
        const stored = localStorage.getItem("chefSettings");
        if (stored) return JSON.parse(stored);
        return { sound: true, notifications: true, language: 'en' };
    }, []);

    const triggerAlert = useCallback((type, order) => {
        const settings = getSettings();
        if (!settings.notifications) return;
        
        let message = '';
        if (type === 'NEW_ORDER') {
            message = `🔥 New Order Arrived: #${order.orderNumber}`;
            toast.success(message, { id: `new-${order._id}`, icon: '🛎️' });
        } else if (type === 'URGENT') {
            message = `🚨 URGENT Order: #${order.orderNumber}`;
            toast.error(message, { id: `urgent-${order._id}`, icon: '🔥' });
        } else if (type === 'DELAYED') {
            message = `⏰ Delayed Order: #${order.orderNumber} > 10m`;
            toast.error(message, { id: `delay-${order._id}`, icon: '⏳' });
        }
        
        if (settings.sound) {
            try {
                const audio = new Audio('/alert.mp3');
                audio.play().catch(() => {});
            } catch(e) {}
        }
    }, [getSettings]);

    const fetchOrders = useCallback(async (force = false) => {
        if (!isSignedIn) return;
        
        // Prevent double-fetching within 1 second unless forced
        const now = Date.now();
        if (!force && isFetchingRef.current && (now - lastFetchRef.current < 1000)) return;
        
        isFetchingRef.current = true;
        lastFetchRef.current = now;

        try {
            // Only show full-page loading on initial load or force
            if (orders.length === 0 || force) setLoading(true);
            
            const res = await api.get(`/chef/orders`);
            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            console.error("Kitchen Sync Failure:", err);
            // If we have existing data, don't show full error screen, just a toast
            if (orders.length > 0) {
                toast.error("Lost connection to kitchen server. Retrying...", { id: 'sync-error' });
            } else {
                setError("Network Error: Could not sync orders. Please check your connection.");
            }
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [isSignedIn, orders.length]);

    // Initial load and periodic refresh
    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchOrders(true);
            joinKitchen();

            // Background refresh every 45 seconds as a safety net
            refreshTimer.current = setInterval(() => fetchOrders(), 45000);
            
            return () => {
                if (refreshTimer.current) clearInterval(refreshTimer.current);
            };
        }
    }, [isLoaded, isSignedIn, fetchOrders]);

    // Socket listeners
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
             
             const s = newOrder.status?.toUpperCase();
             if (['PENDING', 'CONFIRMED', 'PLACED', 'RECEIVED'].includes(s)) {
                 triggerAlert('NEW_ORDER', newOrder);
             }
             if (newOrder.priority?.toUpperCase() === 'URGENT' || newOrder.priority?.toUpperCase() === 'VIP') {
                 triggerAlert('URGENT', newOrder);
             }
        };

        const handleReconnect = () => {
            console.log("Kitchen Sync: Reconnected to server");
            joinKitchen();
            fetchOrders(true);
        };

        socket.on("orderUpdated", handleOrderUpdated);
        socket.on("orderUpdate", handleOrderUpdated);
        socket.on("orderDispatchReady", handleOrderUpdated);
        socket.on("newOrder", handleNewOrder);
        socket.on("NEW_ORDER", handleNewOrder);
        socket.on("reconnect", handleReconnect);
        socket.on("connect", joinKitchen);

        return () => {
            socket.off("orderUpdated", handleOrderUpdated);
            socket.off("orderUpdate", handleOrderUpdated);
            socket.off("orderDispatchReady", handleOrderUpdated);
            socket.off("newOrder", handleNewOrder);
            socket.off("NEW_ORDER", handleNewOrder);
            socket.off("reconnect", handleReconnect);
            socket.off("connect", joinKitchen);
        };
    }, [isSignedIn, fetchOrders, triggerAlert]);

    // Delayed order monitor
    useEffect(() => {
        if (orders.length === 0) return;
        
        const interval = setInterval(() => {
            const now = Date.now();
            orders.forEach(order => {
                const s = order.status?.toUpperCase();
                if (['CONFIRMED', 'PLACED', 'RECEIVED', 'PENDING'].includes(s)) {
                    const diffMs = now - new Date(order.createdAt).getTime();
                    const minutes = Math.floor(diffMs / 60000);
                    // Alert at exactly 10 and 20 minutes
                    if (minutes === 10 || minutes === 20) {
                        triggerAlert('DELAYED', order);
                    }
                }
            });
        }, 60000);
        
        return () => clearInterval(interval);
    }, [orders, triggerAlert]);

    const value = {
        orders,
        loading,
        error,
        refreshOrders: () => fetchOrders(true),
        stats: {
            active: orders.filter(o => ['PENDING', 'RECEIVED', 'PLACED', 'CONFIRMED', 'PREPARING'].includes(o.status?.toUpperCase())).length,
            ready: orders.filter(o => ['READY_FOR_DELIVERY', 'COOKED', 'PACKED'].includes(o.status?.toUpperCase())).length
        }
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};
