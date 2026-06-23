'use client'

import { useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeSlash } from 'phosphor-react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { setAuthCookie } from '@/lib/session'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'signin' | 'signup'
type Role = 'provider' | 'requestor'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8055.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9574C.3477 6.1732 0 7.5482 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
    <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.6564 3.5795 9 3.5795z" fill="#EA4335"/>
  </svg>
)

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_COLOR = ['bg-border', 'bg-error', 'bg-brand-warm', 'bg-brand-gold', 'bg-success']
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']

// ─── Post-auth redirect logic ─────────────────────────────────────────────────

async function resolveRedirect(uid: string, role: Role, redirect: string | null): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    const profileComplete = snap.exists() ? (snap.data().profileComplete as boolean | undefined) : false

    if (!profileComplete) {
      const defaultRedirect =
        role === 'provider' ? '/become-provider/list-service' : '/dashboard/requestor'
      const encodedRedirect = encodeURIComponent(redirect ?? defaultRedirect)
      return `/become-provider?redirect=${encodedRedirect}`
    }

    if (redirect) return redirect
    return role === 'provider' ? '/become-provider/list-service' : '/dashboard/requestor'
  } catch {
    return role === 'provider' ? '/become-provider/list-service' : '/'
  }
}

async function saveRole(uid: string, email: string, role: Role): Promise<void> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await updateDoc(ref, { role })
  } else {
    await setDoc(ref, {
      uid,
      email,
      role,
      activeRole: role === 'provider' ? 'provider' : 'customer',
      onboardingComplete: false,
      profileComplete: false,
      onboardingStep: 1,
      verificationStatus: 'not_submitted',
      rating: null,
      ratingCount: 0,
      ratingSum: 0,
      profile: { fullName: '', phone: '', gender: '', dob: '' },
      photo: { uploaded: false, url: '' },
      identity: { docType: '', frontUploaded: false, backUploaded: false, skipped: false },
      createdAt: serverTimestamp(),
    })
  }
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const roleParam = (searchParams.get('role') ?? 'requestor') as Role
  const redirectParam = searchParams.get('redirect')

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = getPasswordStrength(password)

  const inputCls = (hasErr: boolean) =>
    `w-full h-[52px] rounded-[10px] border px-4 text-[15px] bg-white placeholder:text-text-secondary/60 outline-none transition-colors ${
      hasErr
        ? 'border-error focus:ring-1 focus:ring-error'
        : 'border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
    }`

  async function afterAuth(uid: string, userEmail: string) {
    setAuthCookie(uid)
    await saveRole(uid, userEmail, roleParam)
    const path = await resolveRedirect(uid, roleParam, redirectParam)
    router.push(path)
  }

  const handleEmailSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setSubmitting(true)
    setError('')
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      await afterAuth(user.uid, user.email ?? email)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password.')
      } else {
        setError('Sign in failed. Please try again.')
      }
      setSubmitting(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, roleParam, redirectParam])

  const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)
    setError('')
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await afterAuth(user.uid, user.email ?? email)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try signing in.')
        setTab('signin')
      } else {
        setError('Account creation failed. Please try again.')
      }
      setSubmitting(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, roleParam, redirectParam])

  const handleGoogle = useCallback(async () => {
    setSubmitting(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      await afterAuth(result.user.uid, result.user.email ?? '')
    } catch {
      setError('Google sign-in failed. Please try again.')
      setSubmitting(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleParam, redirectParam])

  const roleLabel = roleParam === 'provider' ? 'provider' : 'requestor'
  const title = tab === 'signin'
    ? `Sign in as a ${roleLabel}`
    : `Create your ${roleLabel} account`

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-primary hover:bg-surface-gray transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[20px] font-bold text-brand-primary tracking-tight">SAVIS</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">

          {/* Role badge */}
          <div className="flex justify-center mb-4">
            <span
              className="px-3 py-1 rounded-full text-[13px] font-semibold text-white"
              style={{ background: roleParam === 'provider' ? '#640D5F' : '#D91656' }}
            >
              {roleParam === 'provider' ? 'Provider account' : 'Requestor account'}
            </span>
          </div>

          <h1 className="text-[22px] font-bold text-text-primary text-center mb-1">{title}</h1>
          <p className="text-[14px] text-text-secondary text-center mb-6">
            {tab === 'signin'
              ? 'Welcome back. Sign in to continue.'
              : 'Join SAVIS — it\'s free and takes under 2 minutes.'}
          </p>

          {/* Tab switcher */}
          <div className="flex bg-surface-gray rounded-[10px] p-1 gap-1 mb-6">
            {(['signin', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-medium transition-all ${
                  tab === t ? 'bg-white text-brand-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {t === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full h-[52px] rounded-[10px] bg-white border border-[#DADCE0] flex items-center justify-center gap-3 text-[15px] font-medium text-text-primary hover:bg-gray-50 transition-colors disabled:opacity-60 mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-text-secondary whitespace-nowrap">or with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={tab === 'signin' ? handleEmailSignIn : handleEmailSignUp} noValidate className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@example.com"
                className={inputCls(false)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder={tab === 'signin' ? 'Your password' : 'Create a password'}
                  className={inputCls(false)}
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

              {/* Password strength (sign-up only) */}
              {tab === 'signup' && password.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength ? STRENGTH_COLOR[strength] : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${STRENGTH_COLOR[strength].replace('bg-', 'text-')}`}>
                    {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[13px] text-error text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
            >
              {submitting
                ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                : (tab === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          {tab === 'signin' && (
            <p className="text-center text-[13px] text-text-secondary mt-4">
              New to SAVIS?{' '}
              <button
                onClick={() => { setTab('signup'); setError('') }}
                className="text-brand-primary font-medium hover:underline"
              >
                Create an account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page export (wraps in Suspense for useSearchParams) ─────────────────────

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-gray flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  )
}
