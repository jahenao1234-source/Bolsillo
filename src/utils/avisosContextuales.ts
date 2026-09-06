/**
 * Bolsillo - Gestor de Avisos Contextuales Just-in-Time
 * Permite mostrar un aviso relevante y recordar cuáles han sido descartados
 */

const STORAGE_KEY_AVISOS = 'bolsillo:avisos_descartados';

export function estaAvisoDescartado(idAviso: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AVISOS);
    if (!raw) return false;
    const descartados: string[] = JSON.parse(raw);
    return descartados.includes(idAviso);
  } catch {
    return false;
  }
}

export function descartarAviso(idAviso: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AVISOS);
    const descartados: string[] = raw ? JSON.parse(raw) : [];
    if (!descartados.includes(idAviso)) {
      descartados.push(idAviso);
      localStorage.setItem(STORAGE_KEY_AVISOS, JSON.stringify(descartados));
    }
  } catch {
    // Silencio en modo privado
  }
}
