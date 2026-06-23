'use client';

// src/components/booking/CostBreakdownCard.tsx
import { useState } from 'react';
import { CaretDown, CaretUp, Info } from '@phosphor-icons/react';
import { colors, formatKES, type CostBreakdown } from '@/lib/booking-theme';

interface Props {
  cost: CostBreakdown;
  /** Start expanded (review screen shows an expanded variant); default collapsed. */
  defaultExpanded?: boolean;
  platformRatePct?: number; // for the label, default 7
  vatRatePct?: number; // default 16
}

export default function CostBreakdownCard({
  cost,
  defaultExpanded = false,
  platformRatePct = 7,
  vatRatePct = 16,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showTip, setShowTip] = useState(false);

  const row = (label: React.ReactNode, value: string, withInfo = false) => (
    <div className="flex items-center justify-between py-2">
      <span
        className="flex items-center gap-1"
        style={{ fontSize: 14, color: colors.textSecondary }}
      >
        {label}
        {withInfo && (
          <button
            type="button"
            aria-label="What is the platform fee?"
            onClick={() => setShowTip((v) => !v)}
            onBlur={() => setShowTip(false)}
            className="relative inline-flex"
          >
            <Info size={14} color={colors.textSecondary} weight="bold" />
            {showTip && (
              <span
                role="tooltip"
                className="absolute left-1/2 z-10 -translate-x-1/2 rounded-lg px-3 py-2 text-left"
                style={{
                  bottom: 'calc(100% + 8px)',
                  width: 220,
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: colors.white,
                  background: colors.textPrimary,
                }}
              >
                Covers secure payments, support, and platform maintenance.
              </span>
            )}
          </button>
        )}
      </span>
      <span style={{ fontSize: 14, color: colors.textPrimary }}>{value}</span>
    </div>
  );

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: colors.white, boxShadow: '0 1px 2px rgba(20,15,30,0.06)' }}
    >
      {expanded && (
        <div style={{ borderBottom: `1px solid ${colors.border}` }}>
          {row('Service fee', formatKES(cost.serviceFee))}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />
          {row(`Platform fee (SAVIS ${platformRatePct}%)`, formatKES(cost.platformFee), true)}
          <div style={{ borderTop: `1px solid ${colors.border}` }} />
          {row(`VAT (${vatRatePct}% on platform fee)`, formatKES(cost.vat))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3">
        <span style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
          Total to pay
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: colors.brandPrimary }}>
          {formatKES(cost.total)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 flex items-center gap-1"
        style={{ fontSize: 13, color: colors.brandPrimary }}
      >
        {expanded ? (
          <>
            Hide breakdown <CaretUp size={14} weight="bold" />
          </>
        ) : (
          <>
            View breakdown <CaretDown size={14} weight="bold" />
          </>
        )}
      </button>
    </div>
  );
}
