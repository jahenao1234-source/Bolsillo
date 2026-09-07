/**
 * Bolsillo - Tipos TypeScript del Sistema de Finanzas
 */

export type TipoBilletera =
  | 'efectivo'
  | 'nequi'
  | 'banco'
  | 'ahorros'
  | 'otro'
  | 'billetera_digital'
  | 'inversion';

export interface Billetera {
  id: string;
  nombre: string;
  tipo: TipoBilletera;
  saldo: number;
  creadoEn: string;
  entidad?: string;
  numeroCuentaCorto?: string;
  color?: string;
}

export type TipoDeuda = 'tarjeta' | 'prestamo' | 'gota_a_gota' | 'fiado' | 'libranza';

export interface Deuda {
  id: string;
  nombre: string;
  tipo: TipoDeuda;
  saldo: number;
  saldoTotal?: number; // Compatibilidad con vistas previas
  montoOriginal?: number;
  tasaMensual: number; // Interés % mensual (ej: 2.1 para 2.1% mensual)
  tasaInteresEA?: string; // Opcional representativo
  pagoMinimo: number;
  proximoPagoMonto?: number;
  proximaFechaPago?: string; // ej: "15 sep"
  saldada: boolean;
  creadoEn: string;
  entidad?: string;
  orden?: number;
}

export type EstrategiaPago = 'bola_de_nieve' | 'avalancha' | 'personalizado';

export interface OrdenSaldadoItem {
  id: string;
  nombre: string;
  tipo: TipoDeuda;
  saldoInicial: number;
  tasaMensual: number;
  pagoMinimo: number;
  mesSaldado: number;
  fechaEstimada: string;
  interesesPagados: number;
}

export interface ResultadoPlan {
  mesesTotales: number;
  fechaLibertad: string;
  interesesTotales: number;
  ordenSaldado: OrdenSaldadoItem[];
  deudaTotalActual: number;
  pagoMinimoTotal: number;
  disponibleMensual: number;
  esViable: boolean;
  mensajeAdvertencia?: string;
}

export interface ResultadoSimulacionAbonoExtra {
  abonoExtra: number;
  mesesTotalesBase: number;
  mesesTotalesNuevo: number;
  mesesAhorrados: number;
  fechaLibertadBase: string;
  nuevaFechaLibertad: string;
  interesesBase: number;
  nuevosIntereses: number;
  ahorroIntereses: number;
}

export type TipoMovimiento = 'ingreso' | 'gasto' | 'pago_deuda' | 'transferencia';

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  monto: number;
  billeteraId: string;
  categoria: string;
  fecha: string;
  nota?: string;
  descripcion?: string; // Para compatibilidad
  billeteraNombre?: string;
  deudaId?: string; // Opcional, si es abono a una deuda
  creadoEn?: string;
}

export interface FiltrosMovimiento {
  billeteraId?: string;
  tipo?: 'ingreso' | 'gasto' | 'todos';
  mes?: string;
}

export interface FlujoMes {
  ingresos: number;
  gastos: number;
  neto: number;
}

export interface ProximoPagoInfo {
  id: string;
  nombre: string;
  monto: number;
  fecha: string;
  categoria: string;
}

export interface ResumenFinanciero {
  usuario: string;
  saldoDisponible: number;
  deudaTotal: number;
  deudaOriginalTotal: number;
  porcentajeDeudaPagada: number;
  fechaLibertad: string; // ej: "Mar 2028"
  progresoLibertadPorcentaje: number; // ej: 68
  proximoPago: ProximoPagoInfo;
  mesActual: string;
  flujoMes?: FlujoMes;
}

export type NivelAcceso = 'demo' | 'entrada' | 'pro';

export interface DatosTermometro {
  deudaTotal: number;
  pagoMensual: number;
  tipoInteres: 'tarjeta' | 'prestamo' | 'gota_a_gota' | 'no_se';
  tasaMensual: number;
  fechaRegistro?: string;
}

// ==========================================
// MÓDULOS PRO (pestaña "Crecer")
// ==========================================

/** Presupuesto: tope de gasto mensual por categoría. */
export interface Presupuesto {
  categoria: string;
  tope: number;
}

/** Sobre digital: dinero apartado (virtual) hacia una meta. */
export interface Sobre {
  id: string;
  nombre: string;
  meta?: number;
  apartado: number;
  color?: string;
  creadoEn: string;
}

export type TipoReto = 'escalado' | 'semanal_fijo';

/** Reto de ahorro guiado con aporte semanal y racha. */
export interface RetoAhorro {
  id: string;
  nombre: string;
  tipo: TipoReto;
  aporteBase: number;      // escalado: incremento por semana; semanal_fijo: aporte fijo
  metaTotal: number;
  semanasTotales: number;
  semanaActual: number;    // próxima semana a aportar (1-based); cumplidas = semanaActual - 1
  acumulado: number;
  racha: number;
  completado: boolean;
  color?: string;
  creadoEn: string;
}
