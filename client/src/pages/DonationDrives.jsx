import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function DonationDrives() {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrives()
  }, [])

  const fetchDrives = async () => {
    try {
      const response = await fetch('/api/drives/active')
      const data = await response.json()
      setDrives(data)
    } catch (error) {
      console.error('Error fetching drives:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Active Book Donation Drives</h1>
        <p className="text-gray-600">
          Join our community book donation drives and help spread literacy to government schools.
        </p>
      </div>

      {drives.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No active donation drives at the moment.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map(drive => (
            <div key={drive._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{drive.name}</h2>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Active
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{drive.gatedCommunity}, {drive.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm">{drive.gatedCommunity}</span>
                  </div>
                </div>

                {drive.description && (
                  <p className="text-gray-600 text-sm mb-4">{drive.description}</p>
                )}

                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">Coordinator</h3>
                  <div className="text-sm text-blue-700">
                    <div>{drive.coordinator.name}</div>
                    <div>{drive.coordinator.email}</div>
                    <div>{drive.coordinator.phone}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">Books Collected</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Age 2-4: {drive.booksReceived['2-4']}</div>
                    <div>Age 4-6: {drive.booksReceived['4-6']}</div>
                    <div>Age 6-8: {drive.booksReceived['6-8']}</div>
                    <div>Age 8-10: {drive.booksReceived['8-10']}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <strong>Total: {drive.totalBooksReceived} books</strong>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Instructions:</strong> {drive.instructions}
                  </p>
                </div>

                <Link 
                  to={`/donate-books?drive=${drive._id}`}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-center block"
                >
                  Donate Books
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DonationDrives
