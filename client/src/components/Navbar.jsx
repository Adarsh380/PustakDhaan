import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function Navbar({ user, setUser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              📚 PustakDhaan
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <div className="flex items-center space-x-2 mr-4">
                  <span className="text-sm">Welcome, {user.name}</span>
                </div>
                
                {/* Regular User Navigation */}
                <div className="flex items-center space-x-1">
                  <Link to="/" className="hover:text-blue-200 px-2 py-1 rounded transition-colors">
                    Home
                  </Link>
                  <Link to="/donation-drives" className="hover:text-blue-200 px-2 py-1 rounded transition-colors">
                    Donation Drives
                  </Link>
                  <Link to="/donate-books" className="hover:text-blue-200 px-2 py-1 rounded transition-colors">
                    Donate Books
                  </Link>
                  <Link to="/my-donations" className="hover:text-blue-200 px-2 py-1 rounded transition-colors">
                    My Donations
                  </Link>
                  <Link to="/profile" className="hover:text-blue-200 px-2 py-1 rounded transition-colors">
                    Profile
                  </Link>
                </div>

                {/* Admin Navigation */}
                {user.role === 'admin' && (
                  <>
                    <div className="border-l border-blue-400 h-6 mx-3"></div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-200 font-medium bg-blue-500 px-2 py-1 rounded">ADMIN</span>
                      <Link 
                        to="/admin" 
                        className="hover:text-yellow-200 text-yellow-100 font-medium px-3 py-1 rounded border border-yellow-300/30 hover:border-yellow-200 transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  </>
                )}

                {/* Logout */}
                <div className="border-l border-blue-400 h-6 mx-3"></div>
                <button
                  onClick={handleLogout}
                  className="text-red-200 hover:text-red-100 font-medium px-3 py-1 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 px-3 py-1 rounded transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-blue-200 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-blue-500">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <div className="text-sm text-blue-200 pb-2 border-b border-blue-500 mb-3">
                    Welcome, {user.name}
                  </div>
                  
                  {/* Regular User Navigation */}
                  <div className="space-y-1">
                    <Link to="/" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                      Home
                    </Link>
                    <Link to="/donation-drives" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                      Donation Drives
                    </Link>
                    <Link to="/donate-books" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                      Donate Books
                    </Link>
                    <Link to="/my-donations" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                      My Donations
                    </Link>
                    <Link to="/profile" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                      Profile
                    </Link>
                  </div>

                  {/* Admin Navigation */}
                  {user.role === 'admin' && (
                    <div className="mt-3 pt-3 border-t border-blue-500">
                      <div className="text-xs text-blue-200 font-medium mb-2">ADMIN SECTION</div>
                      <Link 
                        to="/admin" 
                        className="block px-3 py-2 text-yellow-100 hover:bg-yellow-600/20 rounded border border-yellow-300/30"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Logout */}
                  <div className="mt-3 pt-3 border-t border-blue-500">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-red-200 hover:bg-red-500/20 rounded"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <Link to="/login" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                    Login
                  </Link>
                  <Link to="/register" className="block px-3 py-2 text-white hover:bg-blue-500 rounded">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
