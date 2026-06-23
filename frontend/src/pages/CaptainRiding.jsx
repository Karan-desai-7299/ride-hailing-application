import React, { useRef, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const CaptainRiding = () => {
    const [ finishRidePanel, setFinishRidePanel ] = useState(false)
    const [ panelExpanded, setPanelExpanded ] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const rideData = location.state?.ride

    const [ chatOpen, setChatOpen ] = useState(false)
    const [ chatMessages, setChatMessages ] = useState([])
    const [ chatInput, setChatInput ] = useState('')
    const [ unread, setUnread ] = useState(0)
    const lastSeenAtRef = useRef(null)
    const chatOpenRef = useRef(false)

    useEffect(() => {
        chatOpenRef.current = chatOpen
    }, [chatOpen])

    useEffect(() => {
        let intervalId

        const fetchMessages = async () => {
            if (!rideData?._id) return
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/messages`, {
                    params: { rideId: rideData._id, ts: Date.now() },
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
                    if (message.senderType === 'captain') return false
                    if (!lastSeenAtRef.current) return true
                    return new Date(message.createdAt) > new Date(lastSeenAtRef.current)
                }).length

                setUnread(unseenCount)
            } catch (err) {
                console.error('Error syncing chat messages:', err)
            }
        }

        fetchMessages()
        if (rideData?._id) {
            intervalId = setInterval(fetchMessages, 2500)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [rideData?._id])

    const sendMessage = async () => {
        if (!chatInput.trim() || !rideData?._id) return
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/messages`, {
                rideId: rideData._id,
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

    const distanceKm = rideData?.distance ? (rideData.distance / 1000).toFixed(1) : null
    const durationMin = rideData?.duration ? Math.round(rideData.duration / 60) : null
    const vehicleType = rideData?.vehicleType || rideData?.captain?.vehicle?.vehicleType

    useGSAP(() => {
        if (finishRidePanel) {
            gsap.to(finishRidePanelRef.current, { transform: 'translateY(0)', duration: 0.35, ease: 'power2.out' })
        } else {
            gsap.to(finishRidePanelRef.current, { transform: 'translateY(100%)', duration: 0.3, ease: 'power2.in' })
        }
    }, [ finishRidePanel ])

    return (
        <div className='h-screen w-screen relative overflow-hidden bg-gray-50'>
            {chatOpen && (
                <div className='fixed inset-0 z-[900] flex flex-col justify-end'>
                    <div className='absolute inset-0 bg-black/30 backdrop-blur-[2px]' onClick={() => setChatOpen(false)} />
                    <div className='relative bg-white rounded-t-3xl shadow-2xl flex flex-col' style={{ maxHeight: '70vh' }}>
                        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
                            <div className='flex items-center gap-3'>
                                <div className='w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm'>
                                    {rideData?.user?.fullname?.firstname?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className='font-semibold text-gray-900 text-sm capitalize'>{rideData?.user?.fullname?.firstname}</p>
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
                                    <p className='text-sm'>Message your passenger</p>
                                </div>
                            ) : chatMessages.map((msg) => (
                                <div key={msg._id || `${msg.senderType}-${msg.createdAt || msg.timestamp}`} className={`flex ${msg.senderType === 'captain' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                        msg.senderType === 'captain'
                                            ? 'bg-black text-white rounded-br-md'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                    }`}>
                                        <p>{msg.text}</p>
                                        <p className={`text-[10px] mt-1 ${msg.senderType === 'captain' ? 'text-gray-300' : 'text-gray-400'}`}>
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
                className='fixed bottom-[42%] right-5 z-50 w-12 h-12 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all'
            >
                <i className="ri-message-3-fill text-lg"></i>
                {unread > 0 && (
                    <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center'>
                        {unread}
                    </span>
                )}
            </button>

            <div className='h-screen w-screen absolute inset-0 z-0'>
                <LiveTracking pickup={rideData?.pickup} destination={rideData?.destination} />
            </div>

            <div className='absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pointer-events-none'>
                <img
                    className='h-8 pointer-events-auto'
                    src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
                    alt="Uber"
                    style={{ filter: 'brightness(0)' }}
                />
                <Link
                    to='/captain-home'
                    className='h-9 w-9 bg-white flex items-center justify-center rounded-full shadow-md border border-gray-100 pointer-events-auto'
                >
                    <i className="ri-home-4-line text-base text-gray-700"></i>
                </Link>
            </div>

            <div className='absolute bottom-0 left-0 right-0 z-10'>
                <div
                    className='bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-5 border-t border-gray-100 cursor-pointer'
                    onClick={() => setPanelExpanded(!panelExpanded)}
                >
                    <div className='w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4'></div>

                    <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                            <div className='h-11 w-11 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg shadow'>
                                {rideData?.user?.fullname?.firstname?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className='font-semibold text-gray-900 capitalize leading-tight'>
                                    {rideData?.user?.fullname?.firstname} {rideData?.user?.fullname?.lastname}
                                </p>
                                <p className='text-xs text-gray-400'>Passenger</p>
                            </div>
                        </div>
                        <div className='flex gap-2'>
                            {distanceKm && (
                                <div className='bg-gray-100 rounded-xl px-3 py-1.5 text-center'>
                                    <p className='text-base font-extrabold text-gray-900 leading-none'>{distanceKm}</p>
                                    <p className='text-[10px] text-gray-400 font-medium'>KM</p>
                                </div>
                            )}
                            {durationMin && (
                                <div className='bg-gray-100 rounded-xl px-3 py-1.5 text-center'>
                                    <p className='text-base font-extrabold text-gray-900 leading-none'>{durationMin}</p>
                                    <p className='text-[10px] text-gray-400 font-medium'>MIN</p>
                                </div>
                            )}
                            <div className='bg-green-50 rounded-xl px-3 py-1.5 text-center'>
                                <p className='text-base font-extrabold text-green-700 leading-none'>₹{rideData?.fare}</p>
                                <p className='text-[10px] text-green-500 font-medium'>CASH</p>
                            </div>
                        </div>
                    </div>

                    {panelExpanded && (
                        <div className='mb-4 bg-gray-50 rounded-2xl overflow-hidden'>
                            <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-100'>
                                <div className='h-7 w-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                                    <i className="ri-map-pin-user-fill text-green-600 text-xs"></i>
                                </div>
                                <div>
                                    <p className='text-[10px] text-gray-400 uppercase tracking-wide'>Pickup</p>
                                    <p className='text-sm font-semibold text-gray-800'>{rideData?.pickup}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-3 px-4 py-3'>
                                <div className='h-7 w-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                                    <i className="ri-map-pin-2-fill text-red-600 text-xs"></i>
                                </div>
                                <div>
                                    <p className='text-[10px] text-gray-400 uppercase tracking-wide'>Destination</p>
                                    <p className='text-sm font-semibold text-gray-800'>{rideData?.destination}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setFinishRidePanel(true)
                        }}
                        className='w-full bg-black hover:bg-gray-900 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg flex items-center justify-center gap-2'
                    >
                        <i className="ri-flag-2-fill text-yellow-400 text-lg"></i>
                        Complete Ride
                    </button>
                </div>
            </div>

            <div
                ref={finishRidePanelRef}
                className='fixed w-full z-[500] bottom-0 translate-y-full bg-white rounded-t-3xl px-5 py-8 pt-12 shadow-2xl'
            >
                <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
            </div>
        </div>
    )
}

export default CaptainRiding
