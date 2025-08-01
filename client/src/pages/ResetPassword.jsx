import React from 'react'
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!newPassword || !confirmPassword) {
      setMessage('Please enter and confirm your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('Password reset successful. You can now log in.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setMessage(data.message || 'Failed to reset password.')
      }
    } catch (err) {
      setMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      {message && (
        <div className="mt-4 p-3 rounded bg-yellow-50 text-yellow-800 text-center text-sm">{message}</div>
      )}
    </div>
  )
}

export default ResetPassword
