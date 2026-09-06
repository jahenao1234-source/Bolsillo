import React from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  MessageCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { Tarjeta } from '../ui/Tarjeta';
import { Boton } from '../ui/Boton';
import { Chip } from '../ui/Chip';

export interface InfoModuloPro {
  id: string;
  nombre: string;
  icono: React.ComponentType<{ className?: string }>;
  lineaValor: string;
  beneficios: string[];
}

interface ModalUpsellProProps {
  abierto: boolean;
  modulo: InfoModuloPro | null;
  onCerrar: () => void;
  onIrAActivarCodigo: () => void;
}

export const ModalUpsellPro: React.FC<ModalUpsellProProps> = ({
  abierto,
  modulo,
  onCerrar,
  onIrAActivarCodigo,
}) => {
  if (!abierto || !modulo) return null;

  const Icono = modulo.icono;

  const handleWhatsApp = () => {
    // Enlace placeholder según directriz
    window.open('https://wa.me/57XXXXXXXXXX?text=Hola%2C%20quiero%20desbloquear%20Bolsillo%20Pro', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Fondo oscuro con desenfoque */}
      <div
        className="fixed inset-0 bg-[var(--base)]/80 backdrop-blur-sm transition-opacity"
        onClick={onCerrar}
      />

      {/* Contenedor Modal / Bottom Sheet */}
      <div
        className="
          relative w-full max-w-lg bg-[var(--superficie)] border-t sm:border border-[var(--linea)]
          rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10
          max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200
        "
      >
        {/* Barra superior de arrastre en móvil */}
        <div className="sm:hidden w-12 h-1.5 bg-[var(--linea)] rounded-full mx-auto mt-3 mb-1" />

        {/* Cabecera con fondo sutil */}
        <div className="relative px-6 pt-5 pb-4 hairline-b bg-[var(--superficie-2)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--acento)]/20 to-[var(--positivo)]/10 border border-[var(--acento)]/30 flex items-center justify-center text-[color:var(--acento)] shadow-inner">
                <Icono className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Chip variante="platino">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[color:var(--acento)]" /> Bolsillo Pro
                    </span>
                  </Chip>
                </div>
                <h3 className="text-lg font-bold font-display text-[color:var(--texto)] mt-1">
                  {modulo.nombre}
                </h3>
              </div>
            </div>

            <button
              onClick={onCerrar}
              className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[color:var(--texto-2)] mt-3 font-medium leading-relaxed">
            {modulo.lineaValor}
          </p>
        </div>

        {/* Cuerpo con beneficios */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
            ¿Qué desbloqueas con Bolsillo Pro?
          </div>

          <div className="space-y-2.5">
            {modulo.beneficios.map((beneficio, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--positivo)]/15 text-[color:var(--positivo)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[color:var(--texto)] leading-relaxed">
                  {beneficio}
                </span>
              </div>
            ))}
          </div>

          {/* Tarjeta de valor Pro */}
          <div className="p-4 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[color:var(--acento)] flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[color:var(--texto)]">Licencia Permanente</p>
                <p className="text-[11px] text-[color:var(--texto-2)]">Acceso ilimitado a todos los módulos Pro</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[color:var(--acento)] uppercase tracking-wider px-2 py-1 rounded bg-[var(--superficie)] border border-[var(--linea)]">
              Sin suscripción
            </span>
          </div>
        </div>

        {/* Acciones del pie */}
        <div className="p-6 pt-3 hairline-t bg-[var(--base)] space-y-2.5">
          <Boton
            variante="platino"
            anchoCompleto
            onClick={handleWhatsApp}
            icono={<MessageCircle className="w-4 h-4" />}
          >
            Desbloquear Bolsillo Pro vía WhatsApp
          </Boton>

          <button
            type="button"
            onClick={() => {
              onCerrar();
              onIrAActivarCodigo();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[color:var(--texto-2)] hover:text-[color:var(--acento)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ya tengo un código de acceso &bull; Activar ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
