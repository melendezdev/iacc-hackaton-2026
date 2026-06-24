'use client';

import React, { useState, Suspense } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Shield, Key, ArrowLeft, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      // Better Auth detecta el token de restablecimiento directamente de los parámetros de la URL
      const response = await authClient.resetPassword({
        newPassword: password,
      });

      if (response.error) {
        throw new Error(response.error.message || 'El enlace de restauración ha expirado o es inválido.');
      }

      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña ha sido restablecida con éxito.',
      });

      setSuccessMsg('✓ Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...');
      setPassword('');
      setConfirmPassword('');

      // Redirigir al inicio después de 2 segundos
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al actualizar contraseña. Vuelve a solicitar el enlace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl text-card-foreground">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Establecer Contraseña</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa tu nueva contraseña para acceder al sistema
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600">
          {successMsg}
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90 mt-2 font-bold cursor-pointer"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </form>
      )}

      <div className="mt-4 text-center">
        <a
          href="/"
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
        </a>
      </div>

      <div className="mt-6 flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/30">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          Better Auth procesará el token incrustado en el enlace de la URL para validar la autenticidad de esta solicitud.
        </span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 bg-background text-foreground flex items-center justify-center min-h-screen px-4">
      {/* El Suspense boundary evita fallos de compilación estática (Static Gen) en Next.js */}
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span>Cargando formulario...</span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
