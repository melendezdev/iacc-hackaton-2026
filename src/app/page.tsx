'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ValidationForm } from '@/components/ValidationForm';
import { Login } from '@/components/Login';

export interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: 'terapeuta' | 'admin';
}
import { Dashboard } from '@/components/Dashboard';
import { StructuredIntervention } from '@/lib/transcription';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, LogOut, LayoutDashboard, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import {
  obtenerPacientes,
  obtenerTerapeutas,
  obtenerIntervenciones,
  sincronizarIntervencionesLote,
} from '@/app/actions';
import {
  obtenerIntervencionesOffline,
  eliminarIntervencionOffline,
  cachearCatalogo,
  obtenerCatalogoCacheado,
} from '@/lib/indexedDb';

export default function AppHome() {
  // Estado de Autenticación
  const [user, setUser] = useState<LoggedInUser | null>(null);

  // Estado de flujo de vistas
  const [currentView, setCurrentView] = useState<'record' | 'validate' | 'dashboard'>('record');

  // Datos de trabajo
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [prefilledData, setPrefilledData] = useState<StructuredIntervention | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Conectividad y Sincronización
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Historial e interfaz
  const [interventionsList, setInterventionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // 1. Monitoreo de Conectividad a Internet
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

  // 2. Cargar catálogos e historial médico
  const loadCatalogsAndHistory = useCallback(async (networkOfflineState: boolean) => {
    setLoading(true);
    try {
      if (!networkOfflineState) {
        const [pacientesData, terapeutasData, intervencionesDb] = await Promise.all([
          obtenerPacientes(),
          obtenerTerapeutas(),
          obtenerIntervenciones(),
        ]);

        setPatients(pacientesData);
        setTherapists(terapeutasData);

        await cachearCatalogo('pacientes', pacientesData);
        await cachearCatalogo('usuarios', terapeutasData);

        const locales = await obtenerIntervencionesOffline();
        setPendingSyncCount(locales.length);

        const localesMapeados = locales.map((loc) => ({
          ...loc,
          pacienteNombre: pacientesData.find((p) => p.id === loc.pacienteId)?.nombre || 'Paciente Desconocido',
          terapeutaNombre: terapeutasData.find((t) => t.id === loc.terapeutaId)?.name || 'Terapeuta Desconocido',
        }));

        setInterventionsList([...localesMapeados, ...intervencionesDb]);
      } else {
        const [pacientesCache, terapeutasCache, locales] = await Promise.all([
          obtenerCatalogoCacheado('pacientes'),
          obtenerCatalogoCacheado('usuarios'),
          obtenerIntervencionesOffline(),
        ]);

        setPatients(pacientesCache);
        setTherapists(terapeutasCache);
        setPendingSyncCount(locales.length);

        const localesMapeados = locales.map((loc) => ({
          ...loc,
          pacienteNombre: pacientesCache.find((p) => p.id === loc.pacienteId)?.nombre || 'Paciente Local',
          terapeutaNombre: terapeutasCache.find((t) => t.id === loc.terapeutaId)?.name || 'Terapeuta Local',
        }));

        setInterventionsList(localesMapeados);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      setStatusMessage('Usando datos locales almacenados de contingencia.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogsAndHistory(isOffline);
  }, [isOffline, loadCatalogsAndHistory]);

  // 3. Sincronización automática de registros IndexedDB
  const triggerSync = async () => {
    if (navigator.onLine) {
      const locales = await obtenerIntervencionesOffline();
      if (locales.length > 0) {
        setSyncing(true);
        setStatusMessage(`Sincronizando ${locales.length} registros offline...`);

        try {
          const res = await sincronizarIntervencionesLote(locales);
          if (res.success) {
            for (const item of locales) {
              await eliminarIntervencionOffline(item.id);
            }
            setStatusMessage('✓ Datos sincronizados exitosamente.');
            setPendingSyncCount(0);

            const intervencionesDb = await obtenerIntervenciones();
            const localesRestantes = await obtenerIntervencionesOffline();
            setInterventionsList([...localesRestantes, ...intervencionesDb]);
          } else {
            throw new Error(res.error);
          }
        } catch (error: any) {
          console.error('Fallo en sincronización:', error);
          setStatusMessage('⚠️ Sincronización suspendida en segundo plano.');
        } finally {
          setSyncing(false);
          setTimeout(() => setStatusMessage(''), 4000);
        }
      }
    }
  };

  useEffect(() => {
    if (!isOffline) {
      triggerSync();
    }
  }, [isOffline]);

  // 4. Captura de grabaciones
  const handleProcessingStart = () => {
    setStatusMessage('IA transcribiendo y estructurando audio...');
  };

  const handleProcessingComplete = (
    result: StructuredIntervention,
    blob: Blob | null,
    transcriptionText: string
  ) => {
    setPrefilledData(result);
    setAudioBlob(blob);
    setCurrentView('validate');
    setStatusMessage('');
  };

  const handleProcessingError = (error: string) => {
    setStatusMessage(`Error: ${error}`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  // 5. Finalizar validación y guardar
  const handleSaveComplete = (savedRecord: any, isOfflineSaved: boolean) => {
    setShowSuccessOverlay(true);
    
    if (isOfflineSaved) {
      setStatusMessage('✓ Guardado en IndexedDB. Se subirá automáticamente al recuperar internet.');
    } else {
      setStatusMessage('✓ Registro clínico subido a la base de datos Turso.');
    }

    loadCatalogsAndHistory(isOffline);

    setTimeout(() => {
      setShowSuccessOverlay(false);
      setPrefilledData(null);
      setAudioBlob(null);
      setCurrentView('record');
      setStatusMessage('');
    }, 2200);
  };

  // Cierre de sesión
  const handleLogout = async () => {
    await authClient.signOut();
    setUser(null);
    setCurrentView('record');
    setPrefilledData(null);
    setAudioBlob(null);
  };

  // Si no está logueado, mostrar la pantalla de Login
  if (!user) {
    return (
      <div className="flex-1 bg-background text-foreground flex items-center justify-center min-h-screen px-4">
        <Login onLoginSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col min-h-screen transition-colors duration-200">
      
      {/* Header Corporativo Móvil */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 py-4 px-6 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-md">
              TK
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight">Talita Kum</h1>
              <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                {user.role === 'admin' ? 'Administración' : 'Terapeuta'}
              </p>
            </div>
          </div>

          {/* Menú de herramientas y logout */}
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <>
                {currentView === 'dashboard' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('record')}
                    className="p-2 h-8 rounded-xl cursor-pointer hover:bg-muted text-xs"
                    title="Ir a Grabación"
                  >
                    <Mic className="w-4 h-4 mr-1" /> Dictar
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('dashboard')}
                    className="p-2 h-8 rounded-xl cursor-pointer hover:bg-muted text-xs text-indigo-600 dark:text-indigo-400 font-bold"
                    title="Ir a Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" /> KPIs
                  </Button>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Perfil de Usuario Logueado (Mini banner) */}
        <div className="flex justify-between items-center text-[10px] text-muted-foreground bg-muted/30 border border-border p-2.5 rounded-xl">
          <span>Identificado como: <strong>{user.name}</strong></span>
          <span className="flex items-center gap-1">
            {isOffline ? (
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
            {isOffline ? 'Modo Local' : 'Nube Conectada'}
          </span>
        </div>

        {/* Banner de Estado */}
        {statusMessage && (
          <div className="rounded-xl bg-card border border-border p-3 text-xs font-semibold shadow-md flex items-center justify-between">
            <span>{statusMessage}</span>
            <button 
              onClick={() => setStatusMessage('')} 
              className="text-muted-foreground hover:text-foreground text-[10px] uppercase font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* CONTENEDOR DE TRANSICIÓN DE FLUJO */}
        <div className="relative flex-1 flex flex-col items-center justify-center">
          
          {currentView === 'record' && (
            /* PASO 1: GRABADOR DE VOZ (TERAPEUTA & ADMIN) */
            <div className="w-full flex flex-col items-center gap-6 py-4 animate-in fade-in duration-300">
              <VoiceRecorder
                onProcessingStart={handleProcessingStart}
                onProcessingComplete={handleProcessingComplete}
                onProcessingError={handleProcessingError}
              />
            </div>
          )}

          {currentView === 'validate' && prefilledData && (
            /* PASO 2: FORMULARIO DE VALIDACIÓN (REGLA DE ORO) */
            <div className="w-full animate-in fade-in duration-300">
              <ValidationForm
                prefilledData={prefilledData}
                patients={patients}
                therapists={therapists}
                audioBlob={audioBlob}
                isOffline={isOffline}
                onSaveComplete={handleSaveComplete}
                onCancel={() => {
                  setPrefilledData(null);
                  setAudioBlob(null);
                  setCurrentView('record');
                }}
              />
            </div>
          )}

          {currentView === 'dashboard' && user.role === 'admin' && (
            /* PASO 3: DASHBOARD ADMINISTRATIVO DE KPIS */
            <div className="w-full animate-in fade-in duration-300">
              <Dashboard
                interventions={interventionsList}
                onBack={() => setCurrentView('record')}
              />
            </div>
          )}
        </div>

        {/* HISTORIAL CLINICO (Solo visible en paso de grabación) */}
        {currentView === 'record' && (
          <section className="flex flex-col gap-4 mt-4 border-t border-border pt-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {user.role === 'admin' 
                  ? 'Seguimiento General de Pacientes' 
                  : 'Mis Intervenciones Recientes'}
              </h3>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {interventionsList.length} total
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-6 gap-2 text-muted-foreground text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cargando historial...</span>
              </div>
            ) : interventionsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No hay intervenciones registradas. Tu primera grabación aparecerá aquí.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Si es terapeuta normal, opcionalmente filtramos solo los suyos.
                    En este MVP unificamos el log pero mostramos distinción de autoría */}
                {interventionsList.slice(0, 3).map((item: any) => {
                  const isItemOffline = item.estadoSincronizacion === 'offline';
                  const fecha = new Date(item.fechaIntervencion).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const tieneAlerta = 
                    `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('recaída') || 
                    `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('crisis') || 
                    `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('urgencia');

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border bg-card p-4 shadow-sm text-[11px] relative overflow-hidden ${
                        tieneAlerta ? 'border-destructive/30' : 'border-border'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-foreground truncate max-w-[150px]">
                          👤 {item.pacienteNombre}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {fecha}
                          </span>
                          {isItemOffline ? (
                            <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-extrabold text-amber-600 border border-amber-500/20">
                              Local
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-extrabold text-emerald-600 border border-emerald-500/20">
                              Nube
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Por: {item.terapeutaNombre}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mt-1">
                        <strong className="text-foreground">Obs: </strong> {item.observaciones}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* OVERLAY DE ÉXITO AL GUARDAR */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-3 scale-95 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-black text-foreground mt-2">¡Validado y Guardado!</h2>
            <p className="text-xs text-muted-foreground max-w-xs text-center px-6">
              El reporte de intervención clínica ha sido registrado exitosamente en el historial del centro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
