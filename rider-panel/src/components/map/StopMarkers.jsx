import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const createStopIcon = (number, color = '#3B82F6') => L.divIcon({
    className: 'custom-stop-icon',
    html: `
        <div class="stop-marker" style="--marker-color: ${color}">
            <div class="icon-body">
                <span class="stop-number">${number}</span>
            </div>
            <div class="marker-shadow"></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 35]
});

const RestaurantIcon = L.divIcon({
    className: 'restaurant-icon',
    html: `
        <div class="stop-marker restaurant" style="--marker-color: #E11D48">
            <div class="icon-body">
                <div class="inner-square"></div>
            </div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 35]
});

const StopMarkers = ({ restaurantLoc, activeOrders }) => {
    return (
        <>
            {/* Restaurant */}
            <Marker position={[restaurantLoc.lat, restaurantLoc.lng]} icon={RestaurantIcon}>
                <Popup className="custom-popup">
                    <div className="p-2 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-crimson">Restaurant</p>
                        <p className="text-xs font-bold text-white">DineXis HQ</p>
                    </div>
                </Popup>
            </Marker>

            {/* Clients */}
            {activeOrders.map((o, idx) => (
                o.shippingAddress?.lat && (
                    <Marker 
                        key={o._id} 
                        position={[o.shippingAddress.lat, o.shippingAddress.lng]} 
                        icon={createStopIcon(idx + 1, o.status === 'ARRIVED' ? '#10B981' : '#3B82F6')}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Stop {idx + 1}</p>
                                <p className="text-xs font-bold text-white">{o.user?.firstName} {o.user?.lastName}</p>
                                <p className="text-[10px] text-white/40 mt-1">{o.shippingAddress.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </>
    );
};

export default StopMarkers;
