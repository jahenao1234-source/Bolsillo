/**
 * Bolsillo - Lógica Pura del Plan de Pago "Deuda Cero"
 *
 * Módulo puramente funcional y determinista, desacoplado de la persistencia y la UI.
 * Soporta las estrategias 'bola_de_nieve' (menor saldo) y 'avalancha' (mayor interés).
 */

import { Deuda, EstrategiaPago, ResultadoPlan, ResultadoSimulacionAbonoExtra, OrdenSaldadoItem } from '../types';

const NOMBRES_MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Calcula el nombre y año de un mes a partir de hoy sumándole N meses
 */
export function calcularFechaMesRelativo(mesesASumar: number, fechaBase: Date = new Date()): string {
  if (mesesASumar <= 0) return 'Hoy';
  const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + mesesASumar, 1);
  const mes = NOMBRES_MESES[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return `${mes} ${anio}`;
}

/**
 * Ordena las deudas activas según la estrategia financiera seleccionada
 */
export function ordenarDeudasSegunEstrategia(
  deudas: Deuda[],
  estrategia: EstrategiaPago
): Deuda[] {
  const activas = deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0);

  if (estrategia === 'personalizado') {
    return [...activas].sort((a, b) => {
      const ordenA = typeof a.orden === 'number' ? a.orden : 9999;
      const ordenB = typeof b.orden === 'number' ? b.orden : 9999;
      if (ordenA !== ordenB) return ordenA - ordenB;
      return (a.saldo ?? a.saldoTotal ?? 0) - (b.saldo ?? b.saldoTotal ?? 0);
    });
  }

  return [...activas].sort((a, b) => {
    const saldoA = a.saldo ?? a.saldoTotal ?? 0;
    const saldoB = b.saldo ?? b.saldoTotal ?? 0;
    const tasaA = a.tasaMensual ?? 0;
    const tasaB = b.tasaMensual ?? 0;

    if (estrategia === 'bola_de_nieve') {
      // Menor saldo primero; si empatan, mayor tasa
      if (saldoA !== saldoB) return saldoA - saldoB;
      return tasaB - tasaA;
    } else {
      // Avalancha: mayor tasa primero; si empatan, menor saldo
      if (tasaA !== tasaB) return tasaB - tasaA;
      return saldoA - saldoB;
    }
  });
}

interface EstadoSimulacionDeuda {
  id: string;
  nombre: string;
  tipo: Deuda['tipo'];
  saldo: number;
  saldoInicial: number;
  tasaMensual: number;
  pagoMinimo: number;
  interesesPagados: number;
  mesSaldado: number | null;
  fechaEstimada: string | null;
}

/**
 * Simula el plan de pago mes a mes.
 *
 * Algoritmo:
 * 1. Cada mes se reserva el pago mínimo de cada deuda activa.
 * 2. Si el disponible mensual no cubre todos los mínimos, se distribuye proporcionalmente y se advierte.
 * 3. El excedente ("disponible - mínimos pagados") se enfoca como abono extra a la deuda prioritaria.
 * 4. Cuando una deuda se cancela a 0, su pago mínimo se libera y engrosa la "bola de nieve"
 *    para acelerar la siguiente deuda.
 * 5. Se aplican intereses mensuales sobre el saldo insoluto remanente del mes.
 */
export function calcularPlan(
  deudas: Deuda[],
  disponibleMensual: number,
  estrategia: EstrategiaPago = 'bola_de_nieve'
): ResultadoPlan {
  const deudasOrdenadas = ordenarDeudasSegunEstrategia(deudas, estrategia);

  const deudaTotalActual = deudasOrdenadas.reduce(
    (acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0),
    0
  );

  const pagoMinimoTotal = deudasOrdenadas.reduce((acc, d) => acc + d.pagoMinimo, 0);

  // Caso base: no hay deudas o todas están en 0
  if (deudasOrdenadas.length === 0 || deudaTotalActual <= 0) {
    return {
      mesesTotales: 0,
      fechaLibertad: '¡Ya estás libre de deudas!',
      interesesTotales: 0,
      ordenSaldado: [],
      deudaTotalActual: 0,
      pagoMinimoTotal: 0,
      disponibleMensual,
      esViable: true,
    };
  }

  // Comprobar viabilidad básica: el disponible debe ser mayor a 0
  if (disponibleMensual <= 0) {
    return {
      mesesTotales: 999,
      fechaLibertad: 'Indefinida',
      interesesTotales: 0,
      ordenSaldado: [],
      deudaTotalActual,
      pagoMinimoTotal,
      disponibleMensual,
      esViable: false,
      mensajeAdvertencia: 'Tu disponible mensual debe ser mayor a $0 para amortizar pasivos.',
    };
  }

  // Inicializar estado de simulación
  const estado: EstadoSimulacionDeuda[] = deudasOrdenadas.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo,
    saldo: d.saldo ?? d.saldoTotal ?? 0,
    saldoInicial: d.saldo ?? d.saldoTotal ?? 0,
    tasaMensual: d.tasaMensual ?? 0,
    pagoMinimo: d.pagoMinimo,
    interesesPagados: 0,
    mesSaldado: null,
    fechaEstimada: null,
  }));

  let meses = 0;
  const LIMITE_MESES = 360; // 30 años de tope para evitar loops infinitos
  let interesesTotales = 0;
  const ordenSaldado: OrdenSaldadoItem[] = [];

  while (meses < LIMITE_MESES) {
    const activas = estado.filter((d) => d.saldo > 0);
    if (activas.length === 0) break;

    meses += 1;
    let cajaDelMes = disponibleMensual;

    // 1. Pagos mínimos obligatorios
    for (const deuda of activas) {
      const cuota = Math.min(deuda.pagoMinimo, deuda.saldo, cajaDelMes);
      deuda.saldo -= cuota;
      cajaDelMes -= cuota;
    }

    // 2. Aplicar remanente (abono extra) a la deuda prioritaria según estrategia
    while (cajaDelMes > 0.01) {
      const objetivo = estado.find((d) => d.saldo > 0);
      if (!objetivo) break;

      const abono = Math.min(cajaDelMes, objetivo.saldo);
      objetivo.saldo -= abono;
      cajaDelMes -= abono;
    }

    // 3. Revisar cuáles deudas quedaron en 0 este mes y registrar
    for (const deuda of estado) {
      if (deuda.saldo <= 0.01 && deuda.mesSaldado === null) {
        deuda.saldo = 0;
        deuda.mesSaldado = meses;
        deuda.fechaEstimada = calcularFechaMesRelativo(meses);
        ordenSaldado.push({
          id: deuda.id,
          nombre: deuda.nombre,
          tipo: deuda.tipo,
          saldoInicial: deuda.saldoInicial,
          tasaMensual: deuda.tasaMensual,
          pagoMinimo: deuda.pagoMinimo,
          mesSaldado: meses,
          fechaEstimada: deuda.fechaEstimada,
          interesesPagados: Math.round(deuda.interesesPagados),
        });
      }
    }

    // 4. Aplicar intereses del periodo sobre los saldos remanentes
    for (const deuda of estado) {
      if (deuda.saldo > 0 && deuda.tasaMensual > 0) {
        const interes = deuda.saldo * (deuda.tasaMensual / 100);
        deuda.saldo += interes;
        deuda.interesesPagados += interes;
        interesesTotales += interes;
      }
    }
  }

  const activasRestantes = estado.filter((d) => d.saldo > 0);
  const esViable = activasRestantes.length === 0;

  return {
    mesesTotales: meses,
    fechaLibertad: esViable ? calcularFechaMesRelativo(meses) : 'Más de 30 años',
    interesesTotales: Math.round(interesesTotales),
    ordenSaldado,
    deudaTotalActual,
    pagoMinimoTotal,
    disponibleMensual,
    esViable,
    mensajeAdvertencia: !esViable
      ? 'Con tu disponible mensual actual, los intereses superan tus pagos. Aumenta tu disponible mensual para amortizar el capital.'
      : undefined,
  };
}

/**
 * Simula el efecto de un abono extra mensual sobre el plan base
 */
export function simularAbonoExtra(
  deudas: Deuda[],
  disponibleMensual: number,
  estrategia: EstrategiaPago,
  abonoExtra: number
): ResultadoSimulacionAbonoExtra {
  const planBase = calcularPlan(deudas, disponibleMensual, estrategia);
  const planConAbono = calcularPlan(deudas, disponibleMensual + Math.max(0, abonoExtra), estrategia);

  const mesesAhorrados = Math.max(0, planBase.mesesTotales - planConAbono.mesesTotales);
  const ahorroIntereses = Math.max(0, planBase.interesesTotales - planConAbono.interesesTotales);

  return {
    abonoExtra,
    mesesTotalesBase: planBase.mesesTotales,
    mesesTotalesNuevo: planConAbono.mesesTotales,
    mesesAhorrados,
    fechaLibertadBase: planBase.fechaLibertad,
    nuevaFechaLibertad: planConAbono.fechaLibertad,
    interesesBase: planBase.interesesTotales,
    nuevosIntereses: planConAbono.interesesTotales,
    ahorroIntereses,
  };
}

export interface PuntoSerieDeuda {
  mes: number;
  etiqueta: string;
  saldo: number;
}

/**
 * Devuelve la serie de saldo total de deuda restante mes a mes (para graficar
 * la curva "tu deuda bajando hasta $0"). Punto 0 = hoy. Muestrea si hay muchos meses.
 */
export function calcularSerieSaldoDeuda(
  deudas: Deuda[],
  disponibleMensual: number,
  estrategia: EstrategiaPago = 'bola_de_nieve',
  maxPuntos = 13
): PuntoSerieDeuda[] {
  const deudasOrdenadas = ordenarDeudasSegunEstrategia(deudas, estrategia);
  const totalActual = deudasOrdenadas.reduce((a, d) => a + (d.saldo ?? d.saldoTotal ?? 0), 0);
  const serie: PuntoSerieDeuda[] = [{ mes: 0, etiqueta: 'Hoy', saldo: Math.round(totalActual) }];

  if (deudasOrdenadas.length === 0 || totalActual <= 0 || disponibleMensual <= 0) {
    return serie;
  }

  const estado = deudasOrdenadas.map((d) => ({
    saldo: d.saldo ?? d.saldoTotal ?? 0,
    tasaMensual: d.tasaMensual ?? 0,
    pagoMinimo: d.pagoMinimo,
  }));

  let meses = 0;
  const LIMITE_MESES = 360;

  while (meses < LIMITE_MESES) {
    const activas = estado.filter((d) => d.saldo > 0);
    if (activas.length === 0) break;
    meses += 1;
    let caja = disponibleMensual;

    for (const d of activas) {
      const cuota = Math.min(d.pagoMinimo, d.saldo, caja);
      d.saldo -= cuota;
      caja -= cuota;
    }
    while (caja > 0.01) {
      const obj = estado.find((d) => d.saldo > 0);
      if (!obj) break;
      const abono = Math.min(caja, obj.saldo);
      obj.saldo -= abono;
      caja -= abono;
    }
    for (const d of estado) {
      if (d.saldo > 0 && d.tasaMensual > 0) {
        d.saldo += d.saldo * (d.tasaMensual / 100);
      }
    }

    const total = estado.reduce((a, d) => a + Math.max(0, d.saldo), 0);
    serie.push({ mes: meses, etiqueta: calcularFechaMesRelativo(meses), saldo: Math.round(total) });
    if (total <= 0.5) break;
  }

  // Muestreo uniforme si hay demasiados puntos (conserva el primero y el último)
  if (serie.length > maxPuntos) {
    const paso = (serie.length - 1) / (maxPuntos - 1);
    const muestreada: PuntoSerieDeuda[] = [];
    for (let i = 0; i < maxPuntos; i++) {
      muestreada.push(serie[Math.round(i * paso)]);
    }
    muestreada[muestreada.length - 1] = serie[serie.length - 1];
    return muestreada;
  }

  return serie;
}

export interface FilaTablaPlan {
  mes: number;
  etiqueta: string;
  saldos: Record<string, number>;
  total: number;
}

export interface TablaPlan {
  columnas: { id: string; nombre: string; tipo: Deuda['tipo'] }[];
  filas: FilaTablaPlan[];
}

/**
 * Cronograma mes a mes: saldo restante de cada deuda y el total, mes por mes,
 * hasta liquidar todo. Para la tabla desplegable del plan.
 */
export function calcularTablaPlan(
  deudas: Deuda[],
  disponibleMensual: number,
  estrategia: EstrategiaPago = 'bola_de_nieve'
): TablaPlan {
  const ordenadas = ordenarDeudasSegunEstrategia(deudas, estrategia);
  const columnas = ordenadas.map((d) => ({ id: d.id, nombre: d.nombre, tipo: d.tipo }));
  const filas: FilaTablaPlan[] = [];

  if (ordenadas.length === 0 || disponibleMensual <= 0) return { columnas, filas };

  const estado = ordenadas.map((d) => ({
    id: d.id,
    saldo: d.saldo ?? d.saldoTotal ?? 0,
    tasa: d.tasaMensual ?? 0,
    min: d.pagoMinimo,
  }));

  let meses = 0;
  const LIMITE_MESES = 360;

  while (meses < LIMITE_MESES) {
    const activas = estado.filter((d) => d.saldo > 0);
    if (activas.length === 0) break;
    meses += 1;
    let caja = disponibleMensual;

    for (const d of activas) {
      const c = Math.min(d.min, d.saldo, caja);
      d.saldo -= c;
      caja -= c;
    }
    while (caja > 0.01) {
      const o = estado.find((d) => d.saldo > 0);
      if (!o) break;
      const a = Math.min(caja, o.saldo);
      o.saldo -= a;
      caja -= a;
    }
    for (const d of estado) {
      if (d.saldo > 0 && d.tasa > 0) d.saldo += d.saldo * (d.tasa / 100);
    }

    const saldos: Record<string, number> = {};
    let total = 0;
    for (const d of estado) {
      const s = Math.max(0, Math.round(d.saldo));
      saldos[d.id] = s;
      total += s;
    }
    filas.push({ mes: meses, etiqueta: calcularFechaMesRelativo(meses), saldos, total });
    if (total <= 0.5) break;
  }

  return { columnas, filas };
}
