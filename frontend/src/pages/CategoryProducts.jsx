import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'
import { toggleWishlist, isInWishlist } from '../utils/wishlist'
import { getEffectivePrice, hasDiscount } from '../utils/price'

const CategoryProducts = () => {
  const { slug } = useParams()
  const { addToCart, toggleCart, getCartCount } = useCart()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wishlistUpdate, setWishlistUpdate] = useState(0) // Force re-render for wishlist changes
  
  // Load view mode from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('cedar_phoenix_viewMode')
    return saved || 'grid'
  })

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cedar_phoenix_viewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [slug])

  const fetchCategoryAndProducts = async () => {
    try {
      // Fetch category by slug
      const categoryResponse = await fetch(`http://localhost:3000/api/categories/slug/${slug}`)
      const categoryData = await categoryResponse.json()
      
      if (categoryData.success) {
        setCategory(categoryData.data)
        
        // Fetch products for this category
        const productsResponse = await fetch(`http://localhost:3000/api/products?category=${categoryData.data._id}`)
        const productsData = await productsResponse.json()
        
        if (productsData.success) {
          setProducts(productsData.data)
        }
      } else {
        setCategory({ name: 'Category Not Found', description: '' })
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setCategory({ name: 'Error', description: 'Failed to load category' })
      setProducts([])
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/" className="text-black hover:text-gray-700 transition-colors">Home</Link>
          <span className="text-gray-500">›</span>
          <Link to="/categories" className="text-black hover:text-gray-700 transition-colors">Categories</Link>
          <span className="text-gray-500">›</span>
          <span className="text-gray-800 font-semibold">{category?.name || 'Loading...'}</span>
        </div>

        <div className="text-center mb-12 pb-8 border-b-2 border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{category?.name || 'Loading...'}</h1>
          <p className="text-lg text-gray-600">{category?.description}</p>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border-2 border-gray-200 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              title="Grid View (2 per row)"
              aria-label="Grid View"
            >
              <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              }`}
              title="List View (1 per row)"
              aria-label="List View"
            >
              <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xl text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl text-gray-600 mb-6">No products found in this category</h2>
            <Link to="/categories" className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-7 py-3.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.4)] transition-all no-underline">Browse Other Categories</Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8" 
            : "flex flex-col gap-4 sm:gap-6"
          }>
            {products.map(product => (
              <div 
                key={product._id} 
                className={`bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl transition-all ${
                  viewMode === 'list' ? 'flex flex-row items-center' : ''
                }`}
              >
                <Link to={`/product/${product._id}`} className={viewMode === 'list' ? 'block w-32 sm:w-64 flex-shrink-0' : 'block'}>
                  <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 sm:w-64 sm:h-64 rounded-l-xl flex items-center justify-center p-3 sm:p-4' : viewMode === 'grid' ? 'w-full h-40 sm:h-64' : 'w-full h-64'} bg-white overflow-hidden cursor-pointer group`}>
                    <img src={product.imageUrl} alt={product.name} className={`${viewMode === 'list' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'} transition-transform hover:scale-105`} />
                    {product.stock === 0 && <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-lg">Out of Stock</div>}
                    
                    {/* Wishlist Icon */}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white backdrop-blur-sm p-2 sm:p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all border border-gray-200 cursor-pointer z-10"
                      title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg 
                        width="18" 
                        height="18" 
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
                <div className={`${viewMode === 'grid' ? 'p-3 sm:p-6' : 'p-4 sm:p-6'} ${viewMode === 'list' ? 'flex-1 flex flex-col' : ''}`}>
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <span className={`inline-block bg-gray-100 text-black ${viewMode === 'grid' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs sm:px-3 sm:py-1 sm:text-xs'} rounded-md font-semibold uppercase mb-2 sm:mb-3`}>{product.category?.name || 'Product'}</span>
                    <Link to={`/product/${product._id}`} className="block group">
                      <h3 className={`${viewMode === 'grid' ? 'text-sm sm:text-xl' : 'text-sm sm:text-xl'} font-bold text-gray-800 mb-1 sm:mb-2 leading-tight group-hover:text-black transition-colors line-clamp-2`}>{product.name}</h3>
                      <p className={`text-gray-600 ${viewMode === 'grid' ? 'text-xs sm:text-base hidden sm:block' : 'text-xs sm:text-base hidden sm:block'} mb-2 sm:mb-4 leading-relaxed line-clamp-2`}>{product.description}</p>
                    </Link>
                    {viewMode === 'list' && (
                      <div className="mb-3 sm:hidden">
                        {hasDiscount(product) ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-2xl font-bold text-emerald-600">
                              ${getEffectivePrice(product).toFixed(2)}
                            </span>
                            <span className="text-xs sm:text-base font-semibold text-gray-400 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg sm:text-2xl font-bold text-black">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {viewMode === 'list' ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="hidden sm:block">
                        {hasDiscount(product) ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-2xl font-bold text-emerald-600">
                              ${getEffectivePrice(product).toFixed(2)}
                            </span>
                            <span className="text-xs sm:text-base font-semibold text-gray-400 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg sm:text-2xl font-bold text-black">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
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
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none px-4 py-2.5 text-sm sm:text-base sm:px-6 sm:py-3 rounded-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  ) : (
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4`}>
                      {hasDiscount(product) ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg sm:text-2xl font-bold text-emerald-600">
                            ${getEffectivePrice(product).toFixed(2)}
                          </span>
                          <span className="text-sm sm:text-base font-semibold text-gray-400 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg sm:text-2xl font-bold text-black">
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
                        className="px-3 py-2 text-xs sm:text-base sm:px-6 sm:py-3 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-none rounded-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default CategoryProducts
