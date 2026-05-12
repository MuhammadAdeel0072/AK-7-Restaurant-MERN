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
    confirmCODCollection as apiConfirmCOD,
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

// --- GPS Error Handler ---
const getGeoErrorMessage = (error) => {
    switch (error.code) {
        case 1: return 'Location access denied. Please allow location permission.';
        case 2: return 'Location unavailable. Tracking paused.';
        case 3: return 'Location request timed out. Retrying...';
        default: return 'Unknown location error.';
    }
};

// --- Geolocation Options ---
const GEO_OPTIONS_ONESHOT = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
};

const GEO_OPTIONS_WATCH = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 10000
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
    const watchIdRef = useRef(null);          
    const gpsErrorShownRef = useRef(false);   
    const locationRef = useRef(null);         
    const isFetchingRef = useRef(false);

    useEffect(() => {
        myOrdersRef.current = myOrders;
    }, [myOrders]);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    const getCurrentPositionSafe = useCallback(() => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                GEO_OPTIONS_ONESHOT
            );
        });
    }, []);

    const fetchData = useCallback(async () => {
        if (!user || isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            const locObj = await getCurrentPositionSafe();
            if (locObj) setLocation(locObj);

            const [mine, nearby, currentStats] = await Promise.all([
                getMyOrders(locObj?.lat, locObj?.lng),
                getNearbyOrders(locObj?.lat, locObj?.lng),
                getRiderStats()
            ]);

            setStats(currentStats);
            setNearbyOrders(nearby);

            const active = mine.filter(o => o.status !== 'DELIVERED');
            const history = mine.filter(o => o.status === 'DELIVERED');
            
            if (locObj && active.length > 0) {
                const optimized = optimizeRoute(locObj, active);
                setMyOrders([...optimized.sequence, ...history]);
                setRouteInfo({ sequence: optimized.sequence, totalDistance: optimized.totalDist });
            } else {
                setMyOrders(mine);
            }
        } catch (error) {
            console.error("Fetch Failure:", error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [user, getCurrentPositionSafe]);

    const startLocationWatcher = useCallback(() => {
        if (!navigator.geolocation || watchIdRef.current !== null) return;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                setLocation({ lat, lng });
                gpsErrorShownRef.current = false;

                const activeOrder = myOrdersRef.current.find(o => ['ACCEPTED', 'PICKED_UP', 'ARRIVED'].includes(o.status));
                
                socket.emit('updateRiderLocation', {
                    riderId: user?._id,
                    lat, lng,
                    orderId: activeOrder?._id,
                    status: activeOrder?.status || 'IDLE'
                });

                if (activeOrder) {
                    apiUpdateLocation(activeOrder._id, lat, lng).catch(() => {});
                }
            },
            (err) => {
                if (gpsErrorShownRef.current) return;
                if (err.code === 3) return; // Ignore timeout spam

                gpsErrorShownRef.current = true;
                const msg = getGeoErrorMessage(err);
                toast.error(msg, { id: 'gps-error', duration: 4000 });
            },
            GEO_OPTIONS_WATCH
        );
    }, [user]);

    const stopLocationWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        fetchData();
        joinRiders();
        startLocationWatcher();

        const handleRefresh = () => fetchData();

        socket.on('order:ready', () => {
            fetchData();
            toast.success('New mission available nearby! 📦', { id: 'new-order' });
        });

        socket.on('orderDispatchReady', () => {
            fetchData();
            toast.success('Signal Received: New Dispatch Ready! 🛰️', { id: 'dispatch' });
        });
        
        socket.on('orderUpdate', handleRefresh);
        socket.on('reconnect', () => {
            joinRiders();
            fetchData();
        });

        refreshTimer.current = setInterval(fetchData, 45000);

        return () => {
            socket.off('order:ready');
            socket.off('orderDispatchReady');
            socket.off('orderUpdate');
            socket.off('reconnect');
            if (refreshTimer.current) clearInterval(refreshTimer.current);
            stopLocationWatcher();
        };
    }, [user, fetchData, startLocationWatcher, stopLocationWatcher]);

    const updateLocalOrderStatus = (orderId, newStatus, extraData = {}) => {
        setMyOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus, ...extraData } : o));
    };

    const claim = async (id) => {
        const res = await apiClaimOrder(id);
        fetchData(); 
        return res;
    };

    const accept = async (id) => {
        updateLocalOrderStatus(id, 'ACCEPTED'); 
        try {
            const res = await apiAcceptOrder(id);
            return res;
        } catch (err) {
            fetchData(); 
            throw err;
        }
    };

    const pickup = async (id) => {
        updateLocalOrderStatus(id, 'PICKED_UP'); 
        try {
            const res = await apiPickupOrder(id);
            return res;
        } catch (err) {
            fetchData();
            throw err;
        }
    };

    const arrive = async (id) => {
        updateLocalOrderStatus(id, 'ARRIVED'); 
        try {
            const res = await apiArrivedOrder(id);
            return res;
        } catch (err) {
            fetchData();
            throw err;
        }
    };

    const deliver = async (id, cashCollected = false) => {
        updateLocalOrderStatus(id, 'DELIVERED'); 
        try {
            const res = await apiDeliveredOrder(id, { cashCollected });
            fetchData();
            return res;
        } catch (err) {
            fetchData();
            throw err;
        }
    };

    const batchToRoute = async (id) => {
        const res = await apiAddToRoute(id, locationRef.current);
        fetchData();
        return res;
    };

    const collect = async (id) => {
        updateLocalOrderStatus(id, 'ARRIVED', { cashCollected: true }); 
        try {
            const res = await apiConfirmCOD(id);
            return res;
        } catch (err) {
            fetchData();
            throw err;
        }
    };

    const value = {
        availableOrders: nearbyOrders.length > 0 ? nearbyOrders : availableOrders,
        myOrders,
        stats,
        loading,
        location,
        routeInfo,
        refreshData: fetchData,
        claim, accept, pickup, arrive, collect, deliver, batchToRoute
    };

    return (
        <RiderContext.Provider value={value}>
            {children}
        </RiderContext.Provider>
    );
};
