import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const RiderIcon = L.divIcon({
    className: 'rider-live-icon',
    html: `
        <div class="rider-marker-live">
            <div class="pulse-ring"></div>
            <div class="rider-dot"></div>
        </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const RiderMarker = ({ position }) => {
    if (!position) return null;
    return <Marker position={[position.lat, position.lng]} icon={RiderIcon} zIndexOffset={1000} />;
};

export default RiderMarker;
