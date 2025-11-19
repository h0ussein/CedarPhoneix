import axios from 'axios'

// API base URL - update this to match your backend
const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3001/api" : "/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    try {
      const userStr = localStorage.getItem('cedar_phoenix_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`
        }
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
    }
    
    // Remove Content-Type header for FormData (axios will set it automatically with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      params: options.params,
      headers: options.headers
    })
    return response
  } catch (error) {
    throw error
  }
}

// Products API
export const productsAPI = {
  getAll: (params = {}) => {
    return apiCall('/products', { params })
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
  delete: (id) => apiCall(`/products/${id}`, { method: 'DELETE' }),
  updateVisibility: (id, isVisible) => apiCall(`/products/${id}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ isVisible })
  }),
  getRelated: (id) => apiCall(`/products/${id}/related`),
  updateRelated: (id, relatedProductIds) => apiCall(`/products/${id}/related`, {
    method: 'PUT',
    body: JSON.stringify({ relatedProductIds })
  })
}

// Categories API
export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
  getAllAdmin: () => apiCall('/categories/admin/all'),
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
  delete: (id) => apiCall(`/categories/${id}`, { method: 'DELETE' }),
  updateVisibility: (id, isVisible) => apiCall(`/categories/${id}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ isVisible })
  })
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

// Settings API
export const settingsAPI = {
  getDeliveryPrice: () => apiCall('/settings/delivery-price'),
  getSettings: () => apiCall('/settings'),
  updateDeliveryPrice: (price, applyToAll = false) => apiCall('/settings/delivery-price', {
    method: 'PUT',
    body: JSON.stringify({ defaultDeliveryPrice: price, applyToAll })
  })
}

// Profit API
export const profitAPI = {
  getStats: (params = {}) => apiCall('/profit/stats', { params }),
  getProductsWithCost: () => apiCall('/profit/products'),
  updateProductCostPrice: (id, costPrice) => apiCall(`/profit/products/${id}/cost`, {
    method: 'PUT',
    body: JSON.stringify({ costPrice })
  }),
  bulkUpdateCostPrices: (updates) => apiCall('/profit/products/bulk-cost', {
    method: 'PUT',
    body: JSON.stringify({ updates })
  })
}

// Inventory Purchases API
export const inventoryPurchasesAPI = {
  getAll: (params = {}) => apiCall('/inventory-purchases', { params }),
  create: (data) => apiCall('/inventory-purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiCall(`/inventory-purchases/${id}`, { method: 'DELETE' }),
  update: (id, data) => apiCall(`/inventory-purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// Export apiClient for direct use (e.g., FormData uploads)
export { apiClient }

export default {
  products: productsAPI,
  categories: categoriesAPI,
  orders: ordersAPI,
  users: usersAPI,
  settings: settingsAPI,
  profit: profitAPI,
  inventoryPurchases: inventoryPurchasesAPI
}

