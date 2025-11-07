import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { categoriesAPI, productsAPI, apiClient } from '../../utils/api'

const EditProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: '',
    featured: false,
    sizes: [],
    colors: [],
    brand: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    discountPercent: ''
  })
  const [sizeInput, setSizeInput] = useState('')
  const [colorInput, setColorInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingProduct, setFetchingProduct] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchProduct()
  }, [id])

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

  const fetchProduct = async () => {
    try {
      const data = await productsAPI.getById(id)
      if (data.success) {
        const product = data.data
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category._id || product.category,
          stock: String(product.stock || 0),
          imageUrl: product.imageUrl,
          featured: product.featured || false,
          sizes: product.sizes || [],
          colors: product.colors || [],
          brand: product.brand || '',
          sku: product.sku || '',
          weight: product.weight || '',
          dimensions: product.dimensions || { length: '', width: '', height: '' },
          discountPercent: product.discountPercent || ''
        })
        setImagePreview(product.imageUrl)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setFetchingProduct(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('dimensions.')) {
      const dimField = name.split('.')[1]
      setFormData({
        ...formData,
        dimensions: {
          ...formData.dimensions,
          [dimField]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }
  }

  const handleAddSize = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
      setFormData({
        ...formData,
        sizes: [...formData.sizes, sizeInput.trim()]
      })
      setSizeInput('')
    }
  }

  const handleRemoveSize = (size) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter(s => s !== size)
    })
  }

  const handleAddColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData({
        ...formData,
        colors: [...formData.colors, colorInput.trim()]
      })
      setColorInput('')
    }
  }

  const handleRemoveColor = (color) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter(c => c !== color)
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
      fd.append('price', String(parseFloat(formData.price)))
      fd.append('category', formData.category)
      fd.append('stock', String(Math.max(0, parseInt(formData.stock, 10) || 0)))
      fd.append('featured', String(formData.featured))
      if (formData.discountPercent) {
        fd.append('discountPercent', String(parseFloat(formData.discountPercent)))
      } else {
        fd.append('discountPercent', '0')
      }
      if (formData.sizes.length > 0) {
        fd.append('sizes', JSON.stringify(formData.sizes))
      }
      if (formData.colors.length > 0) {
        fd.append('colors', JSON.stringify(formData.colors))
      }
      if (formData.brand) fd.append('brand', formData.brand)
      if (formData.sku) fd.append('sku', formData.sku)
      if (formData.weight) fd.append('weight', formData.weight)
      if (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) {
        const dims = {}
        if (formData.dimensions.length) dims.length = formData.dimensions.length
        if (formData.dimensions.width) dims.width = formData.dimensions.width
        if (formData.dimensions.height) dims.height = formData.dimensions.height
        if (Object.keys(dims).length > 0) {
          fd.append('dimensions', JSON.stringify(dims))
        }
      }
      if (imageFile) {
        fd.append('image', imageFile)
      }

      await apiClient.put(`/products/${id}`, fd)

      toast.success('Product updated successfully!', {
        icon: '✅',
        style: { background: '#10b981', color: '#fff' }
      })
      navigate('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Error updating product')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingProduct) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Edit Product</h1>
          <p className="text-base text-gray-600">Update product information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-y"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%) (Optional)</label>
              <input
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <p className="text-xs text-gray-500 mt-1">Enter discount percentage (0-100)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 appearance-none bg-white"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Update Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-all">
                {imagePreview && (
                  <div className="space-y-4">
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    <div className="flex gap-3 justify-center">
                      <label
                        htmlFor="image-upload-edit"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg hover:from-emerald-700 hover:to-teal-600 transition-all cursor-pointer"
                      >
                        Change Image
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('')
                          setImageFile(null)
                          setFormData({ ...formData, imageUrl: '' })
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all border-none cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-edit"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sizes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sizes (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                  placeholder="e.g. S, M, L, XL"
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all border-none cursor-pointer"
                >
                  Add
                </button>
              </div>
              {formData.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 text-black px-3 py-1 rounded-lg text-sm font-semibold">
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(size)}
                        className="text-black hover:text-gray-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Colors (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                  placeholder="e.g. Red, Blue, Black"
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all border-none cursor-pointer"
                >
                  Add
                </button>
              </div>
              {formData.colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((color, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 text-black px-3 py-1 rounded-lg text-sm font-semibold">
                      {color}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="text-black hover:text-gray-700 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Brand (Optional)</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Nike, Apple"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SKU (Optional)</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. PROD-001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (Optional)</label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="e.g. 500g, 1.5kg"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Dimensions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensions (Optional)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleChange}
                    placeholder="Length"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                    placeholder="Width"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                    placeholder="Height"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
            </div>

            {/* Featured */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 text-black rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">Mark as Featured Product</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t-2 border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-4 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {loading ? 'Updating Product...' : '💾 Update Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
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

export default EditProduct

