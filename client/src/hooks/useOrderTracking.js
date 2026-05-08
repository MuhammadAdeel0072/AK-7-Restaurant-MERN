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
            if (data.orderId === orderId || data._id === orderId) {
                const newStatus = data.status || data.deliveryStatus;
                setOrder(prev => ({ ...prev, status: newStatus, estimatedDeliveryTime: data.estimatedDeliveryTime || prev.estimatedDeliveryTime }));
                toast.success(`Order Status: ${newStatus.replace(/_/g, ' ')}!`, { id: 'status-toast' });
            }
        };

        const handleLocationUpdate = (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => ({ 
                    ...prev, 
                    riderLocation: { lat: data.lat, lng: data.lng, updatedAt: data.updatedAt } 
                }));
            }
        };

        const handleRiderAssigned = (data) => {
            if (data._id === orderId || data.orderId === orderId) {
                setOrder(prev => ({
                    ...prev,
                    status: 'ASSIGNED',
                    rider: data.rider ? {
                        name: data.riderName || (data.rider.firstName + ' ' + data.rider.lastName),
                        phone: data.riderPhone || data.rider.phoneNumber
                    } : prev.rider
                }));
                toast.success('Rider assigned to your order! 🛵');
            }
        };

        socket.on('orderStatusUpdated', handleStatusUpdate);
        socket.on('orderUpdate', handleStatusUpdate);
        socket.on('riderAssigned', handleRiderAssigned);
        socket.on('orderOutForDelivery', handleStatusUpdate);
        socket.on('orderDelivered', handleStatusUpdate);
        socket.on('riderLocationUpdated', handleLocationUpdate);
        socket.on('etaUpdated', (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => ({ ...prev, estimatedDeliveryTime: data.estimatedDeliveryTime }));
            }
        });

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
            socket.off('orderUpdate', handleStatusUpdate);
            socket.off('riderAssigned', handleRiderAssigned);
            socket.off('orderOutForDelivery', handleStatusUpdate);
            socket.off('orderDelivered', handleStatusUpdate);
            socket.off('riderLocationUpdated', handleLocationUpdate);
            socket.off('etaUpdated');
            clearInterval(checkConnectivity);
        };
    }, [socket, orderId]);

    // Polling Fallback
    useEffect(() => {
        let interval;
        if (isPolling && orderId) {
            console.log('Switching to Polling Fallback...');
            interval = setInterval(fetchOrder, 15000); // 15s polling
        }
        return () => clearInterval(interval);
    }, [isPolling, orderId, fetchOrder]);

    return { order, loading, error, isPolling, refresh: fetchOrder };
};
