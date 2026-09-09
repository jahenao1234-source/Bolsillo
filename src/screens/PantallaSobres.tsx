import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Mail,
  Wallet,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { Sobre } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { Chip } from '../components/ui/Chip';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones } from '../components/layout/shell';
import { NotaModulo } from '../components/ui/NotaModulo';

interface PantallaSobresProps {
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  onVolver: () => void;
}

const COLORES_SOBRE = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];

type ModoModal = 'crear' | 'editar' | 'alimentar';

export const PantallaSobres: React.FC<PantallaSobresProps> = ({
  sobres,
  totalApartado,
  saldoTotal,
  onGuardarSobre,
  onEliminarSobre,
  onVolver,
}) => {
  const [modal, setModal] = useState<{ modo: ModoModal; sobre: Sobre | null } | null>(null);
  const disponibleReal = saldoTotal - totalApartado;

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Crecer · Pro
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">
          Sobres digitales
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>
          {sobres.length} {sobres.length === 1 ? 'sobre' : 'sobres'}
        </Chip>
        {totalApartado > 0 && <Chip variante="aqua">{formatearCOP(totalApartado)} apartado</Chip>}
      </BarraTitulo>

      <BarraAcciones>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Nuevo sobre
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
              Sobres digitales
            </h1>
          </div>
        </div>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Sobre
        </Boton>
      </header>

      <Marco columnas="336px minmax(0,1fr)">
        <Columna ordenMovil={1} borde>
          <Zona>
            <Tarjeta padding="lg">
              <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-4 divide-y @2xl:divide-y-0 @2xl:divide-x divide-[var(--linea)]">
                <div className="space-y-1 sm:pr-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[color:var(--acento)]" />
                    Apartado
                  </span>
                  <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--acento)] tracking-tight">
                    {formatearCOP(totalApartado)}
                  </div>
                  <p className="text-xs text-[color:var(--texto-2)]">
                    en {sobres.length} sobre{sobres.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />
                    Disponible real
                  </span>
                  <div
                    className="font-display font-bold text-2xl sm:text-3xl tabular-nums tracking-tight"
                    style={{ color: disponibleReal >= 0 ? 'var(--positivo)' : 'var(--alerta)' }}
                  >
                    {formatearCOP(disponibleReal)}
                  </div>
                  <p className="text-xs text-[color:var(--texto-2)]">lo que puedes gastar sin tocar tus metas</p>
                </div>
                <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />
                    Saldo total
                  </span>
                  <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--texto)] tracking-tight">
                    {formatearCOP(saldoTotal)}
                  </div>
                  <p className="text-xs text-[color:var(--texto-2)]">suma de tus billeteras</p>
                </div>
              </div>
            </Tarjeta>
          </Zona>
          <Zona crece>
            <div className="xl:mt-auto">
              <NotaModulo texto="Aparta la plata de tus metas antes de gastarla: lo apartado deja de contar como disponible, así no lo tocas por error." />
            </div>
          </Zona>
        </Columna>

        <Columna ordenMovil={2}>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              {/* Lista de sobres */}
              {sobres.length === 0 ? (
                <Tarjeta padding="lg" className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                    <Mail className="w-7 h-7 text-[color:var(--acento)]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Aún no tienes sobres</h3>
                  <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
                    Aparta la plata de tus metas antes de gastarla, sin abrir más cuentas.
                  </p>
                  <div className="mt-5">
                    <Boton
                      variante="primario"
                      tamano="md"
                      icono={<Plus className="w-4 h-4" />}
                      onClick={() => setModal({ modo: 'crear', sobre: null })}
                    >
                      Crear mi primer sobre
                    </Boton>
                  </div>
                </Tarjeta>
              ) : (
                <div className="grid gap-3 @xl:grid-cols-2">
                  {sobres.map((s) => {
                    const color = s.color || 'var(--acento)';
                    const pct = s.meta && s.meta > 0 ? Math.min(100, (s.apartado / s.meta) * 100) : s.apartado > 0 ? 100 : 0;
                    const completo = s.meta ? s.apartado >= s.meta : false;
                    return (
                      <Tarjeta key={s.id} padding="md" bordeInteractivo>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                              <Mail className="w-4 h-4" style={{ color }} />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[color:var(--texto)] truncate">{s.nombre}</h3>
                              {s.meta ? (
                                <p className="text-xs text-[color:var(--texto-2)] flex items-center gap-1 mt-0.5">
                                  <Target className="w-3 h-3" /> Meta {formatearCOP(s.meta)}
                                </p>
                              ) : (
                                <p className="text-xs text-[color:var(--texto-3)] mt-0.5">Sin meta fija</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setModal({ modo: 'editar', sobre: s })}
                              className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                              aria-label={`Editar ${s.nombre}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEliminarSobre(s.id)}
                              className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                              aria-label={`Eliminar ${s.nombre}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between gap-2">
                          <span className="font-display font-bold text-lg tabular-nums" style={{ color }}>
                            {formatearCOP(s.apartado)}
                          </span>
                          {s.meta ? (
                            <span className="text-xs text-[color:var(--texto-2)] tabular-nums">
                              {completo ? '¡Meta lista! 🎉' : `${Math.round(pct)}%`}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(2, pct)}%`, background: color }}
                          />
                        </div>

                        <div className="mt-3">
                          <Boton
                            variante="secundario"
                            tamano="sm"
                            anchoCompleto
                            icono={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setModal({ modo: 'alimentar', sobre: s })}
                          >
                            Alimentar
                          </Boton>
                        </div>
                      </Tarjeta>
                    );
                  })}
                </div>
              )}

            </Scroll>
          </Zona>
        </Columna>
      </Marco>

      {modal && (
        <ModalSobre
          modo={modal.modo}
          sobre={modal.sobre}
          onCerrar={() => setModal(null)}
          onGuardar={(s) => {
            onGuardarSobre(s);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal crear / editar / alimentar sobre
// ============================================================
interface ModalSobreProps {
  modo: ModoModal;
  sobre: Sobre | null;
  onCerrar: () => void;
  onGuardar: (sobre: Sobre) => void;
}

const ModalSobre: React.FC<ModalSobreProps> = ({ modo, sobre, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState(sobre?.nombre || '');
  const [metaStr, setMetaStr] = useState(sobre?.meta ? formatearCOP(sobre.meta) : '');
  const [montoStr, setMontoStr] = useState(
    modo === 'editar' && sobre ? formatearCOP(sobre.apartado) : ''
  );
  const [color, setColor] = useState(sobre?.color || COLORES_SOBRE[0]);
  const [error, setError] = useState('');

  const num = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  const fmtOnChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setter(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const esAlimentar = modo === 'alimentar';
  const titulo = modo === 'crear' ? 'Nuevo sobre' : modo === 'editar' ? 'Editar sobre' : `Alimentar sobre`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (esAlimentar) {
      const suma = num(montoStr);
      if (suma <= 0) {
        setError('Escribe cuánto quieres apartar');
        return;
      }
      onGuardar({ ...(sobre as Sobre), apartado: (sobre?.apartado || 0) + suma });
      return;
    }
    if (!nombre.trim()) {
      setError('Ponle un nombre al sobre');
      return;
    }
    const nuevo: Sobre = {
      id: sobre?.id || `sobre-${Date.now()}`,
      nombre: nombre.trim(),
      meta: num(metaStr) > 0 ? num(metaStr) : undefined,
      apartado: modo === 'editar' ? num(montoStr) : num(montoStr),
      color,
      creadoEn: sobre?.creadoEn || new Date().toISOString(),
    };
    onGuardar(nuevo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[color:var(--texto)]">{titulo}</h2>
              {esAlimentar && sobre && <p className="text-xs text-[color:var(--texto-2)]">{sobre.nombre}</p>}
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

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {esAlimentar ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                ¿Cuánto apartas? <span className="text-[color:var(--alerta)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={montoStr}
                  onChange={fmtOnChange(setMontoStr)}
                  placeholder="$0"
                  autoFocus
                  className="w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xl font-bold font-display tabular-nums text-[color:var(--acento)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">COP</span>
              </div>
              {sobre && (
                <p className="text-xs text-[color:var(--texto-2)]">
                  Ahora tiene {formatearCOP(sobre.apartado)} · quedará en{' '}
                  <strong className="text-[color:var(--acento)]">{formatearCOP((sobre.apartado || 0) + num(montoStr))}</strong>
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Nombre del sobre <span className="text-[color:var(--alerta)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }}
                  placeholder="Ej: Fondo de emergencia"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                    Meta (opcional)
                  </label>
                  <input
                    type="text"
                    value={metaStr}
                    onChange={fmtOnChange(setMetaStr)}
                    placeholder="$0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                    Apartado ya
                  </label>
                  <input
                    type="text"
                    value={montoStr}
                    onChange={fmtOnChange(setMontoStr)}
                    placeholder="$0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {COLORES_SOBRE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-transform cursor-pointer"
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
            </>
          )}

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {esAlimentar ? 'Apartar' : modo === 'editar' ? 'Guardar' : 'Crear sobre'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
