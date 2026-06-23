'use client';

// src/components/booking/MpesaPaymentBlock.tsx
import { useState } from 'react';
import { Lock, CircleNotch } from '@phosphor-icons/react';
import { colors, formatKES } from '@/lib/booking-theme';

interface Props {
  /** Pre-filled M-Pesa number (digits after +254, or full). */
  initialPhone: string;
  amount: number;
  /** 'idle' shows the pay button, 'sending' shows the spinner/disabled state. */
  state?: 'idle' | 'sending';
  onPay: (phone: string) => void;
}

// Minimal inline M-Pesa mark. Replace src with the official SVG when available.
function MpesaLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-label="M-Pesa"
      className="inline-flex items-center justify-center rounded-md font-bold"
      style={{
        height: size,
        minWidth: size * 1.6,
        padding: '0 8px',
        background: '#4CAF50',
        color: colors.white,
        fontSize: size * 0.38,
        letterSpacing: 0.2,
      }}
    >
      M-PESA
    </span>
  );
}

export default function MpesaPaymentBlock({
  initialPhone,
  amount,
  state = 'idle',
  onPay,
}: Props) {
  const normalised = initialPhone.replace(/\D/g, '').replace(/^254/, '');
  const [number, setNumber] = useState(normalised);
  const [editable, setEditable] = useState(false);
  const sending = state === 'sending';

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
    >
      <div className="flex items-center gap-3">
        <MpesaLogo />
        <span style={{ fontSize: 17, fontWeight: 500, color: colors.textPrimary }}>
          Pay with M-Pesa
        </span>
      </div>

      <label
        className="mt-4 block"
        style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary }}
      >
        M-Pesa number
      </label>
      <div
        className="mt-1 flex items-stretch overflow-hidden rounded-[10px]"
        style={{ height: 52, border: `1px solid ${colors.border}` }}
      >
        <span
          className="flex items-center gap-1 px-3"
          style={{
            background: colors.surfaceGray,
            borderRight: `1px solid ${colors.border}`,
            fontSize: 15,
            color: colors.textPrimary,
          }}
        >
          🇰🇪 +254
        </span>
        <input
          inputMode="numeric"
          value={number}
          readOnly={!editable}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
          className="flex-1 bg-transparent px-3 outline-none"
          style={{ fontSize: 15, color: colors.textPrimary }}
          aria-label="M-Pesa phone number"
        />
      </div>
      {!editable && (
        <button
          type="button"
          onClick={() => setEditable(true)}
          className="mt-2"
          style={{ fontSize: 13, color: colors.brandPrimary }}
        >
          Use a different number
        </button>
      )}

      <button
        type="button"
        disabled={sending}
        onClick={() => onPay(`254${number}`)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px]"
        style={{
          height: 56,
          background: colors.brandAction,
          color: colors.white,
          fontSize: 16,
          fontWeight: 700,
          opacity: sending ? 0.85 : 1,
          cursor: sending ? 'default' : 'pointer',
        }}
      >
        {sending ? (
          <>
            <CircleNotch size={18} color={colors.white} className="savis-spin" />
            Sending to your phone…
          </>
        ) : (
          `Pay ${formatKES(amount)}`
        )}
      </button>

      <div className="mt-2 flex items-center justify-center gap-1">
        <Lock size={12} color={colors.textSecondary} weight="bold" />
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          Secured by Safaricom M-Pesa
        </span>
      </div>

      <style jsx>{`
        :global(.savis-spin) {
          animation: savisSpin 0.8s linear infinite;
        }
        @keyframes savisSpin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.savis-spin) {
            animation-duration: 2s;
          }
        }
      `}</style>
    </div>
  );
}
