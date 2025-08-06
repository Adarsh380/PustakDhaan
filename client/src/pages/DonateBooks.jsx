import React from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import App from '../App'

function DonateBooks({ setUser }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState('')
  const [donationDate, setDonationDate] = useState('')
  const [booksCount, setBooksCount] = useState({
    '2-4': 0,
    '4-6': 0,
    '6-8': 0,
    '8-10': 0
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [driveDetails, setDriveDetails] = useState(null)
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchDrives()
    const driveId = searchParams.get('drive')
    if (driveId) {
      setSelectedDrive(driveId)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedDrive) {
      fetchDriveDetails()
    }
  }, [selectedDrive])

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

  const fetchDriveDetails = async () => {
    try {
      const response = await fetch(`/api/drives/${selectedDrive}`)
      const data = await response.json()
      setDriveDetails(data)
    } catch (error) {
      console.error('Error fetching drive details:', error)
    }
  }

  const handleBookCountChange = (category, value) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setBooksCount(prev => ({
      ...prev,
      [category]: isNaN(numValue) ? 0 : numValue
    }))
  }

  const getTotalBooks = () => {
    return Object.values(booksCount).reduce((sum, count) => sum + count, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return; // Prevent double submit
    setSubmitting(true)
    setSubmitMessage({ type: '', text: '' }) // Clear previous messages
    if (!selectedDrive) {
      setSubmitMessage({ type: 'error', text: 'Please select a donation drive' })
      setSubmitting(false)
      return
    }
    if (!donationDate) {
      setSubmitMessage({ type: 'error', text: 'Please select a donation date' })
      setSubmitting(false)
      return
    }
    if (getTotalBooks() === 0) {
      setSubmitMessage({ type: 'error', text: 'Please enter at least one book to donate' })
      setSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/donations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donationDriveId: selectedDrive,
          donationDate,
          booksCount
        })
      })

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: 'Donation has been scheduled successfully.' })
        // Fetch updated user info to refresh badge
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const meData = await meRes.json()
        if (typeof setUser === 'function') setUser(meData)
        setTimeout(() => {
          navigate('/my-donations')
        }, 2000)
      } else {
        const error = await response.json()
        setSubmitMessage({ type: 'error', text: error.message || 'Failed to submit donation' })
      }
    } catch (error) {
      console.error('Error submitting donation:', error)
      setSubmitMessage({ type: 'error', text: 'Failed to submit donation' })
    } finally {
      setSubmitting(false)
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Donate Books</h1>
        <p className="text-gray-600">
          Help spread literacy by donating books to government schools through our community drives.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Donation Drive *
            </label>
            <select
              value={selectedDrive}
              onChange={(e) => setSelectedDrive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a donation drive</option>
              {drives.map(drive => (
                <option key={drive._id} value={drive._id}>
                  {drive.name} - {drive.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Donation Date *
            </label>
            <input
              type="date"
              value={donationDate}
              onChange={(e) => setDonationDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {driveDetails && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Drive Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <strong>Location:</strong> {driveDetails.location}
              </div>
              <div>
                <strong>Community:</strong> {driveDetails.gatedCommunity}
              </div>
              <div>
                <strong>Coordinator:</strong> {driveDetails.coordinator.name}
              </div>
              <div>
                <strong>Contact:</strong> {driveDetails.coordinator.phone}
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-100 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Instructions:</strong> {driveDetails.instructions}
              </p>
            </div>
            {/* Google Map Embed */}
            <div className="mt-4">
              <iframe
                title="Drive Location Map"
                width="100%"
                height="250"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${driveDetails.gatedCommunity}, ${driveDetails.location}`)}&output=embed`}
              ></iframe>
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${driveDetails.gatedCommunity}, ${driveDetails.location}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Number of Books by Age Category</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(booksCount).map(([category, count]) => (
              <div key={category}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age {category} years
                </label>
                <input
                  type="number"
                  min="0"
                  value={count === 0 ? '' : count}
                  onChange={(e) => handleBookCountChange(category, e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.select();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="text-lg font-medium text-gray-800">
            Total Books: {getTotalBooks()}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Only non-academic books can be donated</li>
            <li>• Drop time is between 9 AM & 7 PM</li>
            <li>• Books should be in good condition</li>
            <li>• Please bring books on the selected date</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Donation'}
          </button>
        </div>

        {submitMessage.text && (
          <div className={`mt-4 p-4 rounded-md text-sm ${submitMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {submitMessage.text}
          </div>
        )}
      </form>
    </div>
  )
}

export default DonateBooks
