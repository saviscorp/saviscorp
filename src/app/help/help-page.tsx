'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CaretLeft,
  EnvelopeSimple,
  Phone,
  ChatCircle,
  CheckCircle,
  CircleNotch,
  Lock,
} from 'phosphor-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/hooks/useAuth'

const TOPICS = [
  { value: '', label: 'Select a topic…' },
  { value: 'booking_issue', label: 'Booking issue' },
  { value: 'payment_problem', label: 'Payment problem' },
  { value: 'account_access', label: 'Account access' },
  { value: 'report_provider', label: 'Report a provider' },
  { value: 'refund_request', label: 'Refund request' },
  { value: 'other', label: 'Other' },
]

export default function HelpPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fullName = user?.displayName ?? ''
  const email = user?.email ?? ''
  const canSubmit = topic !== '' && message.length >= 20

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    try {
      await addDoc(collection(db, 'support_requests'), {
        userId: user?.uid ?? null,
        fullName,
        email,
        topic,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
        resolvedAt: null,
        adminNotes: null,
      })
      setSubmitted(true)
    } catch {
      setError('Failed to send your message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-gray">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3 max-w-[640px] mx-auto lg:max-w-[960px]">
          <button
            onClick={() => router.back()}
            className="text-primary hover:text-brand-primary transition-colors focus:outline-none"
            aria-label="Go back"
          >
            <CaretLeft size={24} />
          </button>
          <span className="text-[17px] font-medium text-primary flex-1 text-center">
            Help &amp; Support
          </span>
          <span className="w-6" aria-hidden="true" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[640px] mx-auto px-4 py-4 space-y-4 lg:max-w-[960px] lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start lg:space-y-0 lg:pt-6 lg:pb-12">
        {/* Card 1 — How to reach us */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">
            How to reach us
          </p>

          <div className="py-3 px-4 flex items-center gap-3 border-b border-border">
            <div className="h-9 w-9 rounded-full bg-brand-light flex-shrink-0 flex items-center justify-center">
              <EnvelopeSimple size={18} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-primary">Email support</p>
              <a href="mailto:support@savis.co.ke" className="text-[13px] text-brand-primary underline hover:opacity-80 transition-opacity">
                support@savis.co.ke
              </a>
            </div>
          </div>

          <div className="py-3 px-4 flex items-center gap-3 border-b border-border">
            <div className="h-9 w-9 rounded-full bg-brand-light flex-shrink-0 flex items-center justify-center">
              <Phone size={18} className="text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-primary">Phone (Mon–Fri, 8am–6pm)</p>
              <a href="tel:+254700000000" className="text-[13px] text-brand-primary underline hover:opacity-80 transition-opacity">
                +254 700 000 000
              </a>
            </div>
          </div>

          <div className="py-3 px-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface-gray flex-shrink-0 flex items-center justify-center">
              <ChatCircle size={18} className="text-disabled" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] text-disabled">Live chat</p>
            </div>
            <span className="bg-gold-light text-warning text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0">
              Coming soon
            </span>
          </div>

          <div className="border-t border-border px-4 py-3">
            <p className="text-[13px] text-secondary italic text-center">
              We typically respond within 24 hours on business days.
            </p>
          </div>
        </div>

        {/* Card 2 — Send us a message */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">
            Send us a message
          </p>

          {!submitted ? (
            <div className="px-4 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-secondary block">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full h-[52px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-primary appearance-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                >
                  {TOPICS.map((t) => (
                    <option key={t.value} value={t.value} disabled={t.value === ''}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-secondary block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in as much detail as possible. Include any relevant booking references."
                  maxLength={1000}
                  className="w-full min-h-[140px] px-3 py-3 rounded-[10px] border border-border text-[15px] text-primary placeholder:text-disabled resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                />
                <p className="text-right text-[12px] text-secondary">{message.length}/1000</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-secondary block">Your name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    className="w-full h-[52px] px-3 pr-10 rounded-[10px] border border-border bg-surface-gray text-[15px] text-primary cursor-default focus:outline-none"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-secondary block">Email</label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    readOnly
                    className="w-full h-[52px] px-3 pr-10 rounded-[10px] border border-border bg-surface-gray text-[15px] text-primary cursor-default focus:outline-none"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled" size={16} />
                </div>
              </div>

              {error && <p className="text-[13px] text-error bg-error-light px-3 py-2 rounded-lg">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className={`w-full h-[52px] rounded-[10px] text-[15px] font-medium transition-opacity flex items-center justify-center gap-2 ${
                  !canSubmit ? 'bg-surface-gray text-disabled cursor-not-allowed'
                  : loading ? 'bg-brand-action text-white opacity-70 cursor-not-allowed'
                  : 'bg-brand-action text-white hover:opacity-90 cursor-pointer'
                }`}
              >
                {loading ? <><CircleNotch size={16} className="animate-spin" />Sending…</> : 'Send message'}
              </button>

              <p className="text-[13px] text-secondary text-center mt-3">
                Or email us directly at{' '}
                <a href="mailto:support@savis.co.ke" className="text-brand-primary underline hover:opacity-80 transition-opacity">
                  support@savis.co.ke
                </a>
              </p>
            </div>
          ) : (
            <div className="px-6 py-8 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-success-light flex items-center justify-center mx-auto">
                <CheckCircle size={48} className="text-success" weight="fill" />
              </div>
              <h2 className="text-[20px] font-bold text-primary mt-5">Message sent!</h2>
              <p className="text-[15px] text-secondary mt-2 max-w-xs">
                We&apos;ll get back to you at{' '}
                <span className="font-medium text-primary">{email}</span> within 24 hours on business days.
              </p>
              <div className="w-full border-t border-border mt-6 pt-6">
                <button
                  onClick={() => router.push('/profile')}
                  className="text-[15px] text-brand-primary font-medium hover:opacity-80 transition-opacity focus:outline-none"
                >
                  Back to profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
