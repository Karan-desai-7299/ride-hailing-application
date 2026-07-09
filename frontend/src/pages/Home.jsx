import { useEffect, useRef, useState, useContext } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ rideId, setRideId ] = useState(null)
    const [ historyOpen, setHistoryOpen ] = useState(false)
    const [ rideHistory, setRideHistory ] = useState([])

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/user-history`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                })
                setRideHistory(response.data)
            } catch (err) {
                console.error("Error fetching ride history:", err)
            }
        }
        fetchHistory()
    }, [ride])

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        socket.emit("join", { userType: "user", userId: user._id })
    }, [ socket, user ])

    // ── Active Ride Recovery on page refresh ─────────────────────────────────
    useEffect(() => {
        const recoverActiveRide = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/active-ride`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const activeRide = response.data
                if (!activeRide) return

                if (activeRide.status === 'ongoing') {
                    navigate('/riding', { state: { ride: activeRide } })
                } else if (activeRide.status === 'accepted') {
                    setPickup(activeRide.pickup)
                    setDestination(activeRide.destination)
                    setRide(activeRide)
                    setWaitingForDriver(true)
                } else if (activeRide.status === 'pending') {
                    setPickup(activeRide.pickup)
                    setDestination(activeRide.destination)
                    setRideId(activeRide._id)
                    setVehicleFound(true)
                }
            } catch (err) {
                // 404 = no active ride, safe to ignore
                if (err?.response?.status !== 404) {
                    console.error('Error recovering active ride:', err)
                }
            }
        }
        if (user?._id) recoverActiveRide()
    }, [ user, navigate ])

    useEffect(() => {
        let intervalId

        const syncRideState = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/active-ride`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })

                const activeRide = response.data
                if (!activeRide) return

                if (activeRide.status === 'ongoing') {
                    navigate('/riding', { state: { ride: activeRide } })
                } else if (activeRide.status === 'accepted') {
                    setPickup(activeRide.pickup)
                    setDestination(activeRide.destination)
                    setRide(activeRide)
                    setWaitingForDriver(true)
                    setVehicleFound(false)
                } else if (activeRide.status === 'pending') {
                    setPickup(activeRide.pickup)
                    setDestination(activeRide.destination)
                    setRideId(activeRide._id)
                    setVehicleFound(true)
                }
            } catch (err) {
                if (err?.response?.status !== 404) {
                    console.error('Error syncing ride state:', err)
                }
            }
        }

        if (user?._id) {
            intervalId = setInterval(syncRideState, 5000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [ user?._id, navigate ])

    useEffect(() => {
        const handleRideConfirmed = (ride) => {
            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(ride)
        }
        const handleRideStarted = (ride) => {
            console.log("ride started")
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride } })
        }
        socket.on('ride-confirmed', handleRideConfirmed)
        socket.on('ride-started', handleRideStarted)
        return () => {
            socket.off('ride-confirmed', handleRideConfirmed)
            socket.off('ride-started', handleRideStarted)
        }
    }, [socket, navigate])


    const handlePickupChange = async (e) => {
        setPickup(e.target.value)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }

            })
            setPickupSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const handleDestinationChange = async (e) => {
        setDestination(e.target.value)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setDestinationSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '75%',
                padding: 0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])


    async function findTrip() {
        setVehiclePanel(true)
        setPanelOpen(false)

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
            params: { pickup, destination },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })


        setFare(response.data)


    }

    async function createRide() {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
            pickup,
            destination,
            vehicleType
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
        if (response.data?._id) {
            setRideId(response.data._id)
        }
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            <div className='absolute left-5 top-5 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-md border border-gray-100'>
                <div className='h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center'>
                    <i className="ri-route-line text-lg"></i>
                </div>
                <span className='text-sm font-semibold text-gray-900'>Ride</span>
            </div>
            <Link to='/user/logout' className='fixed right-5 top-5 h-10 w-10 bg-white flex items-center justify-center rounded-full z-20 shadow-md'>
                <i className="text-lg font-medium ri-logout-box-r-line"></i>
            </Link>
            <div className='h-screen w-screen'>
                {/* image for temporary use  */}
                <LiveTracking />
            </div>
            <div className='flex flex-col justify-end h-screen absolute top-0 w-full z-20 pointer-events-none'>
                <div className='bg-white relative pointer-events-auto'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl z-10'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <div className='p-6 pb-3'>
                        <p className='text-xs text-gray-400 font-medium mb-0.5'>
                            {new Date().getHours() < 12 ? '🌅 Good Morning' : new Date().getHours() < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'}, <span className='capitalize font-semibold text-gray-700'>{user?.fullname?.firstname}</span>!
                        </p>
                        <h4 className='text-2xl font-semibold'>Find a trip</h4>
                        <form className='relative py-3' onSubmit={(e) => {
                            submitHandler(e)
                        }}>
                            <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-8 bg-gray-700 rounded-full"></div>
                            <input
                                onClick={() => {
                                    setPanelOpen(true)
                                    setActiveField('pickup')
                                }}
                                value={pickup}
                                onChange={handlePickupChange}
                                className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                                type="text"
                                placeholder='Add a pick-up location'
                            />
                            <input
                                onClick={() => {
                                    setPanelOpen(true)
                                    setActiveField('destination')
                                }}
                                value={destination}
                                onChange={handleDestinationChange}
                                className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3'
                                type="text"
                                placeholder='Enter your destination' />
                        </form>
                    </div>
                </div>
                <div ref={panelRef} className='bg-white h-0 overflow-y-auto pointer-events-auto'>
                    <div className='px-6 pt-2 pb-3 flex gap-3'>
                        <button
                            onClick={findTrip}
                            className='bg-black text-white px-4 py-2 rounded-lg w-full font-semibold text-sm'>
                            Find Trip
                        </button>
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className='bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm whitespace-nowrap'>
                            <i className="ri-history-line"></i> History
                        </button>
                    </div>
                    <div className='px-6'>
                        <LocationSearchPanel
                            suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                            setPanelOpen={setPanelOpen}
                            setVehiclePanel={setVehiclePanel}
                            setPickup={setPickup}
                            setDestination={setDestination}
                            activeField={activeField}
                        />
                    </div>
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}

                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    rideId={rideId}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full  z-30 bottom-0  bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>

            {/* Ride History Panel */}
            {historyOpen && (
                <div className='fixed w-full z-40 bottom-0 max-h-[70%] overflow-y-auto bg-white px-6 py-8 pt-10 rounded-t-3xl shadow-2xl transition-transform duration-300 border-t border-gray-200'>
                    <div className='flex items-center justify-between mb-6'>
                        <h3 className='text-2xl font-bold text-gray-900'>Your Rides</h3>
                        <button onClick={() => setHistoryOpen(false)} className='text-gray-500 hover:text-black text-xl font-bold p-1'><i className="ri-close-line"></i></button>
                    </div>
                    <div className='flex flex-col gap-4'>
                        {rideHistory.length === 0 ? (
                            <div className='text-center py-10 text-gray-500'>
                                <i className="ri-roadster-line text-4xl mb-2 block"></i>
                                No rides requested yet.
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
                                    {h.captain && (
                                        <div className='border-t border-gray-200/60 pt-2 mt-2 flex items-center justify-between text-xs text-gray-500'>
                                            <span>Driver: <strong className='capitalize text-gray-700'>{h.captain.fullname.firstname}</strong></span>
                                            <span>Plate: <strong className='text-gray-700'>{h.captain.vehicle.plate}</strong></span>
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

export default Home
