import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Download, Printer, FileText } from 'lucide-react'
import { Product, supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import { NewsletterSignup } from '@/components/NewsletterSignup'

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const loadFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setFeaturedProducts(data || [])
    } catch (error) {
      console.error('Error loading featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-stone-100 to-stone-200 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-serif text-stone-900 mb-6">
              Digital Art Prints
            </h1>
            <p className="text-xl text-stone-600 mb-4 max-w-2xl mx-auto">
              Instant download minimalist and Scandinavian wall art. High-resolution files ready for printing.
            </p>
            <div className="flex items-center justify-center text-green-600 mb-8">
              <Download className="h-5 w-5 mr-2" />
              <span className="font-medium">No shipping • Instant download • Print at home</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
              >
                Shop Digital Prints
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/products/minimalist"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-stone-900 text-stone-900 rounded-full hover:bg-stone-900 hover:text-white transition-colors"
              >
                View Minimalist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Featured Digital Collection</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Handpicked digital art prints that exemplify modern minimalist design and Scandinavian aesthetics. Download instantly and print at your preferred size.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-stone-200 aspect-square rounded-lg mb-4" />
                  <div className="bg-stone-200 h-4 rounded mb-2" />
                  <div className="bg-stone-200 h-4 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-stone-900 text-stone-900 rounded-full hover:bg-stone-900 hover:text-white transition-colors"
            >
              View All Digital Prints
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Get your beautiful art prints in just three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">1. Purchase & Download</h3>
              <p className="text-stone-600">
                Choose your prints and complete checkout. Receive instant download links via email.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">2. Print at Home</h3>
              <p className="text-stone-600">
                Print on your home printer or take to a professional print shop for best results.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">3. Frame & Enjoy</h3>
              <p className="text-stone-600">
                Frame your prints and transform your space with beautiful minimalist wall art.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Shop by Style</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Discover digital art that matches your aesthetic preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Abstract Art', slug: 'abstract-art', description: 'Modern abstract compositions' },
              { name: 'Minimalist', slug: 'minimalist', description: 'Clean, simple designs' },
              { name: 'Geometric', slug: 'geometric', description: 'Structured patterns & shapes' },
              { name: 'Botanical', slug: 'botanical', description: 'Nature-inspired artwork' }
            ].map((category) => (
              <Link
                key={category.slug}
                to={`/products/${category.slug}`}
                className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-stone-200"
              >
                <div className="h-24 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg mb-4 group-hover:from-stone-200 group-hover:to-stone-300 transition-colors flex items-center justify-center">
                  <Download className="h-6 w-6 text-stone-500" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{category.name}</h3>
                <p className="text-sm text-stone-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Digital */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Why Choose Digital Art Prints</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">Instant Access</h3>
              <p className="text-stone-600">
                No waiting for shipping. Download immediately after purchase and start decorating today.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">Print Flexibility</h3>
              <p className="text-stone-600">
                Choose your own size, paper type, and frame. Print multiple copies for different rooms.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-3">High Quality</h3>
              <p className="text-stone-600">
                300 DPI resolution ensures crisp, professional quality prints up to 24" × 32".
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-br from-stone-100 to-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Stay Inspired</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Get exclusive access to new collections, design tips, and special offers delivered to your inbox.
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <NewsletterSignup variant="hero" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage