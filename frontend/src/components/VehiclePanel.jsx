/* eslint-disable react/prop-types */
import { useState } from 'react'

const VehiclePanel = (props) => {
    const [ selected, setSelected ] = useState(null)

    const fares = { car: props.fare.car, moto: props.fare.moto, auto: props.fare.auto }
    const minFare = Math.min(...Object.values(fares).filter(Boolean))
    const maxFare = Math.max(...Object.values(fares).filter(Boolean))

    const vehicles = [
        {
            type: 'car',
            label: 'RideGo',
            capacity: 4,
            img: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
            desc: 'Comfortable car for up to 4',
            eta: '2 min',
            icon: 'ri-car-fill'
        },
        {
            type: 'moto',
            label: 'Moto',
            capacity: 1,
            img: 'https://img.icons8.com/color/2x/motorcycle.png',
            desc: 'Zip through traffic fast',
            eta: '3 min',
            icon: 'ri-motorbike-fill'
        },
        {
            type: 'auto',
            label: 'RideAuto',
            capacity: 3,
            img: 'https://img.icons8.com/color/2x/auto-rickshaw.png',
            desc: 'Auto rickshaw for 3',
            eta: '3 min',
            icon: 'ri-car-line'
        }
    ]

    const handleSelect = (type) => {
        setSelected(type)
        setTimeout(() => {
            props.setConfirmRidePanel(true)
            props.selectVehicle(type)
        }, 180)
    }

    const isBest = (type) => fares[type] === minFare && fares[type]
    const savingsVsMax = (type) => fares[type] && maxFare ? maxFare - fares[type] : 0

    return (
        <div>
            {/* Drag handle */}
            <h5
                className='p-1 text-center w-[93%] absolute top-0 cursor-pointer'
                onClick={() => props.setVehiclePanel(false)}
            >
                <div className='w-10 h-1 bg-gray-300 rounded-full mx-auto mt-1'></div>
            </h5>

            {/* Header */}
            <div className='mb-5 mt-1'>
                <h3 className='text-2xl font-bold tracking-tight'>Choose a ride</h3>
                <p className='text-sm text-gray-400 mt-0.5'>Select based on price & comfort</p>
            </div>

            {/* Vehicle Cards */}
            <div className='flex flex-col gap-3'>
                {vehicles.map(v => {
                    const isSelected = selected === v.type
                    const best = isBest(v.type)
                    const savings = savingsVsMax(v.type)

                    return (
                        <div
                            key={v.type}
                            onClick={() => handleSelect(v.type)}
                            className={`
                                relative overflow-hidden rounded-2xl cursor-pointer
                                transition-all duration-200 active:scale-[0.98]
                                ${isSelected
                                    ? 'bg-black shadow-xl ring-2 ring-black'
                                    : best
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm'
                                        : 'bg-white border-2 border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'
                                }
                            `}
                        >
                            {/* Best Value ribbon */}
                            {best && !isSelected && (
                                <div className='absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wide'>
                                    ✦ BEST VALUE
                                </div>
                            )}

                            <div className='flex items-center p-3 gap-3'>
                                {/* Vehicle image */}
                                <div className={`
                                    w-16 h-14 flex items-center justify-center rounded-xl flex-shrink-0
                                    ${isSelected ? 'bg-white/10' : 'bg-gray-50'}
                                `}>
                                    <img
                                        className='h-10 object-contain'
                                        src={v.img}
                                        alt={v.label}
                                        style={isSelected ? { filter: 'brightness(0) invert(1)' } : {}}
                                    />
                                </div>

                                {/* Info */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <h4 className={`font-bold text-base leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                            {v.label}
                                        </h4>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <i className="ri-user-fill text-[10px]"></i> {v.capacity}
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {v.desc}
                                    </p>
                                    <div className='flex items-center gap-1 mt-1'>
                                        <i className={`ri-time-line text-[11px] ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`}></i>
                                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-yellow-400' : 'text-gray-500'}`}>
                                            {v.eta} away
                                        </span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className='text-right flex-shrink-0'>
                                    <p className={`text-xl font-extrabold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        ₹{props.fare[v.type]}
                                    </p>
                                    {savings > 0 && !isSelected && (
                                        <p className='text-[10px] text-green-600 font-semibold mt-0.5'>
                                            Save ₹{savings}
                                        </p>
                                    )}
                                    {isSelected && (
                                        <p className='text-[10px] text-green-400 font-semibold mt-0.5'>Selected ✓</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer tip */}
            <p className='text-center text-xs text-gray-400 mt-4'>
                <i className="ri-shield-check-line mr-1"></i>All rides are insured & safe
            </p>
        </div>
    )
}

export default VehiclePanel
