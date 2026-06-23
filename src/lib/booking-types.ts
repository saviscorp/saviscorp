// src/lib/booking-types.ts
// Domain types for Sprint 4. These align with the existing Firestore `bookings`
// collection and the finalised state machine. The UI status keys (used for
// pills) are derived from this richer model.

export type ServiceLocationMode = 'goes_to_client' | 'client_goes_to_provider' | 'virtual';

// Underlying booking lifecycle in Firestore.
// Brief launch flow: confirmed → in_progress → completed → closed, plus the
// pre-payment request states the payment UI needs.
export type BookingState =
  | 'pending_provider' // request sent, provider hasn't responded
  | 'awaiting_payment' // provider confirmed, payment window open
  | 'payment_pending' // STK push sent, waiting on M-Pesa callback
  | 'confirmed' // payment received (escrow held)
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'payment_failed'
  | 'payment_expired'
  | 'declined';

export interface ServiceSummary {
  id: string;
  providerId: string; // needed for slot checks + booking creation
  title: string;
  providerName: string;
  providerVerified: boolean;
  thumbnailUrl?: string;
  locationMode: ServiceLocationMode;
  serviceFee: number; // KES, pre-fees
  providerArea?: string; // for client-goes-to-provider
  providerDistanceKm?: number;
  providerEtaMin?: number;
}

export interface BookingDraft {
  serviceId: string;
  date: string | null; // ISO date
  time: string | null; // e.g. "10:00am"
  clientLocation?: string; // for goes_to_client
  specialInstructions?: string;
}

export interface Booking {
  id: string;
  ref: string; // e.g. BK-A3F2C9D1
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  providerVerified: boolean;
  providerPhone?: string; // revealed post-payment only
  locationMode: ServiceLocationMode;
  date: string;
  timeLabel: string;
  locationLabel?: string;
  specialInstructions?: string;
  state: BookingState;
  serviceFee: number;
  // Payment
  paymentRef?: string; // M-Pesa receipt e.g. QHG7XZ2BPK
  paidVia?: 'mpesa';
  phone?: string;
  // Virtual
  meetLink?: string;
  // Timing
  paymentDeadline?: number; // epoch ms; drives countdown
  expiredAtLabel?: string;
  createdAtLabel?: string;
  retryCount?: number;
  declineReason?: string;
}

// Maps the rich BookingState onto the UI status-pill key used by My Bookings.
import type { StatusKey } from './booking-theme';

export function toStatusKey(b: Pick<Booking, 'state'>): StatusKey {
  switch (b.state) {
    case 'pending_provider':
      return 'pending_provider';
    case 'awaiting_payment':
      return 'awaiting_payment';
    case 'payment_pending':
      return 'payment_pending';
    case 'confirmed':
    case 'in_progress':
      return 'paid';
    case 'completed':
    case 'closed':
      return 'completed';
    case 'payment_failed':
      return 'payment_failed';
    case 'payment_expired':
      return 'payment_expired';
    case 'declined':
      return 'declined';
    default:
      return 'pending_provider';
  }
}
