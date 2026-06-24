'use client';

import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { ESCENARIOS_DEMO, StructuredIntervention } from '@/lib/transcription';

interface AudioCaptureProps {
  onProcessingStart: () => void;
  onProcessingComplete: (result: StructuredIntervention, audioBlob: Blob | null, dictationText: string) => void;
  onProcessingError: (error: string) => void;
}

export function AudioCapture({
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
}: AudioCaptureProps) {
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

  const [keyboardMode, setKeyboardMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<number | ''>('');

  // Sincronizar errores del grabador de audio
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

  const handleStartRecording = async () => {
    setSelectedDemo('');
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  // Simular el envío al backend/API de IA
  const handleProcessTranscription = async (blob: Blob | null, textContent?: string) => {
    onProcessingStart();
    setIsProcessing(true);
    try {
      const { procesarAudioAIntervencion } = await import('@/lib/transcription');
      // Procesa el audio o el texto alternativo
      const result = await procesarAudioAIntervencion(blob || 'audio', textContent);
      onProcessingComplete(result, blob, textContent || 'Grabación de audio dictada');
    } catch (err: any) {
      console.error(err);
      onProcessingError(err.message || 'Error al procesar el audio por IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ejecutar procesamiento al tener un audio listo
  const handleSendAudio = () => {
    if (audioBlob) {
      handleProcessTranscription(audioBlob);
    }
  };

  // Ejecutar procesamiento con texto manual
  const handleSendManualText = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      handleProcessTranscription(null, manualText.trim());
    }
  };

  // Cargar un escenario demo para evaluación de Hackathon
  const handleSelectDemo = (index: number) => {
    setSelectedDemo(index);
    const demo = ESCENARIOS_DEMO[index];
    setKeyboardMode(true);
    setManualText(demo.transcripcion);
  };

  return (
    <div className="w-full rounded-3xl border border-zinc-200/50 bg-white/70 p-6 shadow-xl backdrop-blur-md transition-all dark:border-zinc-800/50 dark:bg-zinc-950/70">
      
      {/* Selector de Demos - CRITICAL PARA HACKATHONS */}
      <div className="mb-6 flex flex-col gap-2 rounded-2xl bg-teal-500/10 p-4 border border-teal-500/20">
        <label className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
          💡 Modo Demostración (Hackathon 72h)
        </label>
        <p className="text-xs text-teal-800/80 dark:text-teal-300/80">
          Usa dictados pre-cargados para probar al instante cómo la IA estructura el texto en los 5 campos clínicos y detecta alertas críticas.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mt-1">
          {ESCENARIOS_DEMO.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDemo(idx)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-medium border transition-all cursor-pointer ${
                selectedDemo === idx
                  ? 'bg-teal-600 border-teal-700 text-white shadow-md'
                  : 'bg-white/80 border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
              }`}
            >
              {demo.titulo}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-zinc-200/50 pb-4 mb-6 dark:border-zinc-800/50">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {keyboardMode ? 'Dictado por Teclado' : 'Dictado por Voz'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {keyboardMode 
              ? 'Escribe o edita el resumen de la intervención.' 
              : 'Presiona el botón para grabar lo ocurrido con el paciente.'}
          </p>
        </div>
        <button
          onClick={() => {
            setKeyboardMode(!keyboardMode);
            resetRecorder();
            setSelectedDemo('');
          }}
          className="rounded-xl bg-zinc-100 px-3  py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
        >
          {keyboardMode ? '🎙️ Usar Voz' : '⌨️ Usar Teclado'}
        </button>
      </div>

      {!keyboardMode ? (
        // MODO AUDIO RECORDER
        <div className="flex flex-col items-center justify-center py-6">
          {isRecording ? (
            /* Animación de Ondas y Estado Grabando */
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-1.5 h-10">
                <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce delay-200"></span>
                <span className="w-1.5 h-10 bg-red-500 rounded-full animate-bounce delay-300"></span>
                <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
                {formatTime(recordingTime)}
              </span>
              <button
                onClick={handleStopRecording}
                className="flex items-center justify-center w-20 h-20 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] cursor-pointer"
                title="Detener Grabación"
              >
                <div className="w-8 h-8 bg-white rounded-lg"></div>
              </button>
              <p className="text-xs text-red-500 font-semibold animate-pulse mt-2">
                Escuchando y grabando... dictado continuo activo.
              </p>
            </div>
          ) : (
            /* Botón Grabar Inactivo */
            <div className="flex flex-col items-center gap-4">
              {audioUrl ? (
                /* Reproductor de Audio si ya hay grabación */
                <div className="w-full flex flex-col items-center gap-4 px-4">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full border border-emerald-500/20">
                    ✓ Audio grabado con éxito
                  </div>
                  <audio src={audioUrl} controls className="w-full max-w-sm rounded-lg" />
                  
                  <div className="flex gap-3 w-full max-w-sm mt-2">
                    <button
                      onClick={resetRecorder}
                      className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleSendAudio}
                      disabled={isProcessing}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? 'Procesando...' : 'Estructurar con IA ⚡'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Botón Grabar Principal */
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-full transition-all hover:scale-105 shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] border border-emerald-400/20 cursor-pointer"
                    title="Iniciar Grabación"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-10 h-10"
                    >
                      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                      <path d="M19.5 12a.75.75 0 0 0-1.5 0 6 6 0 0 1-12 0 .75.75 0 0 0-1.5 0 7.5 7.5 0 0 0 6.75 7.451v2.799a.75.75 0 0 0 1.5 0v-2.799A7.5 7.5 0 0 0 19.5 12Z" />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    Presiona para dictar audio
                  </p>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-xs">
                    Recomendado para uso en pasillos o traslado rápido de pacientes.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // MODO TECLADO (FALLBACK Y DEMOS)
        <form onSubmit={handleSendManualText} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Resumen de la sesión
            </label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Describe lo ocurrido en tus propias palabras. Ejemplo: Objetivo de hoy... Sesión enfocada en... Llegamos al acuerdo de..."
              rows={6}
              className="w-full rounded-2xl border border-zinc-200 bg-white/50 p-4 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-teal-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setManualText('');
                setSelectedDemo('');
              }}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={isProcessing || !manualText.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? 'Procesando...' : 'Estructurar con IA ⚡'}
            </button>
          </div>
        </form>
      )}

      {/* Indicador de carga de IA */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/90 rounded-3xl z-10 animate-fade-in">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute w-8 h-8 bg-emerald-500 rounded-full animate-ping opacity-25"></div>
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-800 dark:text-zinc-200">
            Inteligencia Artificial Procesando
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs text-center px-4">
            Extrayendo objetivo, desarrollo, acuerdos, acciones y observaciones en formato clínico estructurado...
          </p>
        </div>
      )}
    </div>
  );
}
