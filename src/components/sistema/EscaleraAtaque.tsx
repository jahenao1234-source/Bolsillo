/**
 * Cómo crece el ataque: cada deuda, al caer, le pasa su cuota a la siguiente.
 * Es el traspaso hecho visible, y la razón por la que el plan acorta la fecha.
 */

import React from 'react';
import type { Escalon } from '../../logic/sistema';
import { formatearCOP } from '../../utils/format';

interface EscaleraAtaqueProps {
  escalones: Escalon[];
  /** Escritorio: agrega la fecha en que cada deuda queda en $0. */
  detallada?: boolean;
}

export const EscaleraAtaque: React.FC<EscaleraAtaqueProps> = ({ escalones, detallada = false }) => {
  if (escalones.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-linea bg-superficie">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${escalones.length}, minmax(${detallada ? 150 : 96}px, 1fr))` }}
      >
        {escalones.map((e, i) => (
          <div key={e.deudaId} className={`px-3 py-2.5 ${i > 0 ? 'border-l border-hairline' : ''}`}>
            <p className={`font-display font-extrabold text-[15px] tabular-nums ${i === 0 ? 'text-accion' : 'text-texto'}`}>
              {formatearCOP(e.monto)}
            </p>
            <p className="text-[10.5px] text-texto-2 mt-0.5 truncate" title={e.nombre}>
              {e.nombre}
              {detallada && <> · $0 en {e.hasta.toLowerCase()}</>}
            </p>
            <p className="text-[10px] text-texto-3 mt-px">{e.desde === 'Hoy' ? 'desde hoy' : `desde ${e.desde.toLowerCase()}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
