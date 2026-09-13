import React, { useState } from 'react';
import { ArrowLeft, Plus, Target, Check, AlertTriangle, ChevronRight, Mail, RotateCcw, ChevronDown } from 'lucide-react';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo } from '../components/layout/shell';
import { Boton } from '../components/ui/Boton';
import { Chip } from '../components/ui/Chip';
import { Rotulo } from '../components/sistema/RailPasos';
import { ModalSobre, ModoModal } from '../components/sobres/ModalSobre';
import { formatearCOP } from '../utils/format';
import { Sobre, Movimiento, Deuda, PerfilFlujo } from '../types';
import {
  estadoBaseCero,
  gastadoDelMes,
  ID_BASICO_MERCADO,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  MODULOS_LISTOS,
  metaFondoBlindado,
  repartoPro,
} from '../logic/sistema';

interface PantallaSobresBaseCeroProps {
  perfilFlujo: PerfilFlujo | null;
  sobres: Sobre[];
  deudas: Deuda[];
  movimientos: Movimiento[];
  onRepartirBasicos: (perfil: PerfilFlujo | null) => void;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  onAportarASobre: (id: string, nombre: string, monto: number, meta?: number, color?: string) => void;
  onVolver: () => void;
  onIrAMiPlan?: () => void;
}

export const PantallaSobresBaseCero: React.FC<PantallaSobresBaseCeroProps> = ({
  perfilFlujo,
  sobres,
  deudas,
  movimientos,
  onRepartirBasicos,
  onGuardarSobre,
  onVolver,
  onIrAMiPlan,
}) => {
  const [modal, setModal] = useState<{ modo: ModoModal; sobre: Sobre | null } | null>(null);
  const [propiosAbiertos, setPropiosAbiertos] = useState(false);

  const hoy = new Date();
  const estado = estadoBaseCero(perfilFlujo, sobres, deudas);
  const basicos = sobres.filter((s) => s.grupo === 'basico');
  const libres = sobres.filter((s) => s.grupo === 'libre');
  const propios = sobres.filter((s) => !s.grupo);
  
  const totalBasicos = basicos.reduce((a, s) => a + (s.presupuestoMensual || 0), 0);
  
  const metaFondo = perfilFlujo ? metaFondoBlindado(perfilFlujo.gastosBasicos) : 0;
  const colchonSobre = sobres.find(s => s.id === ID_SOBRE_COLCHON);
  const colchonApartado = colchonSobre ? colchonSobre.apartado : 0;
  const reparto = repartoPro(estado.libre, colchonApartado, metaFondo);

  const renderLineaBaseCero = () => {
    return (
      <div className="mb-6">
        <Rotulo className="mb-2">Línea de base cero</Rotulo>
        <div className="p-4 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] flex flex-col gap-1">
          <div className="text-sm font-semibold tabular-nums text-[color:var(--texto)]">
            {formatearCOP(perfilFlujo?.gastosBasicos ?? 0)} lo básico + {formatearCOP(estado.deudasActivas ? estado.paraDeudas : estado.libre)} {estado.deudasActivas ? 'a tu plan de deudas' : 'lo libre'} = {formatearCOP(estado.ingreso)}
            {!estado.deudasActivas && estado.porAsignar === 0 && ' · $0 sin dueño'}
          </div>
          {estado.porAsignar !== 0 && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--linea)]">
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
                onClick={() => onRepartirBasicos(perfilFlujo)}
              >
                Repartir de nuevo
              </Boton>
            </div>
          )}
        </div>
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
        className="flex items-center justify-between py-2.5 border-t border-hairline group cursor-pointer"
        onClick={() => setModal({ modo: 'editar', sobre: s })}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">
              {s.nombre}
            </div>
            <div className="text-[11px] text-[color:var(--texto-3)] tabular-nums">
              {formatearCOP(presupuesto)} al mes
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[13px] tabular-nums text-[color:var(--texto)]">
            {formatearCOP(disponible)}
          </div>
          <div className="text-[10px] text-[color:var(--texto-3)]">Disponible</div>
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
        className="mb-2 p-3.5 rounded-2xl bg-superficie border border-linea cursor-pointer hover:border-texto-3 transition-colors"
        onClick={() => setModal({ modo: 'editar', sobre: s })}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-[13px] text-[color:var(--texto)]">{s.nombre}</h3>
            <p className="text-[11px] text-[color:var(--texto-3)] mt-0.5">{formatearCOP(presupuesto)} al mes</p>
          </div>
          <div className="text-right">
            <div className="font-display font-extrabold text-[15px] tabular-nums text-[color:var(--acento)]">
              {formatearCOP(disponible)}
            </div>
            <div className="text-[10px] text-[color:var(--texto-3)] mt-0.5">Disponible</div>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--linea)] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
        </div>
        {MODULOS_LISTOS && s.modulo === 'lista_compras' && (
          <div className="mt-3">
            <Boton variante="fantasma" tamano="sm" anchoCompleto onClick={(e) => { e.stopPropagation(); }}>
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
      <div className="mb-6">
        <Rotulo className="mb-2">Lo básico · {formatearCOP(totalBasicos)}</Rotulo>
        {mercado && renderMercado(mercado)}
        <div className="flex flex-col mt-2">
          {otros.map(renderFilaBasica)}
        </div>
      </div>
    );
  };

  const renderLibres = () => {
    if (estado.deudasActivas) {
      return (
        <div className="mb-6">
          <Rotulo className="mb-2">Lo libre</Rotulo>
          <div className="p-4 rounded-2xl bg-[var(--acento)]/10 border border-[var(--acento)]/20">
            <p className="text-[13px] text-[color:var(--texto)] leading-relaxed mb-4">
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
          </div>
        </div>
      );
    }

    const colchon = libres.find(s => s.id === ID_SOBRE_COLCHON);
    const inversion = libres.find(s => s.id === ID_SOBRE_INVERSION);
    const gustos = libres.find(s => s.id === ID_LIBRE_GUSTOS);

    return (
      <div className="mb-6">
        <Rotulo className="mb-2">Lo libre · {formatearCOP(estado.libre)}</Rotulo>
        <div className="flex flex-col">
          {colchon && (
            <div 
              className="py-2.5 border-t border-hairline first:border-0 cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: colchon })}
            >
              <div className="flex justify-between items-start mb-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{colchon.nombre}</h3>
                  {colchon.apartado < metaFondo && <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-acento/45 text-acento">Primero</span>}
                </div>
                <div className="font-bold text-[13px] tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.colchon)} al mes</div>
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)] tabular-nums">
                {formatearCOP(colchon.apartado)} de {formatearCOP(metaFondo)}
              </p>
            </div>
          )}
          {inversion && (
            <div 
              className="py-2.5 border-t border-hairline cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: inversion })}
            >
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{inversion.nombre}</h3>
                <div className="font-bold text-[13px] tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.inversion)} al mes</div>
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)] tabular-nums">
                {formatearCOP(inversion.apartado)} sin invertir
              </p>
            </div>
          )}
          {gustos && (
            <div 
              className="py-2.5 border-t border-hairline cursor-pointer group"
              onClick={() => setModal({ modo: 'editar', sobre: gustos })}
            >
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{gustos.nombre}</h3>
                <div className="font-bold text-[13px] tabular-nums text-[color:var(--texto)]">{formatearCOP(reparto.gustos)} al mes</div>
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)] tabular-nums">
                {formatearCOP(reparto.gustos - gastadoDelMes(gustos, movimientos, hoy))} disponible este mes
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPropios = () => {
    return (
      <div className="mb-6">
        <Rotulo className="mb-2">Tus sobres propios</Rotulo>
        {propios.length === 0 ? (
          <p className="text-[13px] text-[color:var(--texto-3)] py-4">No tienes sobres extra creados por ti.</p>
        ) : (
          <div className="flex flex-col">
            {(!propiosAbiertos && propios.length > 3) ? (
              <>
                {propios.slice(0, 3).map(renderFilaPropio)}
                <button
                  type="button"
                  className="w-full py-3 text-[13px] font-bold text-[color:var(--acento)] border-t border-hairline flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setPropiosAbiertos(true)}
                >
                  Ver tus {propios.length} sobres propios <ChevronDown className="w-4 h-4" />
                </button>
              </>
            ) : (
              propios.map(renderFilaPropio)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFilaPropio = (s: Sobre) => {
    const color = s.color || 'var(--acento)';
    return (
      <div 
        key={s.id} 
        className="flex items-center justify-between py-2.5 border-t border-hairline group cursor-pointer first:border-0"
        onClick={() => setModal({ modo: 'editar', sobre: s })}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
            <Mail className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <div className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">
              {s.nombre}
            </div>
            {s.meta && (
              <div className="text-[11px] text-[color:var(--texto-3)] tabular-nums flex items-center gap-1">
                <Target className="w-3 h-3" /> {formatearCOP(s.meta)}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[13px] tabular-nums" style={{ color }}>
            {formatearCOP(s.apartado)}
          </div>
          <div className="text-[10px] text-[color:var(--texto-3)] flex items-center justify-end gap-1">
             {s.meta && s.apartado >= s.meta && <Check className="w-3 h-3 text-[color:var(--positivo)]" />}
             Apartado
          </div>
        </div>
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

      <header className="md:hidden flex items-center justify-between gap-3 pt-1 px-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Base Cero
            </span>
            <h1 className="text-xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Sobres
            </h1>
          </div>
        </div>
        <Boton
          variante="secundario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Crear
        </Boton>
      </header>
      
      <div className="hidden md:flex justify-end px-4 py-2">
        <Boton
          variante="secundario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModal({ modo: 'crear', sobre: null })}
        >
          Crear sobre propio
        </Boton>
      </div>

      <Marco columnas="minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)">
        <Columna ordenMovil={1}>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3">
              <div className="xl:hidden">
                {renderLineaBaseCero()}
              </div>
              {renderBasicos()}
            </Scroll>
          </Zona>
        </Columna>

        <Columna ordenMovil={2} borde>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3">
              <div className="hidden xl:block">
                {renderLineaBaseCero()}
              </div>
              {renderLibres()}
            </Scroll>
          </Zona>
        </Columna>
        
        <Columna ordenMovil={3} borde>
          <Zona plana>
            <Scroll className="px-4 xl:px-5 py-3">
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
            onGuardarSobre(s);
            setModal(null);
          }}
        />
      )}
    </div>
  );
};
