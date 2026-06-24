export interface StructuredIntervention {
  objetivo: string;
  desarrollo: string;
  acuerdos: string;
  accionesSeguir: string;
  observaciones: string;
}

// Simulador de procesamiento de IA para transcribir y estructurar la intervención.
// En un entorno de producción, esto enviaría el audio a un endpoint de Whisper + GPT-4o/Claude.
export async function procesarAudioAIntervencion(
  audioBlob: Blob | string, // Puede ser el Blob real o un texto simulado
  textoAlternativo?: string
): Promise<StructuredIntervention> {
  // Simular latencia de procesamiento de red (1.5 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let textoAProcesar = '';

  if (typeof audioBlob === 'string') {
    textoAProcesar = audioBlob;
  } else if (textoAlternativo) {
    textoAProcesar = textoAlternativo;
  } else {
    // Si es un Blob real y no hay texto, simulamos una transcripción por defecto de un caso común.
    textoAProcesar = 
      "El objetivo de hoy fue revisar el manejo de la frustración en el ámbito laboral. " +
      "Durante el desarrollo de la sesión, el paciente expresó sentir mucha presión por parte de su jefe, " +
      "pero logramos identificar gatillantes de estrés y ensayar técnicas de respiración diafragmática. " +
      "Llegamos a los siguientes acuerdos: el paciente practicará la respiración de 3 a 5 minutos antes de su jornada. " +
      "Como acciones a seguir, se coordinará una sesión familiar para el próximo martes y yo prepararé el reporte de avance. " +
      "Como observaciones relevantes, se detecta un nivel de ansiedad moderado-alto pero el paciente se mantiene adherente y motivado al proceso de rehabilitación.";
  }

  return estructurarTexto(textoAProcesar);
}

// Función helper que parsea el texto buscando secciones clave
// o realiza un autocompletado inteligente si el texto no es estructurado.
export function estructurarTexto(texto: string): StructuredIntervention {
  const limpio = texto.toLowerCase();
  
  let objetivo = '';
  let desarrollo = '';
  let acuerdos = '';
  let accionesSeguir = '';
  let observaciones = '';

  // Intentar una división basada en palabras clave comunes
  const palabrasClave = {
    objetivo: ['objetivo', 'meta', 'propósito', 'el fin de'],
    desarrollo: ['desarrollo', 'ocurrido', 'sesión', 'paciente relató', 'paciente refirió', 'durante la sesión'],
    acuerdos: ['acuerdo', 'compromiso', 'pacto', 'se compromete a'],
    acciones: ['acción a seguir', 'acciones a seguir', 'tareas', 'siguiente paso', 'siguientes pasos', 'se coordinará'],
    observaciones: ['observación', 'observaciones', 'nota relevante', 'alerta', 'comentario', 'diagnóstico']
  };

  // Si el texto parece estar explícitamente dictado por secciones:
  // e.g. "Objetivo: ... Desarrollo: ... Acuerdos: ..."
  const secciones = texto.split(/(objetivo|desarrollo|acuerdos|acciones a seguir|acciones|observaciones|observación):/gi);
  
  if (secciones.length > 1) {
    for (let i = 1; i < secciones.length; i += 2) {
      const header = secciones[i].toLowerCase().trim();
      const content = secciones[i + 1]?.trim() || '';
      
      if (header.includes('objetivo')) objetivo = content;
      else if (header.includes('desarrollo')) desarrollo = content;
      else if (header.includes('acuerdo')) acuerdos = content;
      else if (header.includes('accion') || header.includes('acciones')) accionesSeguir = content;
      else if (header.includes('observacion') || header.includes('observación')) observaciones = content;
    }
  }

  // Si no se pudo estructurar mediante delimitadores claros, hacemos un procesamiento heurístico
  if (!objetivo || !desarrollo) {
    // Si es un dictado plano libre, simulamos un algoritmo de IA clasificando los párrafos
    const oraciones = texto.split(/(?<=[.?!])\s+/);
    
    const objOraciones: string[] = [];
    const desOraciones: string[] = [];
    const acuOraciones: string[] = [];
    const accOraciones: string[] = [];
    const obsOraciones: string[] = [];

    oraciones.forEach(oracion => {
      const oracionMin = oracion.toLowerCase();
      
      if (palabrasClave.objetivo.some(k => oracionMin.includes(k))) {
        objOraciones.push(oracion);
      } else if (palabrasClave.acuerdos.some(k => oracionMin.includes(k))) {
        acuOraciones.push(oracion);
      } else if (palabrasClave.acciones.some(k => oracionMin.includes(k))) {
        accOraciones.push(oracion);
      } else if (palabrasClave.observaciones.some(k => oracionMin.includes(k))) {
        obsOraciones.push(oracion);
      } else {
        desOraciones.push(oracion);
      }
    });

    objetivo = objOraciones.join(' ') || 'Definir y evaluar el estado actual del paciente.';
    desarrollo = desOraciones.join(' ') || texto; // Por defecto todo va al desarrollo
    acuerdos = acuOraciones.join(' ') || 'El paciente se compromete a continuar con sus tareas diarias.';
    accionesSeguir = accOraciones.join(' ') || 'Monitorear evolución en la siguiente sesión regular.';
    observaciones = obsOraciones.join(' ') || 'Paciente demuestra buena disposición; sin alertas críticas detectadas en esta sesión.';
  }

  // Limpiar y dar formato final (Capitalizar primera letra de cada campo)
  const format = (txt: string) => {
    const t = txt.trim().replace(/^,\s*/, '').replace(/^[.\s]+|[.\s]+$/g, '');
    return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : 'No especificado.';
  };

  return {
    objetivo: format(objetivo),
    desarrollo: format(desarrollo),
    acuerdos: format(acuerdos),
    accionesSeguir: format(accionesSeguir),
    observaciones: format(observaciones)
  };
}

// Escenarios de prueba para la Hackathon (Pre-cargados para acelerar las demos)
export const ESCENARIOS_DEMO = [
  {
    titulo: 'Caso 1: Alerta de Recaída',
    transcripcion: 'El objetivo de la sesión fue la contención emocional tras una crisis familiar. En el desarrollo el paciente reporta que el fin de semana sintió fuertes deseos de consumir y estuvo a punto de llamar a su antiguo círculo. Conversamos sobre respiración y llamó a su padrino terapéutico, lo que evitó la recaída. El acuerdo principal es que asistirá a tres reuniones de Narcóticos Anónimos esta semana. Acciones a seguir: agendar cita psiquiátrica urgente para ajuste de dosis de estabilizadores. Observaciones: Alerta de recaída latente, red de apoyo familiar inestable.',
  },
  {
    titulo: 'Caso 2: Avance Positivo',
    transcripcion: 'El objetivo fue la reinserción laboral y planificación de entrevistas. En el desarrollo el usuario completó su currículum vitae y ensayó respuestas para entrevistas simuladas, mostrando buena actitud y disminución de la ansiedad. El acuerdo es que enviará al menos 3 postulaciones de aquí al viernes. Acciones a seguir: el terapeuta revisará las cartas de presentación el lunes. Observaciones relevantes: Estado de ánimo eutímico, gran motivación y adherencia al programa.',
  },
  {
    titulo: 'Caso 3: Urgencia Emocional',
    transcripcion: 'Objetivo: Intervención en crisis por ideación autolítica leve. Desarrollo: El paciente llega muy descompensado emocionalmente llorando debido a una ruptura amorosa reciente. Dice no verle sentido a continuar pero niega planes estructurados de hacerse daño. Se aplican técnicas de anclaje a la realidad y control de crisis. Acuerdos: Paciente firma compromiso de no autolesionarse y llamar a emergencias o al terapeuta si la crisis escala. Acciones a seguir: Monitoreo telefónico en 24 horas y derivación inmediata a psiquiatría. Observaciones: Urgencia psicológica severa. Requiere supervisión constante de sus tutores.',
  }
];
