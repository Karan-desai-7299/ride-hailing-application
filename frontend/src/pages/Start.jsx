import { Link } from 'react-router-dom'

const Start = () => {
    return (
        <div className='h-screen relative overflow-hidden'>
            {/* Background */}
            <div
                className='absolute inset-0 bg-cover bg-center'
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1619059558110-c45be64b73ae?q=80&w=2574&auto=format&fit=crop)` }}
            />
            {/* Dark overlay gradient */}
            <div className='absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/80' />

            {/* Content */}
            <div className='relative h-full flex flex-col justify-between p-4 sm:p-8'>
                {/* Top logo */}
                <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='inline-flex items-center gap-3 text-white shrink-0'>
                        <div className='h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20'>
                            <span className='text-xl sm:text-2xl font-bold'>U</span>
                        </div>
                        <p className='text-2xl sm:text-3xl font-semibold leading-none'>Uber</p>
                    </div>
                    <div className='w-full max-w-[300px] sm:max-w-[250px] rounded-2xl bg-white/90 px-3 py-2 text-[11px] leading-4 text-gray-800 shadow-lg backdrop-blur-sm border border-white/60'>
                        <p className='font-semibold text-gray-900 mb-1'>Karansinh Desai</p>
                        <div className='flex items-start gap-2 mb-1.5'>
                            <i className="ri-mail-line mt-0.5 text-gray-500 text-sm shrink-0"></i>
                            <p className='truncate'>karansinhdesai91@gmail.com</p>
                        </div>
                        <a
                            href='https://www.linkedin.com/in/karansinh-desai-a249a0289'
                            target='_blank'
                            rel='noreferrer'
                            className='flex items-start gap-2 truncate text-blue-700 hover:text-blue-800'
                        >
                            <i className="ri-linkedin-box-fill mt-0.5 text-base shrink-0"></i>
                            <span className='truncate'>https://www.linkedin.com/in/karansinh-desai/</span>
                        </a>
                    </div>
                </div>

                {/* Bottom card */}
                <div className='bg-white rounded-3xl p-5 sm:p-7 shadow-2xl'>
                    <h2 className='text-2xl sm:text-3xl font-bold mb-1'>Move with Uber</h2>
                    <p className='text-gray-500 text-sm mb-6'>Request a ride, get picked up by a nearby driver, and be on your way.</p>

                    <Link
                        to='/login'
                        className='flex items-center justify-center w-full bg-black hover:bg-gray-900 text-white font-semibold py-4 rounded-2xl text-lg transition-all mb-3 shadow-md'
                    >
                        Get Started
                    </Link>

                    <div className='flex flex-col sm:flex-row gap-3'>
                        <Link
                            to='/captain-login'
                            className='flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-2xl text-sm transition-all'
                        >
                            <i className="ri-steering-2-line mr-2 text-base"></i> Drive with Uber
                        </Link>
                        <Link
                            to='/signup'
                            className='flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-2xl text-sm transition-all'
                        >
                            <i className="ri-user-add-line mr-2 text-base"></i> Sign Up Free
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Start
