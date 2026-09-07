import React, { useState } from 'react';
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
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { RetoAhorro, TipoReto } from '../types';
import { aporteSemanaDe } from '../data/store';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { CountUp } from '../components/ui/CountUp';
import { ConfetiCelebracion } from '../components/ui/ConfetiCelebracion';
import { formatearCOP } from '../utils/format';

interface PantallaRetosProps {
  retos: RetoAhorro[];
  onGuardarReto: (reto: RetoAhorro) => void;
  onEliminarReto: (id: string) => void;
  onAportarReto: (id: string) => { exito: boolean; aporte: number; completado: boolean; acumulado: number };
  onVolver: () => void;
}

const COLORES_RETO = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];
const PRESETS_SEMANAS = [12, 26, 52];
const sumaHasta = (n: number) => (n * (n + 1)) / 2;

export const PantallaRetos: React.FC<PantallaRetosProps> = ({
  retos,
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
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto animate-screen-enter">
      <ConfetiCelebracion
        activo={confeti.activo}
        mensaje={confeti.mensaje}
        onTerminar={() => setConfeti({ activo: false, mensaje: '' })}
      />

      {/* Cabecera */}
      <header className="flex items-center justify-between gap-3 pt-1">
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
                        <><TrendingUp className="w-3 h-3" /> Sube cada semana</>
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

      {/* Empieza un reto */}
      <div>
        <div className="flex items-baseline justify-between px-1 mb-3">
          <h2 className="font-display font-bold text-base text-[color:var(--texto)]">
            {activos.length > 0 ? 'Empieza otro reto' : 'Empieza un reto'}
          </h2>
          <span className="text-xs text-[color:var(--texto-3)]">elige tu ritmo</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
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

      {/* Retos cumplidos */}
      {completados.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 px-1 mb-3">
            <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Cumplidos</h2>
            <span className="text-xs text-[color:var(--positivo)]">{completados.length} 🎉</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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

      {modal && (
        <ModalReto
          tipo={modal.tipo}
          editando={modal.editando}
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
// ============================================================
interface ModalRetoProps {
  tipo: TipoReto;
  editando: RetoAhorro | null;
  onCerrar: () => void;
  onGuardar: (reto: RetoAhorro) => void;
}

const ModalReto: React.FC<ModalRetoProps> = ({ tipo, editando, onCerrar, onGuardar }) => {
  const esEscalado = tipo === 'escalado';
  const [nombre, setNombre] = useState(
    editando?.nombre || (esEscalado ? 'Reto escalado' : 'Mi meta de ahorro')
  );
  const [baseStr, setBaseStr] = useState(
    esEscalado ? formatearCOP(editando?.aporteBase ?? 2000) : ''
  );
  const [semanas, setSemanas] = useState<number>(esEscalado ? editando?.semanasTotales ?? 52 : 20);
  const [aporteStr, setAporteStr] = useState(
    !esEscalado ? formatearCOP(editando?.aporteBase ?? 50000) : ''
  );
  const [metaStr, setMetaStr] = useState(
    !esEscalado ? formatearCOP(editando?.metaTotal ?? 1000000) : ''
  );
  const [color, setColor] = useState(editando?.color || COLORES_RETO[0]);
  const [error, setError] = useState('');

  const num = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  const fmt = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setter(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const base = num(baseStr);
  const aporte = num(aporteStr);
  const meta = num(metaStr);
  const metaCalculada = esEscalado ? base * sumaHasta(semanas) : meta;
  const semanasTotales = esEscalado ? semanas : aporte > 0 ? Math.max(1, Math.ceil(meta / aporte)) : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ponle un nombre al reto'); return; }
    if (esEscalado && (base <= 0 || semanas < 1)) { setError('Elige el aporte base y las semanas'); return; }
    if (!esEscalado && (aporte <= 0 || meta <= 0)) { setError('Escribe el aporte y la meta'); return; }

    const aporteBase = esEscalado ? base : aporte;

    if (editando) {
      // Conservar progreso; recalcular meta/semanas y estado
      const semanaActual = Math.min(editando.semanaActual, semanasTotales + 1);
      const completado = editando.acumulado >= metaCalculada || semanaActual > semanasTotales;
      onGuardar({
        ...editando,
        nombre: nombre.trim(),
        aporteBase,
        metaTotal: metaCalculada,
        semanasTotales,
        semanaActual,
        completado,
        color,
      });
      return;
    }

    onGuardar({
      id: `reto-${Date.now()}`,
      nombre: nombre.trim(),
      tipo,
      aporteBase,
      metaTotal: metaCalculada,
      semanasTotales,
      semanaActual: 1,
      acumulado: 0,
      racha: 0,
      completado: false,
      color,
      creadoEn: new Date().toISOString(),
    });
  };

  const titulo = editando ? 'Editar reto' : esEscalado ? 'Reto escalado' : 'Ahorro semanal fijo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">{titulo}</h2>
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
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Nombre del reto
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {esEscalado ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  ¿Cuántas semanas?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS_SEMANAS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setSemanas(v); if (error) setError(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        semanas === v
                          ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                          : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                      }`}
                    >
                      {v} sem
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={104}
                    value={semanas}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setSemanas(isNaN(n) ? 0 : Math.min(104, Math.max(0, n)));
                      if (error) setError('');
                    }}
                    className="w-20 px-3 py-1.5 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] text-xs font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                    aria-label="Número de semanas personalizado"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Aporte base (semana 1)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {[1000, 2000, 5000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBaseStr(formatearCOP(v))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        base === v
                          ? 'bg-[var(--acento)]/12 border-[var(--acento)] text-[color:var(--acento)]'
                          : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                      }`}
                    >
                      {formatearCOP(v)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={baseStr}
                    onChange={fmt(setBaseStr)}
                    placeholder="$0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-[color:var(--texto-2)] uppercase">COP</span>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Aporte semanal
                </label>
                <input
                  type="text"
                  value={aporteStr}
                  onChange={fmt(setAporteStr)}
                  placeholder="$0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Meta
                </label>
                <input
                  type="text"
                  value={metaStr}
                  onChange={fmt(setMetaStr)}
                  placeholder="$0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 rounded-xl border border-[var(--acento)]/20 flex items-center gap-2.5" style={{ background: 'color-mix(in srgb, var(--acento) 8%, transparent)' }}>
            <Target className="w-4 h-4 text-[color:var(--acento)] flex-shrink-0" />
            <p className="text-xs text-[color:var(--texto)]">
              Juntarás <strong className="text-[color:var(--acento)] tabular-nums">{formatearCOP(metaCalculada)}</strong>
              {semanasTotales > 0 && <> en <strong>{semanasTotales}</strong> semana{semanasTotales === 1 ? '' : 's'}</>}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Color</label>
            <div className="flex items-center gap-2">
              {COLORES_RETO.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full cursor-pointer"
                  style={{ background: c, outline: color === c ? '2px solid var(--texto)' : '2px solid transparent', outlineOffset: '2px' }}
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
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cancelar</Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={editando ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}>
              {editando ? 'Guardar cambios' : 'Empezar reto'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
