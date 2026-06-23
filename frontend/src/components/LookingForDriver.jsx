import React, { useState } from 'react'
import axios from 'axios'

const LookingForDriver = (props) => {
    const [ cancelling, setCancelling ] = useState(false)

    const cancelRide = async () => {
        if (!props.rideId) {
            props.setVehicleFound(false)
            return
        }
        try {
            setCancelling(true)
            await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/cancel`, {
                rideId: props.rideId
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            props.setVehicleFound(false)
        } catch (err) {
            console.error('Cancel failed', err)
        } finally {
            setCancelling(false)
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => props.setVehicleFound(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>

            {/* Header */}
            <h3 className='text-2xl font-semibold mb-2'>Looking for a Driver</h3>
            <p className='text-sm text-gray-500 mb-5'>Please wait while we find you the best driver nearby</p>

            {/* Animated spinner + vehicle */}
            <div className='flex flex-col items-center my-4'>
                <div className='relative'>
                    {/* Pulse rings */}
                    <div className='absolute inset-0 rounded-full bg-yellow-400 opacity-20 animate-ping'></div>
                    <div className='absolute inset-2 rounded-full bg-yellow-400 opacity-30 animate-ping' style={{animationDelay:'0.3s'}}></div>
                    <img className='h-20 relative z-10' src={
                        props.vehicleType === 'moto' ? 'https://img.icons8.com/color/2x/motorcycle.png' :
                        props.vehicleType === 'auto' ? 'https://img.icons8.com/color/2x/auto-rickshaw.png' :
                        'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg'
                    } alt="" />
                </div>
                {/* Animated dots */}
                <div className='flex gap-1 mt-4'>
                    <div className='h-2 w-2 rounded-full bg-gray-400 animate-bounce' style={{animationDelay:'0s'}}></div>
                    <div className='h-2 w-2 rounded-full bg-gray-400 animate-bounce' style={{animationDelay:'0.15s'}}></div>
                    <div className='h-2 w-2 rounded-full bg-gray-400 animate-bounce' style={{animationDelay:'0.3s'}}></div>
                </div>
            </div>

            {/* Trip details */}
            <div className='w-full mt-3'>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-user-fill text-green-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Pickup</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-2-fill text-red-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Destination</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.destination}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3'>
                    <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-currency-line text-blue-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Fare</p>
                        <p className='text-base font-bold'>₹{props.fare[props.vehicleType]}
                            <span className='text-xs font-normal text-gray-500 ml-1'>Cash</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Cancel Button */}
            <button
                onClick={cancelRide}
                disabled={cancelling}
                className='w-full mt-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold p-3 rounded-xl transition-colors'
            >
                {cancelling ? 'Cancelling...' : '✕ Cancel Ride'}
            </button>
        </div>
    )
}

export default LookingForDriver