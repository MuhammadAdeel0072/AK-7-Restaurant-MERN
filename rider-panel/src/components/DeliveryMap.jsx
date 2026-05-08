import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Markers with Midnight Gourmet Aesthetics
const createCustomIcon = (color, isRider = false) => L.divIcon({
    className: 'custom-map-icon',
    html: `
        <div style="
            position: relative;
            width: ${isRider ? '40px' : '32px'};
            height: ${isRider ? '40px' : '32px'};
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            border: 2px solid white;
        ">
            <div style="
                transform: rotate(45deg);
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
            "></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const RiderIcon = createCustomIcon('#D4AF37', true);
const CustomerIcon = createCustomIcon('#E11D48', false);

// Component to auto-center the map when data changes
const MapBounds = ({ riderLoc, orders }) => {
    const map = useMap();
    
    useEffect(() => {
        const points = [];
        if (riderLoc) points.push([riderLoc.lat, riderLoc.lng]);
        orders.forEach(o => {
            if (o.shippingAddress?.lat && o.shippingAddress?.lng) {
                points.push([o.shippingAddress.lat, o.shippingAddress.lng]);
            }
        });

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
        }
    }, [riderLoc, orders, map]);

    return null;
};

const DeliveryMap = ({ riderLoc, activeOrders }) => {
    const defaultCenter = [33.6844, 73.0479]; // Islamabad
    
    const polylinePositions = [
        riderLoc ? [riderLoc.lat, riderLoc.lng] : null,
        ...activeOrders.map(o => o.shippingAddress?.lat ? [o.shippingAddress.lat, o.shippingAddress.lng] : null)
    ].filter(Boolean);

    return (
        <div className="w-full h-full min-h-[450px] relative group">
            {/* Map Overlay for professional feel */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-charcoal/20 z-10 rounded-[2.5rem]"></div>
            
            <MapContainer 
                center={riderLoc ? [riderLoc.lat, riderLoc.lng] : defaultCenter} 
                zoom={14} 
                className="w-full h-full rounded-[2.5rem]"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                {riderLoc && (
                    <Marker position={[riderLoc.lat, riderLoc.lng]} icon={RiderIcon}>
                        <Popup className="custom-popup">
                            <div className="font-black uppercase tracking-widest text-[9px]">Your Current Position</div>
                        </Popup>
                    </Marker>
                )}

                {activeOrders.map((order, idx) => (
                    order.shippingAddress?.lat && (
                        <Marker 
                            key={order._id} 
                            position={[order.shippingAddress.lat, order.shippingAddress.lng]}
                            icon={CustomerIcon}
                        >
                            <Popup className="custom-popup">
                                <div className="p-3 bg-charcoal text-white rounded-xl min-w-[150px]">
                                    <p className="text-[8px] font-black text-gold uppercase tracking-[0.2em] mb-1">Destination #{idx + 1}</p>
                                    <p className="font-bold text-sm tracking-tight">{order.user?.firstName} {order.user?.lastName}</p>
                                    <p className="text-[10px] text-white/40 mt-1 leading-relaxed">{order.shippingAddress.address}</p>
                                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                                        <span className="text-[9px] font-black uppercase text-gold">Rs. {order.totalPrice}</span>
                                        <span className="text-[9px] font-black uppercase text-white/20">{order.paymentMethod === 'cod' ? 'COD' : 'PAID'}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

                {polylinePositions.length > 1 && (
                    <Polyline 
                        positions={polylinePositions} 
                        color="#D4AF37" 
                        weight={5} 
                        opacity={0.8}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                <MapBounds riderLoc={riderLoc} orders={activeOrders} />
            </MapContainer>

            {/* Turn-by-Turn Style Hint Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xs">
                <div className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl backdrop-blur-2xl">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                        <div className="w-2 h-2 bg-gold rounded-full animate-ping"></div>
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-gold uppercase tracking-widest mb-0.5">Live Route Pulse</p>
                        <p className="text-[10px] font-bold text-white/60 uppercase">Real-time sync established</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryMap;
