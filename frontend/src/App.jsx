import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import Home from './pages/Home'
import Products from './pages/Products'
import Contact from './pages/Contact'
import Checkout from './pages/Checkout'
import Categories from './pages/Categories'
import CategoryProducts from './pages/CategoryProducts'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import MyOrders from './pages/MyOrders'
import Wishlist from './pages/Wishlist'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCategories from './pages/admin/AdminCategories'
import AdminUsers from './pages/admin/AdminUsers'
import AdminFeaturedProducts from './pages/admin/AdminFeaturedProducts'
import AdminRelatedProducts from './pages/admin/AdminRelatedProducts'
import AddProduct from './pages/admin/AddProduct'
import EditProduct from './pages/admin/EditProduct'
import AddCategory from './pages/admin/AddCategory'
import EditCategory from './pages/admin/EditCategory'

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              fontSize: '15px',
              fontWeight: '600',
              background: '#fff',
              color: '#1f2937',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#ecfdf5',
                color: '#065f46',
                border: '2px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '2px solid #ef4444',
              },
            },
          }}
        />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={<Home />} />
            <Route path='/products' element={<Products />} />
            <Route path='/product/:id' element={<ProductDetails />} />
            <Route path='/categories' element={<Categories />} />
            <Route path='/category/:slug' element={<CategoryProducts />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/checkout' element={<Checkout />} />
            
            {/* User Auth Routes */}
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/account' element={<Account />} />
            <Route path='/orders' element={<MyOrders />} />
            <Route path='/wishlist' element={<Wishlist />} />
            
            {/* Admin Login (Public) */}
            <Route path='/admin' element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route path='/admin/dashboard' element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path='/admin/products' element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
            <Route path='/admin/products/new' element={<ProtectedAdminRoute><AddProduct /></ProtectedAdminRoute>} />
            <Route path='/admin/products/edit/:id' element={<ProtectedAdminRoute><EditProduct /></ProtectedAdminRoute>} />
            <Route path='/admin/categories' element={<ProtectedAdminRoute><AdminCategories /></ProtectedAdminRoute>} />
            <Route path='/admin/categories/new' element={<ProtectedAdminRoute><AddCategory /></ProtectedAdminRoute>} />
            <Route path='/admin/featured-products' element={<ProtectedAdminRoute><AdminFeaturedProducts /></ProtectedAdminRoute>} />
            <Route path='/admin/related-products' element={<ProtectedAdminRoute><AdminRelatedProducts /></ProtectedAdminRoute>} />
            <Route path='/admin/categories/edit/:id' element={<ProtectedAdminRoute><EditCategory /></ProtectedAdminRoute>} />
            <Route path='/admin/orders' element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
            <Route path='/admin/users' element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
