import React, { useId } from 'react';
import { formatearCOP } from '../../utils/format';

interface GraficoGastoMesProps {
  serie: { dia: number; acumulado: number }[];
  techo: number;
  diasDelMes: number;
  mes: string;
  /** Celular: solo la curva y la línea del techo, sin textos. */
  compacto?: boolean;
}

/**
 * Gasto acumulado del mes contra el techo.
 *
 * El SVG se estira al ancho del panel (preserveAspectRatio="none"), así que dentro
 * solo van formas: los textos y el punto de hoy son HTML encima, porque un texto
 * o un círculo dentro de un SVG estirado se deforma. Las líneas usan
 * non-scaling-stroke para que su grosor no cambie con el ancho.
 */
export const GraficoGastoMes: React.FC<GraficoGastoMesProps> = ({ serie, techo, diasDelMes, mes, compacto }) => {
  const idDegradado = useId();

  if (serie.length === 0 || techo <= 0 || diasDelMes < 2) {
    return (
      <div className={`flex-1 flex items-center justify-center text-xs text-texto-3 ${compacto ? 'min-h-[54px]' : 'min-h-[96px]'}`}>
        Sin gastos este mes
      </div>
    );
  }

  const ultimo = serie[serie.length - 1];
  // Si ya se pasó del techo, la escala crece para que la curva no se salga del panel.
  const tope = Math.max(techo, ultimo.acumulado) * 1.04;
  // Coordenadas en 0–100: la curva vive entre y=100 (cero) e y=6 (el tope).
  const y = (v: number) => 100 - (v / tope) * 94;
  const x = (dia: number) => ((dia - 1) / (diasDelMes - 1)) * 100;

  const puntos = serie.map((p) => `${x(p.dia)},${y(p.acumulado)}`).join(' L ');
  const linea = `M ${puntos}`;
  const area = `M ${x(serie[0].dia)},100 L ${puntos} L ${x(ultimo.dia)},100 Z`;
  const yTecho = y(techo);
  const pasado = ultimo.acumulado > techo;

  return (
    <div className={`w-full flex flex-col select-none ${compacto ? 'h-[54px]' : 'h-full min-h-[96px]'}`}>
      <div className="relative flex-1 min-h-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--acento)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <line x1="0" y1="100" x2="100" y2="100" stroke="var(--linea)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill={`url(#${idDegradado})`} />
          <path d={linea} fill="none" stroke="var(--acento)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <line
            x1="0" y1={yTecho} x2="100" y2={yTecho}
            stroke={pasado ? 'var(--alerta)' : 'var(--texto-3)'}
            strokeWidth="1" strokeDasharray="4 5" vectorEffect="non-scaling-stroke"
          />
        </svg>

        {!compacto && (
          <>
            <span
              className={`absolute right-0 -translate-y-full pb-1 text-[11px] leading-none whitespace-nowrap ${pasado ? 'text-alerta' : 'text-texto-3'}`}
              style={{ top: `${yTecho}%` }}
            >
              techo del mes {formatearCOP(techo)}
            </span>
            <span
              className="absolute w-[11px] h-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-superficie border-[2.5px] border-[color:var(--boton-principal)]"
              style={{ left: `${x(ultimo.dia)}%`, top: `${y(ultimo.acumulado)}%` }}
            />
          </>
        )}
      </div>

      {!compacto && (
        <div className="relative h-4 mt-1.5 text-[11px] leading-none text-texto-3 whitespace-nowrap">
          <span className="absolute left-0 top-0.5">1 {mes}</span>
          {/* "hoy" solo si no choca con las fechas de los extremos */}
          {x(ultimo.dia) > 18 && x(ultimo.dia) < 82 && (
            <span className="absolute top-0.5 -translate-x-1/2" style={{ left: `${x(ultimo.dia)}%` }}>
              hoy · {ultimo.dia}
            </span>
          )}
          <span className="absolute right-0 top-0.5">{diasDelMes} {mes}</span>
        </div>
      )}
    </div>
  );
};
