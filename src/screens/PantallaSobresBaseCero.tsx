import React, { useState } from 'react';
import { ArrowLeft, Plus, Target, Check, AlertTriangle, ChevronRight, Mail, RotateCcw } from 'lucide-react';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo } from '../components/layout/shell';
import { Boton } from '../components/ui/Boton';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { ModalSobre, ModoModal } from '../components/sobres/ModalSobre';
import { formatearCOP } from '../utils/format';
import { useBolsilloData } from '../hooks/useBolsilloData';
import { Sobre, Movimiento, Deuda } from '../types';
import {
  estadoBaseCero,
  gastadoDelMes,
  movidoEsteMes,
  ID_BASICO_MERCADO,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  MODULOS_LISTOS,
  metaFondoBlindado,
  repartoPro,
} from '../logic/sistema';

interface PantallaSobresBaseCeroProps {
  onVolver: () => void;
  onIrAMiPlan?: () => void;
}

export const PantallaSobresBaseCero: React.FC<PantallaSobresBaseCeroProps> = ({ onVolver, onIrAMiPlan }) => {
  const {
    perfilFlujo,
    sobres,
    deudas,
    movimientos,
    repartirBasicosDeNuevo,
    guardarSobre,
    eliminarSobre,
    aportarASobre,
  } = useBolsilloData();

  const [modal, setModal] = useState<{ modo: ModoModal; sobre: Sobre | null } | null>(null);

  const hoy = new Date();
  const estado = estadoBaseCero(perfilFlujo, sobres, deudas);
  const basicos = sobres.filter((s) => s.grupo === 'basico');
  const libres = sobres.filter((s) => s.grupo === 'libre');
  const propios = sobres.filter((s) => !s.grupo);
  
  const totalBasicos = basicos.reduce((a, s) => a + (s.presupuestoMensual || 0), 0);
  
  // Reparto Libre calculado (si no hay deudas)
  const metaFondo = perfilFlujo ? metaFondoBlindado(perfilFlujo.gastosBasicos) : 0;
  const colchonSobre = sobres.find(s => s.id === ID_SOBRE_COLCHON);
  const colchonApartado = colchonSobre ? colchonSobre.apartado : 0;
  const reparto = repartoPro(estado.libre, colchonApartado, metaFondo);

  const renderLineaBaseCero = () => {
    return (
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[color:var(--texto)]">
          Base Cero
        </h2>
        <Tarjeta padding="md" bordeInteractivo>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold tabular-nums text-[color:var(--texto)]">
              {formatearCOP(totalBasicos)} lo básico + {formatearCOP(estado.deudasActivas ? estado.paraDeudas : estado.libre)} {estado.deudasActivas ? 'a tu plan de deudas' : 'lo libre'} = {formatearCOP(estado.ingreso)}
              {!estado.deudasActivas && estado.porAsignar === 0 && ' · $0 sin dueño'}
            </div>
            {estado.porAsignar !== 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-2 text-[color:var(--alerta)] text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" /> 
                  {estado.porAsignar > 0 
                    ? `Te faltan ${formatearCOP(estado.porAsignar)} por asignar en lo básico`
                    : `Asignaste ${formatearCOP(Math.abs(estado.porAsignar))} de más en lo básico`}
                </div>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  icono={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => repartirBasicosDeNuevo(perfilFlujo)}
                >
                  Repartir de nuevo
                </Boton>
              </div>
            )}
          </div>
        </Tarjeta>
      </div>
    );
  };

  const renderFilaBasica = (s: Sobre) => {
    const presupuesto = s.presupuestoMensual || 0;
    const gastado = gastadoDelMes(s, movimientos, hoy);
    const disponible = presupuesto - gastado;
    const color = s.color || 'var(--acento)';

    return (
      <div 
        key={s.id} 
        className="flex items-center justify-between py-2.5 border-b border-[var(--linea)] last:border-0 cursor-pointer group"
        onClick={() => setModal({ modo: 'editar', sobre: s })}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          </div>
          <div>
            <div className="font-semibold text-sm text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">
              {s.nombre}
            </div>
            <div className="text-xs text-[color:var(--texto-2)] tabular-nums">
              {formatearCOP(presupuesto)} al mes
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm tabular-nums text-[color:var(--texto)]">
            {formatearCOP(disponible)}
          </div>
          <div className="text-[10px] uppercase text-[color:var(--texto-3)]">Disponible</div>
        </div>
      </div>
    );
  };

  const renderMercado = (s: Sobre) => {
    const presupuesto = s.presupuestoMensual || 0;
    const gastado = gastadoDelMes(s, movimientos, hoy);
    const disponible = Math.max(0, presupuesto - gastado);
    const pct = presupuesto > 0 ? Math.min(100, (gastado / presupuesto) * 100) : 0;
    const color = s.color || 'var(--acento)';

    return (
      <div 
        key={s.id} 
        className="mb-4 bg-[var(--superficie-2)] rounded-2xl p-4 border border-[var(--linea)] cursor-pointer hover:border-[var(--acento)] transition-colors"
        onClick={() => setModal({ modo: 'editar', sobre: s })}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-base text-[color:var(--texto)]">{s.nombre}</h3>
            <p className="text-xs text-[color:var(--texto-2)]">{formatearCOP(presupuesto)} al mes</p>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-lg tabular-nums text-[color:var(--acento)]">
              {formatearCOP(disponible)}
            </div>
            <div className="text-[10px] uppercase text-[color:var(--texto-2)]">Disponible</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--linea)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
        </div>
        {MODULOS_LISTOS && s.modulo === 'lista_compras' && (
          <div className="mt-3">
            <Boton variante="fantasma" tamano="sm" anchoCompleto onClick={(e) => { e.stopPropagation(); /* TODO: Abrir lista */ }}>
              Abrir lista de compras de este sobre
            </Boton>
          </div>
        )}
      </div>
    );
  };

  const renderBasicos = () => {
    const mercado = basicos.find(s => s.id === ID_BASICO_MERCADO);
    const otros = basicos.filter(s => s.id !== ID_BASICO_MERCADO);

    return (
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[color:var(--texto)]">
          Lo básico <span className="text-[color:var(--texto-3)] font-normal ml-1 tabular-nums">· {formatearCOP(totalBasicos)}</span>
        </h2>
        <Tarjeta padding="md">
          {mercado && renderMercado(mercado)}
          <div className="flex flex-col">
            {otros.map(renderFilaBasica)}
          </div>
        </Tarjeta>
      </div>
    );
  };

  const renderLibres = () => {
    if (estado.deudasActivas) {
      return (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-lg text-[color:var(--texto)]">
            Lo libre
          </h2>
          <Tarjeta padding="md" className="bg-[var(--acento)]/10 border-[var(--acento)]/20">
            <p className="text-sm text-[color:var(--texto)] leading-relaxed mb-4">
              Lo libre empieza cuando termines tus deudas. Mientras tanto, toda esa plata va a tu plan.
            </p>
            <Boton 
              variante="primario" 
              tamano="sm" 
              iconoDerecha={<ChevronRight className="w-4 h-4" />}
              onClick={onIrAMiPlan}
            >
              Ir a Mi plan
            </Boton>
          </Tarjeta>
        </div>
      );
    }

    const colchon = libres.find(s => s.id === ID_SOBRE_COLCHON);
    const inversion = libres.find(s => s.id === ID_SOBRE_INVERSION);
    const gustos = libres.find(s => s.id === ID_LIBRE_GUSTOS);

    return (
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[color:var(--texto)]">
          Lo libre <span className="text-[color:var(--texto-3)] font-normal ml-1 tabular-nums">· {formatearCOP(estado.libre)}</span>
        </h2>
        <Tarjeta padding="md" className="flex flex-col divide-y divide-[var(--linea)]">
          {colchon && (
            <div 
              className="py-3 first:pt-0 cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: colchon })}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{colchon.nombre}</h3>
                  {colchon.apartado < metaFondo && <Chip variante="alerta">Primero</Chip>}
                </div>
                <div className="font-semibold text-sm tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.colchon)} al mes</div>
              </div>
              <p className="text-xs text-[color:var(--texto-2)] tabular-nums">
                {formatearCOP(colchon.apartado)} de {formatearCOP(metaFondo)}
              </p>
            </div>
          )}
          {inversion && (
            <div 
              className="py-3 cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: inversion })}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{inversion.nombre}</h3>
                <div className="font-semibold text-sm tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.inversion)} al mes</div>
              </div>
              <p className="text-xs text-[color:var(--texto-2)] tabular-nums">
                {formatearCOP(inversion.apartado)} sin invertir
              </p>
              {MODULOS_LISTOS && inversion.modulo === 'activos' && (
                <div className="mt-2">
                  <Boton variante="fantasma" tamano="sm" onClick={(e) => { e.stopPropagation(); /* TODO: Registrar CDT */ }}>
                    Registrar en un CDT o fondo real
                  </Boton>
                </div>
              )}
            </div>
          )}
          {gustos && (
            <div 
              className="py-3 pb-0 cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: gustos })}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{gustos.nombre}</h3>
                <div className="font-semibold text-sm tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.gustos)} al mes</div>
              </div>
              <p className="text-xs text-[color:var(--texto-2)] tabular-nums">
                {formatearCOP(reparto.gustos - gastadoDelMes(gustos, movimientos, hoy))} disponible este mes
              </p>
            </div>
          )}
        </Tarjeta>
      </div>
    );
  };

  const renderPropios = () => {
    return (
      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[color:var(--texto)]">
          Tus sobres propios
        </h2>
        {propios.length === 0 ? (
          <Tarjeta padding="md" className="text-center py-6 bg-[var(--superficie-2)]">
            <p className="text-sm text-[color:var(--texto-2)]">No tienes sobres extra creados por ti.</p>
          </Tarjeta>
        ) : (
          <div className="grid gap-3">
            {propios.map(s => {
              const color = s.color || 'var(--acento)';
              const pct = s.meta && s.meta > 0 ? Math.min(100, (s.apartado / s.meta) * 100) : s.apartado > 0 ? 100 : 0;
              const completo = s.meta ? s.apartado >= s.meta : false;
              
              return (
                <Tarjeta key={s.id} padding="md" bordeInteractivo>
                  <div 
                    className="cursor-pointer group flex items-start justify-between gap-3"
                    onClick={() => setModal({ modo: 'editar', sobre: s })}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                        <Mail className="w-4 h-4" style={{ color }} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors truncate">{s.nombre}</h3>
                        {s.meta && (
                          <p className="text-xs text-[color:var(--texto-2)] tabular-nums flex items-center gap-1 mt-0.5">
                            <Target className="w-3 h-3" /> {formatearCOP(s.meta)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-display font-bold text-lg tabular-nums" style={{ color }}>
                      {formatearCOP(s.apartado)}
                    </span>
                    {s.meta ? (
                      <span className="text-xs text-[color:var(--texto-2)] tabular-nums">
                        {completo ? '¡Listo! 🎉' : `${Math.round(pct)}%`}
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--linea)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
                  </div>
                  
                  <div className="mt-3">
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      anchoCompleto
                      icono={<Plus className="w-3.5 h-3.5" />}
                      onClick={(e) => { e.stopPropagation(); setModal({ modo: 'alimentar', sobre: s }); }}
                    >
                      Alimentar
                    </Boton>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--acento)]">
          Base Cero
        </span>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">
          Sobres
        </h1>
      </BarraTitulo>

      <header className="md:hidden flex items-center justify-between gap-3 pt-1 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Base Cero
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Sobres
            </h1>
          </div>
        </div>
      </header>
      
      <div className="px-4 py-3 md:hidden">
        <Boton
          variante="primario"
          tamano="md"
          anchoCompleto
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Crear sobre propio
        </Boton>
      </div>
      
      <div className="hidden md:block px-4 py-2 text-right">
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Crear sobre propio
        </Boton>
      </div>

      <Marco columnas="minmax(0,1fr) minmax(0,1fr) 320px">
        <Columna ordenMovil={1} borde>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3">
              {renderBasicos()}
            </Scroll>
          </Zona>
        </Columna>

        <Columna ordenMovil={2} borde>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3">
              {renderLibres()}
            </Scroll>
          </Zona>
        </Columna>
        
        <Columna ordenMovil={3}>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3 space-y-6">
              {renderLineaBaseCero()}
              {renderPropios()}
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
            if (modal.modo === 'crear' || s.id !== modal.sobre?.id) {
              guardarSobre(s);
            } else if (modal.modo === 'alimentar') {
              // si fue alimentación, el modal ya lo mandó con el monto sumado.
              guardarSobre(s);
            } else {
              guardarSobre(s);
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
};
