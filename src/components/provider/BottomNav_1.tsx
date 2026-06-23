'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/provider/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'Services',
    href: '/provider/services',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 4 0v2" />
        <path d="M16 7V5a2 2 0 0 0-4 0" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/provider/bookings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: 'Earnings',
    href: '/provider/earnings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

interface BottomNavProps {
  mode?: 'provider' | 'requestor';
}

export function BottomNav({ mode = 'provider' }: BottomNavProps) {
  const pathname = usePathname();

  const items =
    mode === 'provider'
      ? NAV_ITEMS
      : NAV_ITEMS.filter((i) => i.href === '/profile');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-savis z-40 safe-area-pb">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {(mode === 'provider' ? NAV_ITEMS : NAV_ITEMS).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                active
                  ? 'text-brand-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon}
              <span className={`text-[10px] ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
