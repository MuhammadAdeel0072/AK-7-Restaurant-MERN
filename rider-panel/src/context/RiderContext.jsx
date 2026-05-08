import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
    getAvailableOrders, 
    getMyOrders, 
    getRiderStats, 
    getNearbyOrders,
    claimOrder as apiClaimOrder,
    acceptOrder as apiAcceptOrder,
    pickupOrder as apiPickupOrder,
    arrivedAtDestination as apiArrivedOrder,
    confirmDelivery as apiDeliveredOrder,
    addToRoute as apiAddToRoute,
    updateLocation as apiUpdateLocation
} from '../services/api';
import socket, { joinRiders } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const RiderContext = createContext();

// --- Optimization Helpers ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const optimizeRoute = (riderLoc, orders) => {
    if (!riderLoc || orders.length === 0) return { sequence: orders, totalDist: 0 };
    
    let currentLoc = riderLoc;
    const unvisited = [...orders];
    const sequence = [];
    let totalDist = 0;

    while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const stop = unvisited[i].shippingAddress;
            const d = calculateDistance(currentLoc.lat, currentLoc.lng, stop?.lat, stop?.lng);
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }

        const nextStop = unvisited.splice(nearestIdx, 1)[0];
        const distToNext = calculateDistance(
            currentLoc.lat, currentLoc.lng, 
            nextStop.shippingAddress?.lat, nextStop.shippingAddress?.lng
        );
        
        totalDist += distToNext;
        sequence.push({ ...nextStop, routeDistance: distToNext.toFixed(2) });
        currentLoc = { 
            lat: nextStop.shippingAddress?.lat, 
            lng: nextStop.shippingAddress?.lng 
        };
    }

    return { sequence, totalDist: totalDist.toFixed(2) };
};

export const RiderProvider = ({ children }) => {
    const { user } = useAuth();
    const [availableOrders, setAvailableOrders] = useState([]);
    const [nearbyOrders, setNearbyOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState({ sequence: [], totalDistance: 0 });
    
    const refreshTimer = useRef(null);
    const myOrdersRef = useRef([]);

    // Keep ref in sync with state for use in geolocation callback
    useEffect(() => {
        myOrdersRef.current = myOrders;
    }, [myOrders]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const currentStats = await getRiderStats();
            setStats(currentStats);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const locObj = { lat, lng };
                    setLocation(locObj);
                    
                    const [mine, nearby] = await Promise.all([
                        getMyOrders(lat, lng),
                        getNearbyOrders(lat, lng)
                    ]);
                    
                    // Optimization Step
                    const active = mine.filter(o => o.status !== 'DELIVERED');
                    const history = mine.filter(o => o.status === 'DELIVERED');
                    const optimized = optimizeRoute(locObj, active);
                    
                    setMyOrders([...optimized.sequence, ...history]);
                    setRouteInfo({ 
                        sequence: optimized.sequence, 
                        totalDistance: optimized.totalDist 
                    });
                    setNearbyOrders(nearby);
                }, async () => {
                    const [mine, available] = await Promise.all([
                        getMyOrders(),
                        getAvailableOrders()
                    ]);
                    setMyOrders(mine);
                    setAvailableOrders(available);
                });
            } else {
                const [mine, available] = await Promise.all([
                    getMyOrders(),
                    getAvailableOrders()
                ]);
                setMyOrders(mine);
                setAvailableOrders(available);
            }
        } catch (error) {
            console.error("Failed to fetch rider data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
            joinRiders();

            refreshTimer.current = setInterval(fetchData, 30000);

            const handleRefresh = () => fetchData();

            socket.on('order:ready', () => {
                fetchData();
                toast.success('New mission available nearby! 📦', {
                    duration: 6000,
                    style: { background: '#121212', color: '#D4AF37', border: '1px solid #D4AF37' }
                });
            });

            socket.on('orderDispatchReady', () => {
                fetchData();
                toast.success('Signal Received: New Dispatch Ready! 🛰️', {
                    duration: 5000,
                    style: { background: '#121212', color: '#D4AF37', border: '1px solid #D4AF37' }
                });
            });
            
            socket.on('orderUpdate', handleRefresh);

            // --- Live Location Broadcasting ---
            let watchId = null;
            if (navigator.geolocation) {
                watchId = navigator.geolocation.watchPosition((pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const locObj = { lat, lng };
                    setLocation(locObj);

                    // Use ref to read current orders without adding to deps
                    const active = myOrdersRef.current.find(o => o.status === 'PICKED_UP' || o.status === 'ARRIVED');
                    if (active) {
                        apiUpdateLocation(active._id, lat, lng).catch(console.error);
                    }
                }, console.error, { enableHighAccuracy: true, distanceFilter: 10 });
            }

            return () => {
                socket.off('order:ready');
                socket.off('orderDispatchReady');
                socket.off('orderUpdate');
                if (refreshTimer.current) clearInterval(refreshTimer.current);
                if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            };
        }
    }, [user, fetchData]);

    const claim = async (id) => {
        const res = await apiClaimOrder(id);
        await fetchData();
        return res;
    };

    const accept = async (id) => {
        const res = await apiAcceptOrder(id);
        await fetchData();
        return res;
    };

    const pickup = async (id) => {
        const res = await apiPickupOrder(id);
        await fetchData();
        return res;
    };

    const arrive = async (id) => {
        const res = await apiArrivedOrder(id);
        await fetchData();
        return res;
    };

    const deliver = async (id, cashCollected = false) => {
        const res = await apiDeliveredOrder(id, { cashCollected });
        await fetchData();
        return res;
    };

    const batchToRoute = async (id) => {
        const res = await apiAddToRoute(id, location);
        await fetchData();
        return res;
    };

    const value = {
        availableOrders: nearbyOrders.length > 0 ? nearbyOrders : availableOrders,
        nearbyOrders,
        myOrders,
        stats,
        loading,
        location,
        routeInfo,
        refreshData: fetchData,
        claim,
        accept,
        pickup,
        arrive,
        deliver,
        batchToRoute
    };

    return (
        <RiderContext.Provider value={value}>
            {children}
        </RiderContext.Provider>
    );
};

