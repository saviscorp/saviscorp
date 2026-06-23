'use client';

// app/provider/services/page.tsx
// Route: /provider/services
// Service list with published/paused toggle, edit, pause-confirm sheet, FAB.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusPill, ServiceToggle } from '@/components/ui';
import { BottomNav } from '@/components/provider/BottomNav';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  basePrice: number;
  published: boolean;
  thumbnailEmoji: string; // placeholder until real image
}

// ─── Mock — TODO: replace with Firestore services collection ─────────────────
// TODO (backend):
//   - getProviderServices(uid) → services where providerId == uid
//   - toggleServiceStatus(serviceId, published) → Firestore update
//   - deleteService(serviceId) → soft delete (status: 'archived')

const INITIAL_SERVICES: Service[] = [
  { id: 's1', name: 'Home Deep Cleaning', category: 'Cleaning', subcategory: 'Deep Cleaning', basePrice: 1200, published: true,  thumbnailEmoji: '🏠' },
  { id: 's2', name: 'Office Cleaning',    category: 'Cleaning', subcategory: 'Commercial',    basePrice: 2500, published: false, thumbnailEmoji: '🏢' },
];

// ─── Pause confirm sheet ───────────────────────────────────────────────────────

function PauseConfirmSheet({
  serviceName,
  onConfirm,
  onCancel,
}: {
  serviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onCancel}>
      <div
        className="bg-white rounded-t-2xl w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-border-savis mx-auto mb-4" />
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">Pause this service?</h2>
        <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
          Customers won't be able to find or book <span className="font-medium text-gray-700">{serviceName}</span> until you reactivate it.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 border border-error text-error rounded-xl font-semibold text-[15px] hover:bg-red-50 active:scale-[0.98] transition-all"
          >
            Pause service
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Keep active
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onToggle,
  onEdit,
}: {
  service: Service;
  onToggle: (id: string, newVal: boolean) => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-border-savis rounded-xl p-4 shadow-sm">
      <div className="flex gap-3 items-start">
        {/* Thumbnail */}
        <div className="w-[60px] h-[60px] rounded-lg bg-brand-light flex items-center justify-center text-2xl flex-shrink-0">
          {service.thumbnailEmoji}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{service.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {service.category} · {service.subcategory}
          </p>
          <p className="text-[14px] font-medium text-brand-primary mt-1">
            From KES {service.basePrice.toLocaleString('en-KE')}
          </p>
        </div>
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-savis">
        <StatusPill variant={service.published ? 'published' : 'paused'} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service.id)}
            className="h-8 px-3 border border-border-savis text-brand-primary rounded-lg text-[13px] font-medium hover:bg-brand-light transition-colors"
          >
            Edit
          </button>
          <ServiceToggle
            checked={service.published}
            onChange={(v) => onToggle(service.id, v)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'active' | 'paused';

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingPause, setPendingPause] = useState<Service | null>(null);

  const filtered = services.filter((s) => {
    if (filter === 'active') return s.published;
    if (filter === 'paused') return !s.published;
    return true;
  });

  const handleToggle = (id: string, newVal: boolean) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    // Turning OFF → show confirm sheet
    if (!newVal) { setPendingPause(svc); return; }
    // Turning ON → immediate
    console.log('TODO: activate service', id);
    // await toggleServiceStatus(id, true);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, published: true } : s)));
  };

  const confirmPause = () => {
    if (!pendingPause) return;
    console.log('TODO: pause service', pendingPause.id);
    // await toggleServiceStatus(pendingPause.id, false);
    setServices((prev) =>
      prev.map((s) => (s.id === pendingPause.id ? { ...s, published: false } : s))
    );
    setPendingPause(null);
  };

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">My Services</h1>
        <button
          onClick={() => router.push('/provider/services/new')}
          className="text-[14px] font-semibold text-brand-action"
        >
          + Add
        </button>
      </header>

      <main className="flex-1 px-4 py-4 pb-28 space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'active', 'paused'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium border transition-colors ${
                filter === f
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-surface-gray text-gray-500 border-border-savis'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-[15px]">No services in this category.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onToggle={handleToggle}
                onEdit={(id) => router.push(`/provider/services/${id}/edit`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => router.push('/provider/services/new')}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand-action text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-40"
        aria-label="Add new service"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>

      {pendingPause && (
        <PauseConfirmSheet
          serviceName={pendingPause.name}
          onConfirm={confirmPause}
          onCancel={() => setPendingPause(null)}
        />
      )}

      <BottomNav mode="provider" />
    </div>
  );
}
