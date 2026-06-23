'use client';

import React from 'react';

// ─── StatusPill ────────────────────────────────────────────────────────────────

type PillVariant =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'payout-pending'
  | 'published'
  | 'paused'
  | 'vacation'
  | 'provider-mode';

const pillStyles: Record<PillVariant, string> = {
  pending:        'bg-warning-light text-warning',
  confirmed:      'bg-success-light text-success',
  paid:           'bg-success-light text-success',
  'payout-pending':'bg-warning-light text-warning',
  published:      'bg-success-light text-success',
  paused:         'bg-warning-light text-warning',
  vacation:       'bg-warning-light text-warning',
  'provider-mode':'bg-brand-primary text-white',
};

const pillLabels: Record<PillVariant, string> = {
  pending:        'Pending',
  confirmed:      'Confirmed',
  paid:           'Paid',
  'payout-pending':'Pending payout',
  published:      'Published',
  paused:         'Paused',
  vacation:       'Vacation',
  'provider-mode':'Provider mode',
};

interface StatusPillProps {
  variant: PillVariant;
  className?: string;
}

export function StatusPill({ variant, className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pillStyles[variant]} ${className}`}
    >
      {pillLabels[variant]}
    </span>
  );
}

// ─── PayoutCard ────────────────────────────────────────────────────────────────

interface PayoutCardProps {
  amount: number;           // in KES
  nextPayoutDate: string;   // e.g. "1 Jul 2025"
  cycleCount: number;
  onViewEarnings?: () => void;
  empty?: boolean;          // KES 0 variant
}

export function PayoutCard({
  amount,
  nextPayoutDate,
  cycleCount,
  onViewEarnings,
  empty = false,
}: PayoutCardProps) {
  const formatted = amount.toLocaleString('en-KE');

  return (
    <div className="bg-payout-gradient rounded-2xl p-5 text-white">
      <p className="text-[13px] text-white/70 mb-1">Pending payout</p>
      <p className="text-[32px] font-bold mb-2">KES {formatted}</p>

      {!empty && (
        <div className="flex items-center justify-between text-[13px] mb-2">
          <span className="text-white/70">Next payout: {nextPayoutDate}</span>
          <button
            onClick={onViewEarnings}
            className="text-white underline underline-offset-2 hover:text-white/90 transition-colors"
          >
            View earnings →
          </button>
        </div>
      )}

      <hr className="border-white/20 mb-2" />

      <p className="text-[13px] text-white/60">
        {empty
          ? 'Complete your first booking to start earning.'
          : `Completed this cycle: ${cycleCount} services`}
      </p>
    </div>
  );
}

// ─── QuickActionButton ─────────────────────────────────────────────────────────

interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export function QuickActionButton({ icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white border border-border-savis rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-brand-light transition-colors shadow-sm active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-primary">
        {icon}
      </div>
      <span className="text-[13px] font-medium text-gray-800 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;    // brand-primary colour on value
}

export function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className="bg-white border border-border-savis rounded-xl p-4 flex-1">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5">{label}</p>
      <p className={`text-[20px] font-bold ${accent ? 'text-brand-primary' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

// ─── RoleToggle ────────────────────────────────────────────────────────────────

type Role = 'requestor' | 'provider';

interface RoleToggleProps {
  value: Role;
  onChange: (role: Role) => void;
}

export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <div className="flex bg-surface-gray rounded-[10px] p-1 gap-1">
      {(['requestor', 'provider'] as Role[]).map((role) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-medium transition-all ${
            value === role
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {role === 'requestor' ? 'Requestor' : 'Provider'}
        </button>
      ))}
    </div>
  );
}

// ─── ServiceStatusToggle (iOS-style) ──────────────────────────────────────────

interface ServiceToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function ServiceToggle({ checked, onChange, disabled = false }: ServiceToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
        checked ? 'bg-brand-action' : 'bg-surface-gray border border-border-savis'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

// ─── BookingCard ───────────────────────────────────────────────────────────────

export interface BookingCardData {
  id: string;
  customerName: string;
  customerInitials: string;
  serviceName: string;
  dateTime: string;
  location?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed';
  price?: number;
  specialInstructions?: string;
  bookingRef?: string;
}

interface BookingCardProps {
  booking: BookingCardData;
  variant?: 'dashboard' | 'manage';   // dashboard = compact, manage = full actions
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onComplete?: (id: string) => void;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}

export function BookingCard({
  booking,
  variant = 'dashboard',
  onAccept,
  onDecline,
  onComplete,
  expanded = false,
  onToggleExpand,
}: BookingCardProps) {
  const { id, customerName, customerInitials, serviceName, dateTime, location, status, price, specialInstructions, bookingRef } = booking;

  return (
    <div className="bg-white border border-border-savis rounded-xl p-4 shadow-sm">
      {/* Top row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-[11px] font-bold text-brand-primary">
            {customerInitials}
          </div>
          <span className="text-[15px] font-semibold text-gray-900">{customerName}</span>
        </div>
        <StatusPill variant={status === 'in_progress' ? 'confirmed' : status as PillVariant} />
      </div>

      <p className="text-[14px] text-gray-500 mb-1">{serviceName}</p>

      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-0.5">
        <CalendarIcon className="w-3.5 h-3.5" />
        {dateTime}
      </div>

      {location && (
        <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
          <MapPinIcon className="w-3.5 h-3.5" />
          {location}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-savis space-y-1">
          {specialInstructions && (
            <p className="text-[13px] text-gray-600">
              <span className="font-medium text-gray-800">Instructions: </span>
              {specialInstructions}
            </p>
          )}
          {price && (
            <p className="text-[13px] text-gray-600">
              <span className="font-medium text-gray-800">Price: </span>
              KES {price.toLocaleString('en-KE')} (fixed)
            </p>
          )}
          {bookingRef && (
            <p className="text-[13px] text-gray-400">Ref: {bookingRef}</p>
          )}
        </div>
      )}

      {/* Action row — provider manage view only */}
      {variant === 'manage' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-savis">
          {status === 'pending' && (
            <>
              <button
                onClick={() => onAccept?.(id)}
                className="h-9 px-4 bg-success text-white rounded-lg text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => onDecline?.(id)}
                className="h-9 px-4 border border-error text-error rounded-lg text-[14px] font-medium hover:bg-red-50 active:scale-[0.98] transition-all"
              >
                Decline
              </button>
            </>
          )}
          {status === 'confirmed' && (
            <>
              <button
                onClick={() => onComplete?.(id)}
                className="h-9 px-4 bg-brand-primary text-white rounded-lg text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Mark complete
              </button>
              <button
                disabled
                className="h-9 px-4 border border-border-savis text-gray-400 rounded-lg text-[14px] font-medium cursor-not-allowed opacity-60"
                title="Coming soon"
              >
                Message
              </button>
            </>
          )}
          {onToggleExpand && (
            <button
              onClick={() => onToggleExpand(id)}
              className="ml-auto text-[13px] text-brand-primary hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tiny inline SVG icons (avoids importing a full icon lib) ─────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M5 1v4M11 1v4M2 7h12" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  );
}
