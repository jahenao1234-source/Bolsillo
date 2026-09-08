/**
 * Bolsillo — La escalera de ahorro
 *
 * Matemática pura de los retos. Un reto tiene tres perillas —lo que metes,
 * cuánto dura y a cuánto llegas— y fijando dos sale la tercera. Aquí están
 * las tres despejadas, más lo que hay que ver ANTES de comprometerse:
 * cuánto toca mes a mes y cuál va a ser el mes más duro.
 *
 * El escalado se define con dos números: con cuánto arrancas y cuánto le
 * subes cada semana. Si no se dice el incremento, es igual al arranque
 * (el clásico de las 52 semanas: 1.000, 2.000, 3.000...).
 */

import { RetoAhorro, TipoReto, ModoEscalado } from '../types';
import { MESES_ABREV, sumarDias, fechaISOLocal } from '../utils/fechas';

/** Los datos que definen la forma de un reto, sin su progreso. */
export interface PlanReto {
  tipo: TipoReto;
  /** Escalado: aporte de la primera semana. Fijo: el aporte de siempre. */
  aporteBase: number;
  /** Escalado: cuánto sube cada semana. */
  incremento: number;
  modo: ModoEscalado;
  semanasTotales: number;
}

export function incrementoDe(reto: Pick<RetoAhorro, 'aporteBase' | 'incremento'>): number {
  const inc = reto.incremento;
  return inc === undefined || inc === null ? reto.aporteBase : Math.max(0, inc);
}

export function modoDe(reto: Pick<RetoAhorro, 'modo'>): ModoEscalado {
  return reto.modo === 'al_reves' ? 'al_reves' : 'sube';
}

export function planDeReto(reto: RetoAhorro): PlanReto {
  return {
    tipo: reto.tipo,
    aporteBase: reto.aporteBase,
    incremento: incrementoDe(reto),
    modo: modoDe(reto),
    semanasTotales: reto.semanasTotales,
  };
}

// =====================================================================
// LAS TRES PERILLAS
// =====================================================================

/** Lo que toca apartar en una semana concreta (1-based). */
export function aporteDeSemanaPlan(plan: PlanReto, semana: number): number {
  if (plan.tipo !== 'escalado') return Math.max(0, Math.round(plan.aporteBase));

  const total = Math.max(1, plan.semanasTotales);
  const n = Math.min(Math.max(1, semana), total);
  const pasos = plan.modo === 'al_reves' ? total - n : n - 1;
  return Math.max(0, Math.round(plan.aporteBase + plan.incremento * pasos));
}

export function aporteDeSemana(reto: RetoAhorro, semana: number): number {
  return aporteDeSemanaPlan(planDeReto(reto), semana);
}

/**
 * Lo que junta la escalera completa. Da igual si sube o va al revés: es la
 * misma plata en distinto orden.
 */
export function totalDelPlan(plan: PlanReto): number {
  const n = Math.max(0, plan.semanasTotales);
  if (n === 0) return 0;
  if (plan.tipo !== 'escalado') return Math.round(n * plan.aporteBase);
  return Math.round(n * plan.aporteBase + (plan.incremento * n * (n - 1)) / 2);
}

/** ¿Cuántas semanas necesito para llegar a la meta? */
export function semanasParaMeta(
  aporteBase: number,
  incremento: number,
  meta: number,
  tope = 520
): number {
  if (meta <= 0) return 0;
  if (aporteBase <= 0 && incremento <= 0) return 0;

  if (incremento <= 0) {
    return Math.min(tope, Math.max(1, Math.ceil(meta / aporteBase)));
  }

  // (d/2)·n² + (a − d/2)·n − meta = 0
  const a = incremento / 2;
  const b = aporteBase - incremento / 2;
  const aprox = (-b + Math.sqrt(b * b + 4 * a * meta)) / (2 * a);

  let n = Math.max(1, Math.floor(aprox));
  const total = (semanas: number) =>
    semanas * aporteBase + (incremento * semanas * (semanas - 1)) / 2;

  while (n < tope && total(n) < meta) n++;
  while (n > 1 && total(n - 1) >= meta) n--;
  return n;
}

/**
 * ¿Qué escalera llega a la meta en ese plazo?
 *
 * Mueve el arranque y el incremento juntos —el clásico, donde la semana n
 * vale n veces el escalón—. Es la única forma de que la escalera escale sin
 * romperse: con el incremento clavado, los escalones solos ya se pasan de
 * metas pequeñas y el arranque tendría que ser negativo.
 *
 * Redondea el escalón hacia arriba (al múltiplo de 50) para no quedar corto.
 */
export function escaleraParaMeta(
  meta: number,
  semanas: number
): { arranque: number; incremento: number } {
  if (semanas <= 0 || meta <= 0) return { arranque: 0, incremento: 0 };
  const factor = semanas + (semanas * (semanas - 1)) / 2;
  const escalon = Math.max(100, Math.ceil(meta / factor / 50) * 50);
  return { arranque: escalon, incremento: escalon };
}

/** ¿Cuánto tengo que meter cada semana para llegar a la meta en ese plazo? */
export function aporteParaMeta(meta: number, semanas: number): number {
  if (semanas <= 0 || meta <= 0) return 0;
  // Redondeado hacia arriba al millar: cifras que una persona sí aparta.
  return Math.ceil(meta / semanas / 1000) * 1000;
}

// =====================================================================
// LA ESCALERA, MES A MES
// =====================================================================

export interface MesEscalera {
  anio: number;
  mes: number;
  /** "sep" */
  etiqueta: string;
  /** "sep 2027" */
  etiquetaLarga: string;
  monto: number;
  semanas: number;
}

export interface ResumenEscalera {
  total: number;
  meses: MesEscalera[];
  /** El mes que más duele. */
  pico: MesEscalera | null;
  primerMes: MesEscalera | null;
  promedioMes: number;
  aporteMinimo: number;
  aporteMaximo: number;
  /** Qué tajada del total cae en la segunda mitad del reto (0 a 1). */
  fraccionSegundaMitad: number;
  fechaFin: Date | null;
  /** El aporte fijo equivalente: la misma plata, repartida pareja. */
  equivalenteParejo: number;
}

/** Fecha del aporte de cada semana, contando desde el arranque. */
export function fechaDeSemana(inicio: Date, semana: number): Date {
  return sumarDias(inicio, (semana - 1) * 7);
}

/**
 * Reparte los aportes semanales en los meses del calendario en los que
 * realmente caen. Los meses con cinco semanas pesan más, y eso se ve.
 */
export function escaleraPorMes(plan: PlanReto, inicio: Date): MesEscalera[] {
  const meses: MesEscalera[] = [];
  const indice = new Map<string, number>();

  for (let semana = 1; semana <= plan.semanasTotales; semana++) {
    const fecha = fechaDeSemana(inicio, semana);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    const monto = aporteDeSemanaPlan(plan, semana);

    const pos = indice.get(clave);
    if (pos === undefined) {
      indice.set(clave, meses.length);
      meses.push({
        anio: fecha.getFullYear(),
        mes: fecha.getMonth(),
        etiqueta: MESES_ABREV[fecha.getMonth()],
        etiquetaLarga: `${MESES_ABREV[fecha.getMonth()]} ${fecha.getFullYear()}`,
        monto,
        semanas: 1,
      });
    } else {
      meses[pos].monto += monto;
      meses[pos].semanas += 1;
    }
  }

  return meses;
}

export function resumirEscalera(plan: PlanReto, inicio: Date): ResumenEscalera {
  const meses = escaleraPorMes(plan, inicio);
  const total = totalDelPlan(plan);
  const n = Math.max(0, plan.semanasTotales);

  let pico: MesEscalera | null = null;
  for (const m of meses) if (!pico || m.monto > pico.monto) pico = m;

  const primero = aporteDeSemanaPlan(plan, 1);
  const ultimo = aporteDeSemanaPlan(plan, n || 1);

  let segundaMitad = 0;
  const corte = Math.floor(n / 2);
  for (let s = corte + 1; s <= n; s++) segundaMitad += aporteDeSemanaPlan(plan, s);

  return {
    total,
    meses,
    pico,
    primerMes: meses[0] ?? null,
    promedioMes: meses.length > 0 ? Math.round(total / meses.length) : 0,
    aporteMinimo: Math.min(primero, ultimo),
    aporteMaximo: Math.max(primero, ultimo),
    fraccionSegundaMitad: total > 0 ? segundaMitad / total : 0,
    fechaFin: n > 0 ? fechaDeSemana(inicio, n) : null,
    equivalenteParejo: n > 0 ? Math.round(total / n) : 0,
  };
}

/** Fecha de arranque de un reto ya guardado. */
export function inicioDeReto(reto: RetoAhorro): Date {
  return fechaISOLocal(reto.creadoEn) ?? new Date();
}
