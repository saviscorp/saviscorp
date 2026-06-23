'use client';

// src/app/services/[id]/book/page.tsx
// Screens 1, 2, 3, 5, 13 — booking form across all location modes, with the
// no-phone banner and the slot-taken error sheet.
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Car,
  Info,
  CalendarX,
  VideoCamera,
} from '@phosphor-icons/react';
import { colors } from '@/lib/booking-theme';
import type { ServiceSummary, BookingDraft } from '@/lib/booking-types';
import { ScreenHeader, ServiceSummaryBar, NoPhoneBanner } from '@/components/booking/Shared';
import BottomSheet from '@/components/booking/BottomSheet';

// TODO(claude-code): replace with real Firestore reads.
// - Load the service document from `services/{id}` to build ServiceSummary.
// - Read the current user's `phone` field from `users/{uid}` for hasPhone.
// - Reuse the existing Sprint 3 Calendar + TimeSlot components in the marked spots.
const MOCK_SERVICE: ServiceSummary = {
  id: 'demo',
  providerId: 'demo-provider',
  title: 'Home Deep Cleaning',
  providerName: 'Amina Wanjiku',
  providerVerified: true,
  locationMode: 'goes_to_client', // switch to test variants
  serviceFee: 1200,
  providerArea: 'Yaya Centre area, Kilimani',
  providerDistanceKm: 3.2,
  providerEtaMin: 12,
};

const modePill: Record<ServiceSummary['locationMode'], { label: string; bg: string; fg: string }> = {
  goes_to_client: { label: 'Provider comes to you', bg: colors.brandWarm, fg: colors.white },
  client_goes_to_provider: { label: 'You travel', bg: colors.brandWarm, fg: colors.white },
  virtual: { label: 'Virtual', bg: colors.brandWarm, fg: colors.white },
};

export default function BookingFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const service = MOCK_SERVICE; // TODO(claude-code)
  const hasPhone = true; // TODO(claude-code): from user profile

  const [draft, setDraft] = useState<BookingDraft>({
    serviceId: service.id,
    date: null,
    time: null,
    clientLocation: '',
    specialInstructions: '',
  });
  const [slotTakenOpen, setSlotTakenOpen] = useState(false);

  const canReview = useMemo(() => {
    if (!hasPhone) return false;
    if (!draft.date || !draft.time) return false;
    if (service.locationMode === 'goes_to_client' && !draft.clientLocation?.trim()) return false;
    return true;
  }, [draft, hasPhone, service.locationMode]);

  const label = (text: string) => (
    <label className="block" style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary }}>
      {text}
    </label>
  );

  const handleReview = () => {
    // TODO(claude-code): before navigating, re-check slot availability in
    // Firestore (a transaction on the provider's schedule). If the slot was
    // taken between load and submit, call setSlotTakenOpen(true) instead.
    router.push(`/services/${params.id}/book/review`);
  };

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader title="Book service" onBack={() => router.back()} />
      <div className="mx-auto max-w-[560px]">
        <ServiceSummaryBar
          title={service.title}
          providerName={service.providerName}
          pill={modePill[service.locationMode]}
        />

        {!hasPhone && <div className="pt-4"><NoPhoneBanner onAdd={() => router.push('/profile/edit')} /></div>}

        <div className="space-y-5 px-4 py-4">
          {/* Date — reuse Sprint 3 Calendar */}
          <div>
            {label('Choose a date')}
            <div
              className="mt-2 rounded-xl p-3"
              style={{ background: colors.white, border: `1px solid ${colors.border}` }}
            >
              {/* TODO(claude-code): <Calendar value={draft.date} onChange={(d) => setDraft({ ...draft, date: d })} blockedDates={...} /> */}
              <p style={{ fontSize: 13, color: colors.textDisabled }}>[ Calendar picker — Sprint 3 component ]</p>
            </div>
          </div>

          {/* Time — reuse Sprint 3 TimeSlot chips */}
          <div>
            {label('Preferred time')}
            <div className="mt-2 flex flex-wrap gap-2">
              {/* TODO(claude-code): <TimeSlotChips value={draft.time} onChange={(t) => setDraft({ ...draft, time: t })} /> */}
              {['9:00am', '10:00am', '2:00pm'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraft({ ...draft, time: t })}
                  className="rounded-full px-4 py-2"
                  style={{
                    fontSize: 13,
                    border: `1px solid ${draft.time === t ? colors.brandPrimary : colors.border}`,
                    background: draft.time === t ? colors.brandLight : colors.white,
                    color: draft.time === t ? colors.brandPrimary : colors.textPrimary,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Location section — varies by mode */}
          {service.locationMode === 'goes_to_client' && (
            <div>
              {label('Your location')}
              <input
                value={draft.clientLocation}
                onChange={(e) => setDraft({ ...draft, clientLocation: e.target.value })}
                placeholder="e.g. 14 Westlands Road, Nairobi"
                className="mt-1 w-full rounded-[10px] px-3 outline-none"
                style={{ height: 52, border: `1px solid ${colors.border}`, fontSize: 15, color: colors.textPrimary }}
              />
              <button
                type="button"
                onClick={() => {
                  // TODO(claude-code): use the existing reverse-geocode helper from earlier work.
                  setDraft({ ...draft, clientLocation: 'Current location' });
                }}
                className="mt-2 inline-flex items-center gap-1"
                style={{ fontSize: 13, color: colors.brandPrimary, height: 36 }}
              >
                <MapPin size={14} color={colors.brandPrimary} weight="bold" /> Use my location
              </button>
              <p className="mt-1" style={{ fontSize: 12, color: colors.textSecondary }}>
                The provider will use this to travel to you.
              </p>
            </div>
          )}

          {service.locationMode === 'client_goes_to_provider' && (
            <div>
              {label('Provider location')}
              <div
                className="mt-1 overflow-hidden rounded-xl"
                style={{ background: colors.white, border: `1px solid ${colors.border}` }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ height: 120, background: colors.surfaceGray }}
                >
                  {/* TODO(claude-code): static map thumbnail with brand-primary pin */}
                  <MapPin size={28} color={colors.brandPrimary} weight="fill" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} color={colors.brandPrimary} weight="fill" />
                    <span style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
                      {service.providerArea}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <Car size={14} color={colors.textSecondary} />
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>
                      ~{service.providerDistanceKm} km · ~{service.providerEtaMin} min by car
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <Info size={12} color={colors.textSecondary} />
                    <span style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                      Exact address provided after booking is confirmed.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {service.locationMode === 'virtual' && (
            <div className="rounded-xl p-4" style={{ background: colors.brandLight }}>
              <div className="flex flex-col items-center text-center">
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ height: 48, width: 48, background: colors.white }}
                >
                  <VideoCamera size={26} color={colors.brandPrimary} weight="fill" />
                </span>
                <p className="mt-3" style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
                  This is a virtual session
                </p>
                <p className="mt-1" style={{ fontSize: 13, color: colors.textSecondary }}>
                  A Google Meet link will be created automatically once your booking is confirmed.
                </p>
                <p className="mt-2" style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                  You&rsquo;ll receive the link by email and in the app.
                </p>
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            {label('Special instructions (optional)')}
            <textarea
              value={draft.specialInstructions}
              maxLength={500}
              onChange={(e) => setDraft({ ...draft, specialInstructions: e.target.value })}
              placeholder="Anything the provider should know?"
              className="mt-1 w-full rounded-[10px] p-3 outline-none"
              style={{ height: 96, border: `1px solid ${colors.border}`, fontSize: 15, color: colors.textPrimary, resize: 'none' }}
            />
            <p className="mt-1 text-right" style={{ fontSize: 12, color: colors.textSecondary }}>
              {draft.specialInstructions?.length ?? 0}/500
            </p>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div
          className="sticky bottom-0 px-4 py-3"
          style={{ background: colors.surfaceGray, borderTop: `1px solid ${colors.border}` }}
        >
          <button
            type="button"
            disabled={!canReview}
            onClick={handleReview}
            title={!hasPhone ? 'Add a phone number first' : undefined}
            className="w-full rounded-[10px]"
            style={{
              height: 52,
              background: colors.brandPrimary,
              color: colors.white,
              fontSize: 15,
              fontWeight: 600,
              opacity: canReview ? 1 : 0.5,
              cursor: canReview ? 'pointer' : 'not-allowed',
            }}
          >
            Review booking
          </button>
        </div>
      </div>

      {/* Screen 13 — slot taken */}
      <BottomSheet open={slotTakenOpen} onClose={() => setSlotTakenOpen(false)}>
        <div className="flex flex-col items-center text-center">
          <span
            className="flex items-center justify-center rounded-full"
            style={{ height: 56, width: 56, background: colors.errorLight }}
          >
            <CalendarX size={32} color={colors.error} weight="fill" />
          </span>
          <p className="mt-4" style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
            That slot was just taken
          </p>
          <p className="mt-1" style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 280 }}>
            Someone else booked this time slot while you were filling in the form.
          </p>
          <button
            type="button"
            onClick={() => setSlotTakenOpen(false)}
            className="mt-6 w-full rounded-[10px]"
            style={{ height: 52, background: colors.brandPrimary, color: colors.white, fontSize: 15, fontWeight: 600 }}
          >
            Choose another time
          </button>
          <button
            type="button"
            onClick={() => router.push(`/services/${params.id}`)}
            className="mt-2 w-full rounded-[10px]"
            style={{ height: 52, background: 'transparent', color: colors.textSecondary, fontSize: 15, border: `1px solid ${colors.border}` }}
          >
            Go back to listing
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
