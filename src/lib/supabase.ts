import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nskzgujplhrnzymvhzsp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za3pndWpwbGhybnp5bXZoenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk0MjEsImV4cCI6MjA3MjQzNTQyMX0.Yyyq2-fJTYdk3iPFNy0OACrLIg0DSJJ7sJxJgfTSoKw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  category_id: string
  image_url: string
  is_active: boolean
  featured?: boolean
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface CartItem {
  id?: string
  user_id: string
  product_id: string
  quantity: number
  product?: Product
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: number
  user_id?: string
  stripe_payment_intent_id?: string
  status: string
  total_amount: number
  currency: string
  customer_email?: string
  shipping_address?: any
  billing_address?: any
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  email?: string
  full_name?: string
  phone?: string
  shipping_address?: any
  billing_address?: any
  created_at: string
  updated_at: string
}