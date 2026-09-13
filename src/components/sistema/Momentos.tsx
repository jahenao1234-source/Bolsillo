/**
 * Los dos momentos que enseñan el sistema en vez de celebrarlo solo:
 *
 * - Traspaso: una deuda llega a $0 y su cuota pasa a la siguiente. Aquí NO se
 *   vende Pro: esa plata no quedó libre, está atacando la siguiente deuda.
 * - Graduación: la última deuda llega a $0. Ahí sí queda plata libre de verdad,
 *   y sin dueño se va. Es el momento de Pro.
 */

import React from 'react';
import { Check } from 'lucide-react';
import type { Deuda } from '../../types';
import type { Escalon } from '../../logic/sistema';
import { formatearCOP } from '../../utils/format';
import { RailPasos, PASOS_SISTEMA } from './RailPasos';

const Capa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-sm">
    <div role="dialog" aria-modal="true" className="w-full max-w-sm bg-fondo border border-linea rounded-3xl p-6 shadow-2xl animate-screen-enter">
      {children}
    </div>
  </div>
);

const Boton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer">
    {children}
  </button>
);

// ==========================================
// TRASPASO
// ==========================================

interface MomentoTraspasoProps {
  deuda: Deuda;
  /** El escalón que recibe el ataque ahora. */
  siguiente: Escalon | null;
  minimoSiguiente: number;
  saldadas: number;
  total: number;
  onContinuar: () => void;
}

export const MomentoTraspaso: React.FC<MomentoTraspasoProps> = ({
  deuda,
  siguiente,
  minimoSiguiente,
  saldadas,
  total,
  onContinuar,
}) => {
  const liberado = siguiente ? siguiente.monto - minimoSiguiente : 0;

  return (
    <Capa>
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-full grid place-items-center bg-positivo/10 border border-positivo/40 text-positivo">
          <Check className="w-6 h-6" />
        </div>
        <p className="text-sm text-texto-2 mt-4">{deuda.nombre}</p>
        <p className="font-display font-extrabold text-[54px] leading-none tracking-tight mt-1">$0</p>
        <p className="text-xs text-texto-2 mt-2 tabular-nums">
          {saldadas} de {total} {total === 1 ? 'deuda' : 'deudas'}
        </p>
      </div>

      {siguiente && (
        <div className="mt-5 rounded-2xl border border-linea bg-superficie p-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-texto-3">Lo que pasa ahora</p>
          <p className="font-bold text-sm leading-snug mt-1.5">
            Esa plata no se queda quieta: pasa a {siguiente.nombre}.
          </p>
          <div className="mt-3 text-[13px]">
            <div className="flex justify-between py-1.5"><span className="text-texto-2">Mínimo de {siguiente.nombre}</span><span className="font-bold tabular-nums">{formatearCOP(minimoSiguiente)}</span></div>
            <div className="flex justify-between py-1.5 border-t border-hairline"><span className="text-texto-2">Lo que liberaste</span><span className="font-bold tabular-nums">+{formatearCOP(liberado)}</span></div>
            <div className="flex justify-between pt-2 border-t border-hairline font-bold"><span>Tu nuevo ataque</span><span className="text-accion tabular-nums">{formatearCOP(siguiente.monto)}</span></div>
          </div>
          <p className="text-xs text-texto-2 mt-3">
            Con eso, {siguiente.nombre} queda en $0 en <b className="text-texto">{siguiente.hasta.toLowerCase()}</b>.
          </p>
        </div>
      )}

      <div className="mt-5">
        <Boton onClick={onContinuar}>{siguiente ? `Ir a por ${siguiente.nombre}` : 'Seguir'}</Boton>
      </div>
    </Capa>
  );
};

// ==========================================
// GRADUACIÓN
// ==========================================

interface GraduacionProps {
  totalPagado: number;
  /** La plata del mes que antes iba a deudas y ahora queda libre. */
  libre: number;
  esPro: boolean;
  onActivarPro: () => void;
  onEmpezarBlindar: () => void;
  onCerrar?: () => void;
}

const ContenidoGraduacion: React.FC<GraduacionProps> = ({ totalPagado, libre, esPro, onActivarPro, onEmpezarBlindar, onCerrar }) => (
  <div className="flex flex-col gap-4">
        <RailPasos pasos={PASOS_SISTEMA} actual="deudas" className="mb-4 hidden xl:flex" />
    <div>
      <p className="font-display font-extrabold text-[38px] leading-none tracking-tight">Sin deudas.</p>
      {totalPagado > 0 && (
        <p className="text-xs text-texto-2 mt-2 tabular-nums">Pagaste {formatearCOP(totalPagado)}.</p>
      )}
    </div>

    <div className="rounded-2xl border border-linea bg-superficie p-4">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-texto-3">Desde este mes te quedan</p>
      <p className="font-display font-extrabold text-[36px] leading-none text-acento tabular-nums mt-1.5">{formatearCOP(libre)}</p>
      <p className="text-xs text-texto-2 mt-1.5">al mes que antes se iban al banco.</p>
      <p className="font-bold text-sm leading-snug mt-3 pt-3 border-t border-hairline">
        Todavía no tienen dueño. Lo que no tiene dueño, desaparece.
      </p>
    </div>

    {esPro ? (
      <>
        <p className="text-xs leading-relaxed text-texto-2">
          Sigue el mismo traspaso: primero tu fondo blindado (primer hito <b className="text-texto">$1.000.000</b>), después a crecer.
        </p>
        <Boton onClick={onEmpezarBlindar}>Empezar a blindar</Boton>
      </>
    ) : (
      <>
        <p className="text-xs leading-relaxed text-texto-2">
          <b className="text-texto">Bolsillo Pro</b> les pone dueño con el mismo traspaso: primero tu fondo blindado (primer hito $1.000.000), después a crecer.
        </p>
        <div className="flex items-baseline gap-2 tabular-nums">
          <span className="font-display font-extrabold text-[22px]">$19.900</span>
          <span className="text-xs text-texto-3">al mes · o $97.000 de por vida</span>
        </div>
        <Boton onClick={onActivarPro}>Activar Bolsillo Pro</Boton>
        {onCerrar && (
          <button type="button" onClick={onCerrar} className="text-xs text-texto-3 hover:text-texto-2 cursor-pointer -mt-1">
            Ahora no
          </button>
        )}
      </>
    )}
  </div>
);

export const MomentoGraduacion: React.FC<GraduacionProps> = (props) => (
  <Capa>
    <ContenidoGraduacion {...props} />
  </Capa>
);

/** La misma graduación, dentro de Mi plan, para quien ya no tiene deudas y no es Pro. */
export const GraduacionEnLinea: React.FC<GraduacionProps> = (props) => (
  <div className="max-w-md">
    <ContenidoGraduacion {...props} />
  </div>
);
