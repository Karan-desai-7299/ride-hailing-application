import React from 'react'
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
            <div className='relative h-full flex flex-col justify-between p-8'>
                {/* Top logo */}
                <div>
                    <img
                        className='w-20'
                        src="https://cdn-assets-eu.frontify.com/s3/frontify-enterprise-files-eu/eyJwYXRoIjoid2VhcmVcL2ZpbGVcLzhGbTh4cU5SZGZUVjUxYVh3bnEyLnN2ZyJ9:weare:F1cOF9Bps96cMy7r9Y2d7affBYsDeiDoIHfqZrbcxAw?width=1200&height=417"
                        alt="Uber"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                </div>

                {/* Bottom card */}
                <div className='bg-white rounded-3xl p-7 shadow-2xl'>
                    <h2 className='text-3xl font-bold mb-1'>Move with Uber</h2>
                    <p className='text-gray-500 text-sm mb-6'>Request a ride, get picked up by a nearby driver, and be on your way.</p>

                    <Link
                        to='/login'
                        className='flex items-center justify-center w-full bg-black hover:bg-gray-900 text-white font-semibold py-4 rounded-2xl text-lg transition-all mb-3 shadow-md'
                    >
                        Get Started
                    </Link>

                    <div className='flex gap-3'>
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