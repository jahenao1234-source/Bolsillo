import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, Sparkles, ArrowRight } from 'lucide-react';
import { useTema } from '../../utils/theme';
import { registrarVictoria } from '../../utils/victorias';
import { formatearCOP } from '../../utils/format';

interface CelebracionLogroProps {
  activo: boolean;
  nombreDeuda: string;
  montoSaldado?: number;
  quedanPocasDeudas?: boolean;
  onTerminar: () => void;
  onConocerPro?: () => void;
}

export const CelebracionLogro: React.FC<CelebracionLogroProps> = ({
  activo,
  nombreDeuda,
  montoSaldado = 0,
  quedanPocasDeudas = false,
  onTerminar,
  onConocerPro,
}) => {
  const { esPapel } = useTema();
  const [faseSegundoBeat, setFaseSegundoBeat] = useState(false);

  useEffect(() => {
    if (!activo) {
      setFaseSegundoBeat(false);
      return;
    }

    // Registrar rastro en la línea de victorias
    registrarVictoria({
      titulo: nombreDeuda,
      descripcion: `Deuda cerrada por completo con tus pagos (${formatearCOP(montoSaldado)} liberados).`,
      monto: montoSaldado,
      tipo: 'deuda_saldada',
    });

    // Vibración háptica corta y sobria
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 45, 35]);
      } catch {
        // Fallback silencioso
      }
    }

    // Sonido cálido y grave (sin cha-ching infantil) usando Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const ahora = ctx.currentTime;
        
        // Acorde cálido en Sol Mayor con ataque suave
        const frecuencias = [196, 246.94, 293.66]; // G3, B3, D4
        frecuencias.forEach((frec) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frec, ahora);
          
          gain.gain.setValueAtTime(0.001, ahora);
          gain.gain.exponentialRampToValueAtTime(0.08, ahora + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, ahora + 1.6);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ahora);
          osc.stop(ahora + 1.7);
        });
      }
    } catch {
      // Audio no disponible o bloqueado por navegador
    }

    // Si quedan pocas o ninguna deuda, tras 2.8s pasamos al segundo beat (graduación)
    if (quedanPocasDeudas) {
      const timerSegundoBeat = setTimeout(() => {
        setFaseSegundoBeat(true);
      }, 2800);
      return () => clearTimeout(timerSegundoBeat);
    } else {
      // Auto-cierre no bloqueante a los 3.4 segundos
      const timerAutoCierre = setTimeout(() => {
        onTerminar();
      }, 3400);
      return () => clearTimeout(timerAutoCierre);
    }
  }, [activo, nombreDeuda, montoSaldado, quedanPocasDeudas, onTerminar]);

  if (!activo) return null;

  return (
    <div
      onClick={() => {
        if (!faseSegundoBeat) onTerminar();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-screen-enter cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-label="Deuda saldada"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-sm w-full p-6 sm:p-8 rounded-3xl bg-[var(--superficie)] border border-[var(--linea)] text-center shadow-2xl overflow-hidden"
      >
        {!faseSegundoBeat ? (
          <>
            {/* Halo sutil según tema */}
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none opacity-40 blur-2xl"
              style={{
                background: esPapel
                  ? 'radial-gradient(circle, rgba(201,138,43,0.3) 0%, rgba(18,135,110,0.2) 70%, transparent 100%)'
                  : 'radial-gradient(circle, rgba(63,221,201,0.25) 0%, rgba(107,147,255,0.15) 70%, transparent 100%)',
              }}
            />

            {/* Sello / Anillo de liberación metálico */}
            <div className="relative mx-auto mb-6 flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center p-1 transition-transform duration-500 scale-105"
                style={{
                  background: esPapel
                    ? 'linear-gradient(135deg, #0C8C7E 0%, #12A897 100%)'
                    : 'linear-gradient(135deg, #25C9BE 0%, #5FE0A8 100%)',
                  boxShadow: esPapel
                    ? '0 8px 24px -4px rgba(18,135,110,0.3)'
                    : '0 8px 24px -4px rgba(63,221,201,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                <div className="w-full h-full rounded-full bg-[var(--superficie)] flex items-center justify-center">
                  <Check
                    className="w-10 h-10 stroke-[2.5] text-[color:var(--positivo)]"
                  />
                </div>
              </div>
            </div>

            {/* Mensaje sobrio, sin gritar, en segunda persona */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[color:var(--acento)] bg-[var(--superficie-2)] border border-[var(--linea)] mb-3">
              {nombreDeuda}
            </span>

            <h3 className="font-display text-2xl font-black text-[color:var(--texto)] tracking-tight mb-2">
              Esta deuda ya no existe.
            </h3>

            <p className="text-sm sm:text-base text-[color:var(--texto-2)] leading-relaxed mb-4">
              La cerraste tú, con tus pagos.
            </p>

            {montoSaldado > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xs text-[color:var(--texto-2)] mb-4">
                <span>Liberaste</span>
                <strong className="text-[color:var(--positivo)] font-bold tabular-nums">
                  {formatearCOP(montoSaldado)}
                </strong>
                <span>de tu flujo mensual.</span>
              </div>
            )}

            <p className="text-[11px] text-[color:var(--texto-3)]">
              Toca en cualquier parte para continuar
            </p>
          </>
        ) : (
          /* Segundo Beat: Graduación e invitación a construir */
          <div className="animate-screen-enter">
            <div className="w-12 h-12 rounded-2xl bg-[var(--acento)]/15 border border-[var(--acento)]/30 mx-auto flex items-center justify-center text-[color:var(--acento)] mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-semibold tracking-wider uppercase text-[color:var(--acento)] mb-1 block">
              Siguiente capítulo
            </span>

            <h3 className="font-display text-xl font-bold text-[color:var(--texto)] tracking-tight mb-2">
              Ya vas saliendo de deudas.
            </h3>

            <p className="text-sm text-[color:var(--texto-2)] leading-relaxed mb-6">
              El siguiente paso es construir. Conoce las herramientas Pro para apartar tus ahorros y ponerle topes a tus gastos.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onTerminar();
                  if (onConocerPro) onConocerPro();
                }}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95`}
              >
                <span>Conocer Bolsillo Pro</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onTerminar}
                className="py-2.5 text-xs text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors"
              >
                Continuar por ahora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
