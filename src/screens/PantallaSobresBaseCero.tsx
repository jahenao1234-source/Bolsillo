import React, { useState, useEffect } from 'react';
import { Target, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { ModalSobre, ModoModal } from '../components/sobres/ModalSobre';
import { ModalMoverSobre } from '../components/sobres/ModalMoverSobre';
import { TarjetaSobre } from '../components/sobres/TarjetaSobre';
import { formatearCOP } from '../utils/format';
import { Sobre, Movimiento, Deuda, PerfilFlujo, Billetera } from '../types';
import {
  estadoBaseCero,
  gastadoDelMes,
  fechaAporteEsteMes,
  ID_BASICO_MERCADO,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  MODULOS_LISTOS,
  metaFondoBlindado,
  repartoPro,
  COLOR_SOBRE_SISTEMA,
} from '../logic/sistema';

interface PantallaSobresBaseCeroProps {
  perfilFlujo: PerfilFlujo | null;
  sobres: Sobre[];
  billeteras: Billetera[];
  deudas: Deuda[];
  movimientos: Movimiento[];
  onRepartirBasicos: (perfil: PerfilFlujo | null) => void;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  onAbonarASobre: (sobreId: string, origenId: string, monto: number, origen?: 'aporte_mensual' | 'abono', destinoId?: string) => { exito: boolean; error?: string };
  onRetirarDeSobre: (sobreId: string, destinoId: string, monto: number, nota?: string) => { exito: boolean; error?: string };
  onVolver: () => void;
  onIrAMiPlan?: () => void;
}

export const PantallaSobresBaseCero: React.FC<PantallaSobresBaseCeroProps> = ({
  perfilFlujo,
  sobres,
  billeteras,
  deudas,
  movimientos,
  onRepartirBasicos,
  onGuardarSobre,
  onAbonarASobre,
  onRetirarDeSobre,
  onIrAMiPlan,
}) => {
  const [modal, setModal] = useState<{ modo: ModoModal; sobre: Sobre | null } | null>(null);
  const [modalMover, setModalMover] = useState<{ modo: 'abonar' | 'retirar'; sobre: Sobre } | null>(null);
  const [propiosAbiertos, setPropiosAbiertos] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  
  const mesNombre = hoy.toLocaleString('es-CO', { month: 'long' }).toLowerCase();

  const getColor = (s: Sobre) => COLOR_SOBRE_SISTEMA[s.id] || s.color || '#25C9BE';

  const handleClickSobre = (s: Sobre) => {
    if (s.id === ID_SOBRE_COLCHON || s.id === ID_SOBRE_INVERSION) {
      setModal({ modo: 'crear', sobre: s }); // Se reutiliza modo crear/editar visualmente para fondo e inversion
    } else {
      setModal({ modo: 'editar', sobre: s });
    }
  };

  const getTextoCuenta = (sobre: Sobre) => {
    if (!sobre.billeteraId) return 'Sin cuenta todavía';
    const cuenta = billeteras.find(b => b.id === sobre.billeteraId);
    return cuenta ? `En ${cuenta.nombre}` : 'En cuenta eliminada';
  };

  const renderEncabezado = () => {
    let frase = '';
    let tieneBoton = false;
    
    if (estado.deudasActivas) {
      frase = isMobile 
        ? `${formatearCOP(estado.paraDeudas)} a tu plan de deudas`
        : `Tus ${formatearCOP(estado.ingreso)} de ${mesNombre}: ${formatearCOP(perfilFlujo?.gastosBasicos || 0)} lo básico + ${formatearCOP(estado.paraDeudas)} a tu plan de deudas.`;
    } else if (estado.porAsignar === 0) {
      frase = isMobile
        ? `${formatearCOP(estado.ingreso)} con dueño · $0 sin dueño`
        : `Tus ${formatearCOP(estado.ingreso)} de ${mesNombre}, con dueño antes de gastarlos: ${formatearCOP(perfilFlujo?.gastosBasicos || 0)} lo básico + ${formatearCOP(estado.libre)} lo libre · $0 sin dueño.`;
    } else if (estado.porAsignar > 0) {
      frase = isMobile
        ? `Te faltan ${formatearCOP(estado.porAsignar)} por asignar`
        : `Tus ${formatearCOP(estado.ingreso)} de ${mesNombre}: ${formatearCOP(totalBasicos)} lo básico + ${formatearCOP(estado.libre)} lo libre. Te faltan ${formatearCOP(estado.porAsignar)} por asignar en lo básico.`;
      tieneBoton = true;
    } else {
      frase = isMobile
        ? `Asignaste ${formatearCOP(Math.abs(estado.porAsignar))} de más en lo básico`
        : `Tus ${formatearCOP(estado.ingreso)} de ${mesNombre}: ${formatearCOP(totalBasicos)} lo básico + ${formatearCOP(estado.libre)} lo libre. Asignaste ${formatearCOP(Math.abs(estado.porAsignar))} de más en lo básico.`;
      tieneBoton = true;
    }

    return (
      <div className="mb-6 xl:mb-8 pt-4 md:pt-0">
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-display font-extrabold text-[21px] xl:text-[24px] text-[color:var(--texto)]">
            Tus sobres
          </h1>
          <button
            onClick={() => setModal({ modo: 'crear', sobre: null })}
            className="px-3.5 py-2 rounded-[11px] border border-[var(--linea)] bg-[var(--superficie-2)] text-[13px] font-bold text-[color:var(--texto)] cursor-pointer"
          >
            + Nuevo{isMobile ? '' : ' sobre'}
          </button>
        </div>
        <div className="text-[13.5px] text-[color:var(--texto-2)]">
          {frase.split(/(\$[0-9.,]+)/).map((part, i) => 
            part.startsWith('$') ? <span key={i} className="font-bold text-[color:var(--texto)] tabular-nums">{part}</span> : part
          )}
          {tieneBoton && (
            <>
              {' '}
              <button onClick={() => onRepartirBasicos(perfilFlujo)} className="text-[color:var(--acento)] font-bold cursor-pointer hover:underline">
                Repartir de nuevo
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderBasicos = () => {
    const mercado = basicos.find(s => s.id === ID_BASICO_MERCADO);
    const arriendo = basicos.find(s => s.id === 'basico-arriendo');
    const servicios = basicos.find(s => s.id === 'basico-servicios');
    const transporte = basicos.find(s => s.id === 'basico-transporte');
    
    // Fallbacks if not found (for dev/tests)
    const renderMercado = () => {
      if (!mercado) return null;
      const pres = mercado.presupuestoMensual || 0;
      const gast = gastadoDelMes(mercado, movimientos, hoy);
      return (
        <TarjetaSobre
          color={getColor(mercado)}
          nombre="Mercado"
          derecha={gast > pres ? <span className="text-[color:var(--alerta)]">-{formatearCOP(gast - pres)} pasado</span> : <><span className="text-[17px] font-display font-extrabold" style={{ color: getColor(mercado) }}>{formatearCOP(pres - gast)}</span><span className="text-[12px] text-[color:var(--texto-3)] font-normal ml-1">disp.</span></>}
          linea={<>Asignado: <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(pres)}/mes</span></>}
          progreso={pres > 0 ? (gast / pres) * 100 : 0}
          pie={(!MODULOS_LISTOS) ? "Mercado, aseo y despensa" : undefined}
          puente={MODULOS_LISTOS ? { texto: "Abrir lista de compras", onClick: (e) => { e.stopPropagation(); } } : undefined}
          variante="completa"
          onClick={() => handleClickSobre(mercado)}
        />
      );
    };

    const renderB = (s: Sobre | undefined, pieTxt: string, mini: boolean) => {
      if (!s) return null;
      const pres = s.presupuestoMensual || 0;
      const gast = gastadoDelMes(s, movimientos, hoy);
      const isArriendo = s.id === 'basico-arriendo';
      const pagado = isArriendo && gast >= pres;
      const color = getColor(s);
      
      let pie = pieTxt;
      if (isArriendo) {
        if (pagado) {
          const ultimaFecha = new Date(); // ToDo: find last movement date
          pie = `Pagado el ${ultimaFecha.getDate()} de ${ultimaFecha.toLocaleString('es-CO', { month: 'long' })}`;
        } else {
          pie = "Se paga una vez al mes";
        }
      }

      return (
        <TarjetaSobre
          color={color}
          nombre={s.nombre}
          derecha={
            pagado ? (
              <span className="text-[12px] font-bold text-[color:var(--positivo)]">✓ Pagado</span>
            ) : gast > pres ? (
              <span className="text-[color:var(--alerta)]">-{formatearCOP(gast - pres)} pasado</span>
            ) : (
              <><span style={{ color: mini ? color : 'var(--texto)' }}>{formatearCOP(pres - gast)}</span>{!mini && <span className="text-[12px] text-[color:var(--texto-3)] font-normal ml-1">disp.</span>}</>
            )
          }
          linea={mini && pagado ? undefined : <>Asignado: <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(pres)}/mes</span></>}
          progreso={pagado || gast > pres ? 100 : pres > 0 ? (gast / pres) * 100 : 0}
          pie={mini ? undefined : pie}
          variante={mini ? 'mini' : 'completa'}
          onClick={() => handleClickSobre(s)}
        />
      );
    };

    return (
      <div className="mb-6 xl:mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--texto-3)] mb-[12px]">
          Lo básico <span className="text-[12.5px] text-[color:var(--texto-2)] normal-case tracking-normal ml-2 tabular-nums font-semibold">{formatearCOP(perfilFlujo?.gastosBasicos || 0)} al mes</span>
        </h2>
        {isMobile ? (
          <div className="flex flex-col gap-2.5">
            {renderMercado()}
            <div className="grid grid-cols-3 gap-2.5">
              {renderB(arriendo, "", true)}
              {renderB(servicios, "", true)}
              {renderB(transporte, "", true)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
            {renderMercado()}
            {renderB(arriendo, "Se paga una vez al mes", false)}
            {renderB(servicios, "Luz, agua, gas e internet", false)}
            {renderB(transporte, "Para ir a trabajar", false)}
          </div>
        )}
      </div>
    );
  };

  const renderLibres = () => {
    if (estado.deudasActivas) {
      return (
        <div className="mb-6 xl:mb-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--texto-3)] mb-[12px]">
            Lo libre <span className="text-[12.5px] text-[color:var(--texto-2)] normal-case tracking-normal ml-2 tabular-nums font-semibold">{formatearCOP(estado.paraDeudas)} al mes · lo que antes iba a deudas</span>
          </h2>
          <div className="rounded-[18px] border bg-[var(--superficie)] px-[18px] py-[17px] flex flex-col gap-[11px]" style={{ borderColor: 'color-mix(in srgb, #25C9BE 38%, var(--linea))' }}>
            <div className="flex items-center gap-2">
              <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 bg-[#25C9BE]" />
              <div className="font-bold text-[14.5px] text-[color:var(--texto)]">Lo libre empieza cuando termines tus deudas</div>
            </div>
            <div className="text-[12.5px] text-[color:var(--texto-3)] -mt-[5px]">
              Tus <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(estado.paraDeudas)}</span> del mes van a tu plan
            </div>
            <button
              type="button"
              onClick={onIrAMiPlan}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold mt-1 cursor-pointer transition-colors"
              style={{
                color: '#25C9BE',
                backgroundColor: `color-mix(in srgb, #25C9BE 10%, transparent)`,
                border: `1px solid color-mix(in srgb, #25C9BE 30%, transparent)`,
              }}
            >
              Ir a Mi plan →
            </button>
          </div>
        </div>
      );
    }

    const colchon = libres.find(s => s.id === ID_SOBRE_COLCHON);
    const inversion = libres.find(s => s.id === ID_SOBRE_INVERSION);
    const gustos = libres.find(s => s.id === ID_LIBRE_GUSTOS);

    const renderFondo = () => {
      if (!colchon) return null;
      const meta = metaFondo;
      const lleno = colchon.apartado >= meta;
      
      const chip = lleno 
        ? <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-[var(--positivo)]/45 text-[color:var(--positivo)]">Completo</span>
        : <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-[#25C9BE]/45 text-[#25C9BE]">Primero</span>;

      return (
        <TarjetaSobre
          color={getColor(colchon)}
          nombre="Fondo blindado"
          chip={chip}
          derecha={<span className="text-[17px] font-display font-extrabold" style={{ color: isMobile ? getColor(colchon) : 'var(--texto)' }}>{formatearCOP(colchon.apartado)}</span>}
          linea={lleno ? "Su parte ya pasó a inversión" : <>Asignado: <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(reparto.colchon)}/mes</span> {isMobile ? "de" : "· meta"} {formatearCOP(meta)}</>}
          progreso={(colchon.apartado / meta) * 100}
          marcaHito={colchon.apartado < 1000000 ? (1000000 / meta) * 100 : undefined}
          pie={!isMobile ? (colchon.apartado < 1000000 ? "Primer hito: $1.000.000" : "Para que la próxima emergencia no sea tarjeta") : undefined}
          puente={(!isMobile && false) ? { texto: "Qué hacer si compras a cuotas", onClick: (e) => { e.stopPropagation(); } } : undefined} // TODO: Prompt 5
          cuenta={{ texto: getTextoCuenta(colchon), onAbonar: (e) => setModalMover({ modo: 'abonar', sobre: colchon }) }}
          variante={isMobile ? 'mini' : 'completa'}
          onClick={() => handleClickSobre(colchon)}
        />
      );
    };

    const renderInversion = () => {
      if (!inversion) return null;
      const metaAnual = reparto.inversion * 12;
      return (
        <TarjetaSobre
          color={getColor(inversion)}
          nombre="Inversión"
          derecha={<span className="text-[17px] font-display font-extrabold" style={{ color: isMobile ? getColor(inversion) : 'var(--texto)' }}>{formatearCOP(inversion.apartado)}</span>}
          linea={<>Asignado: <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(reparto.inversion)}/mes</span> {!isMobile && `· ${formatearCOP(inversion.apartado)} de ${formatearCOP(metaAnual)} este año`}</>}
          progreso={metaAnual > 0 ? (inversion.apartado / metaAnual) * 100 : 0}
          pie={(!MODULOS_LISTOS && !isMobile) ? "Se invierte en Activos" : undefined}
          puente={MODULOS_LISTOS ? { texto: "Registrar en un CDT o fondo", onClick: (e) => { e.stopPropagation(); } } : undefined}
          cuenta={{ texto: getTextoCuenta(inversion), onAbonar: (e) => setModalMover({ modo: 'abonar', sobre: inversion }) }}
          variante="completa" // Siempre completa, incluso en celular
          onClick={() => handleClickSobre(inversion)}
        />
      );
    };

    const renderGustos = () => {
      if (!gustos) return null;
      const pres = reparto.gustos;
      const gast = gastadoDelMes(gustos, movimientos, hoy);
      return (
        <TarjetaSobre
          color={getColor(gustos)}
          nombre="Gustos"
          derecha={<><span className="text-[17px] font-display font-extrabold" style={{ color: isMobile ? getColor(gustos) : 'var(--texto)' }}>{formatearCOP(pres - gast)}</span>{!isMobile && <span className="text-[12px] text-[color:var(--texto-3)] font-normal ml-1">disp.</span>}</>}
          linea={isMobile ? `de ${formatearCOP(pres)}` : <>Asignado: <span className="font-semibold text-[color:var(--texto-2)]">{formatearCOP(pres)}/mes</span></>}
          progreso={pres > 0 ? (gast / pres) * 100 : 0}
          pie={!isMobile ? "Gasta sin culpa y sin endeudarte" : undefined}
          variante={isMobile ? 'mini' : 'completa'}
          onClick={() => handleClickSobre(gustos)}
        />
      );
    };

    return (
      <div className="mb-6 xl:mb-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--texto-3)] mb-[12px]">
          Lo libre <span className="text-[12.5px] text-[color:var(--texto-2)] normal-case tracking-normal ml-2 tabular-nums font-semibold">{formatearCOP(estado.libre)} al mes · lo que antes iba a deudas</span>
        </h2>
        {isMobile ? (
          <div className="flex flex-col gap-2.5">
            {renderInversion()}
            <div className="grid grid-cols-2 gap-2.5">
              {renderFondo()}
              {renderGustos()}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3.5">
            {renderFondo()}
            {renderInversion()}
            {renderGustos()}
          </div>
        )}
      </div>
    );
  };

  const renderPropios = () => {
    const totalPropio = propios.reduce((a, s) => a + s.apartado, 0);

    return (
      <div className="mb-8">
        <div 
          className="rounded-[14px] border border-[var(--linea)] bg-[var(--superficie-2)] px-[18px] py-[13px] flex justify-between items-center cursor-pointer hover:border-[color:var(--texto-3)] transition-colors"
          onClick={() => setPropiosAbiertos(!propiosAbiertos)}
        >
          <div className="text-[13px] text-[color:var(--texto-2)]">
            Tus sobres propios · <span className="font-bold text-[color:var(--texto)]">{propios.length}</span>{propios.length > 0 && <> · <span className="font-bold text-[color:var(--texto)]">{formatearCOP(totalPropio)}</span> apartados</>}
          </div>
          <div className="text-[13px] font-bold text-[color:var(--acento)]">
            {propios.length > 0 ? (propiosAbiertos ? "Cerrar" : "Ver →") : "Crear uno →"}
          </div>
        </div>

        {propiosAbiertos && propios.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 pl-2">
            {propios.map(s => (
              <div 
                key={s.id} 
                className="flex items-center justify-between py-2.5 border-b border-[var(--linea)] last:border-0 group cursor-pointer"
                onClick={() => setModal({ modo: 'editar', sobre: s })}
              >
                <div className="flex flex-col">
                  <div className="font-semibold text-[13px] text-[color:var(--texto)] group-hover:text-[color:var(--acento)] transition-colors">{s.nombre}</div>
                  {s.meta && <div className="text-[11px] text-[color:var(--texto-3)] tabular-nums mt-0.5">Meta: {formatearCOP(s.meta)}</div>}
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="font-bold text-[13px] tabular-nums" style={{ color: s.color || 'var(--acento)' }}>{formatearCOP(s.apartado)}</div>
                  <div className="flex gap-2.5 mt-0.5">
                    <span className="text-[10px] text-[color:var(--texto-3)] mt-0.5 mr-1">{getTextoCuenta(s)}</span>
                    <button onClick={(e) => { e.stopPropagation(); setModalMover({ modo: 'abonar', sobre: s }); }} className="text-[11px] font-bold text-[color:var(--acento)] hover:underline cursor-pointer">Abonar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-full px-4 md:px-[24px] mx-auto pb-24 xl:pb-0 animate-screen-enter">
      {renderEncabezado()}
      {renderBasicos()}
      {renderLibres()}
      {renderPropios()}

      {modal && (
        <ModalSobre
          modo={modal.modo}
          sobre={modal.sobre}
          onCerrar={() => setModal(null)}
          onGuardar={(s) => {
            onGuardarSobre(s);
            // Un sobre nuevo nace en $0: si hay cuentas, se le pone plata de una vez.
            if (modal.modo === 'crear' && !modal.sobre && billeteras.length > 0) {
              setModalMover({ modo: 'abonar', sobre: { ...s, apartado: 0 } });
            }
            setModal(null);
          }}
        />
      )}

      {modalMover && (
        <ModalMoverSobre
          modo={modalMover.modo}
          sobre={modalMover.sobre}
          billeteras={billeteras}
          sobres={sobres}
          onCerrar={() => setModalMover(null)}
          onConfirmar={(monto, origenId, destinoId) => {
            if (modalMover.modo === 'abonar') {
              return onAbonarASobre(modalMover.sobre.id, origenId, monto, 'abono', destinoId);
            } else {
              return onRetirarDeSobre(modalMover.sobre.id, destinoId, monto);
            }
          }}
        />
      )}
    </div>
  );
};
