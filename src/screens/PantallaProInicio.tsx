import React, { useEffect, useState } from 'react';
import { Target, Check, ChevronRight } from 'lucide-react';
import { RailPasos, Rotulo, PASOS_SISTEMA } from '../components/sistema/RailPasos';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE } from '../utils/fechas';
import { Deuda, PerfilFlujo, Sobre, Billetera, Movimiento } from '../types';
import {
  faseActual,
  estadoBaseCero,
  metaFondoBlindado,
  repartoDelMes,
  faltaMoverEsteMes,
  movidoEsteMes,
  resumenAnioPro,
  siguientePaso,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  ID_BASICO_MERCADO,
  gastadoDelMes,
  fechaAporteEsteMes,
  Fase,
} from '../logic/sistema';

import { ModalMoverSobre } from '../components/sobres/ModalMoverSobre';

interface PantallaProInicioProps {
  perfil: PerfilFlujo;
  deudas: Deuda[];
  sobres: Sobre[];
  billeteras: Billetera[];
  movimientos: Movimiento[];
  saldoTotal: number;
  onAbonarASobre: (sobreId: string, origenId: string, monto: number, origen?: 'aporte_mensual' | 'abono', destinoId?: string, tope?: number) => { exito: boolean; error?: string };
  onIrA: (seccion: 'plan' | 'sobres' | 'billetera') => void;
}

export const PantallaProInicio: React.FC<PantallaProInicioProps> = ({
  perfil,
  deudas,
  sobres,
  billeteras,
  movimientos,
  saldoTotal,
  onAbonarASobre,
  onIrA,
}) => {
  const hoy = new Date();
  const mesNombre = MESES_NOMBRE[hoy.getMonth()].toLowerCase();
  
  const fase = faseActual(deudas, sobres, perfil.gastosBasicos);
  const estado = estadoBaseCero(perfil, sobres, deudas);
  const metaFondo = metaFondoBlindado(perfil.gastosBasicos);
  const colchon = sobres.find(s => s.id === ID_SOBRE_COLCHON);
  const inversion = sobres.find(s => s.id === ID_SOBRE_INVERSION);
  const gustos = sobres.find(s => s.id === ID_LIBRE_GUSTOS);
  const colchonApartado = colchon ? colchon.apartado : 0;
  
  const reparto = repartoDelMes(estado.libre, sobres, metaFondo, hoy);
  const resumenAnio = resumenAnioPro(sobres, reparto, hoy);
  const paso = siguientePaso(estado, fase, sobres, reparto, hoy, metaFondo);

  const [accionAnimada, setAccionAnimada] = useState<{ monto: number; destino: string } | null>(null);

  const [modalMover, setModalMover] = useState<{ modo: 'abonar'; sobre: Sobre } | null>(null);

  // Lo mismo que muestra Sobres: presupuesto menos lo gastado este mes.
  const disponibleDe = (s: Sobre | undefined) =>
    s ? Math.max(0, (s.presupuestoMensual || 0) - gastadoDelMes(s, movimientos, hoy)) : 0;
  const mercado = sobres.find((s) => s.id === ID_BASICO_MERCADO);
  // Sin cuentas no hay de dónde mover: primero hay que registrar dónde está la plata.
  const sinCuentas = billeteras.length === 0;
  const textoCta = sinCuentas && paso.accionId !== 'plan' ? 'Primero agrega dónde tienes tu plata' : paso.cta;

  const handleCta = () => {
    if (paso.accionId === 'plan') {
      onIrA('plan');
    } else if (sinCuentas) {
      onIrA('billetera');
    } else if (paso.accionId === 'mover-fondo') {
      if (colchon) setModalMover({ modo: 'abonar', sobre: colchon });
    } else if (paso.accionId === 'mover-inversion') {
      if (inversion) setModalMover({ modo: 'abonar', sobre: inversion });
    }
  };

  const aporteDe = (s: Sobre) => (s.id === ID_SOBRE_COLCHON ? reparto.colchon : reparto.inversion);

  const handleConfirmarAbono = (monto: number, origenId: string, destinoId: string) => {
    if (!modalMover) return { exito: false };
    const { sobre } = modalMover;
    const res = onAbonarASobre(sobre.id, origenId, monto, 'aporte_mensual', destinoId, aporteDe(sobre));
    if (res.exito) {
      setAccionAnimada({ monto, destino: sobre.id === ID_SOBRE_COLCHON ? 'fondo blindado' : 'inversión' });
      setTimeout(() => setAccionAnimada(null), 3000);
    }
    return res;
  };

  /** Pendiente, a medias o completo: el aporte del mes se puede mover por partes. */
  const estadoAporte = (s: Sobre | undefined, aporte: number) => {
    const movido = s ? movidoEsteMes(s, hoy) : 0;
    if (movido <= 0) return 'Pendiente de mover';
    if (movido < aporte) return `Movido ${formatearCOP(movido)} de ${formatearCOP(aporte)}`;
    return `Movido el ${fechaAporteEsteMes(s!, hoy)?.getDate()} ✓`;
  };

  const deudasActivas = deudas.filter(d => d.saldo > 0);
  const saldoDeudas = deudasActivas.reduce((a, d) => a + d.saldo, 0);

  const renderMobile = () => (
    <div className="w-full pb-24 animate-screen-enter xl:hidden">
      <div className="pt-2">
        <RailPasos pasos={PASOS_SISTEMA} actual={fase} />
      </div>

      <div className="px-4 mt-6 flex flex-col gap-6">
        {estado.deudasActivas && (
          <div>
            <p className="text-[13px] font-bold text-[color:var(--texto)]">Primero, tus deudas.</p>
            <p className="text-[12px] text-[color:var(--texto-2)] mt-1 leading-relaxed">
              Tienes {deudasActivas.length} {deudasActivas.length === 1 ? 'deuda activa' : 'deudas activas'}: toda la plata del mes va al plan.
              El fondo empieza cuando la última llegue a $0. Mientras tanto, tus sobres y herramientas ya están abiertos.
            </p>
          </div>
        )}

        <div>
          <Rotulo>Lo que blindas e inviertes este año</Rotulo>
          <div className="mt-1">
            <span className="font-display font-extrabold text-[32px] text-[color:var(--texto)]">{formatearCOP(resumenAnio.progreso)}</span>
            <span className="text-[12.5px] text-[color:var(--texto-3)] ml-2">de {formatearCOP(resumenAnio.meta)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden mt-1.5 mb-2">
            <div className="h-full rounded-full bg-[#25C9BE] transition-all duration-500" style={{ width: `${resumenAnio.meta > 0 ? (resumenAnio.progreso / resumenAnio.meta) * 100 : 0}%` }} />
          </div>
          <div className="text-[12px] text-[color:var(--texto-2)]">
            {resumenAnio.progreso === 0 
              ? "Empieza con tu primer aporte" 
              : `${formatearCOP(reparto.colchon + reparto.inversion)} al mes · ${resumenAnio.mes} de 12 meses${paso.accionId === 'nada' ? ` · ${mesNombre} ya movido` : ''}`
            }
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--linea)] bg-[var(--superficie)] p-[18px]">
          <Rotulo>Tu siguiente paso</Rotulo>
          <div className="flex justify-between items-center mt-2 mb-4">
            <div>
              <div className="font-semibold text-[12.5px] text-[color:var(--texto)]">{paso.texto}</div>
              <div className="text-[10.5px] text-[color:var(--texto-3)] mt-0.5">{paso.detalle}</div>
            </div>
            {paso.accionId !== 'nada' && paso.accionId !== 'plan' && (
              <div className="text-[14px] font-bold text-[#25C9BE] tabular-nums">
                {formatearCOP(paso.accionId === 'mover-fondo' ? faltaMoverEsteMes(colchon, reparto.colchon, hoy) : faltaMoverEsteMes(inversion, reparto.inversion, hoy))}
              </div>
            )}
          </div>
          {paso.cta && (
            <button
              onClick={handleCta}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-[color:var(--on-acento)] bg-[color:var(--acento)] cursor-pointer"
            >
              {textoCta}
            </button>
          )}
          {accionAnimada && (
            <div className="mt-3 text-center text-[12px] font-bold text-[color:var(--positivo)] animate-fade-in">
              Listo: {formatearCOP(accionAnimada.monto)} apartados en tu {accionAnimada.destino}.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onIrA('sobres')} className="rounded-[13px] border border-[var(--linea)] bg-[var(--superficie)] px-[11px] py-2.5 text-left flex flex-col justify-between h-[64px]">
            <span className="text-[12.5px] font-bold text-[color:var(--texto)]">Sobres</span>
            <span className="text-[11px] font-semibold text-[#25C9BE] truncate">
              Mercado {formatearCOP(disponibleDe(mercado))} disp.
            </span>
          </button>
          <button onClick={() => onIrA('billetera')} className="rounded-[13px] border border-[var(--linea)] bg-[var(--superficie)] px-[11px] py-2.5 text-left flex flex-col justify-between h-[64px]">
            <span className="text-[12.5px] font-bold text-[color:var(--texto)]">Tu plata</span>
            <span className="text-[12px] text-[color:var(--texto-3)] tabular-nums truncate">{formatearCOP(saldoTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderDesktop = () => (
    <div className="hidden xl:flex xl:flex-col xl:flex-1 h-full animate-screen-enter">
      <div className="px-5 pt-3 pb-2 border-b border-[var(--linea)] bg-[var(--fondo)] z-10">
        <RailPasos pasos={PASOS_SISTEMA} actual={fase} />
      </div>
      
      <Marco columnas="340px minmax(0,1fr) 330px">
        <Columna ordenMovil={1} borde>
          <Zona plana>
            <Scroll className="px-5 py-4 space-y-8">
              <div>
                <Rotulo>Lo que blindas e inviertes este año</Rotulo>
                <div className="mt-1">
                  <span className="font-display font-extrabold text-[38px] text-[color:var(--texto)]">{formatearCOP(resumenAnio.progreso)}</span>
                  <span className="text-[12.5px] text-[color:var(--texto-3)] ml-2">de {formatearCOP(resumenAnio.meta)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden mt-2 mb-2">
                  <div className="h-full rounded-full bg-[#25C9BE] transition-all duration-500" style={{ width: `${resumenAnio.meta > 0 ? (resumenAnio.progreso / resumenAnio.meta) * 100 : 0}%` }} />
                </div>
                <div className="text-[12px] text-[color:var(--texto-2)]">
                  {resumenAnio.progreso === 0 
                    ? "Empieza con tu primer aporte" 
                    : `${formatearCOP(reparto.colchon + reparto.inversion)} al mes · ${resumenAnio.mes} de 12 meses${paso.accionId === 'nada' ? ` · ${mesNombre} ya movido` : ''}`
                  }
                </div>
              </div>

              <div>
                <Rotulo>Tus {formatearCOP(estado.libre)} de {mesNombre}</Rotulo>
                <div className="mt-3 flex flex-col border border-[var(--linea)] rounded-[14px] bg-[var(--superficie)] overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--hairline)]">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[color:var(--texto)]">Fondo blindado</span>
                      {colchonApartado < metaFondo && <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-[#25C9BE]/45 text-[#25C9BE]">Primero</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.colchon)}</div>
                      <div className="text-[10.5px] text-[color:var(--texto-3)] mt-0.5">
                        {estadoAporte(colchon, reparto.colchon)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--hairline)]">
                    <span className="text-[13px] font-semibold text-[color:var(--texto)]">Inversión</span>
                    <div className="text-right">
                      <div className="text-[13px] font-bold tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.inversion)}</div>
                      <div className="text-[10.5px] text-[color:var(--texto-3)] mt-0.5">
                        {estadoAporte(inversion, reparto.inversion)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-[13px] font-semibold text-[color:var(--texto)]">Gustos</span>
                    <div className="text-right">
                      <div className="text-[13px] font-bold tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.gustos)}</div>
                      <div className="text-[10.5px] text-[color:var(--texto-3)] mt-0.5">
                        {formatearCOP(Math.max(0, reparto.gustos - (gustos ? gastadoDelMes(gustos, movimientos, hoy) : 0)))} disponibles
                      </div>
                    </div>
                  </div>
                </div>

                {paso.cta && (
                  <button
                    onClick={handleCta}
                    className="w-full py-3 mt-4 rounded-xl text-[13px] font-bold text-[color:var(--on-acento)] bg-[color:var(--acento)] cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    {textoCta}
                  </button>
                )}
                {accionAnimada && (
                  <div className="mt-3 text-center text-[12px] font-bold text-[color:var(--positivo)] animate-fade-in">
                    Listo: {formatearCOP(accionAnimada.monto)} apartados en tu {accionAnimada.destino}.
                  </div>
                )}
              </div>
            </Scroll>
          </Zona>
        </Columna>

        <Columna ordenMovil={2} borde>
          <Zona plana>
            <Scroll className="px-5 py-4 space-y-8">
              <div>
                <Rotulo>Tu patrimonio, sin contar dos veces</Rotulo>
                <div className="mt-3 flex flex-col border border-[var(--linea)] rounded-[14px] bg-[var(--superficie)] overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--hairline)]">
                    <span className="text-[13px] text-[color:var(--texto-2)]">Billeteras (incluye tus sobres)</span>
                    <span className="text-[13px] font-semibold tabular-nums text-[color:var(--texto)]">{formatearCOP(saldoTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--hairline)]">
                    <span className="text-[13px] text-[color:var(--texto-2)]">Deudas</span>
                    <span className="text-[13px] font-semibold tabular-nums text-[color:var(--texto)]">{saldoDeudas > 0 ? `-${formatearCOP(saldoDeudas)}` : '$0'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-[13px] font-bold text-[color:var(--texto)]">Patrimonio neto</span>
                    <span className="text-[14px] font-bold tabular-nums text-[#25C9BE]">{formatearCOP(saldoTotal - saldoDeudas)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Rotulo>Sobres de lo básico</Rotulo>
                <div className="mt-3 flex flex-col border border-[var(--linea)] rounded-[14px] bg-[var(--superficie)] overflow-hidden">
                  {sobres.filter(s => s.grupo === 'basico').map((s, i, arr) => {
                    const pres = s.presupuestoMensual || 0;
                    const gast = gastadoDelMes(s, movimientos, hoy);
                    const pagado = s.id === 'basico-arriendo' && gast >= pres;
                    return (
                      <div key={s.id} className={`px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[var(--hairline)]' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[13px] font-semibold text-[color:var(--texto)]">{s.nombre}</span>
                          {pagado ? (
                            <span className="text-[12px] font-bold text-[color:var(--positivo)]">✓ Pagado</span>
                          ) : (
                            <span className="text-[13px] font-bold tabular-nums text-[color:var(--texto)]">{formatearCOP(Math.max(0, pres - gast))} disp.</span>
                          )}
                        </div>
                        <div className="h-[4px] rounded-full bg-[var(--superficie-2)] overflow-hidden">
                          <div className="h-full rounded-full bg-[color:var(--texto-3)]" style={{ width: `${pres > 0 ? Math.min(100, (gast / pres) * 100) : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Scroll>
          </Zona>
        </Columna>

        <Columna ordenMovil={3}>
          <Zona plana>
            <Scroll className="px-5 py-4">
              <Rotulo>Herramientas</Rotulo>
              <div className="mt-3 flex flex-col gap-2">
                <button onClick={() => onIrA('sobres')} className="flex items-center justify-between px-4 py-3.5 rounded-[13px] border border-[var(--linea)] bg-[var(--superficie)] cursor-pointer hover:border-[color:var(--texto-3)] transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-[color:var(--texto)]">Sobres</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#25C9BE] group-hover:text-[color:var(--texto)] transition-colors tabular-nums">Mercado {formatearCOP(disponibleDe(mercado))} disp.</span>
                </button>
                
                <button onClick={() => onIrA('billetera')} className="flex items-center justify-between px-4 py-3.5 rounded-[13px] border border-[var(--linea)] bg-[var(--superficie)] cursor-pointer hover:border-[color:var(--texto-3)] transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-[color:var(--texto)]">Tu plata</span>
                  </div>
                  <span className="text-[12px] text-[color:var(--texto-3)] tabular-nums">{formatearCOP(saldoTotal)}</span>
                </button>

                <button className="flex items-center justify-between px-4 py-3.5 rounded-[13px] border border-[var(--linea)] bg-[var(--superficie)] cursor-not-allowed opacity-60 text-left">
                  <span className="text-[13px] font-bold text-[color:var(--texto)]">Más herramientas</span>
                  <ChevronRight className="w-4 h-4 text-[color:var(--texto-3)]" />
                </button>
              </div>
            </Scroll>
          </Zona>
        </Columna>
      </Marco>
    </div>
  );

  return (
    <>
      {renderMobile()}
      {renderDesktop()}

      {modalMover && (
        <ModalMoverSobre
          modo={modalMover.modo}
          sobre={modalMover.sobre}
          billeteras={billeteras}
          sobres={sobres}
          montoSugerido={faltaMoverEsteMes(modalMover.sobre, aporteDe(modalMover.sobre), hoy)}
          origen="aporte_mensual"
          onCerrar={() => setModalMover(null)}
          onConfirmar={handleConfirmarAbono}
        />
      )}
    </>
  );
};
