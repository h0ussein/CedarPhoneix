import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { productsAPI } from '../../utils/api'

const AdminFeaturedProducts = () => {
  const [allProducts, setAllProducts] = useState([])
  const [selectedFeaturedProducts, setSelectedFeaturedProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [savingFeatured, setSavingFeatured] = useState(false)

  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await productsAPI.getAll({ limit: 1000 })
      if (response.success) {
        setAllProducts(response.data)
        // Set initially selected featured products
        const featuredIds = response.data
          .filter(p => p.featured)
          .map(p => p._id)
        setSelectedFeaturedProducts(featuredIds)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleFeaturedToggle = (productId) => {
    setSelectedFeaturedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSaveFeaturedProducts = async () => {
    try {
      setSavingFeatured(true)
      const response = await productsAPI.updateFeatured(selectedFeaturedProducts)
      
      if (response.success) {
        toast.success('Featured products updated successfully!', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' },
          duration: 4000
        })
        // Refresh products to get updated featured status
        fetchAllProducts()
      } else {
        toast.error(response.message || 'Failed to update featured products')
      }
    } catch (error) {
      console.error('Error updating featured products:', error)
      toast.error('Error updating featured products')
    } finally {
      setSavingFeatured(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Featured Products</h1>
          <p className="text-base text-gray-600">Select products to feature on the homepage</p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl shadow-md border-l-4 border-emerald-600">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          {loadingProducts ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading products...</p>
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Products Available</h2>
              <p className="mb-8">Add products first to set them as featured</p>
              <Link to="/admin/products/new" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all no-underline">
                ➕ Add Product
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-700">
                    Selected: <span className="font-bold text-black text-lg">{selectedFeaturedProducts.length}</span> product(s)
                  </p>
                  <button
                    onClick={handleSaveFeaturedProducts}
                    disabled={savingFeatured}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {savingFeatured ? 'Saving...' : '💾 Save Featured Products'}
                  </button>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  <div className="divide-y divide-gray-200">
                    {allProducts.map(product => (
                      <label
                        key={product._id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeaturedProducts.includes(product._id)}
                          onChange={() => handleFeaturedToggle(product._id)}
                          className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                        />
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-lg">{product.name}</p>
                          <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
                          {product.category && (
                            <p className="text-xs text-gray-500 mt-1">Category: {product.category.name}</p>
                          )}
                        </div>
                        {product.featured && (
                          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full">
                            Currently Featured
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Tip:</span> Select products that you want to highlight on the homepage. 
                    Featured products will appear in the "Featured Products" section on the main page.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminFeaturedProducts


