import React from 'react';
import { Polyline } from 'react-leaflet';

const RouteLayer = ({ coordinates }) => {
    if (!coordinates) return null;

    return (
        <Polyline
            positions={coordinates}
            pathOptions={{
                color: '#3B82F6',
                weight: 6,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
            }}
        />
    );
};

export default RouteLayer;
