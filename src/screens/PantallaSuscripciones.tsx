import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Repeat,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { Suscripcion } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';

interface PantallaSuscripcionesProps {
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  onVolver: () => void;
}

const COLORES = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879', '#E89385'];

const HOY = new Date();
const DIA_HOY = HOY.getDate();
const DIAS_MES = new Date(HOY.getFullYear(), HOY.getMonth() + 1, 0).getDate();

function diasHastaCobro(diaCobro: number): number {
  const d = Math.min(diaCobro, DIAS_MES);
  const diff = d - DIA_HOY;
  return diff >= 0 ? diff : diff + DIAS_MES;
}

function etiquetaCobro(dias: number): string {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

export const PantallaSuscripciones: React.FC<PantallaSuscripcionesProps> = ({
  suscripciones,
  sangradoMensual,
  onGuardarSuscripcion,
  onEliminarSuscripcion,
  onVolver,
}) => {
  const [modal, setModal] = useState<{ editando: Suscripcion | null } | null>(null);

  const ordenadas = useMemo(() => {
    return [...suscripciones].sort((a, b) => {
      if (a.activa !== b.activa) return a.activa ? -1 : 1;
      return diasHastaCobro(a.diaCobro) - diasHastaCobro(b.diaCobro);
    });
  }, [suscripciones]);

  const activas = suscripciones.filter((s) => s.activa);
  const sangradoAnual = sangradoMensual * 12;
  const proxima = ordenadas.find((s) => s.activa);

  const toggleActiva = (s: Suscripcion) => onGuardarSuscripcion({ ...s, activa: !s.activa });

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto animate-screen-enter">
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
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">Crecer · Pro</span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">Suscripciones</h1>
          </div>
        </div>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
          Nueva
        </Boton>
      </header>

      {/* Resumen del sangrado */}
      <Tarjeta padding="lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--linea)]">
          <div className="space-y-1 sm:pr-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Te sangra al mes</span>
            <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--alerta)] tracking-tight">
              {formatearCOP(sangradoMensual)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">{activas.length === 1 ? '1 suscripción activa' : `${activas.length} suscripciones activas`}</p>
          </div>
          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Al año</span>
            <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--alerta)] tracking-tight">
              {formatearCOP(sangradoAnual)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">lo que se van estos cobros en 12 meses</p>
          </div>
          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              Próximo cobro
            </span>
            {proxima ? (
              <>
                <div className="font-display font-bold text-lg text-[color:var(--texto)] tracking-tight truncate">{proxima.nombre}</div>
                <p className="text-xs text-[color:var(--texto-2)]">
                  {etiquetaCobro(diasHastaCobro(proxima.diaCobro)).toLowerCase()} · {formatearCOP(proxima.monto)}
                </p>
              </>
            ) : (
              <div className="text-sm text-[color:var(--texto-2)] pt-1">Sin cobros activos</div>
            )}
          </div>
        </div>
      </Tarjeta>

      {/* Lista */}
      {suscripciones.length === 0 ? (
        <Tarjeta padding="lg" className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
            <Repeat className="w-7 h-7 text-[color:var(--acento)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Sin suscripciones registradas</h3>
          <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
            Anota tus cobros automáticos y descubre cuánto se te va cada mes sin darte cuenta.
          </p>
          <div className="mt-5">
            <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
              Agregar la primera
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {ordenadas.map((s) => {
            const color = s.color || 'var(--acento)';
            const dias = diasHastaCobro(s.diaCobro);
            const urgente = s.activa && dias <= 3;
            return (
              <Tarjeta key={s.id} padding="md" bordeInteractivo className={s.activa ? '' : 'opacity-60'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                      <Repeat className="w-4 h-4" style={{ color }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[color:var(--texto)] truncate">{s.nombre}</h3>
                      <p className="text-xs text-[color:var(--texto-2)] truncate">
                        {s.categoria || 'Suscripción'} · cobra el {s.diaCobro}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setModal({ editando: s })} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Editar ${s.nombre}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onEliminarSuscripcion(s.id)} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Eliminar ${s.nombre}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-lg tabular-nums text-[color:var(--texto)]">
                    {formatearCOP(s.monto)}<span className="text-xs font-medium text-[color:var(--texto-2)]">/mes</span>
                  </span>
                  {s.activa ? (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        color: urgente ? 'var(--accion)' : 'var(--texto-2)',
                        background: urgente ? 'color-mix(in srgb, var(--accion) 12%, transparent)' : 'var(--superficie-2)',
                        border: `1px solid ${urgente ? 'color-mix(in srgb, var(--accion) 30%, transparent)' : 'var(--linea)'}`,
                      }}
                    >
                      {etiquetaCobro(dias)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-[color:var(--texto-3)] bg-[var(--superficie-2)] border border-[var(--linea)]">
                      Pausada
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleActiva(s)}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)]"
                >
                  {s.activa ? 'Pausar' : 'Reactivar'}
                </button>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalSuscripcion
          editando={modal.editando}
          onCerrar={() => setModal(null)}
          onGuardar={(s) => { onGuardarSuscripcion(s); setModal(null); }}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal crear / editar suscripción
// ============================================================
const CATEGORIAS_SUS = ['Streaming', 'Música', 'Salud', 'Software', 'Otro'];

interface ModalSuscripcionProps {
  editando: Suscripcion | null;
  onCerrar: () => void;
  onGuardar: (s: Suscripcion) => void;
}

const ModalSuscripcion: React.FC<ModalSuscripcionProps> = ({ editando, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState(editando?.nombre || '');
  const [montoStr, setMontoStr] = useState(editando ? formatearCOP(editando.monto) : '');
  const [dia, setDia] = useState<number>(editando?.diaCobro || 1);
  const [categoria, setCategoria] = useState(editando?.categoria || 'Streaming');
  const [color, setColor] = useState(editando?.color || COLORES[0]);
  const [error, setError] = useState('');

  const monto = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const onMonto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setMontoStr(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ponle un nombre'); return; }
    if (monto <= 0) { setError('Escribe el monto del cobro'); return; }
    onGuardar({
      id: editando?.id || `sus-${Date.now()}`,
      nombre: nombre.trim(),
      monto,
      diaCobro: dia,
      categoria,
      activa: editando?.activa ?? true,
      color,
      creadoEn: editando?.creadoEn || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">{editando ? 'Editar suscripción' : 'Nueva suscripción'}</h2>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }} placeholder="Ej: Netflix" autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Monto mensual</label>
              <div className="relative">
                <input type="text" value={montoStr} onChange={onMonto} placeholder="$0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Día de cobro</label>
              <input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors appearance-none cursor-pointer">
              {CATEGORIAS_SUS.map((c) => <option key={c} value={c} className="bg-[var(--superficie)]">{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Color</label>
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
