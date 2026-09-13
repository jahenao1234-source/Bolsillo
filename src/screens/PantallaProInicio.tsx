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
  gastosDelMes,
  serieGastoDelMes,
  gastoPorCategoriaDelMes,
  fechaAporteEsteMes,
  Fase,
} from '../logic/sistema';

import { GraficoGastoMes } from '../components/sistema/GraficoGastoMes';
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

  const renderDesktop = () => {
    const PANEL = "rounded-[14px] border border-[var(--linea)] bg-[var(--superficie)] px-5 py-[18px] flex flex-col min-w-0";
    const TITULO = "text-[11.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--texto-2)]";

    const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const techo = perfil.gastosBasicos;
    const serie = serieGastoDelMes(movimientos, hoy);
    
    // PANEL 1
    const gastadoMesTotal = serie.length > 0 ? serie[serie.length - 1].acumulado : 0;
    const diaHoy = hoy.getDate();
    const pctGastado = techo > 0 ? (gastadoMesTotal / techo) * 100 : 0;
    const vasBien = pctGastado <= (diaHoy / diasDelMes * 100);

    // PANEL 2
    const circ = 289.03;
    const pctBasico = estado.ingreso > 0 ? (perfil.gastosBasicos / estado.ingreso) : 0;
    const dashBasico = pctBasico * circ;
    
    // PANEL 3
    const topCategorias = gastoPorCategoriaDelMes(movimientos, hoy, 5);
    const colores = ['var(--azul)', 'var(--positivo)', 'var(--alerta)', 'var(--acento)', 'var(--texto-3)'];

    return (
      <div className="hidden xl:grid xl:flex-1 gap-4 grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,0.95fr)] grid-rows-[auto_1fr] animate-screen-enter pb-4">
        {/* PANEL 1: GASTADO EN MES */}
        <div className={PANEL}>
          <div className={TITULO}>GASTADO EN {mesNombre}</div>
          <div className="mt-4 flex-1 min-h-0">
            <GraficoGastoMes serie={serie} techo={techo} diasDelMes={diasDelMes} mes={mesNombre} />
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div className="flex items-baseline">
              <span className="font-display font-extrabold text-[34px] tabular-nums text-[color:var(--texto)] leading-none">
                {formatearCOP(gastadoMesTotal)}
              </span>
              <span className="text-[17px] text-[color:var(--texto-3)] ml-2">de {formatearCOP(techo)}</span>
            </div>
            <div className="text-[13px] text-[color:var(--texto-2)] mb-1">
              <span className="font-medium text-[color:var(--texto)]">{pctGastado.toFixed(1).replace('.', ',')}% del mes</span>
              <span className={vasBien ? "text-[color:var(--texto-2)]" : "text-[color:var(--alerta)]"}>
                {vasBien ? ' · vas bien' : ' · vas rápido'}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: TU MES CON DUEÑO */}
        <div className={PANEL}>
          <div className={TITULO}>TU MES CON DUEÑO</div>
          <div className="mt-6 flex items-center justify-between">
            <div className="relative w-[150px] h-[150px] flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--superficie-2)" strokeWidth="16" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--neutro)" strokeWidth="16" strokeDasharray={`${dashBasico} ${circ}`} strokeDashoffset="0" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--acento)" strokeWidth="16" strokeDasharray={`${circ - dashBasico} ${circ}`} strokeDashoffset={-dashBasico} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="text-[19px] font-extrabold text-[color:var(--texto)]">{formatearCOP(Math.max(0, estado.porAsignar))}</span>
                <span className="text-[9.5px] text-[color:var(--texto-2)] mt-0.5">sin dueño</span>
              </div>
            </div>
            
            <div className="flex-1 ml-6 space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[13px] font-bold text-[color:var(--texto)]">Lo básico</span>
                  <span className="text-[13px] font-bold text-[color:var(--texto)]">{formatearCOP(perfil.gastosBasicos)}</span>
                </div>
                <div className="h-[7px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--neutro)]" style={{ width: `${pctBasico * 100}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-[13px] font-bold text-[color:var(--texto)]">{estado.deudasActivas ? 'A tus deudas' : 'Lo libre'}</span>
                  <span className="text-[13px] font-bold text-[color:var(--texto)]">{formatearCOP(estado.deudasActivas ? estado.paraDeudas : estado.libre)}</span>
                </div>
                <div className="h-[7px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--acento)]" style={{ width: `${(1 - pctBasico) * 100}%` }} />
                </div>
              </div>

              <div className="pt-2 text-[13px] text-[color:var(--texto-2)] text-right">
                {formatearCOP(estado.ingreso)} de ingreso
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: EN QUÉ SE FUE */}
        <div className={`${PANEL} row-span-2`}>
          <div className={TITULO}>EN QUÉ SE FUE</div>
          <div className="mt-4 space-y-4">
            {topCategorias.length === 0 ? (
              <div className="text-[13px] text-[color:var(--texto-3)]">Todavía no hay gastos este mes</div>
            ) : (
              topCategorias.map((c, i) => (
                <div key={c.categoria}>
                  <div className="flex justify-between text-[14px] mb-1.5">
                    <span className="text-[color:var(--texto)]">{c.categoria}</span>
                    <span className="font-bold text-[color:var(--texto)]">{formatearCOP(c.monto)}</span>
                  </div>
                  <div className="h-[7px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${c.porcentaje}%`, backgroundColor: colores[i] }} />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-auto pt-4 border-t border-[var(--hairline)] flex flex-col items-start gap-2.5">
            <div className={TITULO}>TU SIGUIENTE PASO</div>
            <div className="px-2 py-0.5 rounded-full border border-[var(--linea)] text-[11px] font-bold text-[color:var(--texto)] bg-[var(--superficie)]">
              {fase === 'salir' ? 'Salir de deudas' : fase === 'blindar' ? 'Blindar' : 'Crecer'}
            </div>
            <div>
              <div className="text-[15px] font-bold text-[color:var(--texto)]">{paso.texto}</div>
              <div className="text-[13px] text-[color:var(--texto-2)]">{paso.detalle}</div>
            </div>
            
            {fase !== 'salir' && (
              <div className="text-[12.5px] text-[color:var(--texto-3)] leading-relaxed mt-1 w-full">
                <div>Fondo blindado · {estadoAporte(colchon, reparto.colchon)}</div>
                <div>Inversión · {estadoAporte(inversion, reparto.inversion)}</div>
              </div>
            )}
            
            {paso.cta && (
              <button
                onClick={handleCta}
                className="w-full mt-2 rounded-[10px] py-2.5 text-[14px] font-bold text-[color:var(--on-boton-principal)] bg-[color:var(--boton-principal)] cursor-pointer hover:opacity-90 transition-opacity"
              >
                {textoCta}
              </button>
            )}
            {accionAnimada && (
              <div className="w-full text-center text-[12px] font-bold text-[color:var(--positivo)] animate-fade-in mt-2">
                Listo: {formatearCOP(accionAnimada.monto)} apartados en tu {accionAnimada.destino}.
              </div>
            )}
          </div>
        </div>

        {/* Fila 2 columnas 1 y 2 vacías para V5 */}
        <div className="col-span-2" />
      </div>
    );
  };

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
