import React from 'react';
import { formatearCOP } from '../../utils/format';

interface GraficoGastoMesProps {
  serie: { dia: number; acumulado: number }[];
  techo: number;
  diasDelMes: number;
  mes: string;
}

export const GraficoGastoMes: React.FC<GraficoGastoMesProps> = ({ serie, techo, diasDelMes, mes }) => {
  if (serie.length === 0 || techo === 0 || diasDelMes < 2) {
    return <div className="flex-1 min-h-[118px] bg-superficie flex items-center justify-center text-xs text-texto-3">Sin datos para graficar</div>;
  }

  const y = (v: number) => 110 - (v / techo) * 90;
  const x = (dia: number) => ((dia - 1) / (diasDelMes - 1)) * 600;

  const puntos = serie.map(p => `${x(p.dia)},${y(p.acumulado)}`).join(' L ');
  const dLine = `M ${puntos}`;
  
  const primerPunto = serie[0];
  const ultimoPunto = serie[serie.length - 1];
  const dArea = `M ${x(primerPunto.dia)},110 L ${puntos} L ${x(ultimoPunto.dia)},110 Z`;

  return (
    <div className="w-full h-[118px] relative select-none">
      <svg viewBox="0 0 600 124" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="gradienteAreaGasto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--acento)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Línea base */}
        <line x1="0" y1="110" x2="600" y2="110" stroke="var(--linea)" strokeWidth="1" />

        {/* Área bajo la curva */}
        <path d={dArea} fill="url(#gradienteAreaGasto)" />

        {/* Línea de la curva */}
        <path d={dLine} fill="none" stroke="var(--acento)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Punto en el último día */}
        {ultimoPunto && (
          <circle 
            cx={x(ultimoPunto.dia)} 
            cy={y(ultimoPunto.acumulado)} 
            r="5" 
            fill="var(--superficie)" 
            stroke="var(--boton-principal)" 
            strokeWidth="2.5" 
          />
        )}

        {/* Línea del techo */}
        <line x1="0" y1="20" x2="600" y2="20" stroke="var(--texto-3)" strokeWidth="1" strokeDasharray="4 5" />
        <text x="600" y="14" fill="var(--texto-3)" fontSize="11" textAnchor="end" fontFamily="inherit">
          techo del mes {formatearCOP(techo)}
        </text>

        {/* Etiquetas abajo */}
        <text x="0" y="124" fill="var(--texto-3)" fontSize="11" textAnchor="start" fontFamily="inherit">
          1 {mes}
        </text>
        
        {ultimoPunto && (
          <text 
            x={x(ultimoPunto.dia)} 
            y="124" 
            fill="var(--texto-3)" 
            fontSize="11" 
            textAnchor="middle" 
            fontFamily="inherit"
          >
            hoy · {ultimoPunto.dia}
          </text>
        )}
        
        <text x="600" y="124" fill="var(--texto-3)" fontSize="11" textAnchor="end" fontFamily="inherit">
          {diasDelMes} {mes}
        </text>
      </svg>
    </div>
  );
};
