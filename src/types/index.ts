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
  /** Tasa efectiva anual tal como la da el banco. tasaMensual se deriva de aquí. */
  tasaEA?: number;
  /** Tarjetas: día del mes en que cierra el ciclo. */
  diaCorte?: number;
  /** Día del mes límite de pago. */
  diaPago?: number;
  /** Tarjetas: cupo total. */
  cupo?: number;
}

/**
 * El mes en limpio, lo que se pide al configurar el plan. Lo que queda después
 * de lo básico es la plata para salir de deudas (y, sin deudas, lo libre de Pro).
 */
export interface PerfilFlujo {
  ingresoMensual: number;
  /** Techo, mercado, servicios y transporte de trabajo. */
  gastosBasicos: number;
  configuradoEn: string;
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
  sobreId?: string;
  creadoEn?: string;
  billeteraDestinoId?: string;
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

/** Grupo de la regla 50/30/20. */
export type GrupoPresupuesto = 'necesidad' | 'gusto' | 'ahorro';

/** Presupuesto: tope de gasto mensual por categoría. */
export interface Presupuesto {
  categoria: string;
  tope: number;
  color?: string;
  grupo?: GrupoPresupuesto;
}

/** Sobre digital: dinero apartado (virtual) hacia una meta. */
export interface Sobre {
  id: string;
  nombre: string;
  meta?: number;
  apartado: number;
  color?: string;
  creadoEn: string;
  grupo?: 'basico' | 'libre';
  presupuestoMensual?: number;
  categorias?: string[];
  modulo?: 'lista_compras' | 'activos' | 'anti_recaida' | 'ninguno';
  sistema?: boolean;
  billeteraId?: string;
  historial?: { fecha: string; monto: number; origen: 'aporte_mensual' | 'abono' | 'rescate' | 'ajuste' | 'retiro'; nota?: string; billeteraId?: string }[];
}

export type TipoReto = 'escalado' | 'semanal_fijo';

/** Escalado: la cuota sube semana a semana, o baja (empieza duro y afloja). */
export type ModoEscalado = 'sube' | 'al_reves';

/** Reto de ahorro guiado con aporte semanal y racha. */
export interface RetoAhorro {
  id: string;
  nombre: string;
  tipo: TipoReto;
  aporteBase: number;      // escalado: aporte de la primera semana; semanal_fijo: aporte fijo
  incremento?: number;     // escalado: cuánto sube cada semana (si falta, es igual a aporteBase)
  modo?: ModoEscalado;     // escalado: 'sube' por defecto
  metaTotal: number;
  semanasTotales: number;
  semanaActual: number;    // próxima semana a aportar (1-based); cumplidas = semanaActual - 1
  acumulado: number;
  racha: number;
  completado: boolean;
  color?: string;
  creadoEn: string;
}

/**
 * Promoción o prueba gratis: un precio distinto hasta una fecha, y de ahí
 * en adelante el precio normal. Es donde la plata se va sola.
 */
export interface PromoSuscripcion {
  /** Lo que pagas mientras dura (casi siempre 0). */
  monto: number;
  /** Día en que empezó, en ISO. Sirve para la barra del ciclo. */
  desde: string;
  /** Día en que termina y pasa al precio normal, en ISO. */
  hasta: string;
}

/** Suscripción recurrente (cobro mensual automático). */
export interface Suscripcion {
  id: string;
  nombre: string;
  monto: number;           // precio normal, el de después de la promoción
  diaCobro: number;        // día del mes (1-31)
  categoria?: string;
  activa: boolean;
  color?: string;
  creadoEn: string;
  promo?: PromoSuscripcion;
  /** Fecha del último cobro que el usuario registró (ISO). */
  ultimoCobro?: string;
  /** Última vez que la persona dijo que la usó (ISO). Sin dato no se marca como fuga. */
  ultimoUso?: string;
  /** Con qué se paga: una billetera o una tarjeta de crédito. */
  pagaCon?: { tipo: 'billetera' | 'tarjeta'; id: string };
}

/** Tarjeta de crédito con días de corte y de pago. */
export interface TarjetaCredito {
  id: string;
  nombre: string;
  diaCorte: number;        // día del mes en que cierra el ciclo
  diaPago: number;         // día del mes límite de pago
  cupo?: number;
  /** Interés % mensual, para simular cuotas y el costo del mínimo. */
  tasaMensual?: number;
  /** Deuda de Deuda Cero que corresponde a esta tarjeta, para no repetir el saldo. */
  deudaId?: string;
  color?: string;
  creadoEn: string;
}
