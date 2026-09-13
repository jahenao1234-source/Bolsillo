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
import { ModalSobre, ModoModal } from '../components/sobres/ModalSobre';

interface PantallaSobresProps {
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  onVolver: () => void;
}

const COLORES_SOBRE = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];

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
  const sobresPropios = sobres.filter(s => !s.grupo && !s.sistema);

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
          {sobresPropios.length} {sobresPropios.length === 1 ? 'sobre' : 'sobres'}
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
              {sobresPropios.length === 0 ? (
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
                <div className="grid gap-3">
                  {sobresPropios.map((s) => {
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
                            onClick={() => setModal({ modo: 'editar', sobre: s })}
                          >
                            Editar
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

