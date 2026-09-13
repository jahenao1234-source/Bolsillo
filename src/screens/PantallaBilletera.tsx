/**
 * Billetera: dónde está la plata y qué se fue.
 *
 * El techo de la semana conecta los gastos con el plan: lo básico del mes
 * repartido por semanas. Pasarse no es un regaño, es un dato: el gasto rápido
 * dice cuántos días se corre la fecha de libertad.
 */

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Billetera, Deuda, Movimiento, PerfilFlujo } from '../types';
import { Marco, Columna, Zona } from '../components/layout/Marco';
import { BarraAcciones, BarraTitulo } from '../components/layout/shell';
import { Rotulo } from '../components/sistema/RailPasos';
import { HojaGastoRapido } from '../components/sistema/HojaGastoRapido';
import { ModalAgregarBilletera } from '../components/billeteras/ModalAgregarBilletera';
import { ModalRegistrarMovimiento } from '../components/billeteras/ModalRegistrarMovimiento';
import { deudasActivas, gastoDeLaSemana, techoSemanal } from '../logic/sistema';
import { formatearCOP } from '../utils/format';

interface PantallaBilleteraProps {
  billeteras: Billetera[];
  saldoTotal: number;
  totalApartado: number;
  movimientos: Movimiento[];
  deudas: Deuda[];
  disponibleMensual: number;
  perfil: PerfilFlujo | null;
  onGuardarBilletera: (billetera: Billetera) => void;
  onEliminarBilletera: (id: string) => void;
  onRegistrarMovimiento: (movimiento: Omit<Movimiento, 'id'>) => void;
}

const POR_PAGINA = 10;

export const PantallaBilletera: React.FC<PantallaBilleteraProps> = ({
  billeteras,
  saldoTotal,
  totalApartado,
  movimientos,
  deudas,
  disponibleMensual,
  perfil,
  onGuardarBilletera,
  onEliminarBilletera,
  onRegistrarMovimiento,
}) => {
  const [gastoAbierto, setGastoAbierto] = useState(false);
  const [ingresoAbierto, setIngresoAbierto] = useState(false);
  const [billeteraEditando, setBilleteraEditando] = useState<Billetera | null>(null);
  const [creandoBilletera, setCreandoBilletera] = useState(false);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const techo = perfil ? techoSemanal(perfil.gastosBasicos) : null;
  const gastoSemana = gastoDeLaSemana(movimientos);
  const pasado = techo !== null && gastoSemana > techo;

  const ordenados = useMemo(
    () => [...movimientos].sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? '')),
    [movimientos]
  );

  const botonGasto = (
    <button
      type="button"
      onClick={() => setGastoAbierto(true)}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accion-gradient text-on-accion font-extrabold text-[13px] cursor-pointer"
    >
      <Plus className="w-4 h-4" /> Gasto
    </button>
  );

  return (
    <div className="w-full pb-24 xl:pb-0 xl:flex-1 xl:flex xl:flex-col">
      <BarraTitulo>
        <span className="font-display font-extrabold text-[15px]">Tu plata</span>
        <div className="flex flex-col text-right">
          <span className="text-sm text-texto-2 tabular-nums">{formatearCOP(saldoTotal)}</span>
          {totalApartado > 0 && <span className="text-[10px] text-texto-3">{formatearCOP(totalApartado)} en sobres</span>}
        </div>
      </BarraTitulo>
      <BarraAcciones>
        <button
          type="button"
          onClick={() => setIngresoAbierto(true)}
          className="px-3 py-2 rounded-xl border border-linea bg-superficie-2 text-xs font-bold hover:border-texto-3 cursor-pointer"
        >
          + Ingreso
        </button>
        {botonGasto}
      </BarraAcciones>

      <div className="xl:hidden flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-extrabold text-xl">Tu plata</h2>
          <p className="text-sm text-texto-2 tabular-nums">{formatearCOP(saldoTotal)}</p>
          {totalApartado > 0 && <p className="text-[11px] text-texto-3 mt-0.5">{formatearCOP(totalApartado)} en sobres</p>}
        </div>
        {botonGasto}
      </div>

      <Marco columnas="360px minmax(0,1fr)">
        <Columna ordenMovil={1} borde>
          <Zona>
            <div className="flex items-center justify-between mb-1.5">
              <Rotulo>Tus billeteras</Rotulo>
              <button type="button" onClick={() => setCreandoBilletera(true)} className="text-[11px] text-acento cursor-pointer">
                + Agregar
              </button>
            </div>
            {billeteras.length === 0 ? (
              <p className="text-xs text-texto-3 py-2">Agrega dónde tienes tu plata: Nequi, banco, efectivo.</p>
            ) : (
              billeteras.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBilleteraEditando(b)}
                  className={`w-full flex items-center justify-between py-2.5 text-left text-[13px] cursor-pointer hover:text-acento ${i ? 'border-t border-hairline' : ''}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ background: b.color ?? 'var(--texto-3)' }} />
                    <span className="truncate">{b.nombre}</span>
                  </span>
                  <span className={`font-bold tabular-nums ${b.saldo < 0 ? 'text-alerta' : 'text-texto'}`}>{formatearCOP(b.saldo)}</span>
                </button>
              ))
            )}
          </Zona>

          <Zona crece>
            <Rotulo>Techo de esta semana</Rotulo>
            {techo === null ? (
              <p className="text-xs text-texto-3 mt-2">Configura tu mes en Mi plan para saber cuánto puedes gastar por semana.</p>
            ) : (
              <>
                <p className={`font-display font-extrabold text-2xl tabular-nums mt-1.5 ${pasado ? 'text-alerta' : 'text-texto'}`}>
                  {formatearCOP(gastoSemana)} <span className="text-sm font-semibold text-texto-3">de {formatearCOP(techo)}</span>
                </p>
                <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${pasado ? 'bg-alerta' : 'bg-acento'}`}
                    style={{ width: `${Math.min(100, techo > 0 ? (gastoSemana / techo) * 100 : 0)}%` }}
                  />
                </div>
                <p className="text-[11.5px] text-texto-2 mt-2 leading-relaxed">
                  {pasado
                    ? <>Vas <b className="text-texto tabular-nums">{formatearCOP(gastoSemana - techo)}</b> por encima: eso sale de tu plan.</>
                    : <>Te quedan <b className="text-texto tabular-nums">{formatearCOP(techo - gastoSemana)}</b> para esta semana.</>}
                </p>
              </>
            )}
            <button
              type="button"
              onClick={() => setIngresoAbierto(true)}
              className="xl:hidden mt-4 w-full py-2.5 rounded-xl border border-linea bg-superficie-2 text-xs font-bold cursor-pointer"
            >
              + Registrar un ingreso
            </button>
          </Zona>
        </Columna>

        <Columna ordenMovil={2}>
          <Zona crece>
            <Rotulo className="mb-1.5">Movimientos</Rotulo>
            {ordenados.length === 0 && <p className="text-xs text-texto-3 py-2">Todavía no hay movimientos.</p>}
            {ordenados.slice(0, visibles).map((m, i) => {
              const esIngreso = m.tipo === 'ingreso';
              const esTransferencia = m.tipo === 'transferencia';
              const destino = billeteras.find((b) => b.id === m.billeteraDestinoId)?.nombre || 'Otra cuenta';
              
              return (
                <div key={m.id} className={`flex items-center justify-between gap-3 py-2.5 ${i ? 'border-t border-hairline' : ''}`}>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold truncate flex items-center gap-1.5">
                      {esTransferencia && (
                        <svg className="w-3.5 h-3.5 flex-none text-texto-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      )}
                      {esTransferencia ? `${m.billeteraNombre ?? 'Billetera'} → ${destino} · ${m.descripcion || m.nota}` : m.descripcion || m.nota || m.categoria}
                    </span>
                    <span className="block text-[10.5px] text-texto-3 truncate">
                      {esTransferencia ? 'Sobres' : m.categoria} · {!esTransferencia && (m.billeteraNombre ?? 'Billetera') + ' · '} {m.fecha}
                    </span>
                  </span>
                  <span className={`flex-none font-bold text-[13px] tabular-nums ${esTransferencia ? 'text-texto-2' : esIngreso ? 'text-positivo' : 'text-texto'}`}>
                    {!esTransferencia && (esIngreso ? '+' : '−')}
                    {formatearCOP(m.monto)}
                  </span>
                </div>
              );
            })}
            {ordenados.length > visibles && (
              <button
                type="button"
                onClick={() => setVisibles((v) => v + POR_PAGINA)}
                className="w-full mt-2 py-2 text-xs text-acento cursor-pointer"
              >
                Ver {Math.min(POR_PAGINA, ordenados.length - visibles)} más
              </button>
            )}
          </Zona>
        </Columna>
      </Marco>

      <HojaGastoRapido
        abierto={gastoAbierto}
        billeteras={billeteras}
        techoSemanal={techo}
        gastoSemana={gastoSemana}
        deudas={activas}
        caja={disponibleMensual}
        enFaseDeudas={activas.length > 0}
        onGuardar={onRegistrarMovimiento}
        onCerrar={() => setGastoAbierto(false)}
      />
      <ModalRegistrarMovimiento
        abierto={ingresoAbierto}
        billeteras={billeteras}
        tipoPreseleccionado="ingreso"
        onCerrar={() => setIngresoAbierto(false)}
        onGuardar={onRegistrarMovimiento}
      />
      <ModalAgregarBilletera
        abierto={creandoBilletera || billeteraEditando !== null}
        billeteraAEditar={billeteraEditando}
        onCerrar={() => { setCreandoBilletera(false); setBilleteraEditando(null); }}
        onGuardar={onGuardarBilletera}
      />
      {billeteraEditando && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`¿Eliminar la billetera "${billeteraEditando.nombre}"?`)) {
              onEliminarBilletera(billeteraEditando.id);
              setBilleteraEditando(null);
            }
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-full border border-alerta/40 bg-elevada text-alerta text-xs font-bold shadow-xl cursor-pointer"
        >
          Eliminar esta billetera
        </button>
      )}
    </div>
  );
};
