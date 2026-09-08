/**
 * Bolsillo — Utilidades de fecha compartidas.
 *
 * Viven aparte para que la lógica del mes (resumenMes) y la de los retos
 * puedan usarlas sin importarse entre sí.
 */

export const MESES_ABREV = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function diasEnMes(mes: number, anio: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Lee una fecha ISO respetando el día que se ve escrito.
 * "2026-07-01" a secas lo interpreta el navegador como UTC y en Colombia se
 * corre al 30 de junio; aquí se construye en hora local para evitarlo.
 */
export function fechaISOLocal(iso: string): Date | null {
  if (!iso) return null;
  const soloFecha = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soloFecha) {
    return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

export function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

/** "9 de marzo de 2027" — para decir con todas las letras cuándo se llega. */
export function fechaLarga(fecha: Date): string {
  return `${fecha.getDate()} de ${MESES_NOMBRE[fecha.getMonth()].toLowerCase()} de ${fecha.getFullYear()}`;
}

/** "mar 2027" — para etiquetas cortas. */
export function mesCorto(fecha: Date): string {
  return `${MESES_ABREV[fecha.getMonth()]} ${fecha.getFullYear()}`;
}
