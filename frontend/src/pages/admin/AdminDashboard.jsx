import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProducts: 0, 
    totalOrders: 0, 
    totalUsers: 0, 
    totalRevenue: 0,
    totalDeliveryRevenue: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const [editingDeliveryId, setEditingDeliveryId] = useState(null)
  const [deliveryPriceInput, setDeliveryPriceInput] = useState('')
  const [allOrders, setAllOrders] = useState([])
  const [defaultDeliveryPrice, setDefaultDeliveryPrice] = useState(0)
  const [editingDefaultDelivery, setEditingDefaultDelivery] = useState(false)
  const [defaultDeliveryInput, setDefaultDeliveryInput] = useState('')
  const [applyToAllOrders, setApplyToAllOrders] = useState(false)
  const [savingDefaultDelivery, setSavingDefaultDelivery] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
    fetchSettings()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      
      // Fetch orders
      const ordersResponse = await fetch('http://localhost:3000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const ordersData = await ordersResponse.json()

      // Fetch products
      const productsResponse = await fetch('http://localhost:3000/api/products')
      const productsData = await productsResponse.json()

      // Fetch users
      const usersResponse = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const usersData = await usersResponse.json()

      if (ordersData.success && productsData.success && usersData.success) {
        const recentOrdersList = ordersData.data.slice(0, 5)
        const recentOrders = recentOrdersList.map(order => ({
          _id: order._id,
          id: order._id.slice(-6).toUpperCase(),
          customer: order.shippingInfo?.name || 'Guest',
          amount: order.totalPrice,
          status: order.orderStatus,
          deliveryPrice: order.deliveryPrice || 0,
          itemsPrice: order.itemsPrice || 0
        }))

        setAllOrders(ordersData.data)
        setStats({
          totalProducts: productsData.data?.length || 0,
          totalOrders: ordersData.totalOrders || 0,
          totalUsers: usersData.data?.length || 0,
          totalRevenue: ordersData.totalAmount || 0,
          totalDeliveryRevenue: ordersData.totalDeliveryRevenue || 0,
          recentOrders
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      const response = await fetch('http://localhost:3000/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setDefaultDeliveryPrice(data.data.defaultDeliveryPrice || 0)
        setDefaultDeliveryInput((data.data.defaultDeliveryPrice || 0).toString())
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleDefaultDeliveryPriceUpdate = async () => {
    const newPrice = parseFloat(defaultDeliveryInput)
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid delivery price', {
        icon: '❌',
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSavingDefaultDelivery(true)
    try {
      const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      const response = await fetch('http://localhost:3000/api/settings/delivery-price', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultDeliveryPrice: newPrice,
          applyToAllOrders
        })
      })

      const data = await response.json()

      if (response.ok) {
        setDefaultDeliveryPrice(newPrice)
        setEditingDefaultDelivery(false)
        setApplyToAllOrders(false)
        toast.success(
          applyToAllOrders 
            ? 'Default delivery price updated and applied to all orders!'
            : 'Default delivery price updated!',
          {
            icon: '✅',
            style: { background: '#10b981', color: '#fff' },
            duration: 4000
          }
        )
        // Refresh stats if applied to all orders
        if (applyToAllOrders) {
          fetchDashboardStats()
        }
      } else {
        toast.error(data.message || 'Failed to update default delivery price')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error updating default delivery price')
    } finally {
      setSavingDefaultDelivery(false)
    }
  }

  const handleDeliveryPriceUpdate = async (orderId, currentDeliveryPrice) => {
    if (deliveryPriceInput !== '') {
      const newDeliveryPrice = parseFloat(deliveryPriceInput)
      if (isNaN(newDeliveryPrice) || newDeliveryPrice < 0) {
        toast.error('Please enter a valid delivery price', {
          icon: '❌',
          style: { background: '#ef4444', color: '#fff' }
        })
        return
      }

      try {
        const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ deliveryPrice: newDeliveryPrice })
        })

        const data = await response.json()

        if (response.ok) {
          // Update the recent orders in stats
          const updatedOrders = stats.recentOrders.map(order => {
            if (order._id === orderId) {
              const newTotal = order.itemsPrice + newDeliveryPrice
              return { ...order, deliveryPrice: newDeliveryPrice, amount: newTotal }
            }
            return order
          })

          // Calculate new totals
          const order = stats.recentOrders.find(o => o._id === orderId)
          const oldDeliveryRevenue = order?.deliveryPrice || 0
          const newDeliveryRevenue = stats.totalDeliveryRevenue - oldDeliveryRevenue + newDeliveryPrice
          const oldTotalRevenue = stats.totalRevenue
          const newTotalRevenue = oldTotalRevenue - order.amount + (order.itemsPrice + newDeliveryPrice)

          setStats({
            ...stats,
            recentOrders: updatedOrders,
            totalDeliveryRevenue: newDeliveryRevenue,
            totalRevenue: newTotalRevenue
          })
          setEditingDeliveryId(null)
          setDeliveryPriceInput('')
          toast.success('Delivery price updated successfully', {
            icon: '✅',
            style: { background: '#10b981', color: '#fff' }
          })
        } else {
          toast.error(data.message || 'Failed to update delivery price')
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error updating delivery price')
      }
    }
  }

  const startEditingDelivery = (orderId, currentDeliveryPrice) => {
    setEditingDeliveryId(orderId)
    setDeliveryPriceInput(currentDeliveryPrice.toString())
  }

  const cancelEditingDelivery = () => {
    setEditingDeliveryId(null)
    setDeliveryPriceInput('')
  }

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-base text-gray-600">Welcome back, <span className="text-black font-semibold">{user?.name || 'Admin'}</span>! Here's your store overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-600 hover:shadow-xl transition-all shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📦</div>
            <div className="flex-1">
              <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Products</h3>
              <p className="text-2xl font-bold text-gray-800 m-0">{loading ? '...' : stats.totalProducts}</p>
            </div>
          </div>
          <Link to="/admin/products" className="block mt-2 text-emerald-700 font-semibold text-xs hover:text-emerald-800 transition-colors no-underline">Manage →</Link>
        </div>

        <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-600 hover:shadow-xl transition-all shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛍️</div>
            <div className="flex-1">
              <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-800 m-0">{loading ? '...' : stats.totalOrders}</p>
            </div>
          </div>
          <Link to="/admin/orders" className="block mt-2 text-emerald-700 font-semibold text-xs hover:text-emerald-800 transition-colors no-underline">View →</Link>
        </div>

        <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-600 hover:shadow-xl transition-all shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👥</div>
            <div className="flex-1">
              <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Users</h3>
              <p className="text-2xl font-bold text-gray-800 m-0">{loading ? '...' : stats.totalUsers}</p>
            </div>
          </div>
          <Link to="/admin/users" className="block mt-2 text-emerald-700 font-semibold text-xs hover:text-emerald-800 transition-colors no-underline">Manage →</Link>
        </div>

        <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-600 hover:shadow-xl transition-all shadow-md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💰</div>
            <div className="flex-1">
              <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-800 m-0">{loading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Default Delivery Price Settings */}
      <div className="bg-white p-4 md:p-5 rounded-xl mb-5 shadow-md border-l-4 border-emerald-600">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Delivery Price Settings</h2>
            <p className="text-sm text-gray-600">Set default delivery price for all new orders</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Delivery Price
              </label>
              {editingDefaultDelivery ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-800">$</span>
                  <input
                    type="number"
                    value={defaultDeliveryInput}
                    onChange={(e) => setDefaultDeliveryInput(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-32 px-4 py-2 border-2 border-emerald-600 rounded-lg text-lg font-semibold focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                    autoFocus
                  />
                  <button
                    onClick={handleDefaultDeliveryPriceUpdate}
                    disabled={savingDefaultDelivery}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {savingDefaultDelivery ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingDefaultDelivery(false)
                      setDefaultDeliveryInput(defaultDeliveryPrice.toString())
                      setApplyToAllOrders(false)
                    }}
                    disabled={savingDefaultDelivery}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-800">
                    ${defaultDeliveryPrice.toFixed(2)}
                  </span>
                  <button
                    onClick={() => setEditingDefaultDelivery(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                  >
                    ✏️ Edit Default Price
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {editingDefaultDelivery && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAllOrders}
                  onChange={(e) => setApplyToAllOrders(e.target.checked)}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Apply this price to all existing orders as well
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-8">
                ⚠️ Warning: This will update delivery price and totals for all existing orders
              </p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p>📌 This default price will be automatically applied to all new orders when customers checkout.</p>
            <p className="mt-1">You can still edit individual order delivery prices if needed.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl mb-5 shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/admin/products/new" className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
            <span className="text-xl">➕</span> Add Product
          </Link>
          <Link to="/admin/categories/new" className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
            <span className="text-xl">📁</span> Add Category
          </Link>
          <Link to="/admin/orders" className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
            <span className="text-xl">📊</span> All Orders
          </Link>
          <Link to="/admin/users" className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline">
            <span className="text-xl">👤</span> All Users
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Order ID</th>
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Customer</th>
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Delivery</th>
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Amount</th>
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Status</th>
                <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-3 text-center text-gray-600 text-sm">Loading...</td>
                </tr>
              ) : stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-3 text-center text-gray-600 text-sm">No recent orders</td>
                </tr>
              ) : (
                stats.recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-2 font-semibold text-black text-sm">{order.id}</td>
                    <td className="p-2 text-gray-800 text-sm">{order.customer}</td>
                    <td className="p-2">
                      {editingDeliveryId === order._id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">$</span>
                          <input
                            type="number"
                            value={deliveryPriceInput}
                            onChange={(e) => setDeliveryPriceInput(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-20 px-2 py-1 border-2 border-emerald-600 rounded text-sm font-semibold focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                            autoFocus
                          />
                          <button
                            onClick={() => handleDeliveryPriceUpdate(order._id, order.deliveryPrice)}
                            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-xs font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingDelivery}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500 transition-colors"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">${(order.deliveryPrice || 0).toFixed(2)}</span>
                          <button
                            onClick={() => startEditingDelivery(order._id, order.deliveryPrice || 0)}
                            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-xs font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                            title="Edit delivery price"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-semibold text-gray-800 text-sm">${order.amount.toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        order.status === 'processing' ? 'bg-gray-100 text-gray-800' :
                        order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <Link to="/admin/orders" className="text-emerald-700 font-semibold text-sm hover:text-emerald-800 transition-colors no-underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
