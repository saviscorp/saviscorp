'use client';

import { useMemo } from 'react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

type CellState = 'available' | 'today' | 'blocked' | 'inactive' | 'selected' | 'outside';

function buildCells(
  year: number,
  month: number,
  selected: string | null,
  blockedSet: Set<string>,
  inactiveDOW: Set<number>,
) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells: { date: number; state: CellState; isoDate: string }[] = [];

  for (let i = 0; i < firstDay; i++) cells.push({ date: 0, state: 'outside', isoDate: '' });

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday =
      today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const isPast = new Date(iso) < new Date(today.toDateString());

    let state: CellState = 'available';
    if (iso === selected) state = 'selected';
    else if (inactiveDOW.has(dow) || isPast) state = 'inactive';
    else if (blockedSet.has(iso)) state = 'blocked';
    else if (isToday) state = 'today';

    cells.push({ date: d, state, isoDate: iso });
  }
  return cells;
}

export interface CalendarPickerProps {
  year: number;
  month: number;
  selected: string | null;   // ISO date "YYYY-MM-DD"
  blockedSet: Set<string>;   // vacation / unavailable dates
  inactiveDOW: Set<number>;  // 0=Sun … 6=Sat
  onSelect: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarPicker({
  year, month, selected, blockedSet, inactiveDOW,
  onSelect, onPrevMonth, onNextMonth,
}: CalendarPickerProps) {
  const cells = useMemo(
    () => buildCells(year, month, selected, blockedSet, inactiveDOW),
    [year, month, selected, blockedSet, inactiveDOW],
  );

  const cellStyle: Record<CellState, string> = {
    available: 'bg-white text-gray-800 hover:bg-brand-light cursor-pointer',
    today:     'bg-brand-primary/10 text-brand-primary font-semibold cursor-pointer hover:bg-brand-primary/20',
    selected:  'bg-brand-primary text-white font-semibold rounded-full',
    blocked:   'bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)] text-gray-300 cursor-not-allowed',
    inactive:  'bg-surface-gray text-gray-300 cursor-not-allowed',
    outside:   '',
  };

  return (
    <div className="bg-white border border-border-savis rounded-xl p-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <button type="button" onClick={onPrevMonth} className="p-1 text-gray-400 hover:text-gray-700">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M10 4L6 8l4 4"/>
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-gray-900 min-w-[130px] text-center">
          {MONTH_NAMES[month]} {year}
        </span>
        <button type="button" onClick={onNextMonth} className="p-1 text-gray-400 hover:text-gray-700">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M6 4l4 4-4 4"/>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="text-center text-[12px] text-gray-400 py-1">{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (cell.state === 'outside') return <div key={i} />;
          const clickable =
            cell.state === 'available' || cell.state === 'today' || cell.state === 'selected';
          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelect(cell.isoDate)}
              className={`h-10 flex items-center justify-center text-[14px] rounded-lg ${cellStyle[cell.state]}`}
            >
              {cell.date}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 flex-wrap">
        {[
          { label: 'Selected', cls: 'w-3 h-3 rounded-full bg-brand-primary' },
          { label: 'Unavailable', cls: 'w-3 h-3 rounded bg-[repeating-linear-gradient(135deg,#F5F6F8_0px,#F5F6F8_4px,#E8E2E8_4px,#E8E2E8_5px)]' },
          { label: 'Inactive', cls: 'w-3 h-3 rounded bg-surface-gray border border-border-savis' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className={cls} />{label}
          </div>
        ))}
      </div>
    </div>
  );
}
