import { useState, useEffect, useRef } from 'react';
import socket from '../services/socket';
import { updateLocation as apiUpdateLocation } from '../services/api';

export const useLiveLocation = (user, activeOrder) => {
    const [location, setLocation] = useState(null);
    const watchId = useRef(null);

    useEffect(() => {
        if (!user) return;

        if (navigator.geolocation) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const locObj = { lat, lng };
                setLocation(locObj);

                // Socket Broadcast
                socket.emit('updateRiderLocation', {
                    riderId: user._id,
                    lat,
                    lng,
                    orderId: activeOrder?._id,
                    status: activeOrder?.status || 'IDLE'
                });

                // Persistence Update
                if (activeOrder) {
                    apiUpdateLocation(activeOrder._id, lat, lng).catch(console.error);
                }
            }, (err) => {
                console.error("Geolocation Error:", err);
            }, {
                enableHighAccuracy: true,
                distanceFilter: 10,
                timeout: 5000,
                maximumAge: 0
            });
        }

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [user, activeOrder?._id]);

    return location;
};
