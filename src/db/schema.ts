import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Tabla de Usuarios (Terapeutas)
export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nombre: text('nombre').notNull(),
  email: text('email').notNull().unique(),
  rol: text('rol').notNull().default('terapeuta'),
  fechaCreacion: text('fecha_creacion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// 2. Tabla de Pacientes
export const pacientes = sqliteTable('pacientes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  nombre: text('nombre').notNull(),
  rut: text('rut').unique(), // Cédula o identificador nacional
  fechaNacimiento: text('fecha_nacimiento'),
  estado: text('estado').notNull().default('activo'), // activo, egresado, etc.
  fechaCreacion: text('fecha_creacion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

// 3. Tabla de Intervenciones
export const intervenciones = sqliteTable('intervenciones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  terapeutaId: text('terapeuta_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  pacienteId: text('paciente_id')
    .notNull()
    .references(() => pacientes.id, { onDelete: 'cascade' }),
  fechaIntervencion: text('fecha_intervencion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  
  // Los 5 campos obligatorios del flujo estructurado
  objetivo: text('objetivo').notNull(),
  desarrollo: text('desarrollo').notNull(),
  acuerdos: text('acuerdos').notNull(),
  accionesSeguir: text('acciones_seguir').notNull(),
  observaciones: text('observaciones').notNull(),
  
  // Regla de Oro: Confirmación/Validación por terapeuta
  validadoPorTerapeuta: integer('validado_por_terapeuta', { mode: 'boolean' })
    .notNull()
    .default(false),
  
  // Campos de apoyo offline y multimedia
  audioUrl: text('audio_url'), // Almacenamiento en la nube (ej. S3/R2)
  estadoSincronizacion: text('estado_sincronizacion')
    .notNull()
    .default('pendiente'), // 'sincronizado' | 'pendiente' | 'offline'
  
  fechaCreacion: text('fecha_creacion')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});
