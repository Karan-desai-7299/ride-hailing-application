import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer, Polyline } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 } // India center as fallback
const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
}

const LiveTracking = ({ pickup, destination, captainPosition }) => {
    const [ currentPosition, setCurrentPosition ] = useState(defaultCenter)
    const [ directions, setDirections ] = useState(null)
    const [ mapRef, setMapRef ] = useState(null)
    const [ mapType, setMapType ] = useState('roadmap') // roadmap | satellite
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destCoords, setDestCoords ] = useState(null)
    const [ captainMarkerPos, setCaptainMarkerPos ] = useState(null)
    const [ zoom, setZoom ] = useState(14)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    })

    // Get & watch current location
    useEffect(() => {
        if (!navigator.geolocation) return

        let isMounted = true

        const updateCurrentPosition = (pos) => {
            if (!isMounted) return
            const nextPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setCurrentPosition(nextPosition)

            if (mapRef && !pickup && !destination) {
                mapRef.panTo(nextPosition)
            }
        }

        const handleLocationError = (error) => {
            if (!isMounted) return
            console.warn('Geolocation error:', error?.message || error)
        }

        navigator.geolocation.getCurrentPosition(updateCurrentPosition, handleLocationError, geolocationOptions)

        const watchId = navigator.geolocation.watchPosition(updateCurrentPosition, handleLocationError, geolocationOptions)

        // Also poll every 15s for reliability on browsers that pause watch updates
        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updateCurrentPosition, handleLocationError, geolocationOptions)
        }, 15000)

        return () => {
            isMounted = false
            navigator.geolocation.clearWatch(watchId)
            clearInterval(interval)
        }
    }, [mapRef, pickup, destination])

    // Geocode pickup and destination if directions fail or as a fallback
    useEffect(() => {
        if (isLoaded && pickup && destination) {
            const geocoder = new window.google.maps.Geocoder()

            geocoder.geocode({ address: pickup }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const loc = results[0].geometry.location
                    setPickupCoords({ lat: loc.lat(), lng: loc.lng() })
                } else {
                    console.warn('Geocoding pickup failed:', status)
                }
            })

            geocoder.geocode({ address: destination }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const loc = results[0].geometry.location
                    setDestCoords({ lat: loc.lat(), lng: loc.lng() })
                } else {
                    console.warn('Geocoding destination failed:', status)
                }
            })
        }
    }, [isLoaded, pickup, destination])

    // Center and fit bounds to show both pickup and destination if directions are not loaded
    useEffect(() => {
        if (mapRef && pickupCoords && destCoords && !directions) {
            const bounds = new window.google.maps.LatLngBounds()
            bounds.extend(pickupCoords)
            bounds.extend(destCoords)
            mapRef.fitBounds(bounds)
        }
    }, [mapRef, pickupCoords, destCoords, directions])

    useEffect(() => {
        if (mapRef && currentPosition && !pickup && !destination) {
            mapRef.panTo(currentPosition)
        }
    }, [mapRef, currentPosition, pickup, destination])

    // Fetch directions
    useEffect(() => {
        if (isLoaded && pickup && destination) {
            const svc = new window.google.maps.DirectionsService()
            svc.route(
                {
                    origin: pickup,
                    destination: destination,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result)
                    } else {
                        console.error('Directions error:', status)
                    }
                }
            )
        }
    }, [isLoaded, pickup, destination])

    const onMapLoad = useCallback((map) => {
        setMapRef(map)
    }, [])

    // Update captain marker and pan map when captainPosition prop changes
    useEffect(() => {
        if (captainPosition && captainPosition.ltd && captainPosition.lng) {
            const pos = { lat: captainPosition.ltd, lng: captainPosition.lng }
            setCaptainMarkerPos(pos)
            if (mapRef) mapRef.panTo(pos)
        }
    }, [ captainPosition, mapRef ])

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 text-sm font-medium">Loading Map...</p>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={zoom}
                onLoad={onMapLoad}
                mapTypeId={mapType}
                onZoomChanged={() => {
                    if (mapRef) {
                        setZoom(mapRef.getZoom())
                    }
                }}
                options={{
                    // ── Controls ─────────────────────────────────────────
                    mapTypeControl: false,       // we build our own toggle below
                    zoomControl: false,          // we build our own controls below
                    streetViewControl: false,
                    fullscreenControl: false,    // hide — we handle fullscreen ourselves
                    // ── Style ─────────────────────────────────────────────
                    clickableIcons: false,
                    gestureHandling: 'greedy',
                }}
            >
                {directions ? (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            polylineOptions: {
                                strokeColor: '#000000',
                                strokeWeight: 5,
                                strokeOpacity: 0.85,
                            },
                            suppressMarkers: false,
                        }}
                    />
                ) : (
                    <>
                        {pickupCoords && (
                            <Marker 
                                position={pickupCoords} 
                                label={{ text: 'A', color: '#ffffff', fontWeight: 'bold' }}
                                title="Pickup Location"
                            />
                        )}
                        {destCoords && (
                            <Marker 
                                position={destCoords} 
                                label={{ text: 'B', color: '#ffffff', fontWeight: 'bold' }}
                                title="Destination Location"
                            />
                        )}
                        {pickupCoords && destCoords && (
                            <Polyline
                                path={[pickupCoords, destCoords]}
                                options={{
                                    strokeColor: '#000000',
                                    strokeWeight: 5,
                                    strokeOpacity: 0.85,
                                }}
                            />
                        )}
                        {!pickup && !destination && currentPosition && (
                            <Marker position={currentPosition} title="Your Location" />
                        )}
                    </>
                )}

                {/* Captain live location marker */}
                {captainMarkerPos && (
                    <Marker
                        position={captainMarkerPos}
                        title="Driver Location"
                        icon={{
                            url: 'https://img.icons8.com/color/48/car--v1.png',
                            scaledSize: isLoaded ? new window.google.maps.Size(44, 44) : undefined,
                            anchor: isLoaded ? new window.google.maps.Point(22, 22) : undefined,
                        }}
                    />
                )}
            </GoogleMap>

            {/* ── Custom Map/Satellite toggle (top-left, won't be covered) ── */}
            <div className="absolute top-20 left-3 z-10 flex rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        mapType === 'roadmap'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Map
                </button>
                <button
                    onClick={() => setMapType('satellite')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        mapType === 'satellite'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Satellite
                </button>
            </div>

            {/* ── Center on me button ── */}
            <button
                onClick={() => mapRef?.panTo(currentPosition)}
                className="absolute top-20 right-3 z-10 bg-white rounded-xl shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 transition"
            >
                <i className="ri-navigation-fill text-base text-gray-700"></i>
            </button>

            {/* ── Custom Zoom Controls ── */}
            <div className="absolute top-32 right-3 z-10 flex flex-col gap-2">
                <button
                    onClick={() => setZoom(prev => Math.min(prev + 1, 20))}
                    className="bg-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
                >
                    <i className="ri-add-line text-lg text-gray-700 font-bold"></i>
                </button>
                <button
                    onClick={() => setZoom(prev => Math.max(prev - 1, 1))}
                    className="bg-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
                >
                    <i className="ri-subtract-line text-lg text-gray-700 font-bold"></i>
                </button>
            </div>
        </div>
    )
}

export default LiveTracking
