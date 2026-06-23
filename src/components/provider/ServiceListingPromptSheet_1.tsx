'use client';

// components/provider/ServiceListingPromptSheet.tsx
// Shown when a user switches to provider mode but has no services yet.
// Overlays on the authenticated listing/browse page.

import { useRouter } from 'next/navigation';

interface ServiceListingPromptSheetProps {
  onDismiss?: () => void;
}

export function ServiceListingPromptSheet({ onDismiss }: ServiceListingPromptSheetProps) {
  const router = useRouter();

  return (
    // Semi-transparent backdrop
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="bg-white rounded-t-2xl w-full px-5 pt-4 pb-8 animate-slide-up">
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-border-savis mx-auto mb-5" />

        {/* Icon */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center mb-4">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-8 h-8 text-brand-primary">
              <rect x="4" y="10" width="24" height="18" rx="2" />
              <path d="M10 10V8a6 6 0 0 1 12 0v2" />
              <path d="M10 18h12M10 23h8" />
              <circle cx="24" cy="24" r="6" fill="#640D5F" stroke="none" />
              <path d="M24 21v6M21 24h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">List your first service</h2>
          <p className="text-[14px] text-gray-500 max-w-[280px] leading-relaxed">
            You're now in provider mode. Add a service so customers can find and book you.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push('/provider/services/new')}
            className="w-full py-3.5 bg-brand-action text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Add a service
          </button>
          <button
            onClick={() => {
              onDismiss?.();
              router.push('/provider/dashboard');
            }}
            className="w-full py-3.5 border border-border-savis text-brand-primary rounded-xl font-semibold text-[15px] hover:bg-brand-light active:scale-[0.98] transition-all"
          >
            Go to dashboard first
          </button>
        </div>
      </div>
    </div>
  );
}
