import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — SAVIS',
}

const SECTIONS: { title: string; body: string | string[] }[] = [
  {
    title: '1. Information We Collect',
    body: [
      'Account information: name, email address, phone number, date of birth, gender',
      'Identity documents: government-issued ID submitted for verification purposes',
      'Profile information: profile photo, service listings, booking history',
      'Usage data: how you interact with our platform, device information, IP address',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to provide and improve our services, verify your identity, process bookings, communicate with you about your account, ensure platform safety, and comply with legal obligations.',
  },
  {
    title: '3. Identity Verification',
    body: 'Identity documents submitted for verification are stored securely and accessed only by authorised SAVIS staff for verification purposes. Documents are never shared with other users, providers, or third parties except as required by law.',
  },
  {
    title: '4. Information Sharing',
    body: 'We share your information with service providers or customers only as necessary to fulfil a booking (for example, sharing your contact details after a booking is confirmed). We do not sell your personal data to third parties.',
  },
  {
    title: '5. Data Protection — Kenya Data Protection Act 2019',
    body: 'SAVIS complies with the Kenya Data Protection Act 2019. You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact privacy@savis.co.ke.',
  },
  {
    title: '6. Data Retention',
    body: 'We retain your account data for as long as your account is active. Identity documents are retained for 7 years as required by Kenyan anti-money laundering regulations.',
  },
  {
    title: '7. Security',
    body: 'We use industry-standard encryption and security measures to protect your data. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '8. Cookies',
    body: 'We use essential cookies to keep you signed in and remember your preferences. We do not use advertising cookies.',
  },
  {
    title: '9. Children\'s Privacy',
    body: 'SAVIS is not intended for users under 18. We do not knowingly collect data from minors.',
  },
  {
    title: '10. Changes to This Policy',
    body: 'We will notify you of significant changes to this policy via email or in-app notification with 14 days notice.',
  },
  {
    title: '11. Contact',
    body: 'For privacy questions or to exercise your data rights: privacy@savis.co.ke | P.O. Box 00100, Nairobi, Kenya.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 max-w-[720px] mx-auto flex items-center justify-between">
          <span
            className="text-[18px] font-bold text-brand-primary"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            SAVIS
          </span>
          <span className="text-[14px] text-secondary">Privacy Policy</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[720px] mx-auto px-4 py-8">
        <p className="text-[13px] text-secondary mb-8">Last updated: June 2025</p>

        <p className="text-[15px] lg:text-[16px] text-secondary leading-relaxed mb-6">
          At SAVIS, we take your privacy seriously. This Privacy Policy explains how we collect,
          use, and protect your personal information when you use our platform.
        </p>

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2
              className="text-[18px] lg:text-[20px] font-bold text-primary mt-8 mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {section.title}
            </h2>

            {Array.isArray(section.body) ? (
              <ul className="space-y-2 pl-1">
                {section.body.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-brand-primary flex-shrink-0" />
                    <span className="text-[15px] lg:text-[16px] text-secondary leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] lg:text-[16px] text-secondary leading-relaxed">
                {section.body}
              </p>
            )}
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
