'use client';

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Shield, User, Key, Info, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'terapeuta' | 'admin'>('terapeuta');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Manejador de Registro (Sign Up)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await authClient.signUp.email({
        email,
        password,
        name,
        // Usamos as any para pasar la propiedad role personalizada que requiere Better Auth en el schema
        role,
      } as any);

      if (response.error) {
        throw new Error(response.error.message || 'Error al registrarse.');
      }

      // Login exitoso tras registrarse
      if (response.data?.user) {
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado durante el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador de Login convencional
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Credenciales inválidas.');
      }

      if (response.data?.user) {
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Credenciales incorrectas o error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar sesión instantáneamente con cuentas demo de la Hackathon
  const handleQuickDemoLogin = async (demoEmail: string, demoName: string, demoRole: 'terapeuta' | 'admin') => {
    setIsLoading(true);
    setErrorMsg('');
    const demoPassword = 'PasswordDemo123!';

    try {
      let loggedInUser = null;

      // 1. Intentar iniciar sesión
      const response = await authClient.signIn.email({
        email: demoEmail,
        password: demoPassword,
      });

      // 2. Si falla porque el usuario no existe en la DB local (ej. base de datos limpia), registrarlo automáticamente
      if (response.error && response.error.status === 401) {
        console.log(`Registrando automáticamente usuario semilla: ${demoEmail}`);
        const signUpRes = await authClient.signUp.email({
          email: demoEmail,
          password: demoPassword,
          name: demoName,
          role: demoRole,
        } as any);

        if (signUpRes.error) {
          throw new Error(signUpRes.error.message || 'Error al registrar cuenta demo.');
        }
        
        loggedInUser = signUpRes.data?.user;
      } else if (response.error) {
        throw new Error(response.error.message);
      } else {
        loggedInUser = response.data?.user;
      }

      if (loggedInUser) {
        onLoginSuccess(loggedInUser);
      }
    } catch (err: any) {
      console.error('Fallo en acceso rápido:', err);
      setErrorMsg(err.message || 'Error al conectar con el servidor de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-border bg-card p-6 shadow-xl text-card-foreground">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">
          {isSignUp ? 'Registro de Personal' : 'Acceso Clínico'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Protegido por Better Auth & Drizzle ORM
        </p>
      </div>

      {/* Banner de Credenciales para la Demo */}
      {!isSignUp && (
        <div className="mb-5 rounded-2xl bg-primary/5 border border-primary/20 p-4 text-xs">
          <p className="font-bold text-foreground mb-2 flex items-center gap-1.5">
            🔑 Credenciales de Acceso para la Demo:
          </p>
          <div className="flex flex-col gap-2">
            <div className="bg-background/80 p-2.5 rounded-xl border border-border">
              <span className="font-bold text-teal-600 block mb-0.5">Rol Terapeuta:</span>
              <div className="font-mono text-[10px] space-y-0.5 text-muted-foreground">
                <div>Email: <span className="text-foreground select-all">alejandro.melendez@talitakum.cl</span></div>
                <div>Pass: <span className="text-foreground select-all">PasswordDemo123!</span></div>
              </div>
            </div>
            <div className="bg-background/80 p-2.5 rounded-xl border border-border">
              <span className="font-bold text-indigo-600 block mb-0.5">Rol Administrador:</span>
              <div className="font-mono text-[10px] space-y-0.5 text-muted-foreground">
                <div>Email: <span className="text-foreground select-all">daniel.silva@talitakum.cl</span></div>
                <div>Pass: <span className="text-foreground select-all">PasswordDemo123!</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Accesos Rápidos (Garantiza fluidez en demostración de Hackathon) */}
      {!isSignUp && (
        <div className="mb-6 rounded-2xl bg-muted p-4 border border-border">
          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
            ⚡ Accesos Rápidos (Registra/Inicia automáticamente)
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'alejandro.melendez@talitakum.cl',
                  'Psi. Alejandro Meléndez',
                  'terapeuta'
                )
              }
              disabled={isLoading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-accent text-left text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <span>🎙️ Entrar como Terapeuta</span>
              <span className="text-[8px] uppercase font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Grabar / Validar
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleQuickDemoLogin(
                  'daniel.silva@talitakum.cl',
                  'Dr. Daniel Silva (Psiquiatra)',
                  'admin'
                )
              }
              disabled={isLoading}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:bg-accent text-left text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <span>📊 Entrar como Administrador</span>
              <span className="text-[8px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                KPIs / Métricas
              </span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-4">
        {isSignUp && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nombre Completo
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Psi. Juan Gómez"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
                required
              />
            </div>
          </div>
        )}

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

        {isSignUp && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Asignar Rol Clínico
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground"
            >
              <option value="terapeuta">Terapeuta Clínico</option>
              <option value="admin">Administrador (Directiva)</option>
            </select>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 mt-2 font-bold cursor-pointer"
        >
          {isLoading 
            ? 'Procesando...' 
            : isSignUp 
              ? 'Registrar Cuenta' 
              : 'Iniciar Sesión'}
        </Button>
      </form>

      {/* Switcher entre Login y Sign Up */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg('');
          }}
          className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
        >
          {isSignUp ? (
            <>¿Ya tienes una cuenta? Inicia Sesión</>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" /> Registrar nuevo terapeuta/admin
            </>
          )}
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/30">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <span>
          Better Auth registra las sesiones en la tabla SQLite local en caliente. Al usar "Acceso Rápido", creamos la cuenta en Turso si aún no existe.
        </span>
      </div>
    </div>
  );
}
