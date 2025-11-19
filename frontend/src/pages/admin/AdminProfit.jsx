import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/AdminLayout'
import { profitAPI, inventoryPurchasesAPI } from '../../utils/api'

const AdminProfit = () => {
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [inventoryPurchases, setInventoryPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [costPriceInput, setCostPriceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    note: ''
  })
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedPeriod, setSelectedPeriod] = useState('allTime')

  useEffect(() => {
    fetchProducts()
    fetchInventoryPurchases()
  }, [])

  useEffect(() => {
    fetchStats()
    fetchInventoryPurchases()
  }, [dateFilter, selectedPeriod])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      
      // Use period if selected, otherwise use date filter
      if (selectedPeriod && selectedPeriod !== 'custom') {
        params.period = selectedPeriod
      } else {
        if (dateFilter.startDate) params.startDate = dateFilter.startDate
        if (dateFilter.endDate) params.endDate = dateFilter.endDate
      }
      
      const data = await profitAPI.getStats(params)
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching profit stats:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('Network Error') || errorMessage.includes('CONNECTION_REFUSED')) {
        setError('Backend server is not running. Please start the backend server on port 3001.')
      } else {
        setError(`Failed to load profit statistics: ${errorMessage}`)
      }
      toast.error('Failed to load profit statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const data = await profitAPI.getProductsWithCost()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      const errorMessage = err.message || 'Unknown error'
      if (errorMessage.includes('Network Error') || errorMessage.includes('CONNECTION_REFUSED')) {
        // Don't show duplicate error toast if backend is down (error state already set)
        // The error state will be shown in the UI
      } else {
        toast.error('Failed to load products')
      }
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleEditCostPrice = (product) => {
    setEditingProductId(product._id)
    setCostPriceInput(product.costPrice.toString())
  }

  const handleSaveCostPrice = async (productId) => {
    const costPrice = parseFloat(costPriceInput)
    if (isNaN(costPrice) || costPrice < 0) {
      toast.error('Please enter a valid cost price', {
        icon: '❌',
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSaving(true)
    try {
      const data = await profitAPI.updateProductCostPrice(productId, costPrice)
      if (data.success) {
        toast.success('Cost price updated successfully!', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
        setEditingProductId(null)
        setCostPriceInput('')
        fetchProducts()
        fetchStats() // Refresh stats to reflect new profit calculations
      }
    } catch (error) {
      console.error('Error updating cost price:', error)
      toast.error(error.message || 'Failed to update cost price')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setCostPriceInput('')
  }

  const handleBulkUpdate = async () => {
    // This would allow bulk editing - for now, we'll keep it simple
    toast.info('Use individual edit buttons to update cost prices', {
      icon: 'ℹ️',
      style: { background: '#3b82f6', color: '#fff' }
    })
  }

  const fetchInventoryPurchases = async () => {
    try {
      setLoadingPurchases(true)
      const params = {}
      if (selectedPeriod && selectedPeriod !== 'custom') {
        if (selectedPeriod === 'lastWeek') {
          const lastWeek = new Date()
          lastWeek.setDate(lastWeek.getDate() - 7)
          params.startDate = lastWeek.toISOString().split('T')[0]
        } else if (selectedPeriod === 'lastMonth') {
          const lastMonth = new Date()
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          params.startDate = lastMonth.toISOString().split('T')[0]
        } else if (selectedPeriod === 'lastYear') {
          const lastYear = new Date()
          lastYear.setFullYear(lastYear.getFullYear() - 1)
          params.startDate = lastYear.toISOString().split('T')[0]
        }
      } else {
        if (dateFilter.startDate) params.startDate = dateFilter.startDate
        if (dateFilter.endDate) params.endDate = dateFilter.endDate
      }
      
      const data = await inventoryPurchasesAPI.getAll(params)
      if (data.success) {
        setInventoryPurchases(data.data)
      }
    } catch (error) {
      console.error('Error fetching inventory purchases:', error)
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handleAddPurchase = async (e) => {
    e.preventDefault()
    const amount = parseFloat(purchaseForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount', {
        icon: '❌',
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSaving(true)
    try {
      const data = await inventoryPurchasesAPI.create(purchaseForm)
      if (data.success) {
        toast.success('Inventory purchase added successfully!', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
        setPurchaseForm({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          supplier: '',
          note: ''
        })
        setShowPurchaseForm(false)
        fetchInventoryPurchases()
        fetchStats() // Refresh stats to update net profit
      }
    } catch (error) {
      console.error('Error adding purchase:', error)
      toast.error(error.message || 'Failed to add purchase')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) {
      return
    }

    try {
      const data = await inventoryPurchasesAPI.delete(id)
      if (data.success) {
        toast.success('Purchase deleted successfully!', {
          icon: '✅',
          style: { background: '#10b981', color: '#fff' }
        })
        fetchInventoryPurchases()
        fetchStats() // Refresh stats to update net profit
      }
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast.error(error.message || 'Failed to delete purchase')
    }
  }

  const totalPurchases = inventoryPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
  const netProfit = stats ? (stats.totalProfit - totalPurchases) : 0

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Profit Management</h1>
        <p className="text-base text-gray-600">View profit statistics and manage product cost prices</p>
      </div>

      {/* Period Selection */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Select Time Period</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { value: 'allTime', label: 'All Time' },
            { value: 'lastWeek', label: 'Last Week' },
            { value: 'lastMonth', label: 'Last Month' },
            { value: 'lastYear', label: 'Last Year' },
            { value: 'custom', label: 'Custom Range' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => {
                setSelectedPeriod(period.value)
                if (period.value !== 'custom') {
                  setDateFilter({ startDate: '', endDate: '' })
                }
              }}
              className={`px-5 py-2.5 border-2 rounded-lg font-semibold cursor-pointer transition-all ${
                selectedPeriod === period.value
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-600 hover:text-emerald-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range (only show when custom is selected) */}
        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Period Comparison Cards */}
      {stats && stats.periods && (
        <div className="bg-white p-4 rounded-xl shadow-md mb-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Profit by Time Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Week</h3>
              <p className="text-2xl font-bold text-gray-800">${stats.periods.lastWeek.totalProfit.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.periods.lastWeek.totalOrders} orders</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Month</h3>
              <p className="text-2xl font-bold text-gray-800">${stats.periods.lastMonth.totalProfit.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.periods.lastMonth.totalOrders} orders</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Year</h3>
              <p className="text-2xl font-bold text-gray-800">${stats.periods.lastYear.totalProfit.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.periods.lastYear.totalOrders} orders</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">All Time</h3>
              <p className="text-2xl font-bold text-gray-800">${stats.periods.allTime.totalProfit.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.periods.allTime.totalOrders} orders</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-5">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-800 font-bold mb-1">Connection Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">
                To start the backend server, run: <code className="bg-red-100 px-2 py-1 rounded">cd backend && npm run dev</code>
              </p>
            </div>
            <button
              onClick={() => {
                setError(null)
                fetchStats()
              }}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Profit Statistics */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profit statistics...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="bg-white p-4 rounded-xl border-l-4 border-blue-600 hover:shadow-xl transition-all shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💰</div>
              <div className="flex-1">
                <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-800 m-0">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border-l-4 border-red-600 hover:shadow-xl transition-all shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📦</div>
              <div className="flex-1">
                <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Cost</h3>
                <p className="text-2xl font-bold text-gray-800 m-0">${stats.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border-l-4 border-green-600 hover:shadow-xl transition-all shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📈</div>
              <div className="flex-1">
                <h3 className="text-xs text-gray-600 font-semibold mb-1">Total Profit</h3>
                <p className="text-2xl font-bold text-gray-800 m-0">${stats.totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border-l-4 border-purple-600 hover:shadow-xl transition-all shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📊</div>
              <div className="flex-1">
                <h3 className="text-xs text-gray-600 font-semibold mb-1">Profit Margin</h3>
                <p className="text-2xl font-bold text-gray-800 m-0">{stats.profitMargin}%</p>
              </div>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-l-4 border-orange-600 hover:shadow-xl transition-all shadow-md">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💵</div>
              <div className="flex-1">
                <h3 className="text-xs text-gray-600 font-semibold mb-1">Net Profit</h3>
                <p className={`text-2xl font-bold m-0 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netProfit.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (After inventory purchases)
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Items Sold</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalItemsSold}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Average Profit per Order</h3>
            <p className="text-3xl font-bold text-gray-800">
              ${stats.totalOrders > 0 ? (stats.totalProfit / stats.totalOrders).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Inventory Purchases Section */}
      <div className="bg-white p-4 md:p-5 rounded-xl shadow-md mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Inventory Purchases</h2>
          <button
            onClick={() => setShowPurchaseForm(!showPurchaseForm)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
          >
            {showPurchaseForm ? '✕ Cancel' : '+ Add Purchase'}
          </button>
        </div>

        {/* Add Purchase Form */}
        {showPurchaseForm && (
          <form onSubmit={handleAddPurchase} className="bg-gray-50 p-4 rounded-lg mb-4 border-2 border-emerald-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={purchaseForm.amount}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                  placeholder="1000.00"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.date}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={purchaseForm.supplier}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                  placeholder="Supplier name"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                <input
                  type="text"
                  value={purchaseForm.note}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                  placeholder="Additional notes"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Purchase'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPurchaseForm(false)
                  setPurchaseForm({
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    supplier: '',
                    note: ''
                  })
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Total Purchases Summary */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg mb-4 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Total Inventory Purchases</h3>
              <p className="text-3xl font-bold text-red-600">${totalPurchases.toFixed(2)}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        {/* Purchases List */}
        {loadingPurchases ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : inventoryPurchases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No inventory purchases recorded for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Date</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Supplier</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Amount</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Note</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryPurchases.map(purchase => (
                  <tr key={purchase._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-2 text-gray-800 text-sm">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-gray-600 text-sm">{purchase.supplier || '-'}</td>
                    <td className="p-2 font-bold text-red-600 text-sm">${purchase.amount.toFixed(2)}</td>
                    <td className="p-2 text-gray-600 text-sm">{purchase.note || '-'}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeletePurchase(purchase._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                        title="Delete purchase"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Products by Profit */}
      {stats && stats.topProducts && stats.topProducts.length > 0 && (
        <div className="bg-white p-4 md:p-5 rounded-xl shadow-md mb-5">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Products by Profit</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Product</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Quantity Sold</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Revenue</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Cost</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-2 font-semibold text-gray-800 text-sm">{product.productName}</td>
                    <td className="p-2 text-gray-600 text-sm">{product.quantity}</td>
                    <td className="p-2 text-gray-600 text-sm">${product.revenue.toFixed(2)}</td>
                    <td className="p-2 text-gray-600 text-sm">${product.cost.toFixed(2)}</td>
                    <td className="p-2 font-bold text-green-600 text-sm">${product.profit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Products with Cost Prices */}
      <div className="bg-white p-4 md:p-5 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Manage Product Cost Prices</h2>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {loadingProducts ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Products Available</h3>
            <p>Add products first to manage their cost prices</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Product</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Selling Price</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Cost Price</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Profit</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Margin</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Stock</th>
                  <th className="text-left p-2 text-gray-600 font-semibold text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category?.name || 'No category'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 font-semibold text-gray-800 text-sm">${product.sellingPrice.toFixed(2)}</td>
                    <td className="p-2">
                      {editingProductId === product._id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">$</span>
                          <input
                            type="number"
                            value={costPriceInput}
                            onChange={(e) => setCostPriceInput(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border-2 border-emerald-600 rounded text-sm font-semibold focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCostPrice(product._id)}
                            disabled={saving}
                            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-xs font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors disabled:bg-gray-400"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-300"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800 text-sm">
                          ${product.costPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className={`font-semibold text-sm ${
                        product.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${product.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`text-sm font-semibold ${
                        parseFloat(product.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.profitMargin}%
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        product.stock < 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-2">
                      {editingProductId !== product._id && (
                        <button
                          onClick={() => handleEditCostPrice(product)}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded text-xs font-semibold hover:from-emerald-700 hover:to-teal-600 transition-colors"
                          title="Edit cost price"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminProfit

