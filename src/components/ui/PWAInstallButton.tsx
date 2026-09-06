import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Boton } from './Boton';

interface PWAInstallButtonProps {
  variante?: 'boton-header' | 'tarjeta-completa';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variante = 'boton-header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [mostrarGuiaIOS, setMostrarGuiaIOS] = useState(false);

  // Si ya está instalado en el dispositivo, no mostrar botón redundante
  if (isInstalled) {
    return null;
  }

  // Flujo Android / Chrome / Edge / Escritorio
  if (isInstallable) {
    if (variante === 'tarjeta-completa') {
      return (
        <div className={`p-4 rounded-xl bg-[var(--superficie-2)] border border-[var(--acento)]/30 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[var(--acento)]/15 text-[color:var(--acento)]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[color:var(--texto)]">Instalar Bolsillo</h4>
              <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                Accede desde tu pantalla de inicio sin conexión a internet y en modo pantalla completa.
              </p>
              <div className="mt-3">
                <Boton
                  variante="platino"
                  tamano="sm"
                  icono={<Download className="w-3.5 h-3.5 text-[color:var(--on-acento)]" />}
                  onClick={install}
                >
                  Instalar App
                </Boton>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Boton
        variante="secundario"
        tamano="sm"
        icono={<Download className="w-3.5 h-3.5 text-[color:var(--acento)]" />}
        onClick={install}
        className={className}
      >
        Instalar
      </Boton>
    );
  }

  // Flujo Safari en iOS
  if (isIOS) {
    return (
      <>
        {variante === 'tarjeta-completa' ? (
          <div className={`p-4 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] ${className}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--acento)]/15 text-[color:var(--acento)]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[color:var(--texto)]">Instalar en tu iPhone</h4>
                <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                  Agrega Bolsillo a tu pantalla de inicio para usarla como una app nativa.
                </p>
                <div className="mt-3">
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setMostrarGuiaIOS(true)}
                  >
                    Ver instrucciones
                  </Boton>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setMostrarGuiaIOS(true)}
            className={className}
          >
            Instalar PWA
          </Boton>
        )}

        {mostrarGuiaIOS && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--base)]/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] p-6 shadow-2xl relative">
              <button
                onClick={() => setMostrarGuiaIOS(false)}
                className="absolute top-4 right-4 text-[color:var(--texto-2)] hover:text-[color:var(--texto)] p-1 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] text-[color:var(--acento)] border border-[var(--acento)]/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[color:var(--texto)]">Instalar en iOS</h3>
                  <p className="text-xs text-[color:var(--texto-2)]">Safari iPhone / iPad</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[color:var(--texto)]/90 bg-[var(--superficie-2)] p-4 rounded-xl border border-[var(--linea)]">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-[color:var(--acento)]">1.</span>
                  <span>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono con flecha hacia arriba).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-[color:var(--acento)]">2.</span>
                  <span>Desplaza la lista y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-[color:var(--acento)]">3.</span>
                  <span>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</span>
                </p>
              </div>

              <div className="mt-5">
                <Boton
                  variante="platino"
                  anchoCompleto
                  tamano="md"
                  onClick={() => setMostrarGuiaIOS(false)}
                >
                  Entendido
                </Boton>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
