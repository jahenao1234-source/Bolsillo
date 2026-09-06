import React, { useEffect, useState } from 'react';
import { useTema } from '../../utils/theme';

interface AnilloProps {
  fechaLibertad: string; // ej: "Mar 2028"
  porcentaje?: number;   // ej: 34
  fraseHumana?: string;  // ej: "Vas más rápido de lo que crees. Sigue así."
  tamano?: number;       // diámetro en px (default 240)
  grosor?: number;       // grosor del anillo en px (default 14)
  className?: string;
}

export const Anillo: React.FC<AnilloProps> = ({
  fechaLibertad,
  porcentaje = 34,
  fraseHumana = 'Vas más rápido de lo que crees. Sigue así.',
  tamano = 230,
  grosor = 14,
  className = '',
}) => {
  const { esPapel } = useTema();
  const meta = Math.min(100, Math.max(0, porcentaje));
  const [progresoAnimado, setProgresoAnimado] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return meta;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgresoAnimado(meta);
      return;
    }

    let inicio: number | null = null;
    let animId: number;
    const duracion = 1000;

    const paso = (timestamp: number) => {
      if (!inicio) inicio = timestamp;
      const t = Math.min(1, (timestamp - inicio) / duracion);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgresoAnimado(meta * eased);

      if (t < 1) {
        animId = requestAnimationFrame(paso);
      } else {
        setProgresoAnimado(meta);
      }
    };

    animId = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(animId);
  }, [meta]);

  const p = Math.round(progresoAnimado);
  const innerSize = tamano - grosor * 2;

  // Gradiente cónico: Platino en Medianoche, Teal/Tinta esmeralda en Papel
  const conicStyle = esPapel
    ? {
        background: `conic-gradient(
          from -90deg,
          #0C8C7E 0%,
          #12A897 ${p * 0.7}%,
          #12A897 ${p}%,
          rgba(16, 42, 40, 0.10) ${p}%,
          rgba(16, 42, 40, 0.10) 100%
        )`,
      }
    : {
        background: `conic-gradient(
          from -90deg,
          #25C9BE 0%,
          #5FE0A8 ${p * 0.6}%,
          #5FE0A8 ${p}%,
          #1B3438 ${p}%,
          #152A2D 100%
        )`,
      };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Halo sutil detrás del anillo */}
      <div
        className="absolute rounded-full pointer-events-none opacity-40 blur-xl top-6"
        style={{
          width: `${tamano - 20}px`,
          height: `${tamano - 20}px`,
          background: esPapel
            ? 'radial-gradient(circle, rgba(14,124,107,0.2) 0%, rgba(14,124,107,0) 70%)'
            : 'radial-gradient(circle, rgba(107,147,255,0.25) 0%, rgba(107,147,255,0) 70%)',
        }}
      />

      {/* Anillo exterior */}
      <div
        className="relative rounded-full flex items-center justify-center p-[2px] transition-transform duration-300"
        style={{
          width: `${tamano}px`,
          height: `${tamano}px`,
          ...conicStyle,
          boxShadow: esPapel
            ? '0 6px 20px -4px rgba(30, 27, 22, 0.08)'
            : '0 8px 24px -6px rgba(0, 0, 0, 0.6), 0 0 16px -2px rgba(107, 147, 255, 0.15)',
        }}
      >
        {/* Disco interior que crea la forma de rosca */}
        <div
          className="rounded-full bg-[var(--superficie)] flex flex-col items-center justify-center text-center px-4 relative"
          style={{
            width: `${innerSize}px`,
            height: `${innerSize}px`,
            boxShadow: esPapel
              ? 'inset 0 1px 3px rgba(30, 27, 22, 0.05)'
              : 'inset 0 2px 6px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--hairline)',
          }}
        >
          {/* Etiqueta superior */}
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[color:var(--texto-2)] mb-1">
            Fecha de libertad
          </span>

          {/* Fecha destacada */}
          <div className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[color:var(--texto)] flex items-baseline gap-1">
            <span className={esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'}>
              {fechaLibertad}
            </span>
          </div>

          {/* Porcentaje pagado */}
          <div className="mt-2.5 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--superficie-2)] border border-[var(--linea)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--acento)]" />
            <span className="text-xs font-bold tabular-nums text-[color:var(--acento)]">
              {p}% pagado
            </span>
          </div>
        </div>
      </div>

      {/* Frase corta y humana debajo del anillo */}
      {fraseHumana && (
        <p className="mt-4 text-xs sm:text-sm text-[color:var(--texto-2)] text-center max-w-xs leading-relaxed font-medium">
          {fraseHumana}
        </p>
      )}
    </div>
  );
};
