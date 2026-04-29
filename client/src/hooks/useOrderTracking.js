import { useState, useEffect, useCallback, useRef } from 'react';
import { getOrderById } from '../services/orderService';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export const useOrderTracking = (orderId) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const { socket } = useSocket();
    const retryCount = useRef(0);
    const maxRetries = 3;

    const fetchOrder = useCallback(async () => {
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
            setError(null);
            retryCount.current = 0;
            return data;
        } catch (err) {
            console.error('Tracking API Failure:', err);
            if (retryCount.current < maxRetries) {
                retryCount.current += 1;
                setError(`Unable to load tracking. Retrying (${retryCount.current}/${maxRetries})...`);
                setTimeout(fetchOrder, 2000);
            } else {
                setError('Unable to load tracking. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    // Initial load
    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId, fetchOrder]);

    // Socket Handler
    useEffect(() => {
        if (!socket || !orderId) return;

        socket.emit('join', orderId);

        const handleStatusUpdate = (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => ({ ...prev, status: data.status, estimatedDeliveryTime: data.estimatedDeliveryTime || prev.estimatedDeliveryTime }));
                toast.success('Order Status Updated!', { id: 'status-toast' });
            }
        };

        const handleETAUpdate = (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => ({ ...prev, estimatedDeliveryTime: data.estimatedDeliveryTime }));
            }
        };

        socket.on('orderStatusUpdated', handleStatusUpdate);
        socket.on('etaUpdated', handleETAUpdate);

        // Polling fallback check
        const checkConnectivity = setInterval(() => {
            if (!socket.connected) {
                setIsPolling(true);
            } else {
                setIsPolling(false);
            }
        }, 5000);

        return () => {
            socket.off('orderStatusUpdated', handleStatusUpdate);
            socket.off('etaUpdated', handleETAUpdate);
            clearInterval(checkConnectivity);
        };
    }, [socket, orderId]);

    // Polling Fallback
    useEffect(() => {
        let interval;
        if (isPolling && orderId) {
            console.log('Switching to Polling Fallback Protocol...');
            interval = setInterval(fetchOrder, 15000); // 15s polling
        }
        return () => clearInterval(interval);
    }, [isPolling, orderId, fetchOrder]);

    return { order, loading, error, isPolling, refresh: fetchOrder };
};
