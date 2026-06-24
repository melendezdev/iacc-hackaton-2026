import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Turso client configuration. In local development, it can fall back to a local SQLite file.
const client = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle({ client, schema });
export * from './schema';
