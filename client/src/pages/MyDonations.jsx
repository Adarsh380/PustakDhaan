import React from 'react'
import { useState, useEffect } from 'react'

function MyDonations() {
  const [donations, setDonations] = useState([])
  const [allocations, setAllocations] = useState([])
  const [allocationSummary, setAllocationSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDonations()
    fetchAllocations()
  }, [])

  const fetchDonations = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please login to view donations')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/donations/my-donations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDonations(data)
      } else {
        setError('Failed to fetch donations')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllocations = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const response = await fetch('/api/donor/my-allocations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        // support new shape { summary, allocations } and legacy array
        if (data && data.allocations && data.summary) {
          setAllocationSummary(data.summary)
          setAllocations(data.allocations)
        } else if (Array.isArray(data)) {
          setAllocationSummary(null)
          setAllocations(data)
        }
      }
    } catch {}
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'collected':
        return 'bg-green-100 text-green-800'
      case 'allocated':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">My Donations</h1>
        <p className="text-gray-600">
          Track your book donations and their impact on government schools.
        </p>
      </div>

      {donations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 text-lg mb-4">No donations yet</div>
          <p className="text-gray-400 mb-6">
            Start donating books to help spread literacy in your community.
          </p>
          <a
            href="/donation-drives"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Donation Drives
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {donations.map((donation) => (
            <div key={donation._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {donation.donationDrive.name}
                  </h3>
                  <p className="text-gray-600">
                    {donation.donationDrive.gatedCommunity}, {donation.donationDrive.location}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(donation.status)}`}>
                  {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Donation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Donation Date:</span>
                      <span>{new Date(donation.donationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Books:</span>
                      <span className="font-semibold">{donation.totalBooks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted On:</span>
                      <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Books by Age Category</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(donation.booksCount).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span>Age {category} years:</span>
                        <span>{count} books</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {donation.status === 'collected' && donation.collectedAt && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Collected on:</strong> {new Date(donation.collectedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {donation.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {donation.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
          {allocations.length > 0 && (
            <div className="bg-blue-50 rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-lg font-bold mb-2 text-blue-900">Where your donated books reached</h2>
              {allocationSummary && (
                <div className="mb-4 p-3 bg-white rounded border border-blue-100">
                  <div className="text-sm text-blue-800 font-medium">Allocated summary</div>
                  <div className="text-sm text-gray-700 mt-2">Total books allocated to schools: <span className="font-semibold">{allocationSummary.totalAllocated}</span></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                    {Object.entries(allocationSummary.byCategory).map(([cat, count]) => (
                      <div key={cat} className="inline-block">{cat}: <span className="font-semibold">{count}</span></div>
                    ))}
                  </div>
                </div>
              )}
              <ul className="space-y-2">
                {allocations.map((a, idx) => (
                  <li key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded p-3 border border-blue-100">
                    <div>
                      <span className="font-semibold text-blue-800">{a.school?.name}</span>
                      {a.school?.address && (
                        <span className="text-gray-500 ml-2">({a.school.address.city || ''})</span>
                      )}
                      <span className="ml-4 text-sm text-gray-600">via <span className="font-medium">{a.donationDrive?.name}</span></span>
                    </div>
                    <div className="text-sm text-gray-700 mt-2 md:mt-0">
                      {Object.entries(a.booksAllocated).map(([cat, count]) => (
                        <span key={cat} className="inline-block mr-2">{count} books (age {cat})</span>
                      ))}
                      <div className="text-xs text-gray-500 mt-1">Total allocated: <span className="font-semibold">{a.totalBooksAllocated}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MyDonations
