'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowLeft,
  Calendar,
  FileText,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  interventions: any[];
  onBack: () => void;
}

export function Dashboard({ interventions, onBack }: DashboardProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // 1. Calcular Métricas Clínicas
  const metrics = useMemo(() => {
    const total = interventions.length;

    // Filtrar alertas críticas (por palabras clave)
    const criticos = interventions.filter((item) => {
      const txt = `${item.desarrollo} ${item.observaciones}`.toLowerCase();
      return (
        txt.includes('recaída') ||
        txt.includes('crisis') ||
        txt.includes('suicida') ||
        txt.includes('daño') ||
        txt.includes('autolesi') ||
        txt.includes('urgencia') ||
        txt.includes('consum')
      );
    });

    // Tiempo de registro promedio simulado
    const tiempoPromedioRegistro = total > 0 ? 10.4 : 0; // Segundos

    // Calcular validación humana
    const validados = interventions.filter((item) => item.validadoPorTerapeuta).length;
    const porcentajeValidacion = total > 0 ? Math.round((validados / total) * 100) : 0;

    return {
      total,
      criticosCount: criticos.length,
      criticos,
      tiempoPromedioRegistro,
      porcentajeValidacion,
      validados,
    };
  }, [interventions]);

  // 2. Agrupar datos para el gráfico SVG
  const topPacientes = useMemo(() => {
    const conteo: Record<string, number> = {};
    interventions.forEach((item) => {
      const nom = item.pacienteNombre || 'Desconocido';
      conteo[nom] = (conteo[nom] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 pacientes
  }, [interventions]);

  // Encontrar el valor máximo para escalar la gráfica de barras
  const maxConteo = useMemo(() => {
    if (topPacientes.length === 0) return 1;
    return Math.max(...topPacientes.map((p) => p.count));
  }, [topPacientes]);

  // 3. Filtrar historial completo de intervenciones
  const filteredInterventions = useMemo(() => {
    return interventions.filter(item => 
      (item.pacienteNombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.terapeutaNombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.objetivo || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [interventions, search]);

  // Paginación
  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInterventions = filteredInterventions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full rounded-lg border border-border bg-card p-6 shadow-md text-card-foreground">
      
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded hover:bg-muted cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight">Panel Administrativo</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Métricas operativas y alertas clínicas de Talita Kum
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded border border-border font-bold uppercase">
          <Calendar className="w-3.5 h-3.5 text-secondary" /> Últimos 30 días
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* KPI 1: Total Intervenciones */}
        <div className="rounded border border-border bg-background p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Total Intervenciones
              </p>
              <h3 className="text-3xl font-extrabold mt-1">{metrics.total}</h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span className="text-accent font-bold">+12%</span> vs mes anterior
          </div>
        </div>

        {/* KPI 2: Alertas Críticas */}
        <div className="rounded border border-border bg-background p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Alertas Activas (Crisis/Recaída)
              </p>
              <h3 className={`text-3xl font-extrabold mt-1 ${metrics.criticosCount > 0 ? 'text-destructive' : ''}`}>
                {metrics.criticosCount}
              </h3>
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center border ${
              metrics.criticosCount > 0 
                ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' 
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
            <span className={`font-bold ${metrics.criticosCount > 0 ? 'text-destructive animate-pulse' : 'text-accent'}`}>
              • {metrics.criticosCount > 0 ? 'Acción inmediata sugerida' : 'Operación clínica estable'}
            </span>
          </div>
        </div>

        {/* KPI 3: Eficiencia (Tiempo Registro) */}
        <div className="rounded border border-border bg-background p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Tiempo de Registro por Voz
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-accent">
                {metrics.tiempoPromedioRegistro}s
              </h3>
            </div>
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-accent" />
            Ahorro de <span className="font-bold text-accent">~95%</span> vs digitación manual (180s)
          </div>
        </div>

      </div>

      {/* Sección Gráfica y Validación Humana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Gráfico SVG de Barras (Pacientes con más intervenciones) */}
        <div className="rounded border border-border bg-background p-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
            Distribución por Paciente (Top 5)
          </h4>
          
          {topPacientes.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
              Sin datos suficientes para graficar
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {topPacientes.map((p, idx) => {
                const percentage = Math.round((p.count / maxConteo) * 100);
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="truncate max-w-[200px]">{p.name}</span>
                      <span className="text-muted-foreground">{p.count} sesió(n/es)</span>
                    </div>
                    {/* Barra de progreso visual estilizada con CSS */}
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métrica de Validación Terapéutica (Regla de Oro) */}
        <div className="rounded border border-border bg-background p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">
              Validación Profesional Humana
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Cumplimiento de la regla de oro: Revisiones firmadas por terapeutas clínicos.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            {/* Medidor Radial simple en CSS/SVG */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Fondo */}
                <path
                  className="text-muted"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Progreso */}
                <path
                  className="text-accent"
                  strokeWidth="3.5"
                  strokeDasharray={`${metrics.porcentajeValidacion}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-foreground">
                  {metrics.porcentajeValidacion}%
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                  Firmado
                </span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs font-semibold text-muted-foreground pt-2 border-t border-border/50">
            {metrics.validados} de {metrics.total} reportes firmados clínicamente.
          </div>
        </div>

      </div>

      {/* Historial de Alertas Críticas */}
      <div className="rounded border border-border bg-background p-4 mb-6">
        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
          Alertas Críticas Reportadas (Últimas)
        </h4>

        {metrics.criticosCount === 0 ? (
          <div className="p-4 rounded border border-dashed border-border text-center text-xs text-muted-foreground">
            No se han gatillado alertas críticas en las intervenciones del período.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {metrics.criticos.map((item) => {
              const date = new Date(item.fechaIntervencion).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded border border-destructive/20 bg-destructive/5 text-xs"
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="font-bold text-foreground">
                      👤 Paciente: {item.pacienteNombre}
                    </span>
                    <p className="text-muted-foreground line-clamp-1">
                      <strong className="text-foreground">Alerta: </strong> {item.observaciones}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[9px] font-mono text-muted-foreground">{date}</span>
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[8px] font-extrabold text-destructive border border-destructive/20 uppercase tracking-wider">
                      Urgente
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORIAL COMPLETO DE INTERVENCIONES (Auditoría con Tabla y Paginación) */}
      <div className="rounded border border-border bg-background p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60 mb-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Historial de Intervenciones Registradas
            </h4>
            <p className="text-[9px] text-muted-foreground">
              Auditoría y control de todos los registros clínicos
            </p>
          </div>
          
          {/* Buscador de intervenciones */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente o terapeuta..."
              className="w-full rounded border border-input bg-background/50 pl-8 pr-3 py-1.5 text-[10px] outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
            />
          </div>
        </div>

        {filteredInterventions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded">
            No se encontraron intervenciones registradas.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded border border-border bg-background/30">
              <table className="w-full border-collapse text-[10px] text-muted-foreground">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                    <th className="p-3 text-left">Paciente</th>
                    <th className="p-3 text-left">Terapeuta</th>
                    <th className="p-3 text-left">Objetivo / Observaciones</th>
                    <th className="p-3 text-left w-32">Fecha</th>
                    <th className="p-3 text-center w-20">Firma</th>
                    <th className="p-3 text-center w-20">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInterventions.map((item) => {
                    const tieneAlerta = 
                      `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('recaída') || 
                      `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('crisis') || 
                      `${item.desarrollo} ${item.observaciones}`.toLowerCase().includes('urgencia');
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-border/60 hover:bg-muted/10 transition-colors ${
                          tieneAlerta ? 'bg-destructive/[0.01]' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-foreground truncate max-w-[130px]">
                          👤 {item.pacienteNombre}
                        </td>
                        <td className="p-3 truncate max-w-[130px]">
                          {item.terapeutaNombre}
                        </td>
                        <td className="p-3 max-w-[280px]">
                          <div className="font-semibold text-foreground truncate">{item.objetivo}</div>
                          <div className="text-[9px] line-clamp-1">{item.observaciones}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(item.fechaIntervencion).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-center">
                          {item.validadoPorTerapeuta ? (
                            <span className="text-accent font-bold">Firmado</span>
                          ) : (
                            <span className="text-destructive font-bold">Pendiente</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.estadoSincronizacion === 'offline' ? (
                            <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-[8px] font-extrabold text-secondary border border-secondary/20">Local</span>
                          ) : (
                            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[8px] font-extrabold text-accent border border-accent/20">Nube</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden flex flex-col gap-3">
              {paginatedInterventions.map((item) => (
                <div key={item.id} className="p-3 rounded border border-border bg-card/40 text-[10px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-foreground">👤 {item.pacienteNombre}</span>
                    <span className="text-[8px] font-mono text-muted-foreground">
                      {new Date(item.fechaIntervencion).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                  <div className="text-muted-foreground mb-1">Por: {item.terapeutaNombre}</div>
                  <p className="line-clamp-2 text-muted-foreground">
                    <strong className="text-foreground">Objetivo:</strong> {item.objetivo}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-3 mt-4">
                <span className="text-[9px] text-muted-foreground font-semibold">
                  Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredInterventions.length)} de {filteredInterventions.length} reportes
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-6 px-2 rounded text-[9px] font-bold cursor-pointer"
                  >
                    <ChevronLeft className="w-2.5 h-2.5 mr-0.5" /> Anterior
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-6 w-6 rounded text-[9px] font-bold p-0 cursor-pointer ${
                        currentPage === page ? 'bg-secondary text-white border-secondary' : ''
                      }`}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-6 px-2 rounded text-[9px] font-bold cursor-pointer"
                  >
                    Siguiente <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
