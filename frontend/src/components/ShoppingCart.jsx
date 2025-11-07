import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { settingsAPI } from '../utils/api.js'

const ShoppingCart = () => {
  const navigate = useNavigate()
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    isCartOpen,
    toggleCart
  } = useCart()
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [loadingDelivery, setLoadingDelivery] = useState(true)

  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      fetchDeliveryPrice()
    }
  }, [isCartOpen, cartItems.length])

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

  if (!isCartOpen) return null

  const handleCheckout = () => {
    toggleCart()
    navigate('/checkout')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1999]" onClick={toggleCart}></div>
      <div className="fixed top-0 right-0 w-[420px] h-screen bg-white shadow-2xl z-[2000] flex flex-col animate-slide-in-right max-[480px]:w-full max-[480px]:top-0">
        <div className="flex items-center justify-between px-6 py-4 md:py-6 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 sticky top-0 z-10">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent m-0">Shopping Cart</h2>
          <button 
            className="bg-none border-none cursor-pointer p-2 text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors"
            onClick={toggleCart}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-gray-500 pb-20 md:pb-0">
              <svg className="mb-4 opacity-50" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="9" cy="21" r="1" strokeWidth="2"/>
                <circle cx="20" cy="21" r="1" strokeWidth="2"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-lg mb-6">Your cart is empty</p>
              <button 
                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-6 py-3 rounded-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all"
                onClick={toggleCart}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
                {cartItems.map((item) => {
                  const itemKey = `${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor || 'no-color'}`
                  return (
                  <div key={itemKey} className="flex gap-4 p-4 bg-gray-50 rounded-xl mb-4 relative">
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden">
                      <img src={item.imageUrl || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <h3 className="text-base font-semibold text-gray-800 m-0 leading-tight">{item.name}</h3>
                      <p className="text-lg font-bold text-black m-0">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3 mt-auto">
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          className="bg-white border border-gray-200 w-7 h-7 rounded-md cursor-pointer font-semibold text-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-semibold min-w-[30px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          className="bg-white border border-gray-200 w-7 h-7 rounded-md cursor-pointer font-semibold text-gray-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      className="absolute top-2 right-2 bg-white border-none p-1.5 rounded-md cursor-pointer text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => removeFromCart(itemKey)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  )
                })}
              </div>

              <div className="px-6 py-4 md:py-6 border-t border-gray-200 bg-white sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] max-[480px]:pb-20">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-base text-gray-600">
                    <span>Subtotal:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base text-gray-600">
                    <span>Delivery:</span>
                    <span>{loadingDelivery ? '...' : `$${deliveryPrice.toFixed(2)}`}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4 text-xl font-semibold pt-3 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-black text-2xl">
                    ${(getCartTotal() + deliveryPrice).toFixed(2)}
                  </span>
                </div>
                <button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-4 py-4 rounded-xl text-base font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all mb-3"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
                <button 
                  className="w-full bg-white text-emerald-700 border-2 border-emerald-600 px-4 py-3.5 rounded-xl text-base font-semibold cursor-pointer hover:bg-emerald-50 transition-colors"
                  onClick={toggleCart}
                >
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ShoppingCart
