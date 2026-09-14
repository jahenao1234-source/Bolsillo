import React, { useId } from 'react';
import { formatearCOP } from '../../utils/format';

interface GraficoPlanMinimosProps {
  seriePlan: number[];
  serieMinimos: number[];
  fechaPlan: string;
  fechaMinimos: string;
  mesesGanados: number;
  marcas: { mes: number; etiqueta: string }[];
}

export const GraficoPlanMinimos: React.FC<GraficoPlanMinimosProps> = ({
  seriePlan,
  serieMinimos,
  fechaPlan,
  fechaMinimos,
  mesesGanados,
  marcas,
}) => {
  const gradId = useId();
  const max = seriePlan[0] || 1;
  const len = Math.max(seriePlan.length, serieMinimos.length);
  
  const y = (v: number) => 344 - (v / max) * 311.6;
  const x = (mes: number) => 84 + mes * 602 / Math.max(1, len - 1);

  const paso = Math.ceil(max / 4 / 500000) * 500000;
  const lineasGuia = [];
  for (let v = paso; v < max; v += paso) {
    lineasGuia.push(v);
  }

  const pathMinimos = serieMinimos.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const pathPlan = seriePlan.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const areaPlan = `${pathPlan} L${x(seriePlan.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const hoy = new Date();
  const mesAbrev = hoy.toLocaleString('es-CO', { month: 'short' }).toLowerCase();
  const anio = hoy.getFullYear();

  const centroGanados = (x(seriePlan.length - 1) + 686) / 2;
  const xPlanFinal = x(seriePlan.length - 1);

  return (
    <svg viewBox="0 0 700 380" className="solo-escritorio" style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="g-stop" stopOpacity="0.2" />
          <stop offset="100%" className="g-stop" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Líneas guía */}
      {lineasGuia.map(v => (
        <g key={v}>
          <line x1="84" x2="686" y1={y(v)} y2={y(v)} className="g-linea" />
          <text x="74" y={y(v) + 4} textAnchor="end" fontSize="11" className="g-texto">{formatearCOP(v)}</text>
        </g>
      ))}
      <line x1="84" x2="686" y1={y(0)} y2={y(0)} className="g-texto-s" />
      <text x="74" y={y(0) + 4} textAnchor="end" fontSize="11" className="g-texto-s">$0</text>

      {/* Solo mínimos */}
      <path d={pathMinimos} className="g-texto-s" fill="none" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx={x(serieMinimos.length - 1)} cy={y(serieMinimos[serieMinimos.length - 1])} r="4" className="g-texto" fill="currentColor" />

      {/* Tu plan */}
      <path d={areaPlan} fill={`url(#${gradId})`} />
      <path d={pathPlan} className="g-acento" fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      
      <circle cx={x(0)} cy={y(seriePlan[0])} r="4" className="g-acento-f" fill="currentColor" />
      <text x={x(0) + 12} y="20" fontSize="12" className="g-texto2">hoy debes {formatearCOP(max)}</text>
      <circle cx={xPlanFinal} cy={y(seriePlan[seriePlan.length - 1])} r="5.5" className="g-acento-f" fill="currentColor" />

      {/* Marcas de deudas */}
      {marcas.map((m, i) => {
        // Para evitar que se pise con el círculo final si es justo al final
        if (m.mes >= seriePlan.length - 1) return null;
        return (
          <g key={i}>
            <circle cx={x(m.mes)} cy={y(seriePlan[m.mes])} r="4" className="g-acento-f" fill="currentColor" />
            <text x={x(m.mes) - 8} y={y(seriePlan[m.mes]) + 4} textAnchor="end" fontSize="11" className="g-texto2">{m.etiqueta} en $0</text>
          </g>
        );
      })}

      {/* Eje X (Abajo) */}
      <text x="84" y="368" fontSize="12" className="g-texto">hoy · {mesAbrev} {anio}</text>
      
      <text x={xPlanFinal} y="368" textAnchor="middle" fontSize="12" fontWeight="bold" className="g-acento-f">{fechaPlan.toLowerCase()}</text>
      <text x="686" y="368" textAnchor="end" fontSize="12" className="g-texto">{fechaMinimos.toLowerCase()}</text>

      {mesesGanados > 0 && xPlanFinal < 686 && (
        <g>
          <text x={centroGanados} y="368" textAnchor="middle" fontSize="12" className="g-texto-s">{mesesGanados} meses antes</text>
          <line x1={xPlanFinal + 40} x2={centroGanados - 60} y1="364" y2="364" className="g-texto-s" stroke="currentColor" />
          <line x1={centroGanados + 60} x2={686 - 40} y1="364" y2="364" className="g-texto-s" stroke="currentColor" />
        </g>
      )}
    </svg>
  );
};
