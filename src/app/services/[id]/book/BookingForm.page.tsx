'use client';

// app/services/[id]/book/page.tsx
// Route: /services/[id]/book
// Multi-step booking form: date picker (calendar) → time slot chips → confirm

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = 'date' | 'time' | 'confirm';

// ─── Mock — TODO: replace with Firestore provider schedule ────────────────────
// TODO (backend):
//   - getProviderAvailability(serviceId) →
//       { workingDaysOfWeek: number[], blockedDates: Date[], bookedSlots: Record<dateStr, string[]> }
//   - createBooking(payload) → new document in bookings collection, trigger Mpesa STK push

const BLOCKED_DATES = new Set([20, 21, 27]); // vacation / unavailable
const INACTIVE_DOW = new Set([0]);            // Sunday = provider day off
const BOOKED_SLOTS_FOR_DATE: Record<number, string[]> = {
  25: ['10:00'],
};

const ALL_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

// ─── Calendar ──────────────────────────────────────────────────────────────────

type CellState = 'available' | 'today' | 'blocked' | 'vacation' | 'inactive' | 'selected' | 'outside';

function buildCells(year: number, month: number, selected: number | null) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells: { date: number; state: CellState }[] = [];

  for (let i = 0; i < firstDay; i++) cells.push({ date: 0, state: 'outside' });

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    let state: CellState = 'available';

    if (selected === d) state = 'selected';
    else if (INACTIVE_DOW.has(dow)) state = 'inactive';
    else if (BLOCKED_DATES.has(d)) state = 'vacation';
    else if (isToday) state = 'today';

    cells.push({ date: d, state });
  }
  return cells;
}

function CalendarPicker({
  year, month, selected,
  onSelect, onPrevMonth, onNextMonth,
}: {
  year: number; month: number; selected: number | null;
  onSelect: (d: number) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const cells = useMemo(() => buildCells(year, month, selected), [year, month, selected]);

  const cellStyle: Record<CellState, string> = {
    available: 'bg-white text-gray-800 hover:bg-brand-light cursor-pointer transition-colors',
    today:     'bg-brand-primary/10 text-brand-primary font-semibold cursor-pointer hover:bg-brand-primary/20',
    selected:  'bg-brand-primary text-white font-semibold rounded-full cursor-pointer',
    blocked:   'bg-surface-gray text-gray-300 cursor-not-allowed',
    vacation:  'bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)] text-gray-300 cursor-not-allowed',
    inactive:  'bg-surface-gray text-gray-300 cursor-not-allowed',
    outside:   '',
  };

  return (
    <div className="bg-white border border-border-savis rounded-xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={onPrevMonth} className="p-1 text-gray-400 hover:text-gray-700">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M10 4L6 8l4 4"/>
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-gray-900 min-w-[130px] text-center">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={onNextMonth} className="p-1 text-gray-400 hover:text-gray-700">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M6 4l4 4-4 4"/>
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[12px] text-gray-400 py-1">{l}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (cell.state === 'outside') return <div key={i} />;
          const clickable = cell.state === 'available' || cell.state === 'today';
          return (
            <button
              key={i}
              disabled={!clickable && cell.state !== 'selected'}
              onClick={() => clickable && onSelect(cell.date)}
              className={`h-10 flex items-center justify-center text-[14px] rounded-lg ${cellStyle[cell.state]}`}
            >
              {cell.date}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {[
          { label: 'Selected', style: 'w-3 h-3 rounded-full bg-brand-primary' },
          { label: 'Unavailable', style: 'w-3 h-3 rounded bg-surface-gray border border-border-savis' },
          { label: 'Blocked', style: 'w-3 h-3 rounded bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)]' },
        ].map(({ label, style }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className={style} />{label}
          </div>
        ))}
      </div>

      <p className="text-[13px] text-gray-400 text-center mt-3">
        Select an available date to continue
      </p>
    </div>
  );
}

// ─── Time slot picker ──────────────────────────────────────────────────────────

function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelect,
}: {
  selectedDate: number;
  selectedTime: string | null;
  onSelect: (t: string | null) => void;
}) {
  const bookedForDate = BOOKED_SLOTS_FOR_DATE[selectedDate] ?? [];

  return (
    <div className="bg-white border border-border-savis rounded-xl p-4">
      <p className="text-[15px] font-semibold text-gray-900 mb-1">Preferred time</p>
      <p className="text-[13px] text-gray-400 mb-3">
        {/* TODO (backend): resolve actual date string from selected date + current month/year */}
        Showing available slots
      </p>

      <div className="flex flex-wrap gap-2">
        {/* Flexible chip — always first, always enabled */}
        <button
          onClick={() => onSelect(selectedTime === 'flexible' ? null : 'flexible')}
          className={`h-10 px-4 rounded-full text-[14px] font-medium transition-colors ${
            selectedTime === 'flexible'
              ? 'bg-brand-primary text-white'
              : 'bg-brand-light text-brand-primary'
          }`}
        >
          Flexible
        </button>

        {ALL_TIME_SLOTS.map((t) => {
          const isBooked = bookedForDate.includes(t);
          const isSelected = selectedTime === t;
          return (
            <button
              key={t}
              disabled={isBooked}
              onClick={() => !isBooked && onSelect(isSelected ? null : t)}
              className={`h-10 px-4 rounded-full text-[14px] font-medium border transition-colors ${
                isSelected
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : isBooked
                  ? 'bg-surface-gray text-gray-300 border-border-savis cursor-not-allowed line-through'
                  : 'bg-white text-gray-800 border-border-savis hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <p className="text-[12px] text-gray-400 mt-3 leading-relaxed">
        Times outside working hours are not shown. Booked slots are unavailable.
      </p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BookServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canProceedToTime = selectedDate !== null;
  const canConfirm = selectedDate !== null && selectedTime !== null;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // TODO (backend): createBooking → Firestore + Mpesa STK push
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      console.log('TODO: create booking', { serviceId, year, month, date: selectedDate, time: selectedTime });
      // const bookingId = await createBooking({ serviceId, date, time, ... });
      // await initiatePayment(bookingId, amount);
      await new Promise((r) => setTimeout(r, 800));
      router.push('/bookings/confirmation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6"/>
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Book a service</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-32 space-y-4">
        {/* Step label */}
        <p className="text-[15px] font-semibold text-gray-900">Select a date</p>

        {/* Calendar */}
        <CalendarPicker
          year={year}
          month={month}
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        {/* Time slot picker — appears after date selected */}
        {canProceedToTime && (
          <TimeSlotPicker
            selectedDate={selectedDate!}
            selectedTime={selectedTime}
            onSelect={setSelectedTime}
          />
        )}

        {/* Special instructions */}
        {canProceedToTime && (
          <div className="bg-white border border-border-savis rounded-xl p-4">
            <label className="block text-[15px] font-semibold text-gray-900 mb-2">
              Special instructions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Any details the provider should know…"
              className="w-full border border-border-savis rounded-lg p-3 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
            />
          </div>
        )}
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-savis px-4 py-4">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || submitting}
          className="w-full py-3.5 bg-brand-action text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Confirming…' : 'Confirm booking'}
        </button>
        {!canConfirm && (
          <p className="text-[12px] text-gray-400 text-center mt-1.5">
            {!selectedDate ? 'Pick a date first' : 'Pick a time to continue'}
          </p>
        )}
      </div>
    </div>
  );
}
