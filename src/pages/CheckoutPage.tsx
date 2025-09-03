import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Lock, CreditCard, Download, FileText, CheckCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Real Stripe publishable key
const stripePromise = loadStripe('pk_test_51S2WCBFVIVLbQXhnuC33awzR4MhCDiY4ZpMyx6iWG3Bbe61NeB4c2SyeqSyS1NOq6YhnHEEDRICNCvw2nHsLyuvG00ess2iDRd')

interface BillingInfo {
  name: string
  email: string
  phone: string
  address: {
    line1: string
    line2: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

const CheckoutForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    name: '',
    email: user?.email || '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  })
  
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Handle Stripe redirect success
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment')
    if (paymentSuccess === 'success') {
      setSuccess(true)
      setOrderId('completed') // Generic order ID for redirect cases
      // Keep existing email or set generic message
      if (!billingInfo.email) {
        setBillingInfo(prev => ({ ...prev, email: 'Check your email for confirmation' }))
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      setError('Stripe not loaded. Please refresh the page.')
      return
    }

    if (!billingInfo.email || !billingInfo.name || !billingInfo.phone || 
        !billingInfo.address.line1 || !billingInfo.address.city || 
        !billingInfo.address.state || !billingInfo.address.postal_code || !billingInfo.address.country) {
      setError('Please fill in all required fields')
      return
    }

    setProcessing(true)
    setError('')

    try {
      console.log('Confirming payment with PaymentElement...')

      // Confirm payment with Stripe using PaymentElement (manual billing details)
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout?payment=success`,
          payment_method_data: {
            billing_details: {
              name: billingInfo.name,
              email: billingInfo.email,
              phone: billingInfo.phone,
              address: {
                line1: billingInfo.address.line1,
                line2: billingInfo.address.line2,
                city: billingInfo.address.city,
                state: billingInfo.address.state,
                postal_code: billingInfo.address.postal_code,
                country: billingInfo.address.country
              }
            }
          }
        },
        redirect: 'if_required'
      })

      if (stripeError) {
        console.error('Stripe error:', stripeError)
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not successful')
      }

      console.log('Payment successful! Processing order...', paymentIntent.id)
      
      // Process digital order using the payment intent ID
      const cartItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Digital Art Print',
        quantity: item.quantity,
        price: item.product?.price || 0,
        product_image_url: item.product?.image_url
      }))

      const { error: updateError } = await supabase.functions.invoke('process-digital-order', {
        body: {
          paymentIntentId: paymentIntent.id,
          customerEmail: billingInfo.email,
          customerName: billingInfo.name,
          customerPhone: billingInfo.phone,
          billingAddress: billingInfo.address,
          cartItems
        }
      })

      if (updateError) {
        console.warn('Post-purchase processing error:', updateError)
      }

      // Clear cart and show success
      await clearCart()
      setSuccess(true)
      setOrderId(paymentIntent.id) // Use payment intent ID as order reference
      
      // Success page is self-contained - no automatic redirect
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      setError(error.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleBillingChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '')
      setBillingInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setBillingInfo(prev => ({ ...prev, [field]: value }))
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-green-50 rounded-lg p-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-green-900 mb-4">Payment Successful!</h1>
          <p className="text-green-800 mb-6">
            Your digital art prints are ready for download. Check your email for download links and instructions.
          </p>
          <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Order Details:</h3>
            <p className="text-sm text-green-800">Order #{orderId}</p>
            <p className="text-sm text-green-800">Email: {billingInfo.email}</p>
            <p className="text-sm text-green-800">Amount: ${totalPrice.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">What Happens Next:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download links will be sent to your email within minutes</li>
              <li>• Files include high-resolution formats (PDF, JPG, PNG)</li>
              <li>• Print at home or at your local print shop</li>
              <li>• Your downloads never expire</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-800 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => window.open('mailto:' + billingInfo.email, '_blank')}
              className="border-2 border-stone-900 text-stone-900 px-6 py-3 rounded-full hover:bg-stone-900 hover:text-white transition-colors"
            >
              Check Email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-stone-900 mb-2">Checkout</h1>
      <div className="flex items-center text-sm text-green-600 mb-8">
        <Download className="h-4 w-4 mr-2" />
        <span>Instant digital download after payment</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm relative z-30">
                {error}
              </div>
            )}

            {/* Digital Product Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Digital Downloads</h3>
              </div>
              <p className="text-blue-800 text-sm">
                You're purchasing digital art files for instant download. Files will be delivered via email within minutes of payment.
              </p>
            </div>

            {/* Complete Billing Information */}
            <div className="bg-white rounded-lg p-6 border border-stone-200 relative z-10">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Billing Information</h3>
              <p className="text-sm text-stone-600 mb-4">Required for payment verification and digital delivery</p>
              
              <div className="space-y-4">
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.name}
                      onChange={(e) => handleBillingChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={billingInfo.email}
                      onChange={(e) => handleBillingChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      placeholder="We'll send download links here"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="relative">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={billingInfo.phone}
                    onChange={(e) => handleBillingChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={billingInfo.address.line1}
                    onChange={(e) => handleBillingChange('address.line1', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="relative">
                  <label className="block text-sm font-medium text-stone-700 mb-1">Apartment, Suite, etc. (Optional)</label>
                  <input
                    type="text"
                    value={billingInfo.address.line2}
                    onChange={(e) => handleBillingChange('address.line2', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                    placeholder="Apartment 4B"
                  />
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.address.city}
                      onChange={(e) => handleBillingChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      placeholder="New York"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">State/Province *</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.address.state}
                      onChange={(e) => handleBillingChange('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      placeholder="NY"
                    />
                  </div>
                </div>

                {/* Postal Code and Country */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.address.postal_code}
                      onChange={(e) => handleBillingChange('address.postal_code', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
                      placeholder="10001"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Country *</label>
                    <select
                      required
                      value={billingInfo.address.country}
                      onChange={(e) => handleBillingChange('address.country', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                      <option value="NL">Netherlands</option>
                      <option value="SE">Sweden</option>
                      <option value="NO">Norway</option>
                      <option value="DK">Denmark</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="SG">Singapore</option>
                      <option value="HK">Hong Kong</option>
                      <option value="NZ">New Zealand</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg p-6 border border-stone-200 relative z-10 checkout-payment-section">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Method
              </h3>
              <div className="mb-6 stripe-payment-container">
                <PaymentElement
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card'],
                    fields: {
                      billingDetails: 'never'
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center text-xs text-stone-500 mb-4 relative z-30">
                <Lock className="h-3 w-3 mr-1" />
                <span>Your payment information is secure and encrypted</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 relative z-30">
                <div className="flex items-center text-green-800 text-sm">
                  <Download className="h-4 w-4 mr-2" />
                  <span><strong>Instant Download:</strong> Files delivered immediately via email</span>
                </div>
              </div>
            </div>

            <div className="relative z-40">
              <button
                type="submit"
                disabled={processing || !stripe}
                className="w-full bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-50 font-semibold"
              >
                {processing ? 'Processing Payment...' : `Complete Purchase - $${totalPrice.toFixed(2)}`}
              </button>
            </div>

            <p className="text-xs text-stone-500 text-center">
              By completing your purchase, you agree to our terms of service and will receive high-resolution digital files for personal use.
            </p>
          </form>
        </div>

        {/* Order Summary */}
        <div className="">
          <div className="bg-stone-50 rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-serif text-stone-900 mb-4">Digital Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.id}`} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-stone-900 text-sm">{item.product?.name}</div>
                    <div className="text-stone-500 text-xs flex items-center">
                      <Download className="h-3 w-3 mr-1" />
                      Digital Download • Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="text-stone-900 font-semibold text-sm">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 text-sm border-t border-stone-200 pt-4">
              <div className="flex justify-between font-semibold text-base">
                <span className="text-stone-900">Total</span>
                <span className="text-stone-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="text-green-600 text-center font-medium">
                No shipping fees • Instant delivery
              </div>
            </div>

            {/* What You'll Receive */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-stone-200">
              <h4 className="font-semibold text-stone-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                What You'll Receive:
              </h4>
              <ul className="text-sm text-stone-600 space-y-1">
                <li>• High-resolution files (300 DPI)</li>
                <li>• Multiple formats: PDF, JPG, PNG</li>
                <li>• Print sizes up to 24" × 32"</li>
                <li>• Email delivery within minutes</li>
                <li>• Lifetime download access</li>
                <li>• Printing instructions included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CheckoutPage = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const { items, totalPrice } = useCart()

  // Create payment intent on page load
  React.useEffect(() => {
    if (items.length === 0 || totalPrice === 0) {
      setPaymentLoading(false)
      setPaymentError('No items in cart')
      return
    }
    
    const createPaymentIntent = async () => {
      setPaymentLoading(true)
      setPaymentError(null)
      
      try {
        console.log('Creating payment intent for:', { itemsCount: items.length, totalPrice })
        
        const cartItems = items.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.name || 'Digital Art Print',
          quantity: item.quantity,
          price: item.product?.price || 0,
          product_image_url: item.product?.image_url
        }))

        console.log('Cart items prepared:', cartItems)

        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount: totalPrice,
            currency: 'usd',
            cartItems,
            customerEmail: '',
            billingAddress: { name: '', email: '', country: 'US' },
            productType: 'digital'
          }
        })

        console.log('Payment intent response:', { paymentData, paymentError })

        if (paymentError) {
          console.error('Payment intent creation failed:', paymentError)
          throw new Error(paymentError.message || 'Failed to create payment intent')
        }

        if (!paymentData?.data?.clientSecret) {
          console.error('No client secret in response:', paymentData)
          throw new Error('Payment initialization failed - missing client secret')
        }

        console.log('Client secret received:', paymentData.data.clientSecret)
        setClientSecret(paymentData.data.clientSecret)
        
      } catch (error: any) {
        console.error('Error creating payment intent:', error)
        setPaymentError(error.message || 'Failed to initialize payment. Please try again.')
      } finally {
        setPaymentLoading(false)
      }
    }

    createPaymentIntent()
  }, [items, totalPrice])

  const options = {
    clientSecret,
  }

  // Only render Elements when we have a valid client secret
  if (!clientSecret) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-serif text-stone-900 mb-2">Initializing Secure Checkout...</h2>
          <p className="text-stone-600">Please wait while we prepare your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  )
}

export default CheckoutPage