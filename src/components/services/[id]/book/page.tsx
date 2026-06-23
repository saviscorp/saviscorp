'use client';

// src/app/services/[id]/book/page.tsx
// Screens 1, 2, 3, 5, 13 — booking form across all location modes, with the
// no-phone banner and the slot-taken error sheet.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Car,
  Info,
  CalendarX,
  VideoCamera,
  Spinner,
} from '@phosphor-icons/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { colors } from '@/lib/booking-theme';
import type { ServiceSummary, BookingDraft, ServiceLocationMode } from '@/lib/booking-types';
import { ScreenHeader, ServiceSummaryBar, NoPhoneBanner } from '@/components/booking/Shared';
import BottomSheet from '@/components/booking/BottomSheet';
import CalendarPicker from '@/components/booking/CalendarPicker';
import { useAuth } from '@/lib/hooks/useAuth';
import { getServiceById } from '@/lib/firebase/services';
import { getProviderSchedule, getBookedSlotsForDate } from '@/lib/firebase/schedule';
import { getCurrentUser } from '@/lib/firebase/providers';
import type { ScheduleSettings } from '@/lib/firebase/schedule';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function locationModeFromServiceMode(mode?: string): ServiceLocationMode {
  if (mode === 'in_person') return 'client_goes_to_provider';
  if (mode === 'remote') return 'virtual';
  return 'goes_to_client'; // default + 'mobile'
}

const DOW_KEYS = ['sun','mon','tue','wed','thu','fri','sat'] as const;

function generateTimeSlots(start: string, end: string): string[] {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin   = eh * 60 + em;
  const slots: string[] = [];
  for (let cur = startMin; cur < endMin; cur += 30) {
    slots.push(
      `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`,
    );
  }
  return slots;
}

function fmt12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${ampm}`;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    );
    const data = await res.json();
    // Take first 3 comma-separated parts for a concise label
    return (data.display_name as string | undefined)
      ?.split(',')
      .slice(0, 3)
      .join(', ')
      .trim() ?? 'Current location';
  } catch {
    return 'Current location';
  }
}

// ─── Mode pill config ───────────────────────────────────────────────────────────

const modePill: Record<ServiceLocationMode, { label: string; bg: string; fg: string }> = {
  goes_to_client:          { label: 'Provider comes to you', bg: colors.brandWarm, fg: colors.white },
  client_goes_to_provider: { label: 'You travel',            bg: colors.brandWarm, fg: colors.white },
  virtual:                 { label: 'Virtual',               bg: colors.brandWarm, fg: colors.white },
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BookingFormPage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const { user } = useAuth();

  // ── Data state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading]       = useState(true);
  const [service, setService]       = useState<ServiceSummary | null>(null);
  const [schedule, setSchedule]     = useState<ScheduleSettings | null>(null);
  const [hasPhone, setHasPhone]     = useState(false);

  // ── Calendar state ──────────────────────────────────────────────────────────────
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // ── Slot state ─────────────────────────────────────────────────────────────────
  const [bookedSlots,   setBookedSlots]   = useState<string[]>([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────────
  const [locationLoading, setLocationLoading] = useState(false);
  const [checkingSlot,    setCheckingSlot]    = useState(false);
  const [slotTakenOpen,   setSlotTakenOpen]   = useState(false);

  const [draft, setDraft] = useState<BookingDraft>({
    serviceId: params.id ?? '',
    date:     null,
    time:     null,
    clientLocation:     '',
    specialInstructions: '',
  });

  // ── Load data ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!params.id || !user) return;
    try {
      const [svcDoc, currentUserDoc] = await Promise.all([
        getServiceById(params.id),
        getCurrentUser(user.uid),
      ]);
      if (!svcDoc) { setLoading(false); return; }

      const [sched, providerUserDoc] = await Promise.all([
        getProviderSchedule(svcDoc.providerId),
        getCurrentUser(svcDoc.providerId),
      ]);

      const providerName =
        providerUserDoc?.profile?.fullName ?? providerUserDoc?.name ?? 'Provider';

      setService({
        id:              svcDoc.id,
        providerId:      svcDoc.providerId,
        title:           svcDoc.name,
        providerName,
        providerVerified: true,
        thumbnailUrl:    svcDoc.thumbnailUrl,
        locationMode:    locationModeFromServiceMode(svcDoc.serviceMode),
        serviceFee:      svcDoc.basePrice ?? svcDoc.price ?? 0,
        providerArea:    svcDoc.location,
      });
      setSchedule(sched);
      setHasPhone(!!currentUserDoc?.profile?.phone);
      setDraft((d) => ({ ...d, serviceId: svcDoc.id }));
    } catch (e) {
      console.error('[BookingForm] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => { load(); }, [load]);

  // ── Calendar memos ──────────────────────────────────────────────────────────────

  const blockedSet = useMemo(() => {
    if (!schedule) return new Set<string>();
    return new Set([...schedule.vacationDates, ...schedule.unavailableDates]);
  }, [schedule]);

  const inactiveDOW = useMemo(() => {
    if (!schedule) return new Set<number>();
    const s = new Set<number>();
    DOW_KEYS.forEach((key, i) => {
      if (!schedule.workingDays[key].active) s.add(i);
    });
    return s;
  }, [schedule]);

  const timeSlots = useMemo(() => {
    if (!schedule || !draft.date) return [];
    const dow    = new Date(draft.date + 'T00:00:00').getDay();
    const dowKey = DOW_KEYS[dow];
    const day    = schedule.workingDays[dowKey];
    if (!day?.active) return [];
    return generateTimeSlots(day.start, day.end);
  }, [schedule, draft.date]);

  // ── Handlers ───────────────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const handleDateSelect = async (isoDate: string) => {
    setDraft((d) => ({ ...d, date: isoDate, time: null }));
    if (!service) return;
    setSlotsLoading(true);
    try {
      const slots = await getBookedSlotsForDate(service.providerId, isoDate);
      setBookedSlots(slots);
    } catch (e) {
      console.error('[BookingForm] getBookedSlotsForDate error:', e);
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const label = await reverseGeocode(coords.latitude, coords.longitude);
        setDraft((d) => ({ ...d, clientLocation: label }));
        setLocationLoading(false);
      },
      () => {
        setDraft((d) => ({ ...d, clientLocation: 'Current location' }));
        setLocationLoading(false);
      },
      { timeout: 8000 },
    );
  };

  const handleReview = async () => {
    if (!service || !draft.date || !draft.time) return;
    setCheckingSlot(true);
    try {
      // Re-check slot availability before proceeding (guards against concurrent bookings)
      if (draft.time !== 'flexible') {
        const q = query(
          collection(db, 'bookings'),
          where('providerId',    '==', service.providerId),
          where('preferredDate', '==', draft.date),
          where('preferredTime', '==', draft.time),
          where('status', 'in', [
            'confirmed', 'pending_provider', 'awaiting_payment', 'payment_pending',
          ]),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setSlotTakenOpen(true);
          return;
        }
      }

      // Persist draft so the review screen can hydrate without prop-drilling
      sessionStorage.setItem(
        'savis_booking_draft',
        JSON.stringify({
          ...draft,
          providerId:      service.providerId,
          providerName:    service.providerName,
          providerVerified: service.providerVerified,
          serviceFee:      service.serviceFee,
          locationMode:    service.locationMode,
          serviceTitle:    service.title,
        }),
      );
      router.push(`/services/${params.id}/book/review`);
    } catch (e) {
      console.error('[BookingForm] handleReview error:', e);
      // On query error, let the user through — the backend guards on creation
      sessionStorage.setItem('savis_booking_draft', JSON.stringify({ ...draft }));
      router.push(`/services/${params.id}/book/review`);
    } finally {
      setCheckingSlot(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────────

  const canReview = useMemo(() => {
    if (!hasPhone) return false;
    if (!draft.date || !draft.time) return false;
    if (service?.locationMode === 'goes_to_client' && !draft.clientLocation?.trim()) return false;
    return true;
  }, [draft, hasPhone, service?.locationMode]);

  const label = (text: string) => (
    <label className="block" style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary }}>
      {text}
    </label>
  );

  // ── Loading / error skeleton ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
        <div className="sticky top-0 z-20 flex items-center px-4 py-3"
          style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ width: 30 }} />
          <div className="flex-1 h-4 rounded animate-pulse mx-4"
            style={{ background: colors.border }} />
          <span style={{ width: 30 }} />
        </div>
        <div className="mx-auto max-w-[560px] px-4 pt-4 space-y-4">
          {[110, 280, 80].map((h) => (
            <div key={h} className="rounded-xl animate-pulse"
              style={{ height: h, background: colors.white }} />
          ))}
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="rounded-xl p-6 text-center" style={{ background: colors.white, maxWidth: 300 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>Service not found</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 rounded-[10px] px-5"
            style={{ height: 44, background: colors.brandPrimary, color: colors.white, fontSize: 14 }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader title="Book service" onBack={() => router.back()} />
      <div className="mx-auto max-w-[560px]">
        <ServiceSummaryBar
          title={service.title}
          providerName={service.providerName}
          thumbnailUrl={service.thumbnailUrl}
          pill={modePill[service.locationMode]}
        />

        {!hasPhone && (
          <div className="pt-4">
            <NoPhoneBanner onAdd={() => router.push('/profile/edit')} />
          </div>
        )}

        <div className="space-y-5 px-4 py-4">
          {/* Date — Sprint 3 CalendarPicker */}
          <div>
            {label('Choose a date')}
            <div className="mt-2">
              <CalendarPicker
                year={calYear}
                month={calMonth}
                selected={draft.date}
                blockedSet={blockedSet}
                inactiveDOW={inactiveDOW}
                onSelect={handleDateSelect}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
              />
            </div>
          </div>

          {/* Time — generated from provider schedule */}
          {draft.date && (
            <div>
              {label('Preferred time')}
              {slotsLoading ? (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-20 rounded-full animate-pulse"
                      style={{ background: colors.border }} />
                  ))}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* Flexible — always first */}
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, time: d.time === 'flexible' ? null : 'flexible' }))}
                    className="rounded-full px-4 py-2"
                    style={{
                      fontSize: 13,
                      border: `1px solid ${draft.time === 'flexible' ? colors.brandPrimary : colors.border}`,
                      background: draft.time === 'flexible' ? colors.brandLight : colors.white,
                      color: draft.time === 'flexible' ? colors.brandPrimary : colors.textPrimary,
                    }}
                  >
                    Flexible
                  </button>

                  {timeSlots.map((slot) => {
                    const isBooked   = bookedSlots.includes(slot);
                    const isSelected = draft.time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && setDraft((d) => ({ ...d, time: isSelected ? null : slot }))}
                        className="rounded-full px-4 py-2"
                        style={{
                          fontSize: 13,
                          border: `1px solid ${isSelected ? colors.brandPrimary : isBooked ? colors.border : colors.border}`,
                          background: isSelected ? colors.brandLight : colors.white,
                          color: isSelected ? colors.brandPrimary : isBooked ? colors.textDisabled : colors.textPrimary,
                          textDecoration: isBooked ? 'line-through' : 'none',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {fmt12(slot)}
                      </button>
                    );
                  })}

                  {timeSlots.length === 0 && (
                    <p style={{ fontSize: 13, color: colors.textSecondary }}>
                      No available slots for this day.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Location section — varies by mode */}
          {service.locationMode === 'goes_to_client' && (
            <div>
              {label('Your location')}
              <input
                value={draft.clientLocation}
                onChange={(e) => setDraft((d) => ({ ...d, clientLocation: e.target.value }))}
                placeholder="e.g. 14 Westlands Road, Nairobi"
                className="mt-1 w-full rounded-[10px] px-3 outline-none"
                style={{ height: 52, border: `1px solid ${colors.border}`, fontSize: 15, color: colors.textPrimary }}
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
                className="mt-2 inline-flex items-center gap-1"
                style={{ fontSize: 13, color: colors.brandPrimary, height: 36 }}
              >
                {locationLoading
                  ? <Spinner size={14} className="animate-spin" />
                  : <MapPin size={14} color={colors.brandPrimary} weight="bold" />}
                {locationLoading ? 'Detecting…' : 'Use my location'}
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
                  <MapPin size={28} color={colors.brandPrimary} weight="fill" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} color={colors.brandPrimary} weight="fill" />
                    <span style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
                      {service.providerArea ?? 'Provider area'}
                    </span>
                  </div>
                  {(service.providerDistanceKm || service.providerEtaMin) && (
                    <div className="mt-1 flex items-center gap-1">
                      <Car size={14} color={colors.textSecondary} />
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>
                        ~{service.providerDistanceKm} km · ~{service.providerEtaMin} min by car
                      </span>
                    </div>
                  )}
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
              onChange={(e) => setDraft((d) => ({ ...d, specialInstructions: e.target.value }))}
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
            disabled={!canReview || checkingSlot}
            onClick={handleReview}
            title={!hasPhone ? 'Add a phone number first' : undefined}
            className="w-full rounded-[10px]"
            style={{
              height: 52,
              background: colors.brandPrimary,
              color: colors.white,
              fontSize: 15,
              fontWeight: 600,
              opacity: canReview && !checkingSlot ? 1 : 0.5,
              cursor: canReview && !checkingSlot ? 'pointer' : 'not-allowed',
            }}
          >
            {checkingSlot ? 'Checking availability…' : 'Review booking'}
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
