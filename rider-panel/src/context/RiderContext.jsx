import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAvailableOrders, getMyOrders, getRiderStats } from '../services/api';
import socket, { joinRiders } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RiderContext = createContext();

export const useRider = () => {
    const context = useContext(RiderContext);
    if (!context) {
        throw new Error('useRider must be used within a RiderProvider');
    }
    return context;
};

export const RiderProvider = ({ children }) => {
    const { user } = useAuth();
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [available, mine, currentStats] = await Promise.all([
                getAvailableOrders(),
                getMyOrders(),
                getRiderStats()
            ]);
            setAvailableOrders(available);
            setMyOrders(mine);
            setStats(currentStats);
        } catch (error) {
            console.error("Failed to fetch rider data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
            joinRiders();

            const handleOrderUpdate = async (updatedOrder) => {
                // Update data only for specific status changes
                if (updatedOrder && (updatedOrder.status === 'ready' || updatedOrder.status === 'completed')) {
                    await fetchData();
                    
                    // Notify only for new ready orders
                    if (updatedOrder.status === 'ready' && !updatedOrder.rider) {
                        toast.success('New delivery available!', {
                            icon: '📦',
                            style: {
                                borderRadius: '10px',
                                background: '#121212',
                                color: '#D4AF37',
                                border: '1px solid rgba(212, 175, 55, 0.2)'
                            }
                        });
                    }
                }
            };

            socket.on('orderUpdate', handleOrderUpdate);

            return () => {
                socket.off('orderUpdate', handleOrderUpdate);
            };
        }
    }, [user, fetchData]);

    const value = {
        availableOrders,
        myOrders,
        stats,
        loading,
        refreshData: fetchData
    };

    return (
        <RiderContext.Provider value={value}>
            {children}
        </RiderContext.Provider>
    );
};
