import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

let instance: ReturnType<typeof createDb> | undefined;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // Neon's HTTP driver is stateless, so it is safe on Cloudflare Workers.
  return drizzle(neon(url), { schema });
}

// Created on first use: on Workers, environment variables are not reliably available
// while the module is being evaluated, only once a request is being handled.
export function getDb() {
  return (instance ??= createDb());
}
