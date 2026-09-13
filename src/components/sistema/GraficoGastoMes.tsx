import React from 'react';
import { formatearCOP } from '../../utils/format';

interface GraficoGastoMesProps {
  serie: { dia: number; acumulado: number }[];
  techo: number;
  diasDelMes: number;
  mes: string;
  compacto?: boolean;
}

export const GraficoGastoMes: React.FC<GraficoGastoMesProps> = ({ serie, techo, diasDelMes, mes, compacto }) => {
  if (serie.length === 0 || techo === 0 || diasDelMes < 2) {
    return <div className={`flex-1 bg-superficie flex items-center justify-center text-xs text-texto-3 ${compacto ? 'min-h-[54px]' : 'min-h-[118px]'}`}>Sin datos para graficar</div>;
  }

  const y = (v: number) => compacto ? 58 - (v / techo) * 50 : 110 - (v / techo) * 90;
  const x = (dia: number) => compacto ? ((dia - 1) / (diasDelMes - 1)) * 300 : ((dia - 1) / (diasDelMes - 1)) * 600;

  const puntos = serie.map(p => `${x(p.dia)},${y(p.acumulado)}`).join(' L ');
  const dLine = `M ${puntos}`;
  
  const primerPunto = serie[0];
  const ultimoPunto = serie[serie.length - 1];
  const baseLineY = compacto ? 58 : 110;
  const dArea = `M ${x(primerPunto.dia)},${baseLineY} L ${puntos} L ${x(ultimoPunto.dia)},${baseLineY} Z`;

  return (
    <div className={`w-full relative select-none ${compacto ? 'h-[54px]' : 'h-[118px]'}`}>
      <svg viewBox={compacto ? "0 0 300 60" : "0 0 600 124"} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="gradienteAreaGasto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--acento)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Línea base */}
        <line x1="0" y1={baseLineY} x2={compacto ? "300" : "600"} y2={baseLineY} stroke="var(--linea)" strokeWidth="1" />

        {/* Área bajo la curva */}
        <path d={dArea} fill="url(#gradienteAreaGasto)" />

        {/* Línea de la curva */}
        <path d={dLine} fill="none" stroke="var(--acento)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Punto en el último día (solo no compacto) */}
        {!compacto && ultimoPunto && (
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
        <line x1="0" y1={compacto ? 8 : 20} x2={compacto ? "300" : "600"} y2={compacto ? 8 : 20} stroke="var(--texto-3)" strokeWidth="1" strokeDasharray="4 5" />
        
        {!compacto && (
          <>
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
          </>
        )}
      </svg>
    </div>
  );
};
