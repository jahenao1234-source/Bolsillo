/**
 * Bolsillo v3 — El sistema
 *
 * Todo Bolsillo es un solo movimiento: el traspaso. Cuando algo llega a su
 * meta, su plata no se queda quieta, pasa a lo siguiente. Primero de deuda en
 * deuda, después al colchón, después a crecer.
 *
 *   Salir de deudas  ->  Blindar (colchón de $1.000.000)  ->  Crecer
 *
 * Aquí vive la lógica pura que responde las tres preguntas que el cliente
 * siempre tiene que poder contestar: en qué fase está, qué hace este mes y a
 * dónde se va su plata cuando algo se completa. Sin React y sin almacenamiento.
 */

import { Deuda, Movimiento, Sobre, PerfilFlujo } from '../types';
import { calcularPlan, calcularFechaMesRelativo, ordenarDeudasSegunEstrategia } from './planDeudas';

/** La v3 enseña un solo método: bola de nieve. Menos opciones, más guía. */
export const ESTRATEGIA = 'bola_de_nieve' as const;

export const ID_BASICO_ARRIENDO = 'basico-arriendo';
export const ID_BASICO_MERCADO = 'basico-mercado';
export const ID_BASICO_SERVICIOS = 'basico-servicios';
export const ID_BASICO_TRANSPORTE = 'basico-transporte';
export const ID_SOBRE_COLCHON = 'sobre-colchon';
export const ID_SOBRE_INVERSION = 'sobre-inversion';
export const ID_LIBRE_GUSTOS = 'libre-gustos';

export const CATS_ARRIENDO = ['Arriendo', 'Vivienda'];
export const CATS_MERCADO = ['Comida', 'Mercado', 'Alimentación'];
export const CATS_SERVICIOS = ['Servicios'];
export const CATS_TRANSPORTE = ['Transporte'];
export const CATS_GUSTOS = ['Ocio', 'Gustos'];

export const HITO_FONDO = 1000000;
export const MODULOS_LISTOS = false;

export type Fase = 'salir' | 'blindar' | 'crecer';

const LIMITE_MESES = 360;

export const saldoDe = (d: Deuda): number => d.saldo ?? d.saldoTotal ?? 0;

export function deudasActivas(deudas: Deuda[]): Deuda[] {
  return deudas.filter((d) => !d.saldada && saldoDe(d) > 0);
}

// ==========================================
// TASAS
// ==========================================

/** 28 (% E.A.) -> 2,078 (% mensual). La gente conoce la E.A.; el motor calcula en mensual. */
export function mensualDesdeEA(ea: number): number {
  if (!ea || ea <= 0) return 0;
  return (Math.pow(1 + ea / 100, 1 / 12) - 1) * 100;
}

export function eaDesdeMensual(mensual: number): number {
  if (!mensual || mensual <= 0) return 0;
  return (Math.pow(1 + mensual / 100, 12) - 1) * 100;
}

// ==========================================
// FASE
// ==========================================

export function faseActual(deudas: Deuda[], sobres: Sobre[], gastosBasicos: number): Fase {
  if (deudasActivas(deudas).length > 0) return 'salir';
  const colchon = sobres.find((s) => s.id === ID_SOBRE_COLCHON);
  if (!colchon || colchon.apartado < metaFondoBlindado(gastosBasicos)) return 'blindar';
  return 'crecer';
}

// ==========================================
// QUÉ HAGO ESTE MES
// ==========================================

export interface PagoDelMes {
  deuda: Deuda;
  minimo: number;
  /** Lo que va por encima del mínimo. Solo la deuda del ataque lo recibe. */
  extra: number;
  monto: number;
  esFoco: boolean;
  /** Lo abonado a esta deuda en el mes en curso. */
  pagado: number;
  cumplido: boolean;
}

/**
 * Los pagos del mes, en el orden del plan. Mismo reparto que el motor: cada
 * deuda su mínimo, y lo que sobra de la caja va entero a la primera.
 */
export function pagosDelMes(
  deudas: Deuda[],
  caja: number,
  movimientos: Movimiento[] = [],
  hoy: Date = new Date()
): PagoDelMes[] {
  const orden = ordenarDeudasSegunEstrategia(deudas, ESTRATEGIA);
  const minimos = orden.reduce((a, d) => a + Math.min(d.pagoMinimo, saldoDe(d)), 0);
  let extra = Math.max(0, caja - minimos);

  return orden.map((deuda, i) => {
    const minimo = Math.min(deuda.pagoMinimo, saldoDe(deuda));
    const e = Math.min(extra, Math.max(0, saldoDe(deuda) - minimo));
    extra -= e;
    const monto = minimo + e;
    const pagado = abonadoEsteMes(deuda.id, movimientos, hoy);
    return { deuda, minimo, extra: e, monto, esFoco: i === 0, pagado, cumplido: monto > 0 && pagado >= monto };
  });
}

export function abonadoEsteMes(deudaId: string, movimientos: Movimiento[], hoy: Date = new Date()): number {
  return movimientos
    .filter((m) => m.deudaId === deudaId && m.creadoEn)
    .filter((m) => {
      const f = new Date(m.creadoEn as string);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    })
    .reduce((a, m) => a + m.monto, 0);
}

// ==========================================
// A DÓNDE SE VA LA PLATA: LA ESCALERA DEL ATAQUE
// ==========================================

export interface Escalon {
  deudaId: string;
  nombre: string;
  /** Lo que recibe esta deuda cada mes mientras es la del ataque. */
  monto: number;
  /** "Hoy" o el mes en que empieza a recibir el ataque. */
  desde: string;
  /** Mes en que queda en $0. */
  hasta: string;
  /** La cuota que libera al terminar y que pasa a la siguiente. */
  libera: number;
}

/**
 * Cómo crece el ataque: cada deuda, al caer, le pasa su cuota a la siguiente.
 * $400.000 -> $520.000 -> $970.000.
 */
export function escaleraAtaque(deudas: Deuda[], caja: number): Escalon[] {
  const activas = deudasActivas(deudas);
  const orden = ordenarDeudasSegunEstrategia(activas, ESTRATEGIA);
  const plan = calcularPlan(activas, caja, ESTRATEGIA);
  const minimos = orden.reduce((a, d) => a + d.pagoMinimo, 0);
  const extra = Math.max(0, caja - minimos);

  let liberado = 0;
  let mesInicio = 1;
  return orden.map((d) => {
    const saldado = plan.ordenSaldado.find((o) => o.id === d.id);
    const escalon: Escalon = {
      deudaId: d.id,
      nombre: d.nombre,
      monto: d.pagoMinimo + extra + liberado,
      desde: mesInicio <= 1 ? 'Hoy' : calcularFechaMesRelativo(mesInicio),
      hasta: saldado?.fechaEstimada ?? 'Sin fecha',
      libera: d.pagoMinimo,
    };
    liberado += d.pagoMinimo;
    mesInicio = Math.max(mesInicio, (saldado?.mesSaldado ?? mesInicio) + 1);
    return escalon;
  });
}

// ==========================================
// LA PROMESA: TU PLAN CONTRA SOLO MÍNIMOS
// ==========================================

interface Simulacion {
  /** Meses con fracción del último mes (10,95 = casi 11). */
  meses: number;
  intereses: number;
  /** Saldo total al cierre de cada mes. Índice 0 = hoy. */
  serie: number[];
  viable: boolean;
}

/**
 * Simulación mes a mes con la misma mecánica del motor.
 *
 * - 'plan': caja fija; lo que sobra tras los mínimos va a la primera deuda, y
 *   la cuota de la que cae pasa a la siguiente (el traspaso).
 * - 'minimos': cada deuda paga solo su mínimo. Cuando una termina, lo que
 *   sobra de su última cuota y su cuota de ahí en adelante se pierden. Es lo
 *   que pasa sin plan: la plata liberada se va en otra cosa.
 */
function simular(deudas: Deuda[], modo: 'plan' | 'minimos', cajaDelMes: (mes: number) => number = () => 0): Simulacion {
  const e = ordenarDeudasSegunEstrategia(deudasActivas(deudas), ESTRATEGIA).map((d) => ({
    s: saldoDe(d),
    t: (d.tasaMensual || 0) / 100,
    min: d.pagoMinimo,
  }));
  const total = () => Math.round(e.reduce((a, x) => a + Math.max(0, x.s), 0));
  const serie = [total()];
  let intereses = 0;

  for (let mes = 1; mes <= LIMITE_MESES; mes++) {
    if (!e.some((x) => x.s > 0.5)) return { meses: mes - 1, intereses, serie, viable: true };

    if (modo === 'minimos') {
      for (const x of e) if (x.s > 0.5) x.s -= Math.min(x.min, x.s);
    } else {
      let caja = cajaDelMes(mes);
      const inicial = caja;
      for (const x of e) {
        if (x.s <= 0.5) continue;
        const c = Math.min(x.min, x.s, caja);
        x.s -= c;
        caja -= c;
      }
      while (caja > 0.01) {
        const o = e.find((x) => x.s > 0.5);
        if (!o) break;
        const a = Math.min(caja, o.s);
        o.s -= a;
        caja -= a;
      }
      if (!e.some((x) => x.s > 0.5)) {
        serie.push(0);
        return { meses: mes - 1 + (inicial > 0 ? (inicial - caja) / inicial : 1), intereses, serie, viable: true };
      }
    }

    for (const x of e) {
      if (x.s > 0.5) {
        const i = x.s * x.t;
        x.s += i;
        intereses += i;
      } else {
        x.s = 0;
      }
    }
    serie.push(total());
  }
  return { meses: LIMITE_MESES, intereses, serie, viable: false };
}

export interface Comparacion {
  plan: { meses: number; fecha: string; intereses: number; viable: boolean };
  minimos: { meses: number; fecha: string; intereses: number; viable: boolean };
  mesesGanados: number;
  interesesAhorrados: number;
  seriePlan: number[];
  serieMinimos: number[];
}

export function compararConMinimos(deudas: Deuda[], caja: number): Comparacion {
  const activas = deudasActivas(deudas);
  const motor = calcularPlan(activas, caja, ESTRATEGIA);
  const plan = simular(activas, 'plan', () => caja);
  const min = simular(activas, 'minimos');
  const mesesMin = Math.ceil(min.meses - 1e-9);

  return {
    plan: {
      meses: motor.mesesTotales,
      fecha: motor.esViable ? calcularFechaMesRelativo(motor.mesesTotales) : 'Sin fecha',
      intereses: motor.interesesTotales,
      viable: motor.esViable,
    },
    minimos: {
      meses: mesesMin,
      fecha: min.viable ? calcularFechaMesRelativo(mesesMin) : 'Nunca',
      intereses: Math.round(min.intereses),
      viable: min.viable,
    },
    mesesGanados: Math.max(0, mesesMin - motor.mesesTotales),
    interesesAhorrados: Math.max(0, Math.round(min.intereses) - motor.interesesTotales),
    seriePlan: plan.serie,
    serieMinimos: min.serie,
  };
}

/** Cuántos días se corre la fecha de libertad si este mes el ataque pierde `exceso`. */
export function diasDeRetraso(deudas: Deuda[], caja: number, exceso: number): number {
  if (exceso <= 0 || deudasActivas(deudas).length === 0 || caja <= 0) return 0;
  const base = simular(deudas, 'plan', () => caja);
  const con = simular(deudas, 'plan', (mes) => (mes === 1 ? Math.max(0, caja - exceso) : caja));
  if (!base.viable || !con.viable) return 0;
  return Math.max(0, Math.round((con.meses - base.meses) * 30.4));
}

// ==========================================
// EL TECHO DE LA SEMANA
// ==========================================

/** Lo básico del mes repartido por semanas (52 al año). */
export function techoSemanal(gastosBasicos: number): number {
  return Math.round((gastosBasicos * 12) / 52 / 1000) * 1000;
}

export function inicioDeSemana(hoy: Date = new Date()): Date {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dia = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dia);
  return d;
}

/** Gastos de la semana en curso. Los abonos a deudas no cuentan: son el plan. */
export function gastoDeLaSemana(movimientos: Movimiento[], hoy: Date = new Date()): number {
  const desde = inicioDeSemana(hoy).getTime();
  return movimientos
    .filter((m) => m.tipo === 'gasto' && m.categoria !== 'Deudas' && !m.deudaId && m.creadoEn)
    .filter((m) => new Date(m.creadoEn as string).getTime() >= desde)
    .reduce((a, m) => a + m.monto, 0);
}

// ==========================================
// PRO: BLINDAR Y CRECER (BASE CERO)
// ==========================================

export function metaFondoBlindado(gastosBasicos: number): number {
  return 3 * gastosBasicos;
}

export function repartoBasicoSugerido(gastosBasicos: number) {
  const arriendo = Math.round(((900 / 2230) * gastosBasicos) / 1000) * 1000;
  const mercado = Math.round(((700 / 2230) * gastosBasicos) / 1000) * 1000;
  const servicios = Math.round(((350 / 2230) * gastosBasicos) / 1000) * 1000;
  const transporte = gastosBasicos - arriendo - mercado - servicios;
  return { arriendo, mercado, servicios, transporte };
}

export function gastadoDelMes(sobre: Sobre, movimientos: Movimiento[], hoy: Date = new Date()): number {
  return movimientos
    .filter((m) => m.tipo === 'gasto' && m.categoria !== 'Deudas' && !m.deudaId && m.creadoEn)
    .filter((m) => {
      const f = new Date(m.creadoEn as string);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    })
    .filter(
      (m) =>
        m.sobreId === sobre.id ||
        (!m.sobreId && sobre.categorias && sobre.categorias.includes(m.categoria))
    )
    .reduce((a, m) => a + m.monto, 0);
}

export function movidoEsteMes(sobre: Sobre, hoy: Date = new Date()): number {
  if (!sobre.historial) return 0;
  return sobre.historial
    .filter((h) => h.origen === 'aporte_mensual')
    .filter((h) => {
      const f = new Date(h.fecha);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    })
    .reduce((a, h) => a + h.monto, 0);
}

export function estadoBaseCero(perfil: PerfilFlujo | null, sobres: Sobre[], deudas: Deuda[]) {
  if (!perfil) return { ingreso: 0, basicosAsignado: 0, libre: 0, porAsignar: 0, deudasActivas: false };

  const basicosAsignado = sobres
    .filter((s) => s.grupo === 'basico')
    .reduce((a, s) => a + (s.presupuestoMensual || 0), 0);
  const tieneDeudas = deudasActivas(deudas).length > 0;
  const libre = tieneDeudas ? 0 : Math.max(0, perfil.ingresoMensual - basicosAsignado);
  const porAsignar = perfil.ingresoMensual - basicosAsignado - libre;

  return { ingreso: perfil.ingresoMensual, basicosAsignado, libre, porAsignar, deudasActivas: tieneDeudas };
}

export interface RepartoPro {
  colchon: number;
  inversion: number;
  gustos: number;
  total: number;
}

const aMiles = (n: number) => Math.round(n / 1000) * 1000;

/**
 * Cómo se reparte la plata que quedó libre. Gustos primero (sin culpa, para que
 * el sistema aguante), y el resto a partes iguales entre colchón e inversión.
 * Cuando el colchón se llena, su parte pasa a inversión: el mismo traspaso.
 */
export function repartoPro(libre: number, colchonApartado: number, metaFondo: number): RepartoPro {
  if (libre <= 0) return { colchon: 0, inversion: 0, gustos: 0, total: 0 };
  const gustos = aMiles(libre * 0.175);
  const resto = libre - gustos;
  const falta = Math.max(0, metaFondo - colchonApartado);
  const colchon = Math.min(aMiles(resto / 2), falta);
  return { colchon, inversion: resto - colchon, gustos, total: libre };
}

/** Mes en que el colchón queda completo aportando `aporte` al mes. */
export function fechaColchonCompleto(apartado: number, aporte: number, metaFondo: number): string {
  const falta = metaFondo - apartado;
  if (falta <= 0) return 'Completo';
  if (aporte <= 0) return 'Sin fecha';
  return calcularFechaMesRelativo(Math.ceil(falta / aporte));
}
