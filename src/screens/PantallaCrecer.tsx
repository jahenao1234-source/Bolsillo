import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Mail,
  Trophy,
  Flame,
  Repeat,
  CreditCard,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Presupuesto, Sobre, RetoAhorro, Suscripcion, TarjetaCredito, Billetera, Movimiento, Deuda } from '../types';
import { Chip } from '../components/ui/Chip';
import { TarjetaModulo } from '../components/ui/TarjetaModulo';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { getContextoMes } from '../logic/resumenMes';
import { calcularHallazgos, historial } from '../logic/reportes';
import { cicloDe, montoVigente } from '../logic/suscripciones';
import { mejorTarjetaHoy, cupoDeTarjeta, deudaDeTarjeta } from '../logic/tarjetas';
import { formatearCOP } from '../utils/format';
import { PantallaPresupuesto } from './PantallaPresupuesto';
import { PantallaSobres } from './PantallaSobres';
import { PantallaRetos } from './PantallaRetos';
import { PantallaSuscripciones } from './PantallaSuscripciones';
import { PantallaTarjetas } from './PantallaTarjetas';
import { PantallaReportes } from './PantallaReportes';

interface PantallaCrecerProps {
  resetToken?: number;
  usuario: string;
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  ingresoMensual: number;
  billeteras: Billetera[];
  onGuardarPresupuesto: (p: Presupuesto) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  onRegistrarMovimiento: (mov: Omit<Movimiento, 'id'>) => void;
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  retos: RetoAhorro[];
  onGuardarReto: (reto: RetoAhorro) => void;
  onEliminarReto: (id: string) => void;
  onAportarReto: (id: string) => { exito: boolean; aporte: number; completado: boolean; acumulado: number };
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  tarjetas: TarjetaCredito[];
  deudas: Deuda[];
  onAbonarDeuda: (deudaId: string, billeteraId: string, monto: number) => { exito: boolean; deudaSaldada: boolean };
  movimientos: Movimiento[];
  disponibleMensual: number;
  onGuardarTarjeta: (tc: TarjetaCredito) => void;
  onEliminarTarjeta: (id: string) => void;
}

type Modulo = 'hub' | 'presupuesto' | 'sobres' | 'retos' | 'suscripciones' | 'tarjetas' | 'reportes';

export const PantallaCrecer: React.FC<PantallaCrecerProps> = (props) => {
  const {
    usuario,
    presupuestos,
    gastoPorCategoria,
    ingresoMensual,
    billeteras,
    onGuardarPresupuesto,
    onEliminarPresupuesto,
    onRegistrarMovimiento,
    sobres,
    totalApartado,
    saldoTotal,
    onGuardarSobre,
    onEliminarSobre,
    retos,
    onGuardarReto,
    onEliminarReto,
    onAportarReto,
    suscripciones,
    sangradoMensual,
    onGuardarSuscripcion,
    onEliminarSuscripcion,
    tarjetas,
    onGuardarTarjeta,
    onEliminarTarjeta,
  } = props;

  const cajonEmpuja = useCajonEmpuja();
  const [modulo, setModulo] = useState<Modulo>('hub');

  // Al re-seleccionar "Crecer" en la nav, vuelve al hub.
  useEffect(() => {
    setModulo('hub');
  }, [props.resetToken]);

  const resumenPresupuesto = useMemo(() => {
    const totalTope = presupuestos.reduce((s, p) => s + p.tope, 0);
    const totalGastado = presupuestos.reduce((s, p) => s + (gastoPorCategoria[p.categoria] || 0), 0);
    const pct = totalTope > 0 ? Math.round((totalGastado / totalTope) * 100) : 0;
    return { totalTope, totalGastado, pct, n: presupuestos.length };
  }, [presupuestos, gastoPorCategoria]);

  const resumenRetos = useMemo(() => {
    const activos = retos.filter((r) => !r.completado).length;
    const acumulado = retos.reduce((s, r) => s + r.acumulado, 0);
    const mejorRacha = retos.reduce((m, r) => Math.max(m, r.racha), 0);
    return { activos, acumulado, mejorRacha };
  }, [retos]);

  if (modulo === 'presupuesto') {
    return (
      <PantallaPresupuesto
        presupuestos={presupuestos}
        gastoPorCategoria={gastoPorCategoria}
        ingresoMensual={ingresoMensual}
        billeteras={billeteras}
        onGuardarPresupuesto={onGuardarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onRegistrarMovimiento={onRegistrarMovimiento}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'sobres') {
    return (
      <PantallaSobres
        sobres={sobres}
        totalApartado={totalApartado}
        saldoTotal={saldoTotal}
        onGuardarSobre={onGuardarSobre}
        onEliminarSobre={onEliminarSobre}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'retos') {
    return (
      <PantallaRetos
        retos={retos}
        ingresoMensual={ingresoMensual}
        onGuardarReto={onGuardarReto}
        onEliminarReto={onEliminarReto}
        onAportarReto={onAportarReto}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'suscripciones') {
    return (
      <PantallaSuscripciones
        suscripciones={suscripciones}
        sangradoMensual={sangradoMensual}
        billeteras={billeteras}
        ingresoMensual={ingresoMensual}
        onGuardarSuscripcion={onGuardarSuscripcion}
        onEliminarSuscripcion={onEliminarSuscripcion}
        onRegistrarMovimiento={onRegistrarMovimiento}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'tarjetas') {
    return (
      <PantallaTarjetas
        tarjetas={tarjetas}
        deudas={props.deudas}
        billeteras={billeteras}
        onAbonarDeuda={props.onAbonarDeuda}
        onGuardarTarjeta={onGuardarTarjeta}
        onEliminarTarjeta={onEliminarTarjeta}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'reportes') {
    return (
      <PantallaReportes
        movimientos={props.movimientos}
        deudas={props.deudas}
        retos={retos}
        suscripciones={suscripciones}
        disponibleMensual={props.disponibleMensual}
        usuario={usuario}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  // ------------------------------------------------------------------
  // El tablero de Pro. Cada módulo trae su cifra, su forma y lo que toca
  // hacer ahora: seis tarjetas iguales y mudas eran un menú disfrazado.
  // ------------------------------------------------------------------
  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const contexto = useMemo(() => getContextoMes(), []);

  /** El tope que va a reventar primero: el que más porcentaje lleva. */
  const topeApretado = useMemo(() => {
    const conUso = presupuestos
      .map((p) => ({
        categoria: p.categoria,
        tope: p.tope,
        gastado: gastoPorCategoria[p.categoria] || 0,
        pct: p.tope > 0 ? ((gastoPorCategoria[p.categoria] || 0) / p.tope) * 100 : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
    return conUso[0] ?? null;
  }, [presupuestos, gastoPorCategoria]);

  const retoActivo = useMemo(() => retos.find((r) => !r.completado) ?? null, [retos]);

  /** Los próximos cobros de suscripción, para que la tarjeta diga cuándo. */
  const proximosCobros = useMemo(
    () =>
      suscripciones
        .filter((s) => s.activa)
        .map((s) => ({ sus: s, ciclo: cicloDe(s, hoy), monto: montoVigente(s, hoy) }))
        .sort((a, b) => a.ciclo.faltan - b.ciclo.faltan)
        .slice(0, 4),
    [suscripciones, hoy]
  );

  const mejorTarjeta = useMemo(() => mejorTarjetaHoy(tarjetas, hoy), [tarjetas, hoy]);

  const cuposTarjetas = useMemo(
    () =>
      tarjetas.map((tc) => ({
        tc,
        cupo: cupoDeTarjeta(tc, deudaDeTarjeta(tc, props.deudas)),
      })),
    [tarjetas, props.deudas]
  );

  const entradaCierre = useMemo(
    () => ({
      movimientos: props.movimientos,
      retos,
      deudas: props.deudas,
      suscripciones,
      disponibleMensual: props.disponibleMensual,
      esPro: true,
    }),
    [props.movimientos, retos, props.deudas, suscripciones, props.disponibleMensual]
  );

  const cierres = useMemo(() => historial(entradaCierre, hoy, 6), [entradaCierre, hoy]);
  const cerrados = useMemo(() => cierres.filter((c) => !c.enCurso), [cierres]);
  const ultimoCierre = cerrados[cerrados.length - 1] ?? null;

  const hallazgos = useMemo(
    () =>
      ultimoCierre
        ? calcularHallazgos({
            movimientos: props.movimientos,
            deudas: props.deudas,
            suscripciones,
            cierres,
            cierre: ultimoCierre,
            esPro: true,
            formato: formatearCOP,
          })
        : [],
    [props.movimientos, props.deudas, suscripciones, cierres, ultimoCierre]
  );

  /** Lo apartado, repartido entre sobres y retos, para la cinta de la izquierda. */
  const repartoApartado = useMemo(() => {
    const partes = [
      ...sobres.map((s) => ({
        nombre: `Sobre · ${s.nombre}`,
        monto: s.apartado,
        color: s.color || 'var(--positivo)',
      })),
      ...retos.map((r) => ({
        nombre: `Reto · ${r.nombre}`,
        monto: r.acumulado,
        color: r.color || 'var(--accion)',
      })),
    ].filter((p) => p.monto > 0);
    const total = partes.reduce((s, p) => s + p.monto, 0);
    return { partes, total };
  }, [sobres, retos]);

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">Crecer</h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip variante="aqua">✦ Bolsillo Pro</Chip>
        <Chip>6 herramientas · nada bloqueado</Chip>
      </BarraTitulo>

      <BarraAcciones>
        <Chip>
          {contexto.nombre} · día {contexto.dia} de {contexto.diasDelMes}
        </Chip>
      </BarraAcciones>

      {/* ===================== Cabecera de móvil ===================== */}
      <header className="md:hidden pt-1 mb-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Bolsillo Pro
        </span>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
          Crecer
        </h1>
      </header>

      <Marco columnas={cajonEmpuja ? '300px minmax(0,1fr)' : '336px minmax(0,1fr)'}>
        {/* ---------- Columna 1: lo apartado y lo que Bolsillo notó ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona className="xl:!py-[18px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Apartado en total
            </p>
            <p className="font-display font-black text-[38px] leading-none tabular-nums text-[color:var(--positivo)] mt-2">
              {formatearCOP(repartoApartado.total)}
            </p>
            <p className="text-[11.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
              {sobres.length > 0 && `${formatearCOP(totalApartado)} en sobres`}
              {sobres.length > 0 && resumenRetos.acumulado > 0 && ' y '}
              {resumenRetos.acumulado > 0 && `${formatearCOP(resumenRetos.acumulado)} en retos`}
              {repartoApartado.total === 0 && 'Todavía no has apartado nada.'}
            </p>
          </Zona>

          {repartoApartado.partes.length > 0 && (
            <Zona>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                Dónde está apartado
              </p>
              <div className="flex h-[22px] rounded-md overflow-hidden gap-0.5 mt-2.5 mb-2">
                {repartoApartado.partes.map((p) => (
                  <span
                    key={p.nombre}
                    style={{
                      width: `${(p.monto / repartoApartado.total) * 100}%`,
                      background: p.color,
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col">
                {repartoApartado.partes.map((p) => (
                  <div
                    key={p.nombre}
                    className="flex items-center gap-2.5 py-1.5 border-b border-[var(--hairline)] last:border-b-0"
                  >
                    <span
                      className="w-2 h-2 rounded-[2px] flex-none"
                      style={{ background: p.color }}
                    />
                    <span className="flex-1 text-[11.5px] text-[color:var(--texto-2)] truncate">
                      {p.nombre}
                    </span>
                    <span className="font-display font-bold text-[12px] tabular-nums text-[color:var(--texto)]">
                      {formatearCOP(p.monto)}
                    </span>
                    <span className="text-[10px] text-[color:var(--texto-3)] tabular-nums w-9 text-right">
                      {Math.round((p.monto / repartoApartado.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </Zona>
          )}

          <Zona crece sinPadding>
            <div className="p-4 xl:px-[17px] xl:py-[13px] xl:pb-1.5 flex items-baseline justify-between gap-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                Lo que Bolsillo notó
              </p>
              {ultimoCierre && (
                <span className="text-[10.5px] text-[color:var(--texto-3)]">
                  {ultimoCierre.etiqueta}
                </span>
              )}
            </div>

            {hallazgos.length > 0 ? (
              <Scroll className="px-4 xl:px-[17px] pb-2">
                <div className="flex flex-col">
                  {hallazgos.map((h) => (
                    <div
                      key={h.id}
                      className="py-2.5 border-b border-[var(--hairline)] last:border-b-0"
                    >
                      <p className="text-[12px] font-medium text-[color:var(--texto)] leading-snug">
                        {h.titulo}
                      </p>
                      <p className="text-[10.5px] text-[color:var(--texto-3)] leading-relaxed mt-1">
                        {h.detalle}
                      </p>
                    </div>
                  ))}
                </div>
              </Scroll>
            ) : (
              <p className="px-4 xl:px-[17px] pb-3 text-[11px] text-[color:var(--texto-3)] leading-relaxed">
                Con un mes cerrado empiezan a salir los hallazgos que solo se ven con historia.
              </p>
            )}

            <div className="px-4 xl:px-[17px] pt-2 pb-3 xl:pb-[13px]">
              <button
                type="button"
                onClick={() => setModulo('reportes')}
                className="text-[11px] font-semibold text-[color:var(--acento)] hover:underline cursor-pointer flex items-center gap-1"
              >
                Abrir Reportes <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Zona>
        </Columna>

        {/* ---------- Columna 2: las seis herramientas ---------- */}
        <Columna ordenMovil={2}>
          <Zona>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  Tus herramientas
                </p>
                <h2 className="font-display font-bold text-[15px] text-[color:var(--texto)] mt-1.5">
                  Cada una con lo que{' '}
                  <span className="text-[color:var(--acento)]">toca hacer ahora</span>
                </h2>
              </div>
              <span className="text-[11px] text-[color:var(--texto-3)] whitespace-nowrap">
                Toca una para abrirla
              </span>
            </div>
          </Zona>

          <Zona crece sinPadding>
            <div
              className={`grid gap-3 p-4 xl:p-[17px] xl:h-full ${
                cajonEmpuja ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'
              } xl:auto-rows-fr`}
            >
              {/* --- Presupuesto --- */}
              <TarjetaModulo
                color="var(--azul)"
                icono={<PieChart className="w-3.5 h-3.5" />}
                nombre="Presupuesto"
                etiqueta={resumenPresupuesto.n > 0 ? `${resumenPresupuesto.n} topes` : undefined}
                cifra={resumenPresupuesto.n > 0 ? `${resumenPresupuesto.pct}%` : '—'}
                sufijo={resumenPresupuesto.n > 0 ? 'usado' : undefined}
                accion={
                  topeApretado && topeApretado.pct >= 80
                    ? `Subir el tope de ${topeApretado.categoria}`
                    : 'Revisar tus topes'
                }
                onClick={() => setModulo('presupuesto')}
              >
                {resumenPresupuesto.n > 0 ? (
                  <>
                    <span className="block h-[7px] rounded bg-[var(--hairline)] overflow-hidden mt-2">
                      <span
                        className="block h-full rounded"
                        style={{
                          width: `${Math.min(100, resumenPresupuesto.pct)}%`,
                          background: 'var(--azul)',
                        }}
                      />
                    </span>
                    <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                      {formatearCOP(resumenPresupuesto.totalGastado)} de{' '}
                      {formatearCOP(resumenPresupuesto.totalTope)} en topes.
                    </p>
                    {topeApretado && (
                      <div className="flex justify-between gap-2 text-[10.5px] mt-2">
                        <span className="text-[color:var(--texto-3)] truncate">
                          {topeApretado.categoria}
                        </span>
                        <span
                          className={`font-display font-semibold tabular-nums ${
                            topeApretado.pct >= 80
                              ? 'text-[color:var(--alerta)]'
                              : 'text-[color:var(--texto-2)]'
                          }`}
                        >
                          {Math.round(topeApretado.pct)}% del tope
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Ponle un tope a cada categoría y te aviso antes de que se acabe.
                  </p>
                )}
              </TarjetaModulo>

              {/* --- Sobres --- */}
              <TarjetaModulo
                color="var(--positivo)"
                icono={<Mail className="w-3.5 h-3.5" />}
                nombre="Sobres digitales"
                etiqueta={sobres.length > 0 ? `${sobres.length} sobres` : undefined}
                cifra={formatearCOP(totalApartado)}
                accion={sobres.length > 0 ? 'Mandar lo libre a un sobre' : 'Crear tu primer sobre'}
                onClick={() => setModulo('sobres')}
              >
                {sobres.length > 0 ? (
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    {sobres.slice(0, 3).map((s) => (
                      <div key={s.id}>
                        <div className="flex justify-between gap-2 text-[10.5px]">
                          <span className="text-[color:var(--texto-3)] truncate">{s.nombre}</span>
                          <span className="font-display font-semibold tabular-nums text-[color:var(--texto-2)]">
                            {formatearCOP(s.apartado)}
                          </span>
                        </div>
                        {s.meta && s.meta > 0 && (
                          <span className="block h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden mt-1">
                            <span
                              className="block h-full rounded-sm bg-[var(--positivo)]"
                              style={{ width: `${Math.min(100, (s.apartado / s.meta) * 100)}%` }}
                            />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Aparta lo intocable antes de gastarlo.
                  </p>
                )}
              </TarjetaModulo>

              {/* --- Retos --- */}
              <TarjetaModulo
                color="var(--accion)"
                icono={<Trophy className="w-3.5 h-3.5" />}
                nombre="Retos de ahorro"
                etiqueta={
                  resumenRetos.mejorRacha > 0 ? `🔥 racha ${resumenRetos.mejorRacha}` : undefined
                }
                etiquetaTono="ok"
                cifra={formatearCOP(resumenRetos.acumulado)}
                sufijo={retoActivo ? `de ${formatearCOP(retoActivo.metaTotal)}` : undefined}
                accion={retoActivo ? `Aportar la semana ${retoActivo.semanaActual}` : 'Crear un reto'}
                onClick={() => setModulo('retos')}
              >
                {retoActivo ? (
                  <>
                    <div className="flex items-end gap-[3px] h-[26px] mt-2.5">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const bloques = Math.max(1, Math.ceil(retoActivo.semanasTotales / 10));
                        const hechos = Math.floor((retoActivo.semanaActual - 1) / bloques);
                        return (
                          <span
                            key={i}
                            className="flex-1 rounded-t-[2px]"
                            style={{
                              height: '100%',
                              background: 'var(--accion)',
                              opacity: i < hechos ? 1 : 0.3,
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                      {retoActivo.nombre} · semana {retoActivo.semanaActual} de{' '}
                      {retoActivo.semanasTotales}.
                    </p>
                  </>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Junta tu primer millón con un reto guiado.
                  </p>
                )}
              </TarjetaModulo>

              {/* --- Suscripciones --- */}
              <TarjetaModulo
                color="var(--acento-2)"
                icono={<Repeat className="w-3.5 h-3.5" />}
                nombre="Suscripciones"
                etiqueta={
                  suscripciones.length > 0
                    ? `${suscripciones.filter((s) => s.activa).length} activas`
                    : undefined
                }
                cifra={formatearCOP(sangradoMensual)}
                sufijo="/mes"
                accion={
                  proximosCobros[0]
                    ? proximosCobros[0].ciclo.esFinDePromo
                    ? `A ${proximosCobros[0].sus.nombre} se le acaba la promo en ${proximosCobros[0].ciclo.faltan} días`
                    : proximosCobros[0].ciclo.esFinDePromo
                    ? `A ${proximosCobros[0].sus.nombre} se le acaba la promo en ${proximosCobros[0].ciclo.faltan} días`
                    : `${proximosCobros[0].sus.nombre} se cobra en ${proximosCobros[0].ciclo.faltan} días`
                    : 'Registrar tus suscripciones'
                }
                onClick={() => setModulo('suscripciones')}
              >
                {proximosCobros.length > 0 ? (
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    {proximosCobros.map(({ sus, ciclo, monto }) => (
                      <div key={sus.id} className="flex justify-between gap-2 text-[10.5px]">
                        <span className="text-[color:var(--texto-3)] truncate">
                          {ciclo.faltan === 0
                            ? 'hoy'
                            : `en ${ciclo.faltan}d`}{' '}
                          · {sus.nombre}
                        </span>
                        <span className="font-display font-semibold tabular-nums text-[color:var(--texto-2)]">
                          {formatearCOP(monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Caza los cobros que se comen tu sueldo.
                  </p>
                )}
              </TarjetaModulo>

              {/* --- Tarjetas --- */}
              <TarjetaModulo
                color="var(--alerta)"
                icono={<CreditCard className="w-3.5 h-3.5" />}
                nombre="Tarjetas y corte"
                etiqueta={
                  tarjetas.length > 0
                    ? `${tarjetas.length} tarjeta${tarjetas.length === 1 ? '' : 's'}`
                    : undefined
                }
                cifra={mejorTarjeta ? String(mejorTarjeta.plazo.dias) : '—'}
                sufijo={mejorTarjeta ? 'días sin interés' : undefined}
                accion={
                  tarjetas.length > 0 ? '¿A cuántas cuotas la difiero?' : 'Agregar tu tarjeta'
                }
                onClick={() => setModulo('tarjetas')}
              >
                {mejorTarjeta ? (
                  <>
                    <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                      Si compras hoy con {mejorTarjeta.tc.nombre}.
                    </p>
                    <div className="flex flex-col gap-1.5 mt-2.5">
                      {cuposTarjetas.slice(0, 2).map(({ tc, cupo }) => (
                        <div key={tc.id}>
                          <div className="flex justify-between gap-2 text-[10.5px]">
                            <span className="text-[color:var(--texto-3)] truncate">{tc.nombre}</span>
                            <span
                              className={`font-display font-semibold tabular-nums ${
                                cupo.estado === 'riesgo'
                                  ? 'text-[color:var(--alerta)]'
                                  : 'text-[color:var(--texto-2)]'
                              }`}
                            >
                              {Math.round(cupo.pct)}% del cupo
                            </span>
                          </div>
                          <span className="block h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden mt-1">
                            <span
                              className="block h-full rounded-sm"
                              style={{
                                width: `${Math.min(100, cupo.pct)}%`,
                                background:
                                  cupo.estado === 'riesgo' ? 'var(--alerta)' : 'var(--acento)',
                              }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Sabe con cuál pagar para no pagar intereses.
                  </p>
                )}
              </TarjetaModulo>

              {/* --- Reportes --- */}
              <TarjetaModulo
                color="var(--acento)"
                icono={<BarChart3 className="w-3.5 h-3.5" />}
                nombre="Reportes"
                etiqueta={ultimoCierre ? `${ultimoCierre.etiqueta} cerrado` : undefined}
                cifra={ultimoCierre ? formatearCOP(ultimoCierre.queda) : '—'}
                sufijo={ultimoCierre ? 'te sobraron' : undefined}
                accion="Ver el mes cerrado · exportar"
                onClick={() => setModulo('reportes')}
              >
                {cerrados.length > 0 ? (
                  <>
                    <div className="flex items-center gap-[3px] h-[30px] mt-2.5">
                      {cerrados.slice(-5).map((c) => {
                        const tope = Math.max(
                          ...cerrados.slice(-5).map((x) => Math.abs(x.queda)),
                          1
                        );
                        const alto = Math.max(8, (Math.abs(c.queda) / tope) * 100);
                        return (
                          <span
                            key={`${c.anio}-${c.mes}`}
                            className="flex-1 rounded-[2px]"
                            style={{
                              height: `${alto}%`,
                              alignSelf: c.queda < 0 ? 'flex-start' : 'flex-end',
                              background: c.queda < 0 ? 'var(--alerta)' : 'var(--acento)',
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                      {cerrados.length} meses cerrados
                      {ultimoCierre &&
                        ` · ${ultimoCierre.pctQueda} de cada 100 pesos te quedaron`}
                      .
                    </p>
                  </>
                ) : (
                  <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2 leading-relaxed">
                    Lo que solo se ve con varios meses · exportable.
                  </p>
                )}
              </TarjetaModulo>
            </div>
          </Zona>
        </Columna>
      </Marco>
    </div>
  );
};