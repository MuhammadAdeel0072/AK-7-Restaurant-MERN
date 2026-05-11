/**
 * RoutingService.js
 * Handles fetching road-accurate routes from OSRM API
 */

export const fetchRoadRoute = async (points) => {
    if (!points || points.length < 2) return null;

    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok') {
            throw new Error('Routing API Error: ' + data.code);
        }

        const route = data.routes[0];
        return {
            coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), // Convert to [lat, lng]
            distance: (route.distance / 1000).toFixed(2), // km
            duration: (route.duration / 60).toFixed(0), // minutes
            steps: route.legs.flatMap(leg => leg.steps)
        };
    } catch (error) {
        console.error('Failed to fetch road route:', error);
        return null;
    }
};

export const decodePolyline = (str, precision = 5) => {
    // Basic polyline decoder if needed, but OSRM can return GeoJSON
    return [];
};
