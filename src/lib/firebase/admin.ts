// Server-only: Firebase Admin SDK singleton for API routes.
// Required env vars (add to .env.local):
//   FIREBASE_PROJECT_ID      – same value as NEXT_PUBLIC_FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL    – service account email
//   FIREBASE_PRIVATE_KEY     – service account private key (\\n line breaks)
//
// Initialization is intentionally lazy (inside a function) so that the build
// step — which has no env vars — does not throw at module evaluation time.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  return (
    getApps().find((a) => a.name === 'savis-admin') ??
    initializeApp(
      {
        credential: cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      },
      'savis-admin',
    )
  );
}

// Lazily initialized on first API call — safe at build time.
let _adminDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

// Convenience alias so existing import sites (adminDb.collection(...)) keep working.
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
