/**
 * Bolsillo — Reportes: lo que solo se ve con el tiempo
 *
 * Este módulo NO resume el mes en curso: eso ya lo hace Inicio, en vivo. Los
 * reportes mensuales tienen un problema conocido —llegan tarde, cuando la
 * decisión ya se tomó—, así que aquí solo entra lo que un mes suelto no puede
 * revelar: tendencias de varios meses, el día del mes en que se va la plata,
 * el peso acumulado de lo pequeño.
 *
 * Regla del módulo: un hallazgo se muestra solo si los datos lo sostienen.
 * Nada de rellenar con cuatro tarjetas cuando solo hay evidencia para una.
 */

import { Deuda, Movimiento, RetoAhorro, Suscripcion } from '../types';
import { MESES_ABREV, MESES_NOMBRE, diasEnMes } from '../utils/fechas';
import {
  esGastoCorriente,
  esPagoDeDeuda,
  fechaDeMovimiento,
  calcularReparto,
  getContextoMes,
  movimientosDelMes,
} from './resumenMes';
import { escaleraPorMes, planDeReto } from './retos';
import { fechaISOLocal } from '../utils/fechas';

// =====================================================================
// EL CIERRE DE UN MES
// =====================================================================

export interface CierreMes {
  mes: number;
  anio: number;
  etiqueta: string;
  /** "Agosto 2026" */
  etiquetaLarga: string;
  entro: number;
  deudas: number;
  gastos: number;
  guardado: number;
  /** Lo que no tuvo dueño: entró − deudas − gastos − guardado. */
  queda: number;
  /** De cada 100 pesos que entraron, cuántos quedaron. */
  pctQueda: number;
  /** El mes en curso todavía no cerró: sus cifras son proyección. */
  enCurso: boolean;
}

function guardadoDeMes(retos: RetoAhorro[], mes: number, anio: number): number {
  return retos.reduce((acc, reto) => {
    const inicio = fechaISOLocal(reto.creadoEn);
    if (!inicio) return acc;
    const delMes = escaleraPorMes(planDeReto(reto), inicio).find(
      (m) => m.mes === mes && m.anio === anio
    );
    return acc + (delMes ? delMes.monto : 0);
  }, 0);
}

export interface EntradaCierre {
  movimientos: Movimiento[];
  retos: RetoAhorro[];
  deudas: Deuda[];
  suscripciones: Suscripcion[];
  disponibleMensual: number;
  esPro: boolean;
}

export function cerrarMes(
  entrada: EntradaCierre,
  mes: number,
  anio: number,
  hoy: Date
): CierreMes {
  const { movimientos, retos, deudas: todasLasDeudas, suscripciones, disponibleMensual, esPro } = entrada;
  const delMes = movimientosDelMes(movimientos, mes, anio);
  const enCurso = mes === hoy.getMonth() && anio === hoy.getFullYear();

  const sumar = (movs: Movimiento[]) =>
    movs.reduce((acc, m) => acc + Math.abs(Number(m.monto) || 0), 0);

  let entro: number;
  let deudas: number;
  let gastos: number;
  let guardado: number;
  let queda: number;

  if (enCurso) {
    // El mes en curso no se puede sumar: se proyecta. Y se proyecta con la
    // misma cuenta de Inicio, para que las dos pantallas nunca se contradigan.
    const reparto = calcularReparto({
      contexto: getContextoMes(hoy),
      movimientos,
      deudas: todasLasDeudas,
      disponibleMensual,
      suscripciones,
      retos,
      esPro,
    });
    const de = (id: string) => reparto.destinos.find((d) => d.id === id)?.monto ?? 0;
    entro = reparto.entro;
    deudas = de('deudas');
    gastos = reparto.gastosProyectados;
    guardado = de('guardado');
    queda = reparto.libre;
  } else {
    entro = sumar(delMes.filter((m) => m.tipo === 'ingreso'));
    deudas = sumar(delMes.filter(esPagoDeDeuda));
    gastos = sumar(delMes.filter(esGastoCorriente));
    guardado = esPro ? guardadoDeMes(retos, mes, anio) : 0;
    queda = entro - deudas - gastos - guardado;
  }

  return {
    mes,
    anio,
    etiqueta: MESES_ABREV[mes],
    etiquetaLarga: `${MESES_NOMBRE[mes]} ${anio}`,
    entro,
    deudas,
    gastos,
    guardado,
    queda,
    pctQueda: entro > 0 ? (queda / entro) * 100 : 0,
    enCurso,
  };
}

/** Los últimos N meses con movimientos, del más viejo al más nuevo. */
export function historial(entrada: EntradaCierre, hoy: Date, meses = 6): CierreMes[] {
  const cierres: CierreMes[] = [];

  for (let i = meses - 1; i >= 0; i--) {
    const ref = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const cierre = cerrarMes(entrada, ref.getMonth(), ref.getFullYear(), hoy);
    // Un mes sin nada registrado no aporta: se salta en vez de dibujar un cero.
    if (cierre.entro > 0 || cierre.gastos > 0 || cierre.deudas > 0) cierres.push(cierre);
  }

  return cierres;
}

/** El último mes cerrado (el que se puede juzgar de verdad). */
export function ultimoMesCerrado(hoy: Date): { mes: number; anio: number } {
  const ref = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  return { mes: ref.getMonth(), anio: ref.getFullYear() };
}

// =====================================================================
// LOS HALLAZGOS
// =====================================================================

/** El módulo escribe la copia, pero no sabe de pesos: quien llama pasa el formato. */
export type Formateador = (valor: number) => string;

export type TonoHallazgo = 'ojo' | 'bien' | 'dato';

export interface Hallazgo {
  id: string;
  tono: TonoHallazgo;
  /** El titular, con la cifra que lo hace importar. */
  titulo: string;
  /** La cifra que va resaltada dentro del titular. */
  destacado: string;
  detalle: string;
  accion?: string;
  /** Serie corta para dibujar la tendencia, si el hallazgo la tiene. */
  serie?: { etiqueta: string; valor: number }[];
  /** Para ordenar: primero lo que más plata mueve. */
  peso: number;
}

function gastosPorCategoria(movs: Movimiento[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const m of movs) {
    if (!esGastoCorriente(m)) continue;
    const cat = m.categoria || 'Otros';
    mapa.set(cat, (mapa.get(cat) || 0) + Math.abs(Number(m.monto) || 0));
  }
  return mapa;
}

/**
 * ¿Cuánto del gasto del mes cae en los días siguientes a cada ingreso?
 * Se detectan los días en que entró plata en vez de asumir el 15 y el 30,
 * así funciona igual con quincena, mensual o pagos por día.
 */
export function hallazgoQuincena(
  movimientos: Movimiento[],
  cierres: CierreMes[],
  fmt: Formateador,
  ventana = 3
): Hallazgo | null {
  const cerrados = cierres.filter((c) => !c.enCurso).slice(-4);
  if (cerrados.length === 0) return null;

  let gastoTotal = 0;
  let gastoPegado = 0;
  let mejorMes: { etiqueta: string; monto: number } | null = null;
  let mesesConPatron = 0;

  for (const c of cerrados) {
    const delMes = movimientosDelMes(movimientos, c.mes, c.anio);
    const diasDeIngreso = new Set<number>();
    for (const m of delMes) {
      if (m.tipo !== 'ingreso') continue;
      const f = fechaDeMovimiento(m);
      if (f) diasDeIngreso.add(f.getDate());
    }
    if (diasDeIngreso.size === 0) continue;

    let totalMes = 0;
    let pegadoMes = 0;
    for (const m of delMes) {
      if (!esGastoCorriente(m)) continue;
      const f = fechaDeMovimiento(m);
      if (!f) continue;
      const monto = Math.abs(Number(m.monto) || 0);
      totalMes += monto;
      for (const d of diasDeIngreso) {
        if (f.getDate() >= d && f.getDate() < d + ventana) {
          pegadoMes += monto;
          break;
        }
      }
    }

    gastoTotal += totalMes;
    gastoPegado += pegadoMes;
    if (totalMes > 0 && pegadoMes / totalMes >= 0.3) mesesConPatron++;
    if (!mejorMes || pegadoMes > mejorMes.monto) {
      mejorMes = { etiqueta: MESES_NOMBRE[c.mes].toLowerCase(), monto: pegadoMes };
    }
  }

  if (gastoTotal <= 0) return null;
  const pct = Math.round((gastoPegado / gastoTotal) * 100);
  if (pct < 30 || mesesConPatron < 2) return null;

  return {
    id: 'quincena',
    tono: 'ojo',
    titulo: 'Se te va {x} del mes en los días siguientes a que te pagan',
    destacado: `el ${pct}%`,
    detalle: `Pasa en ${mesesConPatron} de los últimos ${cerrados.length} meses, así que no fue casualidad. En ${mejorMes?.etiqueta} fueron ${fmt(mejorMes ? mejorMes.monto : 0)} en ${ventana} días.`,
    accion: 'Aparta apenas te caiga la plata, antes de que se mueva sola',
    peso: gastoPegado,
  };
}

/** Una categoría que lleva varios meses subiendo no es un mes malo: es una tendencia. */
export function hallazgoTendencia(
  movimientos: Movimiento[],
  cierres: CierreMes[],
  fmt: Formateador
): Hallazgo | null {
  const cerrados = cierres.filter((c) => !c.enCurso).slice(-4);
  if (cerrados.length < 3) return null;

  const porMes = cerrados.map((c) => ({
    cierre: c,
    cats: gastosPorCategoria(movimientosDelMes(movimientos, c.mes, c.anio)),
  }));

  const categorias = new Set<string>();
  for (const p of porMes) for (const k of p.cats.keys()) categorias.add(k);

  let mejor: Hallazgo | null = null;

  for (const cat of categorias) {
    const serie = porMes.map((p) => ({
      etiqueta: MESES_ABREV[p.cierre.mes],
      valor: p.cats.get(cat) || 0,
    }));
    if (serie.some((s) => s.valor <= 0)) continue;

    let sube = true;
    for (let i = 1; i < serie.length; i++) {
      if (serie[i].valor <= serie[i - 1].valor) sube = false;
    }
    if (!sube) continue;

    const desde = serie[0].valor;
    const hasta = serie[serie.length - 1].valor;
    const diferencia = hasta - desde;
    if (diferencia < 30000) continue;

    if (!mejor || diferencia > mejor.peso) {
      mejor = {
        id: `tendencia-${cat}`,
        tono: 'ojo',
        titulo: `${cat} lleva {x} subiendo`,
        destacado: `${serie.length - 1} meses`,
        detalle: `Pasó de ${fmt(desde)} a ${fmt(hasta)}. No es un mes malo, es una tendencia: ${fmt(diferencia)} más desde ${MESES_NOMBRE[porMes[0].cierre.mes].toLowerCase()}.`,
        serie,
        peso: diferencia,
      };
    }
  }

  return mejor;
}

/** Muchos gastos pequeños de la misma categoría que juntos pesan. */
export function hallazgoHormiga(
  movimientos: Movimiento[],
  mes: number,
  anio: number,
  fmt: Formateador,
  minimoMovimientos = 5
): Hallazgo | null {
  const delMes = movimientosDelMes(movimientos, mes, anio).filter(esGastoCorriente);
  if (delMes.length === 0) return null;

  const porCat = new Map<string, number[]>();
  for (const m of delMes) {
    const cat = m.categoria || 'Otros';
    const lista = porCat.get(cat) || [];
    lista.push(Math.abs(Number(m.monto) || 0));
    porCat.set(cat, lista);
  }

  const totalMes = delMes.reduce((acc, m) => acc + Math.abs(Number(m.monto) || 0), 0);
  let mejor: Hallazgo | null = null;

  for (const [cat, montos] of porCat) {
    if (montos.length < minimoMovimientos) continue;
    const suma = montos.reduce((a, b) => a + b, 0);
    const promedio = suma / montos.length;
    // Solo cuenta si de verdad son pequeños frente a lo que suman.
    if (promedio > suma / 4) continue;
    if (suma / totalMes < 0.1) continue;

    if (!mejor || suma > mejor.peso) {
      mejor = {
        id: `hormiga-${cat}`,
        tono: 'dato',
        titulo: `${cat}: {x} que juntos sí pesan`,
        destacado: `${montos.length} gastos chiquitos`,
        detalle: `De ${fmt(Math.round(promedio))} en promedio, suman ${fmt(suma)} en el mes. Cada uno se siente nada; juntos son el ${Math.round((suma / totalMes) * 100)}% de tu gasto.`,
        peso: suma,
      };
    }
  }

  return mejor;
}

/** La victoria: cuánto le has bajado a la deuda desde que empezaste. */
export function hallazgoDeuda(deudas: Deuda[], fmt: Formateador): Hallazgo | null {
  const original = deudas.reduce((acc, d) => acc + (d.montoOriginal || d.saldo || 0), 0);
  const actual = deudas
    .filter((d) => !d.saldada)
    .reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0);
  const pagado = original - actual;
  if (original <= 0 || pagado <= 0) return null;

  const pct = Math.round((pagado / original) * 100);
  const saldadas = deudas.filter((d) => d.saldada).length;

  return {
    id: 'deuda',
    tono: 'bien',
    titulo: 'Le has bajado {x} a tus deudas',
    destacado: fmt(pagado),
    detalle:
      saldadas > 0
        ? `El ${pct}% de todo lo que debías, y ya tienes ${saldadas} ${saldadas === 1 ? 'deuda saldada' : 'deudas saldadas'}.`
        : `El ${pct}% de todo lo que debías desde que empezaste.`,
    peso: pagado,
  };
}

/** Lo que se llevan los cobros automáticos, cuando ya pesan. */
export function hallazgoSuscripciones(
  suscripciones: Suscripcion[],
  cierre: CierreMes,
  fmt: Formateador
): Hallazgo | null {
  const activas = suscripciones.filter((s) => s.activa);
  if (activas.length < 2 || cierre.entro <= 0) return null;

  const mensual = activas.reduce((acc, s) => acc + (Number(s.monto) || 0), 0);
  const pct = (mensual / cierre.entro) * 100;
  if (pct < 8) return null;

  return {
    id: 'suscripciones',
    tono: 'ojo',
    titulo: 'Los cobros automáticos se llevan {x} de lo que entra',
    destacado: `${Math.round(pct)}%`,
    detalle: `${activas.length} suscripciones activas: ${fmt(mensual)} al mes, ${fmt(mensual * 12)} en un año.`,
    accion: 'Revisa cuáles sigues usando de verdad',
    peso: mensual * 12,
  };
}

export interface EntradaHallazgos {
  movimientos: Movimiento[];
  deudas: Deuda[];
  suscripciones: Suscripcion[];
  cierres: CierreMes[];
  cierre: CierreMes;
  esPro: boolean;
  formato: Formateador;
}

/** Todos los hallazgos que los datos sostienen, del más pesado al menos. */
export function calcularHallazgos(entrada: EntradaHallazgos): Hallazgo[] {
  const { movimientos, deudas, suscripciones, cierres, cierre, esPro, formato: fmt } = entrada;

  const candidatos = [
    hallazgoQuincena(movimientos, cierres, fmt),
    hallazgoTendencia(movimientos, cierres, fmt),
    hallazgoHormiga(movimientos, cierre.mes, cierre.anio, fmt),
    esPro ? hallazgoSuscripciones(suscripciones, cierre, fmt) : null,
    hallazgoDeuda(deudas, fmt),
  ];

  return candidatos.filter((h): h is Hallazgo => h !== null).sort((a, b) => b.peso - a.peso);
}

// =====================================================================
// PARA LA HOJA EXPORTABLE
// =====================================================================

export interface CategoriaDelMes {
  etiqueta: string;
  valor: number;
  pct: number;
}

export function categoriasDelMes(
  movimientos: Movimiento[],
  mes: number,
  anio: number
): CategoriaDelMes[] {
  const mapa = gastosPorCategoria(movimientosDelMes(movimientos, mes, anio));
  const total = [...mapa.values()].reduce((a, b) => a + b, 0);
  return [...mapa.entries()]
    .map(([etiqueta, valor]) => ({
      etiqueta,
      valor,
      pct: total > 0 ? (valor / total) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
}

/** Los meses que se pueden elegir en el selector, del más nuevo al más viejo. */
export function mesesDisponibles(movimientos: Movimiento[], hoy: Date): { mes: number; anio: number }[] {
  const vistos = new Set<string>();
  const lista: { mes: number; anio: number }[] = [];

  for (const m of movimientos) {
    const f = fechaDeMovimiento(m);
    if (!f) continue;
    const clave = `${f.getFullYear()}-${f.getMonth()}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push({ mes: f.getMonth(), anio: f.getFullYear() });
  }

  return lista.sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes));
}

/** Días del mes, por si algún cálculo lo necesita fuera de este módulo. */
export { diasEnMes };
