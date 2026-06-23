'use client';

// src/components/booking/Shared.tsx
// Small shared building blocks used across Sprint 4 screens.
import { ArrowLeft, Warning } from '@phosphor-icons/react';
import { colors, statusPill, type StatusKey } from '@/lib/booking-theme';

export function StatusPill({ status }: { status: StatusKey }) {
  const p = statusPill[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1"
      style={{ background: p.bg, color: p.fg, fontSize: 11, fontWeight: 600 }}
    >
      {p.label}
    </span>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
      style={{ background: colors.white, borderBottom: `1px solid ${colors.border}` }}
    >
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Go back" className="p-1">
          <ArrowLeft size={22} color={colors.textPrimary} />
        </button>
      ) : (
        <span style={{ width: 30 }} />
      )}
      <h1 className="flex-1 text-center" style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
        {title}
      </h1>
      <span className="min-w-[30px] text-right">{right}</span>
    </header>
  );
}

export function ServiceSummaryBar({
  thumbnailUrl,
  title,
  providerName,
  pill,
}: {
  thumbnailUrl?: string;
  title: string;
  providerName: string;
  pill?: { label: string; bg: string; fg: string };
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ background: colors.surfaceGray, borderBottom: `1px solid ${colors.border}` }}
    >
      <div
        className="shrink-0 rounded-lg bg-cover bg-center"
        style={{
          height: 48,
          width: 48,
          background: thumbnailUrl ? `url(${thumbnailUrl})` : colors.brandLight,
          backgroundSize: 'cover',
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate" style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
          {title}
        </p>
        <p className="truncate" style={{ fontSize: 13, color: colors.textSecondary }}>
          {providerName}
        </p>
      </div>
      {pill && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5"
          style={{ background: pill.bg, color: pill.fg, fontSize: 11, fontWeight: 600 }}
        >
          {pill.label}
        </span>
      )}
    </div>
  );
}

export function NoPhoneBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="mx-4 mb-4 flex items-start gap-2 rounded-xl p-3"
      style={{ background: colors.goldLight }}
    >
      <Warning size={16} color={colors.warning} weight="fill" style={{ marginTop: 2 }} />
      <p className="flex-1" style={{ fontSize: 13, color: colors.warning }}>
        Add a phone number to your profile to use M-Pesa payment.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 font-bold underline"
        style={{ fontSize: 13, color: colors.warning }}
      >
        Add now →
      </button>
    </div>
  );
}
