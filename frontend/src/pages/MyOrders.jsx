import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'

const MyOrders = () => {
  const { user, isAuthenticated } = useAuth()
  const { toggleCart, getCartCount } = useCart()
  const location = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMyOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      
      const userToken = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      if (!userToken) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      const response = await fetch('http://localhost:3000/api/orders/myorders', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data || [])
      } else {
        console.error('Failed to fetch orders:', data.message)
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated()) {
      fetchMyOrders()
    } else {
      setLoading(false)
    }
  }, [user, location.pathname, isAuthenticated, fetchMyOrders])

  // Auto-refresh orders every 30 seconds
  useEffect(() => {
    if (!isAuthenticated()) return

    const interval = setInterval(() => {
      fetchMyOrders(true) // true = silent refresh (no loading state)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchMyOrders])

  // Refresh when window gains focus
  useEffect(() => {
    if (!isAuthenticated()) return

    const handleFocus = () => {
      fetchMyOrders(true) // Silent refresh
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAuthenticated, fetchMyOrders])

  // Refresh when page becomes visible (tab switching)
  useEffect(() => {
    if (!isAuthenticated()) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMyOrders(true) // Silent refresh
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, fetchMyOrders])

  const handleManualRefresh = () => {
    fetchMyOrders(false) // Full refresh with loading state
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
        <NavBar />
        <ShoppingCart />
        <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Please Login</h2>
            <p className="text-gray-600 mb-8">You need to be logged in to view your orders</p>
            <Link to="/login" className="inline-block px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all no-underline">
              Login to View Orders
            </Link>
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
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Orders</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={loading || refreshing}
              className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              title="Refresh orders"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Loading...' : refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link to="/account" className="text-black hover:text-gray-700 font-medium">
              ← Back to Account
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xl text-gray-500">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Orders Yet</h2>
            <p className="text-gray-600 mb-8">Start shopping to see your orders here</p>
            <Link to="/products" className="inline-block px-8 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all no-underline">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-6 py-4 border-b-2 border-gray-200">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
                      <p className="text-sm font-mono font-bold text-black">{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order Date</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {order.deliveredAt && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivered</p>
                        <p className="text-sm font-semibold text-green-600">
                          {new Date(order.deliveredAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
                      <p className="text-lg font-bold text-gray-800">${order.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center mt-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide mr-2">Order Status:</span>
                      <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                        order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                        order.orderStatus === 'processing' ? 'bg-gray-100 text-gray-800 border-2 border-gray-300' :
                        order.orderStatus === 'delivered' ? 'bg-gray-100 text-gray-800 border-2 border-gray-300' :
                        order.orderStatus === 'cancelled' ? 'bg-gray-100 text-gray-800 border-2 border-gray-300' :
                        'bg-gray-100 text-gray-800 border-2 border-gray-300'
                      }`}>
                        {order.orderStatus === 'pending' && '⏳ Pending'}
                        {order.orderStatus === 'processing' && '⚙️ Processing'}
                        {order.orderStatus === 'delivered' && '✅ Delivered'}
                        {order.orderStatus === 'cancelled' && '❌ Cancelled'}
                        {!['pending', 'processing', 'delivered', 'cancelled'].includes(order.orderStatus) && order.orderStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide mr-2">Payment:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        order.paymentInfo?.status === 'paid' ? 'bg-gray-100 text-gray-700' :
                        order.paymentInfo?.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                        order.paymentInfo?.status === 'failed' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.paymentInfo?.status || 'pending'}
                      </span>
                    </div>
                    {order.paymentInfo?.method && (
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">Payment Method:</span> {order.paymentInfo.method.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📦 Order Items</span>
                        <span className="text-sm font-normal text-gray-500">({order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''})</span>
                      </h3>
                      <div className="space-y-3">
                        {order.orderItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <img 
                              src={item.imageUrl || '/placeholder-image.png'} 
                              alt={item.name} 
                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" 
                              onError={(e) => { e.target.src = '/placeholder-image.png' }}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                <span>Qty: <span className="font-semibold">{item.quantity}</span></span>
                                <span>×</span>
                                <span>Price: <span className="font-semibold">${item.price.toFixed(2)}</span></span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.selectedSize && (
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-black text-xs rounded font-medium">
                                    Size: {item.selectedSize}
                                  </span>
                                )}
                                {item.selectedColor && (
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-black text-xs rounded font-medium">
                                    Color: {item.selectedColor}
                                  </span>
                                )}
                                {!item.selectedSize && !item.selectedColor && (
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded font-medium italic">
                                    Standard item
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="font-bold text-black text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary & Shipping Info */}
                    <div className="lg:col-span-1 space-y-4">
                      {/* Shipping Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>📍</span> Shipping Address
                        </h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="font-semibold">{order.shippingInfo?.name}</p>
                          <p>{order.shippingInfo?.address}</p>
                          <p>
                            {order.shippingInfo?.city}
                            {order.shippingInfo?.state && `, ${order.shippingInfo.state}`}
                            {order.shippingInfo?.zipCode && ` ${order.shippingInfo.zipCode}`}
                          </p>
                          {order.shippingInfo?.country && <p>{order.shippingInfo.country}</p>}
                          <p className="mt-2 pt-2 border-t border-gray-300">
                            <span className="font-semibold">Email:</span> {order.shippingInfo?.email || 'N/A'}
                          </p>
                          {(order.shippingInfo?.mobile || order.shippingInfo?.phone) && (
                            <p>
                              <span className="font-semibold">Phone:</span> {
                                order.shippingInfo?.mobile 
                                  ? `+${order.shippingInfo?.mobileCountryCode || '961'}${order.shippingInfo.mobile}`
                                  : order.shippingInfo.phone
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>💰</span> Price Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Items:</span>
                            <span>${order.itemsPrice?.toFixed(2) || order.totalPrice.toFixed(2)}</span>
                          </div>
                          {order.deliveryPrice > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Delivery:</span>
                              <span>${(order.deliveryPrice || 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg text-gray-800 pt-2 border-t-2 border-gray-300">
                            <span>Total:</span>
                            <span className="text-black">${order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default MyOrders

