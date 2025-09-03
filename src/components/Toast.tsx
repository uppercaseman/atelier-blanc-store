import React, { useState, useEffect } from 'react'
import { X, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  actionText?: string
  actionUrl?: string
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  actionText, 
  actionUrl, 
  duration = 4000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'info':
        return <ShoppingBag className="h-5 w-5 text-blue-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${getBackgroundColor()} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            {message && (
              <p className="mt-1 text-sm text-gray-600">{message}</p>
            )}
            {actionText && actionUrl && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    window.location.href = actionUrl
                    handleClose()
                  }}
                  className="text-sm font-medium text-stone-900 hover:text-stone-700 underline cursor-pointer"
                >
                  {actionText}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast