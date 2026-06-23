import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — SAVIS',
}

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using SAVIS, you confirm that you are at least 18 years old and agree to these terms. If you are using SAVIS on behalf of a business, you represent that you have authority to bind that business to these terms.',
  },
  {
    title: '2. Description of Service',
    body: 'SAVIS is a marketplace platform that connects customers seeking services with independent service providers. SAVIS does not employ service providers and is not responsible for the quality, safety, legality, or delivery of services listed on the platform.',
  },
  {
    title: '3. User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. SAVIS reserves the right to suspend or terminate accounts that violate these terms.',
  },
  {
    title: '4. Service Listings',
    body: 'Service providers are responsible for the accuracy of their listings, including descriptions, pricing, and availability. SAVIS reserves the right to remove listings that violate our policies or applicable law.',
  },
  {
    title: '5. Bookings and Payments',
    body: 'When you submit a booking request, you are making an offer to engage a service provider. A binding agreement is formed only when the provider confirms the booking. Payment terms and commission rates are as displayed on the platform at the time of booking.',
  },
  {
    title: '6. SAVIS Commission',
    body: 'SAVIS charges a commission on completed transactions as displayed in the platform. The current commission rate is available in your account settings and may be updated with notice.',
  },
  {
    title: '7. Prohibited Conduct',
    body: "You agree not to use SAVIS to engage in fraudulent activity, harass other users, post false or misleading information, or circumvent SAVIS's booking system to conduct transactions outside the platform.",
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the extent permitted by law, SAVIS shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.',
  },
  {
    title: '9. Governing Law',
    body: 'These terms are governed by the laws of Kenya. Any disputes shall be subject to the jurisdiction of the courts of Nairobi, Kenya.',
  },
  {
    title: '10. Contact',
    body: 'For questions about these terms, contact us at legal@savis.co.ke.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 max-w-[720px] mx-auto flex items-center justify-between">
          <span className="text-[18px] font-bold text-brand-primary" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            SAVIS
          </span>
          <span className="text-[14px] text-secondary">Terms of Service</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[720px] mx-auto px-4 py-8">
        <p className="text-[13px] text-secondary mb-8">Last updated: June 2025</p>

        <p className="text-[15px] lg:text-[16px] text-secondary leading-relaxed mb-6">
          Welcome to SAVIS. By accessing or using our platform, you agree to be bound by these
          Terms of Service. Please read them carefully before using the service.
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2
              className="text-[18px] lg:text-[20px] font-bold text-primary mt-8 mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {section.title}
            </h2>
            <p className="text-[15px] lg:text-[16px] text-secondary leading-relaxed">
              {section.body}
            </p>
          </div>
        ))}

        {/* Footer */}
        <footer className="border-t border-border mt-12 pt-8 pb-12 text-center">
          <p className="text-[13px] text-secondary">© 2025 SAVIS. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
