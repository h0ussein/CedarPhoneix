import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { formatPhoneNumber } from '../../utils/phoneUtils'
import { usersAPI } from '../../utils/api'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await usersAPI.getAll()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const data = await usersAPI.updateRole(userId, newRole)
      
      if (data.success) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ))
        toast.success(`User role updated to ${newRole}`, {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
      } else {
        toast.error(data.message || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Error updating user role')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        const data = await usersAPI.delete(userId)
        
        if (data.success) {
          setUsers(users.filter(user => user._id !== userId))
          toast.success('User deleted successfully!', {
            icon: '🗑️',
            style: { background: '#ef4444', color: '#fff' }
          })
          // Refresh the user list to ensure consistency
          await fetchUsers()
        } else {
          toast.error(data.message || 'Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error(error.message || 'Error deleting user')
      }
    }
  }

  const filteredUsers = filter === 'all' ? users : users.filter(user => user.role === filter)

  const getUserStats = () => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      users: users.filter(u => u.role === 'user').length
    }
  }

  const stats = getUserStats()

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Manage Users</h1>
        <p className="text-lg text-gray-600 mb-6">View and manage user accounts</p>
        
        {/* User Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Administrators</p>
                <p className="text-2xl font-bold text-black">{stats.admins}</p>
              </div>
              <div className="text-3xl">👨‍💼</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Regular Users</p>
                <p className="text-2xl font-bold text-amber-600">{stats.users}</p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {['all', 'admin', 'user'].map(role => (
            <button 
              key={role}
              onClick={() => setFilter(role)} 
              className={`px-5 py-2.5 border-2 rounded-lg font-semibold cursor-pointer transition-all ${
                filter === role 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-600 hover:text-emerald-700'
              }`}
            >
              {role === 'all' ? 'All Users' : `${role.charAt(0).toUpperCase() + role.slice(1)}s`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No {filter === 'all' ? '' : filter} Users</h2>
          <p className="text-gray-600">Users will appear here when they register</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">User</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">Email</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">Phone</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">Role</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">Joined</th>
                  <th className="text-left p-4 text-gray-600 font-semibold text-sm uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">ID: {user._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-gray-600">{formatPhoneNumber(user.phone)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${
                        user.role === 'admin' ? 'bg-gray-100 text-gray-800' :
                        user.role === 'user' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="px-3 py-2 bg-white border-2 border-gray-200 text-gray-800 rounded-md text-sm font-semibold cursor-pointer transition-all focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-2 text-black hover:bg-gray-50 rounded-lg transition-colors border-none cursor-pointer"
                          title="Delete User"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
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

export default AdminUsers
