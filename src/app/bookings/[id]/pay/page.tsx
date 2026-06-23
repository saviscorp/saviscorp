// Route: /bookings/[id]/pay  (Screens 6, 7, 8, 9)
// Sprint 4 payment screen: idle → sending → waiting → confirmed/failed/expired.
// STK Push via Daraja; result delivered by M-Pesa callback → Firestore onSnapshot.
export { default } from '@/components/booking/[id]/pay/page';
