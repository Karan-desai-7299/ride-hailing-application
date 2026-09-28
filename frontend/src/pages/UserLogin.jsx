import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import axios from 'axios'

const UserLogin = () => {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ showPassword, setShowPassword ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ error, setError ] = useState('')

    const { setUser } = React.useContext(UserDataContext)
    const navigate = useNavigate()

    const submitHandler = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, { email, password })
            if (response.status === 200) {
                setUser(response.data.user)
                localStorage.setItem('token', response.data.token)
                navigate('/home')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
        } finally {
            setLoading(false)
        }
        setEmail('')
        setPassword('')
    }

    return (
        <div className='p-7 h-screen flex flex-col justify-between'>
            <div>
                <div className='flex items-center justify-between mb-10'>
                    <div className='inline-flex items-center gap-2 text-gray-900'>
                        <div className='h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm'>
                            <i className="ri-route-line text-xl"></i>
                        </div>
                        <span className='text-base font-bold'>Ride Hailing Application</span>
                    </div>
                    <Link to='/' className='text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-black'>
                        <i className="ri-arrow-left-line"></i> Back
                    </Link>
                </div>

                <h2 className='text-2xl font-bold mb-1'>Welcome back!</h2>
                <p className='text-gray-500 text-sm mb-6'>Sign in to your account</p>

                {/* Error Message */}
                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2'>
                        <i className="ri-error-warning-line"></i> {error}
                    </div>
                )}

                <form onSubmit={submitHandler}>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email address</label>
                    <input
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='bg-gray-100 mb-4 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all'
                        type="email"
                        placeholder='email@example.com'
                    />

                    <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                    <div className='relative mb-5'>
                        <input
                            className='bg-gray-100 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all pr-12'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Enter password'
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'
                        >
                            <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                        </button>
                    </div>

                    <button
                        disabled={loading}
                        className='bg-black text-white font-semibold mb-3 rounded-xl px-4 py-3 w-full text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-gray-800 transition-colors'
                    >
                        {loading ? (
                            <><i className="ri-loader-4-line animate-spin"></i> Signing in...</>
                        ) : 'Sign In'}
                    </button>
                </form>
                <p className='text-center text-sm text-gray-600'>New here? <Link to='/signup' className='text-black font-semibold underline'>Create account</Link></p>
            </div>
            <div>
                <Link
                    to='/captain-login'
                    className='bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white font-semibold mb-5 rounded-xl px-4 py-3 w-full text-base transition-colors'
                >
                    <i className="ri-steering-2-line mr-2"></i> Sign in as Captain
                </Link>
            </div>
        </div>
    )
}

export default UserLogin
