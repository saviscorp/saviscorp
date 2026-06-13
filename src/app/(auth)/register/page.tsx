'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { setAuthCookie } from '@/lib/session'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

async function createUserDoc(uid: string, name: string, email: string) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role: null,
    createdAt: serverTimestamp(),
  })
}

const GoogleIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError('')
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await updateProfile(user, { displayName: data.name })
      setAuthCookie(user.uid)
      // Best-effort Firestore write — don't block auth if it fails
      createUserDoc(user.uid, data.name, data.email).catch(() => {})
      router.push('/')
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const info = getAdditionalUserInfo(result)
      if (info?.isNewUser) {
        await createUserDoc(
          result.user.uid,
          result.user.displayName ?? '',
          result.user.email ?? ''
        )
      }
      setAuthCookie(result.user.uid)
      router.push('/')
    } catch {
      setError('Google sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-green-700 tracking-tight">
            SAVIS
          </Link>
          <p className="text-slate-500 mt-1 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 border-t border-slate-200" />
            or sign up with email
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                {...register('name')}
                type="text"
                autoComplete="name"
                placeholder="Jane Wanjiku"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-green-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
