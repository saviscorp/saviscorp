'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { BottomNav } from '@/components/provider/BottomNav'
import { PayoutCard, StatCard, StatusPill } from '@/components/ui'
import { getProviderProfile } from '@/lib/firebase/providers'
import {
  getEarningsSummary,
  getPendingPayoutBookings,
  getTransactionHistory,
  getPayoutConfig,
  calculateNextPayoutDate,
  type EarningsSummary,
  type TransactionRow,
} from '@/lib/firebase/earnings'

// ─── Transaction row ───────────────────────────────────────────────────────────

function TransactionCard({ txn, commissionRate }: { txn: TransactionRow; commissionRate: number }) {
  const [expanded, setExpanded] = useState(false)
  const commission = Math.round(txn.grossKes * commissionRate)

  return (
    <div
      className="bg-white border border-border-savis rounded-xl p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-brand-primary">
            <rect x="2" y="3" width="14" height="12" rx="2"/>
            <path d="M2 7h14M6 1v4M12 1v4"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-gray-900 truncate">{txn.serviceName || 'Service'}</p>
          <p className="text-[13px] text-gray-400">
            {txn.customerName || 'Customer'} · {txn.completedAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[15px] font-bold text-gray-900">KES {txn.netKes.toLocaleString('en-KE')}</p>
          <StatusPill variant={txn.payoutStatus === 'paid' ? 'paid' : 'payout-pending'} className="mt-1" />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-savis bg-surface-gray rounded-lg p-3 space-y-1">
          <p className="text-[13px] text-gray-500">
            Service price: <span className="text-gray-800">KES {txn.grossKes.toLocaleString('en-KE')}</span>
          </p>
          <p className="text-[13px] text-gray-500">
            SAVIS commission ({Math.round(commissionRate * 100)}%): <span className="text-gray-800">– KES {commission.toLocaleString('en-KE')}</span>
          </p>
          <p className="text-[13px] font-bold text-gray-900">
            You earned: KES {txn.netKes.toLocaleString('en-KE')}
          </p>
          <p className="text-[12px] text-gray-400">Ref: {txn.bookingRef}</p>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-surface-gray animate-pulse">
      <div className="h-14 bg-white border-b border-border-savis" />
      <div className="p-4 space-y-4">
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 bg-white rounded-xl" />)}
        </div>
        {[1,2,3].map((i) => <div key={i} className="h-20 bg-white rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterPeriod = 'all-time' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year'
const FILTER_LABELS: Record<FilterPeriod, string> = {
  'all-time': 'All time',
  'this-month': 'This month',
  'last-month': 'Last month',
  'last-3-months': 'Last 3 months',
  'this-year': 'This year',
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [commissionRate, setCommissionRate] = useState(0.07)
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [pendingBookings, setPendingBookings] = useState<TransactionRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [nextPayoutDate, setNextPayoutDate] = useState('')
  const [filter, setFilter] = useState<FilterPeriod>('all-time')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)

  const loadBase = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [profile, config] = await Promise.all([
        getProviderProfile(user.uid),
        getPayoutConfig(),
      ])
      const rate = profile?.commissionRate ?? 0.07
      setCommissionRate(rate)
      setNextPayoutDate(calculateNextPayoutDate(config.cycleStartDate, config.cycleDays))

      const [earn, pending, txns] = await Promise.all([
        getEarningsSummary(user.uid, rate),
        getPendingPayoutBookings(user.uid, rate),
        getTransactionHistory(user.uid, rate, 'all-time'),
      ])
      setSummary(earn)
      setPendingBookings(pending)
      setTransactions(txns)
    } catch (err) {
      console.error('Earnings load error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) loadBase()
  }, [authLoading, loadBase])

  const handleFilterChange = async (f: FilterPeriod) => {
    setFilter(f)
    if (!user) return
    setFilterLoading(true)
    try {
      const txns = await getTransactionHistory(user.uid, commissionRate, f)
      setTransactions(txns)
    } catch (err) {
      console.error('Filter error:', err)
    } finally {
      setFilterLoading(false)
    }
  }

  if (authLoading || loading) return <Skeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-surface-gray flex items-center justify-center px-4">
        <div className="bg-white border border-border-savis rounded-xl p-6 text-center max-w-xs">
          <p className="text-[15px] font-semibold text-gray-900 mb-1">Something went wrong</p>
          <p className="text-[13px] text-gray-400 mb-4">Pull to refresh.</p>
          <button onClick={loadBase} className="px-5 py-2 bg-brand-primary text-white text-[14px] rounded-lg font-medium">Retry</button>
        </div>
      </div>
    )
  }

  const cycleTotal = pendingBookings.reduce((acc, t) => acc + t.netKes, 0)
  const pct = Math.round(commissionRate * 100)

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <BottomNav mode="provider" />
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 4l-6 6 6 6"/></svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Earnings</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 space-y-4">
        <PayoutCard
          amount={summary?.pendingPayout ?? 0}
          nextPayoutDate={nextPayoutDate}
          cycleCount={pendingBookings.length}
          onViewEarnings={() => {}}
          empty={!summary || summary.pendingPayout === 0}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Total earned" value={`KES ${(summary?.totalEarned ?? 0).toLocaleString('en-KE')}`} />
          <StatCard label="Pending payout" value={`KES ${(summary?.pendingPayout ?? 0).toLocaleString('en-KE')}`} />
          <StatCard label="Services done" value={String(summary?.servicesCompleted ?? 0)} accent />
          <StatCard label="Avg per service" value={`KES ${Math.round(summary?.avgPerService ?? 0).toLocaleString('en-KE')}`} />
        </div>

        {/* Current cycle */}
        {pendingBookings.length > 0 && (
          <div className="bg-white border border-border-savis rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wide font-medium text-gray-400">This cycle</p>
              <p className="text-[12px] text-gray-400">Awaiting payout</p>
            </div>
            <div className="divide-y divide-border-savis">
              {pendingBookings.map((t) => (
                <div key={t.id} className="flex justify-between py-2.5 text-[14px]">
                  <span className="text-gray-500 truncate pr-2 max-w-[220px]">
                    {t.serviceName || 'Service'} · {t.completedAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="font-bold text-gray-900 flex-shrink-0">
                    KES {t.netKes.toLocaleString('en-KE')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-end justify-between pt-2.5 border-t border-border-savis">
              <p className="text-[11px] text-gray-400">SAVIS commission ({pct}%) deducted</p>
              <span className="text-[15px] font-bold text-gray-900">
                Cycle total: KES {cycleTotal.toLocaleString('en-KE')}
              </span>
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h2 className="text-[17px] font-semibold text-gray-900 mb-3">Transaction history</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none">
            {(Object.keys(FILTER_LABELS) as FilterPeriod[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
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

          {filterLoading ? (
            <div className="space-y-2">
              {[1,2].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white border border-border-savis rounded-xl p-6 text-center">
              <p className="text-[14px] text-gray-400">No transactions for this period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <TransactionCard key={t.id} txn={t} commissionRate={commissionRate} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
