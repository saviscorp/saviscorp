// POST /api/mpesa/stkpush
// Initiates a Daraja STK Push for a booking in awaiting_payment state.
// Required env vars:
//   MPESA_BASE_URL          – https://sandbox.safaricom.co.ke  (or prod URL)
//   MPESA_CONSUMER_KEY
//   MPESA_CONSUMER_SECRET
//   MPESA_SHORTCODE         – Paybill / Till number
//   MPESA_PASSKEY           – from Daraja portal
//   MPESA_CALLBACK_URL      – public HTTPS URL that Safaricom will POST the result to
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

async function getDarajaToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY ?? '';
  const secret = process.env.MPESA_CONSUMER_SECRET ?? '';
  const basic  = Buffer.from(`${key}:${secret}`).toString('base64');
  const base   = process.env.MPESA_BASE_URL ?? 'https://sandbox.safaricom.co.ke';
  const res    = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${basic}` } },
  );
  if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId, phone, amount, ref } = await req.json() as {
      bookingId: string;
      phone: string;
      amount: number;
      ref: string;
    };

    // Validate the booking is still awaiting payment
    const snap = await adminDb.collection('bookings').doc(bookingId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const status = snap.data()?.status as string;
    if (status !== 'awaiting_payment') {
      return NextResponse.json(
        { error: `Booking is not in awaiting_payment state (current: ${status})` },
        { status: 409 },
      );
    }

    const shortcode = process.env.MPESA_SHORTCODE ?? '';
    const passkey   = process.env.MPESA_PASSKEY ?? '';
    const base      = process.env.MPESA_BASE_URL ?? 'https://sandbox.safaricom.co.ke';

    // Daraja password = base64(shortcode + passkey + timestamp)
    const ts       = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');

    const token = await getDarajaToken();

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         ts,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            Math.round(amount),          // M-Pesa requires integer
        PartyA:            phone,
        PartyB:            shortcode,
        PhoneNumber:       phone,
        CallBackURL:       process.env.MPESA_CALLBACK_URL,
        AccountReference:  ref,
        TransactionDesc:   'SAVIS Booking Payment',
      }),
    });

    const stkData = await stkRes.json() as {
      ResponseCode?: string;
      ResponseDescription?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
    };

    if (stkData.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkData.ResponseDescription ?? 'STK push rejected' },
        { status: 502 },
      );
    }

    // Mark booking payment_pending and store the checkout request ID for callback matching
    await adminDb.collection('bookings').doc(bookingId).update({
      status:            'payment_pending',
      checkoutRequestId: stkData.CheckoutRequestID,
      payingPhone:       phone,
    });

    return NextResponse.json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    });
  } catch (err) {
    console.error('[/api/mpesa/stkpush] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
