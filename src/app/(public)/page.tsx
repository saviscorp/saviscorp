'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlass,
  MapPin,
  CaretDown,
  Bell,
  House,
  CalendarBlank,
  User,
  SmileyMeh,
} from 'phosphor-react'
import ServiceCard from '@/components/services/ServiceCard'
import SkeletonCard from '@/components/services/SkeletonCard'
import { useAuth } from '@/lib/hooks/useAuth'
import UserAvatarMenu from '@/components/ui/UserAvatarMenu'
import { useCategories } from '@/lib/hooks/useCategories'
import { useSubcategories } from '@/lib/hooks/useSubcategories'
import { useServices } from '@/lib/hooks/useServices'
import { hasAnyServices } from '@/lib/firebase/services'

// ─── Page component ────────────────────────────────────────────────────────────

export default function ServiceListingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isAuthenticated = !!user
  const userName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [bouncing, setBouncing] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const { categories, loading: catsLoading } = useCategories()
  const { subcategories } = useSubcategories(selectedCategory !== 'All' ? selectedCategory : undefined)
  const { services, loading: servicesLoading, error: servicesError } = useServices()

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory
    const matchSub =
      !selectedSubcategory ||
      s.subcategory === selectedSubcategory ||
      s.service_name.toLowerCase().includes(selectedSubcategory.toLowerCase())
    const matchSearch =
      !searchQuery ||
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSub && matchSearch
  })

  async function handleBecomeProvider() {
    if (!isAuthenticated) {
      router.push('/auth?role=provider')
      return
    }
    // Logged in — check if they already have services
    try {
      const hasServices = await hasAnyServices(user!.uid)
      router.push(hasServices ? '/dashboard/provider' : '/become-provider/list-service')
    } catch {
      router.push('/become-provider/list-service')
    }
  }

  function handleBookService(serviceId: string) {
    if (!isAuthenticated) {
      router.push(`/auth?role=requestor&redirect=/services/${serviceId}/book`)
    } else {
      router.push(`/services/${serviceId}/book`)
    }
  }

  // Scroll listener for sticky header shadow
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Remove bounce animation after 2s
  useEffect(() => {
    const t = setTimeout(() => setBouncing(false), 2000)
    return () => clearTimeout(t)
  }, [])

  // Category selection resets subcategory
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat)
    setSelectedSubcategory(null)
  }

  // Suppress auth loading flicker — don't block service grid on auth
  void authLoading

  return (
    <div className="min-h-screen bg-surface-gray">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        className={`bg-white border-b border-border sticky top-0 z-40 transition-shadow duration-200 ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="px-4 py-3 flex items-center gap-3 lg:max-w-[1200px] lg:mx-auto">
          {/* Logo */}
          <span className="text-brand-primary text-[20px] font-bold font-jakarta flex-shrink-0">
            SAVIS
          </span>

          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a service…"
              className="w-full bg-surface-gray rounded-[10px] h-10 pl-9 pr-3 text-[14px] text-primary placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Right side — authenticated */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Desktop: How it works link */}
              <span className="hidden lg:block text-[14px] text-secondary cursor-pointer hover:text-primary transition-colors">
                How it works
              </span>
              {/* Desktop: List a service button */}
              <button
                onClick={handleBecomeProvider}
                className="hidden lg:flex items-center h-9 px-4 text-[14px] font-medium bg-brand-action text-white rounded-[10px] hover:opacity-90 transition-opacity"
              >
                List a service
              </button>
              {/* Bell — mobile only */}
              <button className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-gray transition-colors">
                <Bell size={24} className="text-secondary" />
              </button>
              {/* Avatar + dropdown */}
              <UserAvatarMenu />
            </div>
          ) : (
            /* Unauthenticated */
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sign in — desktop only (accessible via register page on mobile) */}
              <button
                onClick={() => router.push('/login')}
                className="hidden lg:flex h-8 px-3 text-[13px] border border-brand-primary text-brand-primary rounded-lg hover:bg-brand-light transition-colors"
              >
                Sign in
              </button>
              {/* List a service — orange, always visible */}
              <button
                onClick={handleBecomeProvider}
                className="h-8 px-3 text-[13px] font-medium bg-brand-warm text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                List a service
              </button>
              <button
                onClick={() => router.push('/register')}
                className="h-8 px-3 text-[13px] bg-brand-action text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Join free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Greeting banner (authenticated only) ───────────────────────────── */}
      {isAuthenticated && (
        <div className="bg-brand-light border-l-4 border-brand-warm px-4 py-3 md:max-w-3xl md:mx-auto lg:max-w-[1200px]">
          <p className="text-[17px] font-medium text-primary">
            Welcome back, {userName} 👋
          </p>
          <p className="text-[14px] text-secondary">
            What service are you looking for today?
          </p>
        </div>
      )}

      {/* ── Location bar ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border">
        <div
          className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-surface-gray/50 transition-colors lg:max-w-[1200px] lg:mx-auto"
          onClick={() => { /* TODO: location picker */ }}
        >
          <MapPin size={16} weight="fill" className="text-brand-primary flex-shrink-0" />
          <span className="text-[14px] font-medium text-primary">Westlands, Nairobi</span>
          <CaretDown size={14} className="text-secondary" />
        </div>
      </div>

      {/* ── Category chips ──────────────────────────────────────────────────── */}
      <div className="bg-white">
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide lg:max-w-[1200px] lg:mx-auto">
          {catsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-gray rounded-full h-9 w-20 flex-shrink-0" />
            ))
          ) : (
            <>
              {/* "All" chip is always first */}
              <button
                onClick={() => handleCategorySelect('All')}
                className={`h-9 px-4 rounded-full text-[14px] whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${
                  selectedCategory === 'All'
                    ? 'bg-brand-primary text-white'
                    : 'bg-white border border-border text-primary hover:border-brand-primary/40'
                }`}
              >
                All
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.category_name
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.category_name)}
                    className={`h-9 px-4 rounded-full text-[14px] whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${
                      isActive
                        ? 'bg-brand-warm text-white'
                        : 'bg-white border border-border text-primary hover:border-brand-primary/40'
                    }`}
                  >
                    {cat.category_name}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Subcategory chips — only renders when flat subcategories collection has data */}
        {subcategories.length > 0 && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide lg:max-w-[1200px] lg:mx-auto border-t border-border/50 pt-2">
            {subcategories.map((sub) => {
              const isActive = selectedSubcategory === sub.subcategory_name
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.subcategory_name)}
                  className={`h-8 px-3 rounded-full text-[13px] whitespace-nowrap flex-shrink-0 transition-colors duration-150 ${
                    isActive
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-border text-primary hover:border-brand-primary/40'
                  }`}
                >
                  {sub.subcategory_name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="lg:max-w-[1200px] lg:mx-auto">

        {/* Section label */}
        <div className="px-4 py-2 flex items-center justify-between">
          <h2 className="text-[17px] font-medium text-primary">Services near you</h2>
          <span className="text-[13px] text-secondary">{filteredServices.length} services</span>
        </div>

        {/* Grid */}
        <div className="px-4 pb-24 lg:pb-8">
          {servicesLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : servicesError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SmileyMeh size={48} className="text-secondary" />
              <p className="text-[17px] font-medium text-primary mt-4">Something went wrong</p>
              <p className="text-[14px] text-secondary mt-1">Could not load services</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 h-10 px-5 border border-brand-primary text-brand-primary rounded-lg text-[14px] hover:bg-brand-light transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredServices.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SmileyMeh size={48} className="text-secondary" />
              <p className="text-[17px] font-medium text-primary mt-4">No services found</p>
              <p className="text-[14px] text-secondary mt-1">
                Try a different category or location
              </p>
              <button
                onClick={() => { /* TODO: location picker */ }}
                className="mt-4 h-10 px-5 border border-brand-primary text-brand-primary rounded-lg text-[14px] hover:bg-brand-light transition-colors"
              >
                Change location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filteredServices.map((s) => (
                <ServiceCard
                  key={s.id}
                  id={s.id}
                  name={s.service_name}
                  providerName=""
                  location=""
                  price={s.price}
                  pricingType={s.pricing_type === 'fixed' ? 'fixed' : 'per_hour'}
                  rating={null}
                  reviewCount={0}
                  verified={false}
                  photoUrl={s.service_photos[0] ?? null}
                  categoryName={s.category}
                  onBook={() => handleBookService(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Floating pill (hidden on lg where button is in header) ──────────── */}
      <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={handleBecomeProvider}
          className={`bg-brand-warm text-white px-6 py-3 rounded-full shadow-lg text-[15px] font-medium whitespace-nowrap ${
            bouncing ? 'animate-bounce' : ''
          }`}
        >
          Earn on SAVIS — List a service →
        </button>
      </div>

      {/* ── Bottom nav (authenticated, mobile only) ─────────────────────────── */}
      {isAuthenticated && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border h-16 z-40">
          <div className="flex h-full">
            {[
              { id: 'home', icon: House, label: 'Home' },
              { id: 'search', icon: MagnifyingGlass, label: 'Search' },
              { id: 'bookings', icon: CalendarBlank, label: 'Bookings' },
              { id: 'profile', icon: User, label: 'Profile' },
            ].map(({ id, icon: Icon, label }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative ${
                    isActive ? 'text-brand-primary' : 'text-secondary'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-0 right-0 h-0.5 bg-brand-primary" />
                  )}
                  <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
