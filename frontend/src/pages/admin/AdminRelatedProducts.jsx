import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'

const AdminRelatedProducts = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedRelatedIds, setSelectedRelatedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      // Load the selected product's related products
      setSelectedRelatedIds(selectedProduct.relatedProducts?.map(p => p._id) || [])
    }
  }, [selectedProduct])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products')
      const data = await response.json()
      if (data.success) {
        // Fetch full details for each product to get related products
        const productsWithRelated = await Promise.all(
          data.data.map(async (product) => {
            try {
              const detailResponse = await fetch(`http://localhost:3000/api/products/${product._id}`)
              const detailData = await detailResponse.json()
              return detailData.success ? detailData.data : product
            } catch {
              return product
            }
          })
        )
        setProducts(productsWithRelated)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setSelectedRelatedIds(product.relatedProducts?.map(p => p._id) || [])
  }

  const toggleRelatedProduct = (productId) => {
    if (productId === selectedProduct._id) {
      toast.error('A product cannot be related to itself')
      return
    }
    
    setSelectedRelatedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSave = async () => {
    if (!selectedProduct) return

    setSaving(true)
    try {
      const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      const response = await fetch(`http://localhost:3000/api/products/${selectedProduct._id}/related`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          relatedProductIds: selectedRelatedIds
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Related products updated successfully!', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
        // Refresh products to get updated data
        await fetchProducts()
        // Update selected product
        setSelectedProduct(data.data)
      } else {
        toast.error(data.message || 'Failed to update related products')
      }
    } catch (error) {
      console.error('Error updating related products:', error)
      toast.error('Error updating related products')
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.category?.name?.toLowerCase().includes(query)
    )
  })

  const availableProducts = filteredProducts.filter(p => p._id !== selectedProduct?._id)

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Manage Related Products</h1>
        <p className="text-base text-gray-600">Select a product and choose which products should be shown as related</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Products List */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">All Products</h2>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>

            {/* Products List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products found</p>
              ) : (
                filteredProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedProduct?._id === product._id
                        ? 'border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                        <p className="text-xs opacity-75">
                          {product.category?.name || 'No category'} • ${product.price.toFixed(2)}
                        </p>
                        {product.relatedProducts && product.relatedProducts.length > 0 && (
                          <p className="text-xs opacity-75 mt-1">
                            {product.relatedProducts.length} related product{product.relatedProducts.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Related Products Selection */}
          <div className="bg-white rounded-xl shadow-md p-4">
            {selectedProduct ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Selected Product</h2>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden">
                      <img 
                        src={selectedProduct.imageUrl} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.category?.name || 'No category'} • ${selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Select Related Products ({selectedRelatedIds.length} selected)
                  </h3>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {availableProducts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No other products available</p>
                    ) : (
                      availableProducts.map(product => {
                        const isSelected = selectedRelatedIds.includes(product._id)
                        return (
                          <label
                            key={product._id}
                            className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRelatedProduct(product._id)}
                              className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                            />
                            <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{product.name}</h4>
                              <p className="text-xs text-gray-600">
                                {product.category?.name || 'No category'} • ${product.price.toFixed(2)}
                              </p>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? 'Saving...' : 'Save Related Products'}
                </button>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">👆</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Product</h3>
                <p className="text-gray-600">Choose a product from the list to manage its related products</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminRelatedProducts

