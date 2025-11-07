import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cedar_phoenix_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('cedar_phoenix_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cedar_phoenix_user')
    localStorage.removeItem('cedar_phoenix_cart')
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('cedar_phoenix_user', JSON.stringify(userData))
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isAuthenticated = () => {
    return !!user && !user.isGuest
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

