/**
 * Una herramienta de Crecer.
 *
 * Antes eran seis tarjetas con el mismo fondo, el mismo icono teal y la misma
 * forma: un menú disfrazado de tablero, imposible de distinguir de un vistazo.
 * Ahora cada una trae su color de canto, su cabecera propia, su cifra grande y
 * —lo que faltaba— lo que toca hacer ahora.
 *
 * El cuerpo lo pone quien la usa: así cada módulo enseña la forma que le
 * corresponde (una barra, una lista de sobres, la escalera del reto, los
 * próximos cobros, dos cupos, el histórico) en vez de seis rectángulos iguales.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

type TonoEtiqueta = 'neutro' | 'ok' | 'ojo' | 'mal';

const TONOS: Record<TonoEtiqueta, string> = {
  neutro: 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)]',
  ok: 'bg-[var(--positivo)]/10 border-[var(--positivo)]/28 text-[color:var(--positivo)]',
  ojo: 'bg-[var(--accion)]/10 border-[var(--accion)]/32 text-[color:var(--accion)]',
  mal: 'bg-[var(--alerta)]/10 border-[var(--alerta)]/30 text-[color:var(--alerta)]',
};

interface TarjetaModuloProps {
  /** El color del módulo: canto izquierdo, icono y acción. */
  color: string;
  icono: React.ReactNode;
  nombre: string;
  etiqueta?: string;
  etiquetaTono?: TonoEtiqueta;
  /** La cifra que manda en este módulo. */
  cifra: string;
  sufijo?: string;
  /** Lo que toca hacer ahora. Es la línea que convierte el menú en tablero. */
  accion: string;
  children?: React.ReactNode;
  onClick: () => void;
}

export const TarjetaModulo: React.FC<TarjetaModuloProps> = ({
  color,
  icono,
  nombre,
  etiqueta,
  etiquetaTono = 'neutro',
  cifra,
  sufijo,
  accion,
  children,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{ ['--c' as string]: color }}
    className="group relative text-left flex flex-col min-h-0 overflow-hidden rounded-[13px] bg-[var(--superficie-2)] border border-[var(--linea)] hover:border-[color:var(--c)] transition-colors cursor-pointer"
  >
    {/* El canto de color: lo que hace que se distingan entre sí */}
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 bottom-0 w-[3px]"
      style={{ background: 'var(--c)' }}
    />

    <div className="flex items-center gap-2 px-3.5 pt-2.5 pb-2 border-b border-[var(--hairline)] bg-[var(--superficie)]">
      <span
        className="w-6 h-6 rounded-[7px] grid place-items-center flex-none"
        style={{
          background: 'color-mix(in srgb, var(--c) 16%, transparent)',
          color: 'var(--c)',
        }}
      >
        {icono}
      </span>
      <span className="flex-1 text-xs font-semibold text-[color:var(--texto)] truncate">
        {nombre}
      </span>
      {etiqueta && (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${TONOS[etiquetaTono]}`}
        >
          {etiqueta}
        </span>
      )}
    </div>

    <div className="flex flex-col flex-1 min-h-0 px-3.5 pt-3 pb-3">
      <p className="font-display font-bold text-[21px] leading-none tabular-nums text-[color:var(--texto)]">
        {cifra}
        {sufijo && (
          <span className="font-body text-[11px] font-medium text-[color:var(--texto-3)] ml-1.5">
            {sufijo}
          </span>
        )}
      </p>

      {children}

      <span
        className="mt-auto pt-2.5 text-[11px] font-semibold flex items-center gap-1"
        style={{ color: 'var(--c)' }}
      >
        <span className="truncate">{accion}</span>
        <ArrowRight className="w-3 h-3 flex-none opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </span>
    </div>
  </button>
);
