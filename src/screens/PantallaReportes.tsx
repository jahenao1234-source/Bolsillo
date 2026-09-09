import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Printer,
  TrendingUp,
  Clock,
  CircleDot,
  Check,
  Repeat,
} from 'lucide-react';
import { Deuda, Movimiento, RetoAhorro, Suscripcion } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { Chip } from '../components/ui/Chip';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { NotaModulo } from '../components/ui/NotaModulo';
import {
  CierreMes,
  Hallazgo,
  calcularHallazgos,
  categoriasDelMes,
  cerrarMes,
  historial,
  mesesDisponibles,
  ultimoMesCerrado,
} from '../logic/reportes';
import { MESES_NOMBRE } from '../utils/fechas';

interface PantallaReportesProps {
  movimientos: Movimiento[];
  deudas: Deuda[];
  retos: RetoAhorro[];
  suscripciones: Suscripcion[];
  disponibleMensual: number;
  usuario: string;
  onVolver: () => void;
}

const ICONO_TONO: Record<string, React.ReactNode> = {
  quincena: <Clock className="w-4 h-4" />,
  deuda: <Check className="w-4 h-4" />,
  suscripciones: <Repeat className="w-4 h-4" />,
};

/** El titular trae {x} donde va la cifra que debe resaltar. */
const Titular: React.FC<{ hallazgo: Hallazgo }> = ({ hallazgo }) => {
  const partes = hallazgo.titulo.split('{x}');
  const color =
    hallazgo.tono === 'bien'
      ? 'var(--positivo)'
      : hallazgo.tono === 'ojo'
      ? 'var(--accion)'
      : '#8AA9FF';

  return (
    <h3 className="font-display font-bold text-[15.5px] text-[color:var(--texto)] leading-snug">
      {partes[0]}
      <span style={{ color }}>{hallazgo.destacado}</span>
      {partes[1]}
    </h3>
  );
};

export const PantallaReportes: React.FC<PantallaReportesProps> = ({
  movimientos,
  deudas,
  retos,
  suscripciones,
  disponibleMensual,
  usuario,
  onVolver,
}) => {
  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const entradaCierre = useMemo(
    () => ({ movimientos, retos, deudas, suscripciones, disponibleMensual, esPro: true }),
    [movimientos, retos, deudas, suscripciones, disponibleMensual]
  );

  const disponibles = useMemo(() => mesesDisponibles(movimientos, hoy), [movimientos, hoy]);
  const porDefecto = useMemo(() => {
    const ultimo = ultimoMesCerrado(hoy);
    const existe = disponibles.some((d) => d.mes === ultimo.mes && d.anio === ultimo.anio);
    return existe ? ultimo : disponibles[0] ?? { mes: hoy.getMonth(), anio: hoy.getFullYear() };
  }, [disponibles, hoy]);

  const cajonEmpuja = useCajonEmpuja();
  const [seleccion, setSeleccion] = useState<{ mes: number; anio: number }>(porDefecto);

  const cierre = useMemo(
    () => cerrarMes(entradaCierre, seleccion.mes, seleccion.anio, hoy),
    [entradaCierre, seleccion, hoy]
  );
  const cierres = useMemo(() => historial(entradaCierre, hoy, 6), [entradaCierre, hoy]);
  const cerrados = cierres.filter((c) => !c.enCurso);

  const hallazgos = useMemo(
    () =>
      calcularHallazgos({
        movimientos,
        deudas,
        suscripciones,
        cierres,
        cierre,
        esPro: true,
        formato: formatearCOP,
      }),
    [movimientos, deudas, suscripciones, cierres, cierre]
  );

  const categorias = useMemo(
    () => categoriasDelMes(movimientos, seleccion.mes, seleccion.anio),
    [movimientos, seleccion]
  );

  // --- Contexto del veredicto ---
  const mejor = cerrados.reduce<CierreMes | null>(
    (m, c) => (!m || c.queda > m.queda ? c : m),
    null
  );
  const peor = cerrados.reduce<CierreMes | null>(
    (m, c) => (!m || c.queda < m.queda ? c : m),
    null
  );
  const esElMejor = !!mejor && mejor.mes === cierre.mes && mejor.anio === cierre.anio;
  const anterior = cierres[cierres.findIndex((c) => c.mes === cierre.mes && c.anio === cierre.anio) - 1];

  // --- Escala del gráfico ---
  const maxPos = Math.max(1, ...cierres.map((c) => Math.max(0, c.queda)));
  const maxNeg = Math.max(1, ...cierres.map((c) => Math.max(0, -c.queda)));
  const hayNegativos = cierres.some((c) => c.queda < 0);

  const hayHistoria = cerrados.length >= 2;

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Crecer · Pro
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">Reportes</h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>
          {cerrados.length} {cerrados.length === 1 ? 'mes cerrado' : 'meses cerrados'}
        </Chip>
      </BarraTitulo>

      <BarraAcciones>
        <select
          value={`${seleccion.anio}-${seleccion.mes}`}
          onChange={(e) => {
            const [anio, mes] = e.target.value.split('-').map(Number);
            setSeleccion({ mes, anio });
          }}
          aria-label="Mes del reporte"
          className="px-2.5 py-1.5 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] text-xs font-semibold text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] cursor-pointer appearance-none"
        >
          {disponibles.map((d) => (
            <option key={`${d.anio}-${d.mes}`} value={`${d.anio}-${d.mes}`} className="bg-[var(--superficie)]">
              {MESES_NOMBRE[d.mes]} {d.anio}
            </option>
          ))}
        </select>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          Exportar
        </Boton>
      </BarraAcciones>

      {/* Cabecera de móvil */}
      <header className="md:hidden flex items-center justify-between gap-3 pt-1 no-imprimir">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
            aria-label="Volver a Crecer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Crecer · Pro
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Reportes
            </h1>
          </div>
        </div>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          Exportar
        </Boton>
      </header>

      {/*
        El marco lleva la clase hoja-reporte: al imprimir, la regla @media print
        deshace la rejilla y todo vuelve a caer en una sola columna de papel.
      */}
      <Marco columnas={cajonEmpuja ? '356px minmax(0,1fr)' : '356px minmax(0,1fr) 356px'} className="hoja-reporte">
        {/* Lo que solo se ve impreso va primero para que encabece la hoja */}
        {/* Encabezado que solo aparece impreso */}
        <div className="hidden solo-imprimir">
          <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-[var(--acento)]">
            <div>
              <div className="font-display font-black text-lg text-[color:var(--acento)]">Bolsillo</div>
              <div className="text-[11px] text-[color:var(--texto-2)]">
                Resumen mensual{usuario ? ` de ${usuario}` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-base">{cierre.etiquetaLarga}</div>
              <div className="text-[11px] text-[color:var(--texto-2)]">
                generado el {hoy.getDate()} de {MESES_NOMBRE[hoy.getMonth()].toLowerCase()}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Columna 1: el veredicto del mes ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* ===== Veredicto ===== */}
              <Tarjeta padding="lg">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--acento)]">
                  {cierre.enCurso ? `${cierre.etiquetaLarga} · va en curso` : `${cierre.etiquetaLarga} cerró`}
                </span>

                <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-[color:var(--texto)] mt-1.5 leading-tight">
                  Te {cierre.enCurso ? 'quedarían' : 'quedaron'}{' '}
                  <span className={cierre.queda >= 0 ? 'text-[color:var(--positivo)]' : 'text-[color:var(--alerta)]'}>
                    {formatearCOP(cierre.queda)}
                  </span>{' '}
                  {cierre.queda >= 0 ? 'libres' : 'en rojo'}
                </h2>

                {cierre.entro > 0 && (
                  <p className="text-sm text-[color:var(--texto-2)] mt-2">
                    <strong className="text-[color:var(--texto)]">
                      {Math.round(Math.abs(cierre.pctQueda))} de cada 100 pesos
                    </strong>{' '}
                    que entraron {cierre.queda >= 0 ? 'no tuvieron dueño' : 'te faltaron'}.
                    {esElMejor && cerrados.length > 1 && (
                      <> Tu mejor mes de los últimos {cerrados.length}.</>
                    )}
                  </p>
                )}

                {hayHistoria && (
                  <p className="text-[12.5px] text-[color:var(--texto-3)] mt-3 pt-3 border-t border-[var(--hairline)]">
                    {peor && peor.mes !== cierre.mes && (
                      <>
                        En <strong className="text-[color:var(--texto-2)]">{MESES_NOMBRE[peor.mes].toLowerCase()}</strong>{' '}
                        cerraste en{' '}
                        <strong className="text-[color:var(--texto-2)]">{formatearCOP(peor.queda)}</strong>.{' '}
                      </>
                    )}
                    {anterior && (
                      <>
                        Frente a {MESES_NOMBRE[anterior.mes].toLowerCase()},{' '}
                        {Math.abs(cierre.entro - anterior.entro) < 20000 ? (
                          <>
                            entró casi lo mismo y{' '}
                            {cierre.gastos <= anterior.gastos ? (
                              <>
                                gastaste{' '}
                                <strong className="text-[color:var(--texto-2)]">
                                  {formatearCOP(anterior.gastos - cierre.gastos)} menos
                                </strong>
                              </>
                            ) : (
                              <>
                                gastaste{' '}
                                <strong className="text-[color:var(--texto-2)]">
                                  {formatearCOP(cierre.gastos - anterior.gastos)} más
                                </strong>
                              </>
                            )}
                            : la diferencia fue el gasto, no el ingreso.
                          </>
                        ) : (
                          <>
                            entró{' '}
                            <strong className="text-[color:var(--texto-2)]">
                              {formatearCOP(Math.abs(cierre.entro - anterior.entro))}{' '}
                              {cierre.entro > anterior.entro ? 'más' : 'menos'}
                            </strong>
                            .
                          </>
                        )}
                      </>
                    )}
                  </p>
                )}
              </Tarjeta>

              {/* ===== En qué se fue (para la hoja impresa, y de paso útil) ===== */}
              {categorias.length > 0 && (
                <Tarjeta padding="lg">
                  <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] mb-3">
                    En qué se fue en {MESES_NOMBRE[cierre.mes].toLowerCase()}
                  </h3>
                  <div className="space-y-2">
                    {categorias.slice(0, 6).map((c) => (
                      <div key={c.etiqueta} className="grid grid-cols-[104px_1fr_100px] gap-3 items-center">
                        <span className="text-[12.5px] text-[color:var(--texto-2)] truncate">{c.etiqueta}</span>
                        <span className="h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                          <span
                            className="block h-full rounded-full bg-[var(--acento)]"
                            style={{ width: `${Math.max(2, c.pct)}%` }}
                          />
                        </span>
                        <span className="font-display font-bold text-[13px] tabular-nums text-right text-[color:var(--texto)]">
                          {formatearCOP(c.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Tarjeta>
              )}


              <div className="mt-4 no-imprimir">
                <div className="no-imprimir">
                  <NotaModulo texto="Aquí no está lo de este mes en vivo — eso está en Inicio. Aquí está lo que solo aparece cuando hay varios meses seguidos." />
                </div>
              </div>
            </Scroll>
          </Zona>
        </Columna>

        {/* ---------- Columna 2: tus meses ---------- */}
        <Columna ordenMovil={2} borde={!cajonEmpuja}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* ===== Tus meses ===== */}
              {cierres.length >= 2 && (
                <Tarjeta padding="lg">
                  <div className="flex items-baseline justify-between gap-3 mb-4">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
                      Lo que te queda cada mes
                    </h3>
                    <span className="text-[11px] text-[color:var(--texto-3)]">
                      últimos {cierres.length} meses
                      {cierres.some((c) => c.enCurso) && ' · el actual va proyectado'}
                    </span>
                  </div>

                  {/* Gráfico */}
                  <div className="flex items-stretch gap-2.5" style={{ height: hayNegativos ? 108 : 84 }}>
                    {cierres.map((c) => {
                      const esSeleccionado = c.mes === cierre.mes && c.anio === cierre.anio;
                      const altoPos = c.queda > 0 ? Math.max(3, (c.queda / maxPos) * 74) : 0;
                      const altoNeg = c.queda < 0 ? Math.max(3, (-c.queda / maxNeg) * 26) : 0;
                      return (
                        <div key={`${c.anio}-${c.mes}`} className="flex-1 flex flex-col">
                          <div className="flex-1 flex items-end justify-center" style={{ height: 74 }}>
                            {altoPos > 0 && (
                              <span
                                className="w-full max-w-[62px] rounded-t-md transition-all duration-500"
                                style={{
                                  height: altoPos,
                                  background: c.enCurso
                                    ? 'transparent'
                                    : esSeleccionado
                                    ? 'linear-gradient(180deg, #7FE9BA, var(--positivo))'
                                    : 'linear-gradient(180deg, var(--acento-2), var(--acento))',
                                  border: c.enCurso ? '1px dashed var(--acento)' : undefined,
                                  borderBottom: c.enCurso ? 'none' : undefined,
                                }}
                              />
                            )}
                          </div>
                          <span className="block h-px bg-[var(--hairline)]" />
                          {hayNegativos && (
                            <div className="flex items-start justify-center" style={{ height: 26 }}>
                              {altoNeg > 0 && (
                                <span
                                  className="w-full max-w-[62px] rounded-b-md bg-[var(--alerta)]"
                                  style={{ height: altoNeg }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2.5 mt-1.5">
                    {cierres.map((c) => {
                      const esSeleccionado = c.mes === cierre.mes && c.anio === cierre.anio;
                      return (
                        <button
                          key={`e-${c.anio}-${c.mes}`}
                          type="button"
                          onClick={() => setSeleccion({ mes: c.mes, anio: c.anio })}
                          className="flex-1 text-center cursor-pointer group"
                        >
                          <span
                            className={`block text-[10.5px] ${
                              esSeleccionado
                                ? 'text-[color:var(--positivo)] font-bold'
                                : c.queda < 0
                                ? 'text-[color:var(--alerta)] font-semibold'
                                : 'text-[color:var(--texto-3)] group-hover:text-[color:var(--texto-2)]'
                            }`}
                          >
                            {c.etiqueta}
                          </span>
                          <span
                            className={`block font-display text-[11.5px] font-bold tabular-nums ${
                              esSeleccionado
                                ? 'text-[color:var(--positivo)]'
                                : c.queda < 0
                                ? 'text-[color:var(--alerta)]'
                                : c.enCurso
                                ? 'text-[color:var(--texto-3)] font-medium'
                                : 'text-[color:var(--texto-2)]'
                            }`}
                          >
                            {formatearCOP(c.queda)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tabla */}
                  <div className="mt-4 pt-3.5 border-t border-[var(--hairline)] overflow-x-auto">
                    <div className="min-w-[540px]">
                      <div className="grid grid-cols-[68px_repeat(4,1fr)_96px] gap-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-[color:var(--texto-3)]">
                        <span>Mes</span>
                        <span className="text-right">Entró</span>
                        <span className="text-right">Deudas</span>
                        <span className="text-right">Gastos</span>
                        <span className="text-right">Guardado</span>
                        <span className="text-right">Te quedó</span>
                      </div>
                      {cierres.map((c) => {
                        const esSeleccionado = c.mes === cierre.mes && c.anio === cierre.anio;
                        return (
                          <div
                            key={`t-${c.anio}-${c.mes}`}
                            className={`grid grid-cols-[68px_repeat(4,1fr)_96px] gap-2.5 items-center py-2 border-t border-[var(--hairline)] text-[12.5px] ${
                              esSeleccionado ? 'bg-[var(--acento)]/6 rounded-lg' : ''
                            }`}
                          >
                            <span className="font-bold text-[color:var(--texto-2)] capitalize">
                              {MESES_NOMBRE[c.mes].toLowerCase()}
                              {c.enCurso && <span className="text-[color:var(--texto-3)] font-normal"> *</span>}
                            </span>
                            <span className="font-display text-right tabular-nums text-[color:var(--texto-2)]">{formatearCOP(c.entro)}</span>
                            <span className="font-display text-right tabular-nums text-[color:var(--texto-2)]">{formatearCOP(c.deudas)}</span>
                            <span className="font-display text-right tabular-nums text-[color:var(--texto-2)]">{formatearCOP(c.gastos)}</span>
                            <span className="font-display text-right tabular-nums text-[color:var(--texto-2)]">{formatearCOP(c.guardado)}</span>
                            <span
                              className={`font-display font-bold text-right tabular-nums ${
                                c.queda < 0 ? 'text-[color:var(--alerta)]' : 'text-[color:var(--texto)]'
                              }`}
                            >
                              {formatearCOP(c.queda)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Tarjeta>
              )}

            </Scroll>
          </Zona>
        </Columna>

        {/* ---------- Columna 3: lo que Bolsillo notó ---------- */}
        <Columna ordenMovil={3} className={cajonEmpuja ? 'xl:hidden' : ''}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* ===== Hallazgos ===== */}
              {hallazgos.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] px-1">
                    Lo que Bolsillo notó
                  </h3>

                  {hallazgos.map((h) => (
                    <Tarjeta
                      key={h.id}
                      padding="md"
                      className={`grid grid-cols-[38px_1fr] gap-3.5 items-start ${
                        h.tono === 'ojo'
                          ? 'border-[var(--accion)]/35'
                          : h.tono === 'bien'
                          ? 'border-[var(--positivo)]/30'
                          : ''
                      }`}
                    >
                      <span
                        className="w-[38px] h-[38px] rounded-xl grid place-items-center"
                        style={{
                          background:
                            h.tono === 'ojo'
                              ? 'color-mix(in srgb, var(--accion) 16%, transparent)'
                              : h.tono === 'bien'
                              ? 'color-mix(in srgb, var(--positivo) 16%, transparent)'
                              : 'rgba(138,169,255,.16)',
                          color:
                            h.tono === 'ojo'
                              ? 'var(--accion)'
                              : h.tono === 'bien'
                              ? 'var(--positivo)'
                              : '#8AA9FF',
                        }}
                      >
                        {ICONO_TONO[h.id] ??
                          (h.tono === 'ojo' ? <TrendingUp className="w-4 h-4" /> : <CircleDot className="w-4 h-4" />)}
                      </span>

                      <div className="min-w-0">
                        <Titular hallazgo={h} />
                        <p className="text-[12.5px] text-[color:var(--texto-2)] mt-1.5 leading-relaxed">{h.detalle}</p>

                        {h.serie && h.serie.length > 1 && (
                          <>
                            <div className="flex items-end gap-1 h-[26px] mt-2.5">
                              {h.serie.map((s, i) => {
                                const max = Math.max(...h.serie!.map((x) => x.valor)) || 1;
                                const esUltimo = i >= h.serie!.length - 2;
                                return (
                                  <span
                                    key={s.etiqueta}
                                    className="w-4 rounded-t-[3px]"
                                    style={{
                                      height: `${Math.max(20, (s.valor / max) * 100)}%`,
                                      background: esUltimo ? 'var(--accion)' : 'var(--texto-3)',
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-[10.5px] text-[color:var(--texto-3)] mt-1 block">
                              {h.serie.map((s) => s.etiqueta).join(' · ')}
                            </span>
                          </>
                        )}

                        {h.accion && (
                          <p className="text-[12px] font-bold text-[color:var(--acento)] mt-2">{h.accion}</p>
                        )}
                      </div>
                    </Tarjeta>
                  ))}
                </div>
              )}

            </Scroll>
          </Zona>
        </Columna>

        {/* Pie que solo aparece impreso */}
        <div className="hidden solo-imprimir">
          <div className="flex justify-between text-[10px] text-[color:var(--texto-3)] pt-2 border-t border-[var(--hairline)]">
            <span>Tus datos no salieron de tu dispositivo.</span>
            <span>bolsillo · {cierre.etiquetaLarga.toLowerCase()}</span>
          </div>
        </div>
      </Marco>


      {/* Sin historia todavía */}
      {!hayHistoria && (
        <Tarjeta padding="lg" className="no-imprimir">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
              <BarChart3 className="w-5 h-5 text-[color:var(--acento)]" />
            </span>
            <div>
              <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)]">
                Este módulo se va llenando
              </h3>
              <p className="text-[12.5px] text-[color:var(--texto-2)] mt-1 leading-relaxed">
                Con un solo mes no hay tendencias que mostrar. Al segundo mes aparecen las
                comparativas, y al tercero las tendencias de cada categoría. Sigue registrando
                y esta pantalla se pone interesante sola.
              </p>
            </div>
          </div>
        </Tarjeta>
      )}
    </div>
  );
};
