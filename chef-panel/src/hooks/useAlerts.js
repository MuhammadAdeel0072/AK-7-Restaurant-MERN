import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import soundService from '../services/soundService';
import toast from 'react-hot-toast';

const useAlerts = () => {
    const [alerts, setAlerts] = useState([]);

    const addAlert = useCallback((alert) => {
        const newAlert = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...alert
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50
        
        if (alert.type === 'new-order') {
            soundService.playNewOrder();
        } else if (alert.type === 'delayed' || alert.type === 'priority') {
            soundService.playAlert();
        }
    }, []);

    const processedOrders = useRef(new Set());

    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = (order) => {
            if (!order || !order.orderNumber) return;
            if (processedOrders.current.has(order.orderNumber)) return;
            processedOrders.current.add(order.orderNumber);

            addAlert({
                type: 'new-order',
                title: 'New Incoming Culinary Request',
                message: `Order #${order.orderNumber || order._id.slice(-6).toUpperCase()} received.`,
                priority: order.priority || 'normal'
            });
        };

        socket.on('NEW_ORDER', handleNewOrder);
        socket.on('newOrder', handleNewOrder);

        socket.on('orderUpdate', (order) => {
            // Check for specific updates that need alerts (e.g., cancelled)
            if (order.status === 'cancelled') {
                addAlert({
                    type: 'priority',
                    title: 'ORDER CANCELLED',
                    message: `Order #${order.orderNumber || order._id.slice(-6).toUpperCase()} has been cancelled by host/customer.`,
                    priority: 'urgent'
                });
            }
        });

        return () => {
            socket.off('NEW_ORDER', handleNewOrder);
            socket.off('newOrder', handleNewOrder);
            socket.off('orderUpdate');
        };
    }, [addAlert]);

    const markRead = (id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const clearAll = () => {
        setAlerts([]);
    };

    return { alerts, markRead, clearAll, addAlert };
};

export default useAlerts;
