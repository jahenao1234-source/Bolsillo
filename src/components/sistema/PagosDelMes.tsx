/**
 * La respuesta a "¿qué hago este mes?": los pagos, en el orden del plan.
 * La primera recibe el ataque; las demás, su mínimo. Tocar una fila la abona.
 */

import React from 'react';
import { Check } from 'lucide-react';
import type { PagoDelMes } from '../../logic/sistema';
import { formatearCOP } from '../../utils/format';

interface PagosDelMesProps {
  pagos: PagoDelMes[];
  mesNombre: string;
  onPagar: (pago: PagoDelMes) => void;
}

const esCuotaFija = (tipo: string) => tipo === 'prestamo' || tipo === 'libranza';

export const PagosDelMes: React.FC<PagosDelMesProps> = ({ pagos, mesNombre, onPagar }) => {
  const pendientes = pagos.filter((p) => !p.cumplido).length;
  const total = pagos.reduce((a, p) => a + p.monto, 0);

  return (
    <div className="rounded-2xl border border-linea bg-superficie">
      <div className="flex items-baseline justify-between px-3.5 pt-3 pb-2">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-texto-3">Pagos de {mesNombre.toLowerCase()}</p>
        <p className="text-[10.5px] text-texto-3 tabular-nums">
          {pendientes === 0 ? 'Todo pagado' : `${pendientes} de ${pagos.length} pendientes`}
        </p>
      </div>

      {pagos.map((p) => {
        const detalle = p.esFoco && p.extra > 0
          ? `${formatearCOP(p.minimo)} mínimo + ${formatearCOP(p.extra)}`
          : esCuotaFija(p.deuda.tipo)
          ? 'Cuota fija'
          : 'Solo el mínimo';
        return (
          <button
            key={p.deuda.id}
            type="button"
            onClick={() => onPagar(p)}
            className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 border-t border-hairline text-left cursor-pointer hover:bg-superficie-2 transition-colors"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-texto">
                <span className="truncate">{p.deuda.nombre}</span>
                {p.esFoco && !p.cumplido && (
                  <span className="flex-none text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-accion/45 text-accion">
                    Ataque
                  </span>
                )}
                {p.cumplido && (
                  <span className="flex-none inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-positivo">
                    <Check className="w-3 h-3" /> Pagado
                  </span>
                )}
              </span>
              <span className="block text-[10.5px] text-texto-3 mt-0.5 tabular-nums">
                {detalle}
                {p.deuda.diaPago ? ` · antes del ${p.deuda.diaPago}` : ''}
              </span>
            </span>
            <span
              className={`flex-none font-bold text-[13px] tabular-nums ${
                p.cumplido ? 'text-texto-3 line-through' : p.esFoco ? 'text-accion' : 'text-texto'
              }`}
            >
              {formatearCOP(p.monto)}
            </span>
          </button>
        );
      })}

      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-hairline text-[13px] font-bold">
        <span>Este mes</span>
        <span className="tabular-nums">{formatearCOP(total)}</span>
      </div>
    </div>
  );
};
