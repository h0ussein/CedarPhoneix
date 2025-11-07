import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../context/CartContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { cleanupWishlist, getWishlist } from '../utils/wishlist'

const Wishlist = () => {
  const { addToCart, toggleCart, getCartCount } = useCart()
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true)
        // Clean up wishlist by removing deleted products
        await cleanupWishlist()
        // Load cleaned wishlist from localStorage
        const savedWishlist = getWishlist()
        setWishlistItems(savedWishlist)
      } catch (error) {
        console.error('Error loading wishlist:', error)
      } finally {
        setLoading(false)
      }
    }
    loadWishlist()
  }, [])

  const removeFromWishlist = (productId) => {
    const item = wishlistItems.find(item => item._id === productId)
    const newWishlist = wishlistItems.filter(item => item._id !== productId)
    setWishlistItems(newWishlist)
    localStorage.setItem('cedar_phoenix_wishlist', JSON.stringify(newWishlist))
    toast.success(`Removed from wishlist`, {
      icon: '❤️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      }
    })
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1)
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Wishlist</h1>
          <Link to="/account" className="text-black hover:text-gray-700 font-medium">
            ← Back to Account
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading wishlist...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-8">Add products you love to your wishlist</p>
            <Link to="/products" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all no-underline">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map(product => (
              <div key={product._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                <div className="relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover" />
                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 hover:text-black transition-all border-none cursor-pointer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-black">${product.price.toFixed(2)}</span>
                    <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-4 py-3 rounded-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Wishlist

