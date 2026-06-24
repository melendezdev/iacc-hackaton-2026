import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ==========================================
// TABLAS EXIGIDAS POR BETTER AUTH
// ==========================================

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  // Rol personalizado para control de acceso en la clínica
  role: text('role').notNull().default('terapeuta'), // 'terapeuta' | 'admin'
  // Gestión de Permisos Detallada
  canRecord: integer('can_record', { mode: 'boolean' }).notNull().default(true), // Permiso para registrar intervenciones
  canViewDashboard: integer('can_view_dashboard', { mode: 'boolean' }).notNull().default(false), // Permiso para ver el dashboard de KPIs
  isBanned: integer('is_banned', { mode: 'boolean' }).notNull().default(false), // Bloqueo total de acceso
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

// ==========================================
// TABLAS DEL DOMINIO CLÍNICO
// ==========================================

export const pacientes = sqliteTable('pacientes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nombre: text('nombre').notNull(),
  rut: text('rut').unique(),
  fechaNacimiento: text('fecha_nacimiento'),
  estado: text('estado').notNull().default('activo'),
  fechaCreacion: text('fecha_creacion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const intervenciones = sqliteTable('intervenciones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  terapeutaId: text('terapeuta_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  pacienteId: text('paciente_id')
    .notNull()
    .references(() => pacientes.id, { onDelete: 'cascade' }),
  fechaIntervencion: text('fecha_intervencion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  
  // Los 5 campos obligatorios
  objetivo: text('objetivo').notNull(),
  desarrollo: text('desarrollo').notNull(),
  acuerdos: text('acuerdos').notNull(),
  accionesSeguir: text('acciones_seguir').notNull(),
  observaciones: text('observaciones').notNull(),
  
  // Regla de Oro
  validadoPorTerapeuta: integer('validado_por_terapeuta', { mode: 'boolean' })
    .notNull()
    .default(false),
  
  audioUrl: text('audio_url'),
  estadoSincronizacion: text('estado_sincronizacion')
    .notNull()
    .default('pendiente'),
  
  fechaCreacion: text('fecha_creacion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});
export type UserSchemaType = typeof user.$inferSelect;
export type PacienteSchemaType = typeof pacientes.$inferSelect;
export type IntervencionSchemaType = typeof intervenciones.$inferSelect;
export type SessionSchemaType = typeof session.$inferSelect;
export type AccountSchemaType = typeof account.$inferSelect;
export type VerificationSchemaType = typeof verification.$inferSelect;
