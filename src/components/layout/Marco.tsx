/**
 * El marco: una sola superficie dividida por hairlines, en vez de ocho tarjetas
 * flotando. El borde vuelve a significar algo porque deja de repetirse.
 *
 * En móvil el marco se deshace: cada Zona vuelve a ser una tarjeta suelta y
 * todo se apila, que es como ya funcionaba. Nada de esto toca al móvil.
 */

import React from 'react';

interface MarcoProps {
  /** grid-template-columns de escritorio. Cambia cuando entra el cajón. */
  columnas: string;
  children: React.ReactNode;
  className?: string;
}

export const Marco: React.FC<MarcoProps> = ({ columnas, children, className = '' }) => (
  <div
    className={`marco flex flex-col gap-4 xl:gap-0 xl:flex-1 xl:min-h-0 xl:bg-[var(--superficie)] xl:border xl:border-[var(--linea)] xl:rounded-[15px] xl:overflow-hidden ${className}`}
    style={{ ['--cols' as string]: columnas }}
  >
    {children}
  </div>
);

/**
 * El orden solo vale en móvil: en escritorio las columnas van en el orden del
 * DOM, que es el que casa con las pistas del grid. Con `style={{order}}` se
 * aplicaba también en escritorio y las columnas salían cruzadas.
 */
const ORDEN_MOVIL: Record<number, string> = {
  1: 'order-1 xl:order-none',
  2: 'order-2 xl:order-none',
  3: 'order-3 xl:order-none',
  4: 'order-4 xl:order-none',
  5: 'order-5 xl:order-none',
  6: 'order-6 xl:order-none',
};

interface ColumnaProps {
  children: React.ReactNode;
  /** Orden mientras todo se apila en una sola columna (por debajo de 1280). */
  ordenMovil?: number;
  /**
   * Hairline a la derecha. Lo decide la pantalla y no el CSS porque una columna
   * puede ocultarse —la agenda cuando entra el cajón— y entonces la de al lado
   * dejaría una línea suelta contra el borde del marco.
   */
  borde?: boolean;
  className?: string;
}

export const Columna: React.FC<ColumnaProps> = ({
  children,
  ordenMovil,
  borde = false,
  className = '',
}) => (
  /*
   * @container: la columna es el marco de referencia de lo que lleva dentro.
   * Sin esto, un bloque con `sm:grid-cols-3` se pinta a tres columnas porque la
   * VENTANA mide 1440 —aunque la columna mida 320— y los textos se montan unos
   * sobre otros. Con container queries el bloque mira el ancho real que tiene.
   */
  <div
    className={`marco-col @container flex flex-col gap-4 xl:gap-0 min-w-0 xl:min-h-0 ${
      ordenMovil !== undefined ? ORDEN_MOVIL[ordenMovil] ?? '' : ''
    } ${borde ? 'xl:border-r xl:border-[var(--hairline)]' : ''} ${className}`}
  >
    {children}
  </div>
);

interface ZonaProps {
  children: React.ReactNode;
  /** La zona que se queda con el alto sobrante. Una por columna, no más. */
  crece?: boolean;
  /** Quita el padding: para listas y tablas que llegan hasta el borde. */
  sinPadding?: boolean;
  className?: string;
}

export const Zona: React.FC<ZonaProps> = ({
  children,
  crece = false,
  sinPadding = false,
  className = '',
}) => (
  <div
    className={`
      rounded-2xl border border-[var(--linea)] bg-[var(--superficie)]
      xl:rounded-none xl:border-0 xl:border-b xl:border-[var(--hairline)] xl:bg-transparent
      ${sinPadding ? 'p-0' : 'p-4 xl:px-[17px] xl:py-[13px]'}
      ${crece ? 'xl:flex-1 xl:min-h-0 xl:flex xl:flex-col' : 'xl:flex-none'}
      ${className}
    `}
  >
    {children}
  </div>
);

/** Lo que scrollea dentro de una zona: la lista larga, la tabla de 14 meses. */
export const Scroll: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`xl:overflow-y-auto xl:min-h-0 xl:flex-1 scroll-fino ${className}`}>
    {children}
  </div>
);

/** El zócalo: los frentes como rieles idénticos bajo el marco. */
export const Zocalo: React.FC<{ children: React.ReactNode; columnas?: number }> = ({
  children,
  columnas = 6,
}) => (
  <div
    className="hidden xl:grid gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-xl overflow-hidden flex-none"
    style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
  >
    {children}
  </div>
);
