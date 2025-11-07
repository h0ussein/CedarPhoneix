import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { categoriesAPI } from '../utils/api'

const NavBar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { getCartCount, toggleCart } = useCart()
  const cartCount = getCartCount()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const [categories, setCategories] = useState([])

  useEffect(() => {
    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const data = await categoriesAPI.getAll()
        if (data.success) {
          setCategories(data.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Fallback to default categories if API fails
        setCategories([
          { _id: '1', name: 'Electronics', slug: 'electronics' },
          { _id: '2', name: 'Fashion', slug: 'fashion' },
          { _id: '3', name: 'Sports', slug: 'sports' }
        ])
      }
    }
    fetchCategories()
  }, [])

  return (
    <>
      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1500]" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 w-80 max-w-[85vw] h-screen bg-white shadow-2xl z-[2000] overflow-y-auto transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-6 border-b-2 border-emerald-700/30 bg-gradient-to-r from-emerald-700 to-teal-600">
          <h2 className="text-2xl font-bold text-white drop-shadow-md">Cedar Phoenix</h2>
          <button 
            className="p-2 text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors" 
            onClick={toggleSidebar}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <div className="p-0">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-6 py-3">Categories</h3>
            <ul className="list-none p-0 m-0">
              {categories.map((category) => (
                <li key={category._id}>
                  <Link 
                    to={`/category/${category.slug}`} 
                    onClick={toggleSidebar}
                    className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700 hover:pl-7 transition-all"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-6 py-3">Account</h3>
            <ul className="list-none p-0 m-0">
              <li><Link to="/account" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">My Account</Link></li>
              <li><Link to="/orders" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">My Orders</Link></li>
              <li><Link to="/wishlist" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">Wishlist</Link></li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-6 py-3">Help</h3>
            <ul className="list-none p-0 m-0">
              <li><Link to="/contact" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">Contact Us</Link></li>
              <li><Link to="/faq" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">FAQ</Link></li>
              <li><Link to="/shipping" onClick={toggleSidebar} className="block px-6 py-3.5 text-gray-800 no-underline text-base border-l-3 border-transparent hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 hover:pl-7 transition-all">Shipping Info</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-gradient-to-r from-white to-emerald-50/30 shadow-lg sticky top-0 z-[1000] w-full border-b-2 border-emerald-100">
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto gap-3 md:gap-8">
          {/* Left Section - Menu & Logo */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button 
              className="p-1.5 md:p-2 flex items-center justify-center text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors" 
              onClick={toggleSidebar}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <Link to="/" className="no-underline flex items-center">
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent tracking-tight">Cedar Phoenix</span>
            </Link>
          </div>

          {/* Right Section - Icons */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Link to="/wishlist" className="relative p-1.5 md:p-2 text-emerald-700 no-underline flex items-center justify-center rounded-lg hover:bg-emerald-50 hover:text-emerald-800 transition-colors" title="Wishlist">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="md:w-6 md:h-6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <button onClick={toggleCart} className="relative p-1.5 md:p-2 text-emerald-700 bg-transparent border-none cursor-pointer flex items-center justify-center rounded-lg hover:bg-emerald-50 hover:text-emerald-800 transition-colors" title="Shopping Cart">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="md:w-6 md:h-6">
                <circle cx="9" cy="21" r="1" strokeWidth="2"/>
                <circle cx="20" cy="21" r="1" strokeWidth="2"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {cartCount > 0 && <span className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-lg">{cartCount}</span>}
            </button>

            <Link to="/account" className="relative p-1.5 md:p-2 text-emerald-700 no-underline flex items-center justify-center rounded-lg hover:bg-emerald-50 hover:text-emerald-800 transition-colors" title="Account">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="md:w-6 md:h-6">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Category Bar (Desktop Only) */}
        <div className="border-t border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-amber-50/30 hidden md:block">
          <div className="flex items-center justify-center gap-2 px-8 py-3 max-w-7xl mx-auto flex-wrap">
            {categories.slice(0, 6).map((category) => (
              <Link key={category._id} to={`/category/${category.slug}`} className="no-underline text-emerald-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white hover:text-emerald-800 hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap border border-transparent hover:border-emerald-200">
                {category.name}
              </Link>
            ))}
            <Link to="/categories" className="no-underline bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap">
              More
            </Link>
          </div>
    </div>
      </nav>
    </>
  )
}

export default NavBar
