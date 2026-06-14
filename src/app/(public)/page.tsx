'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlass,
  MapPin,
  CaretDown,
  Bell,
  List,
  X,
  House,
  BookOpen,
  User,
  ArrowRight,
} from 'phosphor-react'
import ServiceCard, { Service } from '@/components/services/ServiceCard'
import { useAuth } from '@/lib/hooks/useAuth'

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Home Deep Cleaning', provider: 'Amina W.', location: 'Westlands', price: 1200, rating: 4.8, reviews: 34, verified: true, category: 'Cleaning' },
  { id: '2', name: 'Hair Braiding & Styling', provider: 'Grace N.', location: 'Kilimani', price: 800, rating: 4.6, reviews: 18, verified: false, category: 'Beauty & Wellness' },
  { id: '3', name: 'Plumbing Repairs', provider: 'John M.', location: 'Lavington', price: 1500, rating: 4.9, reviews: 52, verified: true, category: 'Home Repairs' },
  { id: '4', name: 'Private Maths Tutor', provider: 'Dr. Samuel O.', location: 'Karen', price: 2000, rating: 5.0, reviews: 7, verified: false, category: 'Tutoring' },
  { id: '5', name: 'Pest Control', provider: 'CleanHome Ltd', location: 'Nairobi Wide', price: 3500, rating: 4.7, reviews: 29, verified: true, category: 'Cleaning' },
  { id: '6', name: 'Laptop Repair', provider: 'TechFix Kenya', location: 'CBD', price: 500, rating: 4.4, reviews: 11, verified: false, category: 'Tech Support' },
  { id: '7', name: 'Office Cleaning', provider: 'ShineBright Ltd', location: 'Westlands', price: 2500, rating: 4.8, reviews: 22, verified: true, category: 'Cleaning' },
  { id: '8', name: 'Event Catering', provider: 'Mama Ngina Kitchen', location: 'Nairobi', price: 5000, rating: 4.9, reviews: 41, verified: true, category: 'Catering' },
  { id: '9', name: 'Electrical Wiring', provider: 'Peter K.', location: 'Kasarani', price: 1800, rating: 4.7, reviews: 19, verified: true, category: 'Home Repairs' },
  { id: '10', name: 'Beauty Makeover', provider: 'Mercy A.', location: 'South C', price: 900, rating: 4.9, reviews: 63, verified: true, category: 'Beauty & Wellness' },
  { id: '11', name: 'Home Moving Service', provider: 'Swift Movers', location: 'Thika Rd', price: 6000, rating: 4.5, reviews: 38, verified: false, category: 'Transport' },
  { id: '12', name: 'Security Guard', provider: 'SafeGuard Co.', location: 'Nairobi', price: 2200, rating: 4.6, reviews: 14, verified: true, category: 'Security' },
]

const CATEGORIES = ['All', 'Cleaning', 'Beauty & Wellness', 'Home Repairs', 'Tutoring', 'Transport', 'Catering', 'Security', 'Tech Support']

// ─── Sub-components ───────────────────────────────────────────────────────────

function BottomNav({ activeTab }: { activeTab: string }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: House, href: '/' },
    { id: 'search', label: 'Search', icon: MagnifyingGlass, href: '/search' },
    { id: 'bookings', label: 'Bookings', icon: BookOpen, href: '/bookings' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 lg:hidden">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-brand-primary' : 'text-secondary'
              }`}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ServiceListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthenticated = !!user

  const [scrolled, setScrolled] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredServices = activeCategory === 'All'
    ? MOCK_SERVICES
    : MOCK_SERVICES.filter((s) => s.category === activeCategory)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-surface-gray">

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 bg-white border-b border-border transition-all duration-200 ${
          scrolled ? 'py-2 shadow-sm' : 'py-3'
        }`}
      >
        <div className="px-4 lg:max-w-[1280px] lg:mx-auto">

          {/* Mobile header row */}
          <div className="flex items-center gap-3 lg:hidden">
            <span
              className="text-[20px] font-bold text-brand-primary shrink-0"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              SAVIS
            </span>

            <div className="flex-1 relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
              />
              <input
                type="search"
                placeholder="Search for a service..."
                className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-border bg-surface-gray text-[14px] text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button className="relative w-9 h-9 flex items-center justify-center rounded-full text-secondary hover:bg-gray-100">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-action rounded-full" />
                </button>
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
                  <span className="text-[12px] font-semibold text-brand-primary">
                    {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-secondary hover:bg-gray-50"
                aria-label="Open menu"
              >
                <List size={20} />
              </button>
            )}
          </div>

          {/* Desktop header row */}
          <div className="hidden lg:flex items-center gap-4">
            <span
              className="text-[22px] font-bold text-brand-primary shrink-0 mr-2"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              SAVIS
            </span>

            <div className="flex-1 max-w-[480px] relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
              />
              <input
                type="search"
                placeholder="Search for a service..."
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-border bg-surface-gray text-[14px] text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {isAuthenticated ? (
                <>
                  <button className="relative w-10 h-10 flex items-center justify-center rounded-full text-secondary hover:bg-gray-100 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand-action rounded-full" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center cursor-pointer">
                    <span className="text-[13px] font-semibold text-brand-primary">
                      {user?.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[14px] text-secondary hover:text-primary cursor-pointer">How it works</span>
                  <button
                    onClick={() => router.push('/register?intent=list-service')}
                    className="h-9 px-4 bg-brand-warm text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity"
                  >
                    List a service
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="h-9 px-4 border border-brand-primary text-brand-primary text-[14px] font-semibold rounded-[10px] hover:bg-brand-light transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="h-9 px-4 bg-brand-action text-white text-[14px] font-semibold rounded-[10px] hover:bg-brand-action/90 transition-colors"
                  >
                    Join free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer (unauthenticated) ────────────────────────────────── */}
      {!isAuthenticated && (
        <>
          {drawerOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            className={`fixed inset-y-0 right-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl transition-transform duration-300 ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-[18px] font-bold text-brand-primary" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                SAVIS
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => { setDrawerOpen(false); router.push('/register?intent=list-service') }}
                className="w-full h-[52px] bg-brand-warm text-white font-semibold text-[15px] rounded-[10px] flex items-center justify-center"
              >
                List a service
              </button>
              <button
                onClick={() => { setDrawerOpen(false); router.push('/login') }}
                className="w-full h-[52px] border border-brand-primary text-brand-primary font-semibold text-[15px] rounded-[10px]"
              >
                Sign in
              </button>
              <button
                onClick={() => { setDrawerOpen(false); router.push('/register') }}
                className="w-full h-[52px] bg-brand-action text-white font-semibold text-[15px] rounded-[10px]"
              >
                Join free
              </button>
            </div>
            <div className="px-4 pt-2 space-y-1">
              {['How it works', 'Browse services', 'Become a provider'].map((item) => (
                <button key={item} className="w-full text-left px-3 py-3 text-[15px] text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors">
                  {item}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Page Body ────────────────────────────────────────────────────── */}
      <main className="lg:max-w-[1280px] lg:mx-auto px-4 lg:px-6 pb-24 lg:pb-8">

        {isAuthenticated && (
          <div className="mt-4 mb-3 bg-brand-light border-l-[3px] border-brand-warm rounded-r-xl px-4 py-3">
            <p className="text-[15px] font-semibold text-primary">
              Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} 👋
            </p>
            <p className="text-[13px] text-secondary mt-0.5">What service are you looking for today?</p>
          </div>
        )}

        <button className={`flex items-center gap-1.5 ${isAuthenticated ? '' : 'mt-3'} mb-3 py-1 text-[14px] text-primary font-medium`}>
          <MapPin size={15} weight="fill" className="text-brand-warm" />
          <span>Westlands, Nairobi</span>
          <CaretDown size={13} className="text-secondary" />
        </button>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 h-9 px-4 rounded-full text-[14px] font-medium transition-colors border ${
                  isActive
                    ? 'bg-brand-warm text-white border-brand-warm'
                    : 'bg-white text-primary border-border hover:border-brand-primary/40'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-primary">Services near you</h2>
          <span className="text-[14px] text-secondary">{filteredServices.length * 21} services</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </main>

      {/* ── Floating "Earn on SAVIS" pill ──────────────────────────────────── */}
      {!isAuthenticated && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <button
            onClick={() => router.push('/register?intent=list-service')}
            className="pointer-events-auto flex items-center gap-2 bg-brand-primary text-white text-[14px] font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-brand-dark transition-colors"
          >
            Earn on SAVIS — List a service
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {isAuthenticated && <BottomNav activeTab="home" />}
    </div>
  )
}
