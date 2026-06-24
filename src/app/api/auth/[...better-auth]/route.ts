import { auth } from '@/lib/auth';

// Exportar los manejadores de ruta para cada método HTTP según Better Auth
export const GET = auth.handler;
export const POST = auth.handler;
export const PATCH = auth.handler;
export const DELETE = auth.handler;
export const OPTIONS = auth.handler;
