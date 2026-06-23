'use client';

// src/app/bookings/[id]/pay/page.tsx
// Screens 6–9 — the payment state machine:
//   idle → sending → waiting → (success → confirmation) | failed | expired
// Countdown is always visible (except on the dedicated expired screen).
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HourglassHigh, XCircle } from '@phosphor-icons/react';
import { colors, computeCost, formatKES } from '@/lib/booking-theme';
import CountdownTimer from '@/components/booking/CountdownTimer';
import CostBreakdownCard from '@/components/booking/CostBreakdownCard';
import MpesaPaymentBlock from '@/components/booking/MpesaPaymentBlock';
import PaymentWaitingState from '@/components/booking/PaymentWaitingState';
import BottomSheet from '@/components/booking/BottomSheet';
import { ScreenHeader } from '@/components/booking/Shared';

type PayState = 'idle' | 'sending' | 'waiting' | 'failed' | 'expired';

// TODO(claude-code): load booking from `bookings/{id}`. Require state
// 'awaiting_payment'; compute deadline from the doc's paymentDeadline field.
const MOCK = {
  ref: 'BK-A3F2',
  summary: 'Home Deep Cleaning · Mon 24 Jun · 10:00am · Amina Wanjiku',
  phone: '254712345678',
  serviceFee: 1200,
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cost = computeCost(MOCK.serviceFee);

  const [state, setState] = useState<PayState>('idle');
  const [phone, setPhone] = useState(MOCK.phone);
  const [retryCount, setRetryCount] = useState(0);
  const [failReason, setFailReason] = useState('You cancelled the M-Pesa payment.');
  // 15-minute window from mount.
  const [deadline] = useState(() => Date.now() + 15 * 60 * 1000);

  const startPayment = (p: string) => {
    setPhone(p);
    setState('sending');
    // TODO(claude-code): call the Daraja STK Push endpoint (API route).
    // On the synchronous ack, move to 'waiting'. The actual result arrives via
    // the M-Pesa callback — subscribe to the booking doc for state changes.
    setTimeout(() => setState('waiting'), 1500);
    // DEMO ONLY: simulate a callback result after a few seconds.
    setTimeout(() => {
      // Flip between success / failure for demonstration.
      const ok = Math.random() > 0.4;
      if (ok) {
        router.push(`/bookings/${params.id}/confirmation`);
      } else {
        setFailReason('You cancelled the M-Pesa payment.');
        setState('failed');
      }
    }, 6000);
  };

  const retry = () => {
    setRetryCount((n) => n + 1);
    setState('idle');
  };

  // Screen 9 — Expired (full screen, replaces everything)
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
            Home Deep Cleaning · Amina Wanjiku
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: colors.textSecondary }}>
            Expired at 10:15am
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
          onClick={() => router.push('/support')}
          className="mt-2 w-full max-w-[480px] rounded-[10px]"
          style={{ height: 52, background: 'transparent', color: colors.textSecondary, fontSize: 15, border: `1px solid ${colors.border}` }}
        >
          Contact support
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: colors.surfaceGray, minHeight: '100dvh' }}>
      <ScreenHeader
        title="Complete payment"
        onBack={() => router.back()}
        right={
          <span style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'monospace' }}>
            Ref: {MOCK.ref}
          </span>
        }
      />

      <div className="mx-auto max-w-[480px] px-4 py-4">
        {/* Countdown — always visible on the payment screen */}
        <div className="mb-3 flex justify-center">
          <CountdownTimer deadline={deadline} onExpire={() => setState('expired')} />
        </div>

        {/* Booking summary bar */}
        <div className="rounded-xl p-3" style={{ background: colors.surfaceGray, border: `1px solid ${colors.border}` }}>
          <p className="truncate" style={{ fontSize: 13, color: colors.textSecondary }}>
            {MOCK.summary}
          </p>
        </div>

        {/* Cost card */}
        <div className="mt-4">
          <CostBreakdownCard cost={cost} />
        </div>

        {/* Payment section — swaps to the waiting state in place */}
        <div className="mt-4">
          {state === 'waiting' ? (
            <PaymentWaitingState phone={phone} onCancel={() => setState('idle')} />
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
            <CountdownTimer deadline={deadline} onExpire={() => setState('expired')} />
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
            }}
            className="mt-2 w-full rounded-[10px]"
            style={{ height: 52, background: 'transparent', color: colors.textPrimary, fontSize: 15, border: `1px solid ${colors.border}` }}
          >
            Use a different number
          </button>
          {retryCount >= 2 && (
            <button
              type="button"
              onClick={() => router.push('/bookings')}
              className="mt-3"
              style={{ fontSize: 13, color: colors.textSecondary }}
            >
              Cancel booking
            </button>
          )}
          {retryCount < 2 && (
            <p className="mt-3" style={{ fontSize: 12, color: colors.textDisabled }}>
              Your retries remaining: {2 - retryCount}
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
