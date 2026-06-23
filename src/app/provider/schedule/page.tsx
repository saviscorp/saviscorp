'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { BottomNav } from '@/components/provider/BottomNav'
import {
  getProviderSchedule,
  setVacationDay,
  setUnavailableDay,
} from '@/lib/firebase/schedule'
import { getUpcomingBookings } from '@/lib/firebase/bookings'
import { updateProviderWorkingHours, DEFAULT_WORKING_DAYS } from '@/lib/firebase/providers'
import type { WorkingDays } from '@/lib/firebase/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

type CellState = 'available' | 'today' | 'booked' | 'vacation' | 'inactive' | 'outside'
type Tab = 'calendar' | 'hours'

interface DayCell {
  date: number
  state: CellState
  isoDate: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DOW_KEYS = ['sun','mon','tue','wed','thu','fri','sat'] as const
const DAY_FULL: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const ORDERED_DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const

// Inline colours — no custom Tailwind classes
const C = {
  brandPrimary:  '#640D5F',
  brandAction:   '#D91656',
  brandWarm:     '#EB5B00',
  brandLight:    '#FDF0FC',
  surfaceGray:   '#F5F6F8',
  border:        '#E8E2E8',
  textPrimary:   '#1A0A1A',
  textSecondary: '#6B5C6B',
  disabled:      '#B8A8B8',
  success:       '#1D9E75',
  successLight:  '#E1F5EE',
  warning:       '#9C6B00',
  warningLight:  '#FFF8E1',
  white:         '#FFFFFF',
}

// ─── Calendar builder ─────────────────────────────────────────────────────────

function buildMonthCells(
  year: number,
  month: number,
  vacationSet: Set<string>,
  unavailableSet: Set<string>,
  inactiveDOW: Set<number>,
  bookedSet: Set<string>
): DayCell[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const cells: DayCell[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: 0, state: 'outside', isoDate: '' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay()
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday =
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

    let state: CellState = 'available'
    if (inactiveDOW.has(dow)) state = 'inactive'
    else if (vacationSet.has(iso) || unavailableSet.has(iso)) state = 'vacation'
    else if (isToday) state = 'today'
    else if (bookedSet.has(iso)) state = 'booked'

    cells.push({ date: d, state, isoDate: iso })
  }
  return cells
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        background: checked ? C.brandAction : C.surfaceGray,
        border: `1px solid ${checked ? C.brandAction : C.border}`,
      }}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0"
    >
      <span
        className={`inline-block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

function CalendarCell({
  cell,
  selected,
  onClick,
}: {
  cell: DayCell
  selected: boolean
  onClick?: () => void
}) {
  if (cell.state === 'outside') return <div />

  const base = 'flex flex-col items-center justify-center h-10 rounded-lg text-[14px] select-none transition-colors'
  const clickable = cell.state === 'available' || cell.state === 'booked' || cell.state === 'today'

  const cellBg: Record<CellState, React.CSSProperties> = {
    available: { background: selected ? C.brandLight : C.white, color: C.textPrimary },
    today:     { background: C.brandPrimary, color: C.white, borderRadius: '50%' },
    booked:    { background: selected ? C.brandLight : C.white, color: C.textPrimary },
    vacation:  {
      background: `repeating-linear-gradient(135deg, ${C.surfaceGray} 0px, ${C.surfaceGray} 4px, ${C.border} 4px, ${C.border} 5px)`,
      color: C.disabled,
    },
    inactive: { background: C.surfaceGray, color: C.disabled },
    outside:  {},
  }

  return (
    <button
      style={{
        ...cellBg[cell.state],
        outline: selected && clickable ? `2px solid ${C.brandPrimary}` : 'none',
      }}
      className={`${base} ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      <span>{cell.date}</span>
      {cell.state === 'booked' && (
        <span
          className="w-1.5 h-1.5 rounded-full mt-0.5"
          style={{ background: C.brandWarm }}
        />
      )}
    </button>
  )
}

// ─── Day detail panel (inline — no fixed positioning) ─────────────────────────

function DayDetailPanel({
  isoDate,
  isVacation,
  isUnavailable,
  isWorking,
  onToggleVacation,
  onToggleUnavailable,
  onClose,
}: {
  isoDate: string
  isVacation: boolean
  isUnavailable: boolean
  isWorking: boolean
  onToggleVacation: (iso: string, val: boolean) => void
  onToggleUnavailable: (iso: string, val: boolean) => void
  onClose: () => void
}) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dayName = dt.toLocaleDateString('en-KE', { weekday: 'long' })
  const monthName = MONTH_NAMES[m - 1]

  const statusLabel = isVacation ? 'Vacation day' : isUnavailable ? 'Unavailable' : isWorking ? 'Working day' : 'Day off'
  const statusColor = isVacation ? C.warning : isUnavailable ? C.warning : isWorking ? C.success : C.disabled
  const statusBg   = isVacation ? C.warningLight : isUnavailable ? C.warningLight : isWorking ? C.successLight : C.surfaceGray

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: C.white, border: `1px solid ${C.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[16px] font-bold" style={{ color: C.textPrimary }}>
            {dayName}, {d} {monthName} {y}
          </p>
          <span
            className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
            style={{ background: statusBg, color: statusColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            {statusLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: C.surfaceGray, color: C.textSecondary }}
          aria-label="Close"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Toggles */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.textSecondary }}>
          Manage this day
        </p>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[15px] font-medium" style={{ color: C.textPrimary }}>
            Mark as vacation day
          </span>
          <ToggleSwitch
            checked={isVacation}
            onChange={(v) => onToggleVacation(isoDate, v)}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[15px] font-medium" style={{ color: C.textPrimary }}>
            Mark as unavailable
          </span>
          <ToggleSwitch
            checked={isUnavailable}
            onChange={(v) => onToggleUnavailable(isoDate, v)}
          />
        </label>
      </div>
    </div>
  )
}

// ─── Working hours panel ──────────────────────────────────────────────────────

function WorkingHoursPanel({
  workingDays,
  onUpdate,
  onSave,
  saving,
}: {
  workingDays: WorkingDays
  onUpdate: (key: keyof WorkingDays, patch: { active?: boolean; start?: string; end?: string }) => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-3">
      <p className="text-[13px]" style={{ color: C.textSecondary }}>
        Set the days and hours you are available for bookings.
      </p>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${C.border}` }}
      >
        {ORDERED_DAYS.map((key, i) => {
          const day = workingDays[key]
          return (
            <div
              key={key}
              className="px-4 py-3 flex items-center gap-3"
              style={{
                background: C.white,
                borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
              }}
            >
              {/* Day name */}
              <span
                className="text-[14px] font-medium w-24 flex-shrink-0"
                style={{ color: day.active ? C.textPrimary : C.disabled }}
              >
                {DAY_FULL[key]}
              </span>

              {/* Toggle */}
              <ToggleSwitch
                checked={day.active}
                onChange={(v) => onUpdate(key, { active: v })}
              />

              {/* Time inputs */}
              {day.active ? (
                <div className="flex items-center gap-2 ml-2 flex-1">
                  <input
                    type="time"
                    value={day.start}
                    onChange={(e) => onUpdate(key, { start: e.target.value })}
                    className="flex-1 h-9 px-2 rounded-lg text-[14px] outline-none"
                    style={{
                      border: `1px solid ${C.border}`,
                      color: C.textPrimary,
                      background: C.white,
                    }}
                  />
                  <span className="text-[13px]" style={{ color: C.textSecondary }}>–</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(e) => onUpdate(key, { end: e.target.value })}
                    className="flex-1 h-9 px-2 rounded-lg text-[14px] outline-none"
                    style={{
                      border: `1px solid ${C.border}`,
                      color: C.textPrimary,
                      background: C.white,
                    }}
                  />
                </div>
              ) : (
                <span className="ml-2 text-[13px]" style={{ color: C.disabled }}>Off</span>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full h-[48px] rounded-[10px] text-white text-[15px] font-semibold transition-all active:scale-[0.98]"
        style={{
          background: saving ? C.disabled : C.brandAction,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Saving…' : 'Save working hours'}
      </button>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse" style={{ background: C.surfaceGray }}>
      <div className="h-[60px]" style={{ background: C.white, borderBottom: `1px solid ${C.border}` }} />
      <div className="p-4 space-y-4">
        <div className="h-10 rounded-lg" style={{ background: '#E5E7EB' }} />
        <div className="h-8 rounded-lg w-48 mx-auto" style={{ background: '#E5E7EB' }} />
        <div className="h-64 rounded-xl" style={{ background: C.white }} />
        <div className="h-16 rounded-xl" style={{ background: C.white }} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedIso, setSelectedIso] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('calendar')

  const [vacationDates, setVacationDates] = useState<Set<string>>(new Set())
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [workingDays, setWorkingDays] = useState<WorkingDays>(DEFAULT_WORKING_DAYS)
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Load schedule from Firestore ────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [sched, upcoming] = await Promise.all([
        getProviderSchedule(user.uid),
        getUpcomingBookings(user.uid),
      ])
      setWorkingDays(sched.workingDays)
      setVacationDates(new Set(sched.vacationDates))
      setUnavailableDates(new Set(sched.unavailableDates))
      setBookedDates(new Set(upcoming.map((b) => b.preferredDate)))
    } catch (err) {
      console.error('Schedule load error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  // ── Derived data ────────────────────────────────────────────────────────────

  const inactiveDOW = useMemo(() => {
    const s = new Set<number>()
    DOW_KEYS.forEach((key, i) => {
      if (!workingDays[key].active) s.add(i)
    })
    return s
  }, [workingDays])

  const cells = useMemo(
    () => buildMonthCells(year, month, vacationDates, unavailableDates, inactiveDOW, bookedDates),
    [year, month, vacationDates, unavailableDates, inactiveDOW, bookedDates]
  )

  const selectedDetail = useMemo(() => {
    if (!selectedIso) return null
    const [y, m] = selectedIso.split('-').map(Number)
    const dow = new Date(y, m - 1, Number(selectedIso.split('-')[2])).getDay()
    const dowKey = DOW_KEYS[dow]
    return {
      isoDate: selectedIso,
      isVacation: vacationDates.has(selectedIso),
      isUnavailable: unavailableDates.has(selectedIso),
      isWorking: workingDays[dowKey].active,
    }
  }, [selectedIso, vacationDates, unavailableDates, workingDays])

  // ── Month nav ───────────────────────────────────────────────────────────────

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
    setSelectedIso(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
    setSelectedIso(null)
  }

  // ── Toggle handlers ─────────────────────────────────────────────────────────

  function toggleVacation(isoDate: string, val: boolean) {
    setVacationDates((prev) => {
      const next = new Set(prev)
      if (val) next.add(isoDate)
      else next.delete(isoDate)
      return next
    })
    if (val) {
      setUnavailableDates((prev) => {
        const next = new Set(prev)
        next.delete(isoDate)
        return next
      })
    }
    // TODO (backend): setVacationDay(user.uid, isoDate, val).catch(console.error)
    if (user) {
      setVacationDay(user.uid, isoDate, val).catch((err) => {
        console.error('setVacationDay failed:', err)
        load()
      })
    }
  }

  function toggleUnavailable(isoDate: string, val: boolean) {
    setUnavailableDates((prev) => {
      const next = new Set(prev)
      if (val) next.add(isoDate)
      else next.delete(isoDate)
      return next
    })
    if (val) {
      setVacationDates((prev) => {
        const next = new Set(prev)
        next.delete(isoDate)
        return next
      })
    }
    if (user) {
      setUnavailableDay(user.uid, isoDate, val).catch((err) => {
        console.error('setUnavailableDay failed:', err)
        load()
      })
    }
  }

  // ── Working hours handlers ──────────────────────────────────────────────────

  function updateDay(
    key: keyof WorkingDays,
    patch: { active?: boolean; start?: string; end?: string }
  ) {
    setWorkingDays((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }))
  }

  async function handleSaveHours() {
    if (!user) return
    setSaving(true)
    try {
      await updateProviderWorkingHours(user.uid, workingDays)
    } catch (err) {
      console.error('Failed to save working hours:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Working hours summary (for calendar tab strip) ──────────────────────────

  function workingHoursLabel(): string {
    const active = ORDERED_DAYS.filter((k) => workingDays[k].active)
    if (active.length === 0) return 'No working days set'
    const abbr = active.map((k) => DAY_FULL[k].slice(0, 3)).join(', ')
    const first = workingDays[active[0]]
    return `${abbr} · ${first.start}–${first.end}`
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading || authLoading) return <ScheduleSkeleton />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.surfaceGray }}>
        <BottomNav mode="provider" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div
            className="rounded-xl p-6 text-center max-w-xs"
            style={{ background: C.white, border: `1px solid ${C.border}` }}
          >
            <p className="text-[15px] font-semibold mb-1" style={{ color: C.textPrimary }}>
              Something went wrong
            </p>
            <p className="text-[13px] mb-4" style={{ color: C.textSecondary }}>
              Pull to refresh.
            </p>
            <button
              onClick={load}
              className="px-5 py-2 rounded-lg text-[14px] font-medium text-white"
              style={{ background: C.brandPrimary }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.surfaceGray }}>
      <BottomNav mode="provider" />

      {/* Page header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}
      >
        <h1 className="text-[17px] font-semibold" style={{ color: C.textPrimary }}>
          My Schedule
        </h1>
        <div className="w-8" />
      </div>

      {/* Tab switcher */}
      <div
        className="px-4 flex"
        style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}
      >
        {(['calendar', 'hours'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="flex-1 py-3 text-[14px] font-medium transition-colors border-b-2"
            style={{
              borderColor: activeTab === t ? C.brandAction : 'transparent',
              color: activeTab === t ? C.brandAction : C.textSecondary,
            }}
          >
            {t === 'calendar' ? 'Calendar' : 'Working hours'}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* ── Calendar tab ── */}
        {activeTab === 'calendar' && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={prevMonth}
                className="p-1"
                style={{ color: C.textSecondary }}
                aria-label="Previous month"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M13 5l-5 5 5 5" />
                </svg>
              </button>
              <span className="text-[17px] font-semibold min-w-[140px] text-center" style={{ color: C.textPrimary }}>
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1"
                style={{ color: C.textSecondary }}
                aria-label="Next month"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M7 5l5 5-5 5" />
                </svg>
              </button>
              <button
                onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedIso(null) }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: C.brandLight, color: C.brandPrimary }}
              >
                Today
              </button>
            </div>

            {/* Calendar grid */}
            <div
              className="rounded-xl p-3"
              style={{ background: C.white, border: `1px solid ${C.border}` }}
            >
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((l, i) => (
                  <div
                    key={i}
                    className="text-center text-[12px] py-1"
                    style={{ color: C.textSecondary }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((cell, i) => (
                  <CalendarCell
                    key={i}
                    cell={cell}
                    selected={cell.isoDate === selectedIso}
                    onClick={() =>
                      setSelectedIso(cell.isoDate === selectedIso ? null : cell.isoDate)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 flex-wrap">
              {[
                {
                  label: 'Bookings',
                  el: (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: C.brandWarm }}
                    />
                  ),
                },
                {
                  label: 'Vacation / unavailable',
                  el: (
                    <span
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{
                        background: `repeating-linear-gradient(135deg, ${C.surfaceGray} 0px, ${C.surfaceGray} 4px, ${C.border} 4px, ${C.border} 5px)`,
                      }}
                    />
                  ),
                },
                {
                  label: 'Day off',
                  el: (
                    <span
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ background: C.surfaceGray, border: `1px solid ${C.border}` }}
                    />
                  ),
                },
              ].map(({ label, el }) => (
                <div key={label} className="flex items-center gap-1.5 text-[12px]" style={{ color: C.textSecondary }}>
                  {el}
                  {label}
                </div>
              ))}
            </div>

            {/* Working hours summary strip */}
            <div
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: C.white, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-2 text-[12px] flex-1 min-w-0">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: C.brandPrimary }}
                >
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v4l3 2" />
                </svg>
                <span className="truncate" style={{ color: C.textSecondary }}>
                  {workingHoursLabel()}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('hours')}
                className="text-[13px] font-medium ml-2 flex-shrink-0"
                style={{ color: C.brandPrimary }}
              >
                Edit
              </button>
            </div>

            {/* Day detail panel — inline, no fixed positioning */}
            {selectedDetail && (
              <DayDetailPanel
                isoDate={selectedDetail.isoDate}
                isVacation={selectedDetail.isVacation}
                isUnavailable={selectedDetail.isUnavailable}
                isWorking={selectedDetail.isWorking}
                onToggleVacation={toggleVacation}
                onToggleUnavailable={toggleUnavailable}
                onClose={() => setSelectedIso(null)}
              />
            )}
          </>
        )}

        {/* ── Working hours tab ── */}
        {activeTab === 'hours' && (
          <WorkingHoursPanel
            workingDays={workingDays}
            onUpdate={updateDay}
            onSave={handleSaveHours}
            saving={saving}
          />
        )}

      </main>
    </div>
  )
}
