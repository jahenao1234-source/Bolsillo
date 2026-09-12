/**
 * La deuda total mes a mes: tu plan contra pagar solo mínimos. A escala, con
 * una sola escala para marcas y rótulos. No es decoración: es la promesa.
 */

import React from 'react';
import { formatearCOPCorto } from '../../utils/format';

interface GraficoExtincionProps {
  seriePlan: number[];
  serieMinimos: number[];
  fechaPlan: string;
  fechaMinimos: string;
  mesesGanados: number;
  /** Ancho del lienzo. Más ancho = más bajo a igual espacio: en escritorio la columna es ancha. */
  ancho?: number;
}

const H = 240;
const IZQ = 52;
const DER = 14;
const ARR = 16;
const ABA = 30;
/** Más allá de 10 años la curva de "solo mínimos" deja de caber con sentido. */
const MAX_MESES_VISIBLES = 120;

export const GraficoExtincion: React.FC<GraficoExtincionProps> = ({
  seriePlan,
  serieMinimos,
  fechaPlan,
  fechaMinimos,
  mesesGanados,
  ancho: W = 520,
}) => {
  if (seriePlan.length < 2) return null;

  const minimosVisibles = serieMinimos.slice(0, MAX_MESES_VISIBLES + 1);
  const recortada = serieMinimos.length > minimosVisibles.length;
  const maxMes = Math.max(seriePlan.length - 1, minimosVisibles.length - 1, 1);
  const maxValor = Math.max(...seriePlan, ...minimosVisibles, 1);
  const paso = Math.pow(10, Math.floor(Math.log10(maxValor)));
  const tope = Math.ceil(maxValor / (paso / 2)) * (paso / 2);

  const x = (i: number) => IZQ + (i / maxMes) * (W - IZQ - DER);
  const y = (v: number) => ARR + (1 - v / tope) * (H - ARR - ABA);
  const trazo = (serie: number[]) =>
    serie.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const finPlan = seriePlan.length - 1;
  const finMin = minimosVisibles.length - 1;
  const lineas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * tope);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Tu deuda llega a cero en ${fechaPlan} con el plan; pagando solo mínimos, en ${fechaMinimos}.`}
      className="block"
    >
      {lineas.map((v) => (
        <g key={v}>
          <line x1={IZQ} x2={W - DER} y1={y(v)} y2={y(v)} style={{ stroke: 'var(--hairline)' }} strokeWidth={1} />
          <text x={IZQ - 8} y={y(v) + 3.5} textAnchor="end" fontSize={10.5} style={{ fill: 'var(--texto-3)' }}>
            {v === 0 ? '$0' : formatearCOPCorto(v)}
          </text>
        </g>
      ))}

      <text x={x(0)} y={H - 10} fontSize={10.5} style={{ fill: 'var(--texto-3)' }}>Hoy</text>
      <text x={x(finPlan)} y={H - 10} fontSize={10.5} textAnchor="middle" style={{ fill: 'var(--acento)', fontWeight: 700 }}>
        {fechaPlan}
      </text>
      {finMin > finPlan + 4 && (
        <text x={x(finMin)} y={H - 10} fontSize={10.5} textAnchor="end" style={{ fill: 'var(--texto-3)' }}>
          {recortada ? 'más de 10 años' : fechaMinimos}
        </text>
      )}

      <path d={`${trazo(seriePlan)} L${x(finPlan)} ${y(0)} L${x(0)} ${y(0)} Z`} style={{ fill: 'var(--acento)', opacity: 0.1 }} />
      <path d={trazo(minimosVisibles)} fill="none" style={{ stroke: 'var(--texto-3)' }} strokeWidth={2} strokeDasharray="5 4" />
      <path d={trazo(seriePlan)} fill="none" style={{ stroke: 'var(--acento)' }} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={x(finPlan)} cy={y(0)} r={5} style={{ fill: 'var(--acento)' }} />
      {!recortada && <circle cx={x(finMin)} cy={y(0)} r={4} style={{ fill: 'var(--texto-3)' }} />}

      {mesesGanados > 0 && finMin > finPlan + 4 && (
        <g>
          <line x1={x(finPlan)} x2={x(finMin)} y1={y(0) - 16} y2={y(0) - 16} style={{ stroke: 'var(--linea)' }} />
          <text
            x={(x(finPlan) + x(finMin)) / 2}
            y={y(0) - 22}
            textAnchor="middle"
            fontSize={11}
            style={{ fill: 'var(--texto-2)', fontWeight: 700 }}
          >
            {mesesGanados} {mesesGanados === 1 ? 'mes' : 'meses'} antes
          </text>
        </g>
      )}
    </svg>
  );
};
