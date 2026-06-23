'use client';

// src/components/booking/ConfirmationAnimation.tsx
// Frame 4 (final resting state) of the confirmation animation, with the
// draw-in sequence handled via CSS. Respects reduced motion.
import { Check } from '@phosphor-icons/react';
import { colors } from '@/lib/booking-theme';

export default function ConfirmationAnimation() {
  return (
    <div className="flex flex-col items-center">
      <div
        className="savis-confirm-circle relative flex items-center justify-center rounded-full"
        style={{
          height: 80,
          width: 80,
          background: colors.brandPrimary,
          boxShadow: `0 0 0 12px ${colors.brandLight}`,
        }}
      >
        <Check size={48} color={colors.white} weight="bold" className="savis-confirm-check" />
      </div>

      <style jsx>{`
        .savis-confirm-circle {
          animation: savisPop 400ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        :global(.savis-confirm-check) {
          animation: savisCheck 300ms ease-out 350ms both;
        }
        @keyframes savisPop {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes savisCheck {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .savis-confirm-circle,
          :global(.savis-confirm-check) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
