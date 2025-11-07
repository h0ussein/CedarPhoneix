import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default ProtectedAdminRoute

