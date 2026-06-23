// app/provider/dashboard/page.tsx
// Route: /provider/dashboard
// Shows empty state when provider has no services/bookings,
// active state once data exists. Backend TODOs marked clearly.

import { Suspense } from 'react';
// Legacy file — superseded by page.tsx + DashboardClient.tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DashboardClient } from './DashboardClient';

// ─── TODO (backend): Replace with real auth + data fetch ─────────────────────
// import { getCurrentProvider } from '@/lib/firebase/providers';
// import { getPendingPayout }   from '@/lib/firebase/earnings';
// import { getUpcomingBookings } from '@/lib/firebase/bookings';

async function getDashboardData() {
  // TODO: pull from Firestore — providers/{uid}, bookings collection
  return {
    hasServices: true,        // false → render empty state
    providerName: 'Savis K.',
    pendingPayout: 12450,
    nextPayoutDate: '1 Jul 2025',
    cycleCount: 8,
    upcomingBookings: [
      {
        id: 'b1',
        customerName: 'David K.',
        customerInitials: 'DK',
        serviceName: 'Home Deep Cleaning',
        dateTime: 'Mon 24 Jun · 10:00am',
        location: 'Westlands',
        status: 'pending' as const,
        price: 1200,
        specialInstructions: 'Please bring eco-friendly products. I have two cats.',
        bookingRef: 'BK-A3F2C9D1',
      },
      {
        id: 'b2',
        customerName: 'Mary W.',
        customerInitials: 'MW',
        serviceName: 'Office Cleaning',
        dateTime: 'Tue 25 Jun · 2:00pm',
        location: 'Karen',
        status: 'confirmed' as const,
        price: 2500,
        bookingRef: 'BK-B7D1E2F3',
      },
      {
        id: 'b3',
        customerName: 'James O.',
        customerInitials: 'JO',
        serviceName: 'Home Deep Cleaning',
        dateTime: 'Wed 26 Jun · Flexible',
        status: 'confirmed' as const,
        price: 1200,
        bookingRef: 'BK-C9A8B7D2',
      },
    ],
    totalUpcoming: 12,
    showProviderBanner: false,
  };
}

export default async function ProviderDashboardPage() {
  const data = await getDashboardData();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialData={data} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-gray pb-20 animate-pulse">
      <div className="h-14 bg-white border-b border-border-savis" />
      <div className="p-4 space-y-4">
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-border-savis" />
        ))}
      </div>
    </div>
  );
}
