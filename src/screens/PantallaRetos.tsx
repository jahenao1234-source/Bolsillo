import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trophy,
  Flame,
  Trash2,
  Pencil,
  X,
  Check,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { RetoAhorro, TipoReto } from '../types';
import { aporteSemanaDe } from '../data/store';
import {
  PlanReto,
  ResumenEscalera,
  aporteDeSemanaPlan,
  aporteParaMeta,
  escaleraParaMeta,
  incrementoDe,
  inicioDeReto,
  modoDe,
  resumirEscalera,
  semanasParaMeta,
} from '../logic/retos';
import { fechaLarga } from '../utils/fechas';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { CountUp } from '../components/ui/CountUp';
import { ConfetiCelebracion } from '../components/ui/ConfetiCelebracion';
import { formatearCOP } from '../utils/format';
import { Chip } from '../components/ui/Chip';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones } from '../components/layout/shell';
import { NotaModulo } from '../components/ui/NotaModulo';

interface PantallaRetosProps {
  retos: RetoAhorro[];
  ingresoMensual: number;
  onGuardarReto: (reto: RetoAhorro) => void;
  onEliminarReto: (id: string) => void;
  onAportarReto: (id: string) => { exito: boolean; aporte: number; completado: boolean; acumulado: number };
  onVolver: () => void;
}

const COLORES_RETO = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];

export const PantallaRetos: React.FC<PantallaRetosProps> = ({
  retos,
  ingresoMensual,
  onGuardarReto,
  onEliminarReto,
  onAportarReto,
  onVolver,
}) => {
  const [modal, setModal] = useState<{ tipo: TipoReto; editando: RetoAhorro | null } | null>(null);
  const [confeti, setConfeti] = useState<{ activo: boolean; mensaje: string }>({ activo: false, mensaje: '' });

  const activos = retos.filter((r) => !r.completado);
  const completados = retos.filter((r) => r.completado);

  const handleAportar = (reto: RetoAhorro) => {
    const res = onAportarReto(reto.id);
    if (!res.exito) return;
    setConfeti({
      activo: true,
      mensaje: res.completado
        ? `¡Reto cumplido! Juntaste ${formatearCOP(res.acumulado)} 🎉`
        : `+${formatearCOP(res.aporte)} apartados · llevas ${formatearCOP(res.acumulado)}`,
    });
  };

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      <ConfetiCelebracion
        activo={confeti.activo}
        mensaje={confeti.mensaje}
        onTerminar={() => setConfeti({ activo: false, mensaje: '' })}
      />


      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Crecer · Pro
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">
          Retos de ahorro
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>
          {activos.length} {activos.length === 1 ? 'activo' : 'activos'}
        </Chip>
        {completados.length > 0 && <Chip variante="aqua">{completados.length} cumplidos</Chip>}
      </BarraTitulo>

      {/* Cabecera de móvil */}
      <header className="md:hidden pt-1">
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
              Retos de ahorro
            </h1>
          </div>
        </div>
      </header>

      <Marco columnas="minmax(0,1fr) 336px">
        {/* El reto y su escalera: es lo que necesita ancho */}
        <Columna ordenMovil={1} borde>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* Retos activos */}
              {activos.map((reto) => {
                const aporte = aporteSemanaDe(reto);
                const pct = reto.metaTotal > 0 ? Math.min(100, (reto.acumulado / reto.metaTotal) * 100) : 0;
                const cumplidas = reto.semanaActual - 1;
                const color = reto.color || 'var(--acento)';
                return (
                  <Tarjeta key={reto.id} padding="lg" className="overflow-hidden relative">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-32"
                      style={{ background: `radial-gradient(60% 100% at 15% 0%, color-mix(in srgb, ${color} 16%, transparent) 0%, transparent 70%)` }}
                    />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                            <Trophy className="w-5 h-5" style={{ color }} />
                          </span>
                          <div className="min-w-0">
                            <h2 className="font-display font-bold text-lg text-[color:var(--texto)] truncate">{reto.nombre}</h2>
                            <p className="text-xs text-[color:var(--texto-2)] flex items-center gap-1.5">
                              {reto.tipo === 'escalado' ? (
                                modoDe(reto) === 'al_reves' ? (
                                  <><TrendingUp className="w-3 h-3 rotate-90" /> Baja cada semana · {formatearCOP(incrementoDe(reto))} menos</>
                                ) : (
                                  <><TrendingUp className="w-3 h-3" /> Sube {formatearCOP(incrementoDe(reto))} cada semana</>
                                )
                              ) : (
                                <><CalendarDays className="w-3 h-3" /> Aporte semanal fijo</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[color:var(--accion)] bg-[var(--accion)]/12 border border-[var(--accion)]/25">
                            <Flame className="w-3.5 h-3.5" /> {reto.racha}
                          </span>
                          <button
                            onClick={() => setModal({ tipo: reto.tipo, editando: reto })}
                            className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                            aria-label={`Editar ${reto.nombre}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEliminarReto(reto.id)}
                            className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                            aria-label={`Eliminar ${reto.nombre}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progreso */}
                      <div className="mt-5 flex items-baseline justify-between gap-2">
                        <CountUp valor={reto.acumulado} className="font-display font-black text-3xl tracking-tight" formateador={formatearCOP} />
                        <span className="text-sm text-[color:var(--texto-2)] tabular-nums">de {formatearCOP(reto.metaTotal)}</span>
                      </div>
                      <div className="mt-2.5 h-3 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-[color:var(--texto-2)]">
                        <span>Semana {Math.min(reto.semanaActual, reto.semanasTotales)} de {reto.semanasTotales}</span>
                        <span className="tabular-nums">{Math.round(pct)}% · {cumplidas} aporte{cumplidas === 1 ? '' : 's'}</span>
                      </div>

                      {/* Acción semanal */}
                      <div className="mt-5 p-4 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider block">
                            Esta semana aparta
                          </span>
                          <span className="font-display font-bold text-2xl tabular-nums" style={{ color }}>
                            {formatearCOP(aporte)}
                          </span>
                        </div>
                        <Boton
                          variante="primario"
                          tamano="md"
                          icono={<Check className="w-4 h-4" />}
                          onClick={() => handleAportar(reto)}
                        >
                          Ya aparté
                        </Boton>
                      </div>
                    </div>
                  </Tarjeta>
                );
              })}

            </Scroll>
          </Zona>
        </Columna>

        {/* Empezar uno nuevo y los que ya cumpliste */}
        <Columna ordenMovil={2}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              <NotaModulo texto="Ahorrar se vuelve un juego con racha. Aportas cada semana y ves crecer tu meta sin sentirlo." />

              <div className="mt-4">
                {/* Empieza un reto */}
                <div>
                  <div className="flex items-baseline justify-between px-1 mb-3">
                    <h2 className="font-display font-bold text-base text-[color:var(--texto)]">
                      {activos.length > 0 ? 'Empieza otro reto' : 'Empieza un reto'}
                    </h2>
                    <span className="text-xs text-[color:var(--texto-3)]">elige tu ritmo</span>
                  </div>
                  <div className="grid gap-3 @xl:grid-cols-2">
                    <button
                      onClick={() => setModal({ tipo: 'escalado', editando: null })}
                      className="text-left flex items-start gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
                    >
                      <span className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                        <TrendingUp className="w-5 h-5 text-[color:var(--acento)]" />
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Reto escalado</h3>
                        <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                          Empieza con poco y sube cada semana. El clásico de las 52 semanas, al ritmo que tú elijas.
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'semanal_fijo', editando: null })}
                      className="text-left flex items-start gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
                    >
                      <span className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                        <Target className="w-5 h-5 text-[color:var(--acento)]" />
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Ahorro semanal fijo</h3>
                        <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                          El mismo aporte cada semana hasta llegar a tu meta. Tú eliges cuánto y para qué.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Retos cumplidos */}
              {completados.length > 0 && (
                <div>
                  <div className="flex items-baseline gap-2 px-1 mb-3">
                    <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Cumplidos</h2>
                    <span className="text-xs text-[color:var(--positivo)]">{completados.length} 🎉</span>
                  </div>
                  <div className="grid gap-3 @xl:grid-cols-2">
                    {completados.map((reto) => (
                      <Tarjeta key={reto.id} padding="md" className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 bg-[var(--positivo)]/15">
                            <Sparkles className="w-4 h-4 text-[color:var(--positivo)]" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[color:var(--texto)] truncate">{reto.nombre}</h3>
                            <p className="text-xs text-[color:var(--positivo)] font-semibold tabular-nums">
                              {formatearCOP(reto.acumulado)} juntados
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onEliminarReto(reto.id)}
                          className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors flex-shrink-0"
                          aria-label={`Eliminar ${reto.nombre}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tarjeta>
                    ))}
                  </div>
                </div>
              )}
            </Scroll>
          </Zona>
        </Columna>
      </Marco>

      {modal && (
        <ModalReto
          tipo={modal.tipo}
          editando={modal.editando}
          ingresoMensual={ingresoMensual}
          onCerrar={() => setModal(null)}
          onGuardar={(reto) => {
            onGuardarReto(reto);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};
// ============================================================
// Modal para crear o editar un reto
//
// Un reto tiene tres perillas: lo que metes, cuánto dura y a cuánto
// llegas. Fijando dos sale la tercera, así que el formulario no pregunta
// "¿semanas o monto?" sino QUÉ QUIERES QUE CALCULE. Y antes de darle
// "empezar" se ve la escalera: cuánto te toca mes a mes y cuál es el
// mes más duro.
// ============================================================

/** La perilla que resuelve Bolsillo; las otras dos las pone el usuario. */
type Pregunta = 'meta' | 'semanas' | 'aporte';

const PREGUNTAS: { id: Pregunta; etiqueta: string; ayuda: string }[] = [
  { id: 'meta', etiqueta: '¿Cuánto junto?', ayuda: 'pones cuota y semanas' },
  { id: 'semanas', etiqueta: '¿Cuánto me demoro?', ayuda: 'pones cuota y meta' },
  { id: 'aporte', etiqueta: '¿Cuánto meto?', ayuda: 'pones meta y semanas' },
];

type ModoCuota = 'sube' | 'al_reves' | 'parejo';

const MODOS: {
  id: ModoCuota;
  etiqueta: string;
  ayuda: string;
  icono: React.ReactNode;
}[] = [
  {
    id: 'sube',
    etiqueta: 'Sube',
    ayuda: 'fácil al principio',
    icono: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    id: 'al_reves',
    etiqueta: 'Al revés',
    ayuda: 'duro al principio',
    icono: <TrendingDown className="w-3.5 h-3.5" />,
  },
  {
    id: 'parejo',
    etiqueta: 'Parejo',
    ayuda: 'siempre igual',
    icono: <Minus className="w-3.5 h-3.5" />,
  },
];

const PRESETS_SEMANAS = [12, 26, 52, 80];

/** Un número dentro de la frase: editable, o resaltado si lo calcula Bolsillo. */
const NumeroEnLinea: React.FC<{
  valor: string;
  calculado?: boolean;
  ancho?: string;
  etiqueta: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputMode?: 'numeric';
}> = ({ valor, calculado = false, ancho = 'w-[104px]', etiqueta, onChange }) => {
  if (calculado) {
    return (
      <span
        className={`inline-flex items-center justify-center ${ancho} align-middle px-2 py-1 rounded-lg font-display font-bold text-[15px] tabular-nums bg-[var(--acento)]/12 border border-[var(--acento)]/45 text-[color:var(--acento)]`}
        title="Esto lo calcula Bolsillo"
      >
        {valor}
      </span>
    );
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={valor}
      onChange={onChange}
      aria-label={etiqueta}
      className={`inline-block ${ancho} align-middle px-2 py-1 rounded-lg bg-[var(--fondo)] border border-[var(--acento)] font-display font-bold text-[15px] text-center tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento-2)]`}
    />
  );
};

/** La escalera mes a mes: a esto te estás comprometiendo. */
const EscaleraMeses: React.FC<{ resumen: ResumenEscalera; color: string }> = ({
  resumen,
  color,
}) => {
  const maximo = resumen.meses.reduce((max, m) => Math.max(max, m.monto), 0) || 1;
  const pico = resumen.pico;
  const compacto = resumen.meses.length > 18;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
          Lo que te toca, mes a mes
        </span>
        {pico && (
          <span className="text-[11px] text-[color:var(--texto-3)]">
            el más duro:{' '}
            <strong className="text-[color:var(--accion)] font-bold">{pico.etiquetaLarga}</strong>
          </span>
        )}
      </div>

      <div className="flex items-end gap-1 h-[88px]" role="img"
        aria-label={`Aportes por mes, de ${formatearCOP(resumen.meses[0]?.monto ?? 0)} a ${formatearCOP(pico?.monto ?? 0)}.`}
      >
        {resumen.meses.map((m) => {
          const esPico = !!pico && m.mes === pico.mes && m.anio === pico.anio;
          return (
            <div
              key={`${m.anio}-${m.mes}`}
              className="flex-1 h-full flex flex-col items-center justify-end gap-1 min-w-0"
              title={`${m.etiquetaLarga}: ${formatearCOP(m.monto)} en ${m.semanas} semana${m.semanas === 1 ? '' : 's'}`}
            >
              <span
                className="w-full rounded-t-[4px] rounded-b-[2px] transition-all duration-300"
                style={{
                  height: `${Math.max(3, (m.monto / maximo) * 100)}%`,
                  background: esPico ? 'var(--accion)' : color,
                }}
              />
              {!compacto && (
                <span
                  className={`text-[9px] leading-none ${
                    esPico
                      ? 'text-[color:var(--accion)] font-bold'
                      : 'text-[color:var(--texto-3)]'
                  }`}
                >
                  {m.etiqueta}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-xl overflow-hidden">
        <div className="bg-[var(--superficie-2)] px-3 py-2">
          <span className="block text-[9.5px] uppercase tracking-wider text-[color:var(--texto-3)]">
            Primer mes
          </span>
          <span className="font-display font-bold text-sm tabular-nums text-[color:var(--texto)]">
            {formatearCOP(resumen.primerMes?.monto ?? 0)}
          </span>
        </div>
        <div className="bg-[var(--superficie-2)] px-3 py-2">
          <span className="block text-[9.5px] uppercase tracking-wider text-[color:var(--texto-3)]">
            Mes promedio
          </span>
          <span className="font-display font-bold text-sm tabular-nums text-[color:var(--texto)]">
            {formatearCOP(resumen.promedioMes)}
          </span>
        </div>
        <div className="bg-[var(--superficie-2)] px-3 py-2">
          <span className="block text-[9.5px] uppercase tracking-wider text-[color:var(--texto-3)]">
            El más duro
          </span>
          <span className="font-display font-bold text-sm tabular-nums text-[color:var(--accion)]">
            {formatearCOP(pico?.monto ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ModalRetoProps {
  tipo: TipoReto;
  editando: RetoAhorro | null;
  ingresoMensual: number;
  onCerrar: () => void;
  onGuardar: (reto: RetoAhorro) => void;
}

const ModalReto: React.FC<ModalRetoProps> = ({
  tipo,
  editando,
  ingresoMensual,
  onCerrar,
  onGuardar,
}) => {
  const inicio = useMemo(() => (editando ? inicioDeReto(editando) : new Date()), [editando]);
  const tipoInicial = editando ? editando.tipo : tipo;

  const [modo, setModo] = useState<ModoCuota>(
    tipoInicial === 'semanal_fijo' ? 'parejo' : editando?.modo === 'al_reves' ? 'al_reves' : 'sube'
  );
  const esEscalado = modo !== 'parejo';

  const [nombre, setNombre] = useState(editando?.nombre ?? '');
  const [pregunta, setPregunta] = useState<Pregunta>('meta');
  const [arranqueStr, setArranqueStr] = useState(
    formatearCOP(editando ? editando.aporteBase : tipoInicial === 'escalado' ? 2000 : 25000)
  );
  const [incrementoStr, setIncrementoStr] = useState(
    formatearCOP(editando ? incrementoDe(editando) : 2000)
  );
  const [semanas, setSemanas] = useState<number>(
    editando?.semanasTotales ?? (tipoInicial === 'escalado' ? 52 : 40)
  );
  const [metaStr, setMetaStr] = useState(formatearCOP(editando?.metaTotal ?? 1000000));
  const [color, setColor] = useState(editando?.color || COLORES_RETO[0]);
  const [error, setError] = useState('');

  const num = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  const fmt = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setter(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  // ---- Se resuelve la perilla que pidió el usuario ----
  const arranqueEscrito = num(arranqueStr);
  const incremento = esEscalado ? num(incrementoStr) : 0;
  const meta = num(metaStr);

  const semanasResueltas =
    pregunta === 'semanas'
      ? esEscalado
        ? semanasParaMeta(arranqueEscrito, incremento, meta)
        : arranqueEscrito > 0
        ? Math.min(520, Math.max(1, Math.ceil(meta / arranqueEscrito)))
        : 0
      : Math.max(1, Math.min(520, semanas));

  // En el escalado, "¿cuánto meto?" resuelve el escalón completo: el arranque
  // y el incremento se mueven juntos, que es como escala una escalera.
  const escaleraResuelta =
    pregunta === 'aporte' && esEscalado ? escaleraParaMeta(meta, semanasResueltas) : null;

  const arranqueResuelto = escaleraResuelta
    ? escaleraResuelta.arranque
    : pregunta === 'aporte'
    ? aporteParaMeta(meta, semanasResueltas)
    : arranqueEscrito;

  const incrementoResuelto = escaleraResuelta ? escaleraResuelta.incremento : incremento;

  const plan: PlanReto = {
    tipo: esEscalado ? 'escalado' : 'semanal_fijo',
    aporteBase: arranqueResuelto,
    incremento: incrementoResuelto,
    modo: modo === 'al_reves' ? 'al_reves' : 'sube',
    semanasTotales: semanasResueltas,
  };

  const resumen = resumirEscalera(plan, inicio);
  const mesesAprox = Math.max(1, resumen.meses.length);
  // El mismo promedio que muestra la escalera, para no dar dos cifras distintas.
  const alMes = resumen.promedioMes;
  const pctIngreso = ingresoMensual > 0 ? Math.round((alMes / ingresoMensual) * 100) : 0;

  const cambiarModo = (nuevo: ModoCuota) => {
    if (nuevo === modo) return;
    if (nuevo === 'parejo' && esEscalado) {
      setArranqueStr(formatearCOP(Math.max(1000, resumen.equivalenteParejo || 25000)));
    } else if (nuevo !== 'parejo' && !esEscalado) {
      setArranqueStr(formatearCOP(2000));
      setIncrementoStr(formatearCOP(2000));
    }
    setModo(nuevo);
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Ponle un nombre al reto');
    if (semanasResueltas < 1) return setError('Faltan las semanas o la meta');
    if (arranqueResuelto <= 0) {
      return setError(
        esEscalado
          ? 'Con ese incremento ya te pasas de la meta antes de terminar. Bájalo o sube la meta.'
          : 'Escribe cuánto vas a meter cada semana'
      );
    }
    if (resumen.total <= 0) return setError('Revisa las cifras: el reto queda en cero');

    const semanaActual = editando
      ? Math.min(editando.semanaActual, semanasResueltas + 1)
      : 1;
    const acumulado = editando?.acumulado ?? 0;

    onGuardar({
      id: editando?.id ?? `reto-${Date.now()}`,
      nombre: nombre.trim(),
      tipo: plan.tipo,
      aporteBase: plan.aporteBase,
      incremento: plan.tipo === 'escalado' ? plan.incremento : undefined,
      modo: plan.tipo === 'escalado' ? plan.modo : undefined,
      metaTotal: resumen.total,
      semanasTotales: semanasResueltas,
      semanaActual,
      acumulado,
      racha: editando?.racha ?? 0,
      completado: acumulado >= resumen.total || semanaActual > semanasResueltas,
      color,
      creadoEn: editando?.creadoEn ?? new Date().toISOString(),
    });
  };

  // ---- La respuesta grande ----
  const respuesta =
    pregunta === 'meta'
      ? {
          rotulo: 'Juntas',
          cifra: formatearCOP(resumen.total),
          sufijo: '',
          pie: (
            <>
              en <strong className="text-[color:var(--texto)]">{semanasResueltas} semanas</strong>
              {resumen.fechaFin && <> · terminas el <strong className="text-[color:var(--texto)]">{fechaLarga(resumen.fechaFin)}</strong></>}
            </>
          ),
        }
      : pregunta === 'semanas'
      ? {
          rotulo: 'Te demoras',
          cifra: `${semanasResueltas}`,
          sufijo: semanasResueltas === 1 ? 'semana' : 'semanas',
          pie: (
            <>
              como <strong className="text-[color:var(--texto)]">{mesesAprox} meses</strong>
              {resumen.fechaFin && <> · lo tienes el <strong className="text-[color:var(--texto)]">{fechaLarga(resumen.fechaFin)}</strong></>}
              {resumen.total > meta && meta > 0 && <> · juntas {formatearCOP(resumen.total)}</>}
            </>
          ),
        }
      : {
          rotulo: esEscalado ? 'Arrancas con' : 'Te toca meter',
          cifra: formatearCOP(arranqueResuelto),
          sufijo: esEscalado ? 'la primera semana' : 'por semana',
          pie: (
            <>
              {esEscalado && (
                <>
                  subiendo{' '}
                  <strong className="text-[color:var(--texto)]">
                    {formatearCOP(incrementoResuelto)}
                  </strong>{' '}
                  cada semana ·{' '}
                </>
              )}
              son <strong className="text-[color:var(--texto)]">{formatearCOP(alMes)} al mes</strong>{' '}
              {esEscalado ? 'en promedio' : ''} · en{' '}
              <strong className="text-[color:var(--texto)]">{semanasResueltas} semanas</strong> juntas{' '}
              {formatearCOP(resumen.total)}
            </>
          ),
        };

  const titulo = editando
    ? 'Editar reto'
    : esEscalado
    ? 'Reto escalado'
    : 'Ahorro semanal fijo';
  const subtitulo = esEscalado
    ? modo === 'al_reves'
      ? 'La cuota arranca alta y va bajando'
      : 'La cuota sube cada semana'
    : 'La misma cuota todas las semanas';

  const etq = 'text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              {esEscalado ? <TrendingUp className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold font-display text-[color:var(--texto)]">{titulo}</h2>
              <p className="text-[11px] text-[color:var(--texto-2)]">{subtitulo}</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-start gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Nombre del reto</label>
            <input
              type="text"
              value={nombre}
              placeholder={esEscalado ? 'Mi escalera de ahorro' : 'Mi meta de ahorro'}
              onChange={(e) => {
                setNombre(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder:text-[color:var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {/* Cómo va la cuota */}
          <div className="space-y-1.5">
            <label className={etq}>Cómo va la cuota</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => cambiarModo(m.id)}
                  className={`px-2 py-2 rounded-xl border text-center cursor-pointer transition-colors ${
                    modo === m.id
                      ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                      : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1 text-[11.5px] font-bold leading-tight">
                    {m.icono}
                    {m.etiqueta}
                  </span>
                  <span className="block text-[9.5px] opacity-80 mt-0.5">{m.ayuda}</span>
                </button>
              ))}
            </div>
          </div>

          {/* La mecánica, escrita */}
          <div className="p-3.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto-2)] leading-[2.4]">
            {esEscalado ? (
              <>
                Empiezas con{' '}
                <NumeroEnLinea
                  etiqueta="Aporte de la primera semana"
                  valor={pregunta === 'aporte' ? formatearCOP(arranqueResuelto) : arranqueStr}
                  calculado={pregunta === 'aporte'}
                  onChange={fmt(setArranqueStr)}
                />{' '}
                y cada semana le subes{' '}
                <NumeroEnLinea
                  etiqueta="Cuánto sube cada semana"
                  valor={escaleraResuelta ? formatearCOP(incrementoResuelto) : incrementoStr}
                  calculado={!!escaleraResuelta}
                  onChange={fmt(setIncrementoStr)}
                />{' '}
                durante{' '}
                <NumeroEnLinea
                  etiqueta="Semanas"
                  ancho="w-[62px]"
                  valor={pregunta === 'semanas' ? `${semanasResueltas}` : `${semanas}`}
                  calculado={pregunta === 'semanas'}
                  onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                    setSemanas(isNaN(n) ? 0 : Math.min(520, n));
                    if (error) setError('');
                  }}
                />{' '}
                semanas.
              </>
            ) : (
              <>
                Metes{' '}
                <NumeroEnLinea
                  etiqueta="Aporte semanal"
                  valor={pregunta === 'aporte' ? formatearCOP(arranqueResuelto) : arranqueStr}
                  calculado={pregunta === 'aporte'}
                  onChange={fmt(setArranqueStr)}
                />{' '}
                cada semana durante{' '}
                <NumeroEnLinea
                  etiqueta="Semanas"
                  ancho="w-[62px]"
                  valor={pregunta === 'semanas' ? `${semanasResueltas}` : `${semanas}`}
                  calculado={pregunta === 'semanas'}
                  onChange={(e) => {
                    const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                    setSemanas(isNaN(n) ? 0 : Math.min(520, n));
                    if (error) setError('');
                  }}
                />{' '}
                semanas.
              </>
            )}
          </div>

          {/* Atajos de semanas: sugerencias, no jaula */}
          {pregunta !== 'semanas' && (
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS_SEMANAS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setSemanas(v);
                    if (error) setError('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    semanas === v
                      ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                      : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                  }`}
                >
                  {v} sem
                </button>
              ))}
              <span className="text-[11px] text-[color:var(--texto-3)] ml-0.5">
                o las que quieras
              </span>
            </div>
          )}

          {/* Qué calcula Bolsillo */}
          <div className="space-y-1.5">
            <label className={etq}>¿Qué quieres que calcule?</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PREGUNTAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPregunta(p.id);
                    if (error) setError('');
                  }}
                  className={`px-2 py-2 rounded-xl border text-center cursor-pointer transition-colors ${
                    pregunta === p.id
                      ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                      : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                  }`}
                >
                  <span className="block text-[11.5px] font-bold leading-tight">{p.etiqueta}</span>
                  <span className="block text-[9.5px] opacity-80 mt-0.5">{p.ayuda}</span>
                </button>
              ))}
            </div>
          </div>

          {pregunta !== 'meta' && (
            <div className="space-y-1.5">
              <label className={etq}>¿A cuánto quieres llegar?</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={metaStr}
                  onChange={fmt(setMetaStr)}
                  placeholder="$0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
                <span className="absolute right-3.5 top-3 text-[10.5px] text-[color:var(--texto-3)] uppercase">
                  cop
                </span>
              </div>
            </div>
          )}

          {/* La respuesta */}
          <div
            className="p-3.5 rounded-xl border border-[var(--acento)]/30"
            style={{ background: 'color-mix(in srgb, var(--acento) 9%, transparent)' }}
          >
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--acento)]">
              {respuesta.rotulo}
            </span>
            <div className="font-display font-black text-[27px] leading-none tracking-tight text-[color:var(--texto)] mt-1">
              {respuesta.cifra}
              {respuesta.sufijo && (
                <span className="font-sans text-[13px] font-semibold text-[color:var(--texto-2)] ml-2 tracking-normal">
                  {respuesta.sufijo}
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-[color:var(--texto-2)] mt-1.5">{respuesta.pie}</p>
          </div>

          {/* La escalera: a esto te comprometes */}
          {esEscalado && resumen.meses.length > 1 && (
            <EscaleraMeses resumen={resumen} color={color} />
          )}

          {/* El aviso honesto */}
          {esEscalado && semanasResueltas > 1 && (
            <div
              className="p-3 rounded-xl border border-[var(--accion)]/25 text-[11.5px] text-[color:var(--texto-2)] leading-relaxed"
              style={{ background: 'color-mix(in srgb, var(--accion) 8%, transparent)' }}
            >
              <strong className="text-[color:var(--accion)] font-bold">Ojo: </strong>
              {modo === 'sube' ? (
                <>
                  <strong className="text-[color:var(--texto)]">
                    {Math.round(resumen.fraccionSegundaMitad * 100)}% de la plata
                  </strong>{' '}
                  la metes en la segunda mitad. La semana 1 son{' '}
                  {formatearCOP(aporteDeSemanaPlan(plan, 1))} y la semana {semanasResueltas} son{' '}
                  {formatearCOP(aporteDeSemanaPlan(plan, semanasResueltas))}.
                </>
              ) : (
                <>
                  El golpe es al principio: el primer mes te toca{' '}
                  <strong className="text-[color:var(--texto)]">
                    {formatearCOP(resumen.primerMes?.monto ?? 0)}
                  </strong>
                  , y para el final la semana queda en{' '}
                  {formatearCOP(aporteDeSemanaPlan(plan, semanasResueltas))}.
                </>
              )}{' '}
              Si te va a apretar, ponlo{' '}
              <button
                type="button"
                onClick={() => cambiarModo(modo === 'sube' ? 'al_reves' : 'sube')}
                className="font-bold text-[color:var(--accion)] underline cursor-pointer"
              >
                {modo === 'sube' ? 'al revés' : 'que suba'}
              </button>{' '}
              o{' '}
              <button
                type="button"
                onClick={() => cambiarModo('parejo')}
                className="font-bold text-[color:var(--accion)] underline cursor-pointer"
              >
                parejo en {formatearCOP(resumen.equivalenteParejo)}
              </button>{' '}
              — juntas lo mismo.
              <span className="block text-[color:var(--texto-3)] mt-1">
                Los meses de cinco semanas pesan más; por eso la escalera no sube parejita.
              </span>
            </div>
          )}

          {!esEscalado && ingresoMensual > 0 && alMes > 0 && (
            <div
              className="p-3 rounded-xl border border-[var(--accion)]/25 text-[11.5px] text-[color:var(--texto-2)] leading-relaxed"
              style={{ background: 'color-mix(in srgb, var(--accion) 8%, transparent)' }}
            >
              <strong className="text-[color:var(--accion)] font-bold">Ojo: </strong>
              son <strong className="text-[color:var(--texto)]">{formatearCOP(alMes)} al mes</strong>,
              el <strong className="text-[color:var(--texto)]">{pctIngreso}%</strong> de lo que
              llevas recibido este mes. Si aprieta, súbele las semanas.
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Color</label>
            <div className="flex items-center gap-2">
              {COLORES_RETO.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  style={{
                    background: c,
                    outline: color === c ? '2px solid var(--texto)' : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {editando && (
            <p className="text-[11px] text-[color:var(--texto-3)] leading-relaxed">
              Se conserva lo que ya llevas apartado ({formatearCOP(editando.acumulado)}) y tu racha.
            </p>
          )}

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              tamano="md"
              type="submit"
              iconoDerecha={editando ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {editando ? 'Guardar cambios' : 'Empezar reto'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
