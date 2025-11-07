import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { removeFromWishlistSilent } from '../../utils/wishlist'
import { getEffectivePrice, hasDiscount } from '../../utils/price'

const AdminProducts = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let url = 'http://localhost:3000/api/products'
      
      // Add category filter if a specific category is selected
      if (selectedCategory !== 'all') {
        url += `?category=${selectedCategory}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          setProducts(products.filter(p => p._id !== productId))
          // Remove product from wishlist if it exists there
          removeFromWishlistSilent(productId)
          toast.success('Product deleted successfully!', {
            icon: '🗑️',
            style: { background: '#ef4444', color: '#fff' }
          })
        } else {
          toast.error(data.message || 'Failed to delete product')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        toast.error('Error deleting product')
      }
    }
  }

  const handleEdit = (productId) => {
    navigate(`/admin/products/edit/${productId}`)
  }

  const handleToggleVisibility = async (productId, currentVisibility) => {
    try {
      const token = JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token
      const response = await fetch(`http://localhost:3000/api/products/${productId}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the product in the list
        setProducts(products.map(p => 
          p._id === productId ? { ...p, isHidden: !currentVisibility } : p
        ))
        toast.success(data.message || `Product ${!currentVisibility ? 'hidden' : 'shown'} successfully!`, {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
      } else {
        toast.error(data.message || 'Failed to toggle product visibility')
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Error toggling product visibility')
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Manage Products</h1>
          <p className="text-base text-gray-600">Add, edit, or remove products from your store</p>
        </div>
        <Link to="/admin/products/new" className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline w-full md:w-auto justify-center">
          <span>➕</span> Add New Product
        </Link>
      </div>

      {/* Category Filter */}
      <div className="mb-5 bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Filter by Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:max-w-xs px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-base font-medium bg-white"
          >
            <option value="all">📦 All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {selectedCategory !== 'all' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold">
                Showing {products.length} product{products.length !== 1 ? 's' : ''} in "{categories.find(c => c._id === selectedCategory)?.name || 'Category'}"
              </span>
            </div>
          )}
        </div>
      </div>

      {loading || loadingCategories ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedCategory !== 'all' 
              ? `No Products in "${categories.find(c => c._id === selectedCategory)?.name || 'this category'}"`
              : 'No Products Yet'}
          </h2>
          <p className="text-gray-600 mb-8">
            {selectedCategory !== 'all' 
              ? 'Try selecting a different category or add products to this category'
              : 'Start by adding your first product'}
          </p>
          <Link to="/admin/products/new" className="inline-block px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all no-underline">
            ➕ Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Image</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Name</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Category</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Price</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Discount</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Stock</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Status</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="p-2">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-2 font-semibold text-gray-800 text-sm">{product.name}</td>
                    <td className="p-2 text-gray-600 text-sm">{product.category?.name || 'N/A'}</td>
                    <td className="p-2">
                      {hasDiscount(product) ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-emerald-600 text-sm">
                            ${getEffectivePrice(product).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-blue-600 text-sm">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {hasDiscount(product) ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          -{product.discountPercent}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No discount</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        product.stock < 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        product.isHidden 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.isHidden ? '👁️‍🗨️ Hidden' : '👁️ Visible'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1.5 flex-wrap">
                        <button 
                          onClick={() => handleEdit(product._id)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-500 border-none cursor-pointer text-white px-2 py-1 rounded-md hover:from-emerald-700 hover:to-teal-600 transition-all text-xs font-medium" 
                          title="Edit"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleToggleVisibility(product._id, product.isHidden)} 
                          className={`border-none cursor-pointer text-white px-2 py-1 rounded-md transition-all text-xs font-medium ${
                            product.isHidden
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                          title={product.isHidden ? 'Show product' : 'Hide product'}
                        >
                          {product.isHidden ? '👁️ Show' : '👁️‍🗨️ Hide'}
                        </button>
                        <button 
                          onClick={() => handleDelete(product._id, product.name)} 
                          className="bg-gradient-to-r from-red-500 to-orange-500 border-none cursor-pointer text-white px-2 py-1 rounded-md hover:from-red-600 hover:to-orange-600 transition-all text-xs font-medium" 
                          title="Delete"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminProducts
