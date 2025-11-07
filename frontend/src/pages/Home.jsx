import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'
import { toggleWishlist, isInWishlist } from '../utils/wishlist'
import { getEffectivePrice, hasDiscount } from '../utils/price'

const Home = () => {
  const navigate = useNavigate()
  const { addToCart, toggleCart, getCartCount } = useCart()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [wishlistUpdate, setWishlistUpdate] = useState(0) // Force re-render for wishlist changes

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data.slice(0, 8)) // Show max 8 categories
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products/featured')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleShopNow = () => {
    navigate('/products')
  }

  const handleAddToCart = (product) => {
    addToCart(product, 1)
  }

  const handleWishlistToggle = (e, product) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    setWishlistUpdate(prev => prev + 1) // Force re-render
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        <section className="bg-gradient-to-br from-emerald-600 via-teal-500 to-amber-500 rounded-2xl md:rounded-3xl px-6 md:px-8 py-12 md:py-16 mb-8 md:mb-12 text-center text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/20 to-amber-600/20"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight drop-shadow-lg">Welcome to Cedar Phoenix</h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 opacity-95 drop-shadow-md">Discover amazing products at unbeatable prices</p>
            <button 
              className="bg-gradient-to-r from-white to-amber-50 text-emerald-700 border-none px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-bold rounded-lg md:rounded-xl cursor-pointer hover:from-amber-50 hover:to-white hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)] active:translate-y-0 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.4)]"
              onClick={handleShopNow}
            >
              Shop Now
            </button>
          </div>
        </section>
        
        {/* Categories Section - Horizontal Scrollable */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8 bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Shop by Category</h2>
          {loadingCategories ? (
            <div className="text-center py-12 text-gray-500">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No categories available</div>
          ) : (
            <div className="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
              <div className="flex gap-4 md:gap-6 min-w-max">
                {categories.map(category => (
                  <Link
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl transition-all no-underline group flex-shrink-0 w-48 sm:w-56 md:w-64"
                  >
                    <div className="relative w-full h-32 sm:h-40 bg-gradient-to-br from-gray-800 to-black">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl sm:text-5xl">
                          📁
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2 line-clamp-1 group-hover:text-black transition-colors">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Featured Products Section */}
        <section className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Featured Products</h2>
            <Link 
              to="/products" 
              className="text-black hover:text-gray-700 font-semibold text-sm sm:text-base transition-colors no-underline"
            >
              View All →
            </Link>
          </div>
          {loadingProducts ? (
            <div className="text-center py-12 text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No products available</div>
          ) : (
            <>
              <div className="overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
                <div className="flex gap-4 md:gap-6 min-w-max">
                  {products.map(product => (
                    <div 
                      key={product._id} 
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl transition-all flex-shrink-0 w-48 sm:w-56 md:w-64"
                    >
                      <Link to={`/product/${product._id}`} className="block">
                        <div className="relative w-full h-40 sm:h-48 bg-white overflow-hidden group">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform hover:scale-105" 
                          />
                          {product.stock === 0 && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-lg font-semibold text-xs shadow-lg">
                              Out of Stock
                            </div>
                          )}
                          
                          {/* Wishlist Icon */}
                          <button
                            onClick={(e) => handleWishlistToggle(e, product)}
                            className="absolute top-2 right-2 bg-white backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all border border-gray-200 cursor-pointer z-10"
                            title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          >
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill={isInWishlist(product._id) ? '#ec4899' : 'none'} 
                              stroke={isInWishlist(product._id) ? '#ec4899' : '#374151'}
                              strokeWidth="2.5"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </Link>
                      <div className="p-4">
                        <span className="inline-block bg-gray-100 text-black px-2 py-1 rounded-md text-xs font-semibold uppercase mb-2">
                          {product.category?.name || 'Product'}
                        </span>
                        <Link to={`/product/${product._id}`} className="block group">
                          <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 leading-tight line-clamp-2 group-hover:text-black transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 leading-relaxed line-clamp-2 hidden sm:block">
                            {product.description}
                          </p>
                        </Link>
                        <div className="flex items-center justify-between gap-2">
                          {hasDiscount(product) ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg sm:text-xl font-bold text-emerald-600">
                                ${getEffectivePrice(product).toFixed(2)}
                              </span>
                              <span className="text-sm font-semibold text-gray-400 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg sm:text-xl font-bold text-black">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              const productWithDiscount = {
                                ...product,
                                price: getEffectivePrice(product)
                              }
                              handleAddToCart(productWithDiscount)
                            }}
                            disabled={product.stock === 0}
                            className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0 whitespace-nowrap"
                          >
                            {product.stock === 0 ? 'Out' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          )}
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md">Cedar Phoenix</h3>
              <p className="text-emerald-100 mb-4 leading-relaxed">
                Discover amazing products at unbeatable prices. Your trusted online shopping destination for quality and value.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-emerald-200 hover:text-amber-300 hover:scale-110 transition-all">
                  <span className="text-2xl">📘</span>
                </a>
                <a href="#" className="text-emerald-200 hover:text-amber-300 hover:scale-110 transition-all">
                  <span className="text-2xl">📷</span>
                </a>
                <a href="#" className="text-emerald-200 hover:text-amber-300 hover:scale-110 transition-all">
                  <span className="text-2xl">🐦</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="border-t border-emerald-600/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-emerald-200 text-sm mb-4 md:mb-0">
              © 2025 Cedar Phoenix. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-emerald-200 hover:text-amber-300 transition-colors text-sm no-underline">
                Privacy Policy
              </a>
              <a href="#" className="text-emerald-200 hover:text-amber-300 transition-colors text-sm no-underline">
                Terms of Service
              </a>
              <a href="#" className="text-emerald-200 hover:text-amber-300 transition-colors text-sm no-underline">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
