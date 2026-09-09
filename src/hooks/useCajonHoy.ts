/**
 * El cajón de "Hoy": la columna de acción que se abre y se cierra.
 *
 * Vive aquí y no dentro de una pantalla porque es mobiliario de toda la app:
 * el estado es global y se conserva al cambiar de sección.
 *
 * Tres anchos, tres comportamientos:
 *   >= 1280px  el cajón EMPUJA: la ventana se reacomoda y no se tapa nada.
 *   >= 768px   el cajón FLOTA sobre el contenido, con un velo detrás.
 *   <  768px   no existe: en móvil manda la barra inferior.
 */

import { useCallback, useEffect, useState } from 'react';

const CLAVE = 'bolsillo_cajon_hoy_v1';

/** Debajo de este ancho el cajón deja de empujar y pasa a flotar. */
export const ANCHO_EMPUJE = 1280;
/** Debajo de este ancho no hay cajón: estamos en la app móvil. */
export const ANCHO_MOVIL = 768;

function leerGuardado(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CLAVE) === 'abierto';
  } catch {
    return false;
  }
}

function anchoActual(): number {
  return typeof window === 'undefined' ? 1440 : window.innerWidth;
}

export interface CajonHoyControl {
  abierto: boolean;
  /** true cuando el cajón flota encima en vez de empujar. */
  flotante: boolean;
  abrir: () => void;
  cerrar: () => void;
  alternar: () => void;
}

export function useCajonHoy(): CajonHoyControl {
  // En pantallas estrechas nunca arranca abierto, aunque quedara así la última vez.
  const [abierto, setAbierto] = useState<boolean>(
    () => leerGuardado() && anchoActual() >= ANCHO_EMPUJE
  );
  // Dos umbrales, no el ancho exacto: así no re-renderizamos en cada píxel
  // mientras el usuario arrastra el borde de la ventana.
  const [flotante, setFlotante] = useState<boolean>(() => anchoActual() < ANCHO_EMPUJE);

  const cerrar = useCallback(() => setAbierto(false), []);
  const abrir = useCallback(() => setAbierto(true), []);
  const alternar = useCallback(() => setAbierto((v) => !v), []);

  // Recordar la preferencia solo cuando el cajón empuja: si lo abriste en una
  // ventana angosta fue algo puntual, no una preferencia.
  useEffect(() => {
    if (typeof window === 'undefined' || flotante) return;
    try {
      window.localStorage.setItem(CLAVE, abierto ? 'abierto' : 'cerrado');
    } catch {
      /* modo privado: seguimos sin recordar nada */
    }
  }, [abierto, flotante]);

  // Dos medias: cuándo deja de empujar, y cuándo entramos en móvil.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const empuja = window.matchMedia(`(min-width: ${ANCHO_EMPUJE}px)`);
    const escritorio = window.matchMedia(`(min-width: ${ANCHO_MOVIL}px)`);

    const alCambiarEmpuje = () => setFlotante(!empuja.matches);
    // En móvil el cajón no existe: si la ventana se encoge hasta ahí, se cierra.
    const alCambiarEscritorio = () => {
      if (!escritorio.matches) setAbierto(false);
    };

    alCambiarEmpuje();
    alCambiarEscritorio();
    empuja.addEventListener('change', alCambiarEmpuje);
    escritorio.addEventListener('change', alCambiarEscritorio);
    return () => {
      empuja.removeEventListener('change', alCambiarEmpuje);
      escritorio.removeEventListener('change', alCambiarEscritorio);
    };
  }, []);

  // H lo abre y lo cierra; Escape solo lo cierra.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const alTeclear = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement | null;
      const escribiendo =
        !!destino &&
        (destino.tagName === 'INPUT' ||
          destino.tagName === 'TEXTAREA' ||
          destino.tagName === 'SELECT' ||
          destino.isContentEditable);
      if (escribiendo || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        setAbierto(false);
        return;
      }
      if ((e.key === 'h' || e.key === 'H') && window.innerWidth >= ANCHO_MOVIL) {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  return { abierto, flotante, abrir, cerrar, alternar };
}
