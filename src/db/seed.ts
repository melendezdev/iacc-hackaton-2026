import * as dotenv from 'dotenv';

// 1. CARGAR VARIABLES DE ENTORNO ANTES DE IMPORTAR CUALQUIER MÓDULO DE LA BASE DE DATOS
// Esto evita que se instancie el cliente SQL con valores vacíos.
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🌱 Iniciando sembrado de datos (Seeding)...');

  try {
    // 2. IMPORTACIONES DINÁMICAS
    const { db } = await import('./index');
    const { pacientes, intervenciones, user, account, session, verification } = await import('./schema');
    const { auth } = await import('../lib/auth');

    console.log(`Conectando a base de datos en URL: ${process.env.DATABASE_URL || 'file:local.db'}`);

    // 3. Limpiar base de datos
    console.log('🧹 Limpiando tablas existentes...');
    await db.delete(intervenciones);
    await db.delete(pacientes);
    await db.delete(session);
    await db.delete(account);
    await db.delete(verification);
    await db.delete(user);
    console.log('✓ Tablas limpiadas.');

    // 4. Sembrar Usuarios (Terapeutas y Admins) usando la API de Better Auth
    console.log('👥 Creando terapeutas y administradores a través de Better Auth...');
    const demoPassword = 'PasswordDemo123!';

    const usuariosDemo = [
      {
        id: 'terapeuta-1',
        name: 'Psi. Alejandro Meléndez',
        email: 'alejandro.melendez@talitakum.cl',
        role: 'terapeuta',
      },
      {
        id: 'terapeuta-2',
        name: 'Trabajadora Social Constanza Ruiz',
        email: 'constanza.ruiz@talitakum.cl',
        role: 'terapeuta',
      },
      {
        id: 'terapeuta-3',
        name: 'Dr. Daniel Silva (Psiquiatra)',
        email: 'daniel.silva@talitakum.cl',
        role: 'admin',
      },
    ];

    for (const u of usuariosDemo) {
      await auth.api.signUpEmail({
        body: {
          email: u.email,
          password: demoPassword,
          name: u.name,
          role: u.role,
        },
      });
      console.log(`  + Usuario creado: ${u.name} [${u.role}]`);
    }

    // Recuperar IDs de usuarios creados
    const dbUsers = await db.select().from(user);
    const terapeuta1Id = dbUsers.find(u => u.email === 'alejandro.melendez@talitakum.cl')?.id || 'terapeuta-1';
    const terapeuta2Id = dbUsers.find(u => u.email === 'constanza.ruiz@talitakum.cl')?.id || 'terapeuta-2';

    // 5. Sembrar Pacientes
    console.log('👤 Creando pacientes clínicos...');
    const pacientesSemilla = [
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
    ];

    await db.insert(pacientes).values(pacientesSemilla);
    console.log(`✓ Insertados ${pacientesSemilla.length} pacientes.`);

    // 6. Sembrar Intervenciones Previas (Historial)
    console.log('📝 Creando historial de intervenciones previas...');
    
    const fechaBase = new Date();
    const diasAtras = (dias: number) => {
      const d = new Date(fechaBase);
      d.setDate(d.getDate() - dias);
      return d.toISOString();
    };

    const intervencionesSemilla = [
      {
        id: 'intervencion-1',
        terapeutaId: terapeuta1Id,
        pacienteId: 'paciente-1',
        fechaIntervencion: diasAtras(5),
        objetivo: 'Abordaje de ansiedad social y estrategias de aproximación.',
        desarrollo: 'El paciente reporta haber logrado asistir a la entrevista laboral ensayada la semana pasada. Se observa optimista, aunque refiere haber sentido palpitaciones antes de ingresar al edificio. Se revisan técnicas cognitivo-conductuales.',
        acuerdos: 'Practicar autoregistro de pensamientos ansiosos dos veces al día.',
        accionesSeguir: 'Seguimiento telefónico el jueves y sesión presencial el lunes.',
        observaciones: 'Avance notable en la adherencia y exposición a gatillantes ansiosos.',
        validadoPorTerapeuta: true,
        estadoSincronizacion: 'sincronizado',
      },
      {
        id: 'intervencion-2',
        terapeutaId: terapeuta1Id,
        pacienteId: 'paciente-2',
        fechaIntervencion: diasAtras(3),
        objetivo: 'Revisión de gatillantes y plan de prevención de recaídas.',
        desarrollo: 'En la sesión la paciente relató que sintió fuertes deseos de consumir el fin de semana tras un conflicto con su tutor. Logró distanciarse físicamente de la situación y llamó a su red de apoyo para contención emocional rápida.',
        acuerdos: 'Evitar el tránsito por zonas de riesgo identificadas en su mapa de vulnerabilidad.',
        accionesSeguir: 'Agendar control psiquiátrico de ajuste farmacológico y sesión con tutor familiar.',
        observaciones: '⚠️ Alerta de recaída mitigada. Paciente demuestra asertividad al activar plan de emergencia.',
        validadoPorTerapeuta: true,
        estadoSincronizacion: 'sincronizado',
      },
      {
        id: 'intervencion-3',
        terapeutaId: terapeuta2Id,
        pacienteId: 'paciente-3',
        fechaIntervencion: diasAtras(1),
        objetivo: 'Contención en crisis aguda por ideación suicida leve.',
        desarrollo: 'El paciente acudió muy descompensado y llorando debido a problemas económicos. Expresa no verle sentido a continuar, negando un plan concreto de daño personal pero sí deseos pasivos de morir. Se activa protocolo de contención y anclaje.',
        acuerdos: 'Firmar contrato de no agresión personal y llamar al terapeuta de turno ante escalada de crisis.',
        accionesSeguir: 'Monitoreo preventivo del personal del hogar cada 4 horas y derivación prioritaria a urgencia médica.',
        observaciones: '⚠️ ALERTA CRÍTICA: Descompensación afectiva severa e ideación de daño pasivo latente.',
        validadoPorTerapeuta: true,
        estadoSincronizacion: 'sincronizado',
      }
    ];

    await db.insert(intervenciones).values(intervencionesSemilla);
    console.log(`✓ Insertadas ${intervencionesSemilla.length} intervenciones clínicas semilla.`);

    console.log('🎉 ¡Base de datos sembrada con éxito!');
  } catch (error) {
    console.error('❌ Error durante el sembrado de datos:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
