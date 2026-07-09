/* eslint-disable react/prop-types */

const ConfirmRide = (props) => {
    const vehicleLabels = { car: 'RideGo', moto: 'Moto', auto: 'RideAuto' }
    const vehicleCapacity = { car: 4, moto: 1, auto: 3 }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setConfirmRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>

            <h3 className='text-2xl font-semibold mb-4'>Confirm your Ride</h3>

            {/* Vehicle Summary Card */}
            <div className='flex items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100'>
                <img className='h-16 object-contain' src={
                    props.vehicleType === 'moto' ? 'https://img.icons8.com/color/2x/motorcycle.png' :
                    props.vehicleType === 'auto' ? 'https://img.icons8.com/color/2x/auto-rickshaw.png' :
                    'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg'
                } alt="" />
                <div className='flex-1'>
                    <h4 className='text-lg font-semibold'>
                        {vehicleLabels[props.vehicleType] || 'RideGo'}
                        <span className='ml-2 text-sm font-normal text-gray-500'>
                            <i className="ri-user-3-fill"></i> {vehicleCapacity[props.vehicleType] || 4}
                        </span>
                    </h4>
                    <p className='text-xs text-gray-500 capitalize'>{props.vehicleType === 'moto' ? 'Motorcycle ride' : props.vehicleType === 'auto' ? 'Auto rickshaw' : 'Comfortable car'}</p>
                </div>
                <div className='text-right'>
                    <p className='text-2xl font-bold text-gray-900'>₹{props.fare[props.vehicleType]}</p>
                    <p className='text-xs text-gray-500'>Cash</p>
                </div>
            </div>

            {/* Route Details */}
            <div className='w-full mb-4'>
                <div className='flex items-center gap-4 p-3 border-b border-gray-100'>
                    <div className='h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-user-fill text-green-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Pickup</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-4 p-3'>
                    <div className='h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                        <i className="ri-map-pin-2-fill text-red-600 text-sm"></i>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 uppercase tracking-wide'>Destination</p>
                        <p className='text-sm font-semibold text-gray-800'>{props.destination}</p>
                    </div>
                </div>
            </div>

            {/* Confirm Button */}
            <button onClick={() => {
                props.setVehicleFound(true)
                props.setConfirmRidePanel(false)
                props.createRide()
            }} className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold p-3 rounded-xl transition-colors shadow-md text-lg'>
                ✓ Confirm Booking
            </button>
        </div>
    )
}

export default ConfirmRide
