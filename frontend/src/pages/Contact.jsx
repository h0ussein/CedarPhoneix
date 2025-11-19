import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const Contact = () => {
  const { toggleCart, getCartCount } = useCart()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  // Autofill name and email when user is logged in
  useEffect(() => {
    if (user && user.name && user.email) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email
      }))
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Contact form submitted:', formData)
    setSubmitted(true)
    // Keep name and email filled if user is logged in
    setFormData({ 
      name: user?.name || '', 
      email: user?.email || '', 
      subject: '', 
      message: '' 
    })
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent mb-2">Contact Us</h1>
          <p className="text-lg text-emerald-700">We'd love to hear from you. Send us a message!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-xl shadow-md hover:-translate-y-1 hover:shadow-xl transition-all">
              <div className="text-5xl mb-6 text-center">💬</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Contact Us with WhatsApp</h3>
              <p className="text-gray-600 leading-relaxed text-center mb-6">
                Get in touch with us instantly via WhatsApp. We're here to help you with any questions or concerns.
              </p>
              <a
                href="https://wa.me/96176878301"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none px-6 py-4 rounded-lg text-lg font-semibold cursor-pointer hover:from-green-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-3"
              >
                <span className="text-2xl">💬</span>
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Us a Message</h2>
            {submitted && (
              <div className="bg-gray-100 text-black p-4 rounded-lg mb-6 font-semibold">
                Thank you! We'll get back to you soon.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base font-sans resize-y transition-all focus:outline-none focus:border-black"
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-4 py-4 rounded-lg text-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Contact
