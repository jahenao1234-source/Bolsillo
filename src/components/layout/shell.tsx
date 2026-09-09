/**
 * La fontanería del shell.
 *
 * Cada pantalla necesita poner su título y sus botones en la barra de contexto,
 * que vive fuera de ella. Se resuelve con dos portales: App expone los huecos y
 * la pantalla los llena. Sin estado que suba ni efectos que se puedan enredar.
 *
 * De paso la pantalla se entera de si el cajón de Hoy está abierto, que es lo
 * que decide si su tercera columna sobra.
 */

import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

interface Shell {
  /** Hueco de la izquierda de la barra: rótulo, título y chips. */
  slotBarra: HTMLElement | null;
  /** Hueco de la derecha: los botones de la pantalla. */
  slotAcciones: HTMLElement | null;
  /** true solo cuando el cajón está abierto Y empuja (>=1280px). */
  cajonEmpuja: boolean;
}

const ContextoShell = createContext<Shell>({
  slotBarra: null,
  slotAcciones: null,
  cajonEmpuja: false,
});

export const ProveedorShell = ContextoShell.Provider;

export function useShell(): Shell {
  return useContext(ContextoShell);
}

/**
 * true cuando el cajón empuja: es lo que decide si la tercera columna sobra.
 * Si el cajón flota encima (ventana angosta) el contenido NO se reacomoda.
 */
export function useCajonEmpuja(): boolean {
  return useContext(ContextoShell).cajonEmpuja;
}

/** Lo que va a la izquierda de la barra de contexto. Solo escritorio. */
export const BarraTitulo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slotBarra } = useShell();
  return slotBarra ? createPortal(children, slotBarra) : null;
};

/** Los botones propios de la pantalla, a la derecha de la barra. Solo escritorio. */
export const BarraAcciones: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slotAcciones } = useShell();
  return slotAcciones ? createPortal(children, slotAcciones) : null;
};
