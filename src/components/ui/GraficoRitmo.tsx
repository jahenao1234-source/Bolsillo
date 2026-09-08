import React from 'react';
import { formatearCOPCorto } from '../../utils/format';
import { PuntoRitmo } from '../../logic/resumenMes';

interface GraficoRitmoProps {
  /** Acumulado día a día del mes en curso (hasta hoy). */
  puntosMes: PuntoRitmo[];
  /** Acumulado día a día del mes pasado (completo). Vacío = sin comparativa. */
  puntosAnterior: PuntoRitmo[];
  /** Cierre estimado del mes con el ritmo actual. */
  proyeccion: number;
  diasDelMes: number;
  diasDelMesAnterior: number;
  diaActual: number;
  /** Nombre del mes pasado, para la etiqueta de la curva fantasma. */
  etiquetaAnterior: string;
  compacto?: boolean;
}

/** Escala redonda con 4 divisiones para el eje vertical. */
function escalaBonita(max: number): { tope: number; paso: number } {
  const objetivo = Math.max(1, max * 1.1);
  const magnitud = Math.pow(10, Math.floor(Math.log10(objetivo)));
  const candidatos = [1, 1.2, 1.6, 2, 2.4, 3.2, 4, 5, 6, 8, 10];
  for (const c of candidatos) {
    const tope = c * magnitud;
    if (tope >= objetivo) return { tope, paso: tope / 4 };
  }
  const tope = 10 * magnitud;
  return { tope, paso: tope / 4 };
}

/**
 * Curva de gasto acumulado del mes contra el mes pasado (línea fantasma)
 * y la proyección de cierre. Un solo gráfico que responde "¿voy rápido o lento?".
 */
export const GraficoRitmo: React.FC<GraficoRitmoProps> = ({
  puntosMes,
  puntosAnterior,
  proyeccion,
  diasDelMes,
  diasDelMesAnterior,
  diaActual,
  etiquetaAnterior,
  compacto = false,
}) => {
  const W = compacto ? 340 : 620;
  const H = compacto ? 156 : 250;
  const padIzq = compacto ? 44 : 58;
  const padDer = compacto ? 8 : 10;
  const padArriba = compacto ? 10 : 14;
  const padAbajo = compacto ? 26 : 36;

  const x0 = padIzq;
  const x1 = W - padDer;
  const y0 = padArriba;
  const y1 = H - padAbajo;
  const anchoUtil = x1 - x0;
  const altoUtil = y1 - y0;

  const cierreAnterior = puntosAnterior.length
    ? puntosAnterior[puntosAnterior.length - 1].acumulado
    : 0;
  const gastadoHoy = puntosMes.length ? puntosMes[puntosMes.length - 1].acumulado : 0;
  const { tope, paso } = escalaBonita(Math.max(proyeccion, cierreAnterior, gastadoHoy));

  // El mes pasado puede tener otra cantidad de días: se compara por avance del mes.
  const xDia = (dia: number, totalDias: number) =>
    x0 + (totalDias > 1 ? (dia - 1) / (totalDias - 1) : 0) * anchoUtil;
  const yValor = (valor: number) => y1 - Math.min(1, valor / tope) * altoUtil;

  const aPuntos = (puntos: PuntoRitmo[], totalDias: number) =>
    puntos.map((p) => `${xDia(p.dia, totalDias).toFixed(1)},${yValor(p.acumulado).toFixed(1)}`).join(' ');

  const hayAnterior = puntosAnterior.length > 1;
  const hayMes = puntosMes.length > 0;

  const xHoy = xDia(Math.max(1, diaActual), diasDelMes);
  const yHoy = yValor(gastadoHoy);
  const xFin = xDia(diasDelMes, diasDelMes);
  const yFin = yValor(proyeccion);

  const areaMes = hayMes
    ? `M${aPuntos(puntosMes, diasDelMes).split(' ').join(' L')} L${xHoy.toFixed(1)},${y1} L${x0},${y1} Z`
    : '';

  const lineas = [0, 1, 2, 3, 4].map((i) => ({
    valor: paso * i,
    y: yValor(paso * i),
  }));

  const fuente = 'Hanken Grotesk, sans-serif';
  const tamEje = compacto ? 9.5 : 10.5;
  const tamSerie = compacto ? 9.5 : 11;

  // Marcas del eje horizontal: inicio, hoy, un par de intermedias y el cierre.
  const marcasX = [1, Math.round(diasDelMes / 2), diasDelMes].filter(
    (d) => Math.abs(d - diaActual) > diasDelMes * 0.12
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      role="img"
      aria-label={`Gasto acumulado del mes: llevas ${formatearCOPCorto(gastadoHoy)} y a este ritmo cierras en ${formatearCOPCorto(proyeccion)}${hayAnterior ? `, contra ${formatearCOPCorto(cierreAnterior)} del mes pasado` : ''}.`}
    >
      <defs>
        <linearGradient id="ritmoFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--acento)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--acento)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rejilla y eje vertical */}
      <g stroke="var(--hairline)" strokeWidth="1" fill="none">
        {lineas.map((l) => (
          <line key={l.valor} x1={x0} y1={l.y} x2={x1} y2={l.y} />
        ))}
      </g>
      <g fill="var(--texto-3)" fontFamily={fuente} fontSize={tamEje} textAnchor="end">
        {lineas.map((l) => (
          <text key={l.valor} x={x0 - 8} y={l.y + 3.5}>
            {l.valor === 0 ? '$0' : formatearCOPCorto(l.valor)}
          </text>
        ))}
      </g>

      {/* Hoy */}
      <line
        x1={xHoy} y1={y0} x2={xHoy} y2={y1}
        stroke="var(--accion)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 4"
      />

      {/* Mes pasado (fantasma) */}
      {hayAnterior && (
        <>
          <polyline
            fill="none"
            stroke="var(--texto-3)"
            strokeWidth={compacto ? 1.4 : 1.6}
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={aPuntos(puntosAnterior, diasDelMesAnterior)}
          />
          <text
            x={x1 - 4}
            y={yValor(cierreAnterior) - 8}
            fill="var(--texto-2)"
            fontFamily={fuente}
            fontSize={tamSerie}
            fontWeight="600"
            textAnchor="end"
          >
            {etiquetaAnterior}
          </text>
        </>
      )}

      {/* Mes en curso */}
      {hayMes && (
        <>
          <path d={areaMes} fill="url(#ritmoFade)" />
          <polyline
            fill="none"
            stroke="var(--acento)"
            strokeWidth={compacto ? 2.4 : 2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={aPuntos(puntosMes, diasDelMes)}
          />
        </>
      )}

      {/* Proyección */}
      {diaActual < diasDelMes && (
        <>
          <line
            x1={xHoy} y1={yHoy} x2={xFin} y2={yFin}
            stroke="var(--acento)" strokeWidth={compacto ? 1.6 : 1.8}
            strokeDasharray="6 5" strokeLinecap="round" opacity="0.75"
          />
          <text
            x={x1 - 4}
            y={yFin + (hayAnterior && Math.abs(yFin - yValor(cierreAnterior)) < 22 ? 16 : -8)}
            fill="var(--acento)"
            fontFamily={fuente}
            fontSize={tamSerie}
            fontWeight="700"
            textAnchor="end"
          >
            a este ritmo
          </text>
          <circle cx={xFin} cy={yFin} r={compacto ? 3.4 : 4} fill="var(--superficie)" stroke="var(--acento)" strokeWidth="2" />
        </>
      )}

      {/* Punto de hoy */}
      {hayMes && (
        <>
          <circle cx={xHoy} cy={yHoy} r={compacto ? 6 : 7} fill="var(--acento)" opacity="0.2" />
          <circle cx={xHoy} cy={yHoy} r={compacto ? 3.2 : 3.8} fill="var(--acento)" />
        </>
      )}

      {/* Eje horizontal */}
      <g fill="var(--texto-3)" fontFamily={fuente} fontSize={tamEje}>
        {marcasX.map((d) => (
          <text
            key={d}
            x={xDia(d, diasDelMes)}
            y={y1 + (compacto ? 16 : 20)}
            textAnchor={d === 1 ? 'start' : d === diasDelMes ? 'end' : 'middle'}
          >
            {d}
          </text>
        ))}
        <text
          x={xHoy}
          y={y1 + (compacto ? 16 : 20)}
          textAnchor={xHoy < x0 + 28 ? 'start' : xHoy > x1 - 28 ? 'end' : 'middle'}
          fill="var(--accion)"
          fontWeight="700"
        >
          hoy · {diaActual}
        </text>
      </g>
    </svg>
  );
};
