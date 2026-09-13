/**
 * La barra que dice dónde está la persona. Sin numerar: nombra el paso y
 * marca el actual, lo cumplido y lo que falta.
 */

import React from 'react';
import type { Fase } from '../../logic/sistema';

export interface Paso<T extends string = string> {
  id: T;
  nombre: string;
}

export const PASOS_SISTEMA: Paso[] = [
  { id: 'salir', nombre: 'Salir de deudas' },
  { id: 'blindar', nombre: 'Blindar' },
  { id: 'crecer', nombre: 'Crecer' },
];

interface RailPasosProps<T extends string> {
  pasos: Paso<T>[];
  actual: T;
  compact?: boolean;
  className?: string;
}

export const RailPasos = <T extends string>({ pasos, actual, compact, className = '' }: RailPasosProps<T>) => {
  const indice = pasos.findIndex((p) => p.id === actual);

  return (
    <ol className={`flex items-center gap-1.5 text-[11px] font-semibold ${className}`} aria-label="Tu camino">
      {pasos.map((paso, i) => {
        const estado = i < indice ? 'hecho' : i === indice ? 'actual' : 'pendiente';
        return (
          <React.Fragment key={paso.id}>
            {i > 0 && <li aria-hidden className="flex-1 h-px min-w-3 bg-linea" />}
            <li
              aria-current={estado === 'actual' ? 'step' : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap ${
                estado === 'actual' ? 'text-texto' : estado === 'hecho' ? 'text-texto-2' : 'text-texto-3'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full border-[1.5px] ${
                  estado === 'actual'
                    ? 'bg-acento border-acento ring-[3px] ring-acento/20'
                    : estado === 'hecho'
                    ? 'bg-positivo border-positivo'
                    : 'border-texto-3'
                }`}
              />
              {paso.nombre}
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/** Rótulo pequeño en mayúsculas. El mismo en toda la v3. */
export const Rotulo: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-[9.5px] font-bold uppercase tracking-[0.14em] text-texto-3 ${className}`}>{children}</p>
);
