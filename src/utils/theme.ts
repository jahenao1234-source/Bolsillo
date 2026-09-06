/**
 * Bolsillo - Gestor de Temas (Medianoche / Papel)
 * Persiste la selección en localStorage con la clave 'bolsillo:tema'
 */

import { useState, useEffect } from 'react';

export type TemaBolsillo = 'medianoche' | 'papel';

const TEMA_STORAGE_KEY = 'bolsillo:tema';
const EVENTO_CAMBIO_TEMA = 'bolsillo:cambio_tema';

export function getTemaGuardado(): TemaBolsillo {
  if (typeof window === 'undefined') return 'medianoche';
  try {
    const guardado = localStorage.getItem(TEMA_STORAGE_KEY);
    if (guardado === 'papel' || guardado === 'medianoche') {
      return guardado;
    }
  } catch {
    // Manejo de entornos sin acceso a localStorage
  }
  return 'medianoche';
}

export function aplicarTema(tema: TemaBolsillo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
  } catch {
    // Ignorar si localStorage no está disponible
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', tema);
  
  if (tema === 'papel') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO_TEMA, { detail: tema }));
}

export function inicializarTema(): void {
  aplicarTema(getTemaGuardado());
}

/**
 * Hook de React para usar y alternar el tema activo
 */
export function useTema() {
  const [tema, setTemaState] = useState<TemaBolsillo>(getTemaGuardado);

  useEffect(() => {
    // Asegurar que el atributo en el DOM coincida con el estado actual
    aplicarTema(tema);

    const handleCambio = (e: Event) => {
      const customEvent = e as CustomEvent<TemaBolsillo>;
      if (customEvent.detail) {
        setTemaState(customEvent.detail);
      } else {
        setTemaState(getTemaGuardado());
      }
    };

    window.addEventListener(EVENTO_CAMBIO_TEMA, handleCambio);
    window.addEventListener('storage', handleCambio);

    return () => {
      window.removeEventListener(EVENTO_CAMBIO_TEMA, handleCambio);
      window.removeEventListener('storage', handleCambio);
    };
  }, []);

  const cambiarTema = (nuevoTema: TemaBolsillo) => {
    setTemaState(nuevoTema);
    aplicarTema(nuevoTema);
  };

  const alternarTema = () => {
    const siguiente = tema === 'medianoche' ? 'papel' : 'medianoche';
    cambiarTema(siguiente);
  };

  return {
    tema,
    esPapel: tema === 'papel',
    esMedianoche: tema === 'medianoche',
    cambiarTema,
    alternarTema,
  };
}
