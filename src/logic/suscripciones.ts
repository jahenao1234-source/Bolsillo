/**
 * Bolsillo — Suscripciones: el ciclo y la promoción
 *
 * Este módulo no existe para contar lo que gastas: existe para que canceles
 * ANTES de que te cobren. Por eso todo gira alrededor de dos fechas — cuándo
 * se renueva y cuándo se acaba la promoción — y no alrededor del total.
 *
 * El 86% de la gente termina pagando algo que olvidó cancelar después de una
 * prueba gratis. La promoción no es un detalle del formulario: es el caso.
 */

import { Suscripcion } from '../types';
import {
  diasEnMes,
  diferenciaEnDias,
  fechaISOLocal,
  proximaFechaDeDia,
  unMesAntes,
} from '../utils/fechas';

/** Con cuántos días de anticipación se avisa. Tres es lo que alcanza a servir. */
export const DIAS_DE_AVISO = 3;

// =====================================================================
// PROMOCIÓN
// =====================================================================

export function finDePromo(sus: Suscripcion): Date | null {
  return sus.promo ? fechaISOLocal(sus.promo.hasta) : null;
}

export function inicioDePromo(sus: Suscripcion): Date | null {
  return sus.promo ? fechaISOLocal(sus.promo.desde) : null;
}

/** ¿La promoción sigue viva hoy? */
export function enPromo(sus: Suscripcion, hoy: Date): boolean {
  const fin = finDePromo(sus);
  return !!fin && fin > hoy;
}

/** Lo que te cuesta HOY: el precio de promoción si está vigente, si no el normal. */
export function montoVigente(sus: Suscripcion, hoy: Date): number {
  return enPromo(sus, hoy) ? Math.max(0, sus.promo!.monto) : Math.max(0, sus.monto);
}

/** Lo que va a costar cuando se acabe la promoción. */
export function montoNormal(sus: Suscripcion): number {
  return Math.max(0, sus.monto);
}

// =====================================================================
// EL CICLO
// =====================================================================

export interface CicloSuscripcion {
  /** Cuándo empezó este ciclo (el cobro anterior, o el inicio de la promo). */
  inicio: Date;
  /** Cuándo se renueva (o cuándo se acaba la promo). */
  fin: Date;
  totalDias: number;
  transcurridos: number;
  faltan: number;
  /** 0 a 100: qué tanto del ciclo ya pasó. */
  pct: number;
  /** true si lo que viene no es un cobro más, sino el fin de la promoción. */
  esFinDePromo: boolean;
}

export function cicloDe(sus: Suscripcion, hoy: Date): CicloSuscripcion {
  const finPromo = finDePromo(sus);
  const enPromocion = !!finPromo && finPromo > hoy;

  let inicio: Date;
  let fin: Date;

  if (enPromocion) {
    fin = finPromo!;
    inicio = inicioDePromo(sus) ?? unMesAntes(fin);
  } else {
    fin = proximaFechaDeDia(sus.diaCobro, hoy);
    inicio = unMesAntes(fin);
  }

  const totalDias = Math.max(1, diferenciaEnDias(inicio, fin));
  const transcurridos = Math.min(totalDias, Math.max(0, diferenciaEnDias(inicio, hoy)));

  return {
    inicio,
    fin,
    totalDias,
    transcurridos,
    faltan: Math.max(0, diferenciaEnDias(hoy, fin)),
    pct: Math.min(100, Math.max(0, (transcurridos / totalDias) * 100)),
    esFinDePromo: enPromocion,
  };
}

/** ¿Ya registraste el cobro que abrió este ciclo? */
export function cobradaEnEsteCiclo(sus: Suscripcion, hoy: Date): boolean {
  const ultimo = sus.ultimoCobro ? fechaISOLocal(sus.ultimoCobro) : null;
  if (!ultimo) return false;
  const ciclo = cicloDe(sus, hoy);
  return ultimo >= ciclo.inicio && ultimo <= hoy;
}

export type EstadoSuscripcion = 'pausada' | 'promo' | 'cobrada' | 'pendiente';

export function estadoDe(sus: Suscripcion, hoy: Date): EstadoSuscripcion {
  if (!sus.activa) return 'pausada';
  if (enPromo(sus, hoy)) return 'promo';
  return cobradaEnEsteCiclo(sus, hoy) ? 'cobrada' : 'pendiente';
}

/** ¿Está tan cerca que hay que avisar? */
export function esUrgente(sus: Suscripcion, hoy: Date): boolean {
  if (!sus.activa) return false;
  return cicloDe(sus, hoy).faltan <= DIAS_DE_AVISO;
}

// =====================================================================
// TOTALES
// =====================================================================

/** Lo que te sangran hoy, contando los precios de promoción vigentes. */
export function sangradoVigente(suscripciones: Suscripcion[], hoy: Date): number {
  return suscripciones
    .filter((s) => s.activa)
    .reduce((acc, s) => acc + montoVigente(s, hoy), 0);
}

/** Lo que te van a sangrar cuando se acaben todas las promociones. */
export function sangradoNormal(suscripciones: Suscripcion[]): number {
  return suscripciones.filter((s) => s.activa).reduce((acc, s) => acc + montoNormal(s), 0);
}

// =====================================================================
// AVISOS
// =====================================================================

export interface AvisoSuscripcion {
  sus: Suscripcion;
  ciclo: CicloSuscripcion;
  /** 'promo' pesa más que 'cobro': ahí es donde cambia el precio. */
  tipo: 'promo' | 'cobro';
  dias: number;
}

/**
 * Lo que se viene, de lo más urgente a lo menos. Las promociones van primero
 * a igualdad de días: un cobro conocido sorprende menos que uno que aparece.
 */
export function avisosDe(suscripciones: Suscripcion[], hoy: Date): AvisoSuscripcion[] {
  return suscripciones
    .filter((s) => s.activa)
    .map((sus) => {
      const ciclo = cicloDe(sus, hoy);
      return {
        sus,
        ciclo,
        tipo: ciclo.esFinDePromo ? ('promo' as const) : ('cobro' as const),
        dias: ciclo.faltan,
      };
    })
    .sort((a, b) => {
      if (a.dias !== b.dias) return a.dias - b.dias;
      if (a.tipo !== b.tipo) return a.tipo === 'promo' ? -1 : 1;
      return montoNormal(b.sus) - montoNormal(a.sus);
    });
}

/** El aviso que merece salir arriba de todo, si lo hay. */
export function avisoPrincipal(
  suscripciones: Suscripcion[],
  hoy: Date
): AvisoSuscripcion | null {
  const avisos = avisosDe(suscripciones, hoy);
  const urgentes = avisos.filter((a) => a.dias <= DIAS_DE_AVISO);
  // Una promo a punto de terminar manda, aunque haya un cobro más cerca.
  const promo = urgentes.find((a) => a.tipo === 'promo');
  return promo ?? urgentes[0] ?? null;
}

// =====================================================================
// PROMOCIONES: DURACIONES SUGERIDAS
// =====================================================================

export interface DuracionPromo {
  id: string;
  etiqueta: string;
  dias?: number;
  meses?: number;
}

export const DURACIONES_PROMO: DuracionPromo[] = [
  { id: '7d', etiqueta: '7 días', dias: 7 },
  { id: '14d', etiqueta: '14 días', dias: 14 },
  { id: '1m', etiqueta: '1 mes', meses: 1 },
  { id: '2m', etiqueta: '2 meses', meses: 2 },
  { id: '3m', etiqueta: '3 meses', meses: 3 },
];

/** Fecha en que termina una promoción que empieza en `desde`. */
export function finSegunDuracion(desde: Date, duracion: DuracionPromo): Date {
  if (duracion.dias) {
    return new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + duracion.dias);
  }
  const meses = duracion.meses ?? 1;
  const mes = desde.getMonth() + meses;
  const anio = desde.getFullYear() + Math.floor(mes / 12);
  const mesFinal = ((mes % 12) + 12) % 12;
  return new Date(anio, mesFinal, Math.min(desde.getDate(), diasEnMes(mesFinal, anio)));
}
