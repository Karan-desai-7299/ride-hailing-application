import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainDetails = () => {
    const { captain } = useContext(CaptainDataContext)
    const [stats, setStats] = useState({ earned: 0, rides: 0, km: 0 })
    const [greeting, setGreeting] = useState('')

    // AI: Smart time-based greeting
    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 17) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')
    }, [])

    // Compute real earnings & stats from ride history
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/captain-history`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
                const completed = res.data.filter(r => r.status === 'completed')
                const earned = completed.reduce((sum, r) => sum + (r.fare || 0), 0)
                const km = completed.reduce((sum, r) => sum + ((r.distance || 0) / 1000), 0)
                setStats({ earned: earned.toFixed(0), rides: completed.length, km: km.toFixed(1) })
            } catch (e) {
                console.error('Stats fetch error', e)
            }
        }
        fetchStats()
    }, [])

    return (
        <div>
            {/* AI Greeting */}
            <p className='text-xs text-gray-500 font-medium mb-1'>{greeting} 👋</p>

            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <div className='h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg shadow'>
                        {captain.fullname.firstname.charAt(0).toUpperCase()}
                    </div>
                    <h4 className='text-lg font-medium capitalize'>
                        {captain.fullname.firstname} {captain.fullname.lastname}
                    </h4>
                </div>
                <div className='text-right'>
                    <h4 className='text-xl font-semibold text-green-600'>₹{stats.earned}</h4>
                    <p className='text-sm text-gray-600'>Total Earned</p>
                </div>
            </div>

            <div className='flex p-3 mt-6 bg-gray-100 rounded-xl justify-center gap-5 items-start'>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-roadster-line text-yellow-500"></i>
                    <h5 className='text-lg font-semibold'>{stats.rides}</h5>
                    <p className='text-sm text-gray-600'>Rides Done</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-route-line text-blue-500"></i>
                    <h5 className='text-lg font-semibold'>{stats.km}</h5>
                    <p className='text-sm text-gray-600'>KM Covered</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-currency-line text-green-500"></i>
                    <h5 className='text-lg font-semibold'>₹{stats.earned}</h5>
                    <p className='text-sm text-gray-600'>Earnings</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainDetails