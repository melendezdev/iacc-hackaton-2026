"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Shield, User, Key, Info, ArrowLeft, Download } from "lucide-react";
import { usePWA } from "@/components/PWAProvider";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [view, setView] = useState<"login" | "forgot">("login");

  // Inputs del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Manejador de Login convencional
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.error.message || "Credenciales inválidas.");
      }

      if (response.data?.user) {
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Credenciales incorrectas o error de conexión.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador para solicitar recuperación de contraseña
  const handleForgetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await (authClient as any).forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      setSuccessMsg(
        "✓ Correo enviado. Sigue el enlace en tu email para restablecer la contraseña.",
      );
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Error al solicitar el enlace de recuperación.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto rounded-lg border border-border bg-card p-6 shadow-xl text-card-foreground overflow-hidden">
      {/* Decorative gradient top bar linking Cristo Vive (secondary) and Talita Kum (accent) */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-secondary via-primary to-accent" />

      {/* Encabezado del Formulario */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-10 h-10 rounded bg-primary text-primary-foreground flex items-center justify-center shadow mb-2.5">
          <img
            src="/cristo_vive_logo.png"
            alt="Fundación Cristo Vive"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-sm font-extrabold tracking-tight">
          {view === "forgot" ? "Recuperar Contraseña" : "Fundación Cristo Vive"}
        </h2>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
          {view === "forgot"
            ? "Ingresa tu correo para recibir un enlace de recuperación"
            : "Grupo 1 - IACC Hackaton 2026"}
        </p>
      </div>

      {/* Mensajes de error/éxito */}
      {errorMsg && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold text-emerald-600">
          {successMsg}
        </div>
      )}

      {/* VISTA 1: INICIO DE SESIÓN */}
      {view === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setView("forgot");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                ¿La olvidaste?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Banner de Credenciales para la Demo (Discreto y Elegante) */}
          {/*<div className="rounded-md border border-border bg-muted/40 p-3 text-[10px] space-y-2 mt-2">
            <p className="font-bold text-foreground flex items-center gap-1.5 leading-none">
              🔑 Cuentas para la demo:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/80 p-2 rounded border border-border/60">
                <span className="font-bold text-accent block mb-0.5">Terapeuta:</span>
                <span className="font-mono text-muted-foreground block truncate select-all">alejandro.melendez@talitakum.cl</span>
                <span className="font-mono text-[9px] text-muted-foreground block mt-0.5">Pass: PasswordDemo123!</span>
              </div>
              <div className="bg-background/80 p-2 rounded border border-border/60">
                <span className="font-bold text-secondary block mb-0.5">Administrador:</span>
                <span className="font-mono text-muted-foreground block truncate select-all">daniel.silva@talitakum.cl</span>
                <span className="font-mono text-[9px] text-muted-foreground block mt-0.5">Pass: PasswordDemo123!</span>
              </div>
            </div>
          </div>*/}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/95 mt-2 font-bold cursor-pointer py-5!"
          >
            {isLoading ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </form>
      )}

      {/* VISTA 2: OLVIDÉ MI CONTRASEÑA */}
      {view === "forgot" && (
        <form onSubmit={handleForgetPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Correo Electrónico Registrado
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-muted-foreground">
                <User className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ingresa@talitakum.cl"
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring text-foreground transition-all duration-200"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/95 mt-2 font-bold cursor-pointer"
          >
            {isLoading ? "Enviando..." : "Enviar Correo de Recuperación"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setView("login");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto mt-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
          </button>
        </form>
      )}

      {/* Instalación PWA (Persistente) */}
      {!isInstalled && isInstallable && (
        <button
          type="button"
          onClick={installApp}
          className="w-full text-xs font-bold text-secondary hover:underline flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 animate-pulse" /> Instalar aplicación
          en este dispositivo
        </button>
      )}

      {/* Info en Recuperación */}
      {view === "forgot" && (
        <div className="mt-6 flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/30">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>
            En local, Resend imprimirá el enlace de recuperación con el token
            generado directamente en la consola del servidor Next.js.
          </span>
        </div>
      )}
    </div>
  );
}
export default Login;
