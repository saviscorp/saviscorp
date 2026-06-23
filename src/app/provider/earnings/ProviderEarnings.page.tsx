'use client';

// app/provider/earnings/page.tsx
// Route: /provider/earnings
// Two sections: outstanding payout overview + full transaction history

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PayoutCard, StatCard, StatusPill } from '@/components/ui';
import { BottomNav } from '@/components/provider/BottomNav';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  grossKes: number;
  commissionPct: number;
  netKes: number;
  payoutStatus: 'paid' | 'payout-pending';
  bookingRef: string;
}

// ─── Mock — TODO: replace with Firestore earnings queries ─────────────────────
// TODO (backend):
//   - getEarningsSummary(uid) → totalEarned, pendingPayout, serviceCount, avgPerService
//   - getTransactions(uid, filter) → paginated transaction history
//   - getCycleTransactions(uid, cycleStart, cycleEnd) → current cycle breakdown

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', serviceName: 'Home Deep Cleaning', customerName: 'David K.',  date: '18 Jun 2025', grossKes: 1200, commissionPct: 7, netKes: 1116, payoutStatus: 'payout-pending', bookingRef: 'BK-A3F2C9D1' },
  { id: 't2', serviceName: 'Office Cleaning',    customerName: 'Mary W.',   date: '15 Jun 2025', grossKes: 2500, commissionPct: 7, netKes: 2325, payoutStatus: 'paid',           bookingRef: 'BK-B7D1E2F3' },
  { id: 't3', serviceName: 'Home Deep Cleaning', customerName: 'James O.',  date: '12 Jun 2025', grossKes: 1200, commissionPct: 7, netKes: 1116, payoutStatus: 'payout-pending', bookingRef: 'BK-C9A8B7D2' },
];

const CYCLE_TRANSACTIONS = MOCK_TRANSACTIONS; // same for MVP demo

type FilterPeriod = 'all-time' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year';
const FILTER_LABELS: Record<FilterPeriod, string> = {
  'all-time':     'All time',
  'this-month':   'This month',
  'last-month':   'Last month',
  'last-3-months':'Last 3 months',
  'this-year':    'This year',
};

// ─── Transaction row ───────────────────────────────────────────────────────────

function TransactionRow({ txn }: { txn: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const commission = Math.round(txn.grossKes * txn.commissionPct / 100);

  return (
    <div
      className="bg-white border border-border-savis rounded-xl p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-brand-primary">
            <rect x="2" y="3" width="14" height="12" rx="2" />
            <path d="M2 7h14M6 1v4M12 1v4" />
          </svg>
        </div>
        {/* Middle */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900 truncate">{txn.serviceName}</p>
          <p className="text-[13px] text-gray-400">{txn.customerName} · {txn.date}</p>
        </div>
        {/* Right */}
        <div className="text-right flex-shrink-0">
          <p className="text-[15px] font-bold text-gray-900">KES {txn.netKes.toLocaleString('en-KE')}</p>
          <StatusPill variant={txn.payoutStatus} className="mt-1" />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-savis bg-surface-gray rounded-lg p-3 space-y-1">
          <p className="text-[13px] text-gray-500">
            Service price: <span className="text-gray-800">KES {txn.grossKes.toLocaleString('en-KE')}</span>
          </p>
          <p className="text-[13px] text-gray-500">
            SAVIS commission ({txn.commissionPct}%): <span className="text-gray-800">– KES {commission.toLocaleString('en-KE')}</span>
          </p>
          <p className="text-[13px] font-bold text-gray-900">
            You earned: KES {txn.netKes.toLocaleString('en-KE')}
          </p>
          <p className="text-[12px] text-gray-400">Ref: {txn.bookingRef}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterPeriod>('all-time');

  const cycleTotal = CYCLE_TRANSACTIONS.reduce((acc, t) => acc + t.netKes, 0);

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <BottomNav mode="provider" />

      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Earnings</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Payout card */}
        <PayoutCard
          amount={12450}
          nextPayoutDate="1 Jul 2025"
          cycleCount={8}
          onViewEarnings={() => {}}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Total earned"   value="KES 28,350" />
          <StatCard label="Pending payout" value="KES 12,450" />
          <StatCard label="Services done"  value="23" accent />
          <StatCard label="Avg per service" value="KES 1,233" />
        </div>

        {/* Current cycle breakdown */}
        <div className="bg-white border border-border-savis rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wide font-medium text-gray-400">This cycle</p>
            <p className="text-[12px] text-gray-400">16 Jun – 30 Jun</p>
          </div>
          <div className="divide-y divide-border-savis">
            {CYCLE_TRANSACTIONS.map((t) => (
              <div key={t.id} className="flex justify-between py-2.5 text-[14px]">
                <span className="text-gray-500 truncate pr-2 max-w-[220px]">
                  {t.serviceName} · {t.customerName} · {t.date.split(' ').slice(0,2).join(' ')}
                </span>
                <span className="font-bold text-gray-900 flex-shrink-0">
                  KES {t.netKes.toLocaleString('en-KE')}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2.5 border-t border-border-savis">
            <span className="text-[15px] font-bold text-gray-900">
              Cycle total: KES {cycleTotal.toLocaleString('en-KE')}
            </span>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-[17px] font-semibold text-gray-900 mb-3">Transaction history</h2>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
            {(Object.keys(FILTER_LABELS) as FilterPeriod[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                  filter === f
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-gray-500 border-border-savis'
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {/* TODO (backend): filter MOCK_TRANSACTIONS by `filter` period against real dates */}
            {MOCK_TRANSACTIONS.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
