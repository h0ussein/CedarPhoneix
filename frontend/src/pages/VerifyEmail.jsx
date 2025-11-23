import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { usersAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import BottomNav from '../components/BottomNav'
import { useCart } from '../context/CartContext'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading, verifying, success, error
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  
  // Safely get auth and cart hooks
  let login = () => {}
  let toggleCart = () => {}
  let getCartCount = () => 0
  
  try {
    const auth = useAuth()
    login = auth?.login || (() => {})
  } catch (e) {
    console.warn('Auth context not available:', e)
  }
  
  try {
    const cart = useCart()
    toggleCart = cart?.toggleCart || (() => {})
    getCartCount = cart?.getCartCount || (() => 0)
  } catch (e) {
    console.warn('Cart context not available:', e)
  }

  useEffect(() => {
    try {
      const token = searchParams.get('token')
      const emailParam = searchParams.get('email')

      console.log('🔍 Verification page loaded:', { 
        token: token ? token.substring(0, 10) + '...' : 'missing', 
        email: emailParam || 'missing',
        fullUrl: window.location.href
      })

      if (!token || !emailParam) {
        console.error('❌ Missing token or email:', { token: !!token, email: !!emailParam })
        setStatus('error')
        setMessage('Invalid verification link. Please check your email and try again.')
        return
      }

      setEmail(emailParam)
      setStatus('verifying')
      verifyEmail(token, emailParam)
    } catch (error) {
      console.error('❌ Error in VerifyEmail useEffect:', error)
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }, [searchParams])

  const verifyEmail = async (token, email) => {
    try {
      console.log('Attempting to verify email:', { token: token.substring(0, 10) + '...', email })
      const data = await usersAPI.verifyEmail(token, email)
      console.log('Verification response:', data)
      
      setStatus('success')
      setMessage(data.message || 'Email verified successfully!')
      
      // If token is returned, automatically log the user in
      if (data.data && data.data.token) {
        console.log('Logging user in automatically')
        login(data.data)
        
        // Redirect to account page after 2 seconds
        setTimeout(() => {
          navigate('/account')
        }, 2000)
      } else {
        console.log('No token returned, redirecting to login')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage(error.message || 'Failed to verify email. The link may have expired.')
    }
  }

  const handleResend = async () => {
    if (!email) return
    
    setResending(true)
    try {
      await usersAPI.resendVerification(email)
      setMessage('Verification email sent! Please check your inbox.')
      setStatus('success')
    } catch (error) {
      setMessage(error.message || 'Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  // Always render something
  if (status === 'loading') {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification page...</p>
        </div>
      </div>
    )
  }

  // Render basic content first to ensure page loads
  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50">
      {(() => {
        try {
          return <NavBar />
        } catch (e) {
          console.warn('NavBar error:', e)
          return null
        }
      })()}
      {(() => {
        try {
          return <BottomNav onCartClick={toggleCart} cartCount={getCartCount()} />
        } catch (e) {
          console.warn('BottomNav error:', e)
          return null
        }
      })()}
      
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
          {status === 'verifying' && (
            <>
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Email Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">Redirecting you now...</p>
              
              {email && (
                <div className="space-y-3">
                  <Link 
                    to="/account" 
                    className="inline-block w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold px-8 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-600 transition-all text-center"
                  >
                    Go to Account
                  </Link>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full bg-gray-100 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {email && (
                <div className="space-y-4">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold px-8 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  <Link 
                    to="/login" 
                    className="block text-center text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Back to Login
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default VerifyEmail

