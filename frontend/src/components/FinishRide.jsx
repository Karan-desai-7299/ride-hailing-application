import React from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const FinishRide = (props) => {
    const navigate = useNavigate()
    const distanceKm = props.ride?.distance ? (props.ride.distance / 1000).toFixed(1) : '–'
    const durationMin = props.ride?.duration ? Math.round(props.ride.duration / 60) : null

    async function endRide() {
        const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/end-ride`, {
            rideId: props.ride._id
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

        if (response.status === 200) {
            navigate('/captain-home')
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setFinishRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

            <h3 className='text-2xl font-semibold mb-4'>Finish this Ride</h3>

            {/* AI: Trip Summary Card */}
            <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-4'>
                <div className='flex items-center gap-3 mb-3'>
                    <div className='h-12 w-12 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-green-700 font-bold text-xl shadow-sm'>
                        {props.ride?.user.fullname.firstname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className='text-lg font-semibold capitalize'>{props.ride?.user.fullname.firstname}</h2>
                        <p className='text-xs text-gray-500'>Passenger</p>
                    </div>
                </div>
                {/* AI Trip Stats */}
                <div className='grid grid-cols-3 gap-2 mt-2'>
                    <div className='bg-white rounded-xl p-2 text-center shadow-sm'>
                        <p className='text-xs text-gray-500'>Distance</p>
                        <p className='text-base font-bold text-gray-800'>{distanceKm} KM</p>
                    </div>
                    <div className='bg-white rounded-xl p-2 text-center shadow-sm'>
                        <p className='text-xs text-gray-500'>Duration</p>
                        <p className='text-base font-bold text-gray-800'>{durationMin ? `${durationMin}m` : '–'}</p>
                    </div>
                    <div className='bg-white rounded-xl p-2 text-center shadow-sm'>
                        <p className='text-xs text-gray-500'>Fare</p>
                        <p className='text-base font-bold text-green-600'>₹{props.ride?.fare}</p>
                    </div>
                </div>
            </div>

            {/* Route Detail */}
            <div className='w-full'>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-user-fill text-green-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Pickup</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.ride?.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-2-fill text-red-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Destination</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.ride?.destination}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3'>
                    <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-currency-line text-blue-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Payment</p>
                        <p className='text-sm font-semibold text-gray-800'>₹{props.ride?.fare} — Cash</p>
                    </div>
                </div>
            </div>

            <button
                onClick={endRide}
                className='w-full mt-4 flex text-lg justify-center bg-green-600 hover:bg-green-700 text-white font-semibold p-3 rounded-xl transition-colors shadow-md'>
                🏁 Finish Ride
            </button>
        </div>
    )
}

export default FinishRide