import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoadRoute } from '../../services/RoutingService';
import NavigationPanel from '../NavigationPanel';
import RiderMarker from './RiderMarker';
import StopMarkers from './StopMarkers';
import RouteLayer from './RouteLayer';
import './RiderMap.css';

const MapController = ({ riderLoc, centerTrigger }) => {
    const map = useMap();
    const firstLoad = useRef(true);

    useEffect(() => {
        if (firstLoad.current && riderLoc) {
            map.setView([riderLoc.lat, riderLoc.lng], 16);
            firstLoad.current = false;
        }
    }, [riderLoc, map]);

    useEffect(() => {
        if (centerTrigger > 0 && riderLoc) {
            map.panTo([riderLoc.lat, riderLoc.lng], { animate: true });
        }
    }, [centerTrigger, riderLoc, map]);

    return null;
};

const RiderMap = ({ order, riderLoc, allOrders = [] }) => {
    const [route, setRoute] = useState(null);
    const [centerTrigger, setCenterTrigger] = useState(0);
    const lastRecalcLoc = useRef(null);

    const restaurantLoc = { lat: 33.6844, lng: 73.0479 };

    const getRoutePoints = useCallback(() => {
        if (!riderLoc) return [];
        const activeOrders = allOrders.filter(o => ['ACCEPTED', 'PICKED_UP', 'ARRIVED'].includes(o.status));
        const points = [{ lat: riderLoc.lat, lng: riderLoc.lng }];
        const needsPickup = activeOrders.some(o => o.status === 'ACCEPTED');
        if (needsPickup) points.push(restaurantLoc);
        activeOrders.forEach(o => {
            if (o.shippingAddress?.lat && o.shippingAddress?.lng) {
                points.push({ lat: o.shippingAddress.lat, lng: o.shippingAddress.lng });
            }
        });
        return points;
    }, [riderLoc, allOrders]);

    const updateRoute = useCallback(async () => {
        const points = getRoutePoints();
        if (points.length < 2) return;
        const roadData = await fetchRoadRoute(points);
        if (roadData) {
            setRoute(roadData);
            lastRecalcLoc.current = riderLoc;
        }
    }, [getRoutePoints, riderLoc]);

    useEffect(() => {
        updateRoute();
    }, [updateRoute]);

    useEffect(() => {
        if (!riderLoc || !lastRecalcLoc.current) return;
        const distMoved = Math.sqrt(
            Math.pow(riderLoc.lat - lastRecalcLoc.current.lat, 2) + 
            Math.pow(riderLoc.lng - lastRecalcLoc.current.lng, 2)
        );
        if (distMoved > 0.002) updateRoute();
    }, [riderLoc, updateRoute]);

    const activeOrders = allOrders.filter(o => ['ACCEPTED', 'PICKED_UP', 'ARRIVED'].includes(o.status));
    const nextStopOrder = activeOrders[0];
    const nextStop = nextStopOrder?.status === 'ACCEPTED' 
        ? { name: 'Restaurant', address: 'DineXis Kitchen', lat: restaurantLoc.lat, lng: restaurantLoc.lng }
        : { 
            name: `${nextStopOrder?.user?.firstName}'s Home`, 
            address: nextStopOrder?.shippingAddress?.address,
            lat: nextStopOrder?.shippingAddress?.lat,
            lng: nextStopOrder?.shippingAddress?.lng
          };

    return (
        <div className="relative w-full h-[500px] md:h-[650px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-charcoal group">
            <MapContainer
                center={riderLoc ? [riderLoc.lat, riderLoc.lng] : [restaurantLoc.lat, restaurantLoc.lng]}
                zoom={16}
                className="w-full h-full"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <RouteLayer coordinates={route?.coordinates} />
                <StopMarkers restaurantLoc={restaurantLoc} activeOrders={activeOrders} />
                <RiderMarker position={riderLoc} />
                <MapController riderLoc={riderLoc} centerTrigger={centerTrigger} />
            </MapContainer>

            <NavigationPanel 
                routeInfo={route} 
                nextStop={nextStop}
                onRecalculate={updateRoute}
                onCenter={() => setCenterTrigger(prev => prev + 1)}
            />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-charcoal via-transparent to-charcoal/40" />
        </div>
    );
};

export default RiderMap;
