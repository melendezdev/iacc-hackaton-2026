'use client';

import React, { useState, useEffect } from 'react';
import { StructuredIntervention } from '@/lib/transcription';
import { OfflineIntervention, guardarIntervencionOffline } from '@/lib/indexedDb';
import { guardarIntervencion } from '@/app/actions';
import { Button } from '@/components/ui/button';

interface ValidationFormProps {
  prefilledData: StructuredIntervention;
  patients: Array<{ id: string; nombre: string; rut?: string | null }>;
  therapists: Array<{ id: string; nombre: string; email?: string | null }>;
  audioBlob: Blob | null;
  isOffline: boolean;
  onSaveComplete: (savedRecord: any, isOfflineSaved: boolean) => void;
  onCancel: () => void;
}

export function ValidationForm({
  prefilledData,
  patients,
  therapists,
  audioBlob,
  isOffline,
  onSaveComplete,
  onCancel,
}: ValidationFormProps) {
  // Estados de los selectores obligatorios
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState('');

  // Los 5 campos obligatorios editables
  const [objetivo, setObjetivo] = useState(prefilledData.objetivo);
  const [desarrollo, setDesarrollo] = useState(prefilledData.desarrollo);
  const [acuerdos, setAcuerdos] = useState(prefilledData.acuerdos);
  const [accionesSeguir, setAccionesSeguir] = useState(prefilledData.accionesSeguir);
  const [observaciones, setObservaciones] = useState(prefilledData.observaciones);

  // La regla de oro (confirmación humana obligatoria)
  const [validadoPorTerapeuta, setValidadoPorTerapeuta] = useState(false);

  // Alertas clínicas en tiempo real
  const [alertaClinica, setAlertaClinica] = useState<{ activa: boolean; mensaje: string }>({
    activa: false,
    mensaje: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Analizar automáticamente el texto para detectar palabras clave críticas (Alertas)
  useEffect(() => {
    const textoCompleto = `${desarrollo} ${observaciones}`.toLowerCase();
    const alertaRecaida = textoCompleto.includes('recaída') || textoCompleto.includes('consumo') || textoCompleto.includes('consumir');
    const alertaCrisis = textoCompleto.includes('crisis') || textoCompleto.includes('suicida') || textoCompleto.includes('daño') || textoCompleto.includes('autolesi') || textoCompleto.includes('urgencia');

    if (alertaCrisis) {
      setAlertaClinica({
        activa: true,
        mensaje: '⚠️ URGENCIA EMOCIONAL DETECTADA: El texto sugiere ideación autolesiva, descompensación severa o crisis aguda. Requiere activar protocolo de emergencia.',
      });
    } else if (alertaRecaida) {
      setAlertaClinica({
        activa: true,
        mensaje: '⚠️ ALERTA DE RECAÍDA: Se mencionan gatillantes, deseos de consumo o vulnerabilidad inminente. Se sugiere derivar a monitoreo intensivo.',
      });
    } else {
      setAlertaClinica({ activa: false, mensaje: '' });
    }
  }, [desarrollo, observaciones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPatient) {
      setErrorMsg('Debes seleccionar un paciente obligatoriamente.');
      return;
    }
    if (!selectedTherapist) {
      setErrorMsg('Debes seleccionar tu nombre (terapeuta).');
      return;
    }
    if (!validadoPorTerapeuta) {
      setErrorMsg('Por favor, marca la confirmación de validación (Regla de Oro). Tu criterio clínico es requerido.');
      return;
    }

    setIsSaving(true);

    const recordData = {
      terapeutaId: selectedTherapist,
      pacienteId: selectedPatient,
      objetivo,
      desarrollo,
      acuerdos,
      accionesSeguir,
      observaciones,
      validadoPorTerapeuta,
      fechaIntervencion: new Date().toISOString(),
    };

    try {
      if (isOffline) {
        // FLUJO OFFLINE: Guardar localmente en IndexedDB
        const offlineId = crypto.randomUUID();
        const offlineRecord: OfflineIntervention = {
          id: offlineId,
          ...recordData,
          audioBlob: audioBlob,
          estadoSincronizacion: 'offline',
          fechaCreacion: new Date().toISOString(),
        };

        await guardarIntervencionOffline(offlineRecord);
        onSaveComplete(offlineRecord, true);
      } else {
        // FLUJO ONLINE: Guardar directamente en la base de datos remota (Server Action)
        const response = await guardarIntervencion({
          ...recordData,
          estadoSincronizacion: 'sincronizado',
        });

        if (response.success) {
          onSaveComplete(response.data, false);
        } else {
          throw new Error(response.error);
        }
      }
    } catch (err: any) {
      console.error('Error al guardar intervención:', err);
      setErrorMsg(err.message || 'Error al guardar el registro. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-border bg-card p-6 shadow-xl text-card-foreground"
    >
      <div className="flex flex-col-reverse items-start justify-between border-b border-border pb-4 mb-6 gap-1">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Revisión y Validación de la Intervención
          </h2>
          <p className="text-xs text-muted-foreground">
            La IA ha pre-llenado el formulario. Revisa, edita los campos y valida para guardar.
          </p>
        </div>
      </div>

      {/* Alerta Clínica Dinámica */}
      {alertaClinica.activa && (
        <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 animate-pulse">
          <p className="text-xs font-semibold text-destructive">
            {alertaClinica.mensaje}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-destructive/15 border border-destructive/25 p-4 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Selectores de Roles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Terapeuta Interventor *
          </label>
          <select
            value={selectedTherapist}
            onChange={(e) => setSelectedTherapist(e.target.value)}
            className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground! outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            required
          >
            <option value="">Selecciona tu nombre...</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id} className='text-foreground!'>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Paciente *
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          >
            <option value="">Selecciona paciente intervenido...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.rut ? `(${p.rut})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Los 5 Campos Clínicos Obligatorios */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            1. Objetivo de la Intervención
          </label>
          <textarea
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background p-3.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            2. Desarrollo de lo ocurrido
          </label>
          <textarea
            value={desarrollo}
            onChange={(e) => setDesarrollo(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background p-3.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            3. Acuerdos
          </label>
          <textarea
            value={acuerdos}
            onChange={(e) => setAcuerdos(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background p-3.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            4. Acciones a seguir
          </label>
          <textarea
            value={accionesSeguir}
            onChange={(e) => setAccionesSeguir(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background p-3.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            5. Observaciones relevantes
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-background p-3.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            required
          />
        </div>
      </div>

      {/* Regla de Oro Checkbox */}
      <div className="mt-8 border-t border-border pt-6">
        <label className="relative flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/10 p-4 transition-all hover:bg-primary/10 cursor-pointer">
          <div className="flex h-5 items-center">
            <input
              type="checkbox"
              checked={validadoPorTerapeuta}
              onChange={(e) => setValidadoPorTerapeuta(e.target.checked)}
              className="h-5 w-5 rounded border-input text-primary focus:ring-ring cursor-pointer bg-background"
            />
          </div>
          <div className="text-sm">
            <span className="font-bold text-foreground block">
              Importante*
            </span>
            <span className="text-xs text-muted-foreground">
              Confirmo que he revisado minuciosamente y valido que esta información estructurada por IA refleja fielmente lo ocurrido y las decisiones tomadas durante la intervención clínica.
            </span>
          </div>
        </label>
      </div>

      {/* Botones de acción */}
      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-md cursor-pointer"
        >
          Descartar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
        >
          {isSaving ? 'Guardando...' : isOffline ? 'Guardar en Celular (Offline) 💾' : 'Guardar y Subir a Nube ☁️'}
        </Button>
      </div>
    </form>
  );
}
