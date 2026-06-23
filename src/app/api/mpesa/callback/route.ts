// POST /api/mpesa/callback
// Safaricom calls this endpoint with the STK Push result.
// Matches the booking by checkoutRequestId and updates its status.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// ResultCodes that map to user-facing messages on the pay screen
const FAIL_MESSAGES: Record<number, string> = {
  1:    'Insufficient funds in your M-Pesa account.',
  17:   'M-Pesa service is currently unavailable. Please try again.',
  1032: 'You cancelled the M-Pesa payment.',
  2001: 'Wrong M-Pesa PIN entered.',
  1037: 'No response from your device. Make sure your phone is on.',
};

interface DarajaCallbackItem { Name: string; Value?: string | number }

interface DarajaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: DarajaCallbackItem[] };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DarajaCallbackBody;
    const cb   = body?.Body?.stkCallback;
    if (!cb) return NextResponse.json({ ok: false }, { status: 400 });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cb;

    // Find the booking that triggered this checkout
    const q = await adminDb
      .collection('bookings')
      .where('checkoutRequestId', '==', CheckoutRequestID)
      .limit(1)
      .get();

    if (q.empty) {
      console.warn('[mpesa/callback] no booking for checkoutRequestId', CheckoutRequestID);
      return NextResponse.json({ ok: true }); // ack Safaricom regardless
    }

    const bookingRef = q.docs[0].ref;

    if (ResultCode === 0) {
      // Success — extract the M-Pesa receipt
      const items   = CallbackMetadata?.Item ?? [];
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value as string | undefined;

      // Reveal provider phone post-payment (the confirmation screen displays it)
      const bookingSnap  = q.docs[0];
      const providerId   = bookingSnap.data().providerId as string | undefined;
      let providerPhone: string | null = null;
      if (providerId) {
        const providerUserSnap = await adminDb.collection('users').doc(providerId).get();
        providerPhone = (providerUserSnap.data()?.profile?.phone as string | undefined) ?? null;
      }

      await bookingRef.update({
        status:        'confirmed',
        paymentRef:    receipt ?? null,
        confirmedAt:   new Date(),
        providerPhone,          // null until here — only revealed after payment
      });
    } else {
      // Failure — store code so pay screen can show a human-readable reason
      await bookingRef.update({
        status:          'payment_failed',
        failResultCode:  ResultCode,
        failResultDesc:  FAIL_MESSAGES[ResultCode] ?? ResultDesc,
      });
    }

    // Always return 200 so Safaricom doesn't retry
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/mpesa/callback] error:', err);
    // Still 200 to suppress Safaricom retries; log the real error
    return NextResponse.json({ ok: false });
  }
}
