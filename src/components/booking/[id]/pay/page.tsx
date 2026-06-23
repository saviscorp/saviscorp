'use client';

// src/app/bookings/[id]/pay/page.tsx
// Screens 6–9 — the payment state machine:
//   idle → sending → waiting → (success → confirmation) | failed | expired
// Countdown is always visible (except on the dedicated expired screen).
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { HourglassHigh, XCircle } from '@phosphor-icons/react';
import { db } from '@/lib/firebase';
import { colors, computeCost, formatKES } from '@/lib/booking-theme';
import { useAuth } from '@/lib/hooks/useAuth';
import { getCurrentUser } from '@/lib/firebase/providers';
import CountdownTimer from '@/components/booking/CountdownTimer';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import MpesaPaymentBlock from '@/components/booking/MpesaPaymentBlock';
import PaymentWaitingState from '@/components/booking/PaymentWaitingState';
import BottomSheet from '@/components/booking/BottomSheet';
import { ScreenHeader } from '@/components/booking/Shared';

// ─── Types ──────────────────────────────────────────────────────────────────────

type PayState = 'idle' | 'sending' | 'waiting' | 'failed' | 'expired';

interface BookingData {
  ref: string;
  status: string;
  serviceTitle: string;
  providerName: string;
  preferredDate: string;
  preferredTime: string;
  serviceFee: number;
  total: number;
  paymentDeadline: number;
  payingPhone?: string;
  failResultDesc?: string;
  failResultCode?: number;
  retryCount?: number;
  checkoutRequestId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  if (hhmm === 'flexible') return 'Flexible';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
}

function fmtShortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function fmtTime(epoch: number): string {
  return new Date(epoch).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router    = useRouter();
  const params    = useParams<{ id: string }>();
  const { user }  = useAuth();

  const [booking,    setBooking]    = useState<BookingData | null>(null);
  const [loadError,  setLoadError]  = useState(false);
  const [state,      setState]      = useState<PayState>('idle');
  const [phone,      setPhone]      = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [failReason, setFailReason] = useState('');

  // Ref so the onSnapshot callback always reads the latest state without triggering re-subscription
  const stateRef = useRef<PayState>('idle');
  stateRef.current = state;

  // ── Load user phone for M-Pesa pre-fill ──────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    getCurrentUser(user.uid).then((u) => {
      if (u?.profile?.phone) setPhone(u.profile.phone);
    });
  }, [user]);

  // ── Realtime booking listener ─────────────────────────────────────────────────

  useEffect(() => {
    if (!params.id) return;

    const unsub = onSnapshot(
      doc(db, 'bookings', params.id),
      (snap) => {
        if (!snap.exists()) { setLoadError(true); return; }
        const data = snap.data() as BookingData;
        setBooking(data);
        setRetryCount(data.retryCount ?? 0);

        // Sync initial state from Firestore (covers page refresh mid-flow)
        const cur = stateRef.current;
        if (cur === 'idle' || cur === 'sending') {
          if (data.status === 'payment_pending') setState('waiting');
          else if (data.status === 'payment_expired') setState('expired');
          else if (data.status === 'confirmed') {
            router.push(`/bookings/${params.id}/confirmation`);
          }
        }

        // Callback result — only act when we're in the waiting state
        if (cur === 'waiting') {
          if (data.status === 'confirmed') {
            router.push(`/bookings/${params.id}/confirmation`);
          } else if (data.status === 'payment_failed') {
            const reason =
              data.failResultDesc ?? 'The payment was not completed. Please try again.';
            setFailReason(reason);
            setState('failed');
          }
        }
      },
      () => setLoadError(true),
    );

    return unsub;
  }, [params.id, router]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const startPayment = async (p: string) => {
    if (!booking) return;
    setPhone(p);
    setState('sending');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.id,
          phone:     p,
          amount:    booking.total,
          ref:       booking.ref,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'STK push failed');
      }

      // API route already moved booking to payment_pending; onSnapshot will confirm.
      setState('waiting');
    } catch (e) {
      console.error('[PayPage] startPayment error:', e);
      setFailReason(
        e instanceof Error ? e.message : 'Failed to initiate payment. Please try again.',
      );
      setState('failed');
    }
  };

  const retry = async () => {
    if (!params.id) return;
    const nextCount = retryCount + 1;
    setRetryCount(nextCount);
    setState('idle');
    try {
      await updateDoc(doc(db, 'bookings', params.id), {
        status:     'awaiting_payment',
        retryCount: nextCount,
      });
    } catch (e) {
      console.error('[PayPage] retry update error:', e);
    }
  };

  const cancelBooking = async () => {
    if (!params.id) return;
    try {
      await updateDoc(doc(db, 'bookings', params.id), { status: 'payment_expired' });
    } catch (e) {
      console.error('[PayPage] cancel error:', e);
    }
    router.push('/bookings');
  };

  // ── Loading / error ───────────────────────────────────────────────────────────

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

  if (!booking) {
    return (
      <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
        <div className="sticky top-0 z-20 flex items-center px-4 py-3"
          style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}>
          <span style={{ width: 30 }} />
          <div className="flex-1 h-4 rounded animate-pulse mx-4" style={{ background: colors.border }} />
          <span style={{ width: 30 }} />
        </div>
        <div className="mx-auto max-w-[480px] px-4 pt-8 flex justify-center">
          <div className="h-10 w-40 rounded-full animate-pulse" style={{ background: colors.border }} />
        </div>
      </div>
    );
  }

  const cost    = computeCost(booking.serviceFee);
  const summary = [
    booking.serviceTitle,
    fmtShortDate(booking.preferredDate),
    booking.preferredTime === 'flexible' ? 'Flexible' : fmt12(booking.preferredTime),
    booking.providerName,
  ].join(' · ');

  // ── Screen 9 — Expired (full-screen replacement) ─────────────────────────────

  if (state === 'expired') {
    return (
      <div
        className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center"
        style={{ background: colors.surfaceGray }}
      >
        <HourglassHigh size={64} color={colors.textSecondary} />
        <p className="mt-4" style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>
          Booking request expired
        </p>
        <p className="mt-2" style={{ fontSize: 15, color: colors.textSecondary, maxWidth: 300 }}>
          Your 15-minute payment window has closed. No payment was taken.
        </p>
        <div
          className="mt-6 w-full max-w-[480px] rounded-xl p-4"
          style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
        >
          <p style={{ fontSize: 14, color: colors.textDisabled, textDecoration: 'line-through' }}>
            {booking.serviceTitle} · {booking.providerName}
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: colors.textSecondary }}>
            Expired at {fmtTime(booking.paymentDeadline)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-6 w-full max-w-[480px] rounded-[10px]"
          style={{ height: 52, background: colors.brandPrimary, color: colors.white, fontSize: 15, fontWeight: 600 }}
        >
          Browse services
        </button>
        <button
          type="button"
          onClick={() => router.push('/help')}
          className="mt-2 w-full max-w-[480px] rounded-[10px]"
          style={{ height: 52, background: 'transparent', color: colors.textSecondary, fontSize: 15, border: `1px solid ${colors.border}` }}
        >
          Contact support
        </button>
      </div>
    );
  }

  // ── Screens 6–8 — idle / sending / waiting / failed ──────────────────────────

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader
        title="Complete payment"
        onBack={() => router.back()}
        right={
          <span style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' }}>
            {booking.ref}
          </span>
        }
      />

      <div className="mx-auto max-w-[480px] px-4 py-4">
        {/* Countdown — always visible */}
        <div className="mb-3 flex justify-center">
          <CountdownTimer
            deadline={booking.paymentDeadline}
            onExpire={async () => {
              setState('expired');
              try {
                await updateDoc(doc(db, 'bookings', params.id), { status: 'payment_expired' });
              } catch (e) {
                console.error('[PayPage] expiry update error:', e);
              }
            }}
          />
        </div>

        {/* Booking summary bar */}
        <div
          className="rounded-xl p-3"
          style={{ background: colors.surfaceGray, border: `1px solid ${colors.border}` }}
        >
          <p className="truncate" style={{ fontSize: 13, color: colors.textSecondary }}>
            {summary}
          </p>
        </div>

        {/* Cost breakdown */}
        <div className="mt-4">
          <CostBreakdownCard cost={cost} />
        </div>

        {/* Payment block — swaps to waiting state in place */}
        <div className="mt-4">
          {state === 'waiting' ? (
            <PaymentWaitingState
              phone={phone}
              onCancel={() => {
                setState('idle');
                updateDoc(doc(db, 'bookings', params.id), { status: 'awaiting_payment' }).catch(
                  (e) => console.error('[PayPage] cancel-wait error:', e),
                );
              }}
            />
          ) : (
            <MpesaPaymentBlock
              initialPhone={phone}
              amount={cost.total}
              state={state === 'sending' ? 'sending' : 'idle'}
              onPay={startPayment}
            />
          )}
        </div>
      </div>

      {/* Screen 8 — Payment failed bottom sheet */}
      <BottomSheet open={state === 'failed'} onClose={() => setState('idle')} dismissible={false}>
        <div className="flex flex-col items-center text-center">
          <span
            className="flex items-center justify-center rounded-full"
            style={{ height: 64, width: 64, background: colors.errorLight }}
          >
            <XCircle size={40} color={colors.error} weight="fill" />
          </span>
          <p className="mt-4" style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
            Payment unsuccessful
          </p>
          <p className="mt-1" style={{ fontSize: 14, color: colors.textSecondary, maxWidth: 280 }}>
            {failReason}
          </p>
          <div className="mt-3">
            <CountdownTimer deadline={booking.paymentDeadline} onExpire={() => setState('expired')} />
          </div>

          <button
            type="button"
            onClick={retry}
            className="mt-6 w-full rounded-[10px]"
            style={{ height: 52, background: colors.brandAction, color: colors.white, fontSize: 15, fontWeight: 600 }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              setRetryCount((n) => n + 1);
              setState('idle');
              updateDoc(doc(db, 'bookings', params.id), {
                status: 'awaiting_payment',
                retryCount: retryCount + 1,
              }).catch((e) => console.error('[PayPage] retry-num error:', e));
            }}
            className="mt-2 w-full rounded-[10px]"
            style={{ height: 52, background: 'transparent', color: colors.textPrimary, fontSize: 15, border: `1px solid ${colors.border}` }}
          >
            Use a different number
          </button>

          {retryCount >= 2 && (
            <button
              type="button"
              onClick={cancelBooking}
              className="mt-3"
              style={{ fontSize: 13, color: colors.textSecondary }}
            >
              Cancel booking
            </button>
          )}
          {retryCount < 2 && (
            <p className="mt-3" style={{ fontSize: 12, color: colors.textDisabled }}>
              Retries remaining: {2 - retryCount}
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
