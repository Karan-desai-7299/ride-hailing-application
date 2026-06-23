import React, { useState, useEffect, useContext, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SocketContext } from '../context/SocketContext'
import axios from 'axios'
import LiveTracking from '../components/LiveTracking'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {}
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const vehicleType = ride?.vehicleType || ride?.captain?.vehicle?.vehicleType
    const distanceKm = ride?.distance ? (ride.distance / 1000).toFixed(1) : null
    const durationMin = ride?.duration ? Math.round(ride.duration / 60) : null

    const [ captainPosition, setCaptainPosition ] = useState(null)
    const [ chatOpen, setChatOpen ] = useState(false)
    const [ chatMessages, setChatMessages ] = useState([])
    const [ chatInput, setChatInput ] = useState('')
    const [ unread, setUnread ] = useState(0)
    const [ showRating, setShowRating ] = useState(false)
    const [ starRating, setStarRating ] = useState(0)
    const [ hoverStar, setHoverStar ] = useState(0)
    const [ reviewText, setReviewText ] = useState('')
    const lastSeenAtRef = useRef(null)
    const chatOpenRef = useRef(false)

    useEffect(() => {
        const handleRideEnded = () => setShowRating(true)
        socket.on('ride-ended', handleRideEnded)
        return () => socket.off('ride-ended', handleRideEnded)
    }, [socket])

    useEffect(() => {
        const handleCaptainLocation = (coords) => {
            setCaptainPosition(coords)
        }
        socket.on('captain-location-updated', handleCaptainLocation)
        return () => socket.off('captain-location-updated', handleCaptainLocation)
    }, [socket])

    useEffect(() => {
        chatOpenRef.current = chatOpen
    }, [chatOpen])

    useEffect(() => {
        let intervalId

        const fetchMessages = async () => {
            if (!ride?._id) return
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/messages`, {
                    params: { rideId: ride._id },
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })

                const normalizedMessages = (response.data || []).map(message => ({
                    ...message,
                    timestamp: message.createdAt
                }))

                setChatMessages(normalizedMessages)

                if (chatOpenRef.current) {
                    setUnread(0)
                    if (normalizedMessages.length > 0) {
                        lastSeenAtRef.current = normalizedMessages[normalizedMessages.length - 1].createdAt
                    }
                    return
                }

                const unseenCount = normalizedMessages.filter(message => {
                    if (message.senderType === 'user') return false
                    if (!lastSeenAtRef.current) return true
                    return new Date(message.createdAt) > new Date(lastSeenAtRef.current)
                }).length

                setUnread(unseenCount)
            } catch (err) {
                console.error('Error syncing chat messages:', err)
            }
        }

        fetchMessages()
        if (ride?._id) {
            intervalId = setInterval(fetchMessages, 4000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [ride?._id])

    useEffect(() => {
        let intervalId

        const syncRideStatus = async () => {
            if (!ride?._id) return
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/user-history`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const currentRide = response.data?.find(item => item._id === ride._id)
                if (currentRide?.status === 'completed') {
                    setShowRating(true)
                }
            } catch (err) {
                console.error('Error syncing ride status:', err)
            }
        }

        if (ride?._id) {
            intervalId = setInterval(syncRideStatus, 5000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [ride?._id])

    const sendMessage = async () => {
        if (!chatInput.trim() || !ride?._id) return
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/messages`, {
                rideId: ride._id,
                text: chatInput.trim()
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })

            const message = { ...response.data, timestamp: response.data.createdAt }
            setChatMessages(prev => {
                const next = [ ...prev.filter(item => item._id !== message._id), message ]
                return next.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp))
            })
            setChatInput('')
            setUnread(0)
            lastSeenAtRef.current = message.createdAt
        } catch (err) {
            console.error('Error sending message:', err)
        }
    }

    const openChat = () => {
        setChatOpen(true)
        setUnread(0)
        if (chatMessages.length > 0) {
            lastSeenAtRef.current = chatMessages[chatMessages.length - 1].createdAt || chatMessages[chatMessages.length - 1].timestamp
        }
    }

    const submitRating = () => {
        navigate('/home')
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            {showRating && (
                <div className='fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4'>
                    <div className='bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl'>
                        <div className='text-center mb-2'>
                            <div className='w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3'>
                                <i className="ri-star-smile-fill text-yellow-400 text-3xl"></i>
                            </div>
                            <h2 className='text-xl font-bold text-gray-900'>How was your ride?</h2>
                            <p className='text-sm text-gray-500 mt-1'>
                                Rate your experience with <span className='font-semibold capitalize text-gray-700'>{ride?.captain?.fullname?.firstname}</span>
                            </p>
                        </div>

                        <div className='flex justify-center gap-2 my-4'>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverStar(star)}
                                    onMouseLeave={() => setHoverStar(0)}
                                    onClick={() => setStarRating(star)}
                                    className='text-4xl transition-transform hover:scale-110 active:scale-95'
                                >
                                    <i className={`${(hoverStar || starRating) >= star ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-gray-300'}`}></i>
                                </button>
                            ))}
                        </div>

                        {starRating > 0 && (
                            <p className='text-center text-sm font-medium text-gray-600 mb-3'>
                                {['', 'Terrible 😣', 'Poor 😕', 'Okay 😐', 'Good 😊', 'Excellent! 🤩'][starRating]}
                            </p>
                        )}

                        <textarea
                            value={reviewText}
                            onChange={e => setReviewText(e.target.value)}
                            placeholder='Share your experience (optional)...'
                            rows={3}
                            className='w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 bg-gray-50'
                        />

                        <button
                            onClick={submitRating}
                            disabled={starRating === 0}
                            className='w-full mt-4 bg-black text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 active:scale-[0.98]'
                        >
                            Submit Rating
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className='w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors'
                        >
                            Skip
                        </button>
                    </div>
                </div>
            )}

            {chatOpen && (
                <div className='fixed inset-0 z-[900] flex flex-col justify-end'>
                    <div className='absolute inset-0 bg-black/30 backdrop-blur-[2px]' onClick={() => setChatOpen(false)} />
                    <div className='relative bg-white rounded-t-3xl shadow-2xl flex flex-col' style={{ maxHeight: '70vh' }}>
                        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
                            <div className='flex items-center gap-3'>
                                <div className='w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm'>
                                    {ride?.captain?.fullname?.firstname?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className='font-semibold text-gray-900 text-sm capitalize'>{ride?.captain?.fullname?.firstname}</p>
                                    <p className='text-[11px] text-green-500 font-medium'>● Online</p>
                                </div>
                            </div>
                            <button onClick={() => setChatOpen(false)} className='text-gray-400 hover:text-gray-700 text-xl'>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2' style={{ minHeight: '200px' }}>
                            {chatMessages.length === 0 ? (
                                <div className='flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-8'>
                                    <i className="ri-chat-3-line text-3xl"></i>
                                    <p className='text-sm'>Say hi to your driver!</p>
                                </div>
                            ) : chatMessages.map((msg) => (
                                <div key={msg._id || `${msg.senderType}-${msg.createdAt || msg.timestamp}`} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                        msg.senderType === 'user'
                                            ? 'bg-black text-white rounded-br-md'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                    }`}>
                                        <p>{msg.text}</p>
                                        <p className={`text-[10px] mt-1 ${msg.senderType === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='px-4 py-3 border-t border-gray-100 flex gap-2 items-center'>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder='Type a message...'
                                className='flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10'
                            />
                            <button
                                onClick={sendMessage}
                                className='w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center shrink-0 hover:bg-gray-800 active:scale-95 transition-all'
                            >
                                <i className="ri-send-plane-fill text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={openChat}
                className='fixed bottom-[52%] right-5 z-50 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all'
            >
                <i className="ri-message-3-fill text-lg"></i>
                {unread > 0 && (
                    <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center'>
                        {unread}
                    </span>
                )}
            </button>

            <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full z-10 shadow-md'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <LiveTracking pickup={ride?.pickup} destination={ride?.destination} captainPosition={captainPosition} />
            </div>
            <div className='h-1/2 p-4 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <div className='h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl shadow'>
                            {ride?.captain?.fullname?.firstname?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className='text-base font-semibold capitalize'>{ride?.captain?.fullname?.firstname}</h2>
                            <p className='text-xs text-gray-500 capitalize'>{ride?.captain?.vehicle?.color} {vehicleType === 'moto' ? 'Motorcycle' : vehicleType}</p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <span className='text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg tracking-widest'>
                            {ride?.captain?.vehicle?.plate}
                        </span>
                        <img
                            className='h-10 mt-1 ml-auto'
                            src={
                                vehicleType === 'moto' ? 'https://img.icons8.com/color/2x/motorcycle.png' :
                                vehicleType === 'auto' ? 'https://img.icons8.com/color/2x/auto-rickshaw.png' :
                                'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg'
                            }
                            alt=""
                        />
                    </div>
                </div>

                {(distanceKm || durationMin) && (
                    <div className='grid grid-cols-3 gap-2 mb-3'>
                        <div className='bg-gray-50 rounded-xl p-2 text-center'>
                            <p className='text-xs text-gray-400'>Distance</p>
                            <p className='text-sm font-bold'>{distanceKm || '–'} KM</p>
                        </div>
                        <div className='bg-gray-50 rounded-xl p-2 text-center'>
                            <p className='text-xs text-gray-400'>Est. Time</p>
                            <p className='text-sm font-bold'>{durationMin ? `${durationMin}m` : '–'}</p>
                        </div>
                        <div className='bg-gray-50 rounded-xl p-2 text-center'>
                            <p className='text-xs text-gray-400'>Fare</p>
                            <p className='text-sm font-bold text-green-600'>₹{ride?.fare}</p>
                        </div>
                    </div>
                )}

                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-7 w-7 rounded-full bg-red-100 flex items-center justify-center'>
                        <i className="ri-map-pin-2-fill text-red-600 text-xs"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase'>Destination</p>
                        <p className='text-sm font-semibold'>{ride?.destination}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3'>
                    <div className='h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center'>
                        <i className="ri-currency-line text-blue-600 text-xs"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase'>Payment</p>
                        <p className='text-sm font-semibold'>₹{ride?.fare} — Cash</p>
                    </div>
                </div>

                <button className='w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold p-3 rounded-xl transition-colors shadow-md'>
                    💳 Make a Payment
                </button>
            </div>
        </div>
    )
}

export default Riding
