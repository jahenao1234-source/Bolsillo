import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { TarjetaCredito } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { NotaModulo } from '../components/ui/NotaModulo';

interface PantallaTarjetasProps {
  tarjetas: TarjetaCredito[];
  onGuardarTarjeta: (tc: TarjetaCredito) => void;
  onEliminarTarjeta: (id: string) => void;
  onVolver: () => void;
}

const COLORES = ['#FF7A3D', '#25C9BE', '#5FE0A8', '#8AA9FF', '#F2C879', '#E89385'];
const MAX_DIAS = 51; // referencia visual del máximo de días sin intereses

const HOY = new Date();
const DIA_HOY = HOY.getDate();
const DIAS_MES = new Date(HOY.getFullYear(), HOY.getMonth() + 1, 0).getDate();

function diasHasta(diaObjetivo: number): number {
  const d = Math.min(diaObjetivo, DIAS_MES);
  const diff = d - DIA_HOY;
  return diff >= 0 ? diff : diff + DIAS_MES;
}

/** Días sin intereses si compro HOY con esta tarjeta. */
function diasSinIntereses(tc: TarjetaCredito): number {
  const diasAlCorte = diasHasta(tc.diaCorte);
  const plazoCortePago = ((tc.diaPago - tc.diaCorte + DIAS_MES) % DIAS_MES) || DIAS_MES;
  return diasAlCorte + plazoCortePago;
}

export const PantallaTarjetas: React.FC<PantallaTarjetasProps> = ({
  tarjetas,
  onGuardarTarjeta,
  onEliminarTarjeta,
  onVolver,
}) => {
  const [modal, setModal] = useState<{ editando: TarjetaCredito | null } | null>(null);

  const conDias = useMemo(
    () => tarjetas.map((t) => ({ tc: t, dias: diasSinIntereses(t) })).sort((a, b) => b.dias - a.dias),
    [tarjetas]
  );
  const recomendada = conDias[0];

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
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">Tarjetas y corte</h1>
          </div>
        </div>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
          Nueva
        </Boton>
      </header>

      <NotaModulo texto="Sabe con cuál tarjeta comprar hoy para estirar al máximo tus días sin intereses." />

      {/* Recomendación de hoy */}
      {recomendada && (
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
                {recomendada.tc.nombre}
              </h2>
              <div className="text-right">
                <div className="font-display font-black text-2xl tabular-nums text-[color:var(--acento)]">
                  {recomendada.dias} días
                </div>
                <div className="text-xs text-[color:var(--texto-2)]">sin intereses</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-[color:var(--texto-2)] leading-relaxed max-w-lg">
              Acaba de pasar (o está por pasar) su corte, así que ganas el mayor plazo antes de pagar.
            </p>
          </div>
        </Tarjeta>
      )}

      {/* Lista */}
      {tarjetas.length === 0 ? (
        <Tarjeta padding="lg" className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
            <CreditCard className="w-7 h-7 text-[color:var(--acento)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Aún no tienes tarjetas</h3>
          <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
            Guarda el día de corte y de pago de cada tarjeta y te digo con cuál conviene comprar hoy.
          </p>
          <div className="mt-5">
            <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
              Agregar tarjeta
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {conDias.map(({ tc, dias }, i) => {
            const color = tc.color || 'var(--acento)';
            const pct = Math.min(100, (dias / MAX_DIAS) * 100);
            const esRecomendada = i === 0 && tarjetas.length > 1;
            return (
              <Tarjeta key={tc.id} padding="md" bordeInteractivo>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                      <CreditCard className="w-4 h-4" style={{ color }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[color:var(--texto)] truncate flex items-center gap-1.5">
                        {tc.nombre}
                        {esRecomendada && <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--acento)]">· hoy</span>}
                      </h3>
                      <p className="text-xs text-[color:var(--texto-2)]">Corta el {tc.diaCorte} · paga el {tc.diaPago}</p>
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

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-[color:var(--texto-2)]">Si compras hoy</span>
                  <span className="font-display font-bold text-lg tabular-nums" style={{ color }}>
                    {dias} <span className="text-xs font-medium text-[color:var(--texto-2)]">días sin interés</span>
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(3, pct)}%`, background: color }} />
                </div>

                {tc.cupo != null && tc.cupo > 0 && (
                  <p className="mt-2.5 text-xs text-[color:var(--texto-3)]">Cupo: {formatearCOP(tc.cupo)}</p>
                )}
              </Tarjeta>
            );
          })}
        </div>
      )}

      {/* Explicación */}
      {tarjetas.length > 0 && (
        <div className="flex items-start gap-2.5 px-1 text-xs text-[color:var(--texto-3)]">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[color:var(--acento)]" />
          <span>
            Los días sin intereses se calculan desde hoy hasta tu próximo corte más el plazo de pago del banco. Comprar justo después del corte te da el mayor plazo.
          </span>
        </div>
      )}

      {modal && (
        <ModalTarjeta
          editando={modal.editando}
          onCerrar={() => setModal(null)}
          onGuardar={(tc) => { onGuardarTarjeta(tc); setModal(null); }}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal crear / editar tarjeta
// ============================================================
interface ModalTarjetaProps {
  editando: TarjetaCredito | null;
  onCerrar: () => void;
  onGuardar: (tc: TarjetaCredito) => void;
}

const ModalTarjeta: React.FC<ModalTarjetaProps> = ({ editando, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState(editando?.nombre || '');
  const [diaCorte, setDiaCorte] = useState<number>(editando?.diaCorte || 1);
  const [diaPago, setDiaPago] = useState<number>(editando?.diaPago || 1);
  const [cupoStr, setCupoStr] = useState(editando?.cupo ? formatearCOP(editando.cupo) : '');
  const [color, setColor] = useState(editando?.color || COLORES[0]);
  const [error, setError] = useState('');

  const cupo = parseInt(cupoStr.replace(/[^\d]/g, ''), 10) || 0;
  const onCupo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setCupoStr(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const previewDias = (() => {
    const plazo = ((diaPago - diaCorte + DIAS_MES) % DIAS_MES) || DIAS_MES;
    return diasHasta(diaCorte) + plazo;
  })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ponle un nombre a la tarjeta'); return; }
    onGuardar({
      id: editando?.id || `tc-${Date.now()}`,
      nombre: nombre.trim(),
      diaCorte,
      diaPago,
      cupo: cupo > 0 ? cupo : undefined,
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
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">{editando ? 'Editar tarjeta' : 'Nueva tarjeta'}</h2>
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
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Nombre de la tarjeta</label>
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }} placeholder="Ej: Visa Bancolombia" autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Día de corte</label>
              <input type="number" min={1} max={31} value={diaCorte} onChange={(e) => setDiaCorte(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Día de pago</label>
              <input type="number" min={1} max={31} value={diaPago} onChange={(e) => setDiaPago(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Cupo (opcional)</label>
            <input type="text" value={cupoStr} onChange={onCupo} placeholder="$0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-xl border border-[var(--acento)]/20 flex items-center gap-2.5" style={{ background: 'color-mix(in srgb, var(--acento) 8%, transparent)' }}>
            <Sparkles className="w-4 h-4 text-[color:var(--acento)] flex-shrink-0" />
            <p className="text-xs text-[color:var(--texto)]">
              Comprando hoy tendrías <strong className="text-[color:var(--acento)] tabular-nums">{previewDias} días</strong> sin intereses.
            </p>
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
