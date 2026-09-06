import React from 'react';

export interface SegmentoDonut {
  etiqueta: string;
  valor: number;
  color: string;
}

interface GraficoDonutProps {
  datos: SegmentoDonut[];
  tamano?: number;
  grosor?: number;
  children?: React.ReactNode;
}

/**
 * Donut ligero en SVG (sin librerías). Los segmentos se calculan a partir de
 * los valores; el color de cada uno lo define el llamador (paleta del sistema).
 */
export const GraficoDonut: React.FC<GraficoDonutProps> = ({
  datos,
  tamano = 120,
  grosor = 16,
  children,
}) => {
  const total = datos.reduce((a, d) => a + Math.max(0, d.valor), 0);
  const r = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * r;
  let acumulado = 0;

  return (
    <div className="relative flex-none" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke="var(--superficie-2)"
          strokeWidth={grosor}
        />
        {total > 0 &&
          datos.map((d, i) => {
            const frac = Math.max(0, d.valor) / total;
            if (frac <= 0) return null;
            const dash = frac * circ;
            const offset = -acumulado * circ;
            acumulado += frac;
            return (
              <circle
                key={i}
                cx={tamano / 2}
                cy={tamano / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={grosor}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={offset}
              />
            );
          })}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
};
