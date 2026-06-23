'use client';

// app/provider/schedule/working-hours/page.tsx
// Route: /provider/schedule/working-hours

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

const DEFAULT_SCHEDULE: Record<string, DaySchedule> = {
  Monday:    { enabled: true,  start: '08:00', end: '18:00' },
  Tuesday:   { enabled: true,  start: '08:00', end: '18:00' },
  Wednesday: { enabled: true,  start: '08:00', end: '18:00' },
  Thursday:  { enabled: true,  start: '08:00', end: '18:00' },
  Friday:    { enabled: true,  start: '08:00', end: '17:00' },
  Saturday:  { enabled: true,  start: '09:00', end: '14:00' },
  Sunday:    { enabled: false, start: '09:00', end: '17:00' },
};

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
  );
}

export default function WorkingHoursPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (day: string, patch: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setSaved(false);
  };

  // TODO (backend): write to Firestore providers/{uid}.workingHours
  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('TODO: save working hours to Firestore', schedule);
      // await updateProviderWorkingHours(uid, schedule);
      await new Promise((r) => setTimeout(r, 600)); // mock delay
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Working hours</h1>
      </header>

      <main className="flex-1 px-4 py-5 pb-32">
        <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
          Set the days and times you're available to take bookings.
        </p>

        <div className="bg-white border border-border-savis rounded-xl overflow-hidden divide-y divide-border-savis">
          {DAYS.map((day) => {
            const s = schedule[day];
            return (
              <div key={day} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-medium ${s.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  <ToggleSwitch
                    checked={s.enabled}
                    onChange={(v) => update(day, { enabled: v })}
                  />
                </div>

                {s.enabled && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <select
                      value={s.start}
                      onChange={(e) => update(day, { start: e.target.value })}
                      className="border border-border-savis rounded-lg px-2 py-1.5 text-[13px] text-gray-800 bg-surface-gray w-[80px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="text-[13px] text-gray-400">to</span>
                    <select
                      value={s.end}
                      onChange={(e) => update(day, { end: e.target.value })}
                      className="border border-border-savis rounded-lg px-2 py-1.5 text-[13px] text-gray-800 bg-surface-gray w-[80px] focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky save button */}
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
  );
}
