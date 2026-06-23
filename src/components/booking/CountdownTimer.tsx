'use client';

// src/components/booking/CountdownTimer.tsx
import { useEffect, useState } from 'react';
import { Clock } from '@phosphor-icons/react';
import { colors, formatCountdown } from '@/lib/booking-theme';

interface Props {
  /** Epoch ms when the payment window closes. */
  deadline: number;
  onExpire?: () => void;
  /** If true, render as a centred pill (payment screen). Else inline. */
  pill?: boolean;
}

export default function CountdownTimer({ deadline, onExpire, pill = true }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.round((deadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(next);
      if (next <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const urgent = secondsLeft < 120; // under 2 min
  const critical = secondsLeft < 30; // under 30 s

  const label =
    secondsLeft >= 120
      ? `Time remaining: ${formatCountdown(secondsLeft)}`
      : formatCountdown(secondsLeft);

  // Colour + container styling per state
  let fg: string = colors.textSecondary;
  let bg: string = pill ? colors.surfaceGray : 'transparent';
  let extra: React.CSSProperties = {};
  if (urgent) {
    fg = colors.error;
    bg = pill ? colors.errorLight : 'transparent';
  }
  if (critical) {
    fg = colors.error;
    bg = colors.errorLight;
    extra = { fontWeight: 700 };
  }

  return (
    <div
      className={
        pill
          ? 'inline-flex items-center gap-2 rounded-full px-4 py-2'
          : 'inline-flex items-center gap-2'
      }
      style={{ background: bg, color: fg, fontSize: 15, fontWeight: 500, ...extra }}
      role="timer"
      aria-live={urgent ? 'assertive' : 'off'}
    >
      <Clock
        size={16}
        weight="bold"
        className={urgent ? 'savis-pulse' : undefined}
        color={fg}
      />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{label}</span>
      <style jsx>{`
        :global(.savis-pulse) {
          animation: savisPulse 1s ease-in-out infinite;
        }
        @keyframes savisPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.savis-pulse) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
