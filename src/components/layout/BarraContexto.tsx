/**
 * La barra de contexto del escritorio: una sola línea que dice dónde estás,
 * el dato que manda en esta pantalla, y las acciones.
 *
 * A la derecha, siempre, el botón que abre el cajón de Hoy.
 */

import React from 'react';
import { PanelRight } from 'lucide-react';

interface BarraContextoProps {
  /** Rótulo pequeño encima del título. Opcional. */
  eyebrow?: React.ReactNode;
  titulo?: React.ReactNode;
  /** Chips de contexto, a la derecha del título. */
  chips?: React.ReactNode;
  /** Botones propios de la pantalla. */
  acciones?: React.ReactNode;
  cajonAbierto: boolean;
  /** Cobros pendientes: se pinta como contador en el botón. */
  pendientes: number;
  onAlternarCajon: () => void;
}

export const BarraContexto: React.FC<BarraContextoProps> = ({
  eyebrow,
  titulo,
  chips,
  acciones,
  cajonAbierto,
  pendientes,
  onAlternarCajon,
}) => (
  <div className="hidden md:flex items-center justify-between gap-5 flex-none">
    <div className="flex items-center gap-3 min-w-0">
      {(eyebrow || titulo) && (
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              {eyebrow}
            </p>
          )}
          {titulo && (
            <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)] truncate">
              {titulo}
            </h1>
          )}
        </div>
      )}
      {chips && <div className="flex items-center gap-2 min-w-0">{chips}</div>}
    </div>

    <div className="flex items-center gap-2 flex-none">
      {acciones}
      {acciones && <span className="w-px h-4 bg-[var(--linea)]" />}
      <button
        type="button"
        onClick={onAlternarCajon}
        aria-pressed={cajonAbierto}
        title="Abrir o cerrar el cajón de Hoy · tecla H"
        className={`inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-[7px] font-display font-bold text-xs cursor-pointer transition-colors duration-150 ${
          cajonAbierto
            ? 'bg-[var(--elevada)] border-[var(--accion)] text-[color:var(--accion)]'
            : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:border-[color:var(--texto-3)]'
        }`}
      >
        <PanelRight className="w-3.5 h-3.5" />
        Hoy
        {pendientes > 0 && (
          <span className="text-[10px] leading-[1.4] px-1.5 rounded-full bg-[var(--accion)] text-[color:var(--on-accion)] tabular-nums">
            {pendientes}
          </span>
        )}
      </button>
    </div>
  </div>
);
