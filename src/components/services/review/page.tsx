'use client';

// src/app/services/[id]/book/review/page.tsx
// Screen 4 — Booking review. Shows service, details, cost summary (collapsed by
// default), and the provider-response note. CTA sends the request (no payment
// yet — payment only after the provider confirms).
import { useParams, useRouter } from 'next/navigation';
import { CalendarBlank, Clock, MapPin, Note, SealCheck, VideoCamera } from '@phosphor-icons/react';
import { colors, computeCost } from '@/lib/booking-theme';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import { ScreenHeader } from '@/components/booking/Shared';

// TODO(claude-code): hydrate from the draft created on the form screen. Carry
// the draft via the existing page-param pattern (serviceId + draft id), then
// read the service doc + draft to populate this screen.
const MOCK = {
  title: 'Home Deep Cleaning',
  providerName: 'Amina Wanjiku',
  verified: true,
  isVirtual: false,
  date: 'Monday, 24 June 2025',
  time: '10:00am',
  location: '14 Westlands Road, Westlands',
  note: 'I have two cats. Please use eco-friendly products.',
  serviceFee: 1200,
};

export default function BookingReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cost = computeCost(MOCK.serviceFee);

  const detailRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 12, color: colors.textSecondary }}>{label}</p>
        <p style={{ fontSize: 14, color: colors.textPrimary }}>{value}</p>
      </div>
    </div>
  );

  const sendRequest = () => {
    // TODO(claude-code): create the booking doc with state 'pending_provider'
    // (auto-confirm flow means provider confirm gate is a no-op at launch — if
    // auto-confirm is on, jump straight to 'awaiting_payment' and route to /pay).
    router.push('/bookings');
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
            <p style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>{MOCK.title}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <span style={{ fontSize: 14, color: colors.textSecondary }}>{MOCK.providerName}</span>
              {MOCK.verified && <SealCheck size={15} color={colors.brandPrimary} weight="fill" />}
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
            {detailRow(<CalendarBlank size={18} color={colors.textSecondary} />, 'Date', MOCK.date)}
            {detailRow(<Clock size={18} color={colors.textSecondary} />, 'Time', MOCK.time)}
            {MOCK.isVirtual
              ? detailRow(<VideoCamera size={18} color={colors.brandPrimary} weight="fill" />, 'Location', 'Virtual · Google Meet')
              : detailRow(<MapPin size={18} color={colors.textSecondary} />, 'Location', MOCK.location)}
            {MOCK.note && detailRow(<Note size={18} color={colors.textSecondary} />, 'Note', MOCK.note)}
          </div>
        </div>

        {/* Cost summary — collapsed by default */}
        <CostBreakdownCard cost={cost} />

        {/* Provider response note */}
        <div className="rounded-xl p-3" style={{ background: colors.goldLight }}>
          <div className="flex items-center gap-2">
            <Clock size={16} color={colors.warning} weight="fill" />
            <span style={{ fontSize: 13, color: colors.warning }}>
              {MOCK.providerName.split(' ')[0]} typically responds within 2 hours.
            </span>
          </div>
          <p className="mt-1" style={{ fontSize: 12, color: colors.textSecondary }}>
            Payment is only requested after the provider confirms.
          </p>
        </div>

        {/* Buttons */}
        <button
          type="button"
          onClick={sendRequest}
          className="w-full rounded-[10px]"
          style={{ height: 52, background: colors.brandAction, color: colors.white, fontSize: 15, fontWeight: 600 }}
        >
          Send booking request
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
