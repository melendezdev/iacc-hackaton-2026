'use client';

import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Mic, Square, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { guardarIntervencionOffline } from '@/lib/indexedDb';
import { StructuredIntervention } from '@/lib/transcription';

interface VoiceRecorderProps {
  onProcessingStart: () => void;
  onProcessingComplete: (result: StructuredIntervention, audioBlob: Blob | null, transcriptionText: string) => void;
  onProcessingError: (error: string) => void;
}

export function VoiceRecorder({
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
}: VoiceRecorderProps) {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecorder,
    error: recorderError,
  } = useAudioRecorder();

  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<string | null>(null);

  // 1. Detectar conectividad en tiempo real
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Control de errores del micrófono
  useEffect(() => {
    if (recorderError) {
      onProcessingError(recorderError);
    }
  }, [recorderError, onProcessingError]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Procesar el audio grabado (Online/Offline)
  const handleProcessRecording = async () => {
    if (!audioBlob) return;

    onProcessingStart();
    setIsProcessing(true);
    setOfflineStatus(null);

    try {
      // Simular latencia de procesamiento de la IA (Whisper)
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const transcriptor = await import('@/lib/transcription');
      const mockDictation = 
        "Objetivo: Evaluar el estado emocional y la adherencia al tratamiento. " +
        "Desarrollo: El paciente asistió a la sesión de forma puntual. Refiere haber experimentado ansiedad leve durante " +
        "el fin de semana, pero aplicó las técnicas de control de impulsos ensayadas. " +
        "Acuerdos: El paciente se compromete a escribir un diario de emociones de 3 líneas al día. " +
        "Acciones a seguir: Continuar monitoreo en la sesión grupal del jueves y ajustar medicación si persiste insomnio. " +
        "Observaciones: Se observa comprometido y con buena red de apoyo familiar.";

      const result = transcriptor.estructurarTexto(mockDictation);

      if (!isOnline) {
        // Lógica Offline-First: Si no hay internet, se guarda en IndexedDB de forma local
        const offlineRecord = {
          id: crypto.randomUUID(),
          terapeutaId: 'terapeuta-1', // Por defecto para la demo
          pacienteId: 'paciente-1',   // Por defecto para la demo
          fechaIntervencion: new Date().toISOString(),
          objetivo: result.objetivo,
          desarrollo: result.desarrollo,
          acuerdos: result.acuerdos,
          accionesSeguir: result.accionesSeguir,
          observaciones: result.observaciones,
          validadoPorTerapeuta: false, // Debe validarlo el terapeuta
          estadoSincronizacion: 'offline' as const,
          fechaCreacion: new Date().toISOString(),
          audioBlob: audioBlob, // Guardamos el blob de audio real
        };

        await guardarIntervencionOffline(offlineRecord);
        setOfflineStatus('💾 Sin conexión: Grabación y estructuración guardadas localmente en el móvil.');
        
        // Enviamos el resultado al formulario para revisión del terapeuta
        onProcessingComplete(result, audioBlob, 'Dictado offline guardado');
      } else {
        // En línea: Enviamos el resultado para su posterior guardado en la base de datos remota
        onProcessingComplete(result, audioBlob, 'Transcripción estructurada por IA');
      }
    } catch (err: any) {
      console.error(err);
      onProcessingError(err.message || 'Error al procesar el audio dictado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-border bg-card p-6 shadow-xl text-card-foreground text-center relative overflow-hidden">
      
      {/* Indicador de Estado de Red */}
      <div className="flex justify-end mb-4">
        {isOnline ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <Wifi className="w-3 h-3" /> En línea
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <WifiOff className="w-3 h-3" /> Sin internet
          </span>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">Registro de Intervención por Voz</h2>
        <p className="text-xs text-muted-foreground mt-1 px-4">
          Presiona el botón gigante para comenzar a dictar. Diseñado para uso rápido con una sola mano.
        </p>
      </div>

      {/* Contenedor del Botón de Grabación Gigante */}
      <div className="flex flex-col items-center justify-center py-6 gap-4">
        {isRecording ? (
          <div className="flex flex-col items-center gap-4">
            {/* Animación de ondas de grabación */}
            <div className="flex gap-1 items-end h-8">
              <span className="w-1.5 bg-destructive rounded-full animate-bounce h-4 delay-75"></span>
              <span className="w-1.5 bg-destructive rounded-full animate-bounce h-8 delay-150"></span>
              <span className="w-1.5 bg-destructive rounded-full animate-bounce h-6 delay-100"></span>
              <span className="w-1.5 bg-destructive rounded-full animate-bounce h-4"></span>
            </div>

            <span className="text-3xl font-mono font-bold tracking-wider text-foreground">
              {formatTime(recordingTime)}
            </span>

            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-28 h-28 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] border-4 border-background cursor-pointer active:scale-95"
              title="Detener grabación"
            >
              <Square className="w-10 h-10 fill-current" />
            </button>
            <p className="text-xs font-semibold text-destructive animate-pulse">
              Grabando audio... presiona para detener.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {audioUrl ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  ✓ Audio listo para procesar
                </div>
                <audio src={audioUrl} controls className="w-full max-w-xs rounded-xl" />

                <div className="flex gap-3 w-full max-w-xs mt-2">
                  <Button
                    variant="outline"
                    onClick={resetRecorder}
                    className="flex-1 rounded-xl cursor-pointer"
                  >
                    Descartar
                  </Button>
                  <Button
                    onClick={handleProcessRecording}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    {isProcessing ? 'Procesando...' : 'Estructurar ⚡'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white transition-all shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 border-4 border-background cursor-pointer"
                  title="Grabar intervención"
                >
                  <Mic className="w-12 h-12" />
                </button>
                <p className="text-sm font-bold text-foreground">Presiona el botón para iniciar</p>
                <span className="text-[11px] text-muted-foreground max-w-[240px]">
                  El audio se transcribirá e identificará automáticamente los 5 campos terapéuticos requeridos.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estado del modo sin conexión */}
      {offlineStatus && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left text-xs font-bold text-amber-700 dark:text-amber-400">
          {offlineStatus}
        </div>
      )}

      {/* Pantalla de Carga de Procesamiento por IA */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-20 animate-fade-in">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <h3 className="mt-4 text-sm font-bold text-foreground">Procesamiento Inteligente Activo</h3>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[250px]">
            Estructurando narrativa clínica en campos obligatorios...
          </p>
        </div>
      )}
    </div>
  );
}
