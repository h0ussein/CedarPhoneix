import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'

const AdminCategories = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories/admin/all', {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"? This will affect all products in this category.`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
          }
        })

        const data = await response.json()

        if (response.ok) {
          setCategories(categories.filter(c => c._id !== categoryId))
          toast.success('Category deleted successfully!', {
            icon: '🗑️',
            style: { background: '#ef4444', color: '#fff' }
          })
        } else {
          toast.error(data.message || 'Failed to delete category')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        toast.error('Error deleting category')
      }
    }
  }

  const handleEdit = (categoryId) => {
    navigate(`/admin/categories/edit/${categoryId}`)
  }

  const handleToggleVisibility = async (categoryId, currentVisibility) => {
    try {
      const response = await fetch(`http://localhost:3000/api/categories/${categoryId}/visibility`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('cedar_phoenix_user'))?.token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the category in the list
        setCategories(categories.map(c => 
          c._id === categoryId ? { ...c, isActive: !currentVisibility } : c
        ))
        toast.success(data.message || `Category ${!currentVisibility ? 'shown' : 'hidden'} successfully!`, {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
      } else {
        toast.error(data.message || 'Failed to toggle category visibility')
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Error toggling category visibility')
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Manage Categories</h1>
          <p className="text-base text-gray-600">Organize your products into categories</p>
        </div>
        <Link to="/admin/categories/new" className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline w-full md:w-auto justify-center text-sm">
          <span>➕</span> Add New Category
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-5xl mb-3">📁</div>
          <h2 className="text-xl font-bold text-gray-800 mb-3">No Categories Yet</h2>
          <p className="text-gray-600 mb-6 text-sm">Start by adding your first category</p>
          <Link to="/admin/categories/new" className="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all no-underline text-sm">
            ➕ Add Category
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
              {category.image && (
                <div className="relative h-28 overflow-hidden">
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <h3 className="text-base font-bold text-gray-800 mb-1.5">{category.name}</h3>
                <p className="text-gray-600 text-xs mb-1">
                  <span className="font-semibold">Slug:</span> {category.slug}
                </p>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2">{category.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Hidden'}
                  </span>
                  
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={() => handleEdit(category._id)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-500 border-none cursor-pointer text-white px-2 py-1 rounded-md hover:from-emerald-700 hover:to-teal-600 transition-all text-xs font-medium"
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleToggleVisibility(category._id, category.isActive)} 
                      className={`border-none cursor-pointer text-white px-2 py-1 rounded-md transition-all text-xs font-medium ${
                        category.isActive
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      title={category.isActive ? 'Hide category' : 'Show category'}
                    >
                      {category.isActive ? '👁️‍🗨️ Hide' : '👁️ Show'}
                    </button>
                    <button 
                      onClick={() => handleDelete(category._id, category.name)}
                      className="bg-gradient-to-r from-red-500 to-orange-500 border-none cursor-pointer text-white px-2 py-1 rounded-md hover:from-red-600 hover:to-orange-600 transition-all text-xs font-medium"
                      title="Delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCategories

