'use client';

import { useRouter } from 'next/navigation';
import { PayoutCard, BookingCard, QuickActionButton, StatusPill } from '@/components/ui';
import { BottomNav } from '@/components/provider/BottomNav';
import type { BookingCardData } from '@/components/ui';

// ─── Icons (inline, no extra dep) ─────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M10 4v12M4 10h12" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <rect x="3" y="4" width="14" height="13" rx="2" />
    <path d="M3 8h14M7 2v4M13 2v4" />
  </svg>
);
const ClipboardIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path d="M7 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="7" y="2" width="6" height="4" rx="1" />
  </svg>
);
const StorefrontIllustration = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="25" y="50" width="110" height="58" rx="4" fill="#640D5F" />
    <rect x="32" y="27" width="96" height="28" rx="3" fill="#4a0a47" />
    <rect x="40" y="13" width="80" height="17" rx="3" fill="#FFB200" />
    <text x="80" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="#3D0739" fontFamily="Plus Jakarta Sans, sans-serif">SAVIS</text>
    <rect x="60" y="68" width="40" height="40" rx="3" fill="#EB5B00" />
    <rect x="68" y="76" width="7" height="7" rx="1" fill="#640D5F" />
    <rect x="85" y="76" width="7" height="7" rx="1" fill="#640D5F" />
    <rect x="32" y="60" width="24" height="22" rx="2" fill="rgba(255,255,255,0.12)" />
    <rect x="104" y="60" width="24" height="22" rx="2" fill="rgba(255,255,255,0.12)" />
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  hasServices: boolean;
  providerName: string;
  pendingPayout: number;
  nextPayoutDate: string;
  cycleCount: number;
  upcomingBookings: BookingCardData[];
  totalUpcoming: number;
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyDashboard() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <StorefrontIllustration />
      <h1 className="text-[20px] font-bold text-gray-900 mt-6">
        Your provider profile is ready
      </h1>
      <p className="text-[15px] text-gray-500 mt-2 max-w-xs leading-relaxed">
        Add your first service to start receiving bookings and earning on SAVIS.
      </p>
      <button
        onClick={() => router.push('/provider/services/new')}
        className="mt-6 w-[280px] py-3.5 bg-brand-action text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
      >
        + Add a service
      </button>
      <p className="mt-4 text-[13px] text-gray-400">
        Questions?{' '}
        <button
          onClick={() => router.push('/help')}
          className="text-brand-primary underline underline-offset-2"
        >
          Visit Help &amp; Support
        </button>
      </p>
    </main>
  );
}

// ─── Active dashboard ──────────────────────────────────────────────────────────

function ActiveDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();

  // TODO (backend): wire accept/decline/complete to Firestore booking mutations
  const handleAccept = async (id: string) => {
    console.log('TODO: accept booking', id);
    // await updateBookingStatus(id, 'confirmed');
  };
  const handleDecline = async (id: string) => {
    console.log('TODO: decline booking', id);
    // await updateBookingStatus(id, 'declined');
  };
  const handleComplete = async (id: string) => {
    console.log('TODO: complete booking', id);
    // await updateBookingStatus(id, 'completed');
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* Payout card */}
      <PayoutCard
        amount={data.pendingPayout}
        nextPayoutDate={data.nextPayoutDate}
        cycleCount={data.cycleCount}
        onViewEarnings={() => router.push('/provider/earnings')}
      />

      {/* Quick actions */}
      <div className="flex gap-3">
        <QuickActionButton
          icon={<PlusIcon />}
          label="Add service"
          onClick={() => router.push('/provider/services/new')}
        />
        <QuickActionButton
          icon={<CalendarIcon />}
          label="Schedule"
          onClick={() => router.push('/provider/schedule')}
        />
        <QuickActionButton
          icon={<ClipboardIcon />}
          label="Bookings"
          onClick={() => router.push('/provider/bookings')}
        />
      </div>

      {/* Upcoming bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-semibold text-gray-900">Upcoming bookings</h2>
          <button
            onClick={() => router.push('/provider/bookings')}
            className="text-[13px] text-brand-primary hover:underline"
          >
            View all {data.totalUpcoming} →
          </button>
        </div>
        <div className="space-y-3">
          {data.upcomingBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              variant="dashboard"
              onAccept={handleAccept}
              onDecline={handleDecline}
              onComplete={handleComplete}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Page shell ────────────────────────────────────────────────────────────────

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="w-8" />
        <h1 className="text-[17px] font-semibold text-gray-900">Dashboard</h1>
        <StatusPill variant="provider-mode" />
      </header>

      {data.hasServices ? <ActiveDashboard data={data} /> : <EmptyDashboard />}

      <BottomNav mode="provider" />
    </div>
  );
}
