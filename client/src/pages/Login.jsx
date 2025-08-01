import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login({ setUser }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        // Fetch user info with new token to ensure badge loads
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${data.token}` }
        })
        const meData = await meRes.json()
        setUser(meData)
        navigate('/')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Login to PustakDhaan</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-600">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
        <div className="text-xs text-gray-500 mt-2">
          If you forgot your password, click above and follow the instructions to reset it.
        </div>
      </p>
      <p className="text-center mt-4 text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  )
}

export default Login
