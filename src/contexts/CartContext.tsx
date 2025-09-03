import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product, CartItem, supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: number
  totalPrice: number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load cart items when user changes
  useEffect(() => {
    if (user) {
      loadCartItems()
    } else {
      setItems([])
    }
  }, [user])

  const loadCartItems = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      setItems(data || [])
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user) {
      // Handle guest cart (localStorage)
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      const existingItem = guestCart.find((item: any) => item.product_id === product.id)
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        guestCart.push({
          product_id: product.id,
          quantity,
          product
        })
      }
      
      localStorage.setItem('guestCart', JSON.stringify(guestCart))
      setItems(guestCart)
      return
    }

    try {
      setLoading(true)
      
      // Check if item already exists in cart
      const existingItem = items.find(item => item.product_id === product.id)
      
      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
        
        if (error) throw error
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity
          })
        
        if (error) throw error
      }
      
      await loadCartItems()
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      const updatedCart = guestCart.filter((item: any) => item.product_id !== productId)
      localStorage.setItem('guestCart', JSON.stringify(updatedCart))
      setItems(updatedCart)
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
      
      if (error) throw error
      await loadCartItems()
    } catch (error) {
      console.error('Error removing from cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      const item = guestCart.find((item: any) => item.product_id === productId)
      if (item) {
        item.quantity = quantity
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart))
      setItems(guestCart)
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('product_id', productId)
      
      if (error) throw error
      await loadCartItems()
    } catch (error) {
      console.error('Error updating quantity:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem('guestCart')
      setItems([])
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
      
      if (error) throw error
      setItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => {
    const price = item.product?.price || 0
    return sum + (price * item.quantity)
  }, 0)

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      loading
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}