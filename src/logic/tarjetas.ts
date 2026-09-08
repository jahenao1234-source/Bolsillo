/**
 * Bolsillo — Tarjetas de crédito, a la colombiana
 *
 * Aquí vive lo que decide si una compra cuesta lo que dice el precio o casi
 * el doble. Tres preguntas, en el orden en que se hacen en la caja:
 *
 *   1. ¿Con cuál compro hoy?      -> diasSinInteresesDe()
 *   2. ¿A cuántas cuotas?          -> simularCuotas()
 *   3. ¿Cuánto tengo comprometido? -> cupoDeTarjeta() / costoDelMinimo()
 *
 * Reglas del país que la lógica respeta:
 * - A una cuota no se pagan intereses; desde dos, sí, y suben con el plazo.
 * - El uso del cupo pesa cerca del 30% del score en Datacrédito: bajo 30% es
 *   sano y sobre 70% baja el puntaje aunque uno pague todo cada mes.
 */

import { Deuda, TarjetaCredito } from '../types';
import { diferenciaEnDias, proximaFechaDeDia, sumarDias } from '../utils/fechas';

/** Tasa mensual de referencia en Colombia cuando la tarjeta no trae la suya. */
export const TASA_TARJETA_TIPICA = 2.1;

/** Umbrales de uso del cupo, según cómo los lee Datacrédito. */
export const CUPO_SANO = 30;
export const CUPO_RIESGO = 70;

/** Los plazos que ofrecen los datáfonos en Colombia. */
export const PLAZOS_CUOTAS = [1, 3, 6, 12, 24, 36];

export function tasaDeTarjeta(tc: TarjetaCredito, deuda?: Deuda | null): number {
  if (deuda && deuda.tasaMensual > 0) return deuda.tasaMensual;
  if (tc.tasaMensual && tc.tasaMensual > 0) return tc.tasaMensual;
  return TASA_TARJETA_TIPICA;
}

// =====================================================================
// 1. DÍAS SIN INTERESES
// =====================================================================

export interface CicloTarjeta {
  /** El próximo corte: el día en que el banco cierra la factura. */
  corte: Date;
  /** La fecha límite de pago de la factura que ya está cerrada. */
  pago: Date;
  diasAlCorte: number;
  diasAlPago: number;
  /** 0 a 100: qué tanto del ciclo de facturación ya pasó. */
  pct: number;
}

export function cicloDeTarjeta(tc: TarjetaCredito, hoy: Date): CicloTarjeta {
  const corte = proximaFechaDeDia(tc.diaCorte, hoy);
  const pago = proximaFechaDeDia(tc.diaPago, hoy);
  const inicio = sumarDias(corte, -30);
  const total = Math.max(1, diferenciaEnDias(inicio, corte));

  return {
    corte,
    pago,
    diasAlCorte: Math.max(0, diferenciaEnDias(hoy, corte)),
    diasAlPago: Math.max(0, diferenciaEnDias(hoy, pago)),
    pct: Math.min(100, Math.max(0, (diferenciaEnDias(inicio, hoy) / total) * 100)),
  };
}

export interface DiasSinIntereses {
  /** Días desde hoy hasta que hay que pagar lo que se compre hoy. */
  dias: number;
  /** El corte en el que cae la compra de hoy. */
  corte: Date;
  /** Hasta cuándo se puede pagar sin un peso de interés. */
  limite: Date;
  /** Lo máximo que da esta tarjeta, comprando el día después del corte. */
  maximo: number;
  /** Cuándo tocaría comprar para sacar ese máximo. */
  diaDelMaximo: Date;
}

/**
 * Una compra de hoy entra en la factura que cierra en el próximo corte, y esa
 * factura se paga en la primera fecha de pago posterior al corte.
 */
export function diasSinInteresesDe(tc: TarjetaCredito, hoy: Date): DiasSinIntereses {
  const calcular = (desde: Date) => {
    const corte = proximaFechaDeDia(tc.diaCorte, desde);
    const limite = proximaFechaDeDia(tc.diaPago, sumarDias(corte, 1));
    return { corte, limite, dias: diferenciaEnDias(desde, limite) };
  };

  const hoyMismo = calcular(hoy);
  const diaDelMaximo = sumarDias(hoyMismo.corte, 1);
  const optimo = calcular(diaDelMaximo);

  return {
    dias: hoyMismo.dias,
    corte: hoyMismo.corte,
    limite: hoyMismo.limite,
    maximo: optimo.dias,
    diaDelMaximo,
  };
}

/** La tarjeta que hoy da más plazo. */
export function mejorTarjetaHoy(
  tarjetas: TarjetaCredito[],
  hoy: Date
): { tc: TarjetaCredito; plazo: DiasSinIntereses } | null {
  const conPlazo = tarjetas.map((tc) => ({ tc, plazo: diasSinInteresesDe(tc, hoy) }));
  if (conPlazo.length === 0) return null;
  return conPlazo.sort((a, b) => b.plazo.dias - a.plazo.dias)[0];
}

// =====================================================================
// 2. EL CUPO
// =====================================================================

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * La deuda que corresponde a esta tarjeta. Se prefiere el vínculo explícito;
 * si no lo hay, se busca una deuda de tipo tarjeta que se llame igual, para
 * no obligar a escribir el saldo dos veces.
 */
export function deudaDeTarjeta(tc: TarjetaCredito, deudas: Deuda[]): Deuda | null {
  if (tc.deudaId) {
    const porId = deudas.find((d) => d.id === tc.deudaId);
    if (porId) return porId;
  }
  const nombre = normalizar(tc.nombre);
  return (
    deudas.find((d) => d.tipo === 'tarjeta' && !d.saldada && normalizar(d.nombre) === nombre) ?? null
  );
}

export type EstadoCupo = 'sano' | 'medio' | 'riesgo' | 'sin_datos';

export interface UsoDeCupo {
  cupo: number;
  usado: number;
  disponible: number;
  pct: number;
  estado: EstadoCupo;
  /** Cuánto habría que abonar para bajar del 30% recomendado. */
  paraBajarASano: number;
}

export function cupoDeTarjeta(tc: TarjetaCredito, deuda: Deuda | null): UsoDeCupo {
  const cupo = Math.max(0, tc.cupo ?? 0);
  const usado = Math.max(0, deuda ? deuda.saldo ?? deuda.saldoTotal ?? 0 : 0);
  const pct = cupo > 0 ? (usado / cupo) * 100 : 0;

  const estado: EstadoCupo =
    cupo <= 0 ? 'sin_datos' : pct >= CUPO_RIESGO ? 'riesgo' : pct > CUPO_SANO ? 'medio' : 'sano';

  return {
    cupo,
    usado,
    disponible: Math.max(0, cupo - usado),
    pct,
    estado,
    paraBajarASano: Math.max(0, Math.round(usado - (cupo * CUPO_SANO) / 100)),
  };
}

// =====================================================================
// 3. CUOTAS
// =====================================================================

/** Cuota mensual con amortización francesa. A una cuota no hay intereses. */
export function cuotaMensual(monto: number, tasaMensual: number, cuotas: number): number {
  if (monto <= 0 || cuotas <= 0) return 0;
  if (cuotas === 1) return monto;

  const i = tasaMensual / 100;
  if (i <= 0) return monto / cuotas;
  return (monto * i) / (1 - Math.pow(1 + i, -cuotas));
}

export interface OpcionCuotas {
  cuotas: number;
  cuota: number;
  total: number;
  /** Lo que se paga de más frente al precio de la vitrina. */
  extra: number;
  /** Ese "de más", en porcentaje del precio. */
  pctExtra: number;
}

export function simularCuotas(
  monto: number,
  tasaMensual: number,
  plazos: number[] = PLAZOS_CUOTAS
): OpcionCuotas[] {
  return plazos.map((cuotas) => {
    const cuota = Math.round(cuotaMensual(monto, tasaMensual, cuotas));
    const total = cuotas === 1 ? monto : cuota * cuotas;
    const extra = Math.max(0, total - monto);
    return {
      cuotas,
      cuota,
      total,
      extra,
      pctExtra: monto > 0 ? (extra / monto) * 100 : 0,
    };
  });
}

// =====================================================================
// 4. EL COSTO DE PAGAR SOLO EL MÍNIMO
// =====================================================================

export interface CostoDelMinimo {
  meses: number;
  pagado: number;
  intereses: number;
  saldoFinal: number;
  /** true si el mínimo ni siquiera cubre el interés: la deuda crece. */
  nuncaTermina: boolean;
}

export function costoDelMinimo(
  saldo: number,
  tasaMensual: number,
  minimo: number,
  meses = 12
): CostoDelMinimo {
  const i = tasaMensual / 100;
  let restante = Math.max(0, saldo);
  let intereses = 0;
  let pagado = 0;
  let mesesReales = 0;

  const primerInteres = restante * i;
  if (minimo <= primerInteres) {
    return {
      meses,
      pagado: minimo * meses,
      intereses: primerInteres * meses,
      saldoFinal: restante + (primerInteres - minimo) * meses,
      nuncaTermina: true,
    };
  }

  for (let m = 0; m < meses && restante > 0; m++) {
    const interes = restante * i;
    const abono = Math.min(minimo, restante + interes);
    intereses += interes;
    pagado += abono;
    restante = restante + interes - abono;
    mesesReales++;
  }

  return {
    meses: mesesReales,
    pagado: Math.round(pagado),
    intereses: Math.round(intereses),
    saldoFinal: Math.round(Math.max(0, restante)),
    nuncaTermina: false,
  };
}
