import React, { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, ShoppingBag, Users, TrendingUp, Package, Eye, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AnalyticsData {
  overview: {
    totalRevenue: string
    totalOrders: number
    uniqueCustomers: number
    avgOrderValue: string
    conversionRate: string
  }
  ordersByStatus: { [key: string]: number }
  bestSellers: Array<{
    product_id: string
    product_name: string
    total_quantity: number
    total_revenue: number
  }>
  dailyRevenue: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topSpenders: Array<{
    customerId: string
    spending: number
  }>
  timeframe: string
  generatedAt: string
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30days')
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [timeframe])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error: analyticsError } = await supabase.functions.invoke('analytics-dashboard', {
        body: { timeframe }
      })

      if (analyticsError) {
        throw new Error(analyticsError.message)
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      setAnalytics(data.data)
    } catch (error: any) {
      console.error('Error loading analytics:', error)
      setError(error.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-stone-900 mb-4">Access Denied</h1>
          <p className="text-stone-600">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-stone-200 rounded-lg p-6 h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-stone-200 rounded-lg h-64" />
            <div className="bg-stone-200 rounded-lg h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const COLORS = ['#0C0A09', '#57534E', '#A8A29E', '#D6D3D1']

  const orderStatusData = analytics?.ordersByStatus ? Object.entries(analytics.ordersByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  })) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-stone-900 mb-2">Admin Dashboard</h1>
          <p className="text-stone-600">Comprehensive analytics and store management</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">${analytics?.overview.totalRevenue || '0.00'}</div>
          <div className="text-sm text-stone-500">Total Revenue</div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{analytics?.overview.totalOrders || 0}</div>
          <div className="text-sm text-stone-500">Total Orders</div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{analytics?.overview.uniqueCustomers || 0}</div>
          <div className="text-sm text-stone-500">Unique Customers</div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">${analytics?.overview.avgOrderValue || '0.00'}</div>
          <div className="text-sm text-stone-500">Avg Order Value</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Daily Revenue
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis 
                  dataKey="date" 
                  stroke="#57534e"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#57534e" fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0c0a09" 
                  strokeWidth={2}
                  dot={{ fill: '#0c0a09', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Order Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Sellers and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Best Sellers */}
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Best Selling Products
          </h3>
          {analytics?.bestSellers && analytics.bestSellers.length > 0 ? (
            <div className="space-y-3">
              {analytics.bestSellers.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">{product.product_name}</div>
                      <div className="text-sm text-stone-500">{product.total_quantity} sold</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-stone-900">
                    ${product.total_revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">
              No sales data available
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Top Customers
          </h3>
          {analytics?.topSpenders && analytics.topSpenders.length > 0 ? (
            <div className="space-y-3">
              {analytics.topSpenders.slice(0, 5).map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-stone-900 truncate max-w-32">
                        {customer.customerId.length > 20 
                          ? `${customer.customerId.substring(0, 20)}...` 
                          : customer.customerId
                        }
                      </div>
                      <div className="text-sm text-stone-500">Customer ID</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-stone-900">
                    ${customer.spending.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">
              No customer data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 border border-stone-200 shadow-sm">
        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Analytics Summary
        </h3>
        <div className="text-sm text-stone-600">
          <p className="mb-2">
            <strong>Timeframe:</strong> {timeframe === '7days' ? 'Last 7 Days' : 
                                        timeframe === '30days' ? 'Last 30 Days' : 
                                        timeframe === '90days' ? 'Last 90 Days' : 'Last Year'}
          </p>
          <p className="mb-2">
            <strong>Conversion Rate:</strong> {analytics?.overview.conversionRate}%
          </p>
          <p>
            <strong>Last Updated:</strong> {analytics?.generatedAt ? 
              new Date(analytics.generatedAt).toLocaleString() : 'N/A'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard