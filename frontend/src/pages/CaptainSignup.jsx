import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainSignup = () => {
    const navigate = useNavigate()
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ firstName, setFirstName ] = useState('')
    const [ lastName, setLastName ] = useState('')
    const [ vehicleColor, setVehicleColor ] = useState('')
    const [ vehiclePlate, setVehiclePlate ] = useState('')
    const [ vehicleCapacity, setVehicleCapacity ] = useState('')
    const [ vehicleType, setVehicleType ] = useState('')
    const [ showPassword, setShowPassword ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ error, setError ] = useState('')

    const { setCaptain } = React.useContext(CaptainDataContext)

    const submitHandler = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, {
                fullname: { firstname: firstName, lastname: lastName },
                email, password,
                vehicle: { color: vehicleColor, plate: vehiclePlate, capacity: vehicleCapacity, vehicleType }
            })
            if (response.status === 201) {
                setCaptain(response.data.captain)
                localStorage.setItem('token', response.data.token)
                navigate('/captain-home')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
        setEmail(''); setFirstName(''); setLastName(''); setPassword('')
        setVehicleColor(''); setVehiclePlate(''); setVehicleCapacity(''); setVehicleType('')
    }

    return (
        <div className='py-5 px-7 h-screen flex flex-col justify-between overflow-y-auto'>
            <div>
                <div className='flex items-center justify-between mb-4'>
                    <img className='w-16' src="https://www.svgrepo.com/show/505031/uber-driver.svg" alt="" />
                    <Link to='/captain-login' className='text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-black'>
                        <i className="ri-arrow-left-line"></i> Back
                    </Link>
                </div>

                <h2 className='text-2xl font-bold mb-1'>Register as Captain</h2>
                <p className='text-gray-500 text-sm mb-5'>Join the Uber driver fleet</p>

                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2'>
                        <i className="ri-error-warning-line"></i> {error}
                    </div>
                )}

                <form onSubmit={submitHandler}>
                    {/* Personal Info */}
                    <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-2'>Personal Info</p>
                    <div className='flex gap-3 mb-4'>
                        <input required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="text" placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="text" placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                    <input required value={email} onChange={(e) => setEmail(e.target.value)}
                        className='bg-gray-100 mb-4 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all'
                        type="email" placeholder='Email address'
                    />
                    <div className='relative mb-5'>
                        <input
                            className='bg-gray-100 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all pr-12'
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required type={showPassword ? 'text' : 'password'} placeholder='Password (min 6 chars)'
                        />
                        <button type='button' onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'>
                            <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                        </button>
                    </div>

                    {/* Vehicle Info */}
                    <p className='text-xs font-bold text-gray-400 uppercase tracking-wider mb-2'>Vehicle Details</p>
                    <div className='flex gap-3 mb-4'>
                        <input required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="text" placeholder='Vehicle Color' value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)}
                        />
                        <input required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all uppercase'
                            type="text" placeholder='Plate number' value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        />
                    </div>
                    <div className='flex gap-3 mb-5'>
                        <input required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="number" placeholder='Capacity' value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value)}
                        />
                        <select required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}
                        >
                            <option value="" disabled>Vehicle Type</option>
                            <option value="car">🚗 Car</option>
                            <option value="auto">🛺 Auto</option>
                            <option value="moto">🏍️ Moto</option>
                        </select>
                    </div>

                    <button disabled={loading}
                        className='bg-black text-white font-semibold mb-3 rounded-xl px-4 py-3 w-full text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-gray-800 transition-colors'>
                        {loading ? <><i className="ri-loader-4-line animate-spin"></i> Creating...</> : 'Create Captain Account'}
                    </button>
                </form>
                <p className='text-center text-sm text-gray-600'>Already registered? <Link to='/captain-login' className='text-black font-semibold underline'>Sign in</Link></p>
            </div>
            <p className='text-[10px] text-gray-400 leading-tight mt-4'>Protected by reCAPTCHA — <span className='underline'>Privacy Policy</span> & <span className='underline'>Terms</span>.</p>
        </div>
    )
}

export default CaptainSignup