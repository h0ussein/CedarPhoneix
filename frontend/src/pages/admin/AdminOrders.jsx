import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingDeliveryPrice, setEditingDeliveryPrice] = useState(false)
  const [deliveryPriceInput, setDeliveryPriceInput] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/orders', {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        // Use the updated order data from the backend response
        const updatedOrder = data.data || { ...orders.find(o => o._id === orderId), orderStatus: newStatus }
        
        // Update orders list
        setOrders(orders.map(order => 
          order._id === orderId ? updatedOrder : order
        ))
        
        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(updatedOrder)
        }
        
        toast.success(`Order status updated to ${newStatus}`, {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error updating order status')
    }
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.orderStatus === filter)

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setEditingDeliveryPrice(false)
    setDeliveryPriceInput(order.deliveryPrice?.toString() || '0')
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setEditingDeliveryPrice(false)
    setDeliveryPriceInput('')
  }

  const handleDeliveryPriceUpdate = async () => {
    if (selectedOrder && deliveryPriceInput !== '') {
      const newDeliveryPrice = parseFloat(deliveryPriceInput)
      if (isNaN(newDeliveryPrice) || newDeliveryPrice < 0) {
        toast.error('Please enter a valid delivery price', {
          icon: '❌',
          style: { background: '#ef4444', color: '#fff' }
        })
        return
      }

      try {
        const response = await fetch(`http://localhost:3000/api/orders/${selectedOrder._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
          },
          body: JSON.stringify({ deliveryPrice: newDeliveryPrice })
        })

        const data = await response.json()

        if (response.ok) {
          // Update the order in the list and selected order
          const updatedOrder = { ...selectedOrder, deliveryPrice: newDeliveryPrice, totalPrice: selectedOrder.itemsPrice + newDeliveryPrice }
          setSelectedOrder(updatedOrder)
          setOrders(orders.map(order => 
            order._id === selectedOrder._id ? updatedOrder : order
          ))
          setEditingDeliveryPrice(false)
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

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Manage Orders</h1>
        <p className="text-base text-gray-600 mb-4">View and update order status</p>
        
        <div className="flex flex-wrap gap-3">
          {['all', 'pending', 'processing', 'delivered', 'cancelled'].map(status => (
            <button 
              key={status}
              onClick={() => setFilter(status)} 
              className={`px-5 py-2.5 border-2 rounded-lg font-semibold cursor-pointer transition-all ${
                filter === status 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-600 hover:text-emerald-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No {filter === 'all' ? '' : filter} Orders</h2>
          <p className="text-gray-600">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Order ID</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Customer</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Email</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Items</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Total</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Date</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Status</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr 
                    key={order._id} 
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="p-2 font-semibold text-black text-sm">{order._id.slice(-6).toUpperCase()}</td>
                    <td className="p-2 font-semibold text-gray-800 text-sm">{order.shippingInfo?.name || 'Guest'}</td>
                    <td className="p-2 text-gray-600 text-xs">{order.shippingInfo?.email || 'N/A'}</td>
                    <td className="p-2 text-gray-800 text-sm">{order.orderItems?.length || 0} items</td>
                    <td className="p-2 font-bold text-gray-800 text-sm">${order.totalPrice.toFixed(2)}</td>
                    <td className="p-2 text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.orderStatus === 'processing' ? 'bg-gray-100 text-gray-800' :
                        order.orderStatus === 'delivered' ? 'bg-gray-100 text-gray-800' :
                        order.orderStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <select 
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="px-2 py-1 bg-white border-2 border-gray-200 text-gray-800 rounded-md text-xs font-semibold cursor-pointer transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                <p className="text-xs text-gray-600 mt-1">Order ID: {selectedOrder._id.slice(-6).toUpperCase()}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Order Status & Date */}
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-200">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 inline-block px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${
                    selectedOrder.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrder.orderStatus === 'processing' ? 'bg-gray-100 text-gray-800' :
                    selectedOrder.orderStatus === 'delivered' ? 'bg-gray-100 text-gray-800' :
                    selectedOrder.orderStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <span className="ml-2 font-semibold text-gray-800">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedOrder.deliveredAt && (
                  <div>
                    <span className="text-sm text-gray-600">Delivered:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {new Date(selectedOrder.deliveredAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Order Items ({selectedOrder.orderItems?.length || 0})</h3>
                <div className="space-y-4">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <img 
                        src={item.imageUrl || 'http://localhost:3000/uploads/default-product.png'} 
                        alt={item.name} 
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'http://localhost:3000/uploads/default-product.png'
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg mb-2">{item.name}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                          <span>
                            <span className="font-semibold">Quantity:</span> {item.quantity}
                          </span>
                          <span>
                            <span className="font-semibold">Price:</span> ${item.price.toFixed(2)}
                          </span>
                          <span>
                            <span className="font-semibold">Subtotal:</span> ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.selectedSize && (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-black text-sm rounded font-medium">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-black text-sm rounded font-medium">
                              Color: {item.selectedColor}
                            </span>
                          )}
                          {!item.selectedSize && !item.selectedColor && (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded font-medium italic">
                              No variants selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Price:</span>
                    <span className="font-semibold">${selectedOrder.itemsPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Delivery:</span>
                    {editingDeliveryPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">$</span>
                        <input
                          type="number"
                          value={deliveryPriceInput}
                          onChange={(e) => setDeliveryPriceInput(e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1 border-2 border-emerald-600 rounded text-sm font-semibold focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <button
                          onClick={handleDeliveryPriceUpdate}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-sm font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingDeliveryPrice(false)
                            setDeliveryPriceInput(selectedOrder.deliveryPrice?.toString() || '0')
                          }}
                          className="px-3 py-1 bg-gray-400 text-white rounded text-sm font-semibold hover:bg-gray-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${(selectedOrder.deliveryPrice || 0).toFixed(2)}</span>
                        <button
                          onClick={() => setEditingDeliveryPrice(true)}
                          className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-xs font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                          title="Edit delivery price"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-800 pt-4 border-t-2 border-gray-300">
                    <span>Total:</span>
                    <span className="text-black">${selectedOrder.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {selectedOrder.shippingInfo && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Shipping Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-semibold text-gray-800">
                        {selectedOrder.shippingInfo?.mobile 
                          ? `+${selectedOrder.shippingInfo?.mobileCountryCode || '961'}${selectedOrder.shippingInfo.mobile}`
                          : selectedOrder.shippingInfo?.phone || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.city}</span>
                    </div>
                    {selectedOrder.shippingInfo.state && (
                      <div>
                        <span className="text-gray-600">State:</span>
                        <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.state}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Zip Code:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.zipCode}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <span className="ml-2 font-semibold text-gray-800">{selectedOrder.shippingInfo.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedOrder.paymentInfo && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Method:</span>
                      <span className="ml-2 font-semibold text-gray-800 capitalize">
                        {selectedOrder.paymentInfo.method || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        selectedOrder.paymentInfo.status === 'paid' ? 'bg-gray-100 text-gray-800' :
                        selectedOrder.paymentInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOrder.paymentInfo.status || 'pending'}
                      </span>
                    </div>
                    {selectedOrder.paymentInfo.paidAt && (
                      <div>
                        <span className="text-gray-600">Paid At:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {new Date(selectedOrder.paymentInfo.paidAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminOrders
