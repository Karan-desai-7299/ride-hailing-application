import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, Marker, useJsApiLoader, DirectionsRenderer, Polyline } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 }
const geolocationOptions = {
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 0,
}

const LiveTracking = ({ pickup, destination, captainPosition }) => {
    const [ currentPosition, setCurrentPosition ] = useState(null)
    const [ directions, setDirections ] = useState(null)
    const [ mapRef, setMapRef ] = useState(null)
    const [ mapType, setMapType ] = useState('roadmap')
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destCoords, setDestCoords ] = useState(null)
    const [ captainMarkerPos, setCaptainMarkerPos ] = useState(null)
    const [ zoom, setZoom ] = useState(14)
    const [ locationReady, setLocationReady ] = useState(false)
    const [ locationError, setLocationError ] = useState(null)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    })

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported in this browser')
            return
        }

        let isMounted = true

        const acceptPosition = (pos) => {
            if (!isMounted) return

            const nextPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setCurrentPosition(nextPosition)
            setLocationReady(true)
            setLocationError(null)

            if (mapRef && !pickup && !destination) {
                mapRef.panTo(nextPosition)
            }
        }

        const handleLocationError = (error) => {
            if (!isMounted) return
            setLocationError(error?.message || 'Unable to determine your current location')
            console.warn('Geolocation error:', error?.message || error)
        }

        navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, geolocationOptions)
        const watchId = navigator.geolocation.watchPosition(acceptPosition, handleLocationError, geolocationOptions)

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, geolocationOptions)
        }, 15000)

        return () => {
            isMounted = false
            navigator.geolocation.clearWatch(watchId)
            clearInterval(interval)
        }
    }, [mapRef, pickup, destination])

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

    useEffect(() => {
        if (mapRef && pickupCoords && destCoords && !directions) {
            const bounds = new window.google.maps.LatLngBounds()
            bounds.extend(pickupCoords)
            bounds.extend(destCoords)
            mapRef.fitBounds(bounds)
        }
    }, [mapRef, pickupCoords, destCoords, directions])

    useEffect(() => {
        if (mapRef && currentPosition && locationReady && !pickup && !destination) {
            mapRef.panTo(currentPosition)
        }
    }, [mapRef, currentPosition, pickup, destination, locationReady])

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

    useEffect(() => {
        if (captainPosition && captainPosition.ltd && captainPosition.lng) {
            const pos = { lat: captainPosition.ltd, lng: captainPosition.lng }
            setCaptainMarkerPos(pos)
            if (mapRef) mapRef.panTo(pos)
        }
    }, [captainPosition, mapRef])

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
                center={currentPosition || defaultCenter}
                zoom={zoom}
                onLoad={onMapLoad}
                mapTypeId={mapType}
                onZoomChanged={() => {
                    if (mapRef) {
                        setZoom(mapRef.getZoom())
                    }
                }}
                options={{
                    mapTypeControl: false,
                    zoomControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
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
                        {!pickup && !destination && locationReady && currentPosition && (
                            <Marker position={currentPosition} title="Your Location" />
                        )}
                    </>
                )}

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

            {!pickup && !destination && !locationReady && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/45 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-lg border border-gray-100">
                        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-semibold text-gray-700">
                            {locationError ? 'Enable location access' : 'Finding your current location...'}
                        </p>
                        {locationError && (
                            <p className="text-[11px] text-gray-500 text-center max-w-[220px]">
                                {locationError}
                            </p>
                        )}
                    </div>
                </div>
            )}

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

            <button
                onClick={() => mapRef?.panTo(currentPosition || defaultCenter)}
                className="absolute top-20 right-3 z-10 bg-white rounded-xl shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 transition"
            >
                <i className="ri-navigation-fill text-base text-gray-700"></i>
            </button>

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
