import React from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, Download } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, loading } = useCart()

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-stone-200 rounded-lg">
              <div className="bg-stone-200 w-20 h-20 rounded" />
              <div className="flex-1 space-y-2">
                <div className="bg-stone-200 h-4 rounded w-3/4" />
                <div className="bg-stone-200 h-4 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-stone-900 mb-4">Your cart is empty</h2>
          <p className="text-stone-600 mb-8">Discover our beautiful digital art prints to add to your collection.</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            Browse Art Prints
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-stone-900">Shopping Cart</h1>
        <div className="flex items-center text-sm text-green-600">
          <Download className="h-4 w-4 mr-1" />
          <span>Digital downloads • No shipping needed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`${item.product_id}-${item.id}`} className="flex items-center space-x-4 p-4 border border-stone-200 rounded-lg">
                {/* Product Image */}
                <div className="w-20 h-20 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={item.product?.image_url}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">
                    <Link to={`/product/${item.product_id}`} className="hover:text-stone-700 transition-colors">
                      {item.product?.name}
                    </Link>
                  </h3>
                  <div className="flex items-center text-sm text-stone-500 mt-1">
                    <Download className="h-3 w-3 mr-1" />
                    <span>Digital Download • {item.product?.category}</span>
                  </div>
                  <p className="text-lg font-semibold text-stone-900 mt-1">${item.product?.price}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="p-1 border border-stone-300 rounded hover:bg-stone-50 transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="p-1 border border-stone-300 rounded hover:bg-stone-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="">
          <div className="bg-stone-50 rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-serif text-stone-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-stone-600">Items ({totalItems})</span>
                <span className="text-stone-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span className="text-stone-600">Shipping</span>
                <span className="font-medium">FREE (Digital)</span>
              </div>
              <div className="border-t border-stone-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-stone-900">Total</span>
                  <span className="text-lg font-semibold text-stone-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">Instant Digital Access:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• High-resolution files (300 DPI)</li>
                <li>• Multiple formats: PDF, JPG, PNG</li>
                <li>• Immediate download after payment</li>
                <li>• Lifetime access to files</li>
              </ul>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-stone-900 text-white text-center px-6 py-3 rounded-full hover:bg-stone-800 transition-colors mb-4"
            >
              Proceed to Checkout
            </Link>
            
            <Link
              to="/products"
              className="block w-full text-center text-stone-600 hover:text-stone-900 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage