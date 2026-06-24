import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || 'a-very-secure-hackaton-secret-key-1234567890',
  // Configuración de perfiles y roles personalizados
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'terapeuta',
      },
    },
  },
});
