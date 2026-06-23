import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const Captainlogin = () => {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ showPassword, setShowPassword ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ error, setError ] = useState('')

    const { setCaptain } = React.useContext(CaptainDataContext)
    const navigate = useNavigate()

    const submitHandler = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, { email, password })
            if (response.status === 200) {
                setCaptain(response.data.captain)
                localStorage.setItem('token', response.data.token)
                navigate('/captain-home')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
        } finally {
            setLoading(false)
        }
        setEmail(''); setPassword('')
    }

    return (
        <div className='p-7 h-screen flex flex-col justify-between'>
            <div>
                <div className='flex items-center justify-between mb-6'>
                    <img className='w-20' src="https://www.svgrepo.com/show/505031/uber-driver.svg" alt="" />
                    <Link to='/' className='text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-black'>
                        <i className="ri-arrow-left-line"></i> Back
                    </Link>
                </div>

                <h2 className='text-2xl font-bold mb-1'>Captain Sign In</h2>
                <p className='text-gray-500 text-sm mb-6'>Welcome back, Captain!</p>

                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2'>
                        <i className="ri-error-warning-line"></i> {error}
                    </div>
                )}

                <form onSubmit={submitHandler}>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email address</label>
                    <input
                        required value={email} onChange={(e) => setEmail(e.target.value)}
                        className='bg-gray-100 mb-4 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all'
                        type="email" placeholder='email@example.com'
                    />

                    <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                    <div className='relative mb-5'>
                        <input
                            className='bg-gray-100 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all pr-12'
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required type={showPassword ? 'text' : 'password'} placeholder='Enter password'
                        />
                        <button type='button' onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'>
                            <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                        </button>
                    </div>

                    <button disabled={loading}
                        className='bg-black text-white font-semibold mb-3 rounded-xl px-4 py-3 w-full text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-gray-800 transition-colors'>
                        {loading ? <><i className="ri-loader-4-line animate-spin"></i> Signing in...</> : 'Sign In'}
                    </button>
                </form>
                <p className='text-center text-sm text-gray-600'>New captain? <Link to='/captain-signup' className='text-black font-semibold underline'>Register here</Link></p>
            </div>
            <div>
                <Link to='/login'
                    className='bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white font-semibold mb-5 rounded-xl px-4 py-3 w-full text-base transition-colors'>
                    <i className="ri-user-3-line mr-2"></i> Sign in as User
                </Link>
            </div>
        </div>
    )
}

export default Captainlogin