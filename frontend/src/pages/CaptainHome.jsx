import { useRef, useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'
import LiveTracking from '../components/LiveTracking'

const CaptainHome = () => {
    const LAST_LOCATION_KEY = 'uber:last-known-location'

    const [ ridePopupPanel, setRidePopupPanel ] = useState(false)
    const [ confirmRidePopupPanel, setConfirmRidePopupPanel ] = useState(false)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ ride, setRide ] = useState(null)
    const [ historyOpen, setHistoryOpen ] = useState(false)
    const [ rideHistory, setRideHistory ] = useState([])
    const lastPendingRideIdRef = useRef(null)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/captain-history`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })
                setRideHistory(response.data)
            } catch (err) {
                console.error("Error fetching captain history:", err)
            }
        }
        fetchHistory()
    }, [ride])

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)
    const navigate = useNavigate()

    // ── Active Ride Recovery on page refresh ────────────────────────────────
    useEffect(() => {
        const recoverActiveRide = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/active-ride-captain`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                if (response.data) {
                    navigate('/captain-riding', { state: { ride: response.data } })
                }
            } catch (err) {
                if (err?.response?.status !== 404) {
                    console.error('Error recovering captain active ride:', err)
                }
            }
        }
        if (captain?._id) recoverActiveRide()
    }, [ captain, navigate ])

    useEffect(() => {
        if (!captain?._id) return

        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })

        const locationOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }

        const emitCurrentLocation = (position) => {
            const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }

            try {
                localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(currentLocation))
            } catch {
                // Ignore storage failures.
            }

            socket.emit('update-location-captain', {
                userId: captain._id,
                location: {
                    ltd: currentLocation.lat,
                    lng: currentLocation.lng
                }
            })
        }

        const handleLocationError = (error) => {
            console.warn('Captain location error:', error?.message || error)
        }

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(emitCurrentLocation, handleLocationError, locationOptions)
            }
        }

        let watchId
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(emitCurrentLocation, handleLocationError, locationOptions)
        }

        const locationInterval = setInterval(updateLocation, 15000)
        updateLocation()

        return () => {
            clearInterval(locationInterval)
            if (watchId) navigator.geolocation.clearWatch(watchId)
        }
    }, [ captain, socket ])

    useEffect(() => {
        const handleNewRide = (data) => {
            setRide(data)
            setRidePopupPanel(true)
            lastPendingRideIdRef.current = data?._id || null
        }
        socket.on('new-ride', handleNewRide)
        return () => socket.off('new-ride', handleNewRide)
    }, [socket])

    useEffect(() => {
        let intervalId

        const fetchPendingRides = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/pending-requests`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })

                const latestRide = response.data?.[0]
                if (latestRide && latestRide._id !== lastPendingRideIdRef.current) {
                    lastPendingRideIdRef.current = latestRide._id
                    setRide(latestRide)
                    setRidePopupPanel(true)
                }
            } catch (err) {
                console.error('Error polling pending rides:', err)
            }
        }

        if (captain?._id) {
            fetchPendingRides()
            intervalId = setInterval(fetchPendingRides, 5000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [captain?._id])

    async function confirmRide() {

        await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/confirm`, {

            rideId: ride._id,
            captainId: captain._id,


        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        setRidePopupPanel(false)
        setConfirmRidePopupPanel(true)

    }


    useGSAP(function () {
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ ridePopupPanel ])

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePopupPanel ])

    return (
        <div className='h-screen'>
            <div className='fixed p-3 top-0 right-0 flex items-center gap-3 z-10'>
                <div className='bg-white rounded-lg px-3 py-2 shadow-md flex items-center gap-2'>
                    <div className='h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center'>
                        <i className="ri-steering-2-line text-lg"></i>
                    </div>
                    <span className='text-sm font-semibold text-gray-900'>Driver</span>
                </div>
                <Link to='/captain/logout' className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md'>
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>
            <div className='h-3/5 w-full relative z-0'>
                <LiveTracking />
            </div>
            <div className='h-2/5 p-6 flex flex-col justify-between'>
                <CaptainDetails />
                <button
                    onClick={() => setHistoryOpen(true)}
                    className='bg-black text-white px-4 py-3 rounded-lg w-full font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-md mt-4'>
                    <i className="ri-history-line"></i> View Ride History
                </button>
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-20 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>

            {/* Ride History Panel */}
            {historyOpen && (
                <div className='fixed w-full z-40 bottom-0 max-h-[70%] overflow-y-auto bg-white px-6 py-8 pt-10 rounded-t-3xl shadow-2xl transition-transform duration-300 border-t border-gray-200'>
                    <div className='flex items-center justify-between mb-6'>
                        <h3 className='text-2xl font-bold text-gray-900'>Completed Rides</h3>
                        <button onClick={() => setHistoryOpen(false)} className='text-gray-500 hover:text-black text-xl font-bold p-1'><i className="ri-close-line"></i></button>
                    </div>
                    <div className='flex flex-col gap-4'>
                        {rideHistory.length === 0 ? (
                            <div className='text-center py-10 text-gray-500'>
                                <i className="ri-roadster-line text-4xl mb-2 block"></i>
                                No rides completed yet.
                            </div>
                        ) : (
                            rideHistory.map((h, i) => (
                                <div key={i} className='p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-2 shadow-sm'>
                                    <div className='flex items-center justify-between'>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${h.status === 'completed' ? 'bg-green-100 text-green-700' : h.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{h.status.toUpperCase()}</span>
                                        <span className='font-bold text-gray-900'>₹{h.fare}</span>
                                    </div>
                                    <div className='flex items-start gap-3 mt-1'>
                                        <i className="ri-map-pin-user-fill text-green-600 mt-1"></i>
                                        <div className='text-sm text-gray-700 font-medium'>{h.pickup}</div>
                                    </div>
                                    <div className='flex items-start gap-3'>
                                        <i className="ri-map-pin-2-fill text-red-600 mt-1"></i>
                                        <div className='text-sm text-gray-700 font-medium'>{h.destination}</div>
                                    </div>
                                    {h.user && (
                                        <div className='border-t border-gray-200/60 pt-2 mt-2 flex items-center justify-between text-xs text-gray-500'>
                                            <span>Passenger: <strong className='capitalize text-gray-700'>{h.user.fullname.firstname}</strong></span>
                                            <span>OTP: <strong className='text-gray-700'>{h.otp}</strong></span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CaptainHome
