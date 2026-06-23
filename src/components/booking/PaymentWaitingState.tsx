'use client';

// src/components/booking/PaymentWaitingState.tsx
import { PhoneCall } from '@phosphor-icons/react';
import { colors, maskPhone } from '@/lib/booking-theme';

interface Props {
  phone: string;
  onCancel: () => void;
}

export default function PaymentWaitingState({ phone, onCancel }: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
    >
      <div className="flex flex-col items-center py-6">
        <div className="relative flex items-center justify-center" style={{ height: 96, width: 96 }}>
          <span className="savis-ripple" />
          <span className="savis-ripple savis-ripple-2" />
          <span className="savis-ripple savis-ripple-3" />
          <PhoneCall size={48} color={colors.brandPrimary} weight="fill" />
        </div>

        <p className="mt-4 text-center" style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
          Check your phone
        </p>
        <p className="mt-1 text-center" style={{ fontSize: 14, color: colors.textSecondary }}>
          Enter your M-Pesa PIN to complete
        </p>
        <p className="mt-1 text-center" style={{ fontSize: 13, color: colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
          {maskPhone(phone)}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 underline"
          style={{ fontSize: 13, color: colors.textSecondary }}
        >
          Cancel
        </button>
      </div>

      <style jsx>{`
        .savis-ripple {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: ${colors.brandLight};
          animation: savisRipple 1.8s ease-out infinite;
        }
        .savis-ripple-2 {
          animation-delay: 0.6s;
        }
        .savis-ripple-3 {
          animation-delay: 1.2s;
        }
        @keyframes savisRipple {
          0% {
            transform: scale(0.6);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .savis-ripple {
            animation: none;
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
