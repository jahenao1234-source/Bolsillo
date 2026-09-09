/**
 * El cajón de "Hoy": la misma columna en todas las pantallas.
 *
 * Contesta el "¿y entonces qué hago?" sin que importe dónde estés:
 * la jugada del día, lo que está por vencerse, la agenda y el botón de registrar.
 *
 * No decide nada por su cuenta: recibe la agenda ya calculada por App
 * (la misma de resumenMes.calcularAgenda que usa Inicio) y avisa hacia arriba.
 */

import React from 'react';
import { X, Plus } from 'lucide-react';
import { EventoAgenda } from '../../logic/resumenMes';
import { SeccionApp } from '../navigation/BarraNavegacion';
import { formatearCOP } from '../../utils/format';

interface CajonHoyProps {
  abierto: boolean;
  /** true cuando flota encima del contenido en vez de empujarlo. */
  flotante: boolean;
  eventos: EventoAgenda[];
  saldoTotal: number;
  onCerrar: () => void;
  onNavegar: (seccion: SeccionApp) => void;
}

/** "martes 8 de septiembre", con la primera en mayúscula. */
function fechaLarga(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const Fila: React.FC<{ evento: EventoAgenda }> = ({ evento }) => (
  <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 py-2 border-b border-[var(--hairline)] last:border-b-0">
    <span className="font-display text-[11px] tabular-nums text-[color:var(--texto-3)]">
      {evento.dia}
    </span>
    <span className="min-w-0 flex flex-col">
      <span className="text-[12px] text-[color:var(--texto)] truncate">{evento.titulo}</span>
      <span className="text-[10px] text-[color:var(--texto-3)] truncate mt-px flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-[2px] flex-none"
          style={{ background: evento.color }}
        />
        {evento.detalle}
      </span>
    </span>
    {evento.monto > 0 ? (
      <span className="font-display font-bold text-[12.5px] tabular-nums text-right text-[color:var(--texto)] whitespace-nowrap">
        {formatearCOP(evento.monto)}
      </span>
    ) : (
      <span className="text-[11px] text-[color:var(--texto-3)] text-right">—</span>
    )}
  </div>
);

export const CajonHoy: React.FC<CajonHoyProps> = ({
  abierto,
  flotante,
  eventos,
  saldoTotal,
  onCerrar,
  onNavegar,
}) => {
  const hoy = eventos.length > 0 ? eventos[0].fecha : new Date();

  // La jugada del día: lo primero que vence hoy y cuesta plata.
  const jugada = eventos.find((e) => e.esHoy && e.monto > 0) ?? null;
  // El aviso: una promoción que se acaba dentro de la ventana.
  const aviso = eventos.find((e) => e.origen === 'promo') ?? null;
  // La lista no repite lo que ya está arriba en grande.
  const resto = eventos.filter((e) => e !== jugada);
  const totalResto = resto.reduce((acc, e) => acc + e.monto, 0);
  const cobros = eventos.filter((e) => e.monto > 0).length;

  const destinoJugada: SeccionApp =
    jugada?.origen === 'deuda' || jugada?.origen === 'pago_tarjeta'
      ? 'deudas'
      : jugada?.origen === 'reto' || jugada?.origen === 'suscripcion'
      ? 'crecer'
      : 'billeteras';

  return (
    <>
      {/* Velo: solo cuando el cajón flota encima. Cerrar tocando fuera. */}
      {abierto && flotante && (
        <button
          type="button"
          aria-label="Cerrar el cajón de Hoy"
          onClick={onCerrar}
          className="hidden md:block fixed inset-0 z-30 bg-[var(--base)]/60 backdrop-blur-[1px] cursor-default"
        />
      )}

      <aside
        aria-hidden={!abierto}
        className={`
          hidden md:flex flex-col overflow-hidden bg-[var(--superficie-2)]
          transition-[width,border-color] duration-300 ease-out
          ${abierto ? 'w-[340px] border-l border-[var(--linea)]' : 'w-0 border-l border-transparent'}
          ${flotante ? 'fixed right-0 top-0 bottom-0 z-40 shadow-2xl' : 'relative flex-none'}
        `}
      >
        {/* min-w fijo: el contenido no se aplasta mientras el cajón se anima */}
        <div className="flex flex-col h-full min-w-[340px] w-[340px] py-4 pb-3.5">
          <div className="px-[18px] pb-3 border-b border-[var(--hairline)] flex items-end justify-between gap-2.5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                {fechaLarga(hoy)}
              </p>
              <h2 className="font-display font-bold text-base mt-1 text-[color:var(--texto)]">Hoy</h2>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-[color:var(--texto-3)] hover:text-[color:var(--texto)] border border-[var(--linea)] rounded-md p-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {jugada && (
            <div className="mx-[15px] mt-3.5 rounded-xl bg-[var(--superficie)] border border-[var(--accion)]/34 px-3.5 pt-3.5 pb-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[color:var(--accion)]">
                Tu jugada de hoy
              </p>
              <p className="font-display font-bold text-[14.5px] mt-1.5 text-[color:var(--texto)]">
                {jugada.titulo}
              </p>
              <p className="text-[11px] text-[color:var(--texto-3)] leading-snug mt-0.5">
                {jugada.detalle}
              </p>
              <div className="flex items-end justify-between gap-3 mt-2.5">
                <span className="font-display font-bold text-2xl tabular-nums leading-none text-[color:var(--accion)]">
                  {formatearCOP(jugada.monto)}
                </span>
                <button
                  type="button"
                  onClick={() => onNavegar(destinoJugada)}
                  className="px-2.5 py-1.5 rounded-lg bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-[10.5px] cursor-pointer hover:opacity-95 transition-opacity"
                >
                  Registrar pago
                </button>
              </div>
            </div>
          )}

          {aviso && (
            <div className="mx-[15px] mt-3 rounded-xl px-3.5 py-2.5 bg-[var(--alerta)]/10 border border-[var(--alerta)]/26">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[color:var(--alerta)]">
                Ojo
              </p>
              <p className="text-[11.5px] text-[color:var(--texto-2)] leading-snug mt-1">
                <span className="font-semibold text-[color:var(--texto)]">{aviso.titulo}</span>{' '}
                {aviso.detalle}
              </p>
            </div>
          )}

          <div className="mt-3.5 px-[18px] flex flex-col flex-1 min-h-0">
            <div className="flex items-baseline justify-between gap-2.5 mb-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                Lo que se te viene
              </span>
              <span className="text-[10.5px] tabular-nums text-[color:var(--texto-3)]">
                {formatearCOP(totalResto)}
              </span>
            </div>

            <div className="overflow-y-auto min-h-0 flex-1 pr-1">
              {resto.length > 0 ? (
                resto.map((e) => <Fila key={e.id} evento={e} />)
              ) : (
                <p className="text-[11.5px] text-[color:var(--texto-3)] leading-relaxed py-3">
                  No se te viene ningún cobro en los próximos 14 días.
                </p>
              )}
            </div>
          </div>

          <div className="mt-auto px-[15px] pt-3 border-t border-[var(--hairline)] flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[color:var(--texto-3)]">
                {cobros > 0 ? `${cobros} cobros en 14 días` : 'Tienes en tus billeteras'}
              </span>
              <span className="font-display font-bold text-base tabular-nums text-[color:var(--texto)]">
                {formatearCOP(saldoTotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavegar('billeteras')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-xs cursor-pointer hover:opacity-95 transition-opacity"
            >
              <Plus className="w-3 h-3" strokeWidth={2.6} />
              Registrar movimiento
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
