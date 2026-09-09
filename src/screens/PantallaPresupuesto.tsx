import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  PieChart,
  Scale,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ArrowDownCircle,
} from 'lucide-react';
import { Presupuesto, GrupoPresupuesto, Billetera, Movimiento } from '../types';
import { CATEGORIAS_GASTOS_DEFECTO } from '../data/store';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { SelectorColor, COLORES_COMPONENTE } from '../components/ui/SelectorColor';
import { ModalRegistrarMovimiento } from '../components/billeteras/ModalRegistrarMovimiento';
import { formatearCOP } from '../utils/format';
import { Chip } from '../components/ui/Chip';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { NotaModulo } from '../components/ui/NotaModulo';

interface PantallaPresupuestoProps {
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  ingresoMensual: number;
  billeteras: Billetera[];
  onGuardarPresupuesto: (p: Presupuesto) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  onRegistrarMovimiento: (mov: Omit<Movimiento, 'id'>) => void;
  onVolver: () => void;
}

type EstadoTope = 'ok' | 'cerca' | 'excedido';
const estadoDe = (pct: number): EstadoTope => (pct >= 100 ? 'excedido' : pct >= 80 ? 'cerca' : 'ok');
const COLOR_ESTADO: Record<EstadoTope, string> = {
  ok: 'var(--positivo)',
  cerca: 'var(--accion)',
  excedido: 'var(--alerta)',
};

const GRUPOS: { id: GrupoPresupuesto; nombre: string; pct: number; desc: string; color: string }[] = [
  { id: 'necesidad', nombre: 'Necesidades', pct: 50, desc: 'Arriendo, comida, servicios, transporte', color: 'var(--acento)' },
  { id: 'gusto', nombre: 'Gustos', pct: 30, desc: 'Ocio, salidas, antojos, suscripciones', color: 'var(--accion)' },
  { id: 'ahorro', nombre: 'Ahorro y deudas', pct: 20, desc: 'Metas, sobres, abonos extra', color: 'var(--positivo)' },
];

export const PantallaPresupuesto: React.FC<PantallaPresupuestoProps> = ({
  presupuestos,
  gastoPorCategoria,
  ingresoMensual,
  billeteras,
  onGuardarPresupuesto,
  onEliminarPresupuesto,
  onRegistrarMovimiento,
  onVolver,
}) => {
  const cajonEmpuja = useCajonEmpuja();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Presupuesto | null>(null);
  const [gastoCategoria, setGastoCategoria] = useState<string | null>(null);

  const filas = useMemo(() => {
    return presupuestos
      .map((p) => {
        const gastado = gastoPorCategoria[p.categoria] || 0;
        const pct = p.tope > 0 ? (gastado / p.tope) * 100 : 0;
        return {
          ...p,
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

  // 50/30/20: gasto real por grupo
  const gastoPorGrupo = useMemo(() => {
    const acc: Record<GrupoPresupuesto, number> = { necesidad: 0, gusto: 0, ahorro: 0 };
    presupuestos.forEach((p) => {
      if (p.grupo) acc[p.grupo] += gastoPorCategoria[p.categoria] || 0;
    });
    return acc;
  }, [presupuestos, gastoPorCategoria]);

  const abrirNuevo = () => { setEditando(null); setModalAbierto(true); };
  const abrirEditar = (p: Presupuesto) => { setEditando(p); setModalAbierto(true); };

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Crecer · Pro
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">Presupuesto</h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>{presupuestos.length} topes</Chip>
        {totalTope > 0 && (
          <Chip variante={totalGastado > totalTope ? 'alerta' : 'neutro'}>
            {Math.round((totalGastado / totalTope) * 100)}% usado
          </Chip>
        )}
      </BarraTitulo>

      <BarraAcciones>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={abrirNuevo}>
          Nuevo tope
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
              Presupuesto
            </h1>
          </div>
        </div>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={abrirNuevo}>
          Tope
        </Boton>
      </header>

      {/* Los dos modos dejan de ser un interruptor: en pantalla ancha caben los
          dos a la vez, que es como se comparan. */}
      <Marco columnas={cajonEmpuja ? '320px minmax(0,1fr)' : '320px minmax(0,1fr) 328px'}>
        <Columna ordenMovil={1} borde>
          <Zona>
            <Tarjeta padding="lg" className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--linea)]">
                <div className="space-y-1 sm:pr-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Presupuestado</span>
                  <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--texto)] tracking-tight">{formatearCOP(totalTope)}</div>
                  <p className="text-xs text-[color:var(--texto-2)]">tope total del mes</p>
                </div>
                <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Gastado</span>
                  <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums tracking-tight text-[color:var(--texto)]">{formatearCOP(totalGastado)}</div>
                  <p className="text-xs text-[color:var(--texto-2)]">{Math.round(pctGlobal)}% de tu presupuesto</p>
                </div>
                <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Te queda</span>
                  <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums tracking-tight" style={{ color: totalRestante >= 0 ? 'var(--positivo)' : 'var(--alerta)' }}>{formatearCOP(totalRestante)}</div>
                  <p className="text-xs text-[color:var(--texto-2)]">{bajoControl} de {filas.length} bajo control</p>
                </div>
              </div>
              <div className="mt-5 h-2.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pctGlobal)}%`, background: totalRestante >= 0 ? 'var(--acento)' : 'var(--alerta)' }} />
              </div>
            </Tarjeta>
          </Zona>
          <Zona crece>
            <div className="xl:mt-auto">
              <NotaModulo texto="Ponle un límite a cada categoría (o reparte tu sueldo con la regla 50/30/20) y te aviso antes de que se te pase la mano." />
            </div>
          </Zona>
        </Columna>

        <Columna ordenMovil={2} borde={!cajonEmpuja}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* Lista de categorías */}
              {filas.length === 0 ? (
                <Tarjeta padding="lg" className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                    <PieChart className="w-7 h-7 text-[color:var(--acento)]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Aún no tienes topes</h3>
                  <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">Ponle un límite a tus categorías y Bolsillo te avisa antes de que se te pase la mano.</p>
                  <div className="mt-5">
                    <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={abrirNuevo}>Crear mi primer tope</Boton>
                  </div>
                </Tarjeta>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filas.map((f) => {
                    const color = f.color || COLOR_ESTADO[f.estado];
                    return (
                      <Tarjeta key={f.categoria} padding="md" bordeInteractivo>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: f.color || 'var(--texto-3)' }} />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[color:var(--texto)] truncate">{f.categoria}</h3>
                              <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                                {f.estado === 'excedido'
                                  ? <span className="text-[color:var(--alerta)] font-semibold">Te pasaste {formatearCOP(Math.abs(f.restante))}</span>
                                  : <>Te quedan <span className="font-semibold text-[color:var(--texto)]">{formatearCOP(f.restante)}</span></>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setGastoCategoria(f.categoria)} className="p-1.5 rounded-lg text-[color:var(--acento)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" title="Registrar gasto en esta categoría" aria-label={`Registrar gasto en ${f.categoria}`}>
                              <ArrowDownCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => abrirEditar(f)} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Editar ${f.categoria}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => onEliminarPresupuesto(f.categoria)} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Eliminar ${f.categoria}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between gap-2">
                          <span className="font-display font-bold text-lg tabular-nums" style={{ color: COLOR_ESTADO[f.estado] }}>{formatearCOP(f.gastado)}</span>
                          <span className="text-xs text-[color:var(--texto-2)] tabular-nums">de {formatearCOP(f.tope)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, Math.min(100, f.pct))}%`, background: f.estado === 'ok' ? color : COLOR_ESTADO[f.estado] }} />
                        </div>
                      </Tarjeta>
                    );
                  })}
                </div>
              )}
            </Scroll>
          </Zona>
        </Columna>

        <Columna ordenMovil={3} className={cajonEmpuja ? 'xl:hidden' : ''}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
                      <div className="space-y-4">
              <Tarjeta padding="lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">Tu ingreso del mes</span>
                    <div className="font-display font-bold text-2xl tabular-nums text-[color:var(--positivo)] tracking-tight mt-0.5">{formatearCOP(ingresoMensual)}</div>
                  </div>
                  <p className="text-xs text-[color:var(--texto-2)] max-w-[16rem] text-right">La regla reparte tu sueldo: 50% necesidades, 30% gustos, 20% ahorro y deudas.</p>
                </div>
              </Tarjeta>

              {ingresoMensual <= 0 && (
                <div className="p-3 rounded-xl bg-[var(--alerta)]/12 border border-[var(--alerta)]/25 flex items-start gap-2.5 text-xs text-[color:var(--alerta)]">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Registra un ingreso este mes (en Billeteras) para ver tu reparto ideal.</span>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                {GRUPOS.map((g) => {
                  const ideal = Math.round((ingresoMensual * g.pct) / 100);
                  const real = gastoPorGrupo[g.id];
                  const pct = ideal > 0 ? Math.min(100, (real / ideal) * 100) : 0;
                  const excedido = ideal > 0 && real > ideal;
                  const cats = presupuestos.filter((p) => p.grupo === g.id);
                  return (
                    <Tarjeta key={g.id} padding="md">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">{g.nombre}</h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: g.color, background: `color-mix(in srgb, ${g.color} 14%, transparent)` }}>{g.pct}%</span>
                      </div>
                      <p className="text-[11px] text-[color:var(--texto-3)] mt-0.5 leading-tight">{g.desc}</p>
                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <span className="font-display font-bold text-lg tabular-nums" style={{ color: excedido ? 'var(--alerta)' : g.color }}>{formatearCOP(real)}</span>
                        <span className="text-xs text-[color:var(--texto-2)] tabular-nums">ideal {formatearCOP(ideal)}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, background: excedido ? 'var(--alerta)' : g.color }} />
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: excedido ? 'var(--alerta)' : 'var(--texto-3)' }}>
                        {ideal <= 0 ? '—' : excedido ? `Te pasaste ${formatearCOP(real - ideal)}` : `Te caben ${formatearCOP(ideal - real)} más`}
                      </p>
                      {cats.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-[var(--hairline)] flex flex-wrap gap-1">
                          {cats.map((c) => (
                            <span key={c.categoria} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--superficie-2)] border border-[var(--linea)] text-[color:var(--texto-2)]">{c.categoria}</span>
                          ))}
                        </div>
                      )}
                    </Tarjeta>
                  );
                })}
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)] px-1">
                Asigna cada categoría a un grupo al crear o editar su tope. Las que no tengan grupo no cuentan en la regla.
              </p>
                      </div>
            </Scroll>
          </Zona>
        </Columna>
      </Marco>


      {modalAbierto && (
        <ModalTope
          editando={editando}
          categoriasUsadas={presupuestos.map((p) => p.categoria)}
          onCerrar={() => setModalAbierto(false)}
          onGuardar={(p) => { onGuardarPresupuesto(p); setModalAbierto(false); }}
        />
      )}

      {gastoCategoria && (
        <ModalRegistrarMovimiento
          abierto={true}
          billeteras={billeteras}
          categoriaPreseleccionada={gastoCategoria}
          tipoPreseleccionado="gasto"
          onCerrar={() => setGastoCategoria(null)}
          onGuardar={(mov) => { onRegistrarMovimiento(mov); setGastoCategoria(null); }}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal crear/editar tope (nombre propio · grupo · color)
// ============================================================
interface ModalTopeProps {
  editando: Presupuesto | null;
  categoriasUsadas: string[];
  onCerrar: () => void;
  onGuardar: (p: Presupuesto) => void;
}

const ModalTope: React.FC<ModalTopeProps> = ({ editando, categoriasUsadas, onCerrar, onGuardar }) => {
  const [categoria, setCategoria] = useState<string>(editando?.categoria || '');
  const [montoStr, setMontoStr] = useState<string>(editando ? formatearCOP(editando.tope) : '');
  const [grupo, setGrupo] = useState<GrupoPresupuesto>(editando?.grupo || 'necesidad');
  const [color, setColor] = useState<string>(editando?.color || COLORES_COMPONENTE[0]);
  const [error, setError] = useState('');

  const monto = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const sugerencias = CATEGORIAS_GASTOS_DEFECTO.filter((c) => !categoriasUsadas.includes(c));

  const onMonto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setMontoStr(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria.trim()) { setError('Ponle un nombre a la categoría'); return; }
    if (monto <= 0) { setError('Escribe un tope mayor a cero'); return; }
    onGuardar({ categoria: categoria.trim(), tope: monto, grupo, color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20"><PieChart className="w-4 h-4" /></div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">{editando ? 'Editar tope' : 'Nuevo tope'}</h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Categoría</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => { setCategoria(e.target.value); if (error) setError(''); }}
              placeholder="Ej: Comida, Mascota, Gimnasio..."
              disabled={!!editando}
              autoFocus={!editando}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors disabled:opacity-70"
            />
            {!editando && sugerencias.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sugerencias.map((s) => (
                  <button key={s} type="button" onClick={() => setCategoria(s)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--superficie-2)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer">{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Tope mensual <span className="text-[color:var(--alerta)]">*</span></label>
            <div className="relative">
              <input type="text" required value={montoStr} onChange={onMonto} placeholder="$0" className="w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xl font-bold font-display tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors" />
              <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">COP</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">Grupo (regla 50/30/20)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {GRUPOS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGrupo(g.id)}
                  className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${grupo === g.id ? 'text-[color:var(--texto)]' : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'}`}
                  style={grupo === g.id ? { borderColor: g.color, background: `color-mix(in srgb, ${g.color} 12%, transparent)` } : { borderColor: 'var(--linea)', background: 'var(--superficie-2)' }}
                >
                  {g.nombre.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <SelectorColor valor={color} onChange={setColor} label="Color" />

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cancelar</Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>{editando ? 'Guardar' : 'Crear tope'}</Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
