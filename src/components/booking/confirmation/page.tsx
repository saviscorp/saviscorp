'use client';

// src/app/bookings/[id]/confirmation/page.tsx
// Screens 10 & 11 — confirmation (standard + virtual). The success animation is
// the emotional peak; the Google Meet card on virtual bookings is unmissable.
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Phone, SealCheck, Star } from '@phosphor-icons/react';
import { colors, computeCost, formatKES } from '@/lib/booking-theme';
import ConfirmationAnimation from '@/components/booking/ConfirmationAnimation';
import GoogleMeetCard from '@/components/booking/GoogleMeetCard';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import { ScreenHeader } from '@/components/booking/Shared';

// TODO(claude-code): load the confirmed booking from `bookings/{id}`.
// providerPhone + meetLink are only present post-payment.
const MOCK = {
  ref: 'BK-A3F2C9D1',
  title: 'Home Deep Cleaning',
  providerName: 'Amina Wanjiku',
  verified: true,
  isVirtual: false,
  date: 'Monday, 24 June 2025 · 10:00am',
  location: '14 Westlands Road, Nairobi',
  providerPhone: '+254 712 345 678',
  meetLink: 'https://meet.google.com/abc-defg-hij',
  serviceFee: 1200,
  mpesaRef: 'QHG7XZ2BPK',
};

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cost = computeCost(MOCK.serviceFee);

  const card = (children: React.ReactNode, bg: string = colors.white) => (
    <div className="rounded-xl p-4" style={{ background: bg, boxShadow: bg === colors.white ? '0 1px 2px rgba(20,15,30,0.06)' : 'none' }}>
      {children}
    </div>
  );

  const nextRow = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5">{icon}</span>
      <span style={{ fontSize: 14, color: colors.textPrimary }}>{text}</span>
    </div>
  );

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <div className="mx-auto max-w-[560px] px-4 pb-8 pt-10">
        {/* Animation + headline */}
        <div className="flex flex-col items-center text-center">
          <ConfirmationAnimation />
          <p className="mt-5" style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
            Booking confirmed!
          </p>
          <p className="mt-1" style={{ fontSize: 15, color: colors.textSecondary }}>
            Payment received
          </p>
          <span
            className="mt-3 rounded-full px-4 py-1.5"
            style={{ background: colors.surfaceGray, fontSize: 13, fontFamily: 'monospace', color: colors.textPrimary, border: `1px solid ${colors.border}` }}
          >
            Ref: {MOCK.ref}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {/* Booking details */}
          {card(
            <>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>{MOCK.title}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span style={{ fontSize: 14, color: colors.textSecondary }}>{MOCK.providerName}</span>
                {MOCK.verified && <SealCheck size={15} color={colors.brandPrimary} weight="fill" />}
              </div>
              <div className="my-3" style={{ borderTop: `1px solid ${colors.border}` }} />
              <p style={{ fontSize: 14, color: colors.textPrimary }}>{MOCK.date}</p>

              {MOCK.isVirtual ? (
                <div className="mt-3">
                  <GoogleMeetCard meetLink={MOCK.meetLink} />
                </div>
              ) : (
                <p className="mt-1" style={{ fontSize: 14, color: colors.textPrimary }}>
                  {MOCK.location}
                </p>
              )}

              {/* Provider contact — post-payment only */}
              <a
                href={`tel:${MOCK.providerPhone.replace(/\s/g, '')}`}
                className="mt-3 inline-flex items-center gap-2"
                style={{ fontSize: 14, color: colors.brandPrimary }}
              >
                <Phone size={16} color={colors.brandPrimary} weight="fill" />
                {MOCK.providerPhone}
              </a>
            </>,
          )}

          {/* Payment receipt */}
          {card(
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
                {formatKES(cost.total)} paid via M-Pesa
              </p>
              <p className="mt-1" style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' }}>
                M-Pesa ref: {MOCK.mpesaRef}
              </p>
              <div className="mt-2">
                <CostBreakdownCard cost={cost} />
              </div>
            </>,
          )}

          {/* What happens next */}
          {card(
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: colors.textSecondary }}>
                WHAT HAPPENS NEXT
              </p>
              <div className="mt-1">
                {nextRow(<CheckCircle size={18} color={colors.success} weight="fill" />, 'Booking confirmed and saved')}
                {MOCK.isVirtual
                  ? nextRow(<Phone size={18} color={colors.brandPrimary} weight="fill" />, 'Join via Google Meet at the scheduled time. Link above and in your email.')
                  : nextRow(<Phone size={18} color={colors.brandPrimary} weight="fill" />, 'Provider will contact you to confirm arrival time')}
                {nextRow(<Star size={18} color={colors.brandGold} weight="fill" />, 'After the service, you can leave a review')}
              </div>
            </>,
            colors.brandLight,
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => router.push('/bookings')}
            className="w-full rounded-[10px]"
            style={{ height: 52, background: colors.brandPrimary, color: colors.white, fontSize: 15, fontWeight: 600 }}
          >
            View my bookings
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full rounded-[10px]"
            style={{ height: 52, background: 'transparent', color: colors.textSecondary, fontSize: 15, border: `1px solid ${colors.border}` }}
          >
            Browse more services
          </button>
        </div>
      </div>
    </div>
  );
}
