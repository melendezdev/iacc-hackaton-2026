'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAContextType {
  isInstallable: boolean;
  installApp: () => Promise<void>;
  isInstalled: boolean;
  isIOS: boolean;
  showInstallBanner: boolean;
  dismissInstallBanner: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // 1. Detect environment, installation state and intercept beforeinstallprompt
  useEffect(() => {
    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone);

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check localStorage to see if user dismissed the banner previously
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed') === 'true';

    // Show banner on iOS if not installed and not dismissed (since iOS does not trigger beforeinstallprompt)
    if (ios && !isStandalone && !dismissed) {
      setShowInstallBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      if (!isStandalone && !dismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      toast.success('¡Instalación completada!', {
        description: 'Talita Kum se ha instalado en tu dispositivo. Accede directo desde tu pantalla de inicio.',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 2. Service Worker registration and version checking
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado con éxito en scope:', registration.scope);

          // Force check on registration update on load
          registration.update().catch(() => {});

          // Check if there is already a service worker waiting
          if (registration.waiting) {
            notifyNewVersion(registration.waiting);
          }

          // Handle update discovery
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new update is ready to be applied (installed but waiting)
                  notifyNewVersion(newWorker);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error registrando el Service Worker:', error);
        });

      // Reload window when the controller changes (due to claim/skipWaiting)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Periodically check for updates (every 5 minutes)
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.update().catch(() => {});
        });
      }, 5 * 60 * 1000);

      // Check on window focus as well
      const handleFocus = () => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.update().catch(() => {});
        });
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(updateInterval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  const notifyNewVersion = (worker: ServiceWorker) => {
    toast.info('Actualización Disponible', {
      description: 'Se ha subido una nueva versión de la aplicación. Haz clic en "Actualizar" para recargar.',
      action: {
        label: 'Actualizar',
        onClick: () => {
          worker.postMessage({ type: 'SKIP_WAITING' });
        },
      },
      duration: Infinity,
    });
  };

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowInstallBanner(false);
      }
    } else if (isIOS) {
      toast.info('Instalar en iOS / Apple', {
        description: 'Pulsa el botón "Compartir" de Safari y luego "Añadir a la pantalla de inicio" para instalar la app.',
        duration: 8000,
      });
    } else {
      toast.info('Instalación Directa', {
        description: 'Puedes instalar la aplicación directamente desde el menú de opciones de tu navegador.',
      });
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable: isInstallable || isIOS,
        installApp,
        isInstalled,
        isIOS,
        showInstallBanner,
        dismissInstallBanner,
      }}
    >
      {children}
      <PWABanner />
    </PWAContext.Provider>
  );
};

const PWABanner: React.FC = () => {
  const { showInstallBanner, installApp, dismissInstallBanner, isIOS } = usePWA();

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-secondary/30 bg-card/90 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300">
        
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={dismissInstallBanner}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4 items-start">
          <div className="flex items-center justify-center p-3 rounded-xl bg-secondary/10 text-secondary shrink-0">
            <Download className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider mb-1">
              Instalar Aplicación
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Descarga la app en tu <strong>PC/Desktop</strong> o <strong>Móvil</strong>. Trabaja sin conexión a internet y accede de forma inmediata.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
          <button
            onClick={dismissInstallBanner}
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            Ahora no
          </button>
          
          <Button
            size="sm"
            onClick={installApp}
            className="h-8 rounded-lg bg-secondary hover:bg-secondary/90 text-white text-[11px] font-bold px-4 shadow-lg shadow-secondary/20 flex items-center gap-1.5 cursor-pointer"
          >
            {isIOS ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                Cómo Instalar
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                Instalar App
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};
