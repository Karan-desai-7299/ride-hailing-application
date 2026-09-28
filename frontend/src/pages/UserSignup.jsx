import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'

const UserSignup = () => {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ firstName, setFirstName ] = useState('')
    const [ lastName, setLastName ] = useState('')
    const [ showPassword, setShowPassword ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const [ error, setError ] = useState('')

    const navigate = useNavigate()
    const { setUser } = useContext(UserDataContext)

    const submitHandler = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, {
                fullname: { firstname: firstName, lastname: lastName },
                email,
                password
            })
            if (response.status === 201) {
                setUser(response.data.user)
                localStorage.setItem('token', response.data.token)
                navigate('/home')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
        setEmail(''); setFirstName(''); setLastName(''); setPassword('')
    }

    return (
        <div className='p-7 h-screen flex flex-col justify-between overflow-y-auto'>
            <div>
                <div className='flex items-center justify-between mb-6'>
                    <div className='inline-flex items-center gap-2 text-gray-900'>
                        <div className='h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm'>
                            <i className="ri-route-line text-xl"></i>
                        </div>
                        <span className='text-base font-bold'>Ride Hailing Application</span>
                    </div>
                    <Link to='/login' className='text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-black'>
                        <i className="ri-arrow-left-line"></i> Back
                    </Link>
                </div>

                <h2 className='text-2xl font-bold mb-1'>Create account</h2>
                <p className='text-gray-500 text-sm mb-5'>Join the app and start riding today</p>

                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2'>
                        <i className="ri-error-warning-line"></i> {error}
                    </div>
                )}

                <form onSubmit={submitHandler}>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Full name</label>
                    <div className='flex gap-3 mb-4'>
                        <input
                            required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="text" placeholder='First name'
                            value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            required
                            className='bg-gray-100 w-1/2 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none text-base transition-all'
                            type="text" placeholder='Last name'
                            value={lastName} onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email address</label>
                    <input
                        required
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className='bg-gray-100 mb-4 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all'
                        type="email" placeholder='email@example.com'
                    />

                    <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                    <div className='relative mb-5'>
                        <input
                            className='bg-gray-100 rounded-xl px-4 py-3 border border-transparent focus:border-black focus:bg-white outline-none w-full text-base transition-all pr-12'
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required type={showPassword ? 'text' : 'password'} placeholder='Min 6 characters'
                        />
                        <button type='button' onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700'>
                            <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                        </button>
                    </div>

                    <button disabled={loading}
                        className='bg-black text-white font-semibold mb-3 rounded-xl px-4 py-3 w-full text-base flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-gray-800 transition-colors'>
                        {loading ? <><i className="ri-loader-4-line animate-spin"></i> Creating account...</> : 'Create Account'}
                    </button>
                </form>
                <p className='text-center text-sm text-gray-600'>Already have an account? <Link to='/login' className='text-black font-semibold underline'>Sign in</Link></p>
            </div>
            <p className='text-[10px] text-gray-400 leading-tight mt-4'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
        </div>
    )
}

export default UserSignup
