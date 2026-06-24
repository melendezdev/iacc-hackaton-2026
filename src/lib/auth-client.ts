import { createAuthClient } from 'better-auth/react';

// Cliente de autenticación para uso en componentes interactivos del navegador (Client Components)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});
