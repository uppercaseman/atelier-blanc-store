import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Minus, Plus, Heart, Share2, ArrowLeft, Download, FileText, Printer } from 'lucide-react'
import { Product, supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'

const ProductPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (id) {
      loadProduct(id)
    }
  }, [id])

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        navigate('/products')
        return
      }
      
      setProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    try {
      setAddingToCart(true)
      await addToCart(product, quantity)
      // Show success message or redirect to cart
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out this beautiful digital art print: ${product?.name}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-stone-200 aspect-square rounded-lg" />
            <div className="space-y-4">
              <div className="bg-stone-200 h-8 rounded w-3/4" />
              <div className="bg-stone-200 h-6 rounded w-1/2" />
              <div className="bg-stone-200 h-20 rounded" />
              <div className="bg-stone-200 h-12 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-stone-600 hover:text-stone-900 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="">
          <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Digital Badge */}
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <Download className="h-3 w-3 mr-1" />
              Digital Download
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="">
          {/* Category */}
          <div className="text-sm text-stone-500 mb-2">{product.category}</div>
          
          {/* Product Name */}
          <h1 className="text-3xl font-serif text-stone-900 mb-2">{product.name}</h1>
          
          {/* Digital Product Notice */}
          <div className="flex items-center text-sm text-green-600 mb-4">
            <Download className="h-4 w-4 mr-2" />
            <span>Instant digital download • No shipping required</span>
          </div>
          
          {/* Price */}
          <div className="text-2xl font-semibold text-stone-900 mb-6">${product.price}</div>
          
          {/* Description */}
          <div className="prose prose-stone max-w-none mb-8">
            <p>{product.description || 'Beautiful minimalist art print perfect for modern home decor. This digital download gives you instant access to high-quality files ready for printing at your preferred size.'}</p>
          </div>
          
          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-medium px-4">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="flex-1 bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {addingToCart ? 'Adding...' : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </button>
            
            <button className="p-3 border border-stone-300 rounded-full hover:bg-stone-50 transition-colors">
              <Heart className="h-5 w-5 text-stone-600" />
            </button>
            
            <button
              onClick={handleShare}
              className="p-3 border border-stone-300 rounded-full hover:bg-stone-50 transition-colors"
            >
              <Share2 className="h-5 w-5 text-stone-600" />
            </button>
          </div>
          
          {/* Digital Product Details */}
          <div className="border-t border-stone-200 pt-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Product Type</span>
                <span className="text-stone-900 flex items-center">
                  <Download className="h-3 w-3 mr-1" />
                  Digital Download
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">File Formats</span>
                <span className="text-stone-900">PDF, JPG, PNG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Resolution</span>
                <span className="text-stone-900">300 DPI (Print Quality)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Delivery</span>
                <span className="text-stone-900">Instant via email</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">License</span>
                <span className="text-stone-900">Personal use only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Size Guide */}
      <div className="mt-16 bg-stone-50 rounded-lg p-8">
        <h3 className="text-xl font-serif text-stone-900 mb-6 text-center flex items-center justify-center">
          <Printer className="h-5 w-5 mr-2" />
          Recommended Print Sizes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          {[
            { size: 'Small', dimensions: '8" × 10"', ideal: 'Desk, shelf display' },
            { size: 'Medium', dimensions: '11" × 14"', ideal: 'Gallery wall, bedroom' },
            { size: 'Large', dimensions: '16" × 20"', ideal: 'Living room, office' },
            { size: 'Extra Large', dimensions: '24" × 32"', ideal: 'Statement piece' }
          ].map((sizeInfo) => (
            <div key={sizeInfo.size} className="bg-white rounded-lg p-4">
              <div className="font-medium text-stone-900 mb-1">{sizeInfo.size}</div>
              <div className="text-stone-600 text-sm mb-2">{sizeInfo.dimensions}</div>
              <div className="text-xs text-stone-500">{sizeInfo.ideal}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-stone-600 mt-6">
          High-resolution files can be printed at any size up to 24" × 32" while maintaining excellent quality.
        </p>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          How to Use Your Digital Download
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mb-2">1</div>
            <h4 className="font-semibold text-blue-900 mb-1">Download</h4>
            <p className="text-blue-800">Receive instant download links via email after purchase</p>
          </div>
          <div>
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mb-2">2</div>
            <h4 className="font-semibold text-blue-900 mb-1">Print</h4>
            <p className="text-blue-800">Print at home or take to a professional print shop</p>
          </div>
          <div>
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mb-2">3</div>
            <h4 className="font-semibold text-blue-900 mb-1">Enjoy</h4>
            <p className="text-blue-800">Frame and display your beautiful new art print</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage