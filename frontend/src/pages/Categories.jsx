import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import ShoppingCart from '../components/ShoppingCart'
import { useCart } from '../context/CartContext'

const Categories = () => {
  const { toggleCart, getCartCount } = useCart()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50">
      <NavBar />
      <ShoppingCart />
      <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Shop by Category</h1>
          <p className="text-lg text-gray-600">Explore our wide range of products</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xl text-gray-500">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {categories.map(category => (
              <Link 
                key={category._id} 
                to={`/category/${category.slug}`} 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:-translate-y-2 hover:shadow-2xl transition-all no-underline text-inherit"
              >
                <div className="relative w-full h-32 sm:h-40 overflow-hidden group bg-gradient-to-br from-blue-500 to-blue-600">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl sm:text-4xl">
                      📁
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/70 via-emerald-800/50 to-transparent flex items-end justify-center px-3 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg transition-all">View Products →</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2 line-clamp-1">{category.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Categories
