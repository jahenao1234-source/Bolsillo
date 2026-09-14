
import { Suscripcion } from "../types";
import {
  diasEnMes,
  diferenciaEnDias,
  fechaISOLocal,
  proximaFechaDeDia,
  unMesAntes,
} from "../utils/fechas";

export const DIAS_DE_AVISO = 3;

export function finDePromo(sus: Suscripcion): Date | null {
  return sus.promo ? fechaISOLocal(sus.promo.hasta) : null;
}

export function inicioDePromo(sus: Suscripcion): Date | null {
  return sus.promo ? fechaISOLocal(sus.promo.desde) : null;
}

export function enPromo(sus: Suscripcion, hoy: Date): boolean {
  const fin = finDePromo(sus);
  return !!fin && fin > hoy;
}

export function montoVigente(sus: Suscripcion, hoy: Date): number {
  return enPromo(sus, hoy) ? Math.max(0, sus.promo!.monto) : Math.max(0, sus.monto);
}

export function montoNormal(sus: Suscripcion): number {
  return Math.max(0, sus.monto);
}

export interface CicloSuscripcion {
  inicio: Date;
  fin: Date;
  totalDias: number;
  transcurridos: number;
  faltan: number;
  pct: number;
  esFinDePromo: boolean;
}

export function cicloDe(sus: Suscripcion, hoy: Date): CicloSuscripcion {
  const finPromo = finDePromo(sus);
  const enPromocion = !!finPromo && finPromo > hoy;

  let inicio: Date;
  let fin: Date;

  if (enPromocion) {
    fin = finPromo!;
    inicio = inicioDePromo(sus) ?? unMesAntes(fin);
  } else {
    fin = proximaFechaDeDia(sus.diaCobro, hoy);
    inicio = unMesAntes(fin);
  }

  const totalDias = Math.max(1, diferenciaEnDias(inicio, fin));
  const transcurridos = Math.min(totalDias, Math.max(0, diferenciaEnDias(inicio, hoy)));

  return {
    inicio,
    fin,
    totalDias,
    transcurridos,
    faltan: Math.max(0, diferenciaEnDias(hoy, fin)),
    pct: Math.min(100, Math.max(0, (transcurridos / totalDias) * 100)),
    esFinDePromo: enPromocion,
  };
}

export function cobradaEnEsteCiclo(sus: Suscripcion, hoy: Date): boolean {
  const ultimo = sus.ultimoCobro ? fechaISOLocal(sus.ultimoCobro) : null;
  if (!ultimo) return false;
  const ciclo = cicloDe(sus, hoy);
  return ultimo >= ciclo.inicio && ultimo <= hoy;
}

export type EstadoSuscripcion = "pausada" | "promo" | "cobrada" | "pendiente";

export function estadoDe(sus: Suscripcion, hoy: Date): EstadoSuscripcion {
  if (!sus.activa) return "pausada";
  if (enPromo(sus, hoy)) return "promo";
  return cobradaEnEsteCiclo(sus, hoy) ? "cobrada" : "pendiente";
}

export function esUrgente(sus: Suscripcion, hoy: Date): boolean {
  if (!sus.activa) return false;
  return cicloDe(sus, hoy).faltan <= DIAS_DE_AVISO;
}

export function sangradoVigente(suscripciones: Suscripcion[], hoy: Date): number {
  return suscripciones
    .filter((s) => s.activa)
    .reduce((acc, s) => acc + montoVigente(s, hoy), 0);
}

export function sangradoNormal(suscripciones: Suscripcion[]): number {
  return suscripciones.filter((s) => s.activa).reduce((acc, s) => acc + montoNormal(s), 0);
}

export interface AvisoSuscripcion {
  sus: Suscripcion;
  ciclo: CicloSuscripcion;
  tipo: "promo" | "cobro";
  dias: number;
}

export function avisosDe(suscripciones: Suscripcion[], hoy: Date): AvisoSuscripcion[] {
  return suscripciones
    .filter((s) => s.activa)
    .map((sus) => {
      const ciclo = cicloDe(sus, hoy);
      return {
        sus,
        ciclo,
        tipo: ciclo.esFinDePromo ? ("promo" as const) : ("cobro" as const),
        dias: ciclo.faltan,
      };
    })
    .sort((a, b) => {
      if (a.dias !== b.dias) return a.dias - b.dias;
      if (a.tipo !== b.tipo) return a.tipo === "promo" ? -1 : 1;
      return montoNormal(b.sus) - montoNormal(a.sus);
    });
}

export function avisoPrincipal(
  suscripciones: Suscripcion[],
  hoy: Date
): AvisoSuscripcion | null {
  const avisos = avisosDe(suscripciones, hoy);
  const urgentes = avisos.filter((a) => a.dias <= DIAS_DE_AVISO);
  const promo = urgentes.find((a) => a.tipo === "promo");
  return promo ?? urgentes[0] ?? null;
}

export interface DuracionPromo {
  id: string;
  etiqueta: string;
  dias?: number;
  meses?: number;
}

export const DURACIONES_PROMO: DuracionPromo[] = [
  { id: "7d", etiqueta: "7 días", dias: 7 },
  { id: "14d", etiqueta: "14 días", dias: 14 },
  { id: "1m", etiqueta: "1 mes", meses: 1 },
  { id: "2m", etiqueta: "2 meses", meses: 2 },
  { id: "3m", etiqueta: "3 meses", meses: 3 },
];

export function finSegunDuracion(desde: Date, duracion: DuracionPromo): Date {
  if (duracion.dias) {
    return new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + duracion.dias);
  }
  const meses = duracion.meses ?? 1;
  const mes = desde.getMonth() + meses;
  const anio = desde.getFullYear() + Math.floor(mes / 12);
  const mesFinal = ((mes % 12) + 12) % 12;
  return new Date(anio, mesFinal, Math.min(desde.getDate(), diasEnMes(mesFinal, anio)));
}

export const DIAS_PARA_FUGA = 45;

export function diasSinUso(sus: Suscripcion, hoy: Date): number | null {
  if (!sus.ultimoUso) return null;
  return diferenciaEnDias(fechaISOLocal(sus.ultimoUso), hoy);
}

export function esFuga(sus: Suscripcion, hoy: Date): boolean {
  if (!sus.activa || enPromo(sus, hoy)) return false;
  const dias = diasSinUso(sus, hoy);
  return dias !== null && dias >= DIAS_PARA_FUGA;
}

export function cobrosDesde(sus: Suscripcion, desde: Date, hoy: Date): number {
  let cuenta = 0;
  let d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
  while (d <= hoy) {
    const max = diasEnMes(d.getMonth(), d.getFullYear());
    const toca = Math.min(sus.diaCobro, max);
    if (d.getDate() === toca) {
      cuenta++;
    }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return cuenta;
}

export function cobrosDelMes(suscripciones: Suscripcion[], hoy: Date): { cobrados: {sus: Suscripcion, fecha: Date, monto: number}[]; porCobrar: {sus: Suscripcion, fecha: Date, monto: number, faltan: number}[] } {
  const cobrados: {sus: Suscripcion, fecha: Date, monto: number}[] = [];
  const porCobrar: {sus: Suscripcion, fecha: Date, monto: number, faltan: number}[] = [];
  
  for (const sus of suscripciones) {
    if (!sus.activa) continue;
    const maxDias = diasEnMes(hoy.getMonth(), hoy.getFullYear());
    const diaReal = Math.min(sus.diaCobro, maxDias);
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), diaReal);
    const monto = montoVigente(sus, fecha);
    
    if (fecha <= hoy) {
      cobrados.push({ sus, fecha, monto });
    } else {
      porCobrar.push({ sus, fecha, monto, faltan: diferenciaEnDias(hoy, fecha) });
    }
  }
  
  cobrados.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  porCobrar.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  
  return { cobrados, porCobrar };
}
