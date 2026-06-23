'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  updateProviderWorkingHours,
  DEFAULT_WORKING_DAYS,
  type WorkingDays,
  type DayConfig,
} from '@/lib/firebase/providers'
import { getProviderSchedule } from '@/lib/firebase/schedule'

// ─── Day mapping ───────────────────────────────────────────────────────────────

const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const
const DAY_KEY_MAP: Record<string, keyof WorkingDays> = {
  Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed',
  Thursday: 'thu', Friday: 'fri', Saturday: 'sat', Sunday: 'sun',
}

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
        checked ? 'bg-brand-action' : 'bg-surface-gray border border-border-savis'
      }`}
    >
      <span className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-surface-gray animate-pulse">
      <div className="h-14 bg-white border-b border-border-savis" />
      <div className="p-4 space-y-2">
        {[1,2,3,4,5,6,7].map((i) => (
          <div key={i} className="h-14 bg-white rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type LocalSchedule = Record<string, DayConfig>

export default function WorkingHoursPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [schedule, setSchedule] = useState<LocalSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const sched = await getProviderSchedule(user.uid)
      const local: LocalSchedule = {}
      for (const fullDay of FULL_DAYS) {
        const key = DAY_KEY_MAP[fullDay]
        local[fullDay] = sched.workingDays[key]
      }
      setSchedule(local)
    } catch (err) {
      console.error('WorkingHours load error:', err)
      setLoadError(true)
      // Fall back to defaults
      const local: LocalSchedule = {}
      for (const fullDay of FULL_DAYS) {
        const key = DAY_KEY_MAP[fullDay]
        local[fullDay] = DEFAULT_WORKING_DAYS[key]
      }
      setSchedule(local)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const update = (day: string, patch: Partial<DayConfig>) => {
    setSchedule((prev) => prev ? { ...prev, [day]: { ...prev[day], ...patch } } : prev)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user || !schedule) return
    setSaving(true)
    try {
      const workingDays: WorkingDays = {} as WorkingDays
      for (const fullDay of FULL_DAYS) {
        const key = DAY_KEY_MAP[fullDay]
        workingDays[key] = schedule[fullDay]
      }
      await updateProviderWorkingHours(user.uid, workingDays)
      setSaved(true)
      setTimeout(() => router.back(), 800)
    } catch (err) {
      console.error('Save working hours error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !schedule) return <Skeleton />

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Working hours</h1>
      </header>

      {loadError && (
        <div className="mx-4 mt-4 bg-warning-light text-warning text-[13px] rounded-xl px-4 py-3">
          Could not load your saved schedule. Showing defaults.
        </div>
      )}

      <main className="flex-1 px-4 py-5 pb-32">
        <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
          Set the days and times you&apos;re available to take bookings.
        </p>
        <div className="bg-white border border-border-savis rounded-xl overflow-hidden divide-y divide-border-savis">
          {FULL_DAYS.map((day) => {
            const s = schedule[day]
            return (
              <div key={day} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-medium ${s.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  <ToggleSwitch checked={s.active} onChange={(v) => update(day, { active: v })} />
                </div>
                {s.active && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <select
                      value={s.start}
                      onChange={(e) => update(day, { start: e.target.value })}
                      className="border border-border-savis rounded-lg px-2 py-1.5 text-[13px] text-gray-800 bg-surface-gray w-[80px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-[13px] text-gray-400">to</span>
                    <select
                      value={s.end}
                      onChange={(e) => update(day, { end: e.target.value })}
                      className="border border-border-savis rounded-lg px-2 py-1.5 text-[13px] text-gray-800 bg-surface-gray w-[80px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-savis px-4 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-brand-action text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save working hours'}
        </button>
      </div>
    </div>
  )
}
