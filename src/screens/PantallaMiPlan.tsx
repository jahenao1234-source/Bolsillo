/**
 * Mi plan: la pantalla de todos los meses. Responde una sola pregunta —¿qué
 * hago este mes?— y tiene un solo botón.
 *
 * Móvil: fase, fecha de libertad, pagos del mes, botón y cómo crece el ataque.
 * Escritorio: lo mismo a la izquierda, el porqué (gráfica a escala) al centro,
 * y cómo va a la derecha.
 */

import React, { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { Billetera, Deuda, Movimiento, PerfilFlujo } from '../types';
import { Marco, Columna, Zona } from '../components/layout/Marco';
import { BarraTitulo } from '../components/layout/shell';
import { FASES, RailPasos, Rotulo } from '../components/sistema/RailPasos';
import { PagosDelMes } from '../components/sistema/PagosDelMes';
import { EscaleraAtaque } from '../components/sistema/EscaleraAtaque';
import { GraficoExtincion } from '../components/sistema/GraficoExtincion';
import { GraduacionEnLinea } from '../components/sistema/Momentos';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import {
  compararConMinimos,
  deudasActivas,
  escaleraAtaque,
  gastoDeLaSemana,
  pagosDelMes,
  PagoDelMes,
  saldoDe,
  techoSemanal,
} from '../logic/sistema';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE } from '../utils/fechas';

interface PantallaMiPlanProps {
  deudas: Deuda[];
  movimientos: Movimiento[];
  billeteras: Billetera[];
  saldoTotal: number;
  disponibleMensual: number;
  perfil: PerfilFlujo | null;
  esPro: boolean;
  onAbonarDeuda: (deudaId: string, billeteraId: string, monto: number) => void;
  onIrA: (destino: 'deudas' | 'billetera' | 'plan_listo' | 'activar_codigo' | 'pro_inicio') => void;
}

export const PantallaMiPlan: React.FC<PantallaMiPlanProps> = ({
  deudas,
  movimientos,
  billeteras,
  saldoTotal,
  disponibleMensual,
  perfil,
  esPro,
  onAbonarDeuda,
  onIrA,
}) => {
  const [pagoAbierto, setPagoAbierto] = useState<PagoDelMes | null>(null);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const caja = disponibleMensual;
  const hoy = new Date();
  const mesNombre = MESES_NOMBRE[hoy.getMonth()];

  const pagos = useMemo(() => pagosDelMes(activas, caja, movimientos), [activas, caja, movimientos]);
  const escalera = useMemo(() => escaleraAtaque(activas, caja), [activas, caja]);
  const comparacion = useMemo(() => compararConMinimos(activas, caja), [activas, caja]);

  const minimos = activas.reduce((a, d) => a + d.pagoMinimo, 0);
  const deudaTotal = activas.reduce((a, d) => a + saldoDe(d), 0);
  const saldadas = deudas.length - activas.length;

  const abrirSiguientePago = () => {
    const pendiente = pagos.find((p) => !p.cumplido) ?? pagos[0];
    if (pendiente) setPagoAbierto(pendiente);
  };

  // ---------- Sin deudas en el plan ----------
  if (deudas.length === 0) {
    return (
      <div className="max-w-md mx-auto xl:mx-0 py-6 flex flex-col gap-4">
        <RailPasos pasos={FASES} actual="salir" />
        <h2 className="font-display font-extrabold text-3xl leading-tight tracking-tight">Tu plan empieza con tus deudas.</h2>
        <p className="text-sm text-texto-2 leading-relaxed">
          Anota lo que debes y lo que te entra al mes. En diez minutos tienes tu fecha de libertad y lo que pagas cada mes.
        </p>
        <button type="button" onClick={() => onIrA('plan_listo')} className="py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer">
          Armar mi plan
        </button>
      </div>
    );
  }

  // ---------- Ya no quedan deudas ----------
  if (activas.length === 0) {
    const totalPagado = deudas.reduce((a, d) => a + (d.montoOriginal ?? 0), 0);
    return (
      <div className="py-4">
        <GraduacionEnLinea
          totalPagado={totalPagado}
          libre={caja}
          esPro={esPro}
          onActivarPro={() => onIrA('activar_codigo')}
          onEmpezarBlindar={() => onIrA('pro_inicio')}
        />
      </div>
    );
  }

  const noAlcanza = caja < minimos;
  const techo = perfil ? techoSemanal(perfil.gastosBasicos) : null;
  const gastoSemana = gastoDeLaSemana(movimientos);

  const heroe = (
    <div>
      <Rotulo>Tu fecha de libertad</Rotulo>
      <p className="font-display font-extrabold text-[34px] xl:text-[40px] leading-none tracking-tight mt-1.5">
        {comparacion.plan.viable ? comparacion.plan.fecha.replace(/^(\w{3})/, (m) => MESES_NOMBRE.find((n) => n.startsWith(m)) ?? m) : 'Sin fecha'}
      </p>
      <p className="text-xs text-texto-2 mt-1.5 tabular-nums">
        {comparacion.plan.viable ? `${comparacion.plan.meses} ${comparacion.plan.meses === 1 ? 'mes' : 'meses'}` : 'El plan no cierra'}
        {' · '}
        {formatearCOP(deudaTotal)} por pagar · {saldadas} de {deudas.length} {deudas.length === 1 ? 'deuda' : 'deudas'}
      </p>
    </div>
  );

  return (
    <div className="w-full pb-24 xl:pb-0 xl:flex-1 xl:flex xl:flex-col">
      <BarraTitulo>
        <span className="font-display font-extrabold text-[15px]">Mi plan</span>
        <RailPasos pasos={FASES} actual="salir" className="w-[330px] ml-3" />
      </BarraTitulo>

      <Marco columnas="340px minmax(0,1fr) 320px">
        {/* ---------- Qué hago este mes ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona crece plana className="flex flex-col gap-3.5 xl:gap-4">
            <RailPasos pasos={FASES} actual="salir" className="xl:hidden" />
            {heroe}

            {noAlcanza && (
              <p className="text-xs leading-relaxed text-texto-2 p-3 rounded-xl border border-alerta/40 bg-alerta/5">
                Lo que tienes para deudas (<b className="text-texto">{formatearCOP(caja)}</b>) no alcanza los mínimos (
                <b className="text-texto">{formatearCOP(minimos)}</b>). Así la deuda no baja: ajusta tu mes.
              </p>
            )}

            <PagosDelMes pagos={pagos} mesNombre={mesNombre} onPagar={setPagoAbierto} />

            <button type="button" onClick={abrirSiguientePago} className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer">
              Registrar un pago
            </button>

            <button
              type="button"
              onClick={() => onIrA('plan_listo')}
              className="self-center inline-flex items-center gap-1.5 text-xs text-texto-3 hover:text-texto-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Ajustar mi mes o mis deudas
            </button>
          </Zona>
        </Columna>

        {/* ---------- El porqué ---------- */}
        <Columna ordenMovil={2} borde>
          <Zona className="max-xl:hidden">
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div>
                <Rotulo>Tu deuda, mes a mes</Rotulo>
                <p className="font-bold text-sm mt-1 tabular-nums">{formatearCOP(deudaTotal)} hoy</p>
              </div>
              <div className="flex gap-3.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-texto-3"><i className="w-3.5 h-0.5 bg-texto-3" />Solo mínimos</span>
                <span className="inline-flex items-center gap-1.5 text-acento font-bold"><i className="w-3.5 h-[3px] rounded bg-acento" />Tu plan</span>
              </div>
            </div>
            <GraficoExtincion
              seriePlan={comparacion.seriePlan}
              serieMinimos={comparacion.serieMinimos}
              fechaPlan={comparacion.plan.fecha}
              fechaMinimos={comparacion.minimos.fecha}
              mesesGanados={comparacion.mesesGanados}
              ancho={920}
            />
            {comparacion.mesesGanados > 0 && (
              <p className="text-xs text-texto-2 mt-2">
                Pagando solo mínimos saldrías en <b className="text-texto">{comparacion.minimos.fecha.toLowerCase()}</b>. Con tu plan,{' '}
                <b className="text-texto">{comparacion.mesesGanados} meses antes</b> y <b className="text-texto tabular-nums">{formatearCOP(comparacion.interesesAhorrados)}</b> menos de intereses.
              </p>
            )}
          </Zona>
          <Zona crece plana className="flex flex-col gap-2 max-xl:mt-3">
            <Rotulo>Cómo crece tu ataque</Rotulo>
            <div className="xl:hidden"><EscaleraAtaque escalones={escalera} /></div>
            <div className="hidden xl:block"><EscaleraAtaque escalones={escalera} detallada /></div>
            <p className="text-[11.5px] text-texto-3 leading-relaxed">
              Cada deuda que cae le pasa su cuota a la siguiente. Por eso el ataque crece sin que pongas un peso más.
            </p>
          </Zona>
        </Columna>

        {/* ---------- Cómo va ---------- */}
        <Columna ordenMovil={3} className="max-xl:hidden">
          <Zona>
            <div className="flex items-center justify-between mb-2">
              <Rotulo>Tus deudas</Rotulo>
              <button type="button" onClick={() => onIrA('deudas')} className="text-[11px] text-acento cursor-pointer">Ver todas</button>
            </div>
            {pagos.map((p, i) => (
              <div key={p.deuda.id} className={`flex items-center justify-between gap-2 py-2 text-[12.5px] ${i ? 'border-t border-hairline' : ''}`}>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.deuda.nombre}</span>
                  <span className="block text-[10.5px] text-texto-3">
                    {p.esFoco ? 'En ataque' : `Le toca en ${escalera.find((e) => e.deudaId === p.deuda.id)?.desde.toLowerCase() ?? '—'}`}
                  </span>
                </span>
                <span className="font-bold tabular-nums">{formatearCOP(saldoDe(p.deuda))}</span>
              </div>
            ))}
          </Zona>
          <Zona crece>
            <div className="flex items-center justify-between mb-2">
              <Rotulo>Tu plata</Rotulo>
              <button type="button" onClick={() => onIrA('billetera')} className="text-[11px] text-acento cursor-pointer">Billetera</button>
            </div>
            {billeteras.slice(0, 4).map((b, i) => (
              <div key={b.id} className={`flex justify-between py-1.5 text-[12.5px] ${i ? 'border-t border-hairline' : ''}`}>
                <span className="truncate">{b.nombre}</span>
                <span className="font-bold tabular-nums">{formatearCOP(b.saldo)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1 border-t border-hairline text-[12.5px] font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatearCOP(saldoTotal)}</span>
            </div>
            {techo !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px]">
                  <Rotulo>Techo de la semana</Rotulo>
                  <span className={`font-bold tabular-nums ${gastoSemana > techo ? 'text-alerta' : 'text-texto-2'}`}>
                    {formatearCOP(gastoSemana)} de {formatearCOP(techo)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${gastoSemana > techo ? 'bg-alerta' : 'bg-acento'}`}
                    style={{ width: `${Math.min(100, techo > 0 ? (gastoSemana / techo) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            )}
          </Zona>
        </Columna>
      </Marco>

      <ModalAbonarDeuda
        abierto={pagoAbierto !== null}
        deuda={pagoAbierto?.deuda ?? null}
        billeteras={billeteras}
        montoInicial={pagoAbierto ? Math.max(0, pagoAbierto.monto - pagoAbierto.pagado) || pagoAbierto.monto : undefined}
        onCerrar={() => setPagoAbierto(null)}
        onConfirmarAbono={(deudaId, billeteraId, monto) => {
          setPagoAbierto(null);
          onAbonarDeuda(deudaId, billeteraId, monto);
        }}
      />
    </div>
  );
};
