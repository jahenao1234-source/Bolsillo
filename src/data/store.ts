/**
 * Bolsillo - Capa de Datos Aislada (Store)
 *
 * Esta es la ÚNICA parte del código que interactúa con el almacenamiento.
 * Por dentro usa localStorage, pero expone métodos agnósticos para que
 * en el futuro se pueda migrar a cualquier backend sin tocar la UI.
 */

import {
  Billetera,
  Deuda,
  Movimiento,
  ResumenFinanciero,
  FiltrosMovimiento,
  FlujoMes,
  NivelAcceso,
  DatosTermometro,
  Presupuesto,
  Sobre,
} from '../types';
import { calcularPlan } from '../logic/planDeudas';

const STORAGE_KEYS = {
  RESUMEN: 'bolsillo_data_resumen_v3',
  BILLETERAS: 'bolsillo_data_billeteras_v3',
  DEUDAS: 'bolsillo_data_deudas_v3',
  MOVIMIENTOS: 'bolsillo_data_movimientos_v3',
  DISPONIBLE_DEUDAS: 'bolsillo_data_disponible_deudas_v3',
  INICIALIZADO: 'bolsillo_data_seeded_v3',
  NIVEL_ACCESO: 'bolsillo_data_nivel_acceso_v3',
  DATOS_TERMOMETRO: 'bolsillo_data_termometro_v3',
  NOMBRE_USUARIO: 'bolsillo_data_nombre_v3',
  PRESUPUESTOS: 'bolsillo_data_presupuestos_v3',
  SOBRES: 'bolsillo_data_sobres_v3',
};

// ==========================================
// SEMILLA DE DATOS REALISTAS DE COLOMBIA
// ==========================================

const MOCK_DISPONIBLE_MENSUAL_INICIAL = 600000;

const MOCK_DEUDAS_INICIAL: Deuda[] = [
  {
    id: 'deuda-fiado',
    nombre: 'Fiado tienda doña Rosa',
    tipo: 'fiado',
    saldo: 120000,
    saldoTotal: 120000,
    montoOriginal: 250000,
    tasaMensual: 0,
    tasaInteresEA: '0.0% (Sin interés)',
    pagoMinimo: 30000,
    proximoPagoMonto: 30000,
    proximaFechaPago: '10 sep',
    saldada: false,
    creadoEn: '2026-08-15',
    entidad: 'Tienda de barrio',
  },
  {
    id: 'deuda-gota',
    nombre: 'Gota a gota (Paga diario)',
    tipo: 'gota_a_gota',
    saldo: 1200000,
    saldoTotal: 1200000,
    montoOriginal: 1500000,
    tasaMensual: 10,
    tasaInteresEA: '213.8% E.A. (Tasa extrema)',
    pagoMinimo: 180000,
    proximoPagoMonto: 180000,
    proximaFechaPago: '08 sep',
    saldada: false,
    creadoEn: '2026-08-01',
    entidad: 'Cobro particular',
  },
  {
    id: 'deuda-exito',
    nombre: 'Tarjeta Éxito',
    tipo: 'tarjeta',
    saldo: 1900000,
    saldoTotal: 1900000,
    montoOriginal: 3500000,
    tasaMensual: 2.1,
    tasaInteresEA: '28.3% E.A.',
    pagoMinimo: 150000,
    proximoPagoMonto: 150000,
    proximaFechaPago: '15 sep',
    saldada: false,
    creadoEn: '2026-06-10',
    entidad: 'Tuya',
  },
  {
    id: 'deuda-libranza',
    nombre: 'Libranza Banco Popular',
    tipo: 'libranza',
    saldo: 3500000,
    saldoTotal: 3500000,
    montoOriginal: 5000000,
    tasaMensual: 1.4,
    tasaInteresEA: '18.2% E.A.',
    pagoMinimo: 160000,
    proximoPagoMonto: 160000,
    proximaFechaPago: '30 sep',
    saldada: false,
    creadoEn: '2026-01-20',
    entidad: 'Banco Popular',
  },
];

// Semilla solicitada:
// Efectivo $180.000, Nequi $310.000, Bancolombia $450.000, Ahorros $300.000 (total $1.240.000)
const MOCK_BILLETERAS_INICIAL: Billetera[] = [
  {
    id: 'bil-efectivo',
    nombre: 'Efectivo',
    tipo: 'efectivo',
    saldo: 180000,
    creadoEn: '2026-08-01',
    entidad: 'Efectivo en mano',
    color: '#5FE0A8',
  },
  {
    id: 'bil-nequi',
    nombre: 'Nequi',
    tipo: 'nequi',
    saldo: 310000,
    creadoEn: '2026-08-01',
    entidad: 'Nequi Colombia',
    numeroCuentaCorto: '• 312 450',
    color: '#8AA9FF',
  },
  {
    id: 'bil-bancolombia',
    nombre: 'Bancolombia',
    tipo: 'banco',
    saldo: 450000,
    creadoEn: '2026-08-01',
    entidad: 'Bancolombia Ahorros',
    numeroCuentaCorto: '• 4892',
    color: '#25C9BE',
  },
  {
    id: 'bil-ahorros',
    nombre: 'Ahorros',
    tipo: 'ahorros',
    saldo: 300000,
    creadoEn: '2026-08-01',
    entidad: 'Fondo de emergencia',
    color: '#FF7A3D',
  },
];

// Movimientos de ejemplo: "Salario quincena" +$900.000 (Nequi), "Mercado" −$120.000 (Efectivo)
const MOCK_MOVIMIENTOS_INICIAL: Movimiento[] = [
  {
    id: 'mov-1',
    tipo: 'ingreso',
    monto: 900000,
    billeteraId: 'bil-nequi',
    billeteraNombre: 'Nequi',
    categoria: 'Salario',
    fecha: '01 sep 2026',
    nota: 'Salario quincena',
    descripcion: 'Salario quincena',
    creadoEn: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'mov-2',
    tipo: 'gasto',
    monto: 120000,
    billeteraId: 'bil-efectivo',
    billeteraNombre: 'Efectivo',
    categoria: 'Comida',
    fecha: '02 sep 2026',
    nota: 'Mercado',
    descripcion: 'Mercado',
    creadoEn: '2026-09-02T14:30:00.000Z',
  },
];

// Categorías por defecto
export const CATEGORIAS_INGRESOS_DEFECTO = ['Salario', 'Venta', 'Otro'];
export const CATEGORIAS_GASTOS_DEFECTO = [
  'Comida',
  'Transporte',
  'Servicios',
  'Ocio',
  'Deudas',
  'Otro',
];

// Semilla Pro: topes de presupuesto por categoría (mensual)
const MOCK_PRESUPUESTOS_INICIAL: Presupuesto[] = [
  { categoria: 'Comida', tope: 600000 },
  { categoria: 'Transporte', tope: 200000 },
  { categoria: 'Servicios', tope: 250000 },
  { categoria: 'Ocio', tope: 150000 },
];

// Semilla Pro: sobres digitales (dinero apartado hacia metas)
const MOCK_SOBRES_INICIAL: Sobre[] = [
  { id: 'sobre-emergencia', nombre: 'Fondo de emergencia', meta: 1000000, apartado: 300000, color: '#5FE0A8', creadoEn: '2026-08-01' },
  { id: 'sobre-arriendo', nombre: 'Arriendo', meta: 800000, apartado: 500000, color: '#25C9BE', creadoEn: '2026-08-01' },
  { id: 'sobre-moto', nombre: 'Cuota moto', meta: 2000000, apartado: 150000, color: '#FF7A3D', creadoEn: '2026-08-01' },
];

// Mecanismo de eventos para reactividad en componentes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notificarCambio() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error notificando cambio de store:', err);
    }
  });
}

/**
 * Suscribe un componente a cambios en los datos del almacén
 */
export function suscribirStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Inicializa y siembra datos por defecto si es el primer arranque
 */
function asegurarInicializacion(): void {
  if (typeof window === 'undefined') return;
  try {
    const inicializado = localStorage.getItem(STORAGE_KEYS.INICIALIZADO);
    if (!inicializado) {
      localStorage.setItem(STORAGE_KEYS.BILLETERAS, JSON.stringify(MOCK_BILLETERAS_INICIAL));
      localStorage.setItem(STORAGE_KEYS.DEUDAS, JSON.stringify(MOCK_DEUDAS_INICIAL));
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(MOCK_MOVIMIENTOS_INICIAL));
      localStorage.setItem(
        STORAGE_KEYS.DISPONIBLE_DEUDAS,
        JSON.stringify(MOCK_DISPONIBLE_MENSUAL_INICIAL)
      );
      localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
    }
  } catch (error) {
    console.warn('Almacenamiento local no disponible:', error);
  }
}

// Ejecutar al importar
asegurarInicializacion();

// ==========================================
// GETTERS PÚBLICOS
// ==========================================

export function getNombreUsuario(): string {
  asegurarInicializacion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOMBRE_USUARIO);
    if (raw) {
      const parsed = JSON.parse(raw);
      const nombre = typeof parsed === 'string' ? parsed.trim() : '';
      if (nombre) return nombre;
    }
  } catch (err) {
    console.error('Error al leer nombre de usuario:', err);
  }
  return 'Marcela';
}

export function setNombreUsuario(nombre: string): void {
  try {
    const valorLimpio = (nombre || '').trim();
    localStorage.setItem(STORAGE_KEYS.NOMBRE_USUARIO, JSON.stringify(valorLimpio));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar nombre de usuario:', err);
  }
}

export function getDisponibleMensual(): number {
  asegurarInicializacion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPONIBLE_DEUDAS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer disponible mensual:', err);
  }
  return MOCK_DISPONIBLE_MENSUAL_INICIAL;
}

export function setDisponibleMensual(monto: number): void {
  try {
    const valor = Math.max(0, Math.round(monto));
    localStorage.setItem(STORAGE_KEYS.DISPONIBLE_DEUDAS, JSON.stringify(valor));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar disponible mensual:', err);
  }
}

export function getBilleteras(): Billetera[] {
  asegurarInicializacion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLETERAS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer billeteras:', err);
  }
  return MOCK_BILLETERAS_INICIAL;
}

/**
 * Retorna la suma del saldo de todas las billeteras
 */
export function getSaldoTotal(): number {
  const billeteras = getBilleteras();
  return billeteras.reduce((sum, b) => sum + (Number(b.saldo) || 0), 0);
}

export function getDeudas(): Deuda[] {
  asegurarInicializacion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEUDAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((d: Deuda, index: number) => ({
        ...d,
        saldo: typeof d.saldo === 'number' ? d.saldo : (d.saldoTotal ?? 0),
        saldoTotal: typeof d.saldo === 'number' ? d.saldo : (d.saldoTotal ?? 0),
        saldada: Boolean(d.saldada),
        tasaMensual: typeof d.tasaMensual === 'number' ? d.tasaMensual : 0,
        pagoMinimo: typeof d.pagoMinimo === 'number' ? d.pagoMinimo : (d.proximoPagoMonto ?? 0),
        creadoEn: d.creadoEn || new Date().toISOString(),
        orden: typeof d.orden === 'number' ? d.orden : index,
      }));
    }
  } catch (err) {
    console.error('Error al leer deudas:', err);
  }
  return MOCK_DEUDAS_INICIAL.map((d, index) => ({ ...d, orden: index }));
}

/**
 * Retorna movimientos con soporte de filtros opcionales
 */
export function getMovimientos(filtros?: FiltrosMovimiento): Movimiento[] {
  asegurarInicializacion();
  let items: Movimiento[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS);
    if (raw) {
      items = JSON.parse(raw);
    } else {
      items = MOCK_MOVIMIENTOS_INICIAL;
    }
  } catch (err) {
    console.error('Error al leer movimientos:', err);
    items = MOCK_MOVIMIENTOS_INICIAL;
  }

  if (!filtros) return items;

  return items.filter((m) => {
    if (filtros.billeteraId && filtros.billeteraId !== 'todas') {
      if (m.billeteraId !== filtros.billeteraId) return false;
    }
    if (filtros.tipo && filtros.tipo !== 'todos') {
      if (m.tipo !== filtros.tipo) return false;
    }
    if (filtros.mes && filtros.mes !== 'todos') {
      const fechaNormal = (m.fecha || '').toLowerCase();
      const mesFiltro = filtros.mes.toLowerCase();
      if (!fechaNormal.includes(mesFiltro)) return false;
    }
    return true;
  });
}

/**
 * Calcula el flujo del mes (ingresos − gastos del mes)
 */
export function getFlujoMes(mes?: string): FlujoMes {
  const movimientos = getMovimientos();
  const mesBuscado = (mes || 'sep').toLowerCase();

  const filtrados = movimientos.filter((m) => {
    if (!mes) return true; // Si no hay mes especificado, toma todo el ciclo
    return (m.fecha || '').toLowerCase().includes(mesBuscado);
  });

  let ingresos = 0;
  let gastos = 0;

  for (const m of filtrados) {
    const monto = Math.abs(Number(m.monto) || 0);
    if (m.tipo === 'ingreso') {
      ingresos += monto;
    } else {
      gastos += monto;
    }
  }

  return {
    ingresos,
    gastos,
    neto: ingresos - gastos,
  };
}

/**
 * Retorna el resumen financiero general de la aplicación.
 * Conectado con la lógica real de Deuda Cero, Billeteras y Flujo del Mes.
 */
export function getResumen(): ResumenFinanciero {
  const deudas = getDeudas();
  const disponibleMensual = getDisponibleMensual();

  const saldoDisponible = getSaldoTotal();
  const flujoMes = getFlujoMes('sep');

  // Deudas activas (no saldadas con saldo > 0)
  const deudasActivas = deudas.filter((d) => !d.saldada && d.saldo > 0);
  const deudaTotal = deudasActivas.reduce((acc, d) => acc + d.saldo, 0);

  // Cálculo del porcentaje de deuda pagada
  const deudaTotalOriginal = deudas.reduce((acc, d) => {
    const original = d.montoOriginal || d.saldo;
    return acc + original;
  }, 0);

  const deudaPagadaAcumulada = Math.max(0, deudaTotalOriginal - deudaTotal);
  const porcentajeDeudaPagada = deudaTotalOriginal > 0
    ? Math.min(100, Math.round((deudaPagadaAcumulada / deudaTotalOriginal) * 100))
    : 100;

  // Plan de Deuda Cero en vivo (estrategia por defecto: Bola de Nieve)
  const plan = calcularPlan(deudasActivas, disponibleMensual, 'bola_de_nieve');

  // Próximo pago más relevante
  const proximaDeuda = deudasActivas[0];
  const proximoPago = proximaDeuda
    ? {
        id: proximaDeuda.id,
        nombre: proximaDeuda.nombre,
        monto: proximaDeuda.pagoMinimo,
        fecha: proximaDeuda.proximaFechaPago || '15 sep',
        categoria: proximaDeuda.tipo === 'tarjeta' ? 'Tarjeta de crédito' : 'Obligación',
      }
    : {
        id: 'ninguno',
        nombre: 'Sin pagos pendientes',
        monto: 0,
        fecha: 'Al día',
        categoria: 'Libre de deudas',
      };

  // Cálculo de progreso de libertad
  const progresoLibertadPorcentaje = deudasActivas.length === 0
    ? 100
    : Math.min(100, Math.max(5, porcentajeDeudaPagada));

  return {
    usuario: getNombreUsuario() || '',
    saldoDisponible,
    deudaTotal,
    deudaOriginalTotal: deudaTotalOriginal,
    porcentajeDeudaPagada,
    fechaLibertad: deudasActivas.length === 0 ? '¡Libre de deudas!' : plan.fechaLibertad,
    progresoLibertadPorcentaje,
    proximoPago,
    mesActual: 'Septiembre 2026',
    flujoMes,
  };
}

// ==========================================
// SETTERS Y MUTADORES PÚBLICOS
// ==========================================

export function setDeudas(deudas: Deuda[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEUDAS, JSON.stringify(deudas));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar deudas:', err);
  }
}

export function setBilleteras(billeteras: Billetera[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLETERAS, JSON.stringify(billeteras));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar billeteras:', err);
  }
}

export function setMovimientos(movimientos: Movimiento[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(movimientos));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar movimientos:', err);
  }
}

/**
 * Guarda o actualiza una billetera
 */
export function guardarBilletera(billetera: Billetera): void {
  const billeteras = getBilleteras();
  const index = billeteras.findIndex((b) => b.id === billetera.id);

  const normalizada: Billetera = {
    ...billetera,
    saldo: Number(billetera.saldo) || 0,
    creadoEn: billetera.creadoEn || new Date().toISOString(),
  };

  let nuevas: Billetera[];
  if (index >= 0) {
    nuevas = [...billeteras];
    nuevas[index] = normalizada;
  } else {
    nuevas = [normalizada, ...billeteras];
  }

  setBilleteras(nuevas);
}

/**
 * Elimina una billetera por ID
 */
export function eliminarBilletera(id: string): void {
  const billeteras = getBilleteras();
  const nuevas = billeteras.filter((b) => b.id !== id);
  setBilleteras(nuevas);
}

/**
 * Guarda o actualiza una deuda
 */
export function guardarDeuda(deuda: Deuda): void {
  const deudas = getDeudas();
  const index = deudas.findIndex((d) => d.id === deuda.id);

  const ordenCalculado =
    typeof deuda.orden === 'number'
      ? deuda.orden
      : index >= 0 && typeof deudas[index].orden === 'number'
      ? deudas[index].orden
      : deudas.length;

  const normalizada: Deuda = {
    ...deuda,
    saldo: Math.max(0, deuda.saldo),
    saldoTotal: Math.max(0, deuda.saldo),
    pagoMinimo: Math.max(0, deuda.pagoMinimo),
    tasaMensual: Math.max(0, deuda.tasaMensual),
    saldada: Boolean(deuda.saldada),
    creadoEn: deuda.creadoEn || new Date().toISOString(),
    orden: ordenCalculado,
  };

  let nuevasDeudas: Deuda[];
  if (index >= 0) {
    nuevasDeudas = [...deudas];
    nuevasDeudas[index] = normalizada;
  } else {
    nuevasDeudas = [normalizada, ...deudas];
  }

  setDeudas(nuevasDeudas);
}

/**
 * Reordena las deudas según un arreglo de IDs en orden manual
 */
export function reordenarDeudas(idsEnOrden: string[]): void {
  const deudas = getDeudas();
  const mapa = new Map(deudas.map((d) => [d.id, d]));
  const reordenadas: Deuda[] = [];

  idsEnOrden.forEach((id, idx) => {
    const d = mapa.get(id);
    if (d) {
      reordenadas.push({ ...d, orden: idx });
      mapa.delete(id);
    }
  });

  // Conservar las que no estén en la lista
  mapa.forEach((d) => {
    reordenadas.push({ ...d, orden: reordenadas.length });
  });

  setDeudas(reordenadas);
}

/**
 * Elimina una deuda por ID
 */
export function eliminarDeuda(id: string): void {
  const deudas = getDeudas();
  const nuevasDeudas = deudas.filter((d) => d.id !== id);
  setDeudas(nuevasDeudas);
}

/**
 * Marca una deuda como saldada (o la alterna)
 */
export function marcarSaldada(id: string, saldada: boolean = true): void {
  const deudas = getDeudas();
  const nuevasDeudas = deudas.map((d) => {
    if (d.id === id) {
      const saldoRestaurado = saldada ? 0 : (d.saldo > 0 ? d.saldo : (d.montoOriginal || 0));
      return {
        ...d,
        saldada,
        saldo: saldoRestaurado,
        saldoTotal: saldoRestaurado,
      };
    }
    return d;
  });
  setDeudas(nuevasDeudas);
}

/**
 * Registra un movimiento y ACTUALIZA el saldo de la billetera:
 * - Si es 'ingreso': suma al saldo de la billetera.
 * - Si es 'gasto' o 'pago_deuda': resta del saldo de la billetera.
 */
export function registrarMovimiento(movInput: Omit<Movimiento, 'id'> | Movimiento): Movimiento {
  const billeteras = getBilleteras();
  const movimientos = getMovimientos();

  const id = 'id' in movInput && movInput.id ? movInput.id : `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const montoAbs = Math.abs(Number(movInput.monto) || 0);

  // Actualizar el saldo de la billetera correspondiente
  const billeteraIndex = billeteras.findIndex((b) => b.id === movInput.billeteraId);
  let billeteraNombre = movInput.billeteraNombre || 'Billetera';

  if (billeteraIndex >= 0) {
    const b = { ...billeteras[billeteraIndex] };
    billeteraNombre = b.nombre;

    if (movInput.tipo === 'ingreso') {
      b.saldo += montoAbs;
    } else {
      // Permitir saldo negativo (sobregiro): si el gasto supera el saldo, queda en negativo.
      b.saldo = b.saldo - montoAbs;
    }

    billeteras[billeteraIndex] = b;
    setBilleteras(billeteras);
  }

  const nuevoMov: Movimiento = {
    ...movInput,
    id,
    monto: montoAbs,
    billeteraNombre,
    nota: movInput.nota || movInput.descripcion || '',
    descripcion: movInput.descripcion || movInput.nota || '',
    creadoEn: movInput.creadoEn || new Date().toISOString(),
  };

  const nuevosMovs = [nuevoMov, ...movimientos];
  setMovimientos(nuevosMovs);
  return nuevoMov;
}

/**
 * INTEGRACIÓN CON DEUDAS:
 * Abona a una deuda desde una billetera real:
 * - Crea un Movimiento tipo 'gasto' (categoría "Deudas", con deudaId).
 * - Resta el saldo de la billetera.
 * - Reduce el saldo de la deuda.
 * - Si el saldo de la deuda llega a 0, la marca como saldada y reporta deudaSaldada: true.
 */
export function abonarDeudaDesdeBilletera(
  deudaId: string,
  billeteraId: string,
  monto: number
): { exito: boolean; deudaSaldada: boolean; deuda?: Deuda; movimiento?: Movimiento; error?: string } {
  const montoAbono = Math.abs(Number(monto) || 0);
  if (!deudaId || !billeteraId || montoAbono <= 0) {
    return { exito: false, deudaSaldada: false, error: 'Monto o datos de abono inválidos' };
  }

  const deudas = getDeudas();
  const billeteras = getBilleteras();

  const dIndex = deudas.findIndex((d) => d.id === deudaId);
  const bIndex = billeteras.findIndex((b) => b.id === billeteraId);

  if (dIndex === -1) {
    return { exito: false, deudaSaldada: false, error: 'Obligación no encontrada' };
  }
  if (bIndex === -1) {
    return { exito: false, deudaSaldada: false, error: 'Billetera no encontrada' };
  }

  const deuda = { ...deudas[dIndex] };
  const billetera = { ...billeteras[bIndex] };

  if (montoAbono > billetera.saldo) {
    return {
      exito: false,
      deudaSaldada: false,
      error: 'No tienes suficiente en esta billetera',
    };
  }

  // 1. Restar saldo de la billetera
  billetera.saldo = Math.max(0, billetera.saldo - montoAbono);
  billeteras[bIndex] = billetera;

  // 2. Reducir saldo de la deuda
  const saldoActual = deuda.saldo ?? deuda.saldoTotal ?? 0;
  const nuevoSaldo = Math.max(0, saldoActual - montoAbono);
  const deudaSaldada = nuevoSaldo === 0;

  deuda.saldo = nuevoSaldo;
  deuda.saldoTotal = nuevoSaldo;
  deuda.saldada = deudaSaldada;
  deudas[dIndex] = deuda;

  // 3. Crear movimiento de gasto con categoría "Deudas"
  const mesesAbrev = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const ahora = new Date();
  const fechaLegible = `${ahora.getDate().toString().padStart(2, '0')} ${mesesAbrev[ahora.getMonth()]} ${ahora.getFullYear()}`;

  const nuevoMov: Movimiento = {
    id: `mov-abono-${Date.now()}`,
    tipo: 'gasto',
    monto: montoAbono,
    billeteraId: billetera.id,
    billeteraNombre: billetera.nombre,
    categoria: 'Deudas',
    fecha: fechaLegible,
    nota: `Abono a ${deuda.nombre}`,
    descripcion: `Abono a ${deuda.nombre}`,
    deudaId: deuda.id,
    creadoEn: ahora.toISOString(),
  };

  const movimientos = getMovimientos();
  const nuevosMovs = [nuevoMov, ...movimientos];

  // Persistir cambios
  setBilleteras(billeteras);
  setDeudas(deudas);
  setMovimientos(nuevosMovs);

  return {
    exito: true,
    deudaSaldada,
    deuda,
    movimiento: nuevoMov,
  };
}

/**
 * Obtiene el nivel de acceso actual del usuario.
 * Por defecto es 'demo' (solo Termómetro).
 */
export function getNivelAcceso(): NivelAcceso {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NIVEL_ACCESO);
    if (!raw) return 'demo';
    const parsed = JSON.parse(raw);
    if (parsed === 'demo' || parsed === 'entrada' || parsed === 'pro') {
      return parsed;
    }
    return 'demo';
  } catch (err) {
    console.error('Error al leer nivel de acceso:', err);
    return 'demo';
  }
}

/**
 * Actualiza el nivel de acceso de licencia y notifica a los suscriptores.
 */
export function setNivelAcceso(nivel: NivelAcceso): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NIVEL_ACCESO, JSON.stringify(nivel));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar nivel de acceso:', err);
  }
}

/**
 * Obtiene los últimos datos ingresados en el Termómetro
 */
export function getDatosTermometro(): DatosTermometro | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DATOS_TERMOMETRO);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error al leer datos del termómetro:', err);
    return null;
  }
}

/**
 * Guarda los datos ingresados en el Termómetro de deudas
 */
export function guardarDatosTermometro(datos: DatosTermometro): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.DATOS_TERMOMETRO,
      JSON.stringify({
        ...datos,
        fechaRegistro: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('Error al guardar datos del termómetro:', err);
  }
}

/**
 * Restablece los datos de prueba originales de Colombia
 */
export function restablecerDatosEjemplo(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLETERAS, JSON.stringify(MOCK_BILLETERAS_INICIAL));
    localStorage.setItem(STORAGE_KEYS.DEUDAS, JSON.stringify(MOCK_DEUDAS_INICIAL));
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(MOCK_MOVIMIENTOS_INICIAL));
    localStorage.setItem(
      STORAGE_KEYS.DISPONIBLE_DEUDAS,
      JSON.stringify(MOCK_DISPONIBLE_MENSUAL_INICIAL)
    );
    localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
    localStorage.setItem(STORAGE_KEYS.NIVEL_ACCESO, JSON.stringify('demo'));
    localStorage.removeItem(STORAGE_KEYS.PRESUPUESTOS);
    localStorage.removeItem(STORAGE_KEYS.SOBRES);
    notificarCambio();
  } catch (err) {
    console.error('Error al restablecer datos de ejemplo:', err);
  }
}

// ==========================================
// PRESUPUESTOS (Pro · Crecer)
// ==========================================

export function getPresupuestos(): Presupuesto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESUPUESTOS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer presupuestos:', err);
  }
  return MOCK_PRESUPUESTOS_INICIAL;
}

export function setPresupuestos(items: Presupuesto[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESUPUESTOS, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar presupuestos:', err);
  }
}

export function guardarPresupuesto(categoria: string, tope: number): void {
  const cat = (categoria || '').trim();
  if (!cat) return;
  const items = getPresupuestos();
  const idx = items.findIndex((p) => p.categoria.toLowerCase() === cat.toLowerCase());
  const valor = Math.max(0, Math.round(tope));
  let nuevos: Presupuesto[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = { categoria: items[idx].categoria, tope: valor };
  } else {
    nuevos = [...items, { categoria: cat, tope: valor }];
  }
  setPresupuestos(nuevos);
}

export function eliminarPresupuesto(categoria: string): void {
  const items = getPresupuestos().filter(
    (p) => p.categoria.toLowerCase() !== (categoria || '').toLowerCase()
  );
  setPresupuestos(items);
}

/**
 * Suma de gastos por categoría en un mes dado (por defecto 'sep').
 */
export function getGastoPorCategoria(mes: string = 'sep'): Record<string, number> {
  const movimientos = getMovimientos();
  const mesBuscado = (mes || '').toLowerCase();
  const acc: Record<string, number> = {};
  for (const m of movimientos) {
    if (m.tipo !== 'gasto') continue;
    if (mesBuscado && !(m.fecha || '').toLowerCase().includes(mesBuscado)) continue;
    const cat = m.categoria || 'Otro';
    acc[cat] = (acc[cat] || 0) + Math.abs(Number(m.monto) || 0);
  }
  return acc;
}

// ==========================================
// SOBRES (Pro · Crecer)
// ==========================================

export function getSobres(): Sobre[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOBRES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer sobres:', err);
  }
  return MOCK_SOBRES_INICIAL;
}

export function setSobres(items: Sobre[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOBRES, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar sobres:', err);
  }
}

export function guardarSobre(sobre: Sobre): void {
  const items = getSobres();
  const idx = items.findIndex((s) => s.id === sobre.id);
  const normal: Sobre = {
    ...sobre,
    apartado: Math.max(0, Math.round(sobre.apartado || 0)),
    meta: sobre.meta != null ? Math.max(0, Math.round(sobre.meta)) : undefined,
    creadoEn: sobre.creadoEn || new Date().toISOString(),
  };
  let nuevos: Sobre[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = normal;
  } else {
    nuevos = [...items, normal];
  }
  setSobres(nuevos);
}

export function eliminarSobre(id: string): void {
  setSobres(getSobres().filter((s) => s.id !== id));
}

export function getTotalApartadoSobres(): number {
  return getSobres().reduce((sum, s) => sum + (Number(s.apartado) || 0), 0);
}
