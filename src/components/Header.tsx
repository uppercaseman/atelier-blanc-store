import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'

const Header = () => {
  const { user, signOut } = useAuth()
  const { totalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartAnimation, setCartAnimation] = useState(false)
  const [prevTotalItems, setPrevTotalItems] = useState(totalItems)
  const navigate = useNavigate()

  // Animate cart when items are added
  useEffect(() => {
    if (totalItems > prevTotalItems) {
      setCartAnimation(true)
      setTimeout(() => setCartAnimation(false), 600)
    }
    setPrevTotalItems(totalItems)
  }, [totalItems, prevTotalItems])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-serif text-stone-900">Atelier Blanc</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-stone-600 hover:text-stone-900 transition-colors">
              All Prints
            </Link>
            <Link to="/products/abstract-art" className="text-stone-600 hover:text-stone-900 transition-colors">
              Abstract
            </Link>
            <Link to="/products/minimalist" className="text-stone-600 hover:text-stone-900 transition-colors">
              Minimalist
            </Link>
            <Link to="/products/geometric" className="text-stone-600 hover:text-stone-900 transition-colors">
              Geometric
            </Link>
            <Link to="/products/botanical" className="text-stone-600 hover:text-stone-900 transition-colors">
              Botanical
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search art prints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-stone-600 hover:text-stone-900 transition-colors">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block text-sm">Account</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <Link to="/account" className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 transition-colors">
                      My Account
                    </Link>
                    <Link to="/admin" className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 transition-colors">
                      Admin Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="text-stone-600 hover:text-stone-900 transition-colors">
                <User className="h-5 w-5" />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative flex items-center text-stone-600 hover:text-stone-900 transition-colors">
              <ShoppingBag className={`h-5 w-5 transition-transform duration-300 ${
                cartAnimation ? 'scale-125 text-green-600' : ''
              }`} />
              {totalItems > 0 && (
                <span className={`absolute -top-2 -right-2 bg-stone-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 ${
                  cartAnimation ? 'scale-125 bg-green-600' : ''
                }`}>
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-stone-600 hover:text-stone-900 transition-colors"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-200">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search art prints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            </form>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              <Link to="/products" className="block text-stone-600 hover:text-stone-900 transition-colors">
                All Prints
              </Link>
              <Link to="/products/abstract-art" className="block text-stone-600 hover:text-stone-900 transition-colors">
                Abstract
              </Link>
              <Link to="/products/minimalist" className="block text-stone-600 hover:text-stone-900 transition-colors">
                Minimalist
              </Link>
              <Link to="/products/geometric" className="block text-stone-600 hover:text-stone-900 transition-colors">
                Geometric
              </Link>
              <Link to="/products/botanical" className="block text-stone-600 hover:text-stone-900 transition-colors">
                Botanical
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header