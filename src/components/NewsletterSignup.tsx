import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'hero' | 'footer' | 'inline';
}

export function NewsletterSignup({ className = '', variant = 'inline' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://nskzgujplhrnzymvhzsp.supabase.co/functions/v1/email-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          preferences: {
            newsletter: true,
            productUpdates: true
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
        setFirstName('');
      } else {
        setError(result.error?.message || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: 'bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto',
          title: 'text-2xl font-light text-stone-900 mb-4',
          description: 'text-stone-600 mb-6'
        };
      case 'footer':
        return {
          container: 'bg-stone-800 p-6 rounded-lg',
          title: 'text-xl font-light text-white mb-3',
          description: 'text-stone-300 mb-4 text-sm'
        };
      default:
        return {
          container: 'bg-stone-50 p-6 rounded-lg border',
          title: 'text-lg font-light text-stone-900 mb-3',
          description: 'text-stone-600 mb-4 text-sm'
        };
    }
  };

  const styles = getVariantStyles();

  if (isSuccess) {
    return (
      <div className={`${styles.container} text-center ${className}`}>
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className={styles.title}>Welcome to Our Community!</h3>
        <p className={styles.description}>
          Thank you for subscribing. Check your email for a welcome message with exclusive content.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Mail className={variant === 'footer' ? 'w-5 h-5 text-white' : 'w-5 h-5 text-stone-600'} />
        <h3 className={styles.title.replace('mb-4', 'mb-0').replace('mb-3', 'mb-0')}>Join Our Newsletter</h3>
      </div>
      <p className={styles.description}>
        Get the latest minimalist art collections and design inspiration delivered to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3">
          <input
            type="text"
            placeholder="First Name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 transition-colors"
          />
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 transition-colors"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!email || isSubmitting}
          className="w-full bg-stone-900 text-white py-2 px-4 rounded-lg hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Subscribing...' : 'Subscribe to Newsletter'}
        </button>
      </form>

      <p className="text-xs text-stone-500 mt-3">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
}