import { NextRequest, NextResponse } from 'next/server';
import { OpenAI, toFile } from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La API key de OpenAI no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Parsear el FormData
    const formData = await req.formData();
    const audioBlob = formData.get('audioBlob') as File | null;

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No se recibió el archivo de audio (audioBlob).' },
        { status: 400 }
      );
    }

    // Paso A: Transcribir el audio usando whisper-1
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    // Convertir el buffer en un archivo compatible con el SDK de OpenAI
    const file = await toFile(buffer, 'audio.webm', { type: 'audio/webm' });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    const transcriptionText = transcription.text;

    if (!transcriptionText || transcriptionText.trim() === '') {
      return NextResponse.json(
        { error: 'No se pudo obtener texto de la transcripción del audio.' },
        { status: 422 }
      );
    }

    // Paso B: Enviar transcripción a gpt-4o-mini con System Prompt estricto y formato JSON
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Actúa como un asistente clínico experto. Tu tarea es estructurar la transcripción de una sesión de intervención terapéutica/clínica.
Debes devolver un objeto JSON estructurado exclusivamente con estos 5 campos exactos:
- objetivo: El objetivo de la sesión/intervención.
- desarrollo: El desarrollo de lo ocurrido durante la sesión.
- acuerdos: Los acuerdos o compromisos a los que se llegó.
- acciones: Las acciones a seguir o tareas pendientes.
- observaciones: Las observaciones relevantes del terapeuta o notas de alerta.

Reglas estrictas:
1. Responde únicamente con un objeto JSON válido con las claves: "objetivo", "desarrollo", "acuerdos", "acciones", "observaciones".
2. No agregues ningún otro campo ni texto fuera de las llaves JSON.
3. El contenido de cada campo debe estar redactado en español con un tono formal, profesional y clínico.`,
        },
        {
          role: 'user',
          content: `Estructura esta transcripción clínica:\n\n${transcriptionText}`,
        },
      ],
    });

    const gptResponseText = chatCompletion.choices[0]?.message?.content;
    if (!gptResponseText) {
      throw new Error('El modelo de OpenAI no devolvió ninguna respuesta.');
    }

    // Paso C: Devolver ese JSON y la transcripción al frontend
    const structuredData = JSON.parse(gptResponseText);

    return NextResponse.json({
      transcription: transcriptionText,
      structuredData: structuredData,
    });
  } catch (error: any) {
    console.error('Error al procesar audio con OpenAI:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error al procesar el audio con la IA.' },
      { status: 500 }
    );
  }
}
