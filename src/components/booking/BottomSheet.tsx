'use client';

// src/components/booking/BottomSheet.tsx
import { useEffect } from 'react';
import { colors } from '@/lib/booking-theme';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** When false (e.g. payment failed), tapping the backdrop won't dismiss. */
  dismissible?: boolean;
}

export default function BottomSheet({ open, onClose, children, dismissible = true }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(20,15,30,0.45)' }}
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="savis-sheet relative w-full max-w-[480px] rounded-t-2xl p-4 pb-6"
        style={{ background: colors.white }}
      >
        <div
          className="mx-auto mb-3 rounded-full"
          style={{ height: 4, width: 40, background: colors.border }}
        />
        {children}
      </div>
      <style jsx>{`
        .savis-sheet {
          animation: savisSheetUp 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes savisSheetUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .savis-sheet {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
