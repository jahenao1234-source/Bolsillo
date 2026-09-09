/**
 * La barra de contexto del escritorio: una sola línea que dice dónde estás,
 * el dato que manda en esta pantalla, y las acciones.
 *
 * No sabe nada de ninguna pantalla: expone dos huecos y cada pantalla los
 * llena por portal (ver shell.tsx). A la derecha, siempre, el botón del cajón.
 */

import React from 'react';
import { PanelRight } from 'lucide-react';

interface BarraContextoProps {
  /** Hueco izquierdo: rótulo, título y chips de la pantalla. */
  refTitulo: (nodo: HTMLDivElement | null) => void;
  /** Hueco derecho: los botones de la pantalla. */
  refAcciones: (nodo: HTMLDivElement | null) => void;
  cajonAbierto: boolean;
  /** Cobros que se vienen: se pinta como contador en el botón. */
  pendientes: number;
  onAlternarCajon: () => void;
}

export const BarraContexto: React.FC<BarraContextoProps> = ({
  refTitulo,
  refAcciones,
  cajonAbierto,
  pendientes,
  onAlternarCajon,
}) => (
  <div className="hidden md:flex items-center justify-between gap-5 flex-none min-h-[38px]">
    <div ref={refTitulo} className="flex items-center gap-3 min-w-0" />

    <div className="flex items-center gap-2 flex-none">
      <div ref={refAcciones} className="flex items-center gap-2" />
      <span className="w-px h-4 bg-[var(--linea)]" />
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
