'use client';

// src/components/booking/GoogleMeetCard.tsx
import { useState } from 'react';
import { Copy, VideoCamera } from '@phosphor-icons/react';
import { colors } from '@/lib/booking-theme';

interface Props {
  meetLink: string;
  /** 'session' label for confirmation card, vs plain join card. */
  variant?: 'inline' | 'card';
}

export default function GoogleMeetCard({ meetLink, variant = 'card' }: Props) {
  const [copied, setCopied] = useState(false);
  const display = meetLink.replace(/^https?:\/\//, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — link is still visible to copy manually */
    }
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: colors.brandLight,
        border: `1px solid ${colors.brandPrimary}33`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-full"
          style={{ height: 48, width: 48, background: colors.white }}
        >
          {/* Replace with official Google Meet glyph when available */}
          <VideoCamera size={26} color={colors.brandPrimary} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: 15, fontWeight: 500, color: colors.textPrimary }}>
            Google Meet session
          </p>
          <p
            className="truncate underline"
            style={{ fontSize: 13, color: colors.brandPrimary }}
            title={meetLink}
          >
            {display}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy meeting link"
          className="shrink-0 p-1"
        >
          <Copy size={18} color={colors.textSecondary} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => window.open(meetLink, '_blank', 'noopener')}
        className="mt-3 w-full rounded-[10px]"
        style={{ height: 44, background: colors.brandPrimary, color: colors.white, fontSize: 15, fontWeight: 500 }}
      >
        Join meeting
      </button>

      {copied && (
        <p className="mt-2 text-center" style={{ fontSize: 12, color: colors.success }}>
          Link copied
        </p>
      )}
    </div>
  );
}
