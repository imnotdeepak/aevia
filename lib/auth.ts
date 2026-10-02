import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { after } from 'next/server';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { cancelSubscriptionForUser } from '@/lib/billing';
import { recordConsent } from '@/lib/consent';
import { getDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { trustedOrigins } from '@/lib/trusted-origins';
import * as schema from '@/lib/db/schema';

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    // Local dev servers plus the live site, with and without "www." (see lib/trusted-origins).
    trustedOrigins: trustedOrigins(),
    // Verify sessions from a short-lived signed cookie instead of querying Neon on every
    // page navigation. Sign-out and revocation take effect within maxAge.
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
    // Creating an account means agreeing to the Terms and Privacy Policy. The sign-up form sends
    // acceptedTerms: true after the checkbox; requiring it here means it cannot be skipped by calling the API directly.
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email' && (ctx.body as { acceptedTerms?: unknown } | undefined)?.acceptedTerms !== true) {
          throw new APIError('BAD_REQUEST', { message: 'Please agree to the Terms of Service and Privacy Policy to create an account.' });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (account) => {
            // Best effort: a failure here must never stop someone from signing up, but it is logged.
            try {
              await recordConsent(account.id);
            } catch (error) {
              console.error('[consent] Could not record acceptance of the Terms for a new account', error);
            }
          },
        },
      },
    },
    user: {
      deleteUser: {
        enabled: true,
        // Stop billing before the account disappears. If this fails, the account is not deleted.
        beforeDelete: async (account) => {
          await cancelSubscriptionForUser(account.id);
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Turn on later if sign-ups should have to confirm their email address.
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        const send = () => sendPasswordResetEmail({ to: user.email, name: user.name, url });
        // Send after the response goes out, so the page answers equally fast whether or not the
        // address has an account (a slower answer would reveal which emails are registered).
        try {
          after(send);
        } catch {
          // Not inside a web request (for example a script): just send it now.
          await send();
        }
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

// Created on first use so that env vars are read at request time (see lib/db).
export function getAuth() {
  return (instance ??= createAuth());
}
