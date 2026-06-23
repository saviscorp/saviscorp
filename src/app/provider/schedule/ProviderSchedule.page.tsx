'use client';

// app/provider/schedule/page.tsx
// Route: /provider/schedule
// Calendar with month/week/day views, vacation markers, working hours sheet.

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/provider/BottomNav';

// ─── Types ─────────────────────────────────────────────────────────────────────

type CellState = 'available' | 'today' | 'booked' | 'vacation' | 'inactive' | 'outside';

interface DayCell {
  date: number;
  state: CellState;
  bookingCount?: number;
}

interface DayDetail {
  date: number;
  month: string;
  year: number;
  isWorking: boolean;
  isVacation: boolean;
  isUnavailable: boolean;
  bookings: { time: string; customer: string; service: string; type: 'confirmed' | 'pending' }[];
}

// ─── Mock data — TODO: replace with Firestore queries ─────────────────────────
// TODO (backend):
//   - getProviderSchedule(uid, year, month) → blocked dates, working days
//   - getBookingsForMonth(uid, year, month) → bookings per date
//   - setVacationDay(uid, date) / removeVacationDay(uid, date)
//   - setUnavailableDay(uid, date) / removeUnavailableDay(uid, date)

const MOCK_BOOKED_DATES = new Set([18, 24, 25]);
const MOCK_VACATION_DATES = new Set([20, 21, 27]);
const MOCK_INACTIVE_DAYS_OF_WEEK = new Set([0]); // 0 = Sunday

const MOCK_DAY_DETAILS: Record<number, Partial<DayDetail>> = {
  24: {
    isWorking: true,
    bookings: [
      { time: '10:00am', customer: 'David K.', service: 'Home Deep Cleaning', type: 'confirmed' },
      { time: '2:30pm',  customer: 'Pending booking', service: 'Office Cleaning', type: 'pending' },
    ],
  },
};

// ─── Calendar utilities ────────────────────────────────────────────────────────

function buildMonthCells(year: number, month: number): DayCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells: DayCell[] = [];

  // Leading empties
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: 0, state: 'outside' });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    let state: CellState = 'available';

    if (MOCK_INACTIVE_DAYS_OF_WEEK.has(dow)) state = 'inactive';
    else if (MOCK_VACATION_DATES.has(d)) state = 'vacation';
    else if (isToday) state = 'today';
    else if (MOCK_BOOKED_DATES.has(d)) state = 'booked';

    cells.push({ date: d, state, bookingCount: MOCK_BOOKED_DATES.has(d) ? 1 : 0 });
  }

  return cells;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarCell({ cell, onClick }: { cell: DayCell; onClick?: () => void }) {
  if (cell.state === 'outside') return <div />;

  const base = 'flex flex-col items-center justify-center h-10 rounded-lg text-[14px] select-none';
  const stateStyle: Record<CellState, string> = {
    available: 'bg-white text-gray-800 hover:bg-brand-light cursor-pointer',
    today:     'bg-brand-primary text-white rounded-full cursor-pointer',
    booked:    'bg-white text-gray-800 hover:bg-brand-light cursor-pointer',
    vacation:  'bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)] text-gray-300 cursor-not-allowed',
    inactive:  'bg-surface-gray text-gray-300 cursor-not-allowed',
    outside:   '',
  };

  return (
    <button
      className={`${base} ${stateStyle[cell.state]}`}
      onClick={cell.state === 'available' || cell.state === 'booked' || cell.state === 'today' ? onClick : undefined}
      disabled={cell.state === 'vacation' || cell.state === 'inactive'}
    >
      <span>{cell.date}</span>
      {cell.state === 'booked' && (
        <span className="w-1.5 h-1.5 rounded-full bg-brand-warm mt-0.5" />
      )}
    </button>
  );
}

function DayDetailSheet({
  detail,
  onClose,
  onToggleVacation,
  onToggleUnavailable,
}: {
  detail: DayDetail;
  onClose: () => void;
  onToggleVacation: (d: number, val: boolean) => void;
  onToggleUnavailable: (d: number, val: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full p-5 max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border-savis mx-auto mb-4" />

        <h2 className="text-[18px] font-bold text-gray-900 mb-2">
          {detail.isVacation
            ? `${DAY_LABELS[new Date(detail.year, MONTH_NAMES.indexOf(detail.month), detail.date).getDay()]}., ${detail.date} ${detail.month} ${detail.year}`
            : `Monday, ${detail.date} ${detail.month} ${detail.year}`}
        </h2>

        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${detail.isVacation ? 'bg-brand-gold' : detail.isWorking ? 'bg-success' : 'bg-gray-300'}`} />
          <span className={`text-[14px] font-medium ${detail.isVacation ? 'text-warning' : detail.isWorking ? 'text-success' : 'text-gray-400'}`}>
            {detail.isVacation ? 'Vacation day' : detail.isWorking ? 'Working day' : 'Day off'}
          </span>
          {detail.isVacation && (
            <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-light text-warning">Vacation</span>
          )}
        </div>

        {detail.bookings.length > 0 && (
          <>
            <p className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-2">Bookings on this day</p>
            <div className="space-y-2 mb-4">
              {detail.bookings.map((b, i) => (
                <div key={i} className="flex items-center gap-3 text-[14px]">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.type === 'confirmed' ? 'bg-brand-primary' : 'bg-brand-gold'}`} />
                  <span className="text-gray-700">{b.time} · {b.customer} · {b.service}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <hr className="border-border-savis mb-3" />
        <p className="text-[12px] uppercase tracking-wide text-gray-400 font-medium mb-3">Manage this day</p>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[15px] font-medium text-gray-800">Mark as vacation day</span>
            <ToggleSwitch
              checked={detail.isVacation}
              onChange={(v) => onToggleVacation(detail.date, v)}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[15px] font-medium text-gray-800">Mark as unavailable</span>
            <ToggleSwitch
              checked={detail.isUnavailable}
              onChange={(v) => onToggleUnavailable(detail.date, v)}
            />
          </label>
        </div>

        {detail.isVacation && (
          <button
            onClick={() => onToggleVacation(detail.date, false)}
            className="mt-4 text-[13px] text-brand-primary underline underline-offset-2"
          >
            Remove vacation block
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-brand-action' : 'bg-surface-gray border border-border-savis'}`}
    >
      <span className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedDetail: DayDetail | null = selectedDate
    ? {
        date: selectedDate,
        month: MONTH_NAMES[month],
        year,
        isWorking: !MOCK_INACTIVE_DAYS_OF_WEEK.has(new Date(year, month, selectedDate).getDay()),
        isVacation: MOCK_VACATION_DATES.has(selectedDate),
        isUnavailable: false,
        bookings: MOCK_DAY_DETAILS[selectedDate]?.bookings ?? [],
      }
    : null;

  // TODO (backend): handleToggleVacation → write to Firestore providerSchedule/{uid}/blocked/{date}
  const handleToggleVacation = (date: number, val: boolean) => {
    console.log('TODO: set vacation', date, val);
  };
  const handleToggleUnavailable = (date: number, val: boolean) => {
    console.log('TODO: set unavailable', date, val);
  };

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <BackIcon />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">My Schedule</h1>
        <button
          onClick={() => router.push('/provider/schedule/working-hours')}
          className="text-[13px] text-brand-primary font-medium"
        >
          Set working hours
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-24">
        {/* View switcher */}
        <div className="flex bg-surface-gray rounded-[10px] p-1 gap-1">
          {['Month', 'Week', 'Day'].map((v) => (
            <button
              key={v}
              className={`flex-1 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
                v === 'Month' ? 'bg-brand-primary text-white' : 'text-gray-500'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={prevMonth} className="p-1 text-gray-500 hover:text-gray-800">
            <ChevronLeft />
          </button>
          <span className="text-[17px] font-semibold text-gray-900 min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-500 hover:text-gray-800">
            <ChevronRight />
          </button>
          <button
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            className="text-[11px] font-medium bg-brand-light text-brand-primary px-2.5 py-1 rounded-full"
          >
            Today
          </button>
        </div>

        {/* Calendar grid */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="text-center text-[12px] text-gray-400 py-1">{l}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => (
              <CalendarCell
                key={i}
                cell={cell}
                onClick={() => setSelectedDate(cell.date)}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Bookings', el: <span className="w-2 h-2 rounded-full bg-brand-warm" /> },
            { label: 'Unavailable', el: <span className="w-3 h-3 rounded bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)]" /> },
            { label: 'Day off', el: <span className="w-3 h-3 rounded bg-surface-gray border border-border-savis" /> },
          ].map(({ label, el }) => (
            <div key={label} className="flex items-center gap-1.5 text-[12px] text-gray-400">
              {el}{label}
            </div>
          ))}
        </div>

        {/* Working hours strip */}
        <div className="bg-white border border-border-savis rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <ClockIcon className="w-4 h-4 text-brand-primary" />
            Mon–Fri 08:00–18:00 · Sat 09:00–14:00 · Sun: Off
          </div>
          <button
            onClick={() => router.push('/provider/schedule/working-hours')}
            className="text-[13px] text-brand-primary font-medium"
          >
            Edit
          </button>
        </div>
      </main>

      {selectedDetail && (
        <DayDetailSheet
          detail={selectedDetail}
          onClose={() => setSelectedDate(null)}
          onToggleVacation={handleToggleVacation}
          onToggleUnavailable={handleToggleUnavailable}
        />
      )}

      <BottomNav mode="provider" />
    </div>
  );
}

// Icons
const BackIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 4l-6 6 6 6"/></svg>;
const ChevronLeft = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M13 5l-5 5 5 5"/></svg>;
const ChevronRight = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M7 5l5 5-5 5"/></svg>;
const ClockIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>;
