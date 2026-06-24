'use client';

import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Mic, Square, Wifi, WifiOff, Loader2, Keyboard } from 'lucide-react';
import { guardarIntervencionOffline } from '@/lib/indexedDb';
import { StructuredIntervention } from '@/lib/transcription';
import { toast } from 'sonner';

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

  // Estados de interfaz
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [manualText, setManualText] = useState('');
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
        // Lógica Offline-First
        const offlineRecord = {
          id: crypto.randomUUID(),
          terapeutaId: 'terapeuta-1',
          pacienteId: 'paciente-1',
          fechaIntervencion: new Date().toISOString(),
          objetivo: result.objetivo,
          desarrollo: result.desarrollo,
          acuerdos: result.acuerdos,
          accionesSeguir: result.accionesSeguir,
          observaciones: result.observaciones,
          validadoPorTerapeuta: false,
          estadoSincronizacion: 'offline' as const,
          fechaCreacion: new Date().toISOString(),
          audioBlob: audioBlob,
        };

        await guardarIntervencionOffline(offlineRecord);
        setOfflineStatus('💾 Sin conexión: Grabación y estructuración guardadas localmente en el móvil.');
      }
      onProcessingComplete(result, audioBlob, 'Dictado de voz estructurado');
    } catch (err: any) {
      console.error(err);
      onProcessingError(err.message || 'Error al procesar el audio dictado.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Procesar el texto manual ingresado libremente (IA estructura)
  const handleProcessManualText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    onProcessingStart();
    setIsProcessing(true);
    setOfflineStatus(null);

    try {
      // Simular latencia de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const transcriptor = await import('@/lib/transcription');
      const result = transcriptor.estructurarTexto(manualText);

      if (!isOnline) {
        const offlineRecord = {
          id: crypto.randomUUID(),
          terapeutaId: 'terapeuta-1',
          pacienteId: 'paciente-1',
          fechaIntervencion: new Date().toISOString(),
          objetivo: result.objetivo,
          desarrollo: result.desarrollo,
          acuerdos: result.acuerdos,
          accionesSeguir: result.accionesSeguir,
          observaciones: result.observaciones,
          validadoPorTerapeuta: false,
          estadoSincronizacion: 'offline' as const,
          fechaCreacion: new Date().toISOString(),
        };

        await guardarIntervencionOffline(offlineRecord);
        setOfflineStatus('💾 Sin conexión: Texto libre guardado y estructurado localmente en IndexedDB.');
      }
      onProcessingComplete(result, null, manualText);
    } catch (err: any) {
      console.error(err);
      onProcessingError(err.message || 'Error al estructurar el texto manual.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Crear reporte vacío en blanco directamente (Bypasseando IA)
  const handleCreateBlankReport = () => {
    toast.success('Formulario en blanco abierto', {
      description: 'Digita los 5 campos obligatorios por teclado.',
    });

    onProcessingComplete({
      objetivo: '',
      desarrollo: '',
      acuerdos: '',
      accionesSeguir: '',
      observaciones: ''
    }, null, 'Registro directo manual por teclado');
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-border bg-card p-6 shadow-xl text-card-foreground relative overflow-hidden">
      
      {/* Barra de Estado superior */}
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        {/* Toggle Usar Voz / Usar Teclado */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setKeyboardMode(!keyboardMode);
            resetRecorder();
            setManualText('');
          }}
          className="rounded-xl h-8 text-[11px] font-extrabold cursor-pointer border border-border bg-background"
        >
          {keyboardMode ? '🎙️ Usar Micrófono' : '⌨️ Usar Teclado'}
        </Button>

        {isOnline ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <Wifi className="w-3 h-3" /> En línea
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <WifiOff className="w-3 h-3" /> Sin internet
          </span>
        )}
      </div>

      {/* VISTA 1: REGISTRO POR VOZ */}
      {!keyboardMode && (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Registro por Voz</h2>
            <p className="text-xs text-muted-foreground mt-1 px-4">
              Presiona el botón gigante para comenzar a dictar. Diseñado para uso rápido con una sola mano.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
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
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
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
                    <span className="text-[11px] text-muted-foreground max-w-[240px] text-center">
                      El audio se transcribirá e identificará automáticamente los 5 campos terapéuticos requeridos.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* VISTA 2: REGISTRO POR TECLADO (TEXTO LIBRE) */}
      {keyboardMode && (
        <form onSubmit={handleProcessManualText} className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">Registro por Teclado</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Escribe lo ocurrido libremente. La IA clasificará el texto en los 5 campos clínicos requeridos.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-left mt-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Narrativa de la Sesión (Texto Libre)
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Ejemplo: El objetivo fue la reinserción social. Durante el desarrollo el paciente se mostró motivado en postular a ofertas. Conversamos y el acuerdo es asistir al taller el martes. Acciones: contactar al tallerista. Observaciones: se observa motivado y sin signos de riesgo."
              rows={6}
              className="w-full rounded-2xl border border-input bg-background/50 p-4 text-sm outline-none transition-all focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setManualText('')}
              className="rounded-xl cursor-pointer"
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !manualText.trim()}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
            >
              {isProcessing ? 'Procesando...' : 'Estructurar con IA ⚡'}
            </Button>
          </div>
        </form>
      )}

      {/* BOTÓN COMÚN: CREAR EN BLANCO DIRECTO (Bypasseando IA) */}
      {!isRecording && !audioUrl && (
        <div className="mt-4 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={handleCreateBlankReport}
            className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <Keyboard className="w-4 h-4" /> Escribir reporte en blanco (Sin IA)
          </button>
        </div>
      )}

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
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[250px] text-center px-4">
            Estructurando narrativa clínica en campos obligatorios...
          </p>
        </div>
      )}
    </div>
  );
}
export default VoiceRecorder;
