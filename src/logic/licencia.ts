// TODO: reemplazar por llamada al portero (Supabase) — validación remota

import { NivelAcceso } from '../types';

export interface ResultadoValidacionLicencia {
  valido: boolean;
  nivel?: NivelAcceso;
  mensaje?: string;
  error?: string;
}

/**
 * Valida un código de activación de licencia para Bolsillo.
 *
 * La UI y el store únicamente consumen esta función desacoplada,
 * permitiendo sustituir esta verificación local por la llamada real al backend/portero
 * (por ejemplo Supabase Edge Functions o tabla de licencias) sin modificar componentes.
 */
export function validarCodigo(codigo: string): ResultadoValidacionLicencia {
  const normalizado = (codigo || '').trim().toUpperCase();

  if (!normalizado) {
    return {
      valido: false,
      error: 'Por favor ingresa un código de acceso.',
    };
  }

  // Códigos de prueba requeridos
  if (normalizado === 'DEUDACERO') {
    return {
      valido: true,
      nivel: 'entrada',
      mensaje: '¡Plan Deuda Cero activado! Tienes acceso a tu Plan de Pago y a Mi Dinero.',
    };
  }

  if (normalizado === 'BOLSILLOPRO') {
    return {
      valido: true,
      nivel: 'pro',
      mensaje: '¡Plan Bolsillo Pro desbloqueado! Cuentas con acceso total a Billeteras y futuros módulos.',
    };
  }

  return {
    valido: false,
    error: 'Código no válido. Revisa e intenta de nuevo.',
  };
}
