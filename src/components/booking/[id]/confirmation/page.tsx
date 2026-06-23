'use client';

// src/app/bookings/[id]/confirmation/page.tsx
// Screens 10 & 11 — confirmation (standard + virtual).
// providerPhone and meetLink are post-payment fields written by the callback;
// they are null on every other status and only read here.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle, Phone, SealCheck, Star } from '@phosphor-icons/react';
import { db } from '@/lib/firebase';
import { colors, computeCost, formatKES } from '@/lib/booking-theme';
import ConfirmationAnimation from '@/components/booking/ConfirmationAnimation';
import GoogleMeetCard from '@/components/booking/GoogleMeetCard';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import { ScreenHeader } from '@/components/booking/Shared';

// ─── Type ───────────────────────────────────────────────────────────────────────

interface ConfirmedBooking {
  ref: string;
  status: string;
  serviceTitle: string;
  providerName: string;
  providerVerified?: boolean;
  locationMode: string;
  preferredDate: string;
  preferredTime: string;
  clientLocation?: string;
  serviceFee: number;
  total: number;
  paymentRef: string | null;
  providerPhone: string | null;  // revealed by the M-Pesa callback on confirmation
  meetLink: string | null;       // virtual bookings only; created post-payment
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTimeLong(date: string, time: string): string {
  const dayStr = new Date(date + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  if (time === 'flexible') return `${dayStr} · Flexible time`;
  const [h, m] = time.split(':').map(Number);
  const t = `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
  return `${dayStr} · ${t}`;
}

function locationDisplay(b: ConfirmedBooking): string {
  if (b.locationMode === 'goes_to_client') return b.clientLocation || 'Your location';
  if (b.locationMode === 'client_goes_to_provider') return 'Provider location (address sent by provider)';
  return ''; // virtual — handled by GoogleMeetCard
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();

  const [booking,   setBooking]   = useState<ConfirmedBooking | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [waiting,   setWaiting]   = useState(false); // briefly true if status isn't 'confirmed' yet

  useEffect(() => {
    if (!params.id) return;

    const unsub = onSnapshot(
      doc(db, 'bookings', params.id),
      (snap) => {
        if (!snap.exists()) { setLoadError(true); return; }
        const data = snap.data() as ConfirmedBooking;

        if (data.status === 'confirmed' || data.status === 'in_progress' || data.status === 'completed') {
          setBooking(data);
          setWaiting(false);
        } else if (data.status === 'awaiting_payment' || data.status === 'payment_pending') {
          // Still paying — show a brief "waiting for payment" skeleton
          setWaiting(true);
        } else {
          // Unexpected status (expired, failed, etc.) — send user back
          router.replace(`/bookings/${params.id}/pay`);
        }
      },
      () => setLoadError(true),
    );

    return unsub;
  }, [params.id, router]);

  // ── Loading / error states ────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="rounded-xl p-6 text-center" style={{ background: colors.white, maxWidth: 300 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>Booking not found</p>
          <button
            type="button"
            onClick={() => router.push('/bookings')}
            className="mt-4 rounded-[10px] px-5"
            style={{ height: 44, background: colors.brandPrimary, color: colors.white, fontSize: 14 }}
          >
            My bookings
          </button>
        </div>
      </div>
    );
  }

  if (!booking || waiting) {
    // Skeleton — shown briefly if user lands here before the callback fires
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
        <div className="sticky top-0 z-20 flex items-center px-4 py-3"
          style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ width: 30 }} />
          <div className="flex-1 h-4 rounded animate-pulse mx-4" style={{ background: colors.border }} />
          <span style={{ width: 30 }} />
        </div>
        <div className="mx-auto max-w-[560px] px-4 pt-10 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full animate-pulse" style={{ background: colors.brandLight }} />
          <div className="h-5 w-40 rounded animate-pulse" style={{ background: colors.border }} />
          {[200, 160, 140].map((w) => (
            <div key={w} className="h-24 w-full rounded-xl animate-pulse"
              style={{ background: colors.white, maxWidth: w * 3 }} />
          ))}
        </div>
      </div>
    );
  }

  const cost      = computeCost(booking.serviceFee);
  const isVirtual = booking.locationMode === 'virtual';

  // ── Helper renderers ──────────────────────────────────────────────────────────

  const card = (children: React.ReactNode, bg: string = colors.white) => (
    <div
      className="rounded-xl p-4"
      style={{
        background: bg,
        boxShadow: bg === colors.white ? '0 1px 2px rgba(20,15,30,0.06)' : 'none',
      }}
    >
      {children}
    </div>
  );

  const nextRow = (icon: React.ReactNode, text: string) => (
    <div className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span style={{ fontSize: 14, color: colors.textPrimary }}>{text}</span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader title="Booking confirmed" />

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
            style={{
              background: colors.surfaceGray,
              fontSize: 13,
              fontFamily: 'monospace',
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
          >
            Ref: {booking.ref}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {/* Booking details */}
          {card(
            <>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>
                  {booking.serviceTitle}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span style={{ fontSize: 14, color: colors.textSecondary }}>{booking.providerName}</span>
                {booking.providerVerified !== false && (
                  <SealCheck size={15} color={colors.brandPrimary} weight="fill" />
                )}
              </div>
              <div className="my-3" style={{ borderTop: `1px solid ${colors.border}` }} />

              {/* Date + time */}
              <p style={{ fontSize: 14, color: colors.textPrimary }}>
                {formatDateTimeLong(booking.preferredDate, booking.preferredTime)}
              </p>

              {/* Location row: Google Meet card for virtual, plain text otherwise */}
              {isVirtual ? (
                <div className="mt-3">
                  {booking.meetLink
                    ? <GoogleMeetCard meetLink={booking.meetLink} />
                    : (
                      <p className="mt-1" style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' }}>
                        Your Google Meet link will arrive by email shortly.
                      </p>
                    )}
                </div>
              ) : (
                <p className="mt-1" style={{ fontSize: 14, color: colors.textPrimary }}>
                  {locationDisplay(booking)}
                </p>
              )}

              {/* Provider phone — only present post-payment */}
              {booking.providerPhone && (
                <a
                  href={`tel:${booking.providerPhone.replace(/\s/g, '')}`}
                  className="mt-3 inline-flex items-center gap-2"
                  style={{ fontSize: 14, color: colors.brandPrimary }}
                >
                  <Phone size={16} color={colors.brandPrimary} weight="fill" />
                  {booking.providerPhone}
                </a>
              )}
            </>,
          )}

          {/* Payment receipt */}
          {card(
            <>
              <p style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
                {formatKES(cost.total)} paid via M-Pesa
              </p>
              {booking.paymentRef && (
                <p
                  className="mt-1"
                  style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' }}
                >
                  M-Pesa ref: {booking.paymentRef}
                </p>
              )}
              <div className="mt-2">
                <CostBreakdownCard cost={cost} defaultExpanded={false} />
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
                {nextRow(
                  <CheckCircle size={18} color={colors.success} weight="fill" />,
                  'Booking confirmed and saved',
                )}
                {isVirtual
                  ? nextRow(
                      <Phone size={18} color={colors.brandPrimary} weight="fill" />,
                      'Join via Google Meet at the scheduled time. Link above and in your email.',
                    )
                  : nextRow(
                      <Phone size={18} color={colors.brandPrimary} weight="fill" />,
                      'Provider will contact you to confirm arrival time',
                    )}
                {nextRow(
                  <Star size={18} color={colors.brandGold} weight="fill" />,
                  'After the service, you can leave a review',
                )}
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
