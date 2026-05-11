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

// --- GPS Error Handler (maps error codes to human-readable messages) ---
const getGeoErrorMessage = (error) => {
    switch (error.code) {
        case 1: // PERMISSION_DENIED
            return 'Location access denied. Please allow location permission in browser settings.';
        case 2: // POSITION_UNAVAILABLE
            return 'Location unavailable. GPS signal could not be acquired.';
        case 3: // TIMEOUT
            return 'Location request timed out. Retrying...';
        default:
            return 'Unknown location error occurred.';
    }
};

// --- Geolocation Options ---
// getCurrentPosition: one-shot, allow slightly cached position for reliability
const GEO_OPTIONS_ONESHOT = {
    enableHighAccuracy: true,
    timeout: 15000,       // 15s — generous for cold-start GPS lock
    maximumAge: 30000     // Accept a position cached within last 30s
};

// watchPosition: continuous, allow recent cache to prevent timeout loops
const GEO_OPTIONS_WATCH = {
    enableHighAccuracy: true,
    timeout: 30000,       // 30s — very generous to prevent TIMEOUT errors
    maximumAge: 10000     // Accept position cached within last 10s
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
    const watchIdRef = useRef(null);          // Single watcher ref — prevents duplicates
    const gpsErrorShownRef = useRef(false);   // Prevents toast spam on repeated errors
    const locationRef = useRef(null);         // Ref for location to avoid stale closures

    // Keep refs in sync with state
    useEffect(() => {
        myOrdersRef.current = myOrders;
    }, [myOrders]);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    // --- Safe one-shot position getter (Promise-based) ---
    const getCurrentPositionSafe = useCallback(() => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const locObj = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    resolve(locObj);
                },
                () => {
                    // On error, resolve with null instead of rejecting — prevents crashes
                    resolve(null);
                },
                GEO_OPTIONS_ONESHOT
            );
        });
    }, []);

    // --- Core data fetcher ---
    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const currentStats = await getRiderStats();
            setStats(currentStats);

            // Try to get current position (non-blocking)
            const locObj = await getCurrentPositionSafe();

            if (locObj) {
                setLocation(locObj);
                
                const [mine, nearby] = await Promise.all([
                    getMyOrders(locObj.lat, locObj.lng),
                    getNearbyOrders(locObj.lat, locObj.lng)
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
            } else {
                // GPS unavailable — fetch without coordinates (desktop fallback)
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
    }, [user, getCurrentPositionSafe]);

    // --- Safe permission check before starting GPS watcher ---
    const checkGeoPermission = useCallback(async () => {
        // If the Permissions API is not supported, assume 'prompt' (safe default)
        if (!navigator.permissions) return 'prompt';
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state; // 'granted' | 'denied' | 'prompt'
        } catch {
            return 'prompt'; // Fallback for browsers that don't support this query
        }
    }, []);

    // --- Start the single live GPS watcher ---
    const startLocationWatcher = useCallback(() => {
        if (!navigator.geolocation) {
            console.warn('Geolocation API not available in this browser');
            return;
        }

        // Guard: never create duplicate watchers
        if (watchIdRef.current !== null) {
            return;
        }

        const onSuccess = (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const locObj = { lat, lng };
            setLocation(locObj);

            // Reset error flag on successful position
            gpsErrorShownRef.current = false;

            // Emit to Socket.IO for real-time tracking (Admin/Client panels)
            const activeOrder = myOrdersRef.current.find(
                o => ['ACCEPTED', 'PICKED_UP', 'ARRIVED'].includes(o.status)
            );
            socket.emit('updateRiderLocation', {
                riderId: user?._id,
                lat,
                lng,
                orderId: activeOrder?._id,
                status: activeOrder?.status || 'IDLE'
            });

            // Update backend DB (for persistence/history)
            if (activeOrder) {
                apiUpdateLocation(activeOrder._id, lat, lng).catch(() => {
                    // Silent catch — non-critical, don't spam console
                });
            }
        };

        const onError = (err) => {
            console.warn('GPS Watcher Error:', err.code, err.message);

            // Only show toast ONCE per error cycle to prevent spam
            if (!gpsErrorShownRef.current) {
                gpsErrorShownRef.current = true;

                if (err.code === 1) {
                    // PERMISSION_DENIED — critical, user action required
                    toast.error('Please allow location access in your browser settings', { 
                        id: 'gps-permission',
                        duration: 8000 
                    });
                } else if (err.code === 2) {
                    // POSITION_UNAVAILABLE — transient, may recover
                    toast('Location signal unavailable. Tracking will resume when GPS is available.', { 
                        id: 'gps-unavailable',
                        icon: '📡',
                        duration: 5000 
                    });
                } else if (err.code === 3) {
                    // TIMEOUT — common on desktop, non-critical
                    // Don't show toast for timeouts — they auto-retry via watchPosition
                    console.info('GPS timeout — watchPosition will retry automatically');
                }
            }
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            onSuccess,
            onError,
            GEO_OPTIONS_WATCH
        );
    }, [user]);

    // --- Stop the GPS watcher ---
    const stopLocationWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    // --- Main Effect: socket events, data polling, GPS watcher lifecycle ---
    useEffect(() => {
        if (!user) return;

        // Initial data load
        fetchData();
        joinRiders();

        // Periodic refresh
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

        // --- Start GPS watcher with safe permission check ---
        const initGPS = async () => {
            const permission = await checkGeoPermission();

            if (permission === 'denied') {
                // User previously denied — show one-time helpful message
                toast.error('Location access was denied. Enable it in browser settings for live tracking.', {
                    id: 'gps-denied-init',
                    duration: 8000
                });
                return;
            }

            // 'granted' or 'prompt' — safe to start watcher
            // (if 'prompt', the browser will show its native permission dialog)
            startLocationWatcher();
        };

        initGPS();

        // --- Cleanup ---
        return () => {
            socket.off('order:ready');
            socket.off('orderDispatchReady');
            socket.off('orderUpdate', handleRefresh);
            if (refreshTimer.current) clearInterval(refreshTimer.current);
            stopLocationWatcher();
        };
    }, [user, fetchData, checkGeoPermission, startLocationWatcher, stopLocationWatcher]);

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
