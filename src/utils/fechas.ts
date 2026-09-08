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

export const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

/** Próxima vez que cae ese día del mes, contando desde hoy (hoy incluido). */
export function proximaFechaDeDia(diaDelMes: number, hoy: Date): Date {
  const dia = Math.min(31, Math.max(1, diaDelMes));
  const topeEsteMes = diasEnMes(hoy.getMonth(), hoy.getFullYear());

  if (Math.min(dia, topeEsteMes) >= hoy.getDate()) {
    return new Date(hoy.getFullYear(), hoy.getMonth(), Math.min(dia, topeEsteMes));
  }

  const mesSiguiente = hoy.getMonth() === 11 ? 0 : hoy.getMonth() + 1;
  const anioSiguiente = hoy.getMonth() === 11 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  const topeSiguiente = diasEnMes(mesSiguiente, anioSiguiente);
  return new Date(anioSiguiente, mesSiguiente, Math.min(dia, topeSiguiente));
}

/** El mismo día del mes anterior, recortado si ese mes es más corto. */
export function unMesAntes(fecha: Date): Date {
  const mes = fecha.getMonth() === 0 ? 11 : fecha.getMonth() - 1;
  const anio = fecha.getMonth() === 0 ? fecha.getFullYear() - 1 : fecha.getFullYear();
  return new Date(anio, mes, Math.min(fecha.getDate(), diasEnMes(mes, anio)));
}

/** Días enteros entre dos fechas (b − a). */
export function diferenciaEnDias(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** "el martes 15 de septiembre" — la fecha que una persona sí ubica. */
export function fechaConDiaSemana(fecha: Date): string {
  return `el ${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()} de ${MESES_NOMBRE[fecha.getMonth()].toLowerCase()}`;
}
