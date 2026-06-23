// src/lib/booking-theme.ts
// Sprint 4 design tokens — kept as plain JS objects so they can be used as
// inline styles. This sidesteps the Tailwind custom-class compilation issues
// hit earlier in the project: layout stays in Tailwind utilities, colour comes
// from here.

export const colors = {
  brandPrimary: '#640D5F', // structural, active states
  brandAction: '#D91656', // all pay / confirm CTAs
  brandWarm: '#EB5B00', // accents
  brandGold: '#FFB200', // star ratings
  success: '#1D9E75', // paid, confirmed
  warning: '#9C6B00', // pending payment
  error: '#A32D2D', // failed, expired
  brandLight: '#FDF0FC', // info cards, virtual service card
  surfaceGray: '#F5F6F8', // page background
  // Derived / utility shades (not in brief but needed for the states described)
  errorLight: '#F7E4E4',
  goldLight: '#FFF6E0',
  successLight: '#E3F4EE',
  border: '#E6E3EA',
  textPrimary: '#1A1320',
  textSecondary: '#6B6472',
  textDisabled: '#A8A2AE',
  white: '#FFFFFF',
} as const;

export type StatusKey =
  | 'pending_provider'
  | 'awaiting_payment'
  | 'payment_pending'
  | 'paid'
  | 'payment_failed'
  | 'payment_expired'
  | 'declined'
  | 'completed';

// Pill styling per booking status. bg / fg pulled from the token set above.
export const statusPill: Record<
  StatusKey,
  { label: string; bg: string; fg: string }
> = {
  pending_provider: { label: 'Awaiting response', bg: colors.goldLight, fg: colors.warning },
  awaiting_payment: { label: 'Confirmed — pay now', bg: colors.successLight, fg: colors.success },
  payment_pending: { label: 'Payment in progress', bg: colors.goldLight, fg: colors.warning },
  paid: { label: 'Paid', bg: colors.successLight, fg: colors.success },
  payment_failed: { label: 'Payment failed', bg: colors.errorLight, fg: colors.error },
  payment_expired: { label: 'Expired', bg: colors.surfaceGray, fg: colors.textDisabled },
  declined: { label: 'Declined', bg: colors.errorLight, fg: colors.error },
  completed: { label: 'Completed', bg: colors.successLight, fg: colors.success },
};

/**
 * Canonical KES formatter. The brief is strict: always "KES 1,297.44" —
 * comma thousands separator, two decimals, "KES " prefix with a space.
 * Never "Ksh", never bare integers, never "KES1,297".
 */
export function formatKES(amount: number): string {
  const formatted = amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `KES ${formatted}`;
}

/**
 * Booking cost breakdown. Mirrors the finalised SAVIS payment model:
 * service fee + platform fee + VAT on the platform fee.
 * Brief shows 7% platform fee and 16% VAT on that fee.
 */
export interface CostBreakdown {
  serviceFee: number;
  platformFee: number;
  vat: number;
  total: number;
}

export function computeCost(
  serviceFee: number,
  platformRate = 0.07,
  vatRate = 0.16,
): CostBreakdown {
  const platformFee = Math.round(serviceFee * platformRate * 100) / 100;
  const vat = Math.round(platformFee * vatRate * 100) / 100;
  const total = Math.round((serviceFee + platformFee + vat) * 100) / 100;
  return { serviceFee, platformFee, vat, total };
}

/** Mask a Kenyan number for the waiting state: +254 712 XXX XXX */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^254/, '');
  if (digits.length < 6) return '+254 7XX XXX XXX';
  const head = digits.slice(0, 3);
  return `+254 ${head} XXX XXX`;
}

/** mm:ss from seconds remaining */
export function formatCountdown(secondsLeft: number): string {
  const s = Math.max(0, Math.floor(secondsLeft));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
