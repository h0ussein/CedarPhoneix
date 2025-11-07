import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'
import { toggleWishlist, isInWishlist } from '../utils/wishlist'
import { getEffectivePrice, hasDiscount } from '../utils/price'
import { productsAPI, categoriesAPI } from '../utils/api'

const Products = () => {
  const { addToCart, toggleCart, getCartCount } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
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
    fetchCategories()
    
    // Handle search query from URL parameters
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      setSearchTerm(searchQuery)
    }
  }, [searchParams])

  useEffect(() => {
    setPage(1)
    setProducts([])
    setHasMore(true)
    fetchProducts(1, true)
  }, [selectedCategory, searchTerm])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500

      if (scrolledToBottom && hasMore && !loading && !loadingMore) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadingMore, page, totalPages])

  const fetchProducts = async (pageNum = 1, reset = false) => {
    try {
      if (reset) setLoading(true)
      else setLoadingMore(true)

      const params = {
        page: pageNum,
        limit: 20,  // Load 20 products per page for better UX
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchTerm && { search: searchTerm })
      }

      const data = await productsAPI.getAll(params)
      
      if (data.success) {
        if (reset) {
          setProducts(data.data)
        } else {
          setProducts(prev => [...prev, ...data.data])
        }
        setTotalPages(data.totalPages || 1)
        setPage(pageNum)
        setHasMore(pageNum < (data.totalPages || 1))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchProducts(page + 1, false)
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
    <div className="min-h-screen pb-20 md:pb-0">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent mb-2">Our Products</h1>
          <p className="text-base md:text-lg text-emerald-700">Discover amazing products at great prices</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 sm:flex-none sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-blue-600 appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle - Next to Category Filter */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border-2 border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                      : 'text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200'
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
                      : 'text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200'
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
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8" 
              : "flex flex-col gap-4 sm:gap-6"
            }>
              {products.length === 0 ? (
                <div className={`${viewMode === 'grid' ? 'col-span-full' : ''} text-center py-16 text-xl text-gray-500`}>No products found</div>
              ) : (
                products.map(product => (
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
                      <span className={`inline-block bg-gray-100 text-black ${viewMode === 'grid' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs sm:px-3 sm:py-1 sm:text-xs'} rounded-md font-semibold uppercase mb-2 sm:mb-3`}>{product.category.name}</span>
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
              ))
            )}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="text-center mt-12 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading more products...</p>
            </div>
          )}

          {/* End of Results */}
          {!hasMore && products.length > 0 && (
            <div className="text-center mt-12 py-8 border-t-2 border-gray-200">
              <p className="text-gray-600 font-medium">You've seen all {products.length} products</p>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  )
}

export default Products
