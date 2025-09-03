import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Filter, Grid, List, ChevronDown } from 'lucide-react'
import { Product, supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

const ProductsPage = () => {
  const { category } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [priceFilter, setPriceFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadProducts()
  }, [category, searchQuery, sortBy, priceFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)

      // Filter by category
      if (category) {
        const categoryName = category.replace('-', ' ')
        query = query.ilike('category', `%${categoryName}%`)
      }

      // Filter by search query
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Filter by price
      if (priceFilter !== 'all') {
        switch (priceFilter) {
          case 'under-15':
            query = query.lt('price', 15)
            break
          case '15-25':
            query = query.gte('price', 15).lte('price', 25)
            break
          case 'over-25':
            query = query.gt('price', 25)
            break
        }
      }

      // Sort products
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true })
          break
        case 'price-high':
          query = query.order('price', { ascending: false })
          break
        case 'name':
          query = query.order('name', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (error) throw error
      
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryTitle = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`
    if (!category) return 'All Prints'
    
    const categoryNames: { [key: string]: string } = {
      'abstract-art': 'Abstract Art',
      'minimalist': 'Minimalist',
      'geometric': 'Geometric',
      'botanical': 'Botanical'
    }
    
    return categoryNames[category] || category
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-stone-200 aspect-square rounded-lg mb-4" />
              <div className="bg-stone-200 h-4 rounded mb-2" />
              <div className="bg-stone-200 h-4 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-stone-900 mb-2">{getCategoryTitle()}</h1>
        <p className="text-stone-600">{products.length} prints available</p>
      </div>

      {/* Filters and Sort */}
      <div className="mb-8 border-b border-stone-200 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center space-x-4">
            {/* View Mode */}
            <div className="flex items-center space-x-1 bg-stone-100 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-stone-50 rounded-lg">
            <div className="flex flex-wrap gap-4">
              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Price Range</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                >
                  <option value="all">All Prices</option>
                  <option value="under-15">Under $15</option>
                  <option value="15-25">$15 - $25</option>
                  <option value="over-25">Over $25</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-500 text-lg">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className={`grid gap-8 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductsPage