'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AudioCapture } from '@/components/AudioCapture';
import { ValidationForm } from '@/components/ValidationForm';
import { StructuredIntervention } from '@/lib/transcription';
import { Button } from '@/components/ui/button';
import {
  OfflineIntervention,
  obtenerIntervencionesOffline,
  eliminarIntervencionOffline,
  cachearCatalogo,
  obtenerCatalogoCacheado,
} from '@/lib/indexedDb';
import {
  obtenerPacientes,
  obtenerTerapeutas,
  obtenerIntervenciones,
  sincronizarIntervencionesLote,
} from '@/app/actions';

export default function AppHome() {
  // Conectividad
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Datos del Formulario
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [prefilledData, setPrefilledData] = useState<StructuredIntervention | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [dictationText, setDictationText] = useState('');

  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [showValidationForm, setShowValidationForm] = useState(false);

  // Lista de intervenciones mostradas (historial)
  const [interventionsList, setInterventionsList] = useState<any[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // 1. Monitoreo de Red
  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Inicializar catálogos y datos
  const loadCatalogsAndHistory = useCallback(async (networkOfflineState: boolean) => {
    setLoading(true);
    try {
      if (!networkOfflineState) {
        // En línea: Cargar desde BD Remota y guardar en cache local
        const [pacientesData, terapeutasData, intervencionesDb] = await Promise.all([
          obtenerPacientes(),
          obtenerTerapeutas(),
          obtenerIntervenciones(),
        ]);

        setPatients(pacientesData);
        setTherapists(terapeutasData);

        // Cachear en IndexedDB para disponibilidad sin conexión
        await cachearCatalogo('pacientes', pacientesData);
        await cachearCatalogo('usuarios', terapeutasData);

        // Combinar con registros locales pendientes de sincronizar
        const locales = await obtenerIntervencionesOffline();
        setPendingSyncCount(locales.length);
        
        // Mapear los locales para que tengan nombres legibles
        const localesMapeados = locales.map(loc => ({
          ...loc,
          pacienteNombre: pacientesData.find(p => p.id === loc.pacienteId)?.nombre || 'Paciente Desconocido',
          terapeutaNombre: terapeutasData.find(t => t.id === loc.terapeutaId)?.nombre || 'Terapeuta Desconocido',
        }));

        setInterventionsList([...localesMapeados, ...intervencionesDb]);
      } else {
        // Sin conexión: Cargar desde cache local IndexedDB
        const [pacientesCache, terapeutasCache, locales] = await Promise.all([
          obtenerCatalogoCacheado('pacientes'),
          obtenerCatalogoCacheado('usuarios'),
          obtenerIntervencionesOffline(),
        ]);

        setPatients(pacientesCache);
        setTherapists(terapeutasCache);
        setPendingSyncCount(locales.length);

        const localesMapeados = locales.map(loc => ({
          ...loc,
          pacienteNombre: pacientesCache.find(p => p.id === loc.pacienteId)?.nombre || 'Paciente Local',
          terapeutaNombre: terapeutasCache.find(t => t.id === loc.terapeutaId)?.nombre || 'Terapeuta Local',
        }));

        setInterventionsList(localesMapeados);
      }
    } catch (error) {
      console.error('Error cargando catálogos/historial:', error);
      setStatusMessage('Error al cargar datos. Usando catálogo local.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Recargar al cambiar estado offline
  useEffect(() => {
    loadCatalogsAndHistory(isOffline);
  }, [isOffline, loadCatalogsAndHistory]);

  // 3. Flujo de Sincronización Automática (IndexedDB -> Turso)
  const triggerSync = async () => {
    if (navigator.onLine) {
      const locales = await obtenerIntervencionesOffline();
      if (locales.length > 0) {
        setSyncing(true);
        setStatusMessage(`Sincronizando ${locales.length} intervenciones guardadas offline...`);

        try {
          const res = await sincronizarIntervencionesLote(locales);
          if (res.success) {
            // Eliminar registros de IndexedDB que ya fueron sincronizados
            for (const item of locales) {
              await eliminarIntervencionOffline(item.id);
            }
            setStatusMessage('✓ Sincronización completada exitosamente.');
            setPendingSyncCount(0);
            
            // Recargar datos actualizados
            const intervencionesDb = await obtenerIntervenciones();
            const localesRestantes = await obtenerIntervencionesOffline();
            setInterventionsList([...localesRestantes, ...intervencionesDb]);
          } else {
            throw new Error(res.error);
          }
        } catch (error: any) {
          console.error('Fallo en sincronización:', error);
          setStatusMessage('⚠️ Sincronización fallida. Se reintentará al recuperar conexión estable.');
        } finally {
          setSyncing(false);
          setTimeout(() => setStatusMessage(''), 4000);
        }
      }
    }
  };

  // Ejecutar sincronización en carga inicial si está online
  useEffect(() => {
    if (!isOffline) {
      triggerSync();
    }
  }, [isOffline]);

  // Manejadores de captura
  const handleProcessingStart = () => {
    setStatusMessage('Procesando audio...');
  };

  const handleProcessingComplete = (
    result: StructuredIntervention,
    blob: Blob | null,
    text: string
  ) => {
    setPrefilledData(result);
    setAudioBlob(blob);
    setDictationText(text);
    setShowValidationForm(true);
    setStatusMessage('');
  };

  const handleProcessingError = (error: string) => {
    setStatusMessage(`Error: ${error}`);
  };

  const handleSaveComplete = (savedRecord: any, isOfflineSaved: boolean) => {
    setShowValidationForm(false);
    setPrefilledData(null);
    setAudioBlob(null);
    
    if (isOfflineSaved) {
      setStatusMessage('✓ Intervención guardada LOCALMENTE. Se subirá automáticamente al recuperar internet.');
    } else {
      setStatusMessage('✓ Intervención guardada y sincronizada en la NUBE con éxito.');
    }

    // Recargar historial
    loadCatalogsAndHistory(isOffline);

    // Cerrar el mensaje de éxito en unos segundos
    setTimeout(() => {
      setStatusMessage('');
    }, 5000);
  };

  return (
    <div className="flex-1 bg-background text-foreground transition-colors duration-200">
      
      {/* Header Corporativo Talita Kum */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 py-4 px-6 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black shadow-md">
              TK
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight">
                Talita Kum
              </h1>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Centro de Rehabilitación
              </p>
            </div>
          </div>

          {/* Badge de Red y Sincronización */}
          <div className="flex items-center gap-2">
            {syncing && (
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse mr-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                Sincronizando...
              </div>
            )}
            
            {pendingSyncCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white animate-bounce">
                {pendingSyncCount} offline
              </span>
            )}

            {isOffline ? (
              <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive border border-destructive/20">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                Modo Offline
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                En Línea
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 flex flex-col gap-8">
        
        {/* Banner de Estado / Notificaciones */}
        {statusMessage && (
          <div className="rounded-2xl bg-card border border-border text-card-foreground px-5 py-3 text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
            <span>{statusMessage}</span>
            <button 
              onClick={() => setStatusMessage('')} 
              className="text-muted-foreground hover:text-foreground cursor-pointer font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Flujo Principal */}
        <section className="flex flex-col gap-6">
          {showValidationForm && prefilledData ? (
            <ValidationForm
              prefilledData={prefilledData}
              patients={patients}
              therapists={therapists}
              audioBlob={audioBlob}
              isOffline={isOffline}
              onSaveComplete={handleSaveComplete}
              onCancel={() => {
                setShowValidationForm(false);
                setPrefilledData(null);
                setAudioBlob(null);
              }}
            />
          ) : (
            <AudioCapture
              onProcessingStart={handleProcessingStart}
              onProcessingComplete={handleProcessingComplete}
              onProcessingError={handleProcessingError}
            />
          )}
        </section>

        {/* Historial de Intervenciones */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-md font-extrabold text-foreground">
              Historial de Intervenciones Terapéuticas
            </h3>
            <span className="text-xs text-muted-foreground">
              {interventionsList.length} registro(s) total(es)
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="text-xs">Cargando registros...</span>
            </div>
          ) : interventionsList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="text-sm font-semibold">No hay intervenciones registradas aún.</p>
              <p className="text-xs mt-1">Dicta tu primer registro usando el micrófono arriba.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {interventionsList.map((item: any) => {
                const isItemOffline = item.estadoSincronizacion === 'offline';
                const fecha = new Date(item.fechaIntervencion).toLocaleString('es-CL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                // Detectar si tiene alertas críticas para estilizar la tarjeta
                const tieneAlerta = 
                  `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('recaída') || 
                  `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('crisis') || 
                  `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('urgencia');

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md text-card-foreground ${
                      tieneAlerta 
                        ? 'border-destructive/30 bg-destructive/[0.02]' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block sm:inline mr-2">
                          👤 Paciente: <strong className="text-foreground">{item.pacienteNombre}</strong>
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground block sm:inline">
                          👨‍⚕️ Terapeuta: <strong className="text-foreground">{item.terapeutaNombre}</strong>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {fecha}
                        </span>
                        {isItemOffline ? (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Local (Offline)
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Nube
                          </span>
                        )}
                        {tieneAlerta && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-extrabold text-destructive border border-destructive/20 animate-pulse">
                            Alerta
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Resumen clínico colapsable o estructurado */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 pt-3 border-t border-border">
                      <div className="md:col-span-1">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Objetivo</h4>
                        <p className="text-xs mt-0.5 text-foreground font-medium">{item.objetivo}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Desarrollo</h4>
                        <p className="text-xs mt-0.5 text-foreground line-clamp-3">{item.desarrollo}</p>
                      </div>
                      <div className="md:col-span-1">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Acuerdos e Hitos</h4>
                        <p className="text-xs mt-0.5 text-foreground">{item.acuerdos}</p>
                      </div>
                      <div className="md:col-span-1">
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Observaciones</h4>
                        <p className="text-xs mt-0.5 text-foreground">{item.observaciones}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                      <span>Id: {item.id}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.validadoPorTerapeuta ? '🛡️ Validado por terapeuta' : '⚠️ Pendiente de validación'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
