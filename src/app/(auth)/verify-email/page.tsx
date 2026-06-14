'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Envelope, ArrowCounterClockwise, ShieldCheck } from 'phosphor-react'
import Link from 'next/link'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') ?? 'your email'

  const RESEND_COOLDOWN = 60
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [resent, setResent] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleResend = async () => {
    if (countdown > 0) return
    const user = auth.currentUser
    if (user) {
      await sendEmailVerification(user).catch(() => {})
    }
    setResent(true)
    setCountdown(RESEND_COOLDOWN)
  }

  const handleVerified = async () => {
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }
    await user.reload()
    if (user.emailVerified) {
      router.push('/')
    } else {
      setVerifyError("Your email isn't verified yet. Please click the link in the email we sent you.")
    }
  }

  return (
    <div className="min-h-screen bg-surface-gray flex">
      <div className="hidden lg:flex lg:w-[40%] min-h-screen flex-col justify-between p-10"
        style={{ background: 'linear-gradient(160deg, #640D5F 0%, #D91656 60%, #EB5B00 100%)' }}>
        <span className="text-white text-[22px] font-bold font-display">SAVIS</span>

        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 space-y-5">
            <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
              <Envelope size={28} weight="regular" className="text-white" />
            </div>
            <h2 className="text-white text-[22px] font-bold font-display leading-tight">One last step</h2>
            <p className="text-white/80 text-[15px] font-body leading-relaxed">
              We send a verification link to make sure your email is real and your account is secure. It only takes a second.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { icon: '🛡️', text: 'Keeps your account secure' },
                { icon: '📧', text: 'No spam — just the one email' },
                { icon: '⏰', text: 'Link expires after 24 hours' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="text-white/80 text-[15px] font-body">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-white/40 text-[13px] font-body">© 2026 SAVIS Technologies Ltd.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[480px] mb-4 lg:hidden">
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

        <div className="w-full max-w-[480px] flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center">
              <Envelope size={40} weight="regular" className="text-brand-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center border-2 border-white">
              <ShieldCheck size={16} weight="fill" className="text-white" />
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-text-primary font-display mb-2">Check your inbox</h1>
          <p className="text-[15px] text-text-secondary font-body mb-1">We sent a verification link to</p>
          <p className="text-[15px] font-semibold text-brand-primary font-body mb-6 break-all">{email}</p>

          <div className="w-full bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border p-5 mb-6 text-left">
            <p className="text-[15px] font-semibold text-text-primary font-body mb-4">What to do next</p>
            <ol className="space-y-3">
              {[
                'Open your email app',
                'Find the email from SAVIS',
                'Tap the verification link inside',
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-light text-brand-primary text-[12px] font-bold font-body flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[15px] text-text-primary font-body">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-[13px] text-text-secondary font-body mt-4">
              • Check your spam folder if you can't find it
            </p>
          </div>

          {verifyError && (
            <p className="w-full text-[13px] text-error font-body bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3 text-left">
              {verifyError}
            </p>
          )}

          <button
            onClick={handleVerified}
            className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold font-body flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3"
          >
            I've verified my email
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={handleResend}
            disabled={countdown > 0}
            className="w-full h-[52px] rounded-[10px] border border-border bg-white text-[15px] font-medium font-body flex items-center justify-center gap-2 hover:bg-surface-gray transition-colors disabled:opacity-50 mb-4"
          >
            <ArrowCounterClockwise size={18} className="text-text-secondary" />
            {countdown > 0 ? `Resend in ${countdown}s` : (resent ? 'Email sent!' : 'Resend verification email')}
          </button>

          <div className="flex items-center gap-4 text-[14px]">
            <button onClick={() => router.back()} className="text-brand-primary font-medium hover:underline font-body">
              Wrong email? Go back
            </button>
            <div className="w-px h-4 bg-border" />
            <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors font-body">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-gray flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  )
}
