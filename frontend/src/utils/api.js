// API base URL - update this to match your backend
const API_BASE_URL = 'http://localhost:3000/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('cedar_phoenix_user') || '{}')
  return {
    'Content-Type': 'application/json',
    ...(user.token && { Authorization: `Bearer ${user.token}` })
  }
}

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'API request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Products API
export const productsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiCall(`/products?${queryString}`)
  },
  getById: (id) => apiCall(`/products/${id}`),
  getFeatured: () => apiCall('/products/featured'),
  updateFeatured: (productIds) => apiCall('/products/featured/update', {
    method: 'PUT',
    body: JSON.stringify({ productIds })
  }),
  create: (productData) => apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  update: (id, productData) => apiCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  delete: (id) => apiCall(`/products/${id}`, { method: 'DELETE' })
}

// Categories API
export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
  getById: (id) => apiCall(`/categories/${id}`),
  getBySlug: (slug) => apiCall(`/categories/slug/${slug}`),
  create: (categoryData) => apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData)
  }),
  update: (id, categoryData) => apiCall(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData)
  }),
  delete: (id) => apiCall(`/categories/${id}`, { method: 'DELETE' })
}

// Orders API
export const ordersAPI = {
  create: (orderData) => apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  getById: (id) => apiCall(`/orders/${id}`),
  getMyOrders: () => apiCall('/orders/myorders'),
  getAll: () => apiCall('/orders'),
  updateStatus: (id, statusData) => apiCall(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  }),
  delete: (id) => apiCall(`/orders/${id}`, { method: 'DELETE' })
}

// Users API
export const usersAPI = {
  register: (userData) => apiCall('/users/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  login: (credentials) => apiCall('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getProfile: () => apiCall('/users/profile'),
  updateProfile: (userData) => apiCall('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  getAll: () => apiCall('/users'),
  delete: (id) => apiCall(`/users/${id}`, { method: 'DELETE' }),
  updateRole: (id, role) => apiCall(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  })
}

export default {
  products: productsAPI,
  categories: categoriesAPI,
  orders: ordersAPI,
  users: usersAPI
}

