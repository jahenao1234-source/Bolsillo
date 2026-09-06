import React, { useId } from 'react';

export interface PuntoLinea {
  etiqueta: string;
  valor: number;
}

interface GraficoLineaProps {
  puntos: PuntoLinea[];
  color?: string;
  altura?: number;
  mensajeVacio?: string;
}

/**
 * Gráfico de área/línea ligero en SVG (sin librerías). Escala uniforme para que
 * el punto final quede redondo. Color y relleno usan el token que se le pase.
 */
export const GraficoLinea: React.FC<GraficoLineaProps> = ({
  puntos,
  color = 'var(--acento)',
  altura = 190,
  mensajeVacio = 'Aún no hay datos suficientes para la proyección.',
}) => {
  const gid = 'gl-' + useId().replace(/[^a-zA-Z0-9]/g, '');

  if (!puntos || puntos.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[color:var(--texto-3)] px-4 text-center"
        style={{ height: altura }}
      >
        {mensajeVacio}
      </div>
    );
  }

  const W = 640;
  const H = 200;
  const padX = 10;
  const padTop = 16;
  const padBottom = 8;

  const valores = puntos.map((p) => p.valor);
  const maxV = Math.max(...valores, 1);
  const minV = Math.min(...valores, 0);
  const rango = maxV - minV || 1;
  const n = puntos.length;

  const x = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  const y = (v: number) => padTop + (1 - (v - minV) / rango) * (H - padTop - padBottom);

  const linePath = puntos
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(H - padBottom).toFixed(1)} L${x(0).toFixed(
    1
  )},${(H - padBottom).toFixed(1)} Z`;

  const lastX = x(n - 1);
  const lastY = y(puntos[n - 1].valor);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', maxHeight: altura, display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Proyección de deuda"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.30" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={lastX} cy={lastY} r={5} fill={color} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-[color:var(--texto-3)] tabular-nums">
        <span>{puntos[0].etiqueta}</span>
        {n > 2 && <span>{puntos[Math.floor(n / 2)].etiqueta}</span>}
        <span>{puntos[n - 1].etiqueta}</span>
      </div>
    </div>
  );
};
