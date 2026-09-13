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
  RetoAhorro,
  Suscripcion,
  TarjetaCredito,
  PerfilFlujo,
} from '../types';
import { calcularPlan } from '../logic/planDeudas';
import { MESES_ABREV } from '../utils/fechas';
import { formatearCOP } from '../utils/format';
import {
  mensualDesdeEA,
  repartoBasicoSugerido,
  ID_BASICO_ARRIENDO,
  ID_BASICO_MERCADO,
  ID_BASICO_SERVICIOS,
  ID_BASICO_TRANSPORTE,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  CATS_ARRIENDO,
  CATS_MERCADO,
  CATS_SERVICIOS,
  CATS_TRANSPORTE,
  CATS_GUSTOS,
  sinSobre,
  movidoEsteMes,
  esSobreDeAcumulacion,
} from '../logic/sistema';
import { aporteDeSemana } from '../logic/retos';
import { sangradoVigente } from '../logic/suscripciones';

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
  RETOS: 'bolsillo_data_retos_v3',
  SUSCRIPCIONES: 'bolsillo_data_suscripciones_v3',
  TARJETAS_CREDITO: 'bolsillo_data_tarjetas_credito_v3',
  PERFIL_FLUJO: 'bolsillo_data_perfil_flujo_v3',
};

/**
 * ¿Arrancamos con el mes de ejemplo o en blanco?
 *
 * En desarrollo, con ejemplo: es lo que permite trabajar las pantallas sin
 * teclear un mes entero cada vez. En producción, en blanco: quien paga abre la
 * app y ve SUS datos, no los de Marcela.
 *
 * VITE_DATOS_EJEMPLO=1 fuerza el ejemplo en un build de producción (para
 * enseñar la app); VITE_DATOS_EJEMPLO=0 lo apaga en desarrollo (para probar
 * cómo se ve el primer día).
 */
export const DATOS_DE_EJEMPLO =
  import.meta.env.VITE_DATOS_EJEMPLO === '1' ||
  (import.meta.env.DEV && import.meta.env.VITE_DATOS_EJEMPLO !== '0');

/** El respaldo de cada getter pasa por aquí: con ejemplo devuelve, sin él, nada. */
function ejemplo<T>(datos: T[]): T[] {
  return DATOS_DE_EJEMPLO ? datos : [];
}

// ==========================================
// SEMILLA DE DATOS REALISTAS DE COLOMBIA
// ==========================================

/** Lo que queda para deudas: ingreso $3.200.000 menos lo básico $2.230.000. */
const MOCK_DISPONIBLE_MENSUAL_INICIAL = 970000;

const MOCK_PERFIL_FLUJO: PerfilFlujo = {
  ingresoMensual: 3200000,
  gastosBasicos: 2230000,
  configuradoEn: '2026-09-12',
};

/**
 * El perfil de ejemplo de la v3: dos tarjetas y un crédito. Con $970.000 al mes
 * sale en agosto 2027; pagando solo mínimos, en enero 2029.
 */
const MOCK_DEUDAS_INICIAL: Deuda[] = [
  {
    id: 'deuda-mastercard',
    nombre: 'Mastercard Bancolombia',
    tipo: 'tarjeta',
    saldo: 1200000,
    saldoTotal: 1200000,
    montoOriginal: 1200000,
    tasaEA: 28,
    tasaMensual: mensualDesdeEA(28),
    pagoMinimo: 180000,
    diaCorte: 16,
    diaPago: 3,
    cupo: 5000000,
    saldada: false,
    creadoEn: '2026-09-12',
    entidad: 'Bancolombia',
  },
  {
    id: 'deuda-nu',
    nombre: 'Tarjeta Nu',
    tipo: 'tarjeta',
    saldo: 2500000,
    saldoTotal: 2500000,
    montoOriginal: 2500000,
    tasaEA: 29,
    tasaMensual: mensualDesdeEA(29),
    pagoMinimo: 120000,
    diaCorte: 25,
    diaPago: 10,
    cupo: 3000000,
    saldada: false,
    creadoEn: '2026-09-12',
    entidad: 'Nu Colombia',
  },
  {
    id: 'deuda-libre',
    nombre: 'Libre inversión Bancolombia',
    tipo: 'prestamo',
    saldo: 6100000,
    saldoTotal: 6100000,
    montoOriginal: 6100000,
    tasaEA: 19.5,
    tasaMensual: mensualDesdeEA(19.5),
    pagoMinimo: 450000,
    diaPago: 15,
    saldada: false,
    creadoEn: '2026-09-12',
    entidad: 'Bancolombia',
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

/**
 * Movimientos de ejemplo: un mes anterior completo (agosto) y el mes en curso
 * hasta hoy (septiembre). El mes cerrado es lo que le permite a Inicio comparar
 * ritmo, categorías y reparto contra "el mes pasado" desde el primer minuto.
 */
type MovimientoSemilla = [
  tipo: 'ingreso' | 'gasto',
  monto: number,
  billeteraId: string,
  billeteraNombre: string,
  categoria: string,
  fecha: string,
  iso: string,
  nota: string,
  deudaId?: string
];

const SEMILLA_MOVIMIENTOS: MovimientoSemilla[] = [
  // --- Septiembre (mes en curso) ---
  ['gasto', 22000, 'bil-efectivo', 'Efectivo', 'Transporte', '06 sep 2026', '2026-09-06T15:00:00.000Z', 'Transporte de la semana'],
  ['gasto', 16900, 'bil-bancolombia', 'Bancolombia', 'Ocio', '05 sep 2026', '2026-09-05T15:00:00.000Z', 'Spotify'],
  ['gasto', 164000, 'bil-bancolombia', 'Bancolombia', 'Servicios', '03 sep 2026', '2026-09-03T15:00:00.000Z', 'Luz y agua'],
  ['gasto', 120000, 'bil-efectivo', 'Efectivo', 'Comida', '02 sep 2026', '2026-09-02T15:00:00.000Z', 'Mercado'],
  ['gasto', 89900, 'bil-bancolombia', 'Bancolombia', 'Salud', '01 sep 2026', '2026-09-01T15:00:00.000Z', 'Gimnasio Smart Fit'],
  ['ingreso', 1600000, 'bil-nequi', 'Nequi', 'Salario', '01 sep 2026', '2026-09-01T14:00:00.000Z', 'Salario quincena'],

  // --- Agosto (mes cerrado, para comparar) ---
  ['gasto', 24000, 'bil-efectivo', 'Efectivo', 'Transporte', '30 ago 2026', '2026-08-30T15:00:00.000Z', 'Transporte de la semana'],
  ['gasto', 450000, 'bil-bancolombia', 'Bancolombia', 'Deudas', '30 ago 2026', '2026-08-30T14:00:00.000Z', 'Abono a Libre inversión Bancolombia', 'deuda-libre'],
  ['gasto', 48000, 'bil-nequi', 'Nequi', 'Servicios', '28 ago 2026', '2026-08-28T15:00:00.000Z', 'Datos del celu'],
  ['gasto', 112000, 'bil-efectivo', 'Efectivo', 'Comida', '25 ago 2026', '2026-08-25T15:00:00.000Z', 'Mercado'],
  ['gasto', 26000, 'bil-efectivo', 'Efectivo', 'Transporte', '22 ago 2026', '2026-08-22T15:00:00.000Z', 'Transporte de la semana'],
  ['gasto', 29900, 'bil-bancolombia', 'Bancolombia', 'Ocio', '20 ago 2026', '2026-08-20T15:00:00.000Z', 'Disney+'],
  ['gasto', 124000, 'bil-efectivo', 'Efectivo', 'Comida', '16 ago 2026', '2026-08-16T15:00:00.000Z', 'Mercado'],
  ['ingreso', 1600000, 'bil-nequi', 'Nequi', 'Salario', '16 ago 2026', '2026-08-16T14:00:00.000Z', 'Salario quincena'],
  ['gasto', 44900, 'bil-bancolombia', 'Bancolombia', 'Ocio', '15 ago 2026', '2026-08-15T15:00:00.000Z', 'Netflix'],
  ['gasto', 120000, 'bil-bancolombia', 'Bancolombia', 'Deudas', '15 ago 2026', '2026-08-15T14:00:00.000Z', 'Abono a Tarjeta Nu', 'deuda-nu'],
  ['gasto', 28000, 'bil-efectivo', 'Efectivo', 'Transporte', '14 ago 2026', '2026-08-14T15:00:00.000Z', 'Transporte de la semana'],
  ['gasto', 62000, 'bil-nequi', 'Nequi', 'Comida', '10 ago 2026', '2026-08-10T15:00:00.000Z', 'Almuerzos'],
  ['gasto', 180000, 'bil-nequi', 'Nequi', 'Deudas', '08 ago 2026', '2026-08-08T14:00:00.000Z', 'Abono a Mastercard Bancolombia', 'deuda-mastercard'],
  ['gasto', 32000, 'bil-efectivo', 'Efectivo', 'Transporte', '07 ago 2026', '2026-08-07T15:00:00.000Z', 'Transporte de la semana'],
  ['gasto', 16900, 'bil-bancolombia', 'Bancolombia', 'Ocio', '05 ago 2026', '2026-08-05T15:00:00.000Z', 'Spotify'],
  ['gasto', 178000, 'bil-bancolombia', 'Bancolombia', 'Servicios', '03 ago 2026', '2026-08-03T15:00:00.000Z', 'Luz y agua'],
  ['gasto', 138000, 'bil-efectivo', 'Efectivo', 'Comida', '02 ago 2026', '2026-08-02T15:00:00.000Z', 'Mercado'],
  ['gasto', 89900, 'bil-bancolombia', 'Bancolombia', 'Salud', '01 ago 2026', '2026-08-01T15:00:00.000Z', 'Gimnasio Smart Fit'],
  ['ingreso', 1600000, 'bil-nequi', 'Nequi', 'Salario', '01 ago 2026', '2026-08-01T14:00:00.000Z', 'Salario quincena'],
];

/**
 * Meses anteriores (abril a julio). Se arman con el mismo patrón —dos
 * quincenas, el gasto grande justo después de cada una— y cifras propias por
 * mes, para que Reportes tenga historia con la que mostrar tendencias desde el
 * primer día sin escribir cien movimientos a mano.
 */
const HISTORIA_MESES = [
  { mes: 4, comida1: 148000, comida2: 132000, ocio: 112000, transporte: 176000, servicios: 234000 },
  { mes: 5, comida1: 158000, comida2: 142000, ocio: 148000, transporte: 182000, servicios: 241000 },
  { mes: 6, comida1: 178000, comida2: 162000, ocio: 118000, transporte: 174000, servicios: 228000 },
  { mes: 7, comida1: 198000, comida2: 182000, ocio: 96000, transporte: 158000, servicios: 206000 },
];

const MESES_ABREV_SEMILLA = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function movimientosDeHistoria(): MovimientoSemilla[] {
  const filas: MovimientoSemilla[] = [];

  for (const m of HISTORIA_MESES) {
    const mm = `${m.mes}`.padStart(2, '0');
    const abrev = MESES_ABREV_SEMILLA[m.mes - 1];
    const dia = (d: number) => `${`${d}`.padStart(2, '0')} ${abrev} 2026`;
    const iso = (d: number, h = '15') => `2026-${mm}-${`${d}`.padStart(2, '0')}T${h}:00:00.000Z`;

    filas.push(
      ['ingreso', 1600000, 'bil-nequi', 'Nequi', 'Salario', dia(1), iso(1, '14'), 'Salario quincena'],
      ['gasto', 89900, 'bil-bancolombia', 'Bancolombia', 'Salud', dia(1), iso(1), 'Gimnasio Smart Fit'],
      ['gasto', m.comida1, 'bil-efectivo', 'Efectivo', 'Comida', dia(2), iso(2), 'Mercado'],
      ['gasto', m.ocio, 'bil-nequi', 'Nequi', 'Ocio', dia(3), iso(3), 'Salida'],
      ['gasto', 16900, 'bil-bancolombia', 'Bancolombia', 'Ocio', dia(5), iso(5), 'Spotify'],
      ['gasto', m.servicios, 'bil-bancolombia', 'Bancolombia', 'Servicios', dia(6), iso(6), 'Luz y agua'],
      ['gasto', 180000, 'bil-nequi', 'Nequi', 'Deudas', dia(8), iso(8, '14'), 'Abono a Mastercard Bancolombia', 'deuda-mastercard'],
      ['gasto', 44900, 'bil-bancolombia', 'Bancolombia', 'Ocio', dia(15), iso(15), 'Netflix'],
      ['gasto', 120000, 'bil-bancolombia', 'Bancolombia', 'Deudas', dia(15), iso(15, '14'), 'Abono a Tarjeta Nu', 'deuda-nu'],
      ['ingreso', 1600000, 'bil-nequi', 'Nequi', 'Salario', dia(16), iso(16, '14'), 'Salario quincena'],
      ['gasto', m.comida2, 'bil-efectivo', 'Efectivo', 'Comida', dia(17), iso(17), 'Mercado'],
      ['gasto', 29900, 'bil-bancolombia', 'Bancolombia', 'Ocio', dia(20), iso(20), 'Disney+'],
      ['gasto', Math.round(m.transporte / 2), 'bil-efectivo', 'Efectivo', 'Transporte', dia(22), iso(22), 'Transporte de la quincena'],
      ['gasto', Math.round(m.transporte / 2), 'bil-efectivo', 'Efectivo', 'Transporte', dia(27), iso(27), 'Transporte de la quincena'],
      ['gasto', 48000, 'bil-nequi', 'Nequi', 'Servicios', dia(28), iso(28), 'Datos del celu'],
      ['gasto', 450000, 'bil-bancolombia', 'Bancolombia', 'Deudas', dia(30), iso(30, '14'), 'Abono a Libre inversión Bancolombia', 'deuda-libre']
    );
  }

  return filas;
}

const MOCK_MOVIMIENTOS_INICIAL: Movimiento[] = [
  ...SEMILLA_MOVIMIENTOS,
  ...movimientosDeHistoria(),
].map(
  ([tipo, monto, billeteraId, billeteraNombre, categoria, fecha, iso, nota, deudaId], i) => ({
    id: `mov-semilla-${i + 1}`,
    tipo,
    monto,
    billeteraId,
    billeteraNombre,
    categoria,
    fecha,
    nota,
    descripcion: nota,
    creadoEn: iso,
    ...(deudaId ? { deudaId } : {}),
  })
);

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
  { categoria: 'Comida', tope: 600000, color: '#5FE0A8', grupo: 'necesidad' },
  { categoria: 'Transporte', tope: 200000, color: '#25C9BE', grupo: 'necesidad' },
  { categoria: 'Servicios', tope: 250000, color: '#8AA9FF', grupo: 'necesidad' },
  { categoria: 'Ocio', tope: 150000, color: '#FF7A3D', grupo: 'gusto' },
];

// Semilla Pro: sobres digitales (dinero apartado hacia metas)
const MOCK_SOBRES_INICIAL: Sobre[] = [
  { id: 'sobre-emergencia', nombre: 'Fondo de emergencia', meta: 1000000, apartado: 300000, color: '#5FE0A8', creadoEn: '2026-08-01', billeteraId: 'bil-ahorros' },
  { id: 'sobre-arriendo', nombre: 'Arriendo', meta: 800000, apartado: 500000, color: '#25C9BE', creadoEn: '2026-08-01' },
  { id: 'sobre-moto', nombre: 'Cuota moto', meta: 2000000, apartado: 150000, color: '#FF7A3D', creadoEn: '2026-08-01' },
];

// Semilla Pro: reto de ahorro en curso
const MOCK_RETOS_INICIAL: RetoAhorro[] = [
  {
    id: 'reto-millon',
    nombre: 'Mi primer millón',
    tipo: 'semanal_fijo',
    aporteBase: 25000,
    metaTotal: 1000000,
    semanasTotales: 40,
    semanaActual: 9,
    acumulado: 200000,
    racha: 8,
    completado: false,
    color: '#5FE0A8',
    creadoEn: '2026-07-01',
  },
];

// Semilla Pro: suscripciones recurrentes
const MOCK_SUSCRIPCIONES_INICIAL: Suscripcion[] = [
  { id: 'sus-netflix', nombre: 'Netflix', monto: 44900, diaCobro: 15, categoria: 'Streaming', activa: true, color: '#E89385', creadoEn: '2026-08-01' },
  { id: 'sus-spotify', nombre: 'Spotify', monto: 16900, diaCobro: 5, categoria: 'Música', activa: true, color: '#5FE0A8', creadoEn: '2026-08-01' },
  { id: 'sus-gym', nombre: 'Gimnasio Smart Fit', monto: 89900, diaCobro: 1, categoria: 'Salud', activa: true, color: '#FF7A3D', creadoEn: '2026-08-01' },
  { id: 'sus-disney', nombre: 'Disney+', monto: 29900, diaCobro: 20, categoria: 'Streaming', activa: true, color: '#8AA9FF', creadoEn: '2026-08-01' },
  {
    id: 'sus-hbo',
    nombre: 'HBO Max',
    monto: 26900,
    diaCobro: 11,
    categoria: 'Streaming',
    activa: true,
    color: '#8AA9FF',
    creadoEn: '2026-09-04',
    // Prueba gratis de 7 días: el 11 se acaba y pasa a costar $26.900 al mes.
    promo: { monto: 0, desde: '2026-09-04', hasta: '2026-09-11' },
  },
];

// Semilla Pro: tarjetas de crédito (días de corte y pago)
const MOCK_TARJETAS_CREDITO_INICIAL: TarjetaCredito[] = [
  { id: 'tc-mastercard', nombre: 'Mastercard Bancolombia', diaCorte: 16, diaPago: 3, cupo: 5000000, tasaMensual: mensualDesdeEA(28), deudaId: 'deuda-mastercard', color: '#FF7A3D', creadoEn: '2026-09-12' },
  { id: 'tc-nu', nombre: 'Tarjeta Nu', diaCorte: 25, diaPago: 10, cupo: 3000000, tasaMensual: mensualDesdeEA(29), deudaId: 'deuda-nu', color: '#25C9BE', creadoEn: '2026-09-12' },
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
    if (!DATOS_DE_EJEMPLO) return;
    const inicializado = localStorage.getItem(STORAGE_KEYS.INICIALIZADO);
    if (!inicializado) {
      localStorage.setItem(STORAGE_KEYS.BILLETERAS, JSON.stringify(MOCK_BILLETERAS_INICIAL));
      localStorage.setItem(STORAGE_KEYS.DEUDAS, JSON.stringify(MOCK_DEUDAS_INICIAL));
      localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(MOCK_MOVIMIENTOS_INICIAL));
      localStorage.setItem(
        STORAGE_KEYS.DISPONIBLE_DEUDAS,
        JSON.stringify(MOCK_DISPONIBLE_MENSUAL_INICIAL)
      );
      localStorage.setItem(STORAGE_KEYS.PERFIL_FLUJO, JSON.stringify(MOCK_PERFIL_FLUJO));
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
  return DATOS_DE_EJEMPLO ? 'Marcela' : '';
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
  return DATOS_DE_EJEMPLO ? MOCK_DISPONIBLE_MENSUAL_INICIAL : 0;
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

/**
 * El mes en limpio. null = todavía no configuró su plan: la app lo lleva a
 * configurarlo antes de enseñarle nada.
 */
export function getPerfilFlujo(): PerfilFlujo | null {
  asegurarInicializacion();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERFIL_FLUJO);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer el perfil de flujo:', err);
  }
  return null;
}

/**
 * Guarda el mes en limpio. Lo que queda después de lo básico ES la plata para
 * salir de deudas: no se le pide a la persona que adivine una cifra aparte.
 */
export function setPerfilFlujo(perfil: Omit<PerfilFlujo, 'configuradoEn'>): void {
  try {
    const limpio: PerfilFlujo = {
      ingresoMensual: Math.max(0, Math.round(perfil.ingresoMensual)),
      gastosBasicos: Math.max(0, Math.round(perfil.gastosBasicos)),
      configuradoEn: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PERFIL_FLUJO, JSON.stringify(limpio));
    localStorage.setItem(
      STORAGE_KEYS.DISPONIBLE_DEUDAS,
      JSON.stringify(Math.max(0, limpio.ingresoMensual - limpio.gastosBasicos))
    );
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar el perfil de flujo:', err);
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
  return ejemplo(MOCK_BILLETERAS_INICIAL);
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
  return ejemplo(MOCK_DEUDAS_INICIAL).map((d, index) => ({ ...d, orden: index }));
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
      items = ejemplo(MOCK_MOVIMIENTOS_INICIAL);
    }
  } catch (err) {
    console.error('Error al leer movimientos:', err);
    items = ejemplo(MOCK_MOVIMIENTOS_INICIAL);
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
    } else if (m.tipo !== 'transferencia') {
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
    tasaMensual:
      typeof deuda.tasaEA === 'number' && deuda.tasaEA > 0
        ? mensualDesdeEA(deuda.tasaEA)
        : Math.max(0, deuda.tasaMensual),
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
    localStorage.setItem(STORAGE_KEYS.PERFIL_FLUJO, JSON.stringify(MOCK_PERFIL_FLUJO));
    localStorage.setItem(STORAGE_KEYS.INICIALIZADO, 'true');
    localStorage.setItem(STORAGE_KEYS.NIVEL_ACCESO, JSON.stringify('demo'));
    localStorage.removeItem(STORAGE_KEYS.PRESUPUESTOS);
    localStorage.removeItem(STORAGE_KEYS.SOBRES);
    localStorage.removeItem(STORAGE_KEYS.RETOS);
    localStorage.removeItem(STORAGE_KEYS.SUSCRIPCIONES);
    localStorage.removeItem(STORAGE_KEYS.TARJETAS_CREDITO);
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
  return ejemplo(MOCK_PRESUPUESTOS_INICIAL);
}

export function setPresupuestos(items: Presupuesto[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESUPUESTOS, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar presupuestos:', err);
  }
}

export function guardarPresupuesto(p: Presupuesto): void {
  const cat = (p.categoria || '').trim();
  if (!cat) return;
  const items = getPresupuestos();
  const idx = items.findIndex((x) => x.categoria.toLowerCase() === cat.toLowerCase());
  const normal: Presupuesto = {
    categoria: idx >= 0 ? items[idx].categoria : cat,
    tope: Math.max(0, Math.round(p.tope)),
    color: p.color,
    grupo: p.grupo,
  };
  let nuevos: Presupuesto[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = normal;
  } else {
    nuevos = [...items, normal];
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

export function asegurarSobresSistema(perfil: PerfilFlujo | null): void {
  if (!perfil) return;
  const sobres = getSobres();
  const reparto = repartoBasicoSugerido(perfil.gastosBasicos);

  const plantillas: Partial<Sobre>[] = [
    { id: ID_BASICO_ARRIENDO, nombre: 'Arriendo', grupo: 'basico', presupuestoMensual: reparto.arriendo, categorias: CATS_ARRIENDO, sistema: true, color: '#25C9BE' },
    { id: ID_BASICO_MERCADO, nombre: 'Mercado', grupo: 'basico', presupuestoMensual: reparto.mercado, categorias: CATS_MERCADO, sistema: true, color: '#5FE0A8', modulo: 'lista_compras' },
    { id: ID_BASICO_SERVICIOS, nombre: 'Servicios', grupo: 'basico', presupuestoMensual: reparto.servicios, categorias: CATS_SERVICIOS, sistema: true, color: '#8AA9FF' },
    { id: ID_BASICO_TRANSPORTE, nombre: 'Transporte', grupo: 'basico', presupuestoMensual: reparto.transporte, categorias: CATS_TRANSPORTE, sistema: true, color: '#FF7A3D' },
    { id: ID_SOBRE_COLCHON, nombre: 'Fondo blindado', grupo: 'libre', categorias: [], sistema: true, color: '#25C9BE' },
    { id: ID_SOBRE_INVERSION, nombre: 'Inversión', grupo: 'libre', categorias: [], sistema: true, color: '#8AA9FF', modulo: 'activos' },
    { id: ID_LIBRE_GUSTOS, nombre: 'Gustos', grupo: 'libre', categorias: CATS_GUSTOS, sistema: true, color: '#FF7A3D' },
  ];

  let modificados = false;
  const nuevos = [...sobres];

  for (const tpl of plantillas) {
    if (!nuevos.find((s) => s.id === tpl.id)) {
      nuevos.push({
        ...tpl,
        apartado: 0,
        creadoEn: new Date().toISOString(),
        historial: [],
      } as Sobre);
      modificados = true;
    }
  }

  if (modificados) setSobres(nuevos);
}

export function repartirBasicosDeNuevo(perfil: PerfilFlujo | null): void {
  if (!perfil) return;
  const sobres = getSobres();
  const reparto = repartoBasicoSugerido(perfil.gastosBasicos);

  const mapeo: Record<string, number> = {
    [ID_BASICO_ARRIENDO]: reparto.arriendo,
    [ID_BASICO_MERCADO]: reparto.mercado,
    [ID_BASICO_SERVICIOS]: reparto.servicios,
    [ID_BASICO_TRANSPORTE]: reparto.transporte,
  };

  const nuevos = sobres.map((s) => {
    if (s.grupo === 'basico' && mapeo[s.id] !== undefined) {
      return { ...s, presupuestoMensual: mapeo[s.id] };
    }
    return s;
  });

  setSobres(nuevos);
}

export function getSobres(): Sobre[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOBRES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer sobres:', err);
  }
  return ejemplo(MOCK_SOBRES_INICIAL);
}

export function setSobres(items: Sobre[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SOBRES, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar sobres:', err);
  }
}

/**
 * Guarda nombre, meta, presupuesto, color y cuenta. El apartado y el historial
 * NO se toman de aquí: solo abonarASobre y retirarDeSobre los cambian, porque
 * son los que mueven la plata en las billeteras. Un sobre nuevo nace en $0.
 */
export function guardarSobre(sobre: Sobre): void {
  const items = getSobres();
  const idx = items.findIndex((s) => s.id === sobre.id);
  const actual = idx >= 0 ? items[idx] : null;
  const normal: Sobre = {
    ...sobre,
    apartado: actual ? actual.apartado : 0,
    historial: actual ? actual.historial : undefined,
    // Si ya guarda plata, cambiar de cuenta es mover esa plata: va por cambiarCuentaSobre.
    billeteraId: actual && actual.apartado > 0 && esSobreDeAcumulacion(actual) ? actual.billeteraId : sobre.billeteraId,
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

// ==========================================
// RETOS DE AHORRO (Pro · Crecer)
// ==========================================

export function getRetos(): RetoAhorro[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETOS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer retos:', err);
  }
  return ejemplo(MOCK_RETOS_INICIAL);
}

export function setRetos(items: RetoAhorro[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RETOS, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar retos:', err);
  }
}

export function guardarReto(reto: RetoAhorro): void {
  const items = getRetos();
  const idx = items.findIndex((r) => r.id === reto.id);
  let nuevos: RetoAhorro[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = reto;
  } else {
    nuevos = [...items, reto];
  }
  setRetos(nuevos);
}

export function eliminarReto(id: string): void {
  setRetos(getRetos().filter((r) => r.id !== id));
}

/** Aporte que corresponde a la semana pendiente de un reto. */
export function aporteSemanaDe(reto: RetoAhorro): number {
  if (reto.completado) return 0;
  return aporteDeSemana(reto, reto.semanaActual);
}

/**
 * Registra el aporte de la semana actual: suma al acumulado, avanza semana,
 * incrementa la racha y marca completado si toca.
 */
export function aportarSemanaReto(
  id: string
): { exito: boolean; aporte: number; completado: boolean; acumulado: number } {
  const retos = getRetos();
  const idx = retos.findIndex((r) => r.id === id);
  if (idx < 0) return { exito: false, aporte: 0, completado: false, acumulado: 0 };

  const r = { ...retos[idx] };
  if (r.completado) return { exito: false, aporte: 0, completado: true, acumulado: r.acumulado };

  const aporte = aporteDeSemana(r, r.semanaActual);
  r.acumulado += aporte;
  r.semanaActual += 1;
  r.racha += 1;
  if (r.semanaActual > r.semanasTotales || r.acumulado >= r.metaTotal) {
    r.completado = true;
  }

  retos[idx] = r;
  setRetos(retos);
  return { exito: true, aporte, completado: r.completado, acumulado: r.acumulado };
}

// ==========================================
// SUSCRIPCIONES (Pro · Crecer)
// ==========================================

export function getSuscripciones(): Suscripcion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUSCRIPCIONES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer suscripciones:', err);
  }
  return ejemplo(MOCK_SUSCRIPCIONES_INICIAL);
}

export function setSuscripciones(items: Suscripcion[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUSCRIPCIONES, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar suscripciones:', err);
  }
}

export function guardarSuscripcion(sus: Suscripcion): void {
  const items = getSuscripciones();
  const idx = items.findIndex((s) => s.id === sus.id);
  const normal: Suscripcion = {
    ...sus,
    monto: Math.max(0, Math.round(sus.monto || 0)),
    diaCobro: Math.min(31, Math.max(1, Math.round(sus.diaCobro || 1))),
    creadoEn: sus.creadoEn || new Date().toISOString(),
  };
  let nuevos: Suscripcion[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = normal;
  } else {
    nuevos = [...items, normal];
  }
  setSuscripciones(nuevos);
}

export function eliminarSuscripcion(id: string): void {
  setSuscripciones(getSuscripciones().filter((s) => s.id !== id));
}

/**
 * Suma mensual de las suscripciones activas (el "sangrado"), contando el
 * precio que está vigente hoy: si algo está en promoción, cuesta lo de la
 * promoción hasta que se acabe.
 */
export function getSangradoMensual(): number {
  return sangradoVigente(getSuscripciones(), new Date());
}

// ==========================================
// TARJETAS DE CRÉDITO (Pro · Crecer)
// ==========================================

export function getTarjetasCredito(): TarjetaCredito[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TARJETAS_CREDITO);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer tarjetas de crédito:', err);
  }
  return ejemplo(MOCK_TARJETAS_CREDITO_INICIAL);
}

export function setTarjetasCredito(items: TarjetaCredito[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TARJETAS_CREDITO, JSON.stringify(items));
    notificarCambio();
  } catch (err) {
    console.error('Error al guardar tarjetas de crédito:', err);
  }
}

export function guardarTarjetaCredito(tc: TarjetaCredito): void {
  const items = getTarjetasCredito();
  const idx = items.findIndex((t) => t.id === tc.id);
  const normal: TarjetaCredito = {
    ...tc,
    diaCorte: Math.min(31, Math.max(1, Math.round(tc.diaCorte || 1))),
    diaPago: Math.min(31, Math.max(1, Math.round(tc.diaPago || 1))),
    cupo: tc.cupo != null ? Math.max(0, Math.round(tc.cupo)) : undefined,
    creadoEn: tc.creadoEn || new Date().toISOString(),
  };
  let nuevos: TarjetaCredito[];
  if (idx >= 0) {
    nuevos = [...items];
    nuevos[idx] = normal;
  } else {
    nuevos = [...items, normal];
  }
  setTarjetasCredito(nuevos);
}

export function eliminarTarjetaCredito(id: string): void {
  setTarjetasCredito(getTarjetasCredito().filter((t) => t.id !== id));
}

export function abonarASobre(
  sobreId: string,
  origenId: string,
  monto: number,
  origen: 'aporte_mensual' | 'abono' = 'abono',
  destinoId?: string,
  /** Aporte del mes que le toca al sobre (solo con origen 'aporte_mensual'). */
  tope?: number
): { exito: boolean; error?: string } {
  const sobres = getSobres();
  const billeteras = getBilleteras();
  
  const idxSobre = sobres.findIndex((s) => s.id === sobreId);
  const idxOrigen = billeteras.findIndex((b) => b.id === origenId);
  
  if (idxSobre < 0 || idxOrigen < 0) {
    return { exito: false, error: 'Sobre o cuenta no encontrada' };
  }

  const sobre = { ...sobres[idxSobre] };
  const cuentaOrigen = { ...billeteras[idxOrigen] };
  const cuentaDestinoId = sobre.billeteraId || destinoId;

  if (!sobre.billeteraId && !destinoId) {
    return { exito: false, error: 'Se requiere una cuenta destino para guardar la plata' };
  }

  if (monto <= 0) {
    return { exito: false, error: 'El monto debe ser mayor a 0' };
  }

  const sinSobreOrigen = sinSobre(cuentaOrigen, sobres);
  if (monto > sinSobreOrigen) {
    return { exito: false, error: `${cuentaOrigen.nombre} tiene $${sinSobreOrigen} sin sobre` };
  }

  // El aporte del mes se puede mover por partes, sin pasarse de lo que le toca.
  if (origen === 'aporte_mensual' && tope != null) {
    const falta = Math.max(0, tope - movidoEsteMes(sobre));
    if (monto > falta) {
      return { exito: false, error: `Este mes te faltan ${formatearCOP(falta)} por mover` };
    }
  }

  const fecha = new Date().toISOString();
  let movimientos = getMovimientos();

  if (origenId !== cuentaDestinoId) {
    const idxDestino = billeteras.findIndex((b) => b.id === cuentaDestinoId);
    if (idxDestino < 0) return { exito: false, error: 'Cuenta destino no encontrada' };
    
    const cuentaDestino = { ...billeteras[idxDestino] };
    
    cuentaOrigen.saldo -= monto;
    cuentaDestino.saldo += monto;
    
    billeteras[idxOrigen] = cuentaOrigen;
    billeteras[idxDestino] = cuentaDestino;

    const mesesAbrev = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const ahora = new Date();
    const fechaLegible = `${ahora.getDate().toString().padStart(2, '0')} ${mesesAbrev[ahora.getMonth()]} ${ahora.getFullYear()}`;

    const nuevoMov: Movimiento = {
      id: `mov-sobre-${Date.now()}`,
      tipo: 'transferencia',
      monto,
      billeteraId: cuentaOrigen.id,
      billeteraNombre: cuentaOrigen.nombre,
      billeteraDestinoId: cuentaDestino.id,
      sobreId: sobre.id,
      categoria: 'Sobres',
      fecha: fechaLegible,
      nota: `A ${sobre.nombre}`,
      descripcion: `A ${sobre.nombre}`,
      creadoEn: fecha,
    };
    
    movimientos = [nuevoMov, ...movimientos];
    setMovimientos(movimientos);
  }

  if (!sobre.billeteraId) {
    sobre.billeteraId = cuentaDestinoId;
  }
  
  sobre.apartado += monto;
  if (!sobre.historial) sobre.historial = [];
  sobre.historial.push({
    fecha,
    monto,
    origen,
    billeteraId: origenId
  });

  sobres[idxSobre] = sobre;
  
  setBilleteras(billeteras);
  setSobres(sobres);
  
  return { exito: true };
}

export function retirarDeSobre(
  sobreId: string,
  destinoId: string,
  monto: number,
  nota?: string
): { exito: boolean; error?: string } {
  const sobres = getSobres();
  const billeteras = getBilleteras();
  
  const idxSobre = sobres.findIndex((s) => s.id === sobreId);
  const idxDestino = billeteras.findIndex((b) => b.id === destinoId);
  
  if (idxSobre < 0 || idxDestino < 0) {
    return { exito: false, error: 'Sobre o cuenta no encontrada' };
  }

  const sobre = { ...sobres[idxSobre] };
  const cuentaDestino = { ...billeteras[idxDestino] };

  if (monto > sobre.apartado) {
    return { exito: false, error: `El sobre tiene $${sobre.apartado}` };
  }

  if (!sobre.billeteraId) {
    return { exito: false, error: 'El sobre no tiene cuenta asociada' };
  }
  
  const cuentaOrigenId = sobre.billeteraId;
  const idxOrigen = billeteras.findIndex((b) => b.id === cuentaOrigenId);
  
  if (idxOrigen < 0) {
    return { exito: false, error: 'Cuenta de origen no encontrada' };
  }

  const fecha = new Date().toISOString();
  let movimientos = getMovimientos();

  if (cuentaOrigenId !== destinoId) {
    const cuentaOrigen = { ...billeteras[idxOrigen] };
    
    cuentaOrigen.saldo -= monto;
    cuentaDestino.saldo += monto;
    
    billeteras[idxOrigen] = cuentaOrigen;
    billeteras[idxDestino] = cuentaDestino;

    const mesesAbrev = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const ahora = new Date();
    const fechaLegible = `${ahora.getDate().toString().padStart(2, '0')} ${mesesAbrev[ahora.getMonth()]} ${ahora.getFullYear()}`;

    const nuevoMov: Movimiento = {
      id: `mov-retiro-${Date.now()}`,
      tipo: 'transferencia',
      monto,
      billeteraId: cuentaOrigen.id,
      billeteraNombre: cuentaOrigen.nombre,
      billeteraDestinoId: cuentaDestino.id,
      sobreId: sobre.id,
      categoria: 'Sobres',
      fecha: fechaLegible,
      nota: nota || `Desde ${sobre.nombre}`,
      descripcion: nota || `Desde ${sobre.nombre}`,
      creadoEn: fecha,
    };
    
    movimientos = [nuevoMov, ...movimientos];
    setMovimientos(movimientos);
  }

  sobre.apartado -= monto;
  if (!sobre.historial) sobre.historial = [];
  sobre.historial.push({
    fecha,
    monto,
    origen: 'retiro',
    billeteraId: destinoId,
    nota
  });

  sobres[idxSobre] = sobre;
  
  setBilleteras(billeteras);
  setSobres(sobres);

  return { exito: true };
}

/**
 * Cambia la cuenta donde vive un sobre de ahorro. Si ya guarda plata, esa plata
 * se mueve de verdad: sale de la cuenta vieja y entra a la nueva.
 */
export function cambiarCuentaSobre(sobreId: string, nuevaId: string): { exito: boolean; error?: string } {
  const sobres = getSobres();
  const billeteras = getBilleteras();
  const idxSobre = sobres.findIndex((s) => s.id === sobreId);
  const idxNueva = billeteras.findIndex((b) => b.id === nuevaId);
  if (idxSobre < 0 || idxNueva < 0) return { exito: false, error: 'Sobre o cuenta no encontrada' };

  const sobre = { ...sobres[idxSobre] };
  if (sobre.billeteraId === nuevaId) return { exito: true };

  const idxVieja = billeteras.findIndex((b) => b.id === sobre.billeteraId);
  if (sobre.apartado > 0 && idxVieja >= 0) {
    const vieja = { ...billeteras[idxVieja] };
    const nueva = { ...billeteras[idxNueva] };
    vieja.saldo -= sobre.apartado;
    nueva.saldo += sobre.apartado;
    billeteras[idxVieja] = vieja;
    billeteras[idxNueva] = nueva;

    const ahora = new Date();
    const nota = `Cambio de cuenta de ${sobre.nombre}`;
    const mov: Movimiento = {
      id: `mov-cuenta-${Date.now()}`,
      tipo: 'transferencia',
      monto: sobre.apartado,
      billeteraId: vieja.id,
      billeteraNombre: vieja.nombre,
      billeteraDestinoId: nueva.id,
      sobreId: sobre.id,
      categoria: 'Sobres',
      fecha: `${ahora.getDate().toString().padStart(2, '0')} ${MESES_ABREV[ahora.getMonth()]} ${ahora.getFullYear()}`,
      nota,
      descripcion: nota,
      creadoEn: ahora.toISOString(),
    };
    setBilleteras(billeteras);
    setMovimientos([mov, ...getMovimientos()]);
  }

  sobre.billeteraId = nuevaId;
  sobres[idxSobre] = sobre;
  setSobres(sobres);
  return { exito: true };
}
