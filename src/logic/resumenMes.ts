/**
 * Bolsillo — "El mes de tu plata"
 *
 * Lógica pura detrás de la pantalla Inicio. Responde, en orden, el hilo del mes:
 *   1. ¿Cuánto entró y a dónde va?      -> calcularReparto()
 *   2. ¿Voy rápido o lento?             -> calcularRitmo()
 *   3. ¿Qué se me viene?                -> calcularAgenda()
 *
 * No toca almacenamiento ni React: recibe los datos y devuelve cifras listas para pintar.
 */

import {
  Deuda,
  Movimiento,
  RetoAhorro,
  Suscripcion,
  TarjetaCredito,
} from '../types';

import {
  MESES_ABREV,
  MESES_NOMBRE,
  diasEnMes,
  fechaISOLocal,
  mismoDia,
  proximaFechaDeDia,
} from '../utils/fechas';
import { aporteDeSemana, escaleraPorMes, planDeReto } from './retos';
import { finDePromo, montoVigente } from './suscripciones';

export { MESES_ABREV, MESES_NOMBRE, fechaISOLocal, proximaFechaDeDia };

/** Azul de categorías del sistema (mismo de los donuts). */
export const COLOR_TARJETA = '#8AA9FF';

// =====================================================================
// CONTEXTO DEL MES
// =====================================================================

export interface ContextoMes {
  hoy: Date;
  dia: number;
  diasDelMes: number;
  diasRestantes: number;
  mes: number;
  anio: number;
  abrev: string;
  nombre: string;
  mesAnterior: number;
  anioAnterior: number;
  abrevAnterior: string;
  nombreAnterior: string;
  diasDelMesAnterior: number;
}

export function getContextoMes(ref: Date = new Date()): ContextoMes {
  const hoy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  const diasDelMes = diasEnMes(mes, anio);
  const dia = hoy.getDate();

  const mesAnterior = mes === 0 ? 11 : mes - 1;
  const anioAnterior = mes === 0 ? anio - 1 : anio;

  return {
    hoy,
    dia,
    diasDelMes,
    diasRestantes: Math.max(0, diasDelMes - dia),
    mes,
    anio,
    abrev: MESES_ABREV[mes],
    nombre: MESES_NOMBRE[mes],
    mesAnterior,
    anioAnterior,
    abrevAnterior: MESES_ABREV[mesAnterior],
    nombreAnterior: MESES_NOMBRE[mesAnterior],
    diasDelMesAnterior: diasEnMes(mesAnterior, anioAnterior),
  };
}

// =====================================================================
// FECHAS
// =====================================================================

/**
 * Fecha real de un movimiento. Prefiere `creadoEn` (ISO) y cae al texto
 * legible que guardan los modales ("02 sep 2026").
 */
export function fechaDeMovimiento(m: Movimiento): Date | null {
  if (m.creadoEn) {
    const d = fechaISOLocal(m.creadoEn);
    if (d) return d;
  }
  return fechaDeTexto(m.fecha);
}

/** Convierte "15 sep 2026" o "15 sep" en una fecha. */
export function fechaDeTexto(texto?: string, anioPorDefecto?: number): Date | null {
  if (!texto) return null;
  const limpio = texto.toLowerCase().trim();
  const match = limpio.match(/(\d{1,2})\s*(?:de\s+)?([a-záéíóúñ]{3,})\.?\s*(\d{4})?/);
  if (!match) return null;

  const dia = parseInt(match[1], 10);
  const mesIdx = MESES_ABREV.findIndex((abrev) => match[2].startsWith(abrev));
  if (mesIdx < 0 || !dia) return null;

  const anio = match[3] ? parseInt(match[3], 10) : anioPorDefecto ?? new Date().getFullYear();
  return new Date(anio, mesIdx, dia);
}

/** Extrae solo el día del mes de un texto ("15 sep" -> 15). */
export function diaDeTexto(texto?: string): number | null {
  if (!texto) return null;
  const match = texto.match(/(\d{1,2})/);
  if (!match) return null;
  const dia = parseInt(match[1], 10);
  return dia >= 1 && dia <= 31 ? dia : null;
}


// =====================================================================
// MOVIMIENTOS
// =====================================================================

/** ¿Este movimiento es un gasto "de verdad"? (los abonos a deuda van aparte). */
export function esGastoCorriente(m: Movimiento): boolean {
  if (m.tipo !== 'gasto') return false;
  if (m.deudaId) return false;
  return (m.categoria || '').toLowerCase() !== 'deudas';
}

export function esPagoDeDeuda(m: Movimiento): boolean {
  if (m.tipo === 'pago_deuda') return true;
  return m.tipo === 'gasto' && (!!m.deudaId || (m.categoria || '').toLowerCase() === 'deudas');
}

export function movimientosDelMes(
  movimientos: Movimiento[],
  mes: number,
  anio: number
): Movimiento[] {
  return movimientos.filter((m) => {
    const f = fechaDeMovimiento(m);
    return !!f && f.getMonth() === mes && f.getFullYear() === anio;
  });
}

function sumar(movs: Movimiento[]): number {
  return movs.reduce((acc, m) => acc + Math.abs(Number(m.monto) || 0), 0);
}

// =====================================================================
// 1. REPARTO DEL MES — ¿a dónde va lo que entró?
// =====================================================================

export type IdDestino = 'deudas' | 'gastos' | 'guardado' | 'libre';

export interface DestinoReparto {
  id: IdDestino;
  nombre: string;
  monto: number;
  /** Porcentaje sobre lo que entró (0-100). */
  porcentaje: number;
  color: string;
  detalle: string;
  /** Diferencia contra el mes pasado. null si no hay con qué comparar. */
  delta: number | null;
  /** true si que la cifra suba es buena noticia. */
  subirEsBueno: boolean;
}

export interface Reparto {
  /** Lo que se espera que entre en el mes completo (base de los porcentajes). */
  entro: number;
  /** Lo que ya llegó a las billeteras. */
  entroRecibido: number;
  entroAnterior: number;
  deltaEntro: number | null;
  destinos: DestinoReparto[];
  libre: number;
  porDia: number;
  diasRestantes: number;
  hayAnterior: boolean;
  /** Suma de gastos ya registrados este mes (sin proyección). */
  gastadoHastaHoy: number;
  gastosProyectados: number;
}

export interface EntradaReparto {
  contexto: ContextoMes;
  movimientos: Movimiento[];
  deudas: Deuda[];
  disponibleMensual: number;
  suscripciones: Suscripcion[];
  retos: RetoAhorro[];
  esPro: boolean;
}

/**
 * Suscripciones ya cobradas y por cobrar en el mes en curso, contando el
 * precio que está vigente hoy (el de promoción, si la hay).
 */
export function suscripcionesDelMes(
  suscripciones: Suscripcion[],
  contexto: ContextoMes,
  esPro: boolean
): { yaCobradas: number; pendientes: number } {
  const activas = esPro ? suscripciones.filter((s) => s.activa) : [];
  const monto = (s: Suscripcion) => montoVigente(s, contexto.hoy);
  return {
    yaCobradas: activas
      .filter((s) => s.diaCobro <= contexto.dia)
      .reduce((acc, s) => acc + monto(s), 0),
    pendientes: activas
      .filter((s) => s.diaCobro > contexto.dia)
      .reduce((acc, s) => acc + monto(s), 0),
  };
}

/**
 * Cierre estimado del mes.
 *
 * Con un mes pasado completo la proyección usa su *forma*: lo que falta cuesta
 * lo que costó entonces, ajustado por lo suave o cargado que vengas. Es mucho
 * más fiel que estirar una recta, porque los gastos fijos caen a principio de
 * mes y una recta los repetiría treinta veces.
 *
 * Sin comparativa cae al ritmo diario de lo variable más lo que ya tiene fecha.
 */
export function proyectarCierre(entrada: {
  contexto: ContextoMes;
  acumuladoHoy: number;
  acumuladoAnteriorMismoDia: number;
  cierreAnterior: number;
  fijoYaOcurrido?: number;
  fijoPendiente?: number;
}): number {
  const { contexto, acumuladoHoy, acumuladoAnteriorMismoDia, cierreAnterior } = entrada;
  const fijoYaOcurrido = entrada.fijoYaOcurrido ?? 0;
  const fijoPendiente = entrada.fijoPendiente ?? 0;

  if (contexto.diasRestantes <= 0) return Math.round(acumuladoHoy);

  if (cierreAnterior > 0 && acumuladoAnteriorMismoDia > 0) {
    const restoAnterior = Math.max(0, cierreAnterior - acumuladoAnteriorMismoDia);
    const factor = Math.min(2, Math.max(0.5, acumuladoHoy / acumuladoAnteriorMismoDia));
    return Math.round(acumuladoHoy + restoAnterior * factor);
  }

  const variable = Math.max(0, acumuladoHoy - fijoYaOcurrido);
  const ritmoDiario = contexto.dia > 0 ? variable / contexto.dia : 0;
  return Math.round(acumuladoHoy + ritmoDiario * contexto.diasRestantes + fijoPendiente);
}

/** Aportes del reto que caen dentro del mes indicado. */
export function guardadoDelMes(
  retos: RetoAhorro[],
  mes: number,
  anio: number,
  esPro: boolean
): number {
  if (!esPro) return 0;

  // En el escalado cada semana vale distinto, así que se suman los aportes
  // reales que caen en ese mes, no un aporte promedio por el número de semanas.
  return retos
    .filter((r) => !r.completado)
    .reduce((acc, reto) => {
      const inicio = fechaISOLocal(reto.creadoEn);
      if (!inicio) return acc;

      const delMes = escaleraPorMes(planDeReto(reto), inicio).find(
        (m) => m.mes === mes && m.anio === anio
      );
      return acc + (delMes ? delMes.monto : 0);
    }, 0);
}

/**
 * Lo que entra en el mes: lo ya recibido, y lo que se espera al cierre.
 *
 * A mitad de mes solo ha llegado media quincena; comparar eso contra un mes
 * entero de gastos deja todo en rojo sin motivo. La proyección suma lo que el
 * mes pasado dice que todavía falta por llegar.
 */
export function ingresoDelMes(
  movimientos: Movimiento[],
  contexto: ContextoMes
): { recibido: number; proyectado: number; anterior: number } {
  const esIngreso = (m: Movimiento) => m.tipo === 'ingreso';

  const recibido = sumar(movimientosDelMes(movimientos, contexto.mes, contexto.anio).filter(esIngreso));
  const delAnterior = movimientosDelMes(movimientos, contexto.mesAnterior, contexto.anioAnterior);
  const anterior = sumar(delAnterior.filter(esIngreso));
  const anteriorMismoDia = sumar(
    delAnterior.filter((m) => {
      const f = fechaDeMovimiento(m);
      return esIngreso(m) && !!f && f.getDate() <= contexto.dia;
    })
  );

  return {
    recibido,
    anterior,
    proyectado: anterior > 0 ? recibido + Math.max(0, anterior - anteriorMismoDia) : recibido,
  };
}

export function calcularReparto(entrada: EntradaReparto): Reparto {
  const { contexto, movimientos, deudas, disponibleMensual, suscripciones, retos, esPro } = entrada;

  const delMes = movimientosDelMes(movimientos, contexto.mes, contexto.anio);
  const delAnterior = movimientosDelMes(movimientos, contexto.mesAnterior, contexto.anioAnterior);

  const hastaHoy = (m: Movimiento) => {
    const f = fechaDeMovimiento(m);
    return !!f && f.getDate() <= contexto.dia;
  };

  const ingreso = ingresoDelMes(movimientos, contexto);
  const entroRecibido = ingreso.recibido;
  const entroAnterior = ingreso.anterior;
  const hayAnterior = delAnterior.length > 0;
  const entro = ingreso.proyectado;

  // --- Deudas: lo que ya pagaste o lo que tu plan les destina, lo que sea mayor.
  const saldoActivo = deudas
    .filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0)
    .reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0);

  const pagadoADeudas = sumar(delMes.filter(esPagoDeDeuda));
  const pagadoADeudasAnterior = sumar(delAnterior.filter(esPagoDeDeuda));
  const planDeudas = Math.min(disponibleMensual, saldoActivo + pagadoADeudas);
  const montoDeudas = Math.max(pagadoADeudas, planDeudas);

  // --- Gastos: lo corriente del mes, proyectado al cierre.
  const gastadoHastaHoy = sumar(delMes.filter(esGastoCorriente));
  const gastosAnterior = sumar(delAnterior.filter(esGastoCorriente));
  const gastosAnteriorMismoDia = sumar(delAnterior.filter((m) => esGastoCorriente(m) && hastaHoy(m)));
  const suscripciones30 = suscripcionesDelMes(suscripciones, contexto, esPro);
  const proyeccion = proyectarCierre({
    contexto,
    acumuladoHoy: gastadoHastaHoy,
    acumuladoAnteriorMismoDia: gastosAnteriorMismoDia,
    cierreAnterior: gastosAnterior,
    fijoYaOcurrido: suscripciones30.yaCobradas,
    fijoPendiente: suscripciones30.pendientes,
  });

  // --- Guardado: los aportes del reto que caen en el mes.
  const montoGuardado = guardadoDelMes(retos, contexto.mes, contexto.anio, esPro);
  const guardadoAnterior = guardadoDelMes(retos, contexto.mesAnterior, contexto.anioAnterior, esPro);

  const libre = entro - montoDeudas - proyeccion - montoGuardado;
  const libreAnterior = entroAnterior - pagadoADeudasAnterior - gastosAnterior - guardadoAnterior;

  const pct = (valor: number) => (entro > 0 ? Math.max(0, (valor / entro) * 100) : 0);

  const destinos: DestinoReparto[] = [
    {
      id: 'deudas',
      nombre: 'Deudas',
      monto: montoDeudas,
      porcentaje: pct(montoDeudas),
      color: 'var(--alerta)',
      detalle: pagadoADeudas > 0 ? 'lo que les metes este mes' : 'lo que tu plan les destina',
      delta: hayAnterior ? montoDeudas - pagadoADeudasAnterior : null,
      subirEsBueno: true,
    },
    {
      id: 'gastos',
      nombre: 'Gastos',
      monto: proyeccion,
      porcentaje: pct(proyeccion),
      color: 'var(--acento)',
      detalle: 'lo corriente del mes',
      delta: hayAnterior ? proyeccion - gastosAnterior : null,
      subirEsBueno: false,
    },
  ];

  if (montoGuardado > 0 || guardadoAnterior > 0) {
    destinos.push({
      id: 'guardado',
      nombre: 'Guardado',
      monto: montoGuardado,
      porcentaje: pct(montoGuardado),
      color: 'var(--positivo)',
      detalle: 'aportes de tu reto',
      delta: hayAnterior ? montoGuardado - guardadoAnterior : null,
      subirEsBueno: true,
    });
  }

  destinos.push({
    id: 'libre',
    nombre: 'Te queda libre',
    monto: libre,
    porcentaje: pct(Math.max(0, libre)),
    color: 'var(--accion)',
    detalle: 'todavía sin dueño',
    delta: hayAnterior ? libre - libreAnterior : null,
    subirEsBueno: true,
  });

  return {
    entro,
    entroRecibido,
    entroAnterior,
    deltaEntro: hayAnterior ? entro - entroAnterior : null,
    destinos,
    libre,
    porDia: contexto.diasRestantes > 0 ? libre / contexto.diasRestantes : libre,
    diasRestantes: contexto.diasRestantes,
    hayAnterior,
    gastadoHastaHoy,
    gastosProyectados: proyeccion,
  };
}

// =====================================================================
// 2. RITMO DE GASTO — ¿voy más rápido que el mes pasado?
// =====================================================================

export interface PuntoRitmo {
  dia: number;
  acumulado: number;
}

export interface Ritmo {
  puntosMes: PuntoRitmo[];
  puntosAnterior: PuntoRitmo[];
  gastadoHoy: number;
  gastadoAnteriorMismoDia: number;
  cierreAnterior: number;
  proyeccion: number;
  diferenciaHoy: number;
  diferenciaCierre: number;
  hayAnterior: boolean;
  maximo: number;
  diasDelMes: number;
  diasDelMesAnterior: number;
}

function acumuladoPorDia(
  movimientos: Movimiento[],
  mes: number,
  anio: number,
  diasDelMes: number,
  hastaDia: number
): PuntoRitmo[] {
  const porDia = new Array<number>(diasDelMes + 1).fill(0);

  for (const m of movimientos) {
    if (!esGastoCorriente(m)) continue;
    const f = fechaDeMovimiento(m);
    if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) continue;
    const d = Math.min(diasDelMes, Math.max(1, f.getDate()));
    porDia[d] += Math.abs(Number(m.monto) || 0);
  }

  const puntos: PuntoRitmo[] = [];
  let acumulado = 0;
  for (let d = 1; d <= Math.min(hastaDia, diasDelMes); d++) {
    acumulado += porDia[d];
    puntos.push({ dia: d, acumulado });
  }
  return puntos;
}

export function calcularRitmo(entrada: {
  contexto: ContextoMes;
  movimientos: Movimiento[];
  suscripciones: Suscripcion[];
  esPro: boolean;
}): Ritmo {
  const { contexto, movimientos, suscripciones, esPro } = entrada;

  const puntosMes = acumuladoPorDia(
    movimientos, contexto.mes, contexto.anio, contexto.diasDelMes, contexto.dia
  );
  const puntosAnterior = acumuladoPorDia(
    movimientos, contexto.mesAnterior, contexto.anioAnterior,
    contexto.diasDelMesAnterior, contexto.diasDelMesAnterior
  );

  const gastadoHoy = puntosMes.length ? puntosMes[puntosMes.length - 1].acumulado : 0;
  const enAnterior = puntosAnterior.find((p) => p.dia === contexto.dia);
  const gastadoAnteriorMismoDia = enAnterior ? enAnterior.acumulado : 0;
  const cierreAnterior = puntosAnterior.length
    ? puntosAnterior[puntosAnterior.length - 1].acumulado
    : 0;

  const suscripciones30 = suscripcionesDelMes(suscripciones, contexto, esPro);
  const proyeccion = proyectarCierre({
    contexto,
    acumuladoHoy: gastadoHoy,
    acumuladoAnteriorMismoDia: gastadoAnteriorMismoDia,
    cierreAnterior,
    fijoYaOcurrido: suscripciones30.yaCobradas,
    fijoPendiente: suscripciones30.pendientes,
  });

  return {
    puntosMes,
    puntosAnterior,
    gastadoHoy,
    gastadoAnteriorMismoDia,
    cierreAnterior,
    proyeccion,
    diferenciaHoy: gastadoAnteriorMismoDia - gastadoHoy,
    diferenciaCierre: cierreAnterior - proyeccion,
    hayAnterior: cierreAnterior > 0,
    maximo: Math.max(proyeccion, cierreAnterior, gastadoHoy, 1),
    diasDelMes: contexto.diasDelMes,
    diasDelMesAnterior: contexto.diasDelMesAnterior,
  };
}

// =====================================================================
// 3. AGENDA — ¿qué se me viene?
// =====================================================================

export type OrigenEvento = 'deuda' | 'suscripcion' | 'promo' | 'corte' | 'pago_tarjeta' | 'reto';

export interface EventoAgenda {
  id: string;
  fecha: Date;
  dia: number;
  mesAbrev: string;
  esHoy: boolean;
  titulo: string;
  detalle: string;
  /** 0 = no hay plata de por medio (ej: cierre de corte). */
  monto: number;
  color: string;
  origen: OrigenEvento;
  deudaId?: string;
}

/** Próximo aporte semanal de un reto, contado desde el día que lo creaste. */
export function proximoAporteReto(reto: RetoAhorro, hoy: Date): Date | null {
  const inicio = fechaISOLocal(reto.creadoEn);
  if (!inicio) return null;

  const base = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const dias = Math.floor((hoy.getTime() - base.getTime()) / 86400000);
  const semanas = dias >= 0 ? Math.ceil(dias / 7) : 0;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + semanas * 7);
}

export function calcularAgenda(entrada: {
  contexto: ContextoMes;
  deudas: Deuda[];
  suscripciones: Suscripcion[];
  tarjetas: TarjetaCredito[];
  retos: RetoAhorro[];
  esPro: boolean;
  ventanaDias?: number;
}): EventoAgenda[] {
  const { contexto, deudas, suscripciones, tarjetas, retos, esPro } = entrada;
  const ventana = entrada.ventanaDias ?? 14;
  const hoy = contexto.hoy;
  const limite = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + ventana);

  const eventos: EventoAgenda[] = [];

  const agregar = (
    id: string,
    fecha: Date | null,
    titulo: string,
    detalle: string,
    monto: number,
    color: string,
    origen: OrigenEvento,
    deudaId?: string
  ) => {
    if (!fecha || fecha < hoy || fecha > limite) return;
    eventos.push({
      id,
      fecha,
      dia: fecha.getDate(),
      mesAbrev: MESES_ABREV[fecha.getMonth()],
      esHoy: mismoDia(fecha, hoy),
      titulo,
      detalle,
      monto,
      color,
      origen,
      deudaId,
    });
  };

  // --- Deudas activas: su pago del mes.
  for (const deuda of deudas) {
    const saldo = deuda.saldo ?? deuda.saldoTotal ?? 0;
    if (deuda.saldada || saldo <= 0) continue;

    const dia = diaDeTexto(deuda.proximaFechaPago);
    if (!dia) continue;

    const monto = Math.min(saldo, deuda.proximoPagoMonto || deuda.pagoMinimo || 0);
    if (monto <= 0) continue;

    agregar(
      `deuda-${deuda.id}`,
      proximaFechaDeDia(dia, hoy),
      deuda.nombre,
      'Deudas · pago del mes',
      monto,
      'var(--alerta)',
      'deuda',
      deuda.id
    );
  }

  if (esPro) {
    // --- Suscripciones: se cobran solas.
    for (const sus of suscripciones) {
      if (!sus.activa) continue;

      // El día que se acaba la promoción pesa más que un cobro cualquiera:
      // es cuando el precio cambia sin que nadie lo decida.
      const finPromo = finDePromo(sus);
      if (finPromo && finPromo > hoy) {
        agregar(
          `promo-${sus.id}`,
          finPromo,
          sus.nombre,
          `Se acaba la promo · pasa a ${sus.monto.toLocaleString('es-CO')} al mes`,
          sus.monto,
          'var(--accion)',
          'promo'
        );
        continue;
      }

      agregar(
        `sus-${sus.id}`,
        proximaFechaDeDia(sus.diaCobro, hoy),
        sus.nombre,
        'Suscripción · se cobra sola',
        montoVigente(sus, hoy),
        COLOR_TARJETA,
        'suscripcion'
      );
    }

    // --- Tarjetas: corte y fecha límite de pago.
    for (const tc of tarjetas) {
      agregar(
        `corte-${tc.id}`,
        proximaFechaDeDia(tc.diaCorte, hoy),
        tc.nombre,
        `Cierra el corte · lo que compres después se paga el ${tc.diaPago}`,
        0,
        COLOR_TARJETA,
        'corte'
      );
      agregar(
        `pago-tc-${tc.id}`,
        proximaFechaDeDia(tc.diaPago, hoy),
        tc.nombre,
        'Fecha límite de pago',
        0,
        COLOR_TARJETA,
        'pago_tarjeta'
      );
    }

    // --- Retos: el aporte de la semana.
    for (const reto of retos) {
      if (reto.completado) continue;
      const aporte = aporteDeSemana(reto, reto.semanaActual);
      agregar(
        `reto-${reto.id}`,
        proximoAporteReto(reto, hoy),
        reto.nombre,
        `Reto · semana ${reto.semanaActual} de ${reto.semanasTotales}`,
        aporte,
        'var(--positivo)',
        'reto'
      );
    }
  }

  return eventos.sort((a, b) => {
    const dif = a.fecha.getTime() - b.fecha.getTime();
    if (dif !== 0) return dif;
    return b.monto - a.monto;
  });
}

/** Lo que falta del mes y no cabe en la ventana de la agenda. */
export function restoDelMes(entrada: {
  contexto: ContextoMes;
  deudas: Deuda[];
  suscripciones: Suscripcion[];
  esPro: boolean;
  ventanaDias?: number;
}): { cantidad: number; monto: number } {
  const { contexto, deudas, suscripciones, esPro } = entrada;
  const ventana = entrada.ventanaDias ?? 14;
  const hoy = contexto.hoy;
  const finVentana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + ventana);
  const finMes = new Date(contexto.anio, contexto.mes, contexto.diasDelMes);

  let cantidad = 0;
  let monto = 0;

  const contar = (fecha: Date | null, valor: number) => {
    if (!fecha || fecha <= finVentana || fecha > finMes) return;
    cantidad++;
    monto += valor;
  };

  for (const deuda of deudas) {
    const saldo = deuda.saldo ?? deuda.saldoTotal ?? 0;
    if (deuda.saldada || saldo <= 0) continue;
    const dia = diaDeTexto(deuda.proximaFechaPago);
    if (!dia) continue;
    contar(proximaFechaDeDia(dia, hoy), Math.min(saldo, deuda.proximoPagoMonto || deuda.pagoMinimo || 0));
  }

  if (esPro) {
    for (const sus of suscripciones) {
      if (!sus.activa) continue;
      contar(proximaFechaDeDia(sus.diaCobro, hoy), montoVigente(sus, hoy));
    }
  }

  return { cantidad, monto };
}

// =====================================================================
// 4. CATEGORÍAS — ¿en qué se va?
// =====================================================================

/** Paleta de respaldo cuando la categoría no tiene color propio en Presupuesto. */
export const PALETA_CATEGORIAS = ['#5FE0A8', COLOR_TARJETA, '#E89385', '#25C9BE', '#FF7A3D'];

export interface CategoriaGasto {
  etiqueta: string;
  valor: number;
  valorAnterior: number;
  delta: number | null;
  porcentaje: number;
  color: string;
}

/**
 * Gastos del mes por categoría, comparados contra el mismo tramo del mes
 * pasado (día 1 al día de hoy), que es la única comparación justa a mitad de mes.
 */
export function categoriasDeGasto(entrada: {
  contexto: ContextoMes;
  movimientos: Movimiento[];
  colores?: Record<string, string>;
  maximo?: number;
}): { categorias: CategoriaGasto[]; total: number; totalAnterior: number } {
  const { contexto, movimientos, colores = {} } = entrada;
  const maximo = entrada.maximo ?? 5;

  const acumular = (mes: number, anio: number, hastaDia?: number) => {
    const mapa = new Map<string, number>();
    for (const m of movimientos) {
      if (!esGastoCorriente(m)) continue;
      const f = fechaDeMovimiento(m);
      if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) continue;
      if (hastaDia && f.getDate() > hastaDia) continue;
      const cat = m.categoria || 'Otros';
      mapa.set(cat, (mapa.get(cat) || 0) + Math.abs(Number(m.monto) || 0));
    }
    return mapa;
  };

  const actual = acumular(contexto.mes, contexto.anio);
  const anterior = acumular(contexto.mesAnterior, contexto.anioAnterior, contexto.dia);
  const hayAnterior = anterior.size > 0;

  const total = [...actual.values()].reduce((a, b) => a + b, 0);
  const totalAnterior = [...anterior.values()].reduce((a, b) => a + b, 0);

  const ordenadas = [...actual.entries()].sort((a, b) => b[1] - a[1]);
  const visibles = ordenadas.slice(0, maximo);
  const resto = ordenadas.slice(maximo);

  const categorias: CategoriaGasto[] = visibles.map(([etiqueta, valor], i) => {
    const valorAnterior = anterior.get(etiqueta) || 0;
    return {
      etiqueta,
      valor,
      valorAnterior,
      delta: hayAnterior ? valor - valorAnterior : null,
      porcentaje: total > 0 ? (valor / total) * 100 : 0,
      color: colores[etiqueta] || PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length],
    };
  });

  if (resto.length > 0) {
    const valor = resto.reduce((acc, [, v]) => acc + v, 0);
    const valorAnterior = resto.reduce((acc, [k]) => acc + (anterior.get(k) || 0), 0);
    categorias.push({
      etiqueta: 'Otros',
      valor,
      valorAnterior,
      delta: hayAnterior ? valor - valorAnterior : null,
      porcentaje: total > 0 ? (valor / total) * 100 : 0,
      color: 'var(--texto-3)',
    });
  }

  return { categorias, total, totalAnterior };
}

/** Gasto corriente del mes agrupado por categoría (mapa completo, sin recortar). */
export function gastoPorCategoriaDelMes(
  movimientos: Movimiento[],
  mes: number,
  anio: number
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const m of movimientos) {
    if (!esGastoCorriente(m)) continue;
    const f = fechaDeMovimiento(m);
    if (!f || f.getMonth() !== mes || f.getFullYear() !== anio) continue;
    const cat = m.categoria || 'Otros';
    acc[cat] = (acc[cat] || 0) + Math.abs(Number(m.monto) || 0);
  }
  return acc;
}

/** Días que faltan para que vuelva a caer ese día del mes. */
export function diasHasta(diaDelMes: number, hoy: Date): number {
  const proxima = proximaFechaDeDia(diaDelMes, hoy);
  return Math.round((proxima.getTime() - hoy.getTime()) / 86400000);
}
