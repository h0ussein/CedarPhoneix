import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'

// Parse existing phone number to extract country code and mobile number
const parsePhoneNumber = (phone) => {
  if (!phone) return { mobile: '', mobileCountryCode: '961' }
  
  // Check if phone starts with country code (e.g., 9611234567)
  const phoneStr = phone.replace(/^\+/, '') // Remove leading +
  if (phoneStr.startsWith('961')) {
    return {
      mobile: phoneStr.substring(3),
      mobileCountryCode: '961'
    }
  }
  // If no country code detected, assume it's just the mobile number
  return {
    mobile: phoneStr,
    mobileCountryCode: '961'
  }
}

const Account = () => {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const { toggleCart, getCartCount } = useCart()
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    mobileCountryCode: '961',
    phone: ''
  })

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      const parsedPhone = parsePhoneNumber(user.phone)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: parsedPhone.mobile,
        mobileCountryCode: parsedPhone.mobileCountryCode,
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Set phone to be the same as mobile number (with country code)
    const phone = formData.mobile ? `${formData.mobileCountryCode || '961'}${formData.mobile}` : ''
    
    // In production, call API to update profile
    // The phone field should be updated with the combined value
    alert('Profile updated successfully!')
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
        <NavBar />
        <ShoppingCart />
        <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Please Login</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to view your account</p>
            <div className="flex gap-4 justify-center">
              <Link to="/login" className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all no-underline">
                Login
              </Link>
              <Link to="/register" className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all no-underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center mb-6 pb-6 border-b-2 border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-r from-black to-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-800">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>

              <nav className="space-y-2">
                <Link to="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 text-black font-medium transition-all no-underline">
                  <span className="text-xl">👤</span> Profile
                </Link>
                <Link to="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all no-underline">
                  <span className="text-xl">📦</span> My Orders
                </Link>
                <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-all no-underline">
                  <span className="text-xl">❤️</span> Wishlist
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-gray-50 font-medium transition-all border-none bg-transparent cursor-pointer"
                >
                  <span className="text-xl">🚪</span> Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all border-none cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">+</span>
                        <input
                          type="text"
                          name="mobileCountryCode"
                          value={formData.mobileCountryCode}
                          onChange={handleChange}
                          placeholder="961"
                          className="w-full pl-6 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-black focus:bg-white"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="Phone number"
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-800 transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold py-3 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all border-none cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="text-lg font-semibold text-gray-800">{user?.name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-800">{user?.email}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="text-lg font-semibold text-gray-800">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Account Type</p>
                    <p className="text-lg font-semibold text-gray-800 capitalize">{user?.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Account

