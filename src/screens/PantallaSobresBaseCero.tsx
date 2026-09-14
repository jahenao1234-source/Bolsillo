import React, { useState } from 'react';
import { ModalSobre, ModoModal } from '../components/sobres/ModalSobre';
import { ModalMoverSobre } from '../components/sobres/ModalMoverSobre';
import { formatearCOP } from '../utils/format';
import { MESES_ABREV } from '../utils/fechas';
import { Sobre, Movimiento, Deuda, PerfilFlujo, Billetera } from '../types';
import {
  estadoBaseCero,
  gastadoDelMes,
  ID_BASICO_MERCADO,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  ID_LIBRE_GUSTOS,
  MODULOS_LISTOS,
  metaFondoBlindado,
  repartoDelMes,
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
  onCambiarCuentaSobre: (sobreId: string, nuevaId: string) => { exito: boolean; error?: string };
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
  onCambiarCuentaSobre,
  onIrAMiPlan,
}) => {
  const [modal, setModal] = useState<{ modo: ModoModal; sobre: Sobre | null } | null>(null);
  const [modalMover, setModalMover] = useState<{ modo: 'abonar' | 'retirar'; sobre: Sobre } | null>(null);
  const [propiosAbiertos, setPropiosAbiertos] = useState(false);

  const hoy = new Date();
  const estado = estadoBaseCero(perfilFlujo, sobres, deudas);
  const basicos = sobres.filter((s) => s.grupo === 'basico');
  const propios = sobres.filter((s) => !s.grupo);
  
  const totalBasicos = basicos.reduce((a, s) => a + (s.presupuestoMensual || 0), 0);
  const gastosBasicos = perfilFlujo?.gastosBasicos || 0;
  
  const metaFondo = perfilFlujo ? metaFondoBlindado(gastosBasicos) : 0;
  const colchonSobre = sobres.find(s => s.id === ID_SOBRE_COLCHON);
  const inversionSobre = sobres.find(s => s.id === ID_SOBRE_INVERSION);
  const gustosSobre = sobres.find(s => s.id === ID_LIBRE_GUSTOS);
  const reparto = repartoDelMes(estado.libre, sobres, metaFondo, hoy);
  
  const mesNombre = hoy.toLocaleString('es-CO', { month: 'long' }).toLowerCase();

  const handleClickSobre = (s: Sobre) => setModal({ modo: 'editar', sobre: s });

  const getTextoCuenta = (sobre: Sobre) => {
    if (!sobre.billeteraId) return 'Sin cuenta todavía';
    const cuenta = billeteras.find(b => b.id === sobre.billeteraId);
    return cuenta ? `En ${cuenta.nombre}` : 'En cuenta eliminada';
  };

  const renderCabecera = () => {
    const fraseGral = (cls: string, m1: number, m2: number, tail: string, boton: boolean) => (
      <span className={cls}>
        Tus <b>{formatearCOP(estado.ingreso)}</b> de {mesNombre}: <b>{formatearCOP(m1)}</b> lo básico + <b>{formatearCOP(m2)}</b> {tail}
        {boton && (
          <> <button className="link acento" onClick={() => onRepartirBasicos(perfilFlujo)}>Repartir de nuevo</button></>
        )}
      </span>
    );

    const mobileFrase = (cls: string, txt1: string, val1: string, txt2: string, boton: boolean) => (
      <span className={cls}>
        {txt1} <b>{val1}</b> {txt2}
        {boton && (
          <> <button className="link acento" onClick={() => onRepartirBasicos(perfilFlujo)}>Repartir de nuevo</button></>
        )}
      </span>
    );

    let desk, mov;
    if (estado.deudasActivas) {
      desk = fraseGral("solo-escritorio", gastosBasicos as any, estado.paraDeudas as any, "a tu plan de deudas.", false);
      mov = mobileFrase("solo-movil", "", formatearCOP(estado.paraDeudas), "a tu plan de deudas", false);
    } else if (estado.porAsignar === 0) {
      desk = fraseGral("solo-escritorio", gastosBasicos as any, estado.libre as any, "lo libre · $0 sin dueño.", false);
      mov = mobileFrase("solo-movil", "", formatearCOP(estado.ingreso), "con dueño · $0 sin dueño", false);
    } else if (estado.porAsignar > 0) {
      desk = <span className="solo-escritorio">Tus <b>{formatearCOP(estado.ingreso)}</b> de {mesNombre}: <b>{formatearCOP(totalBasicos)}</b> lo básico + <b>{formatearCOP(estado.libre)}</b> lo libre. Te faltan <b>{formatearCOP(estado.porAsignar)}</b> por asignar en lo básico. <button className="link acento" onClick={() => onRepartirBasicos(perfilFlujo)}>Repartir de nuevo</button></span>;
      mov = mobileFrase("solo-movil", "Te faltan", formatearCOP(estado.porAsignar), "por asignar", true);
    } else {
      desk = <span className="solo-escritorio">Tus <b>{formatearCOP(estado.ingreso)}</b> de {mesNombre}: <b>{formatearCOP(totalBasicos)}</b> lo básico + <b>{formatearCOP(estado.libre)}</b> lo libre. Asignaste <b>{formatearCOP(Math.abs(estado.porAsignar))}</b> de más en lo básico. <button className="link acento" onClick={() => onRepartirBasicos(perfilFlujo)}>Repartir de nuevo</button></span>;
      mov = mobileFrase("solo-movil", "Asignaste", formatearCOP(Math.abs(estado.porAsignar)), "de más en lo básico", true);
    }

    return (
      <div className="cab">
        <h1>Tus sobres</h1>
        <p>
          {desk}
          {mov}
        </p>
        <div className="acciones">
          <button className="btn2" onClick={() => setModal({ modo: 'crear', sobre: null })}>+ Nuevo sobre</button>
        </div>
      </div>
    );
  };

  const getMovMes = (s: Sobre) => {
    const mesStr = hoy.toISOString().substring(0, 7);
    return movimientos.filter(m => 
      m.creadoEn?.startsWith(mesStr) && 
      (m.tipo === 'gasto' || m.tipo === 'transferencia') && 
      (m.categoria === s.nombre || (m.tipo === 'transferencia' && m.billeteraDestinoId === 'sobre-' + s.id))
    );
  };

  const renderBasicoDesk = (s: Sobre | undefined, colorVar: string) => {
    if (!s) return null;
    const pres = s.presupuestoMensual || 0;
    const gast = gastadoDelMes(s, movimientos, hoy);
    const disp = pres - gast;
    const isArriendo = s.id === 'basico-arriendo';
    const pagado = isArriendo && gast >= pres;
    const isMercado = s.id === ID_BASICO_MERCADO;

    let pieTxt = "Todavía no gastas de este sobre";
    if (isArriendo) {
      if (pagado) {
        const movs = getMovMes(s);
        let ult = hoy;
        if (movs.length > 0) {
          const m = movs.sort((a,b) => (b.creadoEn||'').localeCompare(a.creadoEn||''))[0];
          if (m.creadoEn) ult = new Date(m.creadoEn);
        }
        const mUlt = MESES_ABREV[ult.getMonth()].toLowerCase();
        const prox = new Date(ult); prox.setMonth(prox.getMonth() + 1);
        const mProx = MESES_ABREV[prox.getMonth()].toLowerCase();
        pieTxt = `Pagado el ${ult.getDate()} ${mUlt} · el próximo, el ${prox.getDate()} ${mProx}`;
      } else {
        pieTxt = "Se paga una vez al mes";
      }
    } else if (gast > 0) {
      pieTxt = `Gastaste ${formatearCOP(gast)} este mes`;
    }

    return (
      <section key={s.id} className={`panel ${isMercado ? '' : 'solo-escritorio'}`} onClick={() => handleClickSobre(s)} style={{ cursor: 'pointer' }}>
        <div className="panel-cab">
          <span style={{ display: 'flex', gap: 8 }}>
            <span className="bola" style={{ '--c': colorVar } as any} />
            <b>{s.nombre}</b>
          </span>
          {isArriendo && pagado ? (
            <span className="chip ok">Pagado</span>
          ) : disp < 0 ? (
            <span className="mal">−{formatearCOP(Math.abs(disp))} pasado</span>
          ) : (
            <span style={{ whiteSpace: 'nowrap' }}>
              <span className="cifra-l">{formatearCOP(disp)}</span> <span className="de">disp.</span>
            </span>
          )}
        </div>
        <div className="nota suave">Asignado: <b>{formatearCOP(pres)}/mes</b></div>
        <div className="barra" style={{ '--c': colorVar } as any}>
          <i style={{ width: `${Math.min(100, pres > 0 ? (gast/pres)*100 : 0)}%` }} />
        </div>
        <div className="nota suave" style={{ marginTop: 'auto' }}>{pieTxt}</div>
        {isMercado && MODULOS_LISTOS && (
          <button className="btn2 ancho" style={{ marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
            Abrir lista de compras →
          </button>
        )}
      </section>
    );
  };

  const renderBasicos = () => {
    const mercado = basicos.find(s => s.id === ID_BASICO_MERCADO);
    const arriendo = basicos.find(s => s.id === 'basico-arriendo');
    const servicios = basicos.find(s => s.id === 'basico-servicios');
    const transporte = basicos.find(s => s.id === 'basico-transporte');

    const presA = arriendo?.presupuestoMensual || 0;
    const gastA = arriendo ? gastadoDelMes(arriendo, movimientos, hoy) : 0;
    const pagadoA = gastA >= presA;
    let fechaATxt = "";
    if (pagadoA && arriendo) {
      const movs = getMovMes(arriendo);
      let ult = hoy;
      if (movs.length > 0) {
        const m = movs.sort((a,b) => (b.creadoEn||'').localeCompare(a.creadoEn||''))[0];
        if (m.creadoEn) ult = new Date(m.creadoEn);
      }
      fechaATxt = `Pagado el ${ult.getDate()} ${MESES_ABREV[ult.getMonth()].toLowerCase()}`;
    }

    const cellMin = (s: Sobre | undefined) => {
      if (!s) return null;
      const disp = (s.presupuestoMensual || 0) - gastadoDelMes(s, movimientos, hoy);
      return (
        <div className="panel" onClick={() => handleClickSobre(s)} style={{ cursor: 'pointer' }}>
          <span className="nota"><span className="bola" style={{ '--c': 'var(--neutro)' } as any} />{s.nombre}</span>
          <div className="cifra-m">{formatearCOP(Math.max(0, disp))}</div>
          <div className="barra" style={{ '--c': 'var(--neutro)' } as any}>
            <i style={{ width: `${Math.min(100, s.presupuestoMensual ? (gastadoDelMes(s, movimientos, hoy)/s.presupuestoMensual)*100 : 0)}%` }} />
          </div>
        </div>
      );
    };

    return (
      <>
        <div className="panel-cab" style={{ justifyContent: 'flex-start' }}>
          <h2 className="titulo">Lo básico</h2>
          <span className="nota suave num">{formatearCOP(gastosBasicos)} al mes</span>
        </div>
        <div className="rejilla llena" style={{ '--cols': 'repeat(4, minmax(0,1fr))' } as any}>
          {renderBasicoDesk(mercado, 'var(--neutro)')}
          {renderBasicoDesk(arriendo, 'var(--neutro)')}
          {renderBasicoDesk(servicios, 'var(--neutro)')}
          {renderBasicoDesk(transporte, 'var(--neutro)')}
        </div>
        <div className="solo-movil" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {arriendo && (
            <div className="panel" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => handleClickSobre(arriendo)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="bola" style={{ '--c': 'var(--neutro)' } as any} />
                <b>Arriendo</b>
                <span className="nota suave">{formatearCOP(presA)}</span>
              </span>
              {pagadoA ? (
                <span className="chip ok">{fechaATxt}</span>
              ) : (
                <span className="nota">Se paga una vez al mes</span>
              )}
            </div>
          )}
          <div className="par">
            {cellMin(servicios)}
            {cellMin(transporte)}
          </div>
        </div>
      </>
    );
  };

  const renderLibres = () => {
    if (estado.deudasActivas) {
      return (
        <>
          <div className="panel-cab" style={{ justifyContent: 'flex-start' }}>
            <h2 className="titulo">Lo libre</h2>
            <span className="nota suave num">{formatearCOP(estado.paraDeudas)} al mes</span>
            <span className="solo-escritorio"> · lo que antes iba a deudas</span>
          </div>
          <section className="panel destacado">
            <b>Lo libre empieza cuando termines tus deudas</b>
            <div className="nota">Tus {formatearCOP(estado.paraDeudas)} del mes van a tu plan</div>
            <button className="btn2 ancho" onClick={onIrAMiPlan}>Ir a Mi plan</button>
          </section>
        </>
      );
    }

    const apC = colchonSobre?.apartado || 0;
    const apI = inversionSobre?.apartado || 0;
    const presG = reparto.gustos;
    const gastG = gustosSobre ? gastadoDelMes(gustosSobre, movimientos, hoy) : 0;
    const dispG = presG - gastG;

    return (
      <>
        <div className="panel-cab" style={{ justifyContent: 'flex-start' }}>
          <h2 className="titulo">Lo libre</h2>
          <span className="nota suave num">{formatearCOP(estado.libre)} al mes</span>
        </div>
        <div className="rejilla llena" style={{ '--cols': 'repeat(3, minmax(0,1fr))' } as any}>
          {colchonSobre && (
            <section className="panel solo-escritorio" onClick={() => handleClickSobre(colchonSobre)} style={{ cursor: 'pointer' }}>
              <div className="panel-cab">
                <span style={{ display: 'flex', gap: 8 }}>
                  <span className="bola" style={{ '--c': 'var(--acento)' } as any} />
                  <b>Fondo blindado</b>
                </span>
                <span className="cifra-l">{formatearCOP(apC)}</span>
              </div>
              <div className="nota suave">
                {apC >= metaFondo ? "Su parte ya pasó a inversión" : <>Asignado: <b>{formatearCOP(reparto.colchon)}/mes</b> · meta {formatearCOP(metaFondo)}</>}
              </div>
              <div className="barra" style={{ '--c': 'var(--acento)' } as any}>
                <i style={{ width: `${Math.min(100, metaFondo > 0 ? (apC/metaFondo)*100 : 0)}%` }} />
                {apC < metaFondo && <span className="marca" style={{ left: `${Math.min(100, (1000000/metaFondo)*100)}%` }} />}
              </div>
              <div className="nota">
                {apC >= 1000000 ? (
                  <><span className="ok">Primer hito de $1.000.000 superado</span> · cubre {(apC / gastosBasicos).toFixed(1).replace('.',',')} meses de lo básico</>
                ) : (
                  "Primer hito: $1.000.000"
                )}
              </div>
              <div className="fila" style={{ marginTop: 'auto' }}>
                <span className="nota suave">{getTextoCuenta(colchonSobre)}</span>
                <button className="link acento" onClick={(e) => { e.stopPropagation(); setModalMover({ modo: 'abonar', sobre: colchonSobre }); }}>+ Abonar</button>
              </div>
              {MODULOS_LISTOS && (
                <button className="btn2 ancho" onClick={(e) => e.stopPropagation()}>Qué hacer si compras a cuotas →</button>
              )}
            </section>
          )}
          
          {inversionSobre && (
            <section className="panel" onClick={() => handleClickSobre(inversionSobre)} style={{ cursor: 'pointer' }}>
              <div className="panel-cab">
                <span style={{ display: 'flex', gap: 8 }}>
                  <span className="bola" style={{ '--c': 'var(--positivo)' } as any} />
                  <b>Inversión</b>
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span className="cifra-l">{formatearCOP(apI)}</span> <span className="de">sin invertir</span>
                </span>
              </div>
              <div className="nota suave">Asignado: <b>{formatearCOP(reparto.inversion)}/mes</b></div>
              <div className="barra" style={{ '--c': 'var(--positivo)' } as any}>
                <i style={{ width: `${Math.min(100, reparto.inversion > 0 ? (apI/(reparto.inversion*12))*100 : 0)}%` }} />
              </div>
              <div className="nota solo-escritorio"><b>{formatearCOP(apI)}</b> de {formatearCOP(reparto.inversion*12)} este año</div>
              <div className="fila" style={{ marginTop: 'auto' }}>
                <span className="nota suave">{getTextoCuenta(inversionSobre)}</span>
                <button className="link acento" onClick={(e) => { e.stopPropagation(); setModalMover({ modo: 'abonar', sobre: inversionSobre }); }}>+ Abonar</button>
              </div>
              {MODULOS_LISTOS && (
                <button className="btn2 ancho" onClick={(e) => e.stopPropagation()}>Registrar en un CDT o fondo →</button>
              )}
            </section>
          )}

          {gustosSobre && (
            <section className="panel solo-escritorio" onClick={() => handleClickSobre(gustosSobre)} style={{ cursor: 'pointer' }}>
              <div className="panel-cab">
                <span style={{ display: 'flex', gap: 8 }}>
                  <span className="bola" style={{ '--c': 'var(--azul)' } as any} />
                  <b>Gustos</b>
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span className="cifra-l">{formatearCOP(dispG)}</span> <span className="de">disp.</span>
                </span>
              </div>
              <div className="nota suave">Asignado: <b>{formatearCOP(presG)}/mes</b></div>
              <div className="barra" style={{ '--c': 'var(--azul)' } as any}>
                <i style={{ width: `${Math.min(100, presG > 0 ? (gastG/presG)*100 : 0)}%` }} />
              </div>
              {gastG > 0 && <div className="nota">Gastaste {formatearCOP(gastG)} este mes</div>}
              <div className="nota suave" style={{ marginTop: 'auto' }}>Gasta sin culpa y sin endeudarte</div>
            </section>
          )}
        </div>
        
        <div className="par solo-movil" style={{ marginTop: 10 }}>
          {colchonSobre && (
            <div className="panel" onClick={() => handleClickSobre(colchonSobre)} style={{ cursor: 'pointer' }}>
              <span className="nota"><span className="bola" style={{ '--c': 'var(--acento)' } as any} />Fondo blindado</span>
              <div className="cifra-m">{formatearCOP(apC)}</div>
              <div className="barra" style={{ '--c': 'var(--acento)' } as any}>
                <i style={{ width: `${Math.min(100, metaFondo > 0 ? (apC/metaFondo)*100 : 0)}%` }} />
                {apC < metaFondo && <span className="marca" style={{ left: `${Math.min(100, (1000000/metaFondo)*100)}%` }} />}
              </div>
            </div>
          )}
          {gustosSobre && (
            <div className="panel" onClick={() => handleClickSobre(gustosSobre)} style={{ cursor: 'pointer' }}>
              <span className="nota"><span className="bola" style={{ '--c': 'var(--azul)' } as any} />Gustos</span>
              <div className="cifra-m">{formatearCOP(dispG)}</div>
              <div className="barra" style={{ '--c': 'var(--azul)' } as any}>
                <i style={{ width: `${Math.min(100, presG > 0 ? (gastG/presG)*100 : 0)}%` }} />
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPropios = () => {
    const totalPropio = propios.reduce((a, s) => a + s.apartado, 0);

    return (
      <div style={{ marginTop: 24 }}>
        <div 
          className="panel plano" 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span className="nota">
            Tus sobres propios · <b>{propios.length}</b> 
            {propios.length > 0 ? (
              <> · <b>{formatearCOP(totalPropio)}</b> apartados</>
            ) : (
              " · para metas tuyas, como un viaje o la matrícula"
            )}
          </span>
          <button 
            className="link acento" 
            onClick={() => propios.length > 0 ? setPropiosAbiertos(!propiosAbiertos) : setModal({ modo: 'crear', sobre: null })}
          >
            {propios.length > 0 ? (propiosAbiertos ? "Cerrar" : "Ver →") : "Crear uno →"}
          </button>
        </div>

        {propiosAbiertos && propios.length > 0 && (
          <div className="lista lineas" style={{ marginTop: 12 }}>
            {propios.map(s => (
              <div key={s.id} className="fila" style={{ cursor: 'pointer', alignItems: 'center' }} onClick={() => handleClickSobre(s)}>
                <div>
                  <div>{s.nombre}</div>
                  {s.meta && <div className="nota suave">Meta: {formatearCOP(s.meta)}</div>}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontWeight: 'bold' }}>{formatearCOP(s.apartado)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="nota">{getTextoCuenta(s)}</span>
                    <button className="link acento" onClick={(e) => { e.stopPropagation(); setModalMover({ modo: 'abonar', sobre: s }); }}>Abonar</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pant">
      {renderCabecera()}
      {renderBasicos()}
      {renderLibres()}
      {renderPropios()}

      {modal && (
        <ModalSobre
          modo={modal.modo}
          sobre={modal.sobre}
          billeteras={billeteras}
          onCerrar={() => setModal(null)}
          onAbonar={() => { setModalMover({ modo: 'abonar', sobre: modal.sobre! }); setModal(null); }}
          onRetirar={() => { setModalMover({ modo: 'retirar', sobre: modal.sobre! }); setModal(null); }}
          onGuardar={(s) => {
            const antes = modal.sobre;
            if (antes && s.billeteraId && s.billeteraId !== antes.billeteraId && antes.apartado > 0) {
              const r = onCambiarCuentaSobre(antes.id, s.billeteraId);
              if (!r.exito) { window.alert(r.error); return; }
            }
            onGuardarSobre(s);
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
