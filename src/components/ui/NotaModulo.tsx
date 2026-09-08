import React from 'react';
import { Sparkles } from 'lucide-react';

interface NotaModuloProps {
  texto: string;
}

/** Banner sutil que explica en una línea qué gana el usuario con un módulo Pro. */
export const NotaModulo: React.FC<NotaModuloProps> = ({ texto }) => {
  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--acento)]/20"
      style={{ background: 'color-mix(in srgb, var(--acento) 7%, transparent)' }}
    >
      <span className="shrink-0 p-1 rounded-lg text-[color:var(--acento)] mt-0.5">
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <p className="text-xs text-[color:var(--texto-2)] leading-relaxed">{texto}</p>
    </div>
  );
};
