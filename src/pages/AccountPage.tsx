import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { User, Package, Heart, Settings, Download, FileText, Calendar, ExternalLink, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Order, supabase } from '@/lib/supabase'

interface DownloadToken {
  id: number
  token: string
  order_id: number
  product_id: string
  product_name: string
  expires_at: string
  download_count: number
  max_downloads: number
  created_at: string
}

const AccountPage = () => {
  const { user, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'
  const showSuccess = searchParams.get('success') === 'true'
  
  const [orders, setOrders] = useState<Order[]>([])
  const [downloadTokens, setDownloadTokens] = useState<DownloadToken[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && (activeTab === 'orders' || activeTab === 'downloads')) {
      loadOrders()
      if (activeTab === 'downloads') {
        loadDownloadTokens()
      }
    }
  }, [user, activeTab])

  const loadOrders = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDownloadTokens = async () => {
    if (!user) return
    
    try {
      // Get all download tokens for user's completed orders
      const { data: completedOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
      
      if (ordersError) throw ordersError
      
      if (completedOrders && completedOrders.length > 0) {
        const orderIds = completedOrders.map(order => order.id)
        
        const { data: tokens, error: tokensError } = await supabase
          .from('download_tokens')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false })
        
        if (tokensError) throw tokensError
        setDownloadTokens(tokens || [])
      }
    } catch (error) {
      console.error('Error loading download tokens:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      case 'shipped':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const completedOrders = orders.filter(order => order.status === 'completed')
  const isTokenExpired = (expiresAt: string) => new Date(expiresAt) < new Date()
  const getDownloadsRemaining = (token: DownloadToken) => token.max_downloads - token.download_count

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-stone-900 mb-4">Please Sign In</h1>
          <p className="text-stone-600 mb-8">You need to be signed in to view your account.</p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-stone-900 mb-8">My Account</h1>
      
      {showSuccess && activeTab === 'downloads' && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span><strong>Purchase Successful!</strong> Your digital downloads are ready below.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {[
              { key: 'profile', label: 'Profile', icon: User },
              { key: 'orders', label: 'Orders', icon: Package },
              { key: 'downloads', label: 'Downloads', icon: Download },
              { key: 'favorites', label: 'Favorites', icon: Heart },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  to={`/account?tab=${item.key}`}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.key
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.key === 'downloads' && downloadTokens.length > 0 && (
                    <span className="ml-auto bg-green-600 text-white text-xs rounded-full px-2 py-1">
                      {downloadTokens.length}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg p-6 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <div className="text-stone-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Member Since</label>
                  <div className="text-stone-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={signOut}
                    className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg p-6 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Order History</h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border border-stone-200 rounded-lg p-4">
                      <div className="bg-stone-200 h-4 rounded w-1/4 mb-2" />
                      <div className="bg-stone-200 h-4 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500">No orders yet</p>
                  <Link
                    to="/products"
                    className="inline-block mt-4 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-stone-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-stone-900">Order #{order.id}</div>
                          <div className="text-sm text-stone-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <div className="text-lg font-semibold text-stone-900">
                            ${order.total_amount}
                          </div>
                        </div>
                      </div>
                      {order.customer_email && (
                        <div className="text-sm text-stone-600 mb-2">
                          Email: {order.customer_email}
                        </div>
                      )}
                      {order.status === 'completed' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600 text-sm">
                            <Download className="h-4 w-4 mr-1" />
                            <span>Downloads available</span>
                          </div>
                          <Link
                            to="/account?tab=downloads"
                            className="text-stone-600 hover:text-stone-900 text-sm transition-colors"
                          >
                            View Downloads →
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="bg-white rounded-lg p-6 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 mb-6 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Digital Downloads
              </h2>
              
              {downloadTokens.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 mb-2">No downloads available yet</p>
                  <p className="text-sm text-stone-400 mb-4">
                    Complete a purchase to access your digital art prints
                  </p>
                  <Link
                    to="/products"
                    className="inline-block text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    Browse Art Prints
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloadTokens.map((token) => {
                    const expired = isTokenExpired(token.expires_at)
                    const remaining = getDownloadsRemaining(token)
                    
                    return (
                      <div key={token.id} className="border border-stone-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-medium text-stone-900">{token.product_name}</div>
                            <div className="text-sm text-stone-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Order #{token.order_id} • {new Date(token.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-stone-400 mt-1">
                              {expired 
                                ? 'Expired' 
                                : `${remaining} downloads remaining • Expires ${new Date(token.expires_at).toLocaleDateString()}`
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            {expired ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                                Expired
                              </span>
                            ) : remaining > 0 ? (
                              <a
                                href={`https://nskzgujplhrnzymvhzsp.supabase.co/functions/v1/secure-download/${token.token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download Files
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-yellow-600 bg-yellow-50">
                                Limit Reached
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-stone-50 rounded-lg p-3">
                          <p className="text-sm text-stone-600 mb-2">
                            <strong>Available formats:</strong> PDF (Print Ready), JPG (300 DPI), PNG (300 DPI)
                          </p>
                          <p className="text-xs text-stone-500">
                            High-resolution files optimized for printing up to 24" × 32"
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Download Instructions:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Click "Download Files" to access all formats for each product</li>
                      <li>• Downloads are tracked - you have 10 downloads per product</li>
                      <li>• Links expire after 7 days - download promptly</li>
                      <li>• Files can be printed multiple times for personal use</li>
                      <li>• Use high-quality paper for best results</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="bg-white rounded-lg p-6 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Favorite Prints</h2>
              <div className="text-center py-8">
                <Heart className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">No favorites yet</p>
                <p className="text-sm text-stone-400 mt-1">
                  Heart items while browsing to save them here
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg p-6 border border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 mb-6">Account Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-stone-900 mb-2">Email Notifications</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-stone-600">Order confirmations & download links</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm text-stone-600">New product releases</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-stone-600">Promotional offers</span>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-stone-200">
                  <h3 className="font-medium text-stone-900 mb-2">Privacy</h3>
                  <button className="text-sm text-red-600 hover:text-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountPage