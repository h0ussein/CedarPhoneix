import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const BottomNav = ({ onCartClick, cartCount = 0 }) => {
  const location = useLocation()
  const { isCartOpen, toggleCart } = useCart()

  const isActive = (path) => location.pathname === path

  const handleNavClick = () => {
    if (isCartOpen) {
      toggleCart()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white to-emerald-50/30 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex justify-around items-center py-2 z-[2001] border-t border-emerald-200 md:hidden">
      <Link 
        to="/" 
        onClick={handleNavClick}
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 no-underline transition-colors min-w-[60px] text-xs font-medium ${isActive('/') ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-700'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Home</span>
      </Link>

      <Link 
        to="/products" 
        onClick={handleNavClick}
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 no-underline transition-colors min-w-[60px] text-xs font-medium ${isActive('/products') ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-700'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Products</span>
      </Link>

      <button 
        className="flex flex-col items-center justify-center gap-1 px-4 py-2 bg-none border-none cursor-pointer transition-colors min-w-[60px] text-xs font-medium text-gray-500 hover:text-emerald-700"
        onClick={onCartClick}
      >
        <div className="relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="9" cy="21" r="1" strokeWidth="2"/>
            <circle cx="20" cy="21" r="1" strokeWidth="2"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[0.7rem] font-semibold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center leading-none shadow-lg">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </button>

      <Link 
        to="/categories" 
        onClick={handleNavClick}
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 no-underline transition-colors min-w-[60px] text-xs font-medium ${isActive('/categories') ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-700'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="8" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Categories</span>
      </Link>

      <Link 
        to="/contact" 
        onClick={handleNavClick}
        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 no-underline transition-colors min-w-[60px] text-xs font-medium ${isActive('/contact') ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-700'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Contact</span>
      </Link>
    </div>
  )
}

export default BottomNav
