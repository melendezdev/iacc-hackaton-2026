'use server';

import { db, usuarios, pacientes, intervenciones } from '@/db';
import { desc, eq } from 'drizzle-orm';

// Función para inicializar datos semilla si la base de datos está vacía.
// Esto permite que el prototipo funcione inmediatamente en la Hackathon.
export async function inicializarDatosSemilla() {
  try {
    // 1. Verificar Terapeutas (Usuarios)
    const terapeutasExistentes = await db.select().from(usuarios).limit(1);
    let terapeutasInsertados = [];
    if (terapeutasExistentes.length === 0) {
      terapeutasInsertados = await db
        .insert(usuarios)
        .values([
          {
            id: 'terapeuta-1',
            nombre: 'Psi. Alejandro Meléndez',
            email: 'alejandro.melendez@talitakum.cl',
            rol: 'terapeuta',
          },
          {
            id: 'terapeuta-2',
            nombre: 'Trabajadora Social Constanza Ruiz',
            email: 'constanza.ruiz@talitakum.cl',
            rol: 'terapeuta',
          },
          {
            id: 'terapeuta-3',
            nombre: 'Dr. Daniel Silva (Psiquiatra)',
            email: 'daniel.silva@talitakum.cl',
            rol: 'admin',
          },
        ])
        .returning();
      console.log('Se insertaron terapeutas semilla.');
    }

    // 2. Verificar Pacientes
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
    // Retornar fallback para asegurar que la UI no se rompa si la BD remota tiene problemas
    return [
      { id: 'paciente-1', nombre: 'Juan Carlos Pérez (Local Fallback)' },
      { id: 'paciente-2', nombre: 'María José Gajardo (Local Fallback)' },
      { id: 'paciente-3', nombre: 'Carlos Esteban Muñoz (Local Fallback)' }
    ];
  }
}

// Obtener lista de terapeutas (usuarios)
export async function obtenerTerapeutas() {
  await inicializarDatosSemilla();
  try {
    return await db.select().from(usuarios);
  } catch (error) {
    console.error('Error al obtener terapeutas:', error);
    return [
      { id: 'terapeuta-1', nombre: 'Psi. Alejandro Meléndez (Local Fallback)' },
      { id: 'terapeuta-2', nombre: 'Trabajadora Social Constanza Ruiz (Local Fallback)' }
    ];
  }
}

// Guardar una intervención
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
    const [nuevaIntervencion] = await db
      .insert(intervenciones)
      .values({
        terapeutaId: data.terapeutaId,
        pacienteId: data.pacienteId,
        fechaIntervencion: data.fechaIntervencion || new Date().toISOString(),
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
    return { success: true, data: nuevaIntervencion };
  } catch (error: any) {
    console.error('Error al guardar intervención en BD:', error);
    return { success: false, error: error.message || 'Error desconocido al guardar en base de datos.' };
  }
}

// Sincronizar intervenciones guardadas offline en lote
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
    // Realizamos un join manual o select para recuperar las intervenciones ordenadas con nombres
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
        terapeutaNombre: usuarios.nombre,
        pacienteNombre: pacientes.nombre,
      })
      .from(intervenciones)
      .leftJoin(usuarios, eq(intervenciones.terapeutaId, usuarios.id))
      .leftJoin(pacientes, eq(intervenciones.pacienteId, pacientes.id))
      .orderBy(desc(intervenciones.fechaIntervencion));

    return registros;
  } catch (error) {
    console.error('Error al obtener intervenciones:', error);
    return [];
  }
}
