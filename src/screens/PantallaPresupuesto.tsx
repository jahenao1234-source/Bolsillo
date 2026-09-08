import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  PieChart,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Presupuesto } from '../types';
import { CATEGORIAS_GASTOS_DEFECTO } from '../data/store';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { NotaModulo } from '../components/ui/NotaModulo';

interface PantallaPresupuestoProps {
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  onGuardarPresupuesto: (categoria: string, tope: number) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  onVolver: () => void;
}

type EstadoTope = 'ok' | 'cerca' | 'excedido';

function estadoDe(pct: number): EstadoTope {
  if (pct >= 100) return 'excedido';
  if (pct >= 80) return 'cerca';
  return 'ok';
}

const COLOR_ESTADO: Record<EstadoTope, string> = {
  ok: 'var(--positivo)',
  cerca: 'var(--accion)',
  excedido: 'var(--alerta)',
};

export const PantallaPresupuesto: React.FC<PantallaPresupuestoProps> = ({
  presupuestos,
  gastoPorCategoria,
  onGuardarPresupuesto,
  onEliminarPresupuesto,
  onVolver,
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Presupuesto | null>(null);

  const filas = useMemo(() => {
    return presupuestos
      .map((p) => {
        const gastado = gastoPorCategoria[p.categoria] || 0;
        const pct = p.tope > 0 ? (gastado / p.tope) * 100 : 0;
        return {
          categoria: p.categoria,
          tope: p.tope,
          gastado,
          restante: p.tope - gastado,
          pct,
          estado: estadoDe(pct),
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [presupuestos, gastoPorCategoria]);

  const totalTope = filas.reduce((s, f) => s + f.tope, 0);
  const totalGastado = filas.reduce((s, f) => s + f.gastado, 0);
  const totalRestante = totalTope - totalGastado;
  const pctGlobal = totalTope > 0 ? Math.min(100, (totalGastado / totalTope) * 100) : 0;
  const bajoControl = filas.filter((f) => f.estado === 'ok').length;

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };
  const abrirEditar = (p: Presupuesto) => {
    setEditando(p);
    setModalAbierto(true);
  };

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
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Crecer · Pro
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Presupuesto
            </h1>
          </div>
        </div>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={abrirNuevo}>
          Nuevo tope
        </Boton>
      </header>

      <NotaModulo texto="Ponle un límite a cada categoría y te aviso antes de que se te pase la mano. Menos sustos a fin de mes." />

      {/* Resumen */}
      <Tarjeta padding="lg" className="overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--linea)]">
          <div className="space-y-1 sm:pr-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">
              Presupuestado
            </span>
            <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--texto)] tracking-tight">
              {formatearCOP(totalTope)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">tope total de Septiembre</p>
          </div>
          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">
              Gastado
            </span>
            <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums tracking-tight text-[color:var(--texto)]">
              {formatearCOP(totalGastado)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">
              {Math.round(pctGlobal)}% de tu presupuesto
            </p>
          </div>
          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">
              Te queda
            </span>
            <div
              className="font-display font-bold text-2xl sm:text-3xl tabular-nums tracking-tight"
              style={{ color: totalRestante >= 0 ? 'var(--positivo)' : 'var(--alerta)' }}
            >
              {formatearCOP(totalRestante)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">
              {bajoControl} de {filas.length} categoría{filas.length === 1 ? '' : 's'} bajo control
            </p>
          </div>
        </div>

        {/* Barra global */}
        <div className="mt-5 h-2.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(2, pctGlobal)}%`,
              background: totalRestante >= 0 ? 'var(--acento)' : 'var(--alerta)',
            }}
          />
        </div>
      </Tarjeta>

      {/* Lista de categorías */}
      {filas.length === 0 ? (
        <Tarjeta padding="lg" className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-[var(--acento-tenue)] grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
            <PieChart className="w-7 h-7 text-[color:var(--acento)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Aún no tienes topes</h3>
          <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
            Ponle un límite a tus categorías y Bolsillo te avisa antes de que se te pase la mano.
          </p>
          <div className="mt-5">
            <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={abrirNuevo}>
              Crear mi primer tope
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filas.map((f) => (
            <Tarjeta key={f.categoria} padding="md" bordeInteractivo>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[color:var(--texto)] truncate">{f.categoria}</h3>
                  <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                    {f.estado === 'excedido' ? (
                      <span className="text-[color:var(--alerta)] font-semibold">
                        Te pasaste {formatearCOP(Math.abs(f.restante))}
                      </span>
                    ) : (
                      <>Te quedan <span className="font-semibold text-[color:var(--texto)]">{formatearCOP(f.restante)}</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => abrirEditar({ categoria: f.categoria, tope: f.tope })}
                    className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                    aria-label={`Editar tope de ${f.categoria}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEliminarPresupuesto(f.categoria)}
                    className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                    aria-label={`Eliminar tope de ${f.categoria}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <span className="font-display font-bold text-lg tabular-nums" style={{ color: COLOR_ESTADO[f.estado] }}>
                  {formatearCOP(f.gastado)}
                </span>
                <span className="text-xs text-[color:var(--texto-2)] tabular-nums">de {formatearCOP(f.tope)}</span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, Math.min(100, f.pct))}%`, background: COLOR_ESTADO[f.estado] }}
                />
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalTope
          editando={editando}
          categoriasUsadas={presupuestos.map((p) => p.categoria)}
          onCerrar={() => setModalAbierto(false)}
          onGuardar={(cat, tope) => {
            onGuardarPresupuesto(cat, tope);
            setModalAbierto(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal para crear/editar un tope
// ============================================================
interface ModalTopeProps {
  editando: Presupuesto | null;
  categoriasUsadas: string[];
  onCerrar: () => void;
  onGuardar: (categoria: string, tope: number) => void;
}

const ModalTope: React.FC<ModalTopeProps> = ({ editando, categoriasUsadas, onCerrar, onGuardar }) => {
  const disponibles = CATEGORIAS_GASTOS_DEFECTO.filter(
    (c) => c === editando?.categoria || !categoriasUsadas.includes(c)
  );
  const [categoria, setCategoria] = useState<string>(editando?.categoria || disponibles[0] || 'Otro');
  const [montoStr, setMontoStr] = useState<string>(editando ? formatearCOP(editando.tope) : '');
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
    if (monto <= 0) {
      setError('Escribe un tope mayor a cero');
      return;
    }
    onGuardar(categoria, monto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <PieChart className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">
              {editando ? 'Editar tope' : 'Nuevo tope'}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              disabled={!!editando}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors appearance-none cursor-pointer disabled:opacity-70"
            >
              {(editando ? [editando.categoria] : disponibles).map((c) => (
                <option key={c} value={c} className="bg-[var(--superficie)] text-[color:var(--texto)]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Tope mensual <span className="text-[color:var(--alerta)]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={montoStr}
                onChange={onMonto}
                placeholder="$0"
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xl font-bold font-display tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">COP</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {editando ? 'Guardar' : 'Crear tope'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
