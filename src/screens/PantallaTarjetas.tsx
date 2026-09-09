import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  Info,
  Calculator,
} from 'lucide-react';
import { Billetera, Deuda, TarjetaCredito } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { Chip } from '../components/ui/Chip';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { NotaModulo } from '../components/ui/NotaModulo';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import {
  CUPO_RIESGO,
  CUPO_SANO,
  TASA_TARJETA_TIPICA,
  cicloDeTarjeta,
  costoDelMinimo,
  cupoDeTarjeta,
  deudaDeTarjeta,
  diasSinInteresesDe,
  mejorTarjetaHoy,
  simularCuotas,
  tasaDeTarjeta,
} from '../logic/tarjetas';
import { fechaConDiaSemana } from '../utils/fechas';

interface PantallaTarjetasProps {
  tarjetas: TarjetaCredito[];
  deudas: Deuda[];
  billeteras: Billetera[];
  onGuardarTarjeta: (tc: TarjetaCredito) => void;
  onEliminarTarjeta: (id: string) => void;
  onAbonarDeuda: (
    deudaId: string,
    billeteraId: string,
    monto: number
  ) => { exito: boolean; deudaSaldada: boolean };
  onVolver: () => void;
}

const COLORES = ['#FF7A3D', '#25C9BE', '#5FE0A8', '#8AA9FF', '#F2C879', '#E89385'];
const MONTOS_RAPIDOS = [200000, 500000, 1000000, 2000000];

export const PantallaTarjetas: React.FC<PantallaTarjetasProps> = ({
  tarjetas,
  deudas,
  billeteras,
  onGuardarTarjeta,
  onEliminarTarjeta,
  onAbonarDeuda,
  onVolver,
}) => {
  const cajonEmpuja = useCajonEmpuja();
  const [modal, setModal] = useState<{ editando: TarjetaCredito | null } | null>(null);
  const [deudaAbono, setDeudaAbono] = useState<Deuda | null>(null);
  const simuladorRef = useRef<HTMLDivElement>(null);

  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const conPlazo = useMemo(
    () =>
      tarjetas
        .map((tc) => ({ tc, plazo: diasSinInteresesDe(tc, hoy) }))
        .sort((a, b) => b.plazo.dias - a.plazo.dias),
    [tarjetas, hoy]
  );
  const mejor = useMemo(() => mejorTarjetaHoy(tarjetas, hoy), [tarjetas, hoy]);
  const segunda = conPlazo[1];

  // --- Simulador de cuotas ---
  const [montoStr, setMontoStr] = useState(formatearCOP(1000000));
  const [tarjetaSim, setTarjetaSim] = useState<string>('');
  const tcSim = tarjetas.find((t) => t.id === tarjetaSim) ?? mejor?.tc ?? tarjetas[0];
  const deudaSim = tcSim ? deudaDeTarjeta(tcSim, deudas) : null;
  const tasaSim = tcSim ? tasaDeTarjeta(tcSim, deudaSim) : TASA_TARJETA_TIPICA;
  const montoSim = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const opciones = useMemo(() => simularCuotas(montoSim, tasaSim), [montoSim, tasaSim]);
  const peor = opciones[opciones.length - 1];

  const abrirSimulador = (tc: TarjetaCredito) => {
    setTarjetaSim(tc.id);
    simuladorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Crecer · Pro
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">
          Tarjetas y corte
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>
          {tarjetas.length} {tarjetas.length === 1 ? 'tarjeta' : 'tarjetas'}
        </Chip>
        {mejor && <Chip variante="aqua">{mejor.plazo.dias} días sin interés</Chip>}
      </BarraTitulo>

      <BarraAcciones>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ editando: null })}
        >
          Nueva tarjeta
        </Boton>
      </BarraAcciones>

      {/* Cabecera de móvil */}
      <header className="md:hidden flex items-center justify-between gap-3 pt-1">
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
              Tarjetas y corte
            </h1>
          </div>
        </div>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ editando: null })}
        >
          Nueva
        </Boton>
      </header>

      {tarjetas.length === 0 ? (
        <Marco columnas="minmax(0,1fr)">
          <Columna ordenMovil={1}>
            <Zona crece>
              <Tarjeta padding="lg" className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                  <CreditCard className="w-7 h-7 text-[color:var(--acento)]" />
                </div>
                <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Aún no tienes tarjetas</h3>
                <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
                  Guarda el día de corte y de pago de cada tarjeta y te digo con cuál conviene comprar hoy, y a cuántas cuotas.
                </p>
                <div className="mt-5">
                  <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
                    Agregar tarjeta
                  </Boton>
                </div>
              </Tarjeta>
            </Zona>
          </Columna>
        </Marco>
      ) : (
        <Marco columnas={cajonEmpuja ? '376px minmax(0,1fr)' : '376px minmax(0,1fr) 336px'}>
          {/* Con cuál comprar hoy */}
          <Columna ordenMovil={1} borde>
            <Zona crece sinPadding>
              <Scroll className="px-4 xl:px-[17px] py-3">
                {/* ===== 1. Con cuál comprar hoy ===== */}
                {mejor && (
                  <Tarjeta padding="lg" className="overflow-hidden relative">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-32"
                      style={{ background: 'radial-gradient(60% 100% at 15% 0%, color-mix(in srgb, var(--acento) 18%, transparent) 0%, transparent 70%)' }}
                    />
                    <div className="relative">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> Si compras hoy, usa
                      </span>

                      <div className="mt-1.5 flex items-end justify-between gap-3 flex-wrap">
                        <h2 className="font-display font-black text-2xl sm:text-3xl text-[color:var(--texto)] tracking-tight">
                          {mejor.tc.nombre}
                        </h2>
                        <div className="text-right">
                          <div className="font-display font-black text-2xl tabular-nums text-[color:var(--acento)]">
                            {mejor.plazo.dias} días
                          </div>
                          <div className="text-xs text-[color:var(--texto-2)]">sin intereses</div>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[13px] text-[color:var(--texto-2)] leading-relaxed">
                        Corta {fechaConDiaSemana(mejor.plazo.corte)} y se paga{' '}
                        {fechaConDiaSemana(mejor.plazo.limite)}: lo que compres hoy{' '}
                        <strong className="text-[color:var(--texto)]">
                          lo pagas hasta {fechaConDiaSemana(mejor.plazo.limite)}
                        </strong>
                        , sin un peso de interés.
                      </p>

                      <div className="mt-3 pt-3 border-t border-[var(--hairline)] text-[11.5px] text-[color:var(--texto-3)] space-y-1">
                        {segunda && segunda.plazo.dias < mejor.plazo.dias && (
                          <p>
                            Con {segunda.tc.nombre} solo tendrías {segunda.plazo.dias} días.
                          </p>
                        )}
                        {mejor.plazo.maximo > mejor.plazo.dias && (
                          <p>
                            Si puedes esperar al{' '}
                            <strong className="text-[color:var(--texto-2)]">
                              {mejor.plazo.diaDelMaximo.getDate()} de{' '}
                              {fechaConDiaSemana(mejor.plazo.diaDelMaximo).split(' de ')[1]}
                            </strong>
                            , esta misma tarjeta te daría {mejor.plazo.maximo} días — su máximo.
                          </p>
                        )}
                      </div>
                    </div>
                  </Tarjeta>
                )}


                <div className="mt-4">
                  <NotaModulo texto="Las dos preguntas de la caja: con cuál tarjeta comprar hoy para estirar los días sin intereses, y a cuántas cuotas diferir sin terminar pagando el doble." />
                </div>

                <div className="flex items-start gap-2.5 px-1 text-xs text-[color:var(--texto-3)]">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[color:var(--acento)]" />
                  <span>
                    Los días sin intereses van desde hoy hasta el pago de la factura que cierra en tu próximo
                    corte. Comprar justo después del corte da el mayor plazo. En Colombia, diferir a una sola
                    cuota no genera intereses.
                  </span>
                </div>
              </Scroll>
            </Zona>
          </Columna>

          {/* El simulador: es lo que necesita ancho */}
          <Columna ordenMovil={2} borde={!cajonEmpuja}>
            <Zona crece sinPadding>
              <Scroll className="px-4 xl:px-[17px] py-3">
                {/* ===== 2. El simulador de cuotas ===== */}
                <div ref={simuladorRef}>
                  <Tarjeta padding="lg">
                    <div className="flex items-start gap-2.5">
                      <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--accion) 14%, transparent)' }}>
                        <Calculator className="w-4 h-4 text-[color:var(--accion)]" />
                      </span>
                      <div>
                        <h2 className="font-display font-bold text-[17px] text-[color:var(--texto)]">
                          ¿A cuántas cuotas la difiero?
                        </h2>
                        <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                          La pregunta de la caja, respondida antes de decir el número.
                        </p>
                      </div>
                    </div>

                    {/* Entrada */}
                    <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[13px] text-[color:var(--texto-2)]">
                      <span>Voy a comprar</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={montoStr}
                        onChange={(e) => {
                          const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                          setMontoStr(isNaN(n) ? '' : formatearCOP(n));
                        }}
                        aria-label="Monto de la compra"
                        className="w-[132px] px-3 py-1.5 rounded-lg bg-[var(--fondo)] border border-[var(--acento)] font-display font-bold text-[15px] tabular-nums text-center text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento-2)]"
                      />
                      <span>con</span>
                      <select
                        value={tcSim?.id ?? ''}
                        onChange={(e) => setTarjetaSim(e.target.value)}
                        aria-label="Tarjeta"
                        className="px-3 py-1.5 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] text-[13px] font-semibold text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] cursor-pointer appearance-none"
                      >
                        {tarjetas.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[var(--superficie)]">
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-[color:var(--texto-3)]">
                        {tasaSim.toString().replace('.', ',')}% mes
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {MONTOS_RAPIDOS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMontoStr(formatearCOP(m))}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                            montoSim === m
                              ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                              : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                          }`}
                        >
                          {formatearCOP(m)}
                        </button>
                      ))}
                    </div>

                    {/* Tabla */}
                    {montoSim > 0 && (
                      <>
                        <div className="mt-4 overflow-x-auto">
                          <div className="min-w-[520px]">
                            <div className="grid grid-cols-[76px_120px_minmax(60px,1fr)_112px_96px] gap-3 items-center pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--texto-3)]">
                              <span>Cuotas</span>
                              <span>Terminas pagando</span>
                              <span>Lo que se va en intereses</span>
                              <span className="text-right">Cada mes</span>
                              <span className="text-right">De más</span>
                            </div>

                            {opciones.map((o) => {
                              const esUna = o.cuotas === 1;
                              const cara = o.pctExtra >= 25;
                              const media = !cara && o.pctExtra >= 12;
                              const anchoBarra = peor && peor.extra > 0 ? (o.extra / peor.extra) * 100 : 0;
                              return (
                                <div
                                  key={o.cuotas}
                                  className={`grid grid-cols-[76px_120px_minmax(60px,1fr)_112px_96px] gap-3 items-center py-2.5 border-t border-[var(--hairline)] text-[13px] ${
                                    esUna ? 'bg-[var(--positivo)]/7 rounded-lg' : ''
                                  }`}
                                >
                                  <span className={`font-semibold ${esUna ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto-2)]'}`}>
                                    {o.cuotas} {o.cuotas === 1 ? 'cuota' : 'cuotas'}
                                  </span>
                                  <span
                                    className={`font-display font-bold text-[15px] tabular-nums ${
                                      esUna
                                        ? 'text-[color:var(--positivo)]'
                                        : cara
                                        ? 'text-[color:var(--alerta)]'
                                        : 'text-[color:var(--texto)]'
                                    }`}
                                  >
                                    {formatearCOP(o.total)}
                                  </span>
                                  <span className="h-[7px] rounded-full bg-[var(--superficie-2)] overflow-hidden">
                                    <span
                                      className="block h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${Math.max(esUna ? 2 : 4, anchoBarra)}%`,
                                        background: esUna
                                          ? 'var(--positivo)'
                                          : cara
                                          ? 'var(--alerta)'
                                          : media
                                          ? '#F2C879'
                                          : 'var(--acento)',
                                      }}
                                    />
                                  </span>
                                  <span className="font-display font-bold text-sm tabular-nums text-right text-[color:var(--texto-2)]">
                                    {esUna ? '—' : formatearCOP(o.cuota)}
                                  </span>
                                  <span
                                    className={`text-xs text-right font-semibold ${
                                      esUna
                                        ? 'text-[color:var(--positivo)]'
                                        : cara
                                        ? 'text-[color:var(--alerta)]'
                                        : 'text-[color:var(--texto-3)] font-medium'
                                    }`}
                                  >
                                    {esUna ? 'sin intereses' : `+${formatearCOP(o.extra)}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {peor && peor.extra > 0 && (
                          <p className="mt-3.5 pt-3 border-t border-[var(--hairline)] text-[12.5px] text-[color:var(--texto-2)]">
                            A <strong className="text-[color:var(--texto)]">{peor.cuotas} cuotas</strong> esa compra de{' '}
                            {formatearCOP(montoSim)} termina costando{' '}
                            <strong className="text-[color:var(--alerta)]">{formatearCOP(peor.extra)} más</strong> — un{' '}
                            {Math.round(peor.pctExtra)}% encima del precio. La cuota se ve chiquita (
                            {formatearCOP(peor.cuota)}), pero{' '}
                            <strong className="text-[color:var(--texto)]">
                              te acompaña {Math.round(peor.cuotas / 12) >= 1 ? `${Math.round(peor.cuotas / 12)} años` : `${peor.cuotas} meses`}
                            </strong>{' '}
                            y te tapa el cupo todo ese tiempo.
                          </p>
                        )}

                        <div
                          className="mt-3 p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
                          style={{
                            borderColor: 'color-mix(in srgb, var(--alerta) 26%, transparent)',
                            background: 'color-mix(in srgb, var(--alerta) 8%, transparent)',
                          }}
                        >
                          <strong className="text-[color:var(--alerta)] font-bold">Y una advertencia: </strong>
                          si en vez de comprar sacas un <strong className="text-[color:var(--texto)]">avance en efectivo</strong>,
                          no hay días sin intereses. El interés corre{' '}
                          <strong className="text-[color:var(--texto)]">desde el mismo día</strong>, con tasa más alta y
                          un costo fijo por sacarlo. Un avance no es "usar la tarjeta": es un préstamo caro.
                        </div>
                      </>
                    )}
                  </Tarjeta>
                </div>
              </Scroll>
            </Zona>
          </Columna>

          {/* Tus tarjetas y su cupo */}
          <Columna ordenMovil={3} className={cajonEmpuja ? 'xl:hidden' : ''}>
            <Zona crece sinPadding>
              <Scroll className="px-4 xl:px-[17px] py-3">
                {/* ===== 3. Las tarjetas ===== */}
                <div className="grid gap-3 md:grid-cols-2">
                  {conPlazo.map(({ tc, plazo }, i) => {
                    const color = tc.color || 'var(--acento)';
                    const deuda = deudaDeTarjeta(tc, deudas);
                    const uso = cupoDeTarjeta(tc, deuda);
                    const ciclo = cicloDeTarjeta(tc, hoy);
                    const tasa = tasaDeTarjeta(tc, deuda);
                    const esMejor = i === 0 && tarjetas.length > 1;
                    const minimo = deuda
                      ? costoDelMinimo(deuda.saldo ?? 0, tasa, deuda.pagoMinimo || 0, 12)
                      : null;

                    return (
                      <Tarjeta
                        key={tc.id}
                        padding="md"
                        className={`flex flex-col gap-3.5 ${uso.estado === 'riesgo' ? 'border-[var(--alerta)]/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                              <CreditCard className="w-4 h-4" style={{ color }} />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[color:var(--texto)] truncate flex items-center gap-1.5">
                                {tc.nombre}
                                {esMejor && <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--acento)]">· hoy</span>}
                              </h3>
                              <p className="text-[11px] text-[color:var(--texto-3)]">
                                Corta el {tc.diaCorte} · paga el {tc.diaPago} · {tasa.toString().replace('.', ',')}% mes
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setModal({ editando: tc })} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Editar ${tc.nombre}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onEliminarTarjeta(tc.id)} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Eliminar ${tc.nombre}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Días sin intereses de ESTA tarjeta */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs text-[color:var(--texto-2)]">Si compras hoy</span>
                            <span className="font-display font-bold text-lg tabular-nums" style={{ color }}>
                              {plazo.dias}{' '}
                              <span className="text-xs font-medium text-[color:var(--texto-2)]">días sin interés</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(4, plazo.maximo > 0 ? (plazo.dias / plazo.maximo) * 100 : 0)}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-[color:var(--texto-3)]">
                            Pagas {fechaConDiaSemana(plazo.limite)} · su máximo es {plazo.maximo} días
                          </span>
                        </div>

                        {/* Cupo usado */}
                        {uso.cupo > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
                                Cupo usado
                              </span>
                              <span
                                className={`font-display font-bold text-sm tabular-nums ${
                                  uso.estado === 'riesgo'
                                    ? 'text-[color:var(--alerta)]'
                                    : uso.estado === 'medio'
                                    ? 'text-[color:var(--accion)]'
                                    : 'text-[color:var(--positivo)]'
                                }`}
                              >
                                {Math.round(uso.pct)}%
                              </span>
                            </div>

                            <div className="relative pb-4">
                              <div className="h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden relative">
                                <span
                                  className="absolute inset-y-0 right-0 bg-[var(--alerta)]/14"
                                  style={{ left: `${CUPO_RIESGO}%` }}
                                />
                                <div
                                  className="h-full rounded-full transition-all duration-500 relative"
                                  style={{
                                    width: `${Math.max(2, Math.min(100, uso.pct))}%`,
                                    background:
                                      uso.estado === 'riesgo'
                                        ? 'var(--alerta)'
                                        : uso.estado === 'medio'
                                        ? 'var(--accion)'
                                        : 'var(--positivo)',
                                  }}
                                />
                              </div>
                              <span className="absolute -top-0.5 w-0.5 h-3.5 rounded-sm bg-[var(--texto-2)]" style={{ left: `${CUPO_SANO}%` }} />
                              <span className="absolute top-3.5 -translate-x-1/2 text-[9px] text-[color:var(--texto-3)] whitespace-nowrap" style={{ left: `${CUPO_SANO}%` }}>
                                sano {CUPO_SANO}%
                              </span>
                              <span className="absolute -top-0.5 w-0.5 h-3.5 rounded-sm bg-[var(--texto-2)]" style={{ left: `${CUPO_RIESGO}%` }} />
                              <span className="absolute top-3.5 -translate-x-1/2 text-[9px] text-[color:var(--texto-3)] whitespace-nowrap" style={{ left: `${CUPO_RIESGO}%` }}>
                                baja tu score {CUPO_RIESGO}%
                              </span>
                            </div>

                            <span className="text-[11px] text-[color:var(--texto-3)]">
                              {formatearCOP(uso.usado)} de{' '}
                              <strong className="text-[color:var(--texto-2)] font-semibold">{formatearCOP(uso.cupo)}</strong>
                              {uso.paraBajarASano > 0
                                ? ` · para bajar del ${CUPO_SANO}% tendrías que abonar ${formatearCOP(uso.paraBajarASano)}`
                                : ' · tienes el cupo en verde'}
                            </span>
                          </div>
                        )}

                        {/* Ciclo */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12.5px] font-semibold text-[color:var(--texto)]">
                            Corta en{' '}
                            <strong className={ciclo.diasAlCorte <= 3 ? 'text-[color:var(--accion)]' : 'text-[color:var(--acento)]'}>
                              {ciclo.diasAlCorte} {ciclo.diasAlCorte === 1 ? 'día' : 'días'}
                            </strong>{' '}
                            · pagas en {ciclo.diasAlPago}
                          </span>
                          <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(2, ciclo.pct)}%`,
                                background: ciclo.diasAlCorte <= 3 ? 'var(--accion)' : 'var(--acento)',
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-[color:var(--texto-3)]">
                            Corte {fechaConDiaSemana(ciclo.corte)} · pago {fechaConDiaSemana(ciclo.pago)}
                          </span>
                        </div>

                        {/* Saldo y mínimo */}
                        {deuda ? (
                          <>
                            <div className="grid grid-cols-2 gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-xl overflow-hidden">
                              <div className="bg-[var(--superficie-2)] px-3 py-2">
                                <span className="block text-[9.5px] uppercase tracking-wider text-[color:var(--texto-3)]">Debes</span>
                                <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--alerta)]">
                                  {formatearCOP(deuda.saldo ?? 0)}
                                </span>
                              </div>
                              <div className="bg-[var(--superficie-2)] px-3 py-2">
                                <span className="block text-[9.5px] uppercase tracking-wider text-[color:var(--texto-3)]">Pago mínimo</span>
                                <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--texto)]">
                                  {formatearCOP(deuda.pagoMinimo || 0)}
                                </span>
                              </div>
                            </div>

                            {minimo && (deuda.pagoMinimo || 0) > 0 && (
                              <div
                                className="p-2.5 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
                                style={{
                                  borderColor: 'color-mix(in srgb, var(--alerta) 26%, transparent)',
                                  background: 'color-mix(in srgb, var(--alerta) 8%, transparent)',
                                }}
                              >
                                <strong className="text-[color:var(--alerta)] font-bold">Si pagas solo el mínimo: </strong>
                                {minimo.nuncaTermina ? (
                                  <>
                                    el mínimo ni siquiera cubre el interés del mes.{' '}
                                    <strong className="text-[color:var(--texto)]">La deuda crece</strong> aunque pagues.
                                  </>
                                ) : (
                                  <>
                                    en un año le habrás dado{' '}
                                    <strong className="text-[color:var(--texto)]">{formatearCOP(minimo.pagado)}</strong> al banco,{' '}
                                    <strong className="text-[color:var(--texto)]">{formatearCOP(minimo.intereses)}</strong> se van
                                    en puros intereses y todavía deberías{' '}
                                    <strong className="text-[color:var(--texto)]">{formatearCOP(minimo.saldoFinal)}</strong>.
                                  </>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeudaAbono(deuda)}
                                className="flex-1 py-2 rounded-xl bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-xs cursor-pointer hover:opacity-95 transition-opacity"
                              >
                                Registrar pago
                              </button>
                              <button
                                onClick={() => abrirSimulador(tc)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                              >
                                ¿A cuántas cuotas?
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-[11.5px] text-[color:var(--texto-3)]">
                              Sin saldo pendiente. Si esta tarjeta tiene deuda, agrégala en Deudas y vincúlala
                              al editar la tarjeta: aquí verás el cupo usado y el costo del mínimo.
                            </p>
                            <button
                              onClick={() => abrirSimulador(tc)}
                              className="w-full py-2 rounded-xl text-xs font-semibold border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                            >
                              ¿A cuántas cuotas?
                            </button>
                          </>
                        )}
                      </Tarjeta>
                    );
                  })}
                </div>
              </Scroll>
            </Zona>
          </Columna>
        </Marco>
      )}


      {modal && (
        <ModalTarjeta
          editando={modal.editando}
          deudas={deudas}
          onCerrar={() => setModal(null)}
          onGuardar={(tc) => { onGuardarTarjeta(tc); setModal(null); }}
        />
      )}

      <ModalAbonarDeuda
        abierto={!!deudaAbono}
        deuda={deudaAbono}
        billeteras={billeteras}
        onCerrar={() => setDeudaAbono(null)}
        onConfirmarAbono={(deudaId, billeteraId, monto) => {
          onAbonarDeuda(deudaId, billeteraId, monto);
          setDeudaAbono(null);
        }}
      />
    </div>
  );
};

// ============================================================
// Modal crear / editar tarjeta
// ============================================================
interface ModalTarjetaProps {
  editando: TarjetaCredito | null;
  deudas: Deuda[];
  onCerrar: () => void;
  onGuardar: (tc: TarjetaCredito) => void;
}

const ModalTarjeta: React.FC<ModalTarjetaProps> = ({ editando, deudas, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState(editando?.nombre || '');
  const [corte, setCorte] = useState<number>(editando?.diaCorte || 15);
  const [pago, setPago] = useState<number>(editando?.diaPago || 5);
  const [cupoStr, setCupoStr] = useState(editando?.cupo ? formatearCOP(editando.cupo) : '');
  const [tasaStr, setTasaStr] = useState(
    String(editando?.tasaMensual ?? TASA_TARJETA_TIPICA).replace('.', ',')
  );
  const [deudaId, setDeudaId] = useState(editando?.deudaId ?? '');
  const [color, setColor] = useState(editando?.color || COLORES[0]);
  const [error, setError] = useState('');

  const deudasTarjeta = deudas.filter((d) => d.tipo === 'tarjeta' && !d.saldada);
  const cupo = parseInt(cupoStr.replace(/[^\d]/g, ''), 10) || 0;
  const tasa = parseFloat(tasaStr.replace(',', '.')) || TASA_TARJETA_TIPICA;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ponle un nombre'); return; }
    onGuardar({
      id: editando?.id || `tc-${Date.now()}`,
      nombre: nombre.trim(),
      diaCorte: corte,
      diaPago: pago,
      cupo: cupo > 0 ? cupo : undefined,
      tasaMensual: tasa,
      deudaId: deudaId || undefined,
      color,
      creadoEn: editando?.creadoEn || new Date().toISOString(),
    });
  };

  const etq = 'text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block';
  const input =
    'w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">
              {editando ? 'Editar tarjeta' : 'Nueva tarjeta'}
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }} placeholder="Ej: Visa Bancolombia" autoFocus className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={etq}>Día de corte</label>
              <input type="number" min={1} max={31} value={corte} onChange={(e) => setCorte(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))} className={`${input} font-semibold tabular-nums`} />
            </div>
            <div className="space-y-1.5">
              <label className={etq}>Día límite de pago</label>
              <input type="number" min={1} max={31} value={pago} onChange={(e) => setPago(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))} className={`${input} font-semibold tabular-nums`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={etq}>Cupo total</label>
              <input
                type="text"
                inputMode="numeric"
                value={cupoStr}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                  setCupoStr(isNaN(n) ? '' : formatearCOP(n));
                }}
                placeholder="$0"
                className={`${input} font-semibold tabular-nums`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={etq}>Interés % mes</label>
              <input
                type="text"
                inputMode="decimal"
                value={tasaStr}
                onChange={(e) => setTasaStr(e.target.value.replace(/[^\d,.]/g, ''))}
                placeholder="2,1"
                className={`${input} font-semibold tabular-nums`}
              />
            </div>
          </div>

          {deudasTarjeta.length > 0 && (
            <div className="space-y-1.5">
              <label className={etq}>¿Cuál de tus deudas es esta tarjeta?</label>
              <select value={deudaId} onChange={(e) => setDeudaId(e.target.value)} className={`${input} appearance-none cursor-pointer`}>
                <option value="" className="bg-[var(--superficie)]">Ninguna / la busco por el nombre</option>
                {deudasTarjeta.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[var(--superficie)]">
                    {d.nombre} · {formatearCOP(d.saldo ?? 0)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[color:var(--texto-3)]">
                Vincularla evita escribir el saldo dos veces: el cupo usado y el costo del mínimo salen de tu deuda.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORES.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full cursor-pointer"
                  style={{ background: c, outline: color === c ? '2px solid var(--texto)' : '2px solid transparent', outlineOffset: '2px' }} aria-label={`Color ${c}`} />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cancelar</Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {editando ? 'Guardar' : 'Agregar'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
