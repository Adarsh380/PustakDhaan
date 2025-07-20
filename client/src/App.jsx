import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import AwardBanner from './components/AwardBanner'
import Home from './pages/Home'
import MyDonations from './pages/MyDonations'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import DonationDrives from './pages/DonationDrives'
import AdminDashboard from './pages/AdminDashboard'
import DonateBooks from './pages/DonateBooks'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Verify token with backend
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          localStorage.removeItem('token')
        } else {
          setUser(data)
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} setUser={setUser} />
        <AwardBanner user={user} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/donation-drives" element={<DonationDrives />} />
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login setUser={setUser} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/" /> : <Register setUser={setUser} />
            } />
            <Route path="/donate-books" element={
              user ? <DonateBooks setUser={setUser} /> : <Navigate to="/login" />
            } />
            <Route path="/my-donations" element={
              user ? <MyDonations /> : <Navigate to="/login" />
            } />
            <Route path="/admin" element={
              user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              user ? <Profile user={user} /> : <Navigate to="/login" />
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
