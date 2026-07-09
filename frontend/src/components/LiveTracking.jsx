/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker, Polyline, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
}

const defaultCenter = { lat: 20.5937, lng: 78.9629 }
const STORAGE_KEY = 'uber:last-known-location'
const APPROXIMATE_LOCATION_URL = 'https://ipapi.co/json/'

const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000,
}

const readStoredLocation = () => {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
            return { lat: parsed.lat, lng: parsed.lng }
        }
    } catch {
        return null
    }
    return null
}

const writeStoredLocation = (position) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
    } catch {
        // Ignore storage failures.
    }
}

const LiveTracking = ({ pickup, destination, captainPosition, statusClassName = 'absolute left-3 top-3 z-20 max-w-[calc(100%-1.5rem)] rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm', controlsClassName = 'absolute top-3 right-3 z-20 flex flex-col gap-2' }) => {
    const mapRef = useRef(null)
    const hasLiveFixRef = useRef(false)
    const fallbackUsedRef = useRef(false)
    const [ currentPosition, setCurrentPosition ] = useState(() => readStoredLocation())
    const [ locationState, setLocationState ] = useState(() => (
        readStoredLocation()
            ? { kind: 'cached', label: 'Showing last known location' }
            : { kind: 'searching', label: 'Finding your current location...' }
    ))
    const [ directions, setDirections ] = useState(null)
    const [ pickupCoords, setPickupCoords ] = useState(null)
    const [ destCoords, setDestCoords ] = useState(null)
    const [ captainMarkerPos, setCaptainMarkerPos ] = useState(null)
    const [ mapType, setMapType ] = useState('roadmap')
    const [ zoom, setZoom ] = useState(14)

    const googleMapsApiKey = useMemo(
        () => (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim(),
        []
    )

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey,
    })

    const panToCurrent = useCallback((position) => {
        if (!mapRef.current || !position) return
        mapRef.current.panTo(position)
    }, [])

    const applyLocation = useCallback((position, state) => {
        if (!position) return

        if (state === 'live') {
            hasLiveFixRef.current = true
        }

        setCurrentPosition(position)
        setLocationState(state === 'live'
            ? { kind: 'live', label: 'Current location ready' }
            : { kind: 'approx', label: 'Approximate location ready' })
        writeStoredLocation(position)

        if (!pickup && !destination) {
            panToCurrent(position)
        }
    }, [ pickup, destination, panToCurrent ])

    const fetchApproximateLocation = useCallback(async () => {
        if (hasLiveFixRef.current || fallbackUsedRef.current) return
        fallbackUsedRef.current = true

        try {
            const response = await fetch(APPROXIMATE_LOCATION_URL, { cache: 'no-store' })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = await response.json()
            const approxLat = Number(data?.latitude)
            const approxLng = Number(data?.longitude)
            if (Number.isFinite(approxLat) && Number.isFinite(approxLng)) {
                applyLocation({ lat: approxLat, lng: approxLng }, 'approx')
            }
        } catch (error) {
            console.warn('Approximate location fallback failed:', error?.message || error)
        }
    }, [ applyLocation ])

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationState({ kind: 'approx', label: 'Location is not supported, showing approximate area' })
            fetchApproximateLocation()
            return
        }

        let mounted = true
        let watchId = null

        const acceptPosition = (pos) => {
            if (!mounted || !pos?.coords) return

            applyLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            }, 'live')
        }

        const handleLocationError = (error) => {
            if (!mounted) return

            const message = error?.message || 'Unable to determine your current location'
            if (!hasLiveFixRef.current) {
                setLocationState(prev => (
                    prev.kind === 'cached'
                        ? { kind: 'cached', label: 'Showing last known location' }
                        : { kind: 'approx', label: 'Using approximate location', detail: message }
                ))
            }
        }

        navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, geolocationOptions)
        watchId = navigator.geolocation.watchPosition(acceptPosition, handleLocationError, geolocationOptions)

        const retryTimer = window.setTimeout(() => {
            if (!mounted || hasLiveFixRef.current) return
            navigator.geolocation.getCurrentPosition(acceptPosition, handleLocationError, {
                ...geolocationOptions,
                timeout: 15000,
            })
        }, 5000)

        const fallbackTimer = window.setTimeout(() => {
            if (!mounted || hasLiveFixRef.current) return
            fetchApproximateLocation()
        }, 6000)

        return () => {
            mounted = false
            window.clearTimeout(retryTimer)
            window.clearTimeout(fallbackTimer)
            if (watchId !== null) navigator.geolocation.clearWatch(watchId)
        }
    }, [ pickup, destination, panToCurrent, fetchApproximateLocation, applyLocation ])

    useEffect(() => {
        if (!isLoaded || !pickup || !destination || !window.google?.maps) return

        let cancelled = false
        const geocoder = new window.google.maps.Geocoder()

        const geocodeAddress = (address) => new Promise((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    const location = results[0].geometry.location
                    resolve({ lat: location.lat(), lng: location.lng() })
                } else {
                    reject(new Error(status || 'Geocoding failed'))
                }
            })
        })

        Promise.all([ geocodeAddress(pickup), geocodeAddress(destination) ])
            .then(([ pickupResult, destinationResult ]) => {
                if (cancelled) return
                setPickupCoords(pickupResult)
                setDestCoords(destinationResult)
            })
            .catch((error) => {
                if (cancelled) return
                console.warn('Geocoding failed:', error?.message || error)
            })

        return () => {
            cancelled = true
        }
    }, [ isLoaded, pickup, destination ])

    useEffect(() => {
        if (!isLoaded || !pickup || !destination || !pickupCoords || !destCoords || !window.google?.maps) return

        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(pickupCoords)
        bounds.extend(destCoords)
        mapRef.current?.fitBounds(bounds)
    }, [ isLoaded, pickup, destination, pickupCoords, destCoords ])

    useEffect(() => {
        if (!isLoaded || !pickup || !destination || !window.google?.maps) return

        const directionsService = new window.google.maps.DirectionsService()
        directionsService.route(
            {
                origin: pickup,
                destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result)
                } else {
                    console.warn('Directions error:', status)
                    setDirections(null)
                }
            }
        )
    }, [ isLoaded, pickup, destination ])

    useEffect(() => {
        if (!captainPosition?.ltd || !captainPosition?.lng) return
        const pos = {
            lat: captainPosition.ltd,
            lng: captainPosition.lng,
        }
        setCaptainMarkerPos(pos)
        if (!pickup || !destination) {
            panToCurrent(pos)
        }
    }, [ captainPosition, pickup, destination, panToCurrent ])

    useEffect(() => {
        if (!pickup && !destination && currentPosition) {
            panToCurrent(currentPosition)
        }
    }, [ pickup, destination, currentPosition, panToCurrent ])

    const renderStatus = () => {
        const text = locationState.detail ? `${locationState.label}: ${locationState.detail}` : locationState.label
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
        )
    }

    if (!isLoaded || loadError || !googleMapsApiKey) {
        return (
            <div className="relative h-full w-full bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-semibold text-gray-800">Loading map...</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {!googleMapsApiKey ? 'Missing Google Maps key' : loadError ? 'Map failed to load' : 'Please wait a moment'}
                        </p>
                    </div>
                </div>
                {renderStatus()}
            </div>
        )
    }

    return (
        <div className="relative h-full w-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition || defaultCenter}
                zoom={zoom}
                onLoad={(map) => {
                    mapRef.current = map
                }}
                mapTypeId={mapType}
                onZoomChanged={() => {
                    if (mapRef.current) {
                        setZoom(mapRef.current.getZoom())
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
                                strokeColor: '#111827',
                                strokeWeight: 5,
                                strokeOpacity: 0.9,
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
                                path={[ pickupCoords, destCoords ]}
                                options={{
                                    strokeColor: '#111827',
                                    strokeWeight: 5,
                                    strokeOpacity: 0.9,
                                }}
                            />
                        )}
                        {!pickup && !destination && currentPosition && (
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
                            scaledSize: new window.google.maps.Size(44, 44),
                            anchor: new window.google.maps.Point(22, 22),
                        }}
                    />
                )}
            </GoogleMap>

            <div className={controlsClassName}>
                <button
                    onClick={() => mapRef.current?.panTo(currentPosition || defaultCenter)}
                    className="bg-white rounded-xl shadow-lg p-2.5 border border-gray-200 hover:bg-gray-50 transition"
                >
                    <i className="ri-navigation-fill text-base text-gray-700"></i>
                </button>
                <div className="flex flex-col overflow-hidden rounded-xl shadow-lg border border-gray-200">
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
                <div className="flex flex-col gap-2">
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

            {renderStatus()}
        </div>
    )
}

export default LiveTracking
