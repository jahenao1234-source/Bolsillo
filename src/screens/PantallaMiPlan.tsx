/**
 * Mi plan: la pantalla de todos los meses. Responde una sola pregunta —¿qué
 * hago este mes?— y tiene un solo botón.
 *
 * Móvil: fase, fecha de libertad, pagos del mes, botón y cómo crece el ataque.
 * Escritorio: lo mismo a la izquierda, el porqué (gráfica a escala) al centro,
 * y cómo va a la derecha.
 */

import React, { useMemo, useState } from 'react';
import type { Billetera, Deuda, Movimiento, PerfilFlujo } from '../types';
import { RailPasos, PASOS_SISTEMA } from '../components/sistema/RailPasos';
import { GraduacionEnLinea } from '../components/sistema/Momentos';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import { GraficoPlanMinimos } from '../components/sistema/GraficoPlanMinimos';
import {
  compararConMinimos,
  deudasActivas,
  escaleraAtaque,
  gastoDeLaSemana,
  pagosDelMes,
  PagoDelMes,
  saldoDe,
  techoSemanal,
  diasHasta,
  proximoVencimiento,
  diasDeRetraso,
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
        <RailPasos pasos={PASOS_SISTEMA} actual="salir" />
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

  const pagado = activas.reduce((a, d) => a + Math.max(0, (d.montoOriginal || 0) - saldoDe(d)), 0);

  const pagosOrdenados = [...pagos].sort((a, b) => {
    if (!a.deuda.diaPago && !b.deuda.diaPago) return 0;
    if (!a.deuda.diaPago) return 1;
    if (!b.deuda.diaPago) return -1;
    return proximoVencimiento(a.deuda.diaPago, hoy).getTime() - proximoVencimiento(b.deuda.diaPago, hoy).getTime();
  });

  const marcas = escalera.slice(0, -1).map(e => {
    const palabras = e.nombre.split(' ');
    const esTarjeta = e.nombre.toLowerCase().startsWith('tarjeta');
    const etiqueta = esTarjeta && palabras.length > 1 ? palabras[1] : palabras[0];
    return { mes: e.mesHasta, etiqueta };
  });

  return (
    <div className="pant">
      {noAlcanza && (
        <div className="caja mal">
          Lo que tienes para deudas (<b>{formatearCOP(caja)}</b>) no alcanza los mínimos (<b>{formatearCOP(minimos)}</b>). Así la deuda no baja: ajusta tu mes.
        </div>
      )}
      <div className="rejilla llena" style={{ '--cols': 'minmax(0,1.75fr) minmax(0,1fr)' } as React.CSSProperties}>
        {/* PANEL A */}
        <section className="panel alto-2">
          <div className="panel-cab">
            <h2>Tu fecha de libertad</h2>
            <div className="nota num solo-escritorio">Debes {formatearCOP(deudaTotal)} · pagado {formatearCOP(pagado)}</div>
          </div>
          <div className="flex-wrap gap" style={{ gap: '12px 36px' }}>
            <div>
              <div className="nota">Con tu plan sales de deudas en</div>
              <div className="cifra-xl acento-tx">{comparacion.plan.viable ? comparacion.plan.fecha.replace(/^(\w{3})/, (m) => MESES_NOMBRE.find((n) => n.startsWith(m)) ?? m) : 'Sin fecha'}</div>
              <div className="nota">
                {comparacion.plan.viable ? <>en {comparacion.plan.meses} meses · <b>{formatearCOP(comparacion.plan.intereses)}</b> de intereses</> : 'El plan no cierra con lo que tienes'}
              </div>
            </div>
            <div>
              <div className="nota">Pagando solo mínimos</div>
              <div className="cifra-l suave">{comparacion.minimos.viable ? comparacion.minimos.fecha.replace(/^(\w{3})/, (m) => MESES_NOMBRE.find((n) => n.startsWith(m)) ?? m) : 'Nunca'}</div>
              <div className="nota">en {comparacion.minimos.meses} meses · {formatearCOP(comparacion.minimos.intereses)} de intereses</div>
            </div>
          </div>
          
          {comparacion.mesesGanados > 0 && (
            <div className="caja ok">
              <div className="cifra-l ok">{comparacion.mesesGanados} meses antes</div>
              <div className="nota">y</div>
              <div className="cifra-l ok">{formatearCOP(comparacion.interesesAhorrados)} menos</div>
              <div className="nota">de intereses</div>
            </div>
          )}

          <div className="panel-cab solo-escritorio">
            <h2>Lo que debes, mes a mes</h2>
            <div className="leyenda">
              <div className="item acento">Tu plan</div>
              <div className="item">Solo mínimos</div>
            </div>
          </div>

          <GraficoPlanMinimos
            seriePlan={comparacion.seriePlan}
            serieMinimos={comparacion.serieMinimos}
            fechaPlan={comparacion.plan.viable ? comparacion.plan.fecha : 'Sin fecha'}
            fechaMinimos={comparacion.minimos.viable ? comparacion.minimos.fecha : 'Nunca'}
            mesesGanados={comparacion.mesesGanados}
            marcas={marcas}
          />

          {perfil && (
            <div className="caja solo-escritorio" style={{ marginTop: 'auto' }}>
              <div>Si te pasas <b>$50.000</b> de tu techo semanal de {formatearCOP(techo || 0)}, tu fecha se corre <b>{diasDeRetraso(activas, caja, 50000)} días</b>.</div>
              <button className="link acento" onClick={() => onIrA('billetera')}>Ver Billetera →</button>
            </div>
          )}
        </section>

        {/* PANEL B */}
        <section className="panel">
          <div className="panel-cab">
            <h2>Pagos de {mesNombre.toLowerCase()}</h2>
            <div className="nota num">{pagos.filter(p => p.cumplido).length} de {pagos.length} pagados</div>
          </div>
          <div className="lista lineas">
            {pagosOrdenados.map(p => {
              const dias = p.deuda.diaPago ? diasHasta(proximoVencimiento(p.deuda.diaPago, hoy), hoy) : null;
              const fechaTexto = p.deuda.diaPago ? `vence el ${proximoVencimiento(p.deuda.diaPago, hoy).getDate()} ${MESES_NOMBRE[proximoVencimiento(p.deuda.diaPago, hoy).getMonth()].substring(0,3).toLowerCase()}` : 'sin fecha';
              let notaIzquierda = p.esFoco ? '' : p.deuda.tipo === 'prestamo' || p.deuda.tipo === 'libranza' ? 'Cuota fija' : 'Solo el mínimo';
              if (notaIzquierda) notaIzquierda += ' · ';

              return (
                <div key={p.deuda.id}>
                  <div className="fila">
                    <div>{p.deuda.nombre} {p.esFoco && <span className="chip ataque">Ataque</span>}</div>
                    <div className="num">{formatearCOP(p.monto)}</div>
                  </div>
                  <div className="fila" style={{ marginTop: 5 }}>
                    <div className="nota">{notaIzquierda}{fechaTexto}</div>
                    <div>
                      {p.cumplido ? <span className="chip ok">Pagado</span> : 
                       dias !== null && dias <= 3 ? <span className="chip aviso">{dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`}</span> : 
                       dias !== null ? <span className="nota num">en {dias} días</span> : null}
                    </div>
                  </div>
                  {p.esFoco && (
                    <div className="nota suave">{formatearCOP(p.minimo)} de mínimo + {formatearCOP(p.extra)} de ataque</div>
                  )}
                </div>
              );
            })}
            <div className="fila" style={{ marginTop: 'auto', paddingTop: 11, borderTop: '1px solid var(--linea)' }}>
              <div>Este mes a tus deudas</div>
              <div className="num font-bold">{formatearCOP(caja)}</div>
            </div>
          </div>
          <button className="btn ancho" onClick={abrirSiguientePago}>Registrar pago</button>
          <button className="link" style={{ alignSelf: 'center' }} onClick={() => onIrA('plan_listo')}>Ajustar mi mes o mis deudas</button>
        </section>

        {/* PANEL C */}
        <section className="panel">
          <div className="panel-cab">
            <h2>Cómo crece tu ataque</h2>
            <div className="nota num">{formatearCOP(escalera[0]?.monto || 0)} → {formatearCOP(caja)}</div>
          </div>
          <div className="pasos">
            {escalera.map((e, i) => (
              <div key={e.deudaId} className={`paso ${i === 0 ? 'actual' : ''}`}>
                <div className="fila">
                  <div>{e.nombre} {i === 0 && <span className="chip ataque">Ataque</span>}</div>
                  <div className="num">{formatearCOP(e.monto)}</div>
                </div>
                <div className="barra solo-escritorio">
                  <div className="lleno" style={{ width: `${(e.monto / caja) * 100}%` }} />
                </div>
                <div className="nota suave">Desde {e.desde.toLowerCase()} · en $0 en {e.hasta.toLowerCase()}</div>
                <div className="nota suave solo-escritorio">
                  {i === 0 
                    ? `${formatearCOP(e.libera)} de mínimo + ${formatearCOP(e.monto - e.libera)} de ataque`
                    : (() => {
                        const anterior = escalera[i-1];
                        const p = anterior.nombre.split(' ');
                        const antCorto = anterior.nombre.toLowerCase().startsWith('tarjeta') && p.length > 1 ? p[1] : p[0];
                        const esFijo = activas.find(d => d.id === e.deudaId)?.tipo === 'prestamo' || activas.find(d => d.id === e.deudaId)?.tipo === 'libranza';
                        return `${formatearCOP(e.libera)} de ${esFijo ? 'cuota' : 'mínimo'} + ${formatearCOP(e.monto - e.libera)} de ${antCorto}`;
                      })()
                  }
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      
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
