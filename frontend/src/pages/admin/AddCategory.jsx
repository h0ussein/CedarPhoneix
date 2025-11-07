import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { apiClient } from '../../utils/api'

const AddCategory = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('description', formData.description)
      if (imageFile) fd.append('image', imageFile)

      await apiClient.post('/categories', fd)

      toast.success('Category created successfully!', {
        icon: '✅',
        style: { background: '#10b981', color: '#fff' }
      })
      navigate('/admin/categories')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error creating category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Add New Category</h1>
          <p className="text-base text-gray-600">Create a new product category</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 md:p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Electronics"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe this category..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-y"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-all">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('')
                        setFormData({ ...formData, image: '' })
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all border-none cursor-pointer"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-5xl mb-4">📁</div>
                    <p className="text-gray-600 mb-4">Upload category image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="category-image"
                    />
                    <label
                      htmlFor="category-image"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold cursor-pointer hover:from-emerald-700 hover:to-teal-600 transition-all"
                    >
                      Choose Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {loading ? 'Creating Category...' : '✅ Create Category'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="flex-1 md:flex-none bg-gray-200 text-gray-800 font-bold py-4 px-8 rounded-lg hover:bg-gray-300 transition-all border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AddCategory

