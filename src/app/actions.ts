'use server';

import React from 'react';
import { db, user, pacientes, intervenciones } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { AlertaClinicaEmail } from '@/emails/AlertaClinicaEmail';

// Inicializar cliente de Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// Helper para enviar email de alerta crítica clínica
export async function enviarEmailAlertaCritica(data: {
  pacienteNombre: string;
  pacienteRut: string;
  terapeutaNombre: string;
  objetivo: string;
  desarrollo: string;
  acuerdos: string;
  accionesSeguir: string;
  observaciones: string;
  fechaIntervencion: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailDestino = 'alertas.clinicas@talitakum.cl'; // En producción, correo del administrador/director

  if (!apiKey) {
    console.log("==================================================");
    console.log(`[RESEND MOCK] Correo de Alerta Crítica Enviado`);
    console.log(`Destinatario: ${emailDestino}`);
    console.log(`Paciente: ${data.pacienteNombre}`);
    console.log(`Observaciones: ${data.observaciones}`);
    console.log("==================================================");
    return { success: true, mock: true };
  }

  try {
    const resData = await resend.emails.send({
      from: 'Talita Kum Alertas <alertas@resend.dev>', // resend.dev es el sandbox por defecto
      to: emailDestino,
      subject: `🚨 [ALERTA CLÍNICA] Intervención de Emergencia - Paciente: ${data.pacienteNombre}`,
      // Instanciamos el template con React.createElement para usarlo en archivo plano .ts
      react: React.createElement(AlertaClinicaEmail, {
        pacienteNombre: data.pacienteNombre,
        pacienteRut: data.pacienteRut,
        terapeutaNombre: data.terapeutaNombre,
        objetivo: data.objetivo,
        desarrollo: data.desarrollo,
        acuerdos: data.acuerdos,
        accionesSeguir: data.accionesSeguir,
        observaciones: data.observaciones,
        fechaIntervencion: data.fechaIntervencion,
      }),
    });

    if (resData.error) {
      throw new Error(resData.error.message);
    }

    return { success: true, id: resData.data?.id };
  } catch (error: any) {
    console.error('Error al enviar alerta por Resend:', error);
    return { success: false, error: error.message };
  }
}

// Inicializar datos semilla adaptados a las tablas de Better Auth
export async function inicializarDatosSemilla() {
  try {
    const terapeutasExistentes = await db.select().from(user).limit(1);
    if (terapeutasExistentes.length === 0) {
      await db.insert(user).values([
        {
          id: 'terapeuta-1',
          name: 'Psi. Alejandro Meléndez',
          email: 'alejandro.melendez@talitakum.cl',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'terapeuta',
        },
        {
          id: 'terapeuta-2',
          name: 'Trabajadora Social Constanza Ruiz',
          email: 'constanza.ruiz@talitakum.cl',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'terapeuta',
        },
        {
          id: 'terapeuta-3',
          name: 'Dr. Daniel Silva (Psiquiatra)',
          email: 'daniel.silva@talitakum.cl',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'admin',
        },
      ]);
      console.log('Se insertaron terapeutas en la tabla user.');
    }

    const pacientesExistentes = await db.select().from(pacientes).limit(1);
    if (pacientesExistentes.length === 0) {
      await db.insert(pacientes).values([
        {
          id: 'paciente-1',
          nombre: 'Juan Carlos Pérez',
          rut: '18.452.963-4',
          fechaNacimiento: '1995-04-12',
          estado: 'activo',
        },
        {
          id: 'paciente-2',
          nombre: 'María José Gajardo',
          rut: '20.125.847-K',
          fechaNacimiento: '1999-08-22',
          estado: 'activo',
        },
        {
          id: 'paciente-3',
          nombre: 'Carlos Esteban Muñoz',
          rut: '16.782.354-9',
          fechaNacimiento: '1988-11-05',
          estado: 'activo',
        },
        {
          id: 'paciente-4',
          nombre: 'Sofía Ignacia Valenzuela',
          rut: '19.852.147-2',
          fechaNacimiento: '1997-01-30',
          estado: 'activo',
        },
      ]);
      console.log('Se insertaron pacientes semilla.');
    }
  } catch (error) {
    console.error('Error al inicializar datos semilla:', error);
  }
}

// Obtener lista de pacientes
export async function obtenerPacientes() {
  await inicializarDatosSemilla();
  try {
    return await db.select().from(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return [
      { id: 'paciente-1', nombre: 'Juan Carlos Pérez (Local Fallback)' },
      { id: 'paciente-2', nombre: 'María José Gajardo (Local Fallback)' },
      { id: 'paciente-3', nombre: 'Carlos Esteban Muñoz (Local Fallback)' }
    ];
  }
}

// Obtener lista de terapeutas
export async function obtenerTerapeutas() {
  await inicializarDatosSemilla();
  try {
    return await db.select().from(user);
  } catch (error) {
    console.error('Error al obtener terapeutas:', error);
    return [
      { id: 'terapeuta-1', name: 'Psi. Alejandro Meléndez (Local Fallback)' },
      { id: 'terapeuta-2', name: 'Trabajadora Social Constanza Ruiz (Local Fallback)' }
    ];
  }
}

// Guardar una intervención (dispara email automático si es crítica)
export async function guardarIntervencion(data: {
  terapeutaId: string;
  pacienteId: string;
  fechaIntervencion?: string;
  objetivo: string;
  desarrollo: string;
  acuerdos: string;
  accionesSeguir: string;
  observaciones: string;
  validadoPorTerapeuta: boolean;
  audioUrl?: string;
  estadoSincronizacion?: 'sincronizado' | 'pendiente' | 'offline';
}) {
  try {
    const fecha = data.fechaIntervencion || new Date().toISOString();
    const [nuevaIntervencion] = await db
      .insert(intervenciones)
      .values({
        terapeutaId: data.terapeutaId,
        pacienteId: data.pacienteId,
        fechaIntervencion: fecha,
        objetivo: data.objetivo,
        desarrollo: data.desarrollo,
        acuerdos: data.acuerdos,
        accionesSeguir: data.accionesSeguir,
        observaciones: data.observaciones,
        validadoPorTerapeuta: data.validadoPorTerapeuta,
        audioUrl: data.audioUrl || null,
        estadoSincronizacion: data.estadoSincronizacion || 'sincronizado',
      })
      .returning();

    // Análisis en segundo plano para Alertas Críticas de Escalamiento Clínico
    const textoAnalisis = `${data.desarrollo} ${data.observaciones}`.toLowerCase();
    const esCritica =
      textoAnalisis.includes('recaída') ||
      textoAnalisis.includes('crisis') ||
      textoAnalisis.includes('suicida') ||
      textoAnalisis.includes('daño') ||
      textoAnalisis.includes('autolesi') ||
      textoAnalisis.includes('urgencia');

    if (esCritica && data.validadoPorTerapeuta) {
      // Recuperar nombres reales del paciente y terapeuta para el email
      const [pacienteInfo] = await db.select().from(pacientes).where(eq(pacientes.id, data.pacienteId)).limit(1);
      const [terapeutaInfo] = await db.select().from(user).where(eq(user.id, data.terapeutaId)).limit(1);

      const pacienteNombre = pacienteInfo?.nombre || 'Paciente Desconocido';
      const pacienteRut = pacienteInfo?.rut || 'Sin RUT';
      const terapeutaNombre = terapeutaInfo?.name || 'Terapeuta Talita Kum';

      // Disparar envío por Resend de forma asíncrona
      enviarEmailAlertaCritica({
        pacienteNombre,
        pacienteRut,
        terapeutaNombre,
        objetivo: data.objetivo,
        desarrollo: data.desarrollo,
        acuerdos: data.acuerdos,
        accionesSeguir: data.accionesSeguir,
        observaciones: data.observaciones,
        fechaIntervencion: new Date(fecha).toLocaleString('es-CL'),
      }).catch(err => console.error('Fallo en hilo de email de alerta:', err));
    }

    return { success: true, data: nuevaIntervencion };
  } catch (error: any) {
    console.error('Error al guardar intervención en BD:', error);
    return { success: false, error: error.message || 'Error desconocido al guardar en base de datos.' };
  }
}

// Sincronizar intervenciones guardadas offline en lote (analiza y dispara emails grupales/individuales)
export async function sincronizarIntervencionesLote(
  intervencionesOffline: Array<{
    id: string;
    terapeutaId: string;
    pacienteId: string;
    fechaIntervencion: string;
    objetivo: string;
    desarrollo: string;
    acuerdos: string;
    accionesSeguir: string;
    observaciones: string;
    validadoPorTerapeuta: boolean;
    audioUrl?: string;
  }>
) {
  try {
    const valoresAInsertar = intervencionesOffline.map((item) => ({
      terapeutaId: item.terapeutaId,
      pacienteId: item.pacienteId,
      fechaIntervencion: item.fechaIntervencion,
      objetivo: item.objetivo,
      desarrollo: item.desarrollo,
      acuerdos: item.acuerdos,
      accionesSeguir: item.accionesSeguir,
      observaciones: item.observaciones,
      validadoPorTerapeuta: item.validadoPorTerapeuta,
      audioUrl: item.audioUrl || null,
      estadoSincronizacion: 'sincronizado' as const,
    }));

    if (valoresAInsertar.length > 0) {
      await db.insert(intervenciones).values(valoresAInsertar);
      
      // Analizar cada registro subido para enviar alertas por correo de forma retardada
      for (const item of intervencionesOffline) {
        const textoAnalisis = `${item.desarrollo} ${item.observaciones}`.toLowerCase();
        const esCritica =
          textoAnalisis.includes('recaída') ||
          textoAnalisis.includes('crisis') ||
          textoAnalisis.includes('suicida') ||
          textoAnalisis.includes('daño') ||
          textoAnalisis.includes('autolesi') ||
          textoAnalisis.includes('urgencia');

        if (esCritica && item.validadoPorTerapeuta) {
          const [pacienteInfo] = await db.select().from(pacientes).where(eq(pacientes.id, item.pacienteId)).limit(1);
          const [terapeutaInfo] = await db.select().from(user).where(eq(user.id, item.terapeutaId)).limit(1);

          enviarEmailAlertaCritica({
            pacienteNombre: pacienteInfo?.nombre || 'Paciente Desconocido',
            pacienteRut: pacienteInfo?.rut || 'Sin RUT',
            terapeutaNombre: terapeutaInfo?.name || 'Terapeuta Talita Kum',
            objetivo: item.objetivo,
            desarrollo: item.desarrollo,
            acuerdos: item.acuerdos,
            accionesSeguir: item.accionesSeguir,
            observaciones: item.observaciones,
            fechaIntervencion: new Date(item.fechaIntervencion).toLocaleString('es-CL'),
          }).catch(err => console.error('Error enviando email tras sincronización:', err));
        }
      }
    }
    
    return { success: true, count: valoresAInsertar.length };
  } catch (error: any) {
    console.error('Error al sincronizar lote en BD:', error);
    return { success: false, error: error.message };
  }
}

// Obtener historial de intervenciones
export async function obtenerIntervenciones() {
  try {
    const registros = await db
      .select({
        id: intervenciones.id,
        fechaIntervencion: intervenciones.fechaIntervencion,
        objetivo: intervenciones.objetivo,
        desarrollo: intervenciones.desarrollo,
        acuerdos: intervenciones.acuerdos,
        accionesSeguir: intervenciones.accionesSeguir,
        observaciones: intervenciones.observaciones,
        validadoPorTerapeuta: intervenciones.validadoPorTerapeuta,
        audioUrl: intervenciones.audioUrl,
        estadoSincronizacion: intervenciones.estadoSincronizacion,
        terapeutaNombre: user.name,
        pacienteNombre: pacientes.nombre,
      })
      .from(intervenciones)
      .leftJoin(user, eq(intervenciones.terapeutaId, user.id))
      .leftJoin(pacientes, eq(intervenciones.pacienteId, pacientes.id))
      .orderBy(desc(intervenciones.fechaIntervencion));

    return registros;
  } catch (error) {
    console.error('Error al obtener intervenciones:', error);
    return [];
  }
}

// ==========================================
// ACCIONES DE GESTIÓN DE USUARIOS Y PERMISOS
// ==========================================

export async function obtenerUsuarios() {
  try {
    const lista = await db.select().from(user);
    return { success: true, users: lista };
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, error: error.message || 'Error al obtener usuarios' };
  }
}

export async function actualizarUsuarioPermisos(
  userId: string,
  data: {
    role: 'terapeuta' | 'admin';
    canRecord: boolean;
    canViewDashboard: boolean;
    isBanned: boolean;
  }
) {
  try {
    await db
      .update(user)
      .set({
        role: data.role,
        canRecord: data.canRecord,
        canViewDashboard: data.canViewDashboard,
        isBanned: data.isBanned,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
    return { success: true };
  } catch (error: any) {
    console.error('Error al actualizar permisos:', error);
    return { success: false, error: error.message || 'Error al actualizar permisos' };
  }
}

export async function eliminarUsuario(userId: string) {
  try {
    await db.delete(user).where(eq(user.id, userId));
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, error: error.message || 'Error al eliminar usuario' };
  }
}

