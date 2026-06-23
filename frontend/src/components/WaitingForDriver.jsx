import React from 'react'

const WaitingForDriver = (props) => {
    const distanceKm = props.ride?.distance ? (props.ride.distance / 1000).toFixed(1) : null
    const durationMin = props.ride?.duration ? Math.round(props.ride.duration / 60) : null
    const vehicleType = props.ride?.vehicleType || props.ride?.captain?.vehicle?.vehicleType

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setWaitingForDriver(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

            <h3 className='text-xl font-semibold mb-4'>Driver on the way! 🚗</h3>

            {/* Captain Card */}
            <div className='flex items-center justify-between bg-gray-50 rounded-2xl p-3 mb-4 border border-gray-100'>
                <div className='flex items-center gap-3'>
                    <div className='h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-2xl shadow'>
                        {props.ride?.captain?.fullname?.firstname?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className='text-base font-semibold capitalize'>
                            {props.ride?.captain?.fullname?.firstname} {props.ride?.captain?.fullname?.lastname}
                        </h2>
                        <p className='text-sm text-gray-500 capitalize'>
                            {props.ride?.captain?.vehicle?.color} {vehicleType === 'moto' ? 'Motorcycle' : vehicleType}
                        </p>
                        <span className='text-sm font-bold bg-gray-200 px-2 py-0.5 rounded-md tracking-wider'>
                            {props.ride?.captain?.vehicle?.plate}
                        </span>
                    </div>
                </div>
                <img className='h-14 object-contain' src={
                    vehicleType === 'moto' ? 'https://img.icons8.com/color/2x/motorcycle.png' :
                    vehicleType === 'auto' ? 'https://img.icons8.com/color/2x/auto-rickshaw.png' :
                    'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg'
                } alt="" />
            </div>

            {/* AI: Styled OTP Security Box */}
            <div className='bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl p-4 mb-4'>
                <div className='flex items-center gap-2 mb-2'>
                    <i className="ri-shield-check-fill text-yellow-600"></i>
                    <p className='text-sm font-semibold text-yellow-800'>Share this OTP with your driver</p>
                </div>
                <div className='flex gap-2 justify-center'>
                    {props.ride?.otp?.split('').map((digit, i) => (
                        <div key={i} className='h-10 w-10 bg-white border-2 border-yellow-300 rounded-xl flex items-center justify-center text-xl font-bold text-gray-800 shadow-sm'>
                            {digit}
                        </div>
                    ))}
                </div>
            </div>

            {/* Trip Details */}
            <div className='w-full'>
                {distanceKm && durationMin && (
                    <div className='grid grid-cols-2 gap-2 mb-3'>
                        <div className='bg-gray-50 rounded-xl p-3 text-center'>
                            <p className='text-xs text-gray-400'>Distance</p>
                            <p className='text-base font-bold'>{distanceKm} KM</p>
                        </div>
                        <div className='bg-gray-50 rounded-xl p-3 text-center'>
                            <p className='text-xs text-gray-400'>Est. Time</p>
                            <p className='text-base font-bold'>{durationMin} min</p>
                        </div>
                    </div>
                )}
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-7 w-7 rounded-full bg-green-100 flex items-center justify-center'>
                        <i className="ri-map-pin-user-fill text-green-600 text-xs"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase'>Pickup</p>
                        <p className='text-sm font-semibold'>{props.ride?.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-7 w-7 rounded-full bg-red-100 flex items-center justify-center'>
                        <i className="ri-map-pin-2-fill text-red-600 text-xs"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase'>Destination</p>
                        <p className='text-sm font-semibold'>{props.ride?.destination}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3'>
                    <div className='h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center'>
                        <i className="ri-currency-line text-blue-600 text-xs"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase'>Fare</p>
                        <p className='text-sm font-semibold'>₹{props.ride?.fare} — Cash</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaitingForDriver