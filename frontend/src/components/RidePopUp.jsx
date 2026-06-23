import React from 'react'

const RidePopUp = (props) => {
    const distanceKm = props.ride?.distance ? (props.ride.distance / 1000).toFixed(1) : null
    const durationMin = props.ride?.duration ? Math.round(props.ride.duration / 60) : null

    // AI: determine best value badge
    const fare = props.ride?.fare

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-400 ri-arrow-down-wide-line cursor-pointer"></i></h5>

            {/* Header */}
            <div className='flex items-center gap-2 mb-4'>
                <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse'></div>
                <h3 className='text-2xl font-semibold'>New Ride Available!</h3>
            </div>

            {/* Passenger Card */}
            <div className='flex items-center justify-between p-3 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-xl mt-2 shadow-sm'>
                <div className='flex items-center gap-3'>
                    <div className='h-12 w-12 rounded-full bg-white flex items-center justify-center text-yellow-600 font-bold text-xl shadow'>
                        {props.ride?.user.fullname.firstname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className='text-lg font-semibold capitalize'>
                            {props.ride?.user.fullname.firstname} {props.ride?.user.fullname.lastname}
                        </h2>
                        <p className='text-xs text-yellow-800 font-medium'>Passenger</p>
                    </div>
                </div>
                <div className='text-right'>
                    {distanceKm && (
                        <h5 className='text-lg font-bold'>{distanceKm} KM</h5>
                    )}
                    {durationMin && (
                        <p className='text-xs text-yellow-800'>{durationMin} min trip</p>
                    )}
                </div>
            </div>

            {/* Trip Details */}
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-4'>
                    <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                        <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center'>
                            <i className="ri-map-pin-user-fill text-green-600 text-sm"></i>
                        </div>
                        <div>
                            <h3 className='text-sm text-gray-500 uppercase tracking-wide font-medium'>Pickup</h3>
                            <p className='text-sm font-semibold text-gray-800'>{props.ride?.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                        <div className='h-8 w-8 rounded-full bg-red-100 flex items-center justify-center'>
                            <i className="ri-map-pin-2-fill text-red-600 text-sm"></i>
                        </div>
                        <div>
                            <h3 className='text-sm text-gray-500 uppercase tracking-wide font-medium'>Destination</h3>
                            <p className='text-sm font-semibold text-gray-800'>{props.ride?.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4 p-3'>
                        <div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center'>
                            <i className="ri-currency-line text-blue-600 text-sm"></i>
                        </div>
                        <div>
                            <h3 className='text-sm text-gray-500 uppercase tracking-wide font-medium'>Fare</h3>
                            <p className='text-lg font-bold text-gray-900'>₹{props.ride?.fare}
                                <span className='text-xs font-normal text-gray-500 ml-1'>Cash</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-3 w-full flex gap-3'>
                    <button onClick={() => {
                        props.setRidePopupPanel(false)
                    }} className='flex-1 bg-gray-100 text-gray-700 font-semibold p-3 rounded-xl hover:bg-gray-200 transition-colors'>
                        Ignore
                    </button>
                    <button onClick={() => {
                        props.setConfirmRidePopupPanel(true)
                        props.confirmRide()
                    }} className='flex-2 bg-green-600 w-full text-white font-semibold p-3 px-10 rounded-xl hover:bg-green-700 transition-colors shadow-md'>
                        ✓ Accept Ride
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RidePopUp