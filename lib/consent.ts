import 'server-only';

import { randomUUID } from 'node:crypto';

import { getDb } from '@/lib/db';
import { consent } from '@/lib/db/schema';
import { LEGAL_DOCUMENTS, LEGAL_VERSION } from '@/lib/legal';

/** Record that a new account agreed to the current Terms of Service and Privacy Policy, and when. */
export async function recordConsent(userId: string) {
  await getDb()
    .insert(consent)
    .values(LEGAL_DOCUMENTS.map((document) => ({ id: randomUUID(), userId, document, version: LEGAL_VERSION })))
    .onConflictDoNothing();
}
