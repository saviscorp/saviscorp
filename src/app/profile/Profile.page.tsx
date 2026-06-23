'use client';

// app/profile/page.tsx
// Route: /profile
// Role toggle at top — switches between Requestor and Provider views.
// Provider section (My services / Schedule / Earnings) is only visible in Provider mode.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleToggle } from '@/components/ui';
import { BottomNav } from '@/components/provider/BottomNav';

// ─── TODO (backend):
//   - getCurrentUser(uid) → name, email, avatarUrl, role, activeRole
//   - updateActiveRole(uid, role) → writes to users/{uid}.activeRole in Firestore
//   - isProviderVerified(uid) → check providers/{uid} exists and status === 'active'

type Role = 'requestor' | 'provider';

interface ProfileSection {
  label: string;
  items: { title: string; href: string }[];
}

const SHARED_SECTIONS: ProfileSection[] = [
  {
    label: 'Account',
    items: [
      { title: 'Personal details',      href: '/profile/personal' },
      { title: 'Identity verification', href: '/profile/verification' },
      { title: 'Notifications',         href: '/profile/notifications' },
    ],
  },
  {
    label: 'Support',
    items: [
      { title: 'Help & Support',  href: '/help' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Privacy Policy',  href: '/privacy' },
    ],
  },
];

const PROVIDER_SECTION: ProfileSection = {
  label: 'Provider',
  items: [
    { title: 'My services', href: '/provider/services' },
    { title: 'Schedule',    href: '/provider/schedule' },
    { title: 'Earnings',    href: '/provider/earnings' },
  ],
};

// ─── Profile row ───────────────────────────────────────────────────────────────

function ProfileRow({ title, href, last = false }: { title: string; href: string; last?: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-brand-light transition-colors ${!last ? 'border-b border-border-savis' : ''}`}
    >
      <span className="text-[15px] text-gray-800">{title}</span>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-400">
        <path d="M7 5l5 5-5 5" />
      </svg>
    </button>
  );
}

function ProfileSectionCard({ section }: { section: ProfileSection }) {
  return (
    <div className="bg-white border border-border-savis rounded-xl overflow-hidden">
      <p className="text-[11px] uppercase tracking-wide font-medium text-gray-400 px-4 pt-3 pb-1.5">
        {section.label}
      </p>
      {section.items.map((item, i) => (
        <ProfileRow
          key={item.href}
          title={item.title}
          href={item.href}
          last={i === section.items.length - 1}
        />
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  // TODO (backend): read activeRole from Firestore / auth context
  const [activeRole, setActiveRole] = useState<Role>('provider');

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    console.log('TODO: update activeRole in Firestore', role);
    // await updateActiveRole(uid, role);
    // If switching to provider, redirect to provider dashboard
    if (role === 'provider') router.prefetch('/provider/dashboard');
  };

  // Mock user — TODO: replace with auth context
  const user = { name: 'Savis K.', email: 'savis@email.com', initials: 'SK' };

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-center sticky top-0 z-30">
        <h1 className="text-[17px] font-semibold text-gray-900">Profile</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 space-y-4">
        {/* Role toggle — the action control, distinct from the header status pill */}
        <RoleToggle value={activeRole} onChange={handleRoleChange} />

        {/* Avatar + name */}
        <div className="flex flex-col items-center py-4">
          <div className="w-[72px] h-[72px] rounded-full bg-brand-light flex items-center justify-center text-[24px] font-bold text-brand-primary mb-3">
            {user.initials}
          </div>
          <p className="text-[20px] font-bold text-gray-900">{user.name}</p>
          <p className="text-[14px] text-gray-400 mt-0.5">{user.email}</p>
          <button
            onClick={() => router.push('/profile/edit')}
            className="mt-3 px-4 py-1.5 border border-border-savis rounded-full text-[13px] font-medium text-gray-600 hover:bg-brand-light transition-colors"
          >
            Edit profile
          </button>
        </div>

        {/* Provider section — only visible in provider mode */}
        {activeRole === 'provider' && (
          <ProfileSectionCard section={PROVIDER_SECTION} />
        )}

        {/* Shared sections */}
        {SHARED_SECTIONS.map((s) => (
          <ProfileSectionCard key={s.label} section={s} />
        ))}

        {/* Sign out */}
        <button
          onClick={() => {
            console.log('TODO: sign out via Firebase Auth');
            // await signOut(auth); router.push('/login');
          }}
          className="w-full py-3.5 border border-error text-error rounded-xl font-semibold text-[15px] hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          Sign out
        </button>
      </main>

      <BottomNav mode={activeRole} />
    </div>
  );
}
