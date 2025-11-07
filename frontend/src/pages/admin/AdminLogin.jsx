import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // In production, replace with actual API call
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.data.role === 'admin') {
        login(data.data)
        navigate('/admin/dashboard')
      } else if (response.ok && data.data.role !== 'admin') {
        setError('Access denied. Admin privileges required.')
      } else {
        setError(data.message || 'Invalid email or password')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-5xl font-bold bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent drop-shadow-lg">Cedar Phoenix</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Admin Login</h1>
          <p className="text-gray-400 mt-2">Enter your credentials to access the admin panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-amber-50 border-2 border-amber-500 text-amber-800 px-4 py-3 rounded-lg mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@cedarphoenix.com"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-lg hover:from-amber-600 hover:to-orange-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Logging in...' : 'Login to Admin Panel'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Demo Credentials:<br />
              <span className="text-black font-mono font-semibold">admin@cedarphoenix.com / admin123</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white hover:text-gray-300 transition-colors text-sm font-medium">
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

