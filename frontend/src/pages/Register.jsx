import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useCart } from '../context/CartContext'
import { usersAPI } from '../utils/api'
import { combinePhoneNumber, COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../utils/phoneUtils'

const Register = () => {
  const navigate = useNavigate()
  const { toggleCart, getCartCount } = useCart()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    mobileCountryCode: DEFAULT_COUNTRY_CODE,
    phone: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Combine country code and mobile number
      const phone = combinePhoneNumber(formData.mobileCountryCode, formData.mobile)
      
      const data = await usersAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: phone
      })

      // Don't log in - user must verify email first
      toast.success('Account created! Please check your email to verify your account before logging in.', {
        icon: '📧',
        duration: 6000,
        style: { background: '#10b981', color: '#fff' }
      })
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          message: 'Account created! Please check your email to verify your account.',
          email: formData.email 
        } 
      })
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent mb-2">Create Account</h1>
          <p className="text-emerald-700">Join Cedar Phoenix today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="bg-gray-100 border-2 border-black text-black px-4 py-3 rounded-lg mb-6 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
              <div className="flex gap-2">
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 z-10">+</span>
                  <select
                    name="mobileCountryCode"
                    value={formData.mobileCountryCode}
                    onChange={handleChange}
                    required
                    className="w-full pl-6 pr-8 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white appearance-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    placeholder="Phone number"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter password"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-semibold hover:text-gray-700 transition-colors">
                Login
              </Link>
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

export default Register

