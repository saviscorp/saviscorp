'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeSlash } from 'phosphor-react'
import Link from 'next/link'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { setAuthCookie } from '@/lib/session'
import { getOnboardingRedirect } from '@/lib/onboarding'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8055.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9574C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
    <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.6564 3.5795 9 3.5795z" fill="#EA4335"/>
  </svg>
)

const LeftPanel = () => (
  <div
    className="hidden lg:flex lg:w-[40%] min-h-screen flex-col justify-between p-10"
    style={{ background: 'linear-gradient(160deg, #640D5F 0%, #D91656 60%, #EB5B00 100%)' }}
  >
    <span className="text-white text-[22px] font-bold font-display">SAVIS</span>
    <div className="space-y-2">
      <p className="text-white/80 text-[15px] font-body">Services you can trust, people you can count on.</p>
      <div className="mt-8 bg-white/10 rounded-2xl p-6 space-y-4">
        {[
          { icon: '🛡️', text: 'ID-verified providers you can trust' },
          { icon: '📱', text: 'Secure M-Pesa & card payments' },
          { icon: '⚡', text: 'Bookings confirmed within the hour' },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <span className="text-white text-[15px] font-body">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
    <p className="text-white/40 text-[13px] font-body">© 2026 SAVIS Technologies Ltd.</p>
  </div>
)

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [submitting, setSubmitting] = useState(false)

  const validateEmail = useCallback((v: string) => {
    if (!v) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'
    return ''
  }, [])

  const validatePassword = useCallback((v: string) => {
    if (!v) return 'Password is required.'
    return ''
  }, [])

  const handleBlurEmail = () => {
    setTouched(t => ({ ...t, email: true }))
    setEmailError(validateEmail(email))
  }

  const handleBlurPassword = () => {
    setTouched(t => ({ ...t, password: true }))
    setPasswordError(validatePassword(password))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ee = validateEmail(email)
    const pe = validatePassword(password)
    setEmailError(ee)
    setPasswordError(pe)
    setTouched({ email: true, password: true })
    if (ee || pe) return
    setSubmitting(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setAuthCookie(cred.user.uid)
      const path = await getOnboardingRedirect(cred.user.uid)
      router.push(path)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setPasswordError('Incorrect email or password. Try again or reset your password.')
      } else {
        setPasswordError('Sign in failed. Please try again.')
      }
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      setAuthCookie(result.user.uid)
      const path = await getOnboardingRedirect(result.user.uid)
      router.push(path)
    } catch {
      setPasswordError('Google sign-in failed. Please try again.')
      setSubmitting(false)
    }
  }

  // Ignore searchParams — onboarding routing takes precedence over ?next=
  void searchParams

  return (
    <div className="min-h-screen bg-surface-gray flex">
      <LeftPanel />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 lg:py-0">
        <div className="w-full max-w-[480px] mb-2 lg:hidden">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-text-primary"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="w-full max-w-[480px]">
          <p className="hidden md:block lg:hidden text-[22px] font-bold text-brand-primary font-display mb-8 text-center">SAVIS</p>

          <h1 className="text-[22px] font-bold text-text-primary font-display mb-1">Welcome back</h1>
          <p className="text-[15px] text-text-secondary font-body mb-6">Sign in to your SAVIS account</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full h-[52px] rounded-[10px] bg-white border border-[#DADCE0] flex items-center justify-center gap-3 text-[15px] font-medium text-text-primary hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[13px] text-text-secondary font-body whitespace-nowrap">or sign in with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-[13px] font-medium text-text-primary font-body">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={handleBlurEmail}
                placeholder="you@example.com"
                className={`w-full h-[52px] rounded-[10px] border px-4 text-[15px] font-body bg-white placeholder:text-text-secondary/60 outline-none transition-colors
                  ${touched.email && emailError ? 'border-error focus:ring-1 focus:ring-error' : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`}
              />
              {touched.email && emailError && (
                <p className="text-[13px] text-error font-body">{emailError}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[13px] font-medium text-text-primary font-body">Password</label>
                <Link href="/forgot-password" className="text-[13px] text-brand-primary font-body hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={handleBlurPassword}
                  placeholder="Your password"
                  className={`w-full h-[52px] rounded-[10px] border px-4 pr-12 text-[15px] font-body bg-white placeholder:text-text-secondary/60 outline-none transition-colors
                    ${touched.password && passwordError ? 'border-error focus:ring-1 focus:ring-error' : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.password && passwordError && (
                <p className="text-[13px] text-error font-body">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold font-body hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 mt-2"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[15px] text-text-secondary font-body mt-5">
            New to SAVIS?{' '}
            <Link href="/register" className="text-brand-primary font-medium hover:underline">Join free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-gray flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  )
}
