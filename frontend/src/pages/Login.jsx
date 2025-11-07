import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useCart } from '../context/CartContext'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toggleCart, getCartCount } = useCart()
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
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        login(data.data)
        navigate('/account')
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
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
      <NavBar />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent mb-2">Welcome Back</h1>
          <p className="text-emerald-700">Login to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-gray-100 border-2 border-black text-black px-4 py-3 rounded-lg mb-6 font-medium">
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
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-black focus:bg-white"
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
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-black focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-black font-semibold hover:text-gray-700 transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Demo: <span className="text-black font-mono">user@cedarphoenix.com / user123</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-black transition-colors text-sm">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Login

