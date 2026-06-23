import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const UserLogout = () => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BASE_URL}/users/logout`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            if (response.status === 200) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        }).catch((err) => {
            console.error('Logout failed:', err)
            localStorage.removeItem('token')
            navigate('/login')
        })
    }, [token, navigate])

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
                <i className="ri-loader-4-line text-3xl animate-spin text-gray-500"></i>
                <p className="text-gray-500 font-medium text-sm">Logging out...</p>
            </div>
        </div>
    )
}

export default UserLogout
