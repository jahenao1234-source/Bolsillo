import React, { useEffect, useState } from 'react';
import { Target, Check, ChevronRight } from 'lucide-react';
import { RailPasos, Rotulo, PASOS_SISTEMA } from '../components/sistema/RailPasos';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE, MESES_ABREV } from '../utils/fechas';
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
  COLOR_SOBRE_SISTEMA,
  escaleraAtaque,
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
  disponibleMensual: number;
  onAbonarASobre: (sobreId: string, origenId: string, monto: number, origen?: 'aporte_mensual' | 'abono', destinoId?: string, tope?: number) => { exito: boolean; error?: string };
  onIrA: (seccion: 'plan' | 'sobres' | 'billetera' | 'deudas') => void;
}

export const PantallaProInicio: React.FC<PantallaProInicioProps> = ({
  perfil,
  deudas,
  sobres,
  billeteras,
  movimientos,
  saldoTotal,
  disponibleMensual,
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

  const renderMobile = () => {
    const PANEL = "rounded-[14px] border border-[var(--linea)] bg-[var(--superficie)] flex flex-col min-w-0";
    const TITULO = "text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--texto-2)]";

    const diasDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const techo = perfil.gastosBasicos;
    const serie = serieGastoDelMes(movimientos, hoy);
    const gastadoMesTotal = serie.length > 0 ? serie[serie.length - 1].acumulado : 0;
    const pctGastado = techo > 0 ? (gastadoMesTotal / techo) * 100 : 0;

    // Cuatro sobres como máximo para que Inicio quepa en una pantalla. Con deudas,
    // Gustos no tiene presupuesto y no se muestra.
    const idsSobres = ['basico-mercado', 'basico-servicios', 'basico-transporte', ...(estado.deudasActivas ? ['basico-arriendo'] : [ID_LIBRE_GUSTOS])];
    const sobresInicio = idsSobres.map((id) => sobres.find((x) => x.id === id)).filter(Boolean) as Sobre[];

    return (
      // El padding lateral y el espacio de la barra de abajo ya los pone App.
      // En tableta (md) los paneles van en dos columnas para no estirarse.
      <div className="w-full animate-screen-enter xl:hidden grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* GASTADO EN {MES} */}
        <div className={`${PANEL} px-3.5 py-3 md:col-span-2`}>
          <div className="flex justify-between items-center gap-3 mb-2">
            <div className={TITULO}>GASTADO EN {mesNombre}</div>
            <div className="text-[11.5px] text-[color:var(--texto-2)] font-medium tabular-nums whitespace-nowrap">{pctGastado.toFixed(1).replace('.', ',')}%</div>
          </div>
          <GraficoGastoMes serie={serie} techo={techo} diasDelMes={diasDelMes} mes={mesNombre} compacto={true} />
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display font-extrabold text-[24px] tabular-nums text-[color:var(--texto)] leading-none">
              {formatearCOP(gastadoMesTotal)}
            </span>
            <span className="text-[12.5px] text-[color:var(--texto-3)] whitespace-nowrap">de {formatearCOP(techo)}</span>
          </div>
        </div>

        {/* MI PLATA y SIN DUEÑO */}
        <div className="grid grid-cols-2 gap-2.5 md:col-span-2">
          <button onClick={() => onIrA('billetera')} className={`${PANEL} px-3.5 py-3 text-left hover:border-[color:var(--texto-3)] transition-colors cursor-pointer`}>
            <div className={TITULO}>MI PLATA</div>
            <div className="mt-1.5 font-display font-extrabold text-[18px] tabular-nums text-[color:var(--texto)] truncate">{formatearCOP(saldoTotal)}</div>
            <div className="text-[11.5px] text-[color:var(--texto-2)]">{billeteras.length} {billeteras.length === 1 ? 'cuenta' : 'cuentas'}</div>
          </button>
          <div className={`${PANEL} px-3.5 py-3`}>
            <div className={TITULO}>SIN DUEÑO</div>
            <div className="mt-1.5 font-display font-extrabold text-[18px] tabular-nums text-[color:var(--texto)] truncate">{formatearCOP(Math.max(0, estado.porAsignar))}</div>
            <div className="text-[11.5px] text-[color:var(--texto-2)] truncate">de {formatearCOP(estado.ingreso)}</div>
          </div>
        </div>

        {/* TUS DEUDAS o TUS SOBRES */}
        <div className={`${PANEL} px-3.5 py-3`}>
          {estado.deudasActivas ? (
            <>
              <div className="flex justify-between items-center mb-2.5">
                <div className={TITULO}>TUS DEUDAS</div>
                <button onClick={() => onIrA('deudas')} className="text-[12.5px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] font-medium cursor-pointer">Ver todas →</button>
              </div>
              <div className="flex flex-col gap-2.5">
                {escaleraAtaque(deudas, disponibleMensual).slice(0, 3).map((escalon, index) => {
                  const d = deudas.find(x => x.id === escalon.deudaId);
                  if (!d) return null;
                  const mo = d.montoOriginal || 0;
                  const pct = mo > 0 ? ((mo - d.saldo) / mo) * 100 : 0;
                  return (
                    <div key={d.id}>
                      <div className="flex justify-between items-baseline gap-3 mb-1">
                        <span className="text-[13px] text-[color:var(--texto)] font-medium truncate min-w-0">
                          {d.nombre}
                          {index === 0 && <span className="ml-1.5 px-1.5 py-px rounded-full border border-[var(--acento)]/35 text-[color:var(--acento)] text-[10.5px] font-bold">Ataque</span>}
                        </span>
                        <span className="text-[12.5px] font-bold text-[color:var(--texto)] tabular-nums whitespace-nowrap">{formatearCOP(d.saldo)}</span>
                      </div>
                      <div className="h-[6px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--acento)]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                      </div>
                      <div className="text-[12px] text-[color:var(--texto-3)] mt-1">Sale en {escalon.hasta}</div>
                    </div>
                  );
                })}
                {deudas.filter(d => d.saldo > 0).length > 3 && (
                  <div className="text-[12px] text-[color:var(--texto-3)]">y {deudas.filter(d => d.saldo > 0).length - 3} más</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2.5">
                <div className={TITULO}>TUS SOBRES</div>
                <button onClick={() => onIrA('sobres')} className="text-[12.5px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] font-medium cursor-pointer">Ver todos →</button>
              </div>
              <div className="flex flex-col gap-2.5">
                {sobresInicio.map((sObj) => {
                  const pres = sObj.presupuestoMensual || 0;
                  const gast = gastadoDelMes(sObj, movimientos, hoy);
                  const disp = Math.max(0, pres - gast);
                  const pct = pres > 0 ? Math.round((gast / pres) * 100) : 0;
                  const color = COLOR_SOBRE_SISTEMA[sObj.id] || sObj.color || '#25C9BE';
                  return (
                    <div key={sObj.id}>
                      <div className="flex justify-between items-baseline gap-3 mb-1">
                        <span className="text-[13px] text-[color:var(--texto)] font-medium truncate">{sObj.nombre}</span>
                        <span className="text-[12.5px] font-bold text-[color:var(--texto)] tabular-nums whitespace-nowrap">{formatearCOP(disp)}</span>
                      </div>
                      <div className="h-[6px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* TU SIGUIENTE PASO: la fase va en el chip, al lado del título */}
        <div className={`${PANEL} px-3.5 py-3`}>
          <div className="flex justify-between items-center gap-3">
            <div className={TITULO}>TU SIGUIENTE PASO</div>
            <div className="px-2 py-0.5 rounded-full border border-[var(--linea)] text-[10.5px] font-bold text-[color:var(--texto)] whitespace-nowrap">
              {fase === 'salir' ? 'Salir de deudas' : fase === 'blindar' ? 'Blindar' : 'Crecer'}
            </div>
          </div>
          <div className="mt-2 text-[14px] font-bold text-[color:var(--texto)] leading-snug">{paso.texto}</div>
          <div className="text-[12px] text-[color:var(--texto-2)]">{paso.detalle}</div>
          {paso.cta && (
            <button
              onClick={handleCta}
              className="w-full mt-2.5 md:mt-auto rounded-[10px] py-2.5 text-[13px] font-bold text-[color:var(--on-boton-principal)] bg-[color:var(--boton-principal)] cursor-pointer hover:opacity-90 transition-opacity"
            >
              {textoCta}
            </button>
          )}
          {accionAnimada && (
            <div className="w-full text-center text-[12px] font-bold text-[color:var(--positivo)] animate-fade-in mt-1.5">
              Listo: {formatearCOP(accionAnimada.monto)} apartados en tu {accionAnimada.destino}.
            </div>
          )}
        </div>
      </div>
    );
  };

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
      <div className="hidden xl:grid xl:flex-1 gap-4 grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,0.95fr)] grid-rows-[minmax(0,1fr)_auto] animate-screen-enter pb-4">
        {/* PANEL 1: GASTADO EN MES. Los tamaños siguen el ancho del panel (cqw), no el de la pantalla. */}
        <div className={`${PANEL} @container`}>
          <div className={TITULO}>GASTADO EN {mesNombre}</div>
          <div className="mt-5 flex-1 min-h-[96px]">
            <GraficoGastoMes serie={serie} techo={techo} diasDelMes={diasDelMes} mes={mesNombre} />
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
              <span className="font-display font-extrabold text-[clamp(24px,7cqw,34px)] tabular-nums text-[color:var(--texto)] leading-none">
                {formatearCOP(gastadoMesTotal)}
              </span>
              <span className="text-[clamp(13px,3cqw,16px)] text-[color:var(--texto-3)] whitespace-nowrap">de {formatearCOP(techo)}</span>
            </div>
            <div className="text-[13px] text-[color:var(--texto-2)] whitespace-nowrap">
              <span className="font-medium text-[color:var(--texto)]">{pctGastado.toFixed(1).replace('.', ',')}% del mes</span>
              <span className={vasBien ? "text-[color:var(--texto-2)]" : "text-[color:var(--alerta)]"}>
                {vasBien ? ' · vas bien' : ' · vas rápido'}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: TU MES CON DUEÑO */}
        <div className={`${PANEL} @container`}>
          <div className={TITULO}>TU MES CON DUEÑO</div>
          {/* La dona se achica con el panel; la leyenda pone la etiqueta arriba y la cifra abajo para no pelear por el ancho. */}
          <div className="mt-5 flex-1 flex items-center gap-[clamp(12px,5cqw,24px)]">
            <div className="relative w-[clamp(88px,36cqw,150px)] aspect-square flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--superficie-2)" strokeWidth="16" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--neutro)" strokeWidth="16" strokeDasharray={`${dashBasico} ${circ}`} strokeDashoffset="0" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="var(--acento)" strokeWidth="16" strokeDasharray={`${circ - dashBasico} ${circ}`} strokeDashoffset={-dashBasico} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-extrabold text-[clamp(14px,5.5cqw,19px)] tabular-nums text-[color:var(--texto)] leading-none">{formatearCOP(Math.max(0, estado.porAsignar))}</span>
                <span className="text-[clamp(9px,2.6cqw,10.5px)] text-[color:var(--texto-2)] mt-1">sin dueño</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {[
                { etiqueta: 'Lo básico', monto: perfil.gastosBasicos, pct: pctBasico, color: 'var(--neutro)' },
                {
                  etiqueta: estado.deudasActivas ? 'A tus deudas' : 'Lo libre',
                  monto: estado.deudasActivas ? estado.paraDeudas : estado.libre,
                  pct: 1 - pctBasico,
                  color: 'var(--acento)',
                },
              ].map((f) => (
                <div key={f.etiqueta} className="min-w-0">
                  <div className="text-[12.5px] text-[color:var(--texto-2)] truncate">{f.etiqueta}</div>
                  <div className="text-[clamp(13px,4cqw,15px)] font-bold tabular-nums text-[color:var(--texto)] truncate">{formatearCOP(f.monto)}</div>
                  <div className="mt-1.5 h-[6px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, f.pct)) * 100}%`, backgroundColor: f.color }} />
                  </div>
                </div>
              ))}
              <div className="text-[12px] text-[color:var(--texto-3)] truncate">
                Ingreso <span className="tabular-nums text-[color:var(--texto-2)]">{formatearCOP(estado.ingreso)}</span>
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
                  <div className="flex justify-between gap-3 text-[14px] mb-1.5">
                    <span className="text-[color:var(--texto)] truncate min-w-0">{c.categoria}</span>
                    <span className="font-bold tabular-nums text-[color:var(--texto)] whitespace-nowrap">{formatearCOP(c.monto)}</span>
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

        {/* Fila 2: TUS SOBRES y ÚLTIMOS MOVIMIENTOS */}
        <div className="col-span-2 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 min-h-0">
          {/* PANEL TUS SOBRES o TUS DEUDAS */}
          <div className={PANEL}>
            {estado.deudasActivas ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className={TITULO}>TUS DEUDAS</div>
                  <button onClick={() => onIrA('deudas')} className="text-[13px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] font-medium cursor-pointer">Ver todas →</button>
                </div>
                <div className="space-y-[13px]">
                  {escaleraAtaque(deudas, disponibleMensual).map((escalon, index) => {
                    const d = deudas.find(x => x.id === escalon.deudaId);
                    if (!d) return null;
                    const mo = d.montoOriginal || 0;
                    const pct = mo > 0 ? ((mo - d.saldo) / mo) * 100 : 0;
                    return (
                      <div key={d.id}>
                        <div className="flex justify-between items-baseline gap-3 mb-1.5">
                          <div className="text-[13px] text-[color:var(--texto)] font-medium truncate min-w-0">
                            {d.nombre}
                            {index === 0 && <span className="ml-1.5 px-1.5 py-px rounded-full border border-[var(--acento)]/35 text-[color:var(--acento)] text-[10.5px] font-bold">Ataque</span>}
                          </div>
                          <div className="text-[13px] font-bold tabular-nums text-[color:var(--texto)] whitespace-nowrap">{formatearCOP(d.saldo)}</div>
                        </div>
                        <div className="h-[7px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--acento)]" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                        </div>
                        <div className="text-[12px] text-[color:var(--texto-3)] mt-1">Sale en {escalon.hasta}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className={TITULO}>TUS SOBRES</div>
                  <button onClick={() => onIrA('sobres')} className="text-[13px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] font-medium cursor-pointer">Ver todos →</button>
                </div>
                <div className="space-y-[13px]">
                  {/* Con deudas, Gustos no tiene presupuesto: no se muestra en $0. */}
                  {[...sobres.filter(s => s.grupo === 'basico'), gustos].filter(Boolean).map((s) => {
                    const sObj = s as Sobre;
                    const pres = sObj.presupuestoMensual || 0;
                    const gast = gastadoDelMes(sObj, movimientos, hoy);
                    const disp = Math.max(0, pres - gast);
                    const pct = pres > 0 ? Math.round((gast / pres) * 100) : 0;
                    const color = COLOR_SOBRE_SISTEMA[sObj.id] || sObj.color || '#25C9BE';
                    return (
                      <div key={sObj.id}>
                        <div className="flex justify-between items-baseline gap-3 mb-1.5">
                          <div className="text-[13px] text-[color:var(--texto-2)] truncate min-w-0">
                            <span className="text-[color:var(--texto)] font-medium">{sObj.nombre}</span>
                            <span className="tabular-nums"> · {formatearCOP(disp)} disp.</span>
                          </div>
                          <div className="text-[13px] font-bold tabular-nums text-[color:var(--texto)] whitespace-nowrap">{pct}%</div>
                        </div>
                        <div className="h-[7px] bg-[var(--superficie-2)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* PANEL ÚLTIMOS MOVIMIENTOS */}
          <div className={`${PANEL} @container`}>
            <div className="flex justify-between items-center mb-4">
              <div className={TITULO}>ÚLTIMOS MOVIMIENTOS</div>
              <button onClick={() => onIrA('billetera')} className="text-[13px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] font-medium cursor-pointer">Ver todos →</button>
            </div>
            {/* Nunca scroll horizontal: si el panel es angosto se quitan columnas: primero Cuenta, luego Fecha. */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr>
                    <th className="pb-2 pr-2.5 border-b border-[var(--linea)] text-[12px] font-semibold text-[color:var(--texto-2)]">Concepto</th>
                    <th className="hidden @min-[36rem]:table-cell w-[26%] pb-2 px-2.5 border-b border-[var(--linea)] text-[12px] font-semibold text-[color:var(--texto-2)]">Cuenta</th>
                    <th className="w-[118px] pb-2 px-2.5 border-b border-[var(--linea)] text-[12px] font-semibold text-[color:var(--texto-2)]">Tipo</th>
                    <th className="hidden @min-[25rem]:table-cell w-[68px] pb-2 px-2.5 border-b border-[var(--linea)] text-[12px] font-semibold text-[color:var(--texto-2)]">Fecha</th>
                    <th className="w-[104px] pb-2 pl-2.5 border-b border-[var(--linea)] text-[12px] font-semibold text-[color:var(--texto-2)] text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {[...movimientos]
                    .sort((a, b) => new Date(b.creadoEn as string).getTime() - new Date(a.creadoEn as string).getTime())
                    .slice(0, 4)
                    .map((m) => {
                      const fechaObj = new Date(m.creadoEn as string);
                      const dia = fechaObj.getDate();
                      const mes = MESES_ABREV[fechaObj.getMonth()];
                      
                      let cuentaStr = m.billeteraNombre || 'Cuenta';
                      if (m.tipo === 'transferencia' && m.billeteraDestinoId) {
                        const bDest = billeteras.find(b => b.id === m.billeteraDestinoId);
                        if (bDest) {
                          cuentaStr = `${cuentaStr} → ${bDest.nombre}`;
                        }
                      }
                      
                      const esDeuda = m.tipo === 'pago_deuda' || m.deudaId || m.categoria === 'Deudas';
                      let tipoEstilo = '';
                      let tipoTexto = '';
                      if (esDeuda) {
                        tipoEstilo = 'bg-[var(--superficie-2)] text-[color:var(--texto-2)]';
                        tipoTexto = 'Deuda';
                      } else if (m.tipo === 'ingreso') {
                        tipoEstilo = 'bg-[color:var(--positivo)]/12 text-[color:var(--positivo)]';
                        tipoTexto = 'Ingreso';
                      } else if (m.tipo === 'transferencia') {
                        tipoEstilo = 'bg-[color:var(--azul)]/12 text-[color:var(--azul)]';
                        tipoTexto = 'Transferencia';
                      } else {
                        tipoEstilo = 'bg-[color:var(--alerta)]/12 text-[color:var(--alerta)]';
                        tipoTexto = 'Gasto';
                      }

                      const desc = m.descripcion || m.nota || m.categoria || '';
                      const inicial = desc ? desc.charAt(0).toUpperCase() : '?';

                      let montoStr = '';
                      if (m.tipo === 'transferencia') {
                        montoStr = formatearCOP(m.monto);
                      } else if (m.tipo === 'ingreso') {
                        montoStr = `+${formatearCOP(m.monto)}`;
                      } else {
                        montoStr = `−${formatearCOP(m.monto)}`;
                      }

                      return (
                        <tr key={m.id}>
                          <td className="py-2.5 pr-2.5 border-b border-[var(--hairline)]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-[26px] h-[26px] rounded-full bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-[color:var(--texto-2)]">{inicial}</span>
                              </div>
                              <span className="text-[14px] text-[color:var(--texto)] truncate" title={desc}>{desc}</span>
                            </div>
                          </td>
                          <td className="hidden @min-[36rem]:table-cell py-2.5 px-2.5 border-b border-[var(--hairline)]">
                            <span className="block text-[14px] text-[color:var(--texto)] truncate" title={cuentaStr}>{cuentaStr}</span>
                          </td>
                          <td className="py-2.5 px-2.5 border-b border-[var(--hairline)] whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold ${tipoEstilo}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {tipoTexto === 'Transferencia' ? 'Traslado' : tipoTexto}
                            </div>
                          </td>
                          <td className="hidden @min-[25rem]:table-cell py-2.5 px-2.5 border-b border-[var(--hairline)] whitespace-nowrap">
                            <span className="text-[14px] tabular-nums text-[color:var(--texto)]">{dia} {mes}</span>
                          </td>
                          <td className="py-2.5 pl-2.5 border-b border-[var(--hairline)] whitespace-nowrap text-right">
                            <span className="text-[14px] tabular-nums text-[color:var(--texto)]">{montoStr}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
