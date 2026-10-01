import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { cancelSubscriptionForUser } from '@/lib/billing';
import { getDb } from '@/lib/db';
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
      // Turn on once an email provider is configured.
      requireEmailVerification: false,
      // No email provider yet: log the reset link so it can be used in development.
      sendResetPassword: async ({ user, url }) => {
        console.log(`[auth] Password reset link for ${user.email}: ${url}`);
      },
    },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

// Created on first use so that env vars are read at request time (see lib/db).
export function getAuth() {
  return (instance ??= createAuth());
}
