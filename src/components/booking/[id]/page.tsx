'use client';

// src/app/bookings/page.tsx
// Screen 12 — My Bookings with all status variants, filter tabs, and empty
// states (one per filter — an edge case the brief implies but doesn't spell out).
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { CalendarBlank } from '@phosphor-icons/react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { colors } from '@/lib/booking-theme';
import { toStatusKey, type Booking, type BookingState, type ServiceLocationMode } from '@/lib/booking-types';
import CountdownTimer from '@/components/booking/CountdownTimer';
import { StatusPill, ScreenHeader } from '@/components/booking/Shared';

// ─── Firestore → UI mapper ──────────────────────────────────────────────────────

function fmtRelative(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts?.toDate) return '';
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `Sent ${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Sent ${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  return `Sent ${ts.toDate().toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`;
}

function fmt12(hhmm: string): string {
  if (!hhmm || hhmm === 'flexible') return 'Flexible';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
}

interface RawDoc {
  ref?: string;
  serviceId?: string;
  serviceTitle?: string;
  providerName?: string;
  locationMode?: string;
  preferredDate?: string;
  preferredTime?: string;
  status?: string;
  serviceFee?: number;
  paymentRef?: string | null;
  paymentDeadline?: number;
  retryCount?: number;
  declinedReason?: string | null;
  providerPhone?: string | null;
  meetLink?: string | null;
  createdAt?: { toDate: () => Date; seconds: number } | null;
}

function mapBooking(id: string, d: RawDoc): Booking {
  return {
    id,
    ref:             d.ref ?? '',
    serviceId:       d.serviceId ?? '',
    serviceTitle:    d.serviceTitle ?? '',
    providerName:    d.providerName ?? '',
    providerVerified: false,  // not stored in the booking doc
    locationMode:    (d.locationMode as ServiceLocationMode) ?? 'goes_to_client',
    date:            d.preferredDate ?? '',
    timeLabel:       fmt12(d.preferredTime ?? ''),
    state:           (d.status as BookingState) ?? 'awaiting_payment',
    serviceFee:      d.serviceFee ?? 0,
    paymentRef:      d.paymentRef ?? undefined,
    paymentDeadline: d.paymentDeadline,
    retryCount:      d.retryCount,
    declineReason:   d.declinedReason ?? undefined,
    createdAtLabel:  fmtRelative(d.createdAt),
    providerPhone:   d.providerPhone ?? undefined,
    meetLink:        d.meetLink ?? undefined,
  };
}

// ─── Filter ────────────────────────────────────────────────────────────────────

const TABS = ['All', 'Pending', 'Confirmed', 'Completed'] as const;
type Tab = (typeof TABS)[number];

function inTab(b: Booking, tab: Tab): boolean {
  const k = toStatusKey(b);
  if (tab === 'All')       return true;
  if (tab === 'Pending')   return ['pending_provider', 'awaiting_payment', 'payment_pending', 'payment_failed'].includes(k);
  if (tab === 'Confirmed') return k === 'paid';
  if (tab === 'Completed') return k === 'completed';
  return true;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MyBookingsPage() {
  const router     = useRouter();
  const { user }   = useAuth();
  const [tab,      setTab]      = useState<Tab>('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  // ── Realtime listener ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bookings'), where('customerId', '==', user.uid));

    const unsub = onSnapshot(q, (snap) => {
      // Sort by createdAt desc client-side — avoids a composite Firestore index
      const sorted = [...snap.docs].sort((a, b) => {
        const aTs = (a.data().createdAt as { seconds: number } | null)?.seconds ?? 0;
        const bTs = (b.data().createdAt as { seconds: number } | null)?.seconds ?? 0;
        return bTs - aTs;
      });
      setBookings(sorted.map((d) => mapBooking(d.id, d.data() as RawDoc)));
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const filtered = useMemo(() => bookings.filter((b) => inTab(b, tab)), [bookings, tab]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const textLink = (text: string, onClick: () => void, color: string = colors.brandPrimary) => (
    <button type="button" onClick={onClick} style={{ fontSize: 13, color }}>
      {text}
    </button>
  );

  const cancelRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status: 'declined',
        declinedReason: 'Cancelled by customer',
      });
    } catch (e) {
      console.error('[MyBookings] cancelRequest error:', e);
    }
  };

  const Card = ({ b }: { b: Booking }) => {
    const k = toStatusKey(b);
    return (
      <div
        className="rounded-xl p-4"
        style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <p
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: k === 'payment_expired' ? colors.textDisabled : colors.textPrimary,
              textDecoration: k === 'payment_expired' ? 'line-through' : 'none',
            }}
          >
            {b.serviceTitle} · {b.providerName}
          </p>
          <StatusPill status={k} />
        </div>

        {/* Per-state secondary content */}
        <div className="mt-2">
          {b.state === 'pending_provider' && (
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: colors.textSecondary }}>{b.createdAtLabel}</span>
              {textLink('Cancel request', () => cancelRequest(b.id), colors.textSecondary)}
            </div>
          )}

          {b.state === 'awaiting_payment' && (
            <>
              <div className="mb-2">
                {b.paymentDeadline && <CountdownTimer deadline={b.paymentDeadline} pill={false} />}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/bookings/${b.id}/pay`)}
                className="w-full rounded-[10px]"
                style={{ height: 44, background: colors.brandAction, color: colors.white, fontSize: 14, fontWeight: 600 }}
              >
                Pay now
              </button>
            </>
          )}

          {b.state === 'payment_pending' && (
            <span style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' }}>
              Waiting for M-Pesa confirmation…
            </span>
          )}

          {(b.state === 'confirmed' || b.state === 'in_progress') && b.paymentRef && (
            <span style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' }}>
              Receipt: {b.paymentRef}
            </span>
          )}

          {b.state === 'payment_failed' && (
            <div className="flex items-center justify-between gap-2">
              {b.paymentDeadline && <CountdownTimer deadline={b.paymentDeadline} pill={false} />}
              <button
                type="button"
                onClick={() => router.push(`/bookings/${b.id}/pay`)}
                className="rounded-[10px] px-4"
                style={{ height: 40, background: colors.brandAction, color: colors.white, fontSize: 13, fontWeight: 600 }}
              >
                Retry payment
              </button>
            </div>
          )}

          {b.state === 'payment_expired' &&
            textLink('Book again', () => router.push(`/services/${b.serviceId}/book`))}

          {b.state === 'declined' && (
            <div>
              <p style={{ fontSize: 13, color: colors.textSecondary }}>{b.declineReason}</p>
              {textLink('Browse similar', () => router.push('/'))}
            </div>
          )}

          {(b.state === 'completed' || b.state === 'closed') &&
            textLink('Leave a review →', () => router.push(`/bookings/${b.id}/review`))}
        </div>
      </div>
    );
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
        <div className="sticky top-0 z-20"
          style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}>
          <div className="mx-auto flex max-w-[640px] items-center px-4 py-3">
            <div className="h-4 w-28 rounded animate-pulse" style={{ background: colors.border }} />
          </div>
        </div>
        <div className="mx-auto max-w-[640px] px-4 pt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl p-4 animate-pulse"
              style={{ background: colors.white, height: 80 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader title="My bookings" />

      {/* Filter tabs */}
      <div className="mx-auto flex max-w-[640px] gap-2 px-4 py-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded-full px-4 py-1.5"
            style={{
              fontSize: 13,
              fontWeight: 500,
              background: tab === t ? colors.brandPrimary : colors.white,
              color: tab === t ? colors.white : colors.textSecondary,
              border: `1px solid ${tab === t ? colors.brandPrimary : colors.border}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-[640px] space-y-3 px-4 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CalendarBlank size={48} color={colors.textDisabled} />
            <p className="mt-4" style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
              {tab === 'All' ? 'No bookings yet' : `No ${tab.toLowerCase()} bookings`}
            </p>
            <p className="mt-1" style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 280 }}>
              {tab === 'All'
                ? 'When you book a service, it will show up here.'
                : 'Nothing here right now. Check the other tabs or book a new service.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-5 rounded-[10px] px-5"
              style={{ height: 44, background: colors.brandPrimary, color: colors.white, fontSize: 14, fontWeight: 600 }}
            >
              Browse services
            </button>
          </div>
        ) : (
          filtered.map((b) => <Card key={b.id} b={b} />)
        )}
      </div>
    </div>
  );
}
