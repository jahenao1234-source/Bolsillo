/**
 * Deudas: qué debo y qué no toco.
 *
 * Tarjetas y préstamos conviven en el mismo plan pero no se leen igual: la
 * tarjeta tiene cupo y día de corte, y mientras está en ataque no se usa; el
 * préstamo tiene cuota fija. En móvil se alternan con un selector; en
 * escritorio van lado a lado, con el simulador a la derecha.
 */

import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import type { Billetera, Deuda, Movimiento } from '../types';
import { Marco, Columna, Zona } from '../components/layout/Marco';
import { BarraAcciones, BarraTitulo } from '../components/layout/shell';
import { Rotulo } from '../components/sistema/RailPasos';
import { ModalAgregarDeuda } from '../components/deudas/ModalAgregarDeuda';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import { SimuladorAbonoExtra } from '../components/deudas/SimuladorAbonoExtra';
import {
  deudasActivas,
  eaDesdeMensual,
  escaleraAtaque,
  ESTRATEGIA,
  pagosDelMes,
  saldoDe,
} from '../logic/sistema';
import { formatearCOP } from '../utils/format';

interface PantallaDeudasProps {
  deudas: Deuda[];
  billeteras: Billetera[];
  movimientos: Movimiento[];
  disponibleMensual: number;
  onGuardarDeuda: (deuda: Deuda) => void;
  onEliminarDeuda: (id: string) => void;
  onMarcarSaldada: (id: string) => void;
  onAbonarDeuda: (deudaId: string, billeteraId: string, monto: number) => void;
}

type Pestana = 'tarjetas' | 'prestamos';

const esTarjeta = (d: Deuda) => d.tipo === 'tarjeta';

export const PantallaDeudas: React.FC<PantallaDeudasProps> = ({
  deudas,
  billeteras,
  movimientos,
  disponibleMensual,
  onGuardarDeuda,
  onEliminarDeuda,
  onMarcarSaldada,
  onAbonarDeuda,
}) => {
  const [pestana, setPestana] = useState<Pestana>('tarjetas');
  const [editando, setEditando] = useState<Deuda | null>(null);
  const [creando, setCreando] = useState(false);
  const [abonando, setAbonando] = useState<{ deuda: Deuda; monto: number } | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const saldadas = deudas.filter((d) => !activas.includes(d));
  const escalera = useMemo(() => escaleraAtaque(activas, disponibleMensual), [activas, disponibleMensual]);
  const pagos = useMemo(() => pagosDelMes(activas, disponibleMensual, movimientos), [activas, disponibleMensual, movimientos]);
  const focoId = pagos[0]?.deuda.id;

  const tarjetas = activas.filter(esTarjeta);
  const prestamos = activas.filter((d) => !esTarjeta(d));
  const total = activas.reduce((a, d) => a + saldoDe(d), 0);

  const ficha = (deuda: Deuda) => {
    const esFoco = deuda.id === focoId;
    const escalon = escalera.find((e) => e.deudaId === deuda.id);
    const pago = pagos.find((p) => p.deuda.id === deuda.id);
    const saldo = saldoDe(deuda);
    const ea = deuda.tasaEA ?? eaDesdeMensual(deuda.tasaMensual);
    const usoCupo = deuda.cupo ? Math.min(100, (saldo / deuda.cupo) * 100) : null;

    const detalle = [
      esTarjeta(deuda) && deuda.diaCorte ? `Corte el ${deuda.diaCorte}` : null,
      deuda.diaPago ? `paga antes del ${deuda.diaPago}` : null,
      !esTarjeta(deuda) ? `cuota ${formatearCOP(deuda.pagoMinimo)}` : `mínimo ${formatearCOP(deuda.pagoMinimo)}`,
      ea > 0 ? `${(Math.round(ea * 10) / 10).toString().replace('.', ',')}% E.A.` : 'sin interés',
    ].filter(Boolean).join(' · ');

    return (
      <div className="relative rounded-2xl border border-linea bg-superficie p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[13.5px] truncate">{deuda.nombre}</span>
          <span
            className={`flex-none text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border ${
              esFoco ? 'border-accion/45 text-accion' : 'border-linea text-texto-2'
            }`}
          >
            {esFoco ? 'En ataque' : `Le toca en ${escalon?.desde.toLowerCase() ?? '—'}`}
          </span>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-[10.5px] text-texto-3">Debes</p>
            <p className="font-display font-extrabold text-xl tabular-nums leading-tight">{formatearCOP(saldo)}</p>
          </div>
          {deuda.cupo ? (
            <div className="text-right">
              <p className="text-[10.5px] text-texto-3">Cupo libre</p>
              <p className="font-bold text-sm text-texto-2 tabular-nums">{formatearCOP(Math.max(0, deuda.cupo - saldo))}</p>
            </div>
          ) : escalon ? (
            <div className="text-right">
              <p className="text-[10.5px] text-texto-3">En $0</p>
              <p className="font-bold text-sm text-texto-2">{escalon.hasta}</p>
            </div>
          ) : null}
        </div>

        {usoCupo !== null && (
          <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-2">
            <div className={`h-full rounded-full ${usoCupo > 70 ? 'bg-alerta' : 'bg-accion'}`} style={{ width: `${usoCupo}%` }} />
          </div>
        )}

        <p className="text-[10.5px] text-texto-3 mt-2 tabular-nums">{detalle}</p>

        {esFoco && esTarjeta(deuda) && (
          <p className="text-[11.5px] leading-relaxed text-texto-2 mt-2.5 pt-2.5 border-t border-hairline">
            <b className="text-texto">No la uses mientras la atacas.</b> Cada compra nueva suma a la deuda y corre tu fecha.
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => setAbonando({ deuda, monto: pago ? Math.max(0, pago.monto - pago.pagado) || pago.monto : deuda.pagoMinimo })}
            className="flex-1 py-2 rounded-xl border border-linea bg-superficie-2 text-xs font-bold hover:border-texto-3 cursor-pointer"
          >
            Abonar
          </button>
          <button
            type="button"
            aria-label={`Más opciones de ${deuda.nombre}`}
            onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === deuda.id ? null : deuda.id); }}
            className="p-2 rounded-xl border border-linea bg-superficie-2 text-texto-2 hover:text-texto cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {menuAbierto === deuda.id && (
          <div className="absolute right-3.5 bottom-14 z-10 w-44 rounded-xl border border-linea bg-elevada shadow-xl py-1 text-[13px]">
            <button type="button" className="w-full text-left px-3 py-2 hover:bg-superficie cursor-pointer" onClick={() => { setMenuAbierto(null); setEditando(deuda); }}>
              Editar
            </button>
            <button type="button" className="w-full text-left px-3 py-2 hover:bg-superficie cursor-pointer" onClick={() => { setMenuAbierto(null); onMarcarSaldada(deuda.id); }}>
              Ya la pagué toda
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-alerta hover:bg-superficie cursor-pointer"
              onClick={() => {
                setMenuAbierto(null);
                if (window.confirm(`¿Quitar "${deuda.nombre}" del plan?`)) onEliminarDeuda(deuda.id);
              }}
            >
              Quitar del plan
            </button>
          </div>
        )}
      </div>
    );
  };

  const lista = (titulo: string, items: Deuda[], vacio: string) => (
    <div className="flex flex-col gap-2.5">
      <div className="max-xl:hidden flex items-baseline justify-between">
        <Rotulo>{titulo}</Rotulo>
        <span className="text-[11px] text-texto-3 tabular-nums">{formatearCOP(items.reduce((a, d) => a + saldoDe(d), 0))}</span>
      </div>
      {items.length === 0 ? <p className="text-xs text-texto-3 py-3">{vacio}</p> : items.map((d) => <React.Fragment key={d.id}>{ficha(d)}</React.Fragment>)}
    </div>
  );

  const botonAgregar = (
    <button
      type="button"
      onClick={() => setCreando(true)}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-linea bg-superficie-2 text-xs font-bold hover:border-texto-3 cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" /> Agregar deuda
    </button>
  );

  return (
    <div className="w-full pb-24 xl:pb-0 xl:flex-1 xl:flex xl:flex-col" onClick={() => menuAbierto && setMenuAbierto(null)}>
      <BarraTitulo>
        <span className="font-display font-extrabold text-[15px]">Tus deudas</span>
        <span className="text-sm text-texto-2 tabular-nums">{formatearCOP(total)}</span>
      </BarraTitulo>
      <BarraAcciones>{botonAgregar}</BarraAcciones>

      {/* Móvil: encabezado y selector */}
      <div className="xl:hidden flex flex-col gap-3 mb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-extrabold text-xl">Tus deudas</h2>
          <span className="font-bold tabular-nums">{formatearCOP(total)}</span>
        </div>
        <div className="grid grid-cols-2 p-[3px] rounded-xl border border-linea bg-superficie-2" role="tablist">
          {(['tarjetas', 'prestamos'] as Pestana[]).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={pestana === p}
              onClick={() => setPestana(p)}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${pestana === p ? 'bg-elevada text-texto' : 'text-texto-3'}`}
            >
              {p === 'tarjetas' ? `Tarjetas · ${tarjetas.length}` : `Préstamos · ${prestamos.length}`}
            </button>
          ))}
        </div>
      </div>

      <Marco columnas="minmax(0,1fr) minmax(0,1fr) 340px">
        <Columna ordenMovil={1} borde className={pestana !== 'tarjetas' ? 'max-xl:hidden' : ''}>
          <Zona crece plana>
            {lista('Tarjetas de crédito', tarjetas, 'No tienes tarjetas con saldo en el plan.')}
          </Zona>
        </Columna>

        <Columna ordenMovil={2} borde className={pestana !== 'prestamos' ? 'max-xl:hidden' : ''}>
          <Zona crece plana>
            {lista('Préstamos y créditos', prestamos, 'No tienes préstamos en el plan.')}
          </Zona>
        </Columna>

        <Columna ordenMovil={3}>
          <Zona plana>
            <SimuladorAbonoExtra deudas={activas} disponibleMensual={disponibleMensual} estrategia={ESTRATEGIA} />
          </Zona>
          <Zona crece plana className="flex flex-col gap-2">
            <div className="xl:hidden">{botonAgregar}</div>
            {saldadas.length > 0 && (
              <>
                <Rotulo className="mt-1">Ya en $0 · {saldadas.length}</Rotulo>
                {saldadas.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 text-[12.5px] border-t border-hairline">
                    <span className="truncate text-texto-2">{d.nombre}</span>
                    <span className="text-positivo font-bold text-[11px]">Saldada</span>
                  </div>
                ))}
              </>
            )}
          </Zona>
        </Columna>
      </Marco>

      <ModalAgregarDeuda
        abierto={creando || editando !== null}
        deudaAEditar={editando}
        onCerrar={() => { setCreando(false); setEditando(null); }}
        onGuardar={onGuardarDeuda}
      />
      <ModalAbonarDeuda
        abierto={abonando !== null}
        deuda={abonando?.deuda ?? null}
        billeteras={billeteras}
        montoInicial={abonando?.monto}
        onCerrar={() => setAbonando(null)}
        onConfirmarAbono={(deudaId, billeteraId, monto) => {
          setAbonando(null);
          onAbonarDeuda(deudaId, billeteraId, monto);
        }}
      />
    </div>
  );
};
