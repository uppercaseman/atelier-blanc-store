import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Download, Check } from 'lucide-react'
import { Product } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAdding(true)
    try {
      await addToCart(product)
      setShowSuccess(true)
      
      // Show toast notification
      showToast({
        type: 'success',
        title: 'Added to Cart!',
        message: `${product.name} has been added to your cart.`,
        actionText: 'View Cart',
        actionUrl: '/cart',
        duration: 3000
      })
      
      // Show success animation then reset
      setTimeout(() => {
        setShowSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      showToast({
        type: 'error',
        title: 'Failed to add to cart',
        message: 'Please try again.',
        duration: 3000
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="aspect-square bg-stone-100 overflow-hidden relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Digital Badge */}
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Download className="h-2 w-2 mr-1" />
            Digital
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-stone-900 group-hover:text-stone-700 transition-colors">
              {product.name}
            </h3>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-stone-100 rounded">
              <Heart className="h-4 w-4 text-stone-400 hover:text-red-500" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-stone-500">{product.category}</p>
            <div className="flex items-center text-xs text-green-600">
              <Download className="h-3 w-3 mr-1" />
              <span>Instant Download</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-stone-900">
              ${product.price}
            </span>
            
            <button
              onClick={handleAddToCart}
              disabled={isAdding || showSuccess}
              className={`transition-all duration-300 px-3 py-1.5 rounded-full flex items-center space-x-1 text-sm ${
                showSuccess 
                  ? 'bg-green-600 text-white opacity-100 scale-105' 
                  : 'opacity-0 group-hover:opacity-100 bg-stone-900 text-white hover:bg-stone-800'
              } disabled:cursor-not-allowed`}
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3 w-3" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default ProductCard