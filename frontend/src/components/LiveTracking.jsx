/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const defaultCenter = [ 78.9629, 20.5937 ]; // [lng, lat] for India
const STORAGE_KEY = 'uber:last-known-location';
const APPROXIMATE_LOCATION_URL = 'https://ipapi.co/json/';

const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000,
};

const readStoredLocation = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
            return { lat: parsed.lat, lng: parsed.lng };
        }
    } catch {
        return null;
    }
    return null;
};

const writeStoredLocation = (position) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
        // Ignore storage failures.
    }
};

const LiveTracking = ({
    pickup,
    destination,
    captainPosition,
    statusClassName = 'absolute left-3 top-3 z-20 max-w-[calc(100%-1.5rem)] rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm',
    controlsClassName = 'absolute top-3 right-3 z-20 flex flex-col gap-2'
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const hasLiveFixRef = useRef(false);
    const fallbackUsedRef = useRef(false);

    // Marker references
    const currentMarkerRef = useRef(null);
    const pickupMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const captainMarkerRef = useRef(null);

    const [ currentPosition, setCurrentPosition ] = useState(() => readStoredLocation());
    const [ locationState, setLocationState ] = useState(() => (
        readStoredLocation()
            ? { kind: 'cached', label: 'Showing last known location' }
            : { kind: 'searching', label: 'Finding your current location...' }
    ));
    const [ mapType, setMapType ] = useState('streets'); // 'streets' | 'satellite'

    const mapboxToken = useMemo(() => {
        return (
            import.meta.env.VITE_MAPBOX_TOKEN ||
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
            ''
        ).trim();
    }, []);

    // Helper: Pan map
    const panToCurrent = useCallback((pos) => {
        if (!mapRef.current || !pos) return;
        mapRef.current.easeTo({
            center: [ pos.lng, pos.lat ],
            zoom: 14,
            duration: 1000
        });
    }, []);

    // Initialize Mapbox map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        mapboxgl.accessToken = mapboxToken;

        const initialCenter = currentPosition
            ? [ currentPosition.lng, currentPosition.lat ]
            : defaultCenter;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialCenter,
            zoom: currentPosition ? 14 : 4,
            attributionControl: false
        });

        mapRef.current = map;

        map.on('load', () => {
            // Add empty route source
            if (!map.getSource('route')) {
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: []
                        }
                    }
                });

                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#111827',
                        'line-width': 5,
                        'line-opacity': 0.85
                    }
                });
            }
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [ mapboxToken ]);

    // Handle Map Type (Street vs Satellite)
    const handleMapTypeChange = useCallback((type) => {
        setMapType(type);
        if (!mapRef.current) return;
        const styleUri = type === 'satellite'
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/streets-v12';

        mapRef.current.setStyle(styleUri);

        // Re-add route layer after style reload
        mapRef.current.once('style.load', () => {
            if (!mapRef.current.getSource('route')) {
                mapRef.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: []
                        }
                    }
                });
                mapRef.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#111827', 'line-width': 5, 'line-opacity': 0.85 }
                });
            }
        });
    }, []);

    // Apply location
    const applyLocation = useCallback((position, state) => {
        if (!position) return;

        if (state === 'live') {
            hasLiveFixRef.current = true;
        }

        setCurrentPosition(position);
        setLocationState(state === 'live'
            ? { kind: 'live', label: 'Current location ready' }
            : { kind: 'approx', label: 'Approximate location ready' });
        writeStoredLocation(position);

        if (!pickup && !destination) {
            panToCurrent(position);
        }
    }, [ pickup, destination, panToCurrent ]);

    // Geolocation fallback via IP
    const fetchApproximateLocation = useCallback(async () => {
        if (hasLiveFixRef.current || fallbackUsedRef.current) return;
        fallbackUsedRef.current = true;

        try {
            const response = await fetch(APPROXIMATE_LOCATION_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const approxLat = Number(data?.latitude);
            const approxLng = Number(data?.longitude);
            if (Number.isFinite(approxLat) && Number.isFinite(approxLng)) {
                applyLocation({ lat: approxLat, lng: approxLng }, 'approx');
            }
        } catch (error) {
            console.warn('Approximate location fallback failed:', error?.message || error);
        }
    }, [ applyLocation ]);

    // Watch position
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationState({ kind: 'approx', label: 'Location is not supported, showing approximate area' });
            fetchApproximateLocation();
            return;
        }

        let mounted = true;
        let watchId = null;

        const acceptPosition = (pos) => {
            if (!mounted || !pos?.coords) return;
            applyLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            }, 'live');
        };

        const handleLocationError = (error) => {
            if (!mounted) return;
            const message = error?.message || 'Unable to determine your current location';
            if (!hasLiveFixRef.current) {
                setLocationState(prev => (
                    prev.kind === 'cached'
                        ? { kind: 'cached', label: 'Showing last known location' }
                        : { kind: 'approx', label: 'Using approximate location', detail: message }
                ));
            }
        };

        navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, geolocationOptions);
        watchId = navigator.geolocation.watchPosition(acceptPosition, handleLocationError, geolocationOptions);

        const retryTimer = window.setTimeout(() => {
            if (!mounted || hasLiveFixRef.current) return;
            navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, {
                ...geolocationOptions,
                timeout: 15000,
            });
        }, 5000);

        const fallbackTimer = window.setTimeout(() => {
            if (!mounted || hasLiveFixRef.current) return;
            fetchApproximateLocation();
        }, 6000);

        return () => {
            mounted = false;
            window.clearTimeout(retryTimer);
            window.clearTimeout(fallbackTimer);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [ pickup, destination, panToCurrent, fetchApproximateLocation, applyLocation ]);

    // Update current location marker
    useEffect(() => {
        if (!mapRef.current || !currentPosition) return;

        if (!currentMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg ring-4 ring-blue-500/30';
            currentMarkerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat([ currentPosition.lng, currentPosition.lat ])
                .addTo(mapRef.current);
        } else {
            currentMarkerRef.current.setLngLat([ currentPosition.lng, currentPosition.lat ]);
        }
    }, [ currentPosition ]);

    // Geocode pickup and destination + render route
    useEffect(() => {
        if (!mapRef.current || !pickup || !destination) {
            // Remove pickup/dest markers & clear route if any
            if (pickupMarkerRef.current) {
                pickupMarkerRef.current.remove();
                pickupMarkerRef.current = null;
            }
            if (destMarkerRef.current) {
                destMarkerRef.current.remove();
                destMarkerRef.current = null;
            }
            if (mapRef.current && mapRef.current.getSource('route')) {
                mapRef.current.getSource('route').setData({
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: [] }
                });
            }
            return;
        }

        let isCancelled = false;

        const geocode = async (query) => {
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
                return data.features[0].center; // [lng, lat]
            }
            return null;
        };

        Promise.all([ geocode(pickup), geocode(destination) ])
            .then(async ([ pickupLngLat, destLngLat ]) => {
                if (isCancelled || !pickupLngLat || !destLngLat || !mapRef.current) return;

                // Add or update pickup marker
                if (!pickupMarkerRef.current) {
                    const elA = document.createElement('div');
                    elA.className = 'flex items-center justify-center w-7 h-7 bg-emerald-600 text-white text-xs font-bold rounded-full border-2 border-white shadow-md';
                    elA.innerText = 'A';
                    pickupMarkerRef.current = new mapboxgl.Marker({ element: elA })
                        .setLngLat(pickupLngLat)
                        .addTo(mapRef.current);
                } else {
                    pickupMarkerRef.current.setLngLat(pickupLngLat);
                }

                // Add or update destination marker
                if (!destMarkerRef.current) {
                    const elB = document.createElement('div');
                    elB.className = 'flex items-center justify-center w-7 h-7 bg-rose-600 text-white text-xs font-bold rounded-full border-2 border-white shadow-md';
                    elB.innerText = 'B';
                    destMarkerRef.current = new mapboxgl.Marker({ element: elB })
                        .setLngLat(destLngLat)
                        .addTo(mapRef.current);
                } else {
                    destMarkerRef.current.setLngLat(destLngLat);
                }

                // Fetch driving route
                const dirUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLngLat[0]},${pickupLngLat[1]};${destLngLat[0]},${destLngLat[1]}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
                const dirRes = await fetch(dirUrl);
                const dirData = await dirRes.json();

                if (dirData.routes && dirData.routes.length > 0 && mapRef.current.getSource('route')) {
                    const routeGeoJSON = dirData.routes[0].geometry;
                    mapRef.current.getSource('route').setData({
                        type: 'Feature',
                        properties: {},
                        geometry: routeGeoJSON
                    });

                    // Fit bounds to fit route
                    const bounds = new mapboxgl.LngLatBounds();
                    bounds.extend(pickupLngLat);
                    bounds.extend(destLngLat);
                    mapRef.current.fitBounds(bounds, { padding: 90, maxZoom: 16 });
                }
            })
            .catch(err => {
                console.warn('Mapbox route error:', err);
            });

        return () => {
            isCancelled = true;
        };
    }, [ pickup, destination, mapboxToken ]);

    // Captain Position marker
    useEffect(() => {
        if (!mapRef.current || !captainPosition?.ltd || !captainPosition?.lng) return;

        const pos = [ captainPosition.lng, captainPosition.ltd ];

        if (!captainMarkerRef.current) {
            const el = document.createElement('div');
            el.innerHTML = '<img src="https://img.icons8.com/color/48/car--v1.png" style="width: 38px; height: 38px;" />';
            captainMarkerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat(pos)
                .addTo(mapRef.current);
        } else {
            captainMarkerRef.current.setLngLat(pos);
        }

        if (!pickup && !destination) {
            mapRef.current.easeTo({ center: pos, duration: 1000 });
        }
    }, [ captainPosition, pickup, destination ]);

    const renderStatus = () => {
        const text = locationState.detail ? `${locationState.label}: ${locationState.detail}` : locationState.label;
        return (
            <div className={statusClassName}>
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                        locationState.kind === 'live'
                            ? 'bg-emerald-500'
                            : locationState.kind === 'cached' || locationState.kind === 'approx'
                                ? 'bg-amber-500'
                                : locationState.kind === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-slate-400'
                    }`} />
                    <p className="text-xs font-semibold text-gray-700">{text}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full" />

            <div className={controlsClassName}>
                <button
                    onClick={() => {
                        if (currentPosition && mapRef.current) {
                            mapRef.current.easeTo({ center: [ currentPosition.lng, currentPosition.lat ], zoom: 15, duration: 1000 });
                        }
                    }}
                    className="bg-white rounded-xl shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 transition"
                    title="Current location"
                >
                    <i className="ri-navigation-fill text-base text-gray-700"></i>
                </button>
                <div className="flex flex-col overflow-hidden rounded-xl shadow-lg border border-gray-200">
                    <button
                        onClick={() => handleMapTypeChange('streets')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            mapType === 'streets'
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Map
                    </button>
                    <button
                        onClick={() => handleMapTypeChange('satellite')}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            mapType === 'satellite'
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Satellite
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
                        className="bg-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
                    >
                        <i className="ri-add-line text-lg text-gray-700 font-bold"></i>
                    </button>
                    <button
                        onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
                        className="bg-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
                    >
                        <i className="ri-subtract-line text-lg text-gray-700 font-bold"></i>
                    </button>
                </div>
            </div>

            {renderStatus()}
        </div>
    );
};

export default LiveTracking;
