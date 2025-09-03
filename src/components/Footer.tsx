import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Instagram, Facebook, Twitter } from 'lucide-react'
import { NewsletterSignup } from '@/components/NewsletterSignup'

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-serif mb-4">Atelier Blanc</div>
            <p className="text-stone-300 mb-6">
              Curated collection of premium minimalist art prints. Transform your space with beautiful wall art.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-stone-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-stone-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-stone-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:info@atelierblanc.com" className="text-stone-300 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="col-span-1 md:col-span-2">
            <NewsletterSignup variant="footer" className="max-w-md" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-stone-300 hover:text-white transition-colors">All Prints</Link></li>
              <li><Link to="/products/abstract-art" className="text-stone-300 hover:text-white transition-colors">Abstract Art</Link></li>
              <li><Link to="/products/minimalist" className="text-stone-300 hover:text-white transition-colors">Minimalist</Link></li>
              <li><Link to="/products/geometric" className="text-stone-300 hover:text-white transition-colors">Geometric</Link></li>
              <li><Link to="/products/botanical" className="text-stone-300 hover:text-white transition-colors">Botanical</Link></li>
              <li><Link to="/email-admin" className="text-stone-300 hover:text-white transition-colors">Email Admin</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="font-semibold mb-4">Customer Care</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-stone-300 hover:text-white transition-colors">Size Guide</a></li>
              <li><a href="#" className="text-stone-300 hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-stone-300 hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" className="text-stone-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-stone-300 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-stone-400">
          <p>&copy; 2025 Atelier Blanc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer