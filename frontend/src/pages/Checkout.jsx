import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { usersAPI, settingsAPI, productsAPI, ordersAPI } from '../utils/api'

const Checkout = () => {
  const navigate = useNavigate()
  const { cartItems, getCartTotal, clearCart, toggleCart, getCartCount, updateCartItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [loadingDelivery, setLoadingDelivery] = useState(true)
  const [editingItem, setEditingItem] = useState(null)
  const [productDetails, setProductDetails] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', mobile: '', mobileCountryCode: '961', phone: '', address: '', city: '', state: '', zipCode: '', country: 'Lebanon'
  })
  const [userDataLoaded, setUserDataLoaded] = useState(false)

  useEffect(() => {
    fetchDeliveryPrice()
  }, [])

  // Fetch user profile and auto-fill form when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated() && !userDataLoaded) {
        try {
          const data = await usersAPI.getProfile()

          if (data.success && data.data) {
            const userData = data.data
            
            // Split name into firstName and lastName
            let firstName = ''
            let lastName = ''
            if (userData.name) {
              const nameParts = userData.name.trim().split(' ')
              firstName = nameParts[0] || ''
              lastName = nameParts.slice(1).join(' ') || ''
            }

            // Parse phone number (format: "9611234567" or similar)
            let mobileCountryCode = '961'
            let mobile = ''
            if (userData.phone) {
              const phoneStr = userData.phone.toString().trim().replace(/[^\d]/g, '') // Remove non-digits
              
              // Try to extract country code based on common patterns
              if (phoneStr.startsWith('961') && phoneStr.length >= 10) {
                // Lebanon: 961 + 7-8 digits
                mobileCountryCode = '961'
                mobile = phoneStr.substring(3)
              } else if (phoneStr.startsWith('1') && phoneStr.length === 11) {
                // US/Canada: 1 + 10 digits
                mobileCountryCode = '1'
                mobile = phoneStr.substring(1)
              } else if (phoneStr.startsWith('44') && phoneStr.length >= 12) {
                // UK: 44 + 10 digits
                mobileCountryCode = '44'
                mobile = phoneStr.substring(2)
              } else if (phoneStr.length >= 10) {
                // Default: assume first 3 digits are country code, rest is mobile
                // Common country codes are 3 digits (e.g., 961, 212, 213, etc.)
                mobileCountryCode = phoneStr.substring(0, 3)
                mobile = phoneStr.substring(3)
              } else {
                // If phone is too short, assume it's just the mobile number
                mobile = phoneStr
              }
            }

            // Auto-fill form with user data
            setFormData(prev => ({
              ...prev,
              firstName: firstName || prev.firstName,
              lastName: lastName || prev.lastName,
              email: userData.email || prev.email,
              mobile: mobile || prev.mobile,
              mobileCountryCode: mobileCountryCode || prev.mobileCountryCode,
              address: userData.address?.street || prev.address,
              city: userData.address?.city || prev.city,
              state: userData.address?.state || prev.state,
              zipCode: userData.address?.zipCode || prev.zipCode,
              country: userData.address?.country || prev.country || 'Lebanon'
            }))
            
            setUserDataLoaded(true)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Don't show error to user, just continue with empty form
        }
      }
    }

    fetchUserProfile()
  }, [isAuthenticated, userDataLoaded])

  const fetchDeliveryPrice = async () => {
    try {
      setLoadingDelivery(true)
      const data = await settingsAPI.getDeliveryPrice()
      if (data.success) {
        setDeliveryPrice(data.defaultDeliveryPrice || 0)
      }
    } catch (error) {
      console.error('Error fetching delivery price:', error)
      setDeliveryPrice(0)
    } finally {
      setLoadingDelivery(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleEditItem = async (item) => {
    setEditingItem(item)
    setSelectedSize(item.selectedSize || '')
    setSelectedColor(item.selectedColor || '')
    setLoadingProduct(true)
    
    try {
      const data = await productsAPI.getById(item._id)
      
      if (data.success) {
        // Only allow editing if product has size or color options
        if (!data.data.sizes?.length && !data.data.colors?.length) {
          toast.error('This product does not have size or color options', {
            icon: 'ℹ️',
            style: { background: '#3b82f6', color: '#fff' }
          })
          setLoadingProduct(false)
          setEditingItem(null)
          return
        }
        
        setProductDetails(data.data)
        // Auto-select if only one option exists and not already selected
        if (data.data.sizes && data.data.sizes.length === 1 && !item.selectedSize) {
          setSelectedSize(data.data.sizes[0])
        }
        if (data.data.colors && data.data.colors.length === 1 && !item.selectedColor) {
          setSelectedColor(data.data.colors[0])
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product details')
    } finally {
      setLoadingProduct(false)
    }
  }

  const handleCloseEdit = () => {
    setEditingItem(null)
    setProductDetails(null)
    setSelectedSize('')
    setSelectedColor('')
  }

  const handleSaveEdit = () => {
    if (!editingItem) return

    // Check if required variants are selected
    if (productDetails) {
      if (productDetails.sizes && productDetails.sizes.length > 0 && !selectedSize) {
        toast.error('Please select a size', {
          icon: '⚠️',
          style: { background: '#ef4444', color: '#fff' }
        })
        return
      }
      if (productDetails.colors && productDetails.colors.length > 0 && !selectedColor) {
        toast.error('Please select a color', {
          icon: '⚠️',
          style: { background: '#ef4444', color: '#fff' }
        })
        return
      }
    }

    // Update the cart item
    updateCartItem(editingItem._id, {
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null
    }, editingItem)

    handleCloseEdit()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Combine firstName and lastName into name for backend compatibility
      const name = `${formData.firstName} ${formData.lastName}`.trim()
      // Set phone to be the same as mobile number (with country code)
      const phone = formData.mobile ? `${formData.mobileCountryCode || '961'}${formData.mobile}` : ''
      
      const orderData = {
        orderItems: cartItems.map(item => ({
          product: item._id || item.product?._id || item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl,
          ...(item.selectedSize && { selectedSize: item.selectedSize }),
          ...(item.selectedColor && { selectedColor: item.selectedColor })
        })),
        shippingInfo: {
          ...formData,
          name: name, // Include full name for backend
          phone: phone // Set phone to be the same as mobile
        },
        paymentInfo: { method: 'cash', status: 'pending' },
        itemsPrice: getCartTotal(),
        deliveryPrice: deliveryPrice,
        totalPrice: getCartTotal() + deliveryPrice
      }

      const data = await ordersAPI.create(orderData)

      clearCart()
      toast.success('Order placed successfully! We will contact you soon.', {
        icon: '✅',
        style: { background: '#10b981', color: '#fff' },
        duration: 4000
      })
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error('Order error:', error)
      toast.error(error.message || 'There was an error placing your order. Please try again.', {
        icon: '❌',
        style: { background: '#ef4444', color: '#fff' },
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
        <NavBar />
        <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
        <div className="text-center py-16 px-8">
          <h2 className="text-3xl text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-lg text-gray-600 mb-8">Add some products to checkout</p>
          <button onClick={() => navigate('/products')} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-8 py-4 rounded-lg text-base font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all">
            Go Shopping
          </button>
        </div>
      </div>
    )
  }

  const subtotal = getCartTotal()
  const total = subtotal + deliveryPrice

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      <NavBar />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-200">Shipping Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Email <span className="text-sm font-normal text-gray-500">(optional)</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
              </div>

              <div className="mb-8 border-b-2 border-gray-200"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">+</span>
                    <input type="text" name="mobileCountryCode" value={formData.mobileCountryCode} onChange={handleChange} required className="w-full pl-6 pr-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="961" />
                  </div>
                  <div className="flex-1">
                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="Phone number" />
                  </div>
                </div>
              </div>

              <div className="mb-8 border-b-2 border-gray-200"></div>

              <div className="mb-6">
                <label className="block font-semibold text-gray-800 mb-2">Address <span className="text-sm font-normal text-gray-500">(optional)</span></label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">Zip Code <span className="text-sm font-normal text-gray-500">(optional)</span></label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">Country *</label>
                  <select name="country" value={formData.country} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
                    <option value="Lebanon">Lebanon</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-4 py-4 rounded-lg text-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-200">Order Summary</h2>
            
            <div className="mb-6 max-h-80 overflow-y-auto">
              {cartItems.map(item => {
                const itemKey = `${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor || 'no-color'}`
                // Only show edit option if product has size/color options
                // Check if item has non-empty sizes/colors arrays, or if it already has selected values (indicating it has options)
                const hasSizeOptions = item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0
                const hasColorOptions = item.colors && Array.isArray(item.colors) && item.colors.length > 0
                const hasOptions = hasSizeOptions || hasColorOptions
                // Show button if product has options OR if it already has selected values (meaning it came from a product with options)
                const showEditButton = hasOptions || item.selectedSize || item.selectedColor
                return (
                <div key={itemKey} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
                    <p className="text-sm text-gray-600 mb-1">Qty: {item.quantity}</p>
                    {(item.selectedSize || item.selectedColor || showEditButton) && (
                      <div className="flex flex-wrap gap-1 mt-1 items-center">
                        {item.selectedSize && (
                          <span className="inline-block px-2 py-0.5 bg-gray-200 text-black text-xs rounded font-medium">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-block px-2 py-0.5 bg-gray-200 text-black text-xs rounded font-medium">
                            Color: {item.selectedColor}
                          </span>
                        )}
                        {showEditButton && (
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline ml-1"
                          >
                            {item.selectedSize || item.selectedColor ? 'Edit' : 'Select Details'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-black">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                )
              })}
            </div>

            <div className="border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between mb-3 text-base text-gray-600">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-3 text-base text-gray-600">
                <span>Delivery:</span>
                <span>{loadingDelivery ? '...' : `$${deliveryPrice.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 mt-4 pt-4 border-t-2 border-gray-200">
                <span>Total:</span>
                <span className="text-black">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Product Details Modal */}
      {editingItem && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1999]" onClick={handleCloseEdit}></div>
          <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Edit Product Details</h3>
                <button
                  onClick={handleCloseEdit}
                  className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {loadingProduct ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product details...</p>
                  </div>
                ) : productDetails ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <img src={editingItem.imageUrl} alt={editingItem.name} className="w-20 h-20 object-cover rounded-lg" />
                      <div>
                        <h4 className="font-semibold text-gray-800">{editingItem.name}</h4>
                        <p className="text-lg font-bold text-black">${editingItem.price.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Size Selection */}
                    {productDetails.sizes && productDetails.sizes.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Size <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {productDetails.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all border-2 ${
                                selectedSize === size
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500 hover:text-emerald-700'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Selection */}
                    {productDetails.colors && productDetails.colors.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Color <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-4">
                          {productDetails.colors.map((color) => {
                            const isSelected = selectedColor === color
                            return (
                              <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className="flex flex-col items-center gap-2 group"
                              >
                                <div
                                  className={`relative w-12 h-12 rounded-full transition-all ${
                                    isSelected 
                                      ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' 
                                      : 'ring-1 ring-gray-300 group-hover:ring-2 group-hover:ring-emerald-400'
                                  }`}
                                  style={{
                                    backgroundColor: color.toLowerCase(),
                                    border: color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' || color.toLowerCase() === 'beige' ? '2px solid #e5e7eb' : 'none'
                                  }}
                                >
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <svg 
                                        className={`w-5 h-5 drop-shadow-lg ${
                                          color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' || color.toLowerCase() === 'beige' 
                                            ? 'text-black' 
                                            : 'text-white'
                                        }`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-medium capitalize transition-colors ${
                                  isSelected ? 'text-emerald-700' : 'text-gray-600'
                                }`}>
                                  {color}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCloseEdit}
                        className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Failed to load product details</p>
                    <button
                      onClick={handleCloseEdit}
                      className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold py-2 px-6 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Checkout
