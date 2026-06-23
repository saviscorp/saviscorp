'use client';

// src/app/services/[id]/book/review/page.tsx
// Screen 4 — Booking review. Hydrates from the sessionStorage draft written by
// the form screen. "Send booking request" creates the doc in awaiting_payment
// (auto-confirm launch flow) and routes straight to the payment screen.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CalendarBlank, Clock, MapPin, Note, SealCheck, VideoCamera, Warning,
} from '@phosphor-icons/react';
import { colors, computeCost } from '@/lib/booking-theme';
import type { ServiceLocationMode } from '@/lib/booking-types';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import { ScreenHeader } from '@/components/booking/Shared';
import { useAuth } from '@/lib/hooks/useAuth';
import { createBookingAwaitingPayment } from '@/lib/firebase/bookings';

// ─── Draft shape stored in sessionStorage by the form screen ───────────────────

interface StoredDraft {
  serviceId: string;
  providerId: string;
  serviceTitle: string;
  providerName: string;
  providerVerified: boolean;
  serviceFee: number;
  locationMode: ServiceLocationMode;
  date: string | null;           // ISO "YYYY-MM-DD"
  time: string | null;           // "HH:MM" or "flexible"
  clientLocation?: string;
  specialInstructions?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmt12(hhmm: string): string {
  if (hhmm === 'flexible') return 'Flexible time';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
}

function locationLabel(draft: StoredDraft): string {
  if (draft.locationMode === 'virtual') return 'Virtual · Google Meet';
  if (draft.locationMode === 'goes_to_client') return draft.clientLocation || 'Your location';
  return 'Provider location (address shared after confirmation)';
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BookingReviewPage() {
  const router      = useRouter();
  const params      = useParams<{ id: string }>();
  const { user }    = useAuth();

  const [draft,      setDraft]      = useState<StoredDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // Hydrate from sessionStorage (written by the form screen)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('savis_booking_draft');
      if (!raw) { router.replace(`/services/${params.id}/book`); return; }
      const parsed: StoredDraft = JSON.parse(raw);
      // Guard: draft must belong to this service
      if (parsed.serviceId !== params.id) {
        sessionStorage.removeItem('savis_booking_draft');
        router.replace(`/services/${params.id}/book`);
        return;
      }
      setDraft(parsed);
    } catch {
      router.replace(`/services/${params.id}/book`);
    }
  }, [params.id, router]);

  if (!draft) {
    // Briefly blank while we redirect; no flash since useEffect runs post-mount
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
        <ScreenHeader title="Review booking" onBack={() => router.back()} />
      </div>
    );
  }

  const cost      = computeCost(draft.serviceFee);
  const isVirtual = draft.locationMode === 'virtual';

  const detailRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 12, color: colors.textSecondary }}>{label}</p>
        <p style={{ fontSize: 14, color: colors.textPrimary }}>{value}</p>
      </div>
    </div>
  );

  const sendRequest = async () => {
    if (!user || !draft.date || !draft.time || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const deadline = Date.now() + 15 * 60 * 1000; // 15-minute payment window
      const { id } = await createBookingAwaitingPayment({
        providerId:          draft.providerId,
        customerId:          user.uid,
        serviceId:           draft.serviceId,
        serviceTitle:        draft.serviceTitle,
        providerName:        draft.providerName,
        locationMode:        draft.locationMode,
        preferredDate:       draft.date,
        preferredTime:       draft.time,
        clientLocation:      draft.clientLocation,
        specialInstructions: draft.specialInstructions,
        serviceFee:          draft.serviceFee,
        total:               cost.total,
        paymentDeadline:     deadline,
      });
      sessionStorage.removeItem('savis_booking_draft');
      router.push(`/bookings/${id}/pay`);
    } catch (e) {
      console.error('[BookingReview] sendRequest error:', e);
      setError('Failed to send booking request. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader title="Review booking" onBack={() => router.back()} />
      <div className="mx-auto max-w-[560px] space-y-4 px-4 py-4">
        {/* Service card */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
        >
          <div style={{ height: 110, background: colors.brandLight }} />
          <div className="p-4">
            <p style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>
              {draft.serviceTitle}
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span style={{ fontSize: 14, color: colors.textSecondary }}>{draft.providerName}</span>
              {draft.providerVerified && (
                <SealCheck size={15} color={colors.brandPrimary} weight="fill" />
              )}
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div
          className="rounded-xl p-4"
          style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: colors.textSecondary }}>
            BOOKING DETAILS
          </p>
          <div className="mt-1">
            {detailRow(
              <CalendarBlank size={18} color={colors.textSecondary} />,
              'Date',
              draft.date ? formatDateLong(draft.date) : '—',
            )}
            {detailRow(
              <Clock size={18} color={colors.textSecondary} />,
              'Time',
              draft.time ? fmt12(draft.time) : '—',
            )}
            {isVirtual
              ? detailRow(
                  <VideoCamera size={18} color={colors.brandPrimary} weight="fill" />,
                  'Location',
                  'Virtual · Google Meet',
                )
              : detailRow(
                  <MapPin size={18} color={colors.textSecondary} />,
                  'Location',
                  locationLabel(draft),
                )}
            {draft.specialInstructions &&
              detailRow(
                <Note size={18} color={colors.textSecondary} />,
                'Note',
                draft.specialInstructions,
              )}
          </div>
        </div>

        {/* Cost summary */}
        <CostBreakdownCard cost={cost} />

        {/* Auto-confirm note — payment window opens immediately */}
        <div className="rounded-xl p-3" style={{ background: colors.goldLight }}>
          <div className="flex items-center gap-2">
            <Clock size={16} color={colors.warning} weight="fill" />
            <span style={{ fontSize: 13, color: colors.warning }}>
              Payment window opens immediately on confirmation.
            </span>
          </div>
          <p className="mt-1" style={{ fontSize: 12, color: colors.textSecondary }}>
            You will have 15 minutes to complete the M-Pesa payment.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: colors.errorLight }}>
            <Warning size={16} color={colors.error} weight="fill" />
            <p style={{ fontSize: 13, color: colors.error }}>{error}</p>
          </div>
        )}

        {/* Buttons */}
        <button
          type="button"
          onClick={sendRequest}
          disabled={submitting}
          className="w-full rounded-[10px]"
          style={{
            height: 52,
            background: colors.brandAction,
            color: colors.white,
            fontSize: 15,
            fontWeight: 600,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Sending request…' : 'Send booking request'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/services/${params.id}/book`)}
          className="w-full rounded-[10px]"
          style={{ height: 52, background: 'transparent', color: colors.textSecondary, fontSize: 15, border: `1px solid ${colors.border}` }}
        >
          Go back and edit
        </button>
      </div>
    </div>
  );
}
