'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, User, Key, Info } from 'lucide-react';

export interface LoggedInUser {
  id: string;
  nombre: string;
  email: string;
  rol: 'terapeuta' | 'admin';
}

interface LoginProps {
  onLoginSuccess: (user: LoggedInUser) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, selectedUser?: LoggedInUser) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Si se hace login rápido por botón de demo
    if (selectedUser) {
      setTimeout(() => {
        onLoginSuccess(selectedUser);
        setIsLoading(false);
      }, 600);
      return;
    }

    // Login convencional mockup
    setTimeout(() => {
      if (email === 'alejandro@talitakum.cl' || email === 'alejandro.melendez@talitakum.cl') {
        onLoginSuccess({
          id: 'terapeuta-1',
          nombre: 'Psi. Alejandro Meléndez',
          email: 'alejandro.melendez@talitakum.cl',
          rol: 'terapeuta',
        });
      } else if (email === 'daniel@talitakum.cl' || email === 'daniel.silva@talitakum.cl') {
        onLoginSuccess({
          id: 'terapeuta-3',
          nombre: 'Dr. Daniel Silva (Psiquiatra)',
          email: 'daniel.silva@talitakum.cl',
          rol: 'admin',
        });
      } else {
        setErrorMsg('Credenciales inválidas. Usa los accesos rápidos para la demostración.');
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-border bg-card p-6 shadow-xl text-card-foreground">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Acceso Seguro</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Registro Inteligente de Intervenciones Terapéuticas
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Accesos Rápidos para Demo de Hackathon (Crucial) */}
      <div className="mb-6 rounded-2xl bg-muted p-4 border border-border">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
          ⚡ Accesos Rápidos (Demostración)
        </label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) =>
              handleLogin(e, {
                id: 'terapeuta-1',
                nombre: 'Psi. Alejandro Meléndez',
                email: 'alejandro.melendez@talitakum.cl',
                rol: 'terapeuta',
              })
            }
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-accent text-left text-xs font-semibold cursor-pointer"
          >
            <span>🎙️ Rol: Terapeuta (Alejandro M.)</span>
            <span className="text-[9px] uppercase font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Grabar / Validar
            </span>
          </button>
          
          <button
            type="button"
            onClick={(e) =>
              handleLogin(e, {
                id: 'terapeuta-3',
                nombre: 'Dr. Daniel Silva',
                email: 'daniel.silva@talitakum.cl',
                rol: 'admin',
              })
            }
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-accent text-left text-xs font-semibold cursor-pointer"
          >
            <span>📊 Rol: Administrador (Daniel S.)</span>
            <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              KPIs / Métricas
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Correo Electrónico
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-muted-foreground">
              <User className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@talitakum.cl"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-muted-foreground">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 mt-2 font-bold cursor-pointer"
        >
          {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/40 p-3 rounded-xl">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          Para evaluación directa de la Hackathon, los accesos rápidos omiten la validación de contraseña y configuran el perfil de rol de forma instantánea.
        </span>
      </div>
    </div>
  );
}
