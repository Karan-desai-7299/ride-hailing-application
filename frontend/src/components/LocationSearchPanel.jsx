import React, { useEffect, useState } from 'react'

const RECENT_KEY = 'ride_app_recent_searches'

const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField }) => {
    const [ recent, setRecent ] = useState([])

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
            setRecent(stored)
        } catch {
            setRecent([])
        }
    }, [])

    const saveRecent = (value) => {
        try {
            const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
            const updated = [ value, ...stored.filter(s => s !== value) ].slice(0, 5)
            localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
            setRecent(updated)
        } catch {}
    }

    const handleSuggestionClick = (suggestion) => {
        if (activeField === 'pickup') {
            setPickup(suggestion)
        } else if (activeField === 'destination') {
            setDestination(suggestion)
        }
        saveRecent(suggestion)
    }

    const showRecent = suggestions.length === 0 && recent.length > 0

    return (
        <div>
            {showRecent && (
                <div className='mb-3'>
                    <p className='text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2'>
                        <i className="ri-history-line mr-1"></i> Recent Searches
                    </p>
                    {recent.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSuggestionClick(item)}
                            className='flex gap-3 p-3 border border-gray-100 rounded-xl items-center my-1.5 hover:bg-gray-50 cursor-pointer transition-colors'
                        >
                            <div className='h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                <i className="ri-time-line text-gray-500 text-sm"></i>
                            </div>
                            <p className='text-sm font-medium text-gray-700 truncate'>{item}</p>
                        </div>
                    ))}
                </div>
            )}

            {suggestions.length > 0 && (
                <div>
                    <p className='text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2'>
                        <i className="ri-search-line mr-1"></i> Suggestions
                    </p>
                    {suggestions.map((elem, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSuggestionClick(elem)}
                            className='flex gap-3 p-3 border border-gray-100 rounded-xl items-center my-1.5 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors'
                        >
                            <div className='h-9 w-9 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                <i className="ri-map-pin-fill text-yellow-600 text-sm"></i>
                            </div>
                            <p className='text-sm font-medium text-gray-800 truncate'>{elem}</p>
                        </div>
                    ))}
                </div>
            )}

            {suggestions.length === 0 && recent.length === 0 && (
                <div className='text-center py-10 text-gray-400'>
                    <i className="ri-search-line text-4xl block mb-2"></i>
                    <p className='text-sm'>Start typing to search locations</p>
                </div>
            )}
        </div>
    )
}

export default LocationSearchPanel