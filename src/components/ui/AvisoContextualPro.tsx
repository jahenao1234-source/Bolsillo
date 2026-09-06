import React, { useState } from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { estaAvisoDescartado, descartarAviso } from '../../utils/avisosContextuales';

interface AvisoContextualProProps {
  id: string; // ej: "aviso-billeteras-presupuesto" o "aviso-deudas-sobres"
  texto: string; // ej: "¿Se te va la plata sin saber en qué? Presupuesto te pone topes."
  esPro?: boolean;
  onAbrirPro: () => void;
  className?: string;
}

export const AvisoContextualPro: React.FC<AvisoContextualProProps> = ({
  id,
  texto,
  esPro = false,
  onAbrirPro,
  className = '',
}) => {
  const [descartado, setDescartado] = useState(() => estaAvisoDescartado(id));

  if (esPro || descartado) return null;

  const handleCerrar = (e: React.MouseEvent) => {
    e.stopPropagation();
    descartarAviso(id);
    setDescartado(true);
  };

  return (
    <div
      onClick={onAbrirPro}
      className={`
        relative group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl
        bg-[var(--superficie-2)] border border-[var(--linea)] cursor-pointer
        hover:border-[var(--acento)]/40 transition-all duration-200
        ${className}
      `}
      role="banner"
      aria-label="Aviso Bolsillo Pro"
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="shrink-0 p-1.5 rounded-lg bg-[var(--acento)]/12 text-[color:var(--acento)] mt-0.5 sm:mt-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm text-[color:var(--texto)] leading-snug">
          <span>{texto} </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--acento)] whitespace-nowrap ml-1 group-hover:underline">
            Conocer Pro <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={handleCerrar}
        className="shrink-0 p-1 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors"
        aria-label="Descartar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
