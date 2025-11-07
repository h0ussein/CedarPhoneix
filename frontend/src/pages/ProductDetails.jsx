import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'
import { toggleWishlist, isInWishlist } from '../utils/wishlist'
import { getEffectivePrice, hasDiscount, calculateDiscountedPrice } from '../utils/price'
import toast from 'react-hot-toast'
import { productsAPI } from '../utils/api'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleCart, getCartCount } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [wishlistUpdate, setWishlistUpdate] = useState(0) // Force re-render for wishlist changes
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const data = await productsAPI.getById(id)
      
      if (data.success) {
        setProduct(data.data)
        // Don't auto-select - force user to choose
        setSelectedSize('')
        setSelectedColor('')
      } else {
        toast.error('Product not found')
        navigate('/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  // Check if all required variants are selected
  const isVariantSelectionComplete = () => {
    if (!product) return false
    
    // If product has sizes, size must be selected
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      return false
    }
    
    // If product has colors, color must be selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      return false
    }
    
    return true
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('This product is out of stock', {
        icon: '⚠️',
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    // Validate required variants
    if (!isVariantSelectionComplete()) {
      const missingVariants = []
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        missingVariants.push('size')
      }
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        missingVariants.push('color')
      }
      
      toast.error(`Please select ${missingVariants.join(' and ')} before adding to cart`, {
        icon: '⚠️',
        style: { background: '#ef4444', color: '#fff' },
        duration: 4000
      })
      return
    }

    // Create product variant object with effective price
    const effectivePrice = getEffectivePrice(product)
    const productVariant = {
      ...product,
      price: effectivePrice, // Use discounted price as the actual price
      originalPrice: product.price, // Keep original price for reference
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null,
      quantity
    }

    addToCart(productVariant, quantity)
  }

  const handleWishlistToggle = () => {
    toggleWishlist(product)
    setWishlistUpdate(prev => prev + 1) // Force re-render
  }

  const images = product?.images && product.images.length > 0 
    ? [product.imageUrl, ...product.images] 
    : [product?.imageUrl].filter(Boolean)

  if (loading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0">
        <NavBar />
        <ShoppingCart />
        <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
        <div className="text-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
          <Link to="/" className="text-black hover:text-gray-700 transition-colors">Home</Link>
          <span className="text-gray-500">›</span>
          <Link to="/products" className="text-black hover:text-gray-700 transition-colors">Products</Link>
          {product.category && (
            <>
              <span className="text-gray-500">›</span>
              <Link to={`/category/${product.category.slug}`} className="text-black hover:text-gray-700 transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="text-gray-500">›</span>
          <span className="text-gray-800 font-semibold">{product.name}</span>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden">
                <img 
                  src={images[selectedImage] || product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.stock === 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                    Out of Stock
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="inline-block bg-gray-100 text-black px-3 py-1 rounded-md text-xs font-semibold uppercase mb-3">
                  {product.category?.name || 'Product'}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
                
                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xl">
                          {i < Math.floor(product.rating) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">({product.numReviews} reviews)</span>
                  </div>
                )}

                <div className="flex items-baseline gap-4 mb-6 flex-wrap">
                  <div className="flex items-baseline gap-3">
                    {hasDiscount(product) ? (
                      <>
                        <span className="text-4xl font-bold text-emerald-600">
                          ${getEffectivePrice(product).toFixed(2)}
                        </span>
                        <span className="text-2xl font-semibold text-gray-400 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                          -{product.discountPercent}%
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-black">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {product.stock > 0 && (
                    <span className="text-green-600 font-semibold">In Stock ({product.stock} available)</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Size <span className="text-red-500">*</span>
                    {selectedSize && <span className="text-gray-500 font-normal">(Selected: {selectedSize})</span>}
                  </label>
                  {!selectedSize && (
                    <p className="text-red-500 text-sm mb-2">Please select a size</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all border-2 ${
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
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Color <span className="text-red-500">*</span>
                    {selectedColor && <span className="text-gray-500 font-normal">(Selected: {selectedColor})</span>}
                  </label>
                  {!selectedColor && (
                    <p className="text-red-500 text-sm mb-2">Please select a color</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    {product.colors.map((color) => {
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
                                ? 'ring-2 ring-offset-2 ring-black scale-110' 
                                : 'ring-1 ring-gray-300 group-hover:ring-2 group-hover:ring-gray-400'
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
                            isSelected ? 'text-black' : 'text-gray-600'
                          }`}>
                            {color}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-bold text-gray-700"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition-all font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              {(product.brand || product.sku || product.weight || product.dimensions) && (
                <div className="border-t-2 border-gray-200 pt-6 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.brand && (
                      <div>
                        <span className="font-semibold text-gray-700">Brand:</span>
                        <span className="ml-2 text-gray-600">{product.brand}</span>
                      </div>
                    )}
                    {product.sku && (
                      <div>
                        <span className="font-semibold text-gray-700">SKU:</span>
                        <span className="ml-2 text-gray-600">{product.sku}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <span className="font-semibold text-gray-700">Weight:</span>
                        <span className="ml-2 text-gray-600">{product.weight}</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div>
                        <span className="font-semibold text-gray-700">Dimensions:</span>
                        <span className="ml-2 text-gray-600">
                          {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-4 rounded-xl border-2 font-semibold transition-all flex items-center justify-center ${
                      isInWishlist(product._id) 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 hover:from-amber-600 hover:to-orange-600' 
                        : 'bg-white text-emerald-700 border-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill={isInWishlist(product._id) ? 'white' : 'none'} 
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || !isVariantSelectionComplete()}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 px-8 rounded-xl hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none text-lg border-none cursor-pointer"
                  >
                    {product.stock === 0 
                      ? 'Out of Stock' 
                      : !isVariantSelectionComplete()
                      ? 'Please Select Options'
                      : `Add to Cart (${quantity})`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {product.relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/product/${relatedProduct._id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-xl transition-all group"
                >
                  <div className="relative w-full aspect-square bg-white overflow-hidden">
                    <img 
                      src={relatedProduct.imageUrl} 
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.stock === 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg font-semibold text-xs">
                        Out of Stock
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block bg-gray-100 text-black px-2 py-0.5 text-xs rounded-md font-semibold uppercase mb-2">
                      {relatedProduct.category?.name || 'Product'}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-black transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      {hasDiscount(relatedProduct) ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg md:text-xl font-bold text-emerald-600">
                            ${getEffectivePrice(relatedProduct).toFixed(2)}
                          </span>
                          <span className="text-sm font-semibold text-gray-400 line-through">
                            ${relatedProduct.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg md:text-xl font-bold text-black">
                          ${relatedProduct.price.toFixed(2)}
                        </span>
                      )}
                      {relatedProduct.stock > 0 && (
                        <span className="text-xs text-green-600 font-semibold">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductDetails

