import React, { useMemo, useState } from 'react';
import type { Billetera, Deuda, Movimiento } from '../types';
import { ModalAgregarDeuda } from '../components/deudas/ModalAgregarDeuda';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import {
  compararConMinimos,
  deudasActivas,
  eaDesdeMensual,
  escaleraAtaque,
  pagosDelMes,
  saldoDe,
  proximoVencimiento,
  diasHasta,
} from '../logic/sistema';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE, MESES_ABREV } from '../utils/fechas';

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
  const [editando, setEditando] = useState<Deuda | null>(null);
  const [creando, setCreando] = useState(false);
  const [abonando, setAbonando] = useState<{ deuda: Deuda; monto: number } | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [simElegida, setSimElegida] = useState(0);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const saldadas = deudas.filter((d) => !activas.includes(d));
  const escalera = useMemo(() => escaleraAtaque(activas, disponibleMensual), [activas, disponibleMensual]);
  const pagos = useMemo(() => pagosDelMes(activas, disponibleMensual, movimientos), [activas, disponibleMensual, movimientos]);

  const ordenadas = useMemo(() => {
    return escalera.map(e => activas.find(d => d.id === e.deudaId)!).filter(Boolean);
  }, [escalera, activas]);

  const total = activas.reduce((a, d) => a + saldoDe(d), 0);
  const original = deudas.reduce((a, d) => a + (d.montoOriginal || 0), 0);
  const pagado = deudas.reduce((a, d) => a + Math.max(0, (d.montoOriginal || 0) - saldoDe(d)), 0);
  const pctPagado = original > 0 ? Math.round((pagado / original) * 100) : 0;

  const base = useMemo(() => compararConMinimos(activas, disponibleMensual), [activas, disponibleMensual]);
  const sims = useMemo(() => [100000, 200000].map(extra => ({ extra, c: compararConMinimos(activas, disponibleMensual + extra) })), [activas, disponibleMensual]);

  const ea = (d: Deuda) => {
    const v = d.tasaEA ?? eaDesdeMensual(d.tasaMensual);
    return v.toFixed(1).replace('.', ',').replace(',0', '');
  };

  const nombreCorto = (d: Deuda) => {
    const p = d.nombre.split(' ');
    if (d.nombre.toLowerCase().startsWith('tarjeta') && p.length > 1) return p[1];
    return p[0];
  };

  const mesesLargo = (fechaCorta: string) => {
    return fechaCorta.replace(/^(\w{3})/, (m) => MESES_NOMBRE.find(n => n.startsWith(m)) ?? m).toLowerCase();
  };

  return (
    <div className="pant" onClick={() => menuAbierto && setMenuAbierto(null)}>
      <div className="rejilla llena" style={{ '--cols': 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)' } as React.CSSProperties}>

        {/* PANEL "Lo que debes" */}
        <section className="panel ancho-todo">
          <div className="panel-cab">
            <h2 className="titulo">Lo que debes</h2>
            <button className="btn2" onClick={() => setCreando(true)}>+ Agregar deuda</button>
          </div>
          <div className="rejilla" style={{ '--cols': 'minmax(0,1.25fr) minmax(0,1fr)', alignItems: 'center' } as React.CSSProperties}>
            <div className="par">
              <div>
                <div>Debes en total</div>
                <div className="cifra-l">{formatearCOP(total)}</div>
                <div className="nota suave">{activas.length} deudas · de menor a mayor saldo</div>
              </div>
              <div>
                <div>Has pagado</div>
                <div className="cifra-l">{formatearCOP(pagado)} <span className="de">{pctPagado}%</span></div>
                <div className="barra" style={{ marginTop: 8 }}>
                  <i style={{ width: `${pctPagado}%` }} />
                </div>
              </div>
            </div>
            <div className="caja">
              <b>Mientras pagas, no uses tus tarjetas.</b> Cada compra nueva vuelve a subir la deuda y corre tu fecha de libertad.
            </div>
          </div>
        </section>

        {/* UN PANEL POR DEUDA */}
        {ordenadas.map((deuda, i) => {
          const isAtaque = pagos.length > 0 && pagos[0].deuda.id === deuda.id;
          const escalon = escalera.find(e => e.deudaId === deuda.id);
          const pago = pagos.find(p => p.deuda.id === deuda.id)!;
          const saldo = saldoDe(deuda);
          const diaVencimiento = deuda.diaPago ? proximoVencimiento(deuda.diaPago, new Date()) : null;
          const faltan = diaVencimiento ? diasHasta(diaVencimiento, new Date()) : null;
          const uso = deuda.cupo ? Math.round((saldo / deuda.cupo) * 100) : null;
          
          return (
            <section key={deuda.id} className={`panel ${isAtaque ? 'destacado' : ''}`} style={{ position: 'relative' }}>
              <div className="panel-cab">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="inicial">{i + 1}</span>
                  <b>{deuda.nombre}</b>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isAtaque ? (
                    <span className="chip ataque">Ataque</span>
                  ) : (
                    <span className="chip">Le toca en {escalon?.desde.toLowerCase() ?? '—'}</span>
                  )}
                  <button className="link" aria-label={`Más opciones de ${deuda.nombre}`} onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === deuda.id ? null : deuda.id); }}>···</button>
                </div>
              </div>

              <div className="fila" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div>Debes</div>
                  <div className="cifra-l">{formatearCOP(saldo)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Sale en</div>
                  <div className={`cifra-m ${isAtaque ? 'acento-tx' : ''}`}>{escalon?.hasta.toLowerCase() ?? '—'}</div>
                </div>
              </div>

              <div className="lista solo-escritorio" style={{ gap: 8 }}>
                <div className="fila"><span className="suave">Tasa</span> <span>{ea(deuda)}% E.A.</span></div>
                {esTarjeta(deuda) ? (
                  <div className="fila"><span className="suave">Pago mínimo</span> <span>{formatearCOP(deuda.pagoMinimo)}</span></div>
                ) : (
                  <div className="fila"><span className="suave">Cuota fija</span> <span>{formatearCOP(deuda.pagoMinimo)}</span></div>
                )}
                {esTarjeta(deuda) && deuda.diaCorte ? (
                  <div className="fila"><span className="suave">Corte y pago</span> <span>corte {deuda.diaCorte} · paga el {deuda.diaPago}</span></div>
                ) : deuda.diaPago ? (
                  <div className="fila"><span className="suave">Pago</span> <span>el {deuda.diaPago} de cada mes</span></div>
                ) : null}
                <div className="fila"><span className="suave">Este mes le pagas</span> <span>{formatearCOP(pago?.monto ?? 0)}</span></div>
                {!isAtaque && (
                  <div className="fila"><span className="suave">Desde {escalon?.desde.toLowerCase()} recibe</span> <span>{formatearCOP(escalon?.monto ?? 0)}</span></div>
                )}
              </div>

              <div className="nota solo-movil">
                {ea(deuda)}% E.A. · {esTarjeta(deuda) ? 'mínimo' : 'cuota'} {formatearCOP(deuda.pagoMinimo)} · {esTarjeta(deuda) && deuda.diaCorte ? `corte ${deuda.diaCorte}, paga el ${deuda.diaPago}` : deuda.diaPago ? `paga el ${deuda.diaPago}` : ''} · {isAtaque ? <>este mes le pagas <b>{formatearCOP(pago?.monto ?? 0)}</b></> : <>desde {escalon?.desde.toLowerCase()} recibe <b>{formatearCOP(escalon?.monto ?? 0)}</b></>}
              </div>

              <div style={{ marginTop: 8 }}>
                {uso !== null && deuda.cupo ? (
                  <>
                    <div className="fila">
                      <div>Uso del cupo</div>
                      <div className={uso >= 70 ? 'mal' : ''}>{uso}% de {formatearCOP(deuda.cupo)}</div>
                    </div>
                    <div className="barra" style={{ marginTop: 5, '--c': uso >= 70 ? 'var(--alerta)' : 'var(--neutro)' } as React.CSSProperties}>
                      <i style={{ width: `${Math.min(100, uso)}%` }} />
                    </div>
                    {uso >= 70 && (
                      <div className="nota mal" style={{ marginTop: 5 }}>Riesgo: solo te quedan {formatearCOP(Math.max(0, deuda.cupo - saldo))} de cupo.</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="fila">
                      <div>Próximo pago · {diaVencimiento ? `${diaVencimiento.getDate()} ${MESES_ABREV[diaVencimiento.getMonth()].toLowerCase()}` : '—'}</div>
                      <div>
                        {faltan !== null && faltan <= 3 ? (
                          <span className="chip aviso">{faltan === 0 ? 'Hoy' : faltan === 1 ? 'Mañana' : `En ${faltan} días`}</span>
                        ) : faltan !== null ? (
                          <span className="nota num">en {faltan} días</span>
                        ) : null}
                      </div>
                    </div>
                    {i === ordenadas.length - 1 && (
                      <div className="nota suave" style={{ marginTop: 5 }}>Con esta quedas libre de deudas.</div>
                    )}
                  </>
                )}
              </div>

              <button 
                className={isAtaque ? "btn ancho" : "btn2 ancho solo-escritorio"} 
                style={{ marginTop: 'auto' }}
                onClick={() => setAbonando({ deuda, monto: Math.max(0, (pago?.monto ?? 0) - (pago?.pagado ?? 0)) || (pago?.monto ?? deuda.pagoMinimo) })}
              >
                {isAtaque ? `Abonar a ${nombreCorto(deuda)}` : esTarjeta(deuda) ? 'Abonar' : 'Pagar cuota'}
              </button>

              {menuAbierto === deuda.id && (
                <div className="absolute right-3.5 top-12 z-10 w-44 rounded-xl border border-linea bg-elevada shadow-xl py-1 text-[13px]">
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
            </section>
          );
        })}

        {/* PANEL "¿Y si abonas más al mes?" */}
        <section className="panel ancho-todo">
          <div className="panel-cab">
            <h2 className="titulo">¿Y si abonas más al mes?</h2>
            <span className="nota num solo-escritorio">Hoy: {formatearCOP(disponibleMensual)} al mes · sales en {base.plan.viable ? mesesLargo(base.plan.fecha) : '—'}</span>
          </div>
          {base.plan.viable ? (
            <div className="rejilla" style={{ '--cols': 'minmax(0,1.25fr) minmax(0,1fr)', alignItems: 'center' } as React.CSSProperties}>
              <div className="par">
                {sims.map((sim, idx) => (
                  <button
                    key={idx}
                    className={simElegida === idx ? "btn-borde" : "btn2"}
                    aria-pressed={simElegida === idx}
                    onClick={() => setSimElegida(idx)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '11px 14px' }}
                  >
                    <div>+{formatearCOP(sim.extra)} al mes</div>
                    <span className="cifra-m">{sim.c.plan.viable ? mesesLargo(sim.c.plan.fecha) : '—'}</span>
                    <span className="nota">{base.plan.meses - sim.c.plan.meses} {base.plan.meses - sim.c.plan.meses === 1 ? 'mes' : 'meses'} antes</span>
                    <span className="nota num">{formatearCOP(base.plan.intereses - sim.c.plan.intereses)} menos</span>
                  </button>
                ))}
              </div>
              <div className="lista solo-escritorio" style={{ gap: 8 }}>
                <div className="fila">
                  <span>Hoy · {formatearCOP(disponibleMensual)} al mes</span>
                  <span>{base.plan.meses} meses · {formatearCOP(base.plan.intereses)} de intereses</span>
                </div>
                <div className="fila">
                  <span>Con {formatearCOP(disponibleMensual + sims[simElegida].extra)} al mes</span>
                  <span className="acento-tx">{sims[simElegida].c.plan.meses} meses · {formatearCOP(sims[simElegida].c.plan.intereses)} de intereses</span>
                </div>
                <div className="caja ok">
                  Sales en <b>{mesesLargo(sims[simElegida].c.plan.fecha)}</b> y pagas <b className="num">{formatearCOP(base.plan.intereses - sims[simElegida].c.plan.intereses)} menos</b> de intereses.
                </div>
              </div>
            </div>
          ) : (
            <div className="caja mal">Con lo que tienes para deudas el plan no cierra: primero ajusta tu mes.</div>
          )}
        </section>

        {/* PANEL "Ya en $0" */}
        {saldadas.length > 0 && (
          <section className="panel ancho-todo">
            <h2 className="titulo">Ya en $0 · {saldadas.length}</h2>
            <div className="lista lineas">
              {saldadas.map(d => (
                <div key={d.id} className="fila">
                  <div>{d.nombre}</div>
                  <span className="chip ok">Saldada</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

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
