import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import cedarIcon from '../assets/cedar1.png'

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const isActive = (path) => location.pathname.startsWith(path)

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '📦', label: 'Products' },
    { path: '/admin/categories', icon: '📁', label: 'Categories' },
    { path: '/admin/featured-products', icon: '⭐', label: 'Featured Products' },
    { path: '/admin/related-products', icon: '🔗', label: 'Related Products' },
    { path: '/admin/orders', icon: '🛍️', label: 'Orders' },
    { path: '/admin/users', icon: '👥', label: 'Users' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-56 bg-white shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0 border-r border-gray-200 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b-2 border-emerald-700/30 bg-gradient-to-r from-emerald-700 to-teal-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={cedarIcon} alt="Cedar Phoenix Logo" className="w-6 h-6 flex-shrink-0" style={{ display: 'block' }} />
            <h2 className="text-lg font-bold text-white leading-none">Admin Panel</h2>
          </div>
          <button 
            className="lg:hidden p-2 text-white hover:bg-white/20 rounded-lg transition-colors" 
            onClick={toggleSidebar}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="p-3 overflow-y-auto flex-1">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-2">Navigation</p>
            {adminMenuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 no-underline transition-all text-sm ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-500 px-2 mb-2">Quick Actions</p>
            <Link to="/admin/products/new" className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all no-underline text-sm">
              <span className="text-lg">➕</span>
              <span className="font-medium">Add Product</span>
            </Link>
            <Link to="/admin/categories/new" className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all no-underline text-sm">
              <span className="text-lg">📂</span>
              <span className="font-medium">Add Category</span>
            </Link>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-200">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all no-underline mb-2 text-sm">
              <span className="text-lg">🏠</span>
              <span className="font-medium">Back to Store</span>
            </Link>
            <button 
              onClick={() => {
                logout()
                navigate('/admin')
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all border-none bg-transparent cursor-pointer text-sm"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-56 min-h-screen bg-gray-50 flex flex-col">
        {/* Admin Top Bar */}
        <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-30 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between px-3 md:px-4 lg:px-5 py-3">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={toggleSidebar}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <Link to="/" className="flex items-center gap-2 text-lg md:text-xl lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent no-underline">
                <span className="bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Cedar Phoenix Admin</span>
                <img src={cedarIcon} alt="Cedar Phoenix Logo" className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" style={{ display: 'block' }} />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:block text-sm text-gray-600">
                Welcome, <span className="text-black font-semibold">{user?.name || 'Admin'}</span>
              </span>
              <button 
                onClick={() => {
                  logout()
                  navigate('/admin')
                }}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors font-medium text-sm border-none cursor-pointer"
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 md:p-4 lg:p-5 overflow-y-auto flex-1 max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

