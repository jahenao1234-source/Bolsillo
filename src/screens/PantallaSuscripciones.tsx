import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Repeat,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Zap,
  Wallet,
} from "lucide-react";
import { Billetera, Movimiento, PromoSuscripcion, Suscripcion, TarjetaCredito } from "../types";
import { Tarjeta } from "../components/ui/Tarjeta";
import { Boton } from "../components/ui/Boton";
import { formatearCOP } from "../utils/format";
import { Chip } from "../components/ui/Chip";
import { Marco, Columna, Zona, Scroll } from "../components/layout/Marco";
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from "../components/layout/shell";
import { NotaModulo } from "../components/ui/NotaModulo";
import {
  DURACIONES_PROMO,
  DIAS_DE_AVISO,
  DuracionPromo,
  avisoPrincipal,
  cicloDe,
  estadoDe,
  finSegunDuracion,
  montoVigente,
  sangradoNormal,
  sangradoVigente,
  esFuga,
  diasSinUso,
  cobrosDesde,
  cobrosDelMes
} from "../logic/suscripciones";
import {
  MESES_ABREV,
  MESES_NOMBRE,
  fechaConDiaSemana,
  fechaISOLocal,
} from "../utils/fechas";

interface PantallaSuscripcionesProps {
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  billeteras: Billetera[];
  tarjetas: TarjetaCredito[];
  ingresoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  onRegistrarMovimiento: (movimiento: Omit<Movimiento, "id">) => void;
  onVolver: () => void;
}

const COLORES = ["#5FE0A8", "#25C9BE", "#FF7A3D", "#8AA9FF", "#F2C879", "#E89385"];

function isoDia(fecha: Date): string {
  const mes = `${fecha.getMonth() + 1}`.padStart(2, "0");
  const dia = `${fecha.getDate()}`.padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function fechaLegible(fecha: Date): string {
  return `${`${fecha.getDate()}`.padStart(2, "0")} ${MESES_ABREV[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

function etiquetaFaltan(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

export const PantallaSuscripciones: React.FC<PantallaSuscripcionesProps> = ({
  suscripciones,
  billeteras,
  tarjetas,
  ingresoMensual,
  onGuardarSuscripcion,
  onEliminarSuscripcion,
  onRegistrarMovimiento,
  onVolver,
}) => {
  const [modal, setModal] = useState<{ editando: Suscripcion | null } | null>(null);
  const [cobrando, setCobrando] = useState<Suscripcion | null>(null);

  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const ordenadas = useMemo(() => {
    return [...suscripciones].sort((a, b) => {
      if (a.activa !== b.activa) return a.activa ? -1 : 1;
      const ca = cicloDe(a, hoy);
      const cb = cicloDe(b, hoy);
      if (ca.esFinDePromo !== cb.esFinDePromo) return ca.esFinDePromo ? -1 : 1;
      return ca.faltan - cb.faltan;
    });
  }, [suscripciones, hoy]);

  const aviso = useMemo(() => avisoPrincipal(suscripciones, hoy), [suscripciones, hoy]);
  const vigente = sangradoVigente(suscripciones, hoy);
  const normal = sangradoNormal(suscripciones);
  const activas = suscripciones.filter((s) => s.activa);
  
  const fugas = useMemo(() => activas.filter(s => esFuga(s, hoy)).sort((a, b) => montoVigente(b, hoy) - montoVigente(a, hoy)), [activas, hoy]);
  const fuga = fugas[0] || null;
  const cobros = useMemo(() => cobrosDelMes(activas, hoy), [activas, hoy]);

  const nombrePago = (pagaCon?: { tipo: "billetera" | "tarjeta"; id: string }) => {
    if (!pagaCon) return "—";
    if (pagaCon.tipo === "billetera") {
      const b = billeteras.find(x => x.id === pagaCon.id);
      return b ? b.nombre : "—";
    }
    if (pagaCon.tipo === "tarjeta") {
      const t = tarjetas.find(x => x.id === pagaCon.id);
      return t ? t.nombre : "—";
    }
    return "—";
  };

  const toggleActiva = (s: Suscripcion) => onGuardarSuscripcion({ ...s, activa: !s.activa });

  const quedarse = (s: Suscripcion) => {
    const fin = s.promo ? fechaISOLocal(s.promo.hasta) : null;
    onGuardarSuscripcion({
      ...s,
      promo: undefined,
      diaCobro: fin ? fin.getDate() : s.diaCobro,
    });
  };

  const cancelar = (s: Suscripcion) => onGuardarSuscripcion({ ...s, activa: false, promo: undefined });

  const registrarCobro = (
    sus: Suscripcion,
    billeteraId: string,
    monto: number,
    fecha: Date,
    actualizarPrecio: boolean
  ) => {
    onRegistrarMovimiento({
      tipo: "gasto",
      monto,
      billeteraId,
      categoria: sus.categoria || "Suscripciones",
      fecha: fechaLegible(fecha),
      nota: `${sus.nombre} · cobro de ${MESES_NOMBRE[fecha.getMonth()].toLowerCase()}`,
      descripcion: `${sus.nombre} · cobro de ${MESES_NOMBRE[fecha.getMonth()].toLowerCase()}`,
      creadoEn: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12).toISOString(),
    });

    onGuardarSuscripcion({
      ...sus,
      ultimoCobro: isoDia(fecha),
      monto: actualizarPrecio ? monto : sus.monto,
    });

    setCobrando(null);
  };

  const sumarResto = activas.filter(s => !esFuga(s, hoy)).reduce((a, b) => a + montoVigente(b, hoy), 0);
  const sumarFugas = fugas.reduce((a, b) => a + montoVigente(b, hoy), 0);
  const nombresFugas = fugas.map(f => f.nombre).join(", ");
  const nombresResto = activas.filter(s => !esFuga(s, hoy)).map(f => f.nombre).join(", ");
  const pctFugas = vigente > 0 ? Math.round((sumarFugas / vigente) * 100) : 0;
  const pctResto = vigente > 0 ? Math.round((sumarResto / vigente) * 100) : 0;

  return (
    <div className="pant">
      <header className="cab">
        <div>
          <h1>Suscripciones</h1>
          <p>
            Te cobran solas <b className="num">{formatearCOP(vigente)} al mes</b>, {formatearCOP(vigente * 12)} al año.
            {fugas.length > 0 && ` ${fugas.length === 1 ? "Una de ellas no la estás usando." : `${fugas.length} no las estás usando.`}`}
            {normal > vigente && ` Cuando terminen las promos serán ${formatearCOP(normal)}.`}
          </p>
        </div>
        <div className="acciones">
          <button className="link" onClick={onVolver}>← Herramientas</button>
          <button className="btn2" onClick={() => setModal({ editando: null })}>+ Nueva</button>
        </div>
      </header>

      <div className="rejilla llena" style={{ "--cols": "minmax(0,1.25fr) minmax(0,1.1fr) minmax(0,1fr)" } as React.CSSProperties}>
        
        {aviso?.tipo === "promo" ? (
          <section className="panel riesgo">
            <h2 className="titulo">Se acaba una promo <span className="chip aviso">{etiquetaFaltan(aviso.dias)}</span></h2>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{aviso.sus.nombre}</div>
            <div className="nota">Pasas de {formatearCOP(aviso.sus.promo?.monto || 0)} a {formatearCOP(aviso.sus.monto)} al mes el {aviso.ciclo.fin.getDate()} {MESES_ABREV[aviso.ciclo.fin.getMonth()].toLowerCase()}.</div>
            <div><span className="cifra-xl">{formatearCOP(aviso.sus.monto)}</span> <span className="de">al mes</span></div>
            <div style={{ marginTop: "auto", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => cancelar(aviso.sus)}>La voy a cancelar</button>
              <button className="link" onClick={() => quedarse(aviso.sus)}>Me la quedo</button>
            </div>
          </section>
        ) : fuga ? (
          <section className="panel riesgo">
            <div className="panel-cab">
              <h2 className="titulo">Fuga activa</h2>
              <span className="chip mal">{diasSinUso(fuga, hoy)} días sin uso</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{fuga.nombre}</div>
            <div className="nota">
              Último uso el {fechaISOLocal(fuga.ultimoUso!)?.getDate()} {MESES_ABREV[fechaISOLocal(fuga.ultimoUso!)!.getMonth()].toLowerCase()}. Desde entonces te cobró {cobrosDesde(fuga, fechaISOLocal(fuga.ultimoUso!)!, hoy)} {cobrosDesde(fuga, fechaISOLocal(fuga.ultimoUso!)!, hoy) === 1 ? "vez" : "veces"}: <b className="num">{formatearCOP(montoVigente(fuga, hoy) * cobrosDesde(fuga, fechaISOLocal(fuga.ultimoUso!)!, hoy))}</b> sin usarla.
            </div>
            <div className="fila" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              <span>
                <span className="cifra-xl mal">{formatearCOP(montoVigente(fuga, hoy) * 12)}</span> <span className="de">al año</span>
              </span>
              <span className="nota num">{formatearCOP(montoVigente(fuga, hoy))} al mes</span>
            </div>
            <div className="nota solo-movil">Si la cancelas, esos {formatearCOP(montoVigente(fuga, hoy))} al mes quedan libres.</div>
            <div style={{ marginTop: "auto", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => cancelar(fuga)}>Cancelar {fuga.nombre}</button>
              <button className="link" onClick={() => onGuardarSuscripcion({ ...fuga, ultimoUso: new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString() })}>Sí la uso</button>
              <span className="nota suave solo-escritorio" style={{ marginLeft: "auto" }}>Próximo cobro {cicloDe(fuga, hoy).fin.getDate()} {MESES_ABREV[cicloDe(fuga, hoy).fin.getMonth()].toLowerCase()}</span>
            </div>
          </section>
        ) : aviso?.tipo === "cobro" ? (
          <section className="panel destacado">
            <h2 className="titulo">Próximo cobro <span className="chip aviso">{etiquetaFaltan(aviso.dias)}</span></h2>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{aviso.sus.nombre}</div>
            <div className="nota">Te va a cobrar {formatearCOP(montoVigente(aviso.sus, hoy))} con {nombrePago(aviso.sus.pagaCon)}.</div>
            <div><span className="cifra-xl">{formatearCOP(montoVigente(aviso.sus, hoy))}</span></div>
            <div style={{ marginTop: "auto", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setCobrando(aviso.sus)}>Registrar el cobro</button>
            </div>
          </section>
        ) : (
          <section className="panel">
            <h2 className="titulo">Todo en orden</h2>
            <div className="nota">Ningún cobro en los próximos días y ninguna suscripción sin uso.</div>
          </section>
        )}

        <section className={`panel solo-escritorio ${!fuga ? "ancho-2" : ""}`}>
          <div className="panel-cab">
            <h2 className="titulo">Total al mes</h2>
            <span className="nota num">{activas.length} servicios</span>
          </div>
          <div className="fila">
            <span><span className="cifra-xl">{formatearCOP(vigente)}</span> <span className="de">al mes</span></span>
            <span className="nota num">{formatearCOP(vigente * 12)} al año</span>
          </div>
          <div className="barra" style={{ display: "flex", gap: 2, height: 12 }}>
            {activas.map(s => {
              const esF = esFuga(s, hoy);
              const pct = vigente > 0 ? (montoVigente(s, hoy) / vigente) * 100 : 0;
              return <i key={s.id} style={{ width: `${pct}%`, "--c": esF ? "var(--alerta)" : "var(--acento)" } as React.CSSProperties} />;
            })}
          </div>
          <div className="lista lineas" style={{ marginTop: "auto" }}>
            {fugas.length > 0 && (
              <div className="fila">
                <span><span className="bola" style={{ "--c": "var(--alerta)" } as React.CSSProperties} /> Sin uso · {nombresFugas} · {pctFugas}%</span>
                <span>{formatearCOP(sumarFugas)}</span>
              </div>
            )}
            <div className="fila">
              <span><span className="bola" /> En uso · {nombresResto} · {pctResto}%</span>
              <span>{formatearCOP(sumarResto)}</span>
            </div>
          </div>
        </section>

        {fuga && (
          <section className="panel destacado solo-escritorio">
            <div className="panel-cab">
              <h2 className="titulo">Si cancelas {fuga.nombre}</h2>
            </div>
            <div>
              <div className="nota">Te quedan libres cada mes</div>
              <div className="cifra-l acento-tx">{formatearCOP(montoVigente(fuga, hoy))}</div>
            </div>
            <div className="lista lineas" style={{ marginTop: "auto" }}>
              <div className="fila">
                <span>En un año</span>
                <span className="ok">+{formatearCOP(montoVigente(fuga, hoy) * 12)}</span>
              </div>
              <div className="fila">
                <span>En cinco años</span>
                <span className="ok">+{formatearCOP(montoVigente(fuga, hoy) * 60)}</span>
              </div>
            </div>
          </section>
        )}

        <section className="panel ancho-2">
          <div className="panel-cab">
            <h2 className="titulo">Todas tus suscripciones</h2>
            <span className="nota num">{formatearCOP(vigente)} al mes</span>
          </div>
          {suscripciones.length > 0 ? (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th style={{ width: 92 }}>Valor</th>
                  <th className="opc2" style={{ width: 80 }}>Cobra el</th>
                  <th className="opc" style={{ width: 170 }}>Paga con</th>
                  <th style={{ width: 118 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map(s => {
                  const est = estadoDe(s, hoy);
                  const isFuga = esFuga(s, hoy);
                  return (
                    <tr key={s.id} onClick={() => setModal({ editando: s })} style={{ cursor: "pointer", opacity: s.activa ? 1 : 0.6 }}>
                      <td>{s.nombre}</td>
                      <td>{formatearCOP(montoVigente(s, hoy))}</td>
                      <td className="opc2">día {s.diaCobro}</td>
                      <td className="opc">{nombrePago(s.pagaCon)}</td>
                      <td>
                        {!s.activa ? (
                          <span className="pill neutra">Pausada</span>
                        ) : isFuga ? (
                          <span className="pill gasto">Sin uso</span>
                        ) : est === "promo" ? (
                          <span className="pill aviso">Promo hasta {s.promo!.hasta.split("-")[2]} {MESES_ABREV[parseInt(s.promo!.hasta.split("-")[1], 10) - 1].toLowerCase()}</span>
                        ) : est === "cobrada" ? (
                          <span className="pill neutra">Cobrada</span>
                        ) : (
                          <span className="pill neutra">Por cobrar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <>
              <div className="nota">Anota lo que te cobran solo cada mes: streaming, gimnasio, apps.</div>
              <div><button className="btn2" onClick={() => setModal({ editando: null })}>+ Nueva</button></div>
            </>
          )}

          {activas.some(s => s.pagaCon?.tipo === "tarjeta") && (
            <div className="caja solo-escritorio" style={{ marginTop: "auto" }}>
              <b>{activas.find(s => s.pagaCon?.tipo === "tarjeta")?.nombre} va a tu tarjeta {tarjetas.find(t => t.id === activas.find(s => s.pagaCon?.tipo === "tarjeta")?.pagaCon?.id)?.nombre}, y en Pro está bien.</b> Se paga a 1 cuota y se aparta para el corte: $0 de intereses. Si algún día lo difieres a cuotas, vuelve la deuda.
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-cab">
            <h2 className="titulo">Cobros de {MESES_NOMBRE[hoy.getMonth()].toLowerCase()}</h2>
            <span className="nota num">hoy {hoy.getDate()} {MESES_ABREV[hoy.getMonth()].toLowerCase()}</span>
          </div>
          
          <div className="lista lineas">
            {cobros.porCobrar.map(c => (
              <div key={c.sus.id}>
                <div className="fila">
                  <span>{c.sus.nombre} · {c.fecha.getDate()} {MESES_ABREV[c.fecha.getMonth()].toLowerCase()}</span>
                  <span>{formatearCOP(c.monto)}</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <span className={`pill ${c.faltan <= 3 ? "aviso" : "neutra"}`}>{etiquetaFaltan(c.faltan)}</span>
                  <span className="nota suave" style={{ marginLeft: 6 }}>{nombrePago(c.sus.pagaCon)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="fila nota">
            <span>Falta por cobrar</span>
            <span>{formatearCOP(cobros.porCobrar.reduce((a, b) => a + b.monto, 0))}</span>
          </div>

          <div className="solo-escritorio" style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 className="titulo">Ya cobrados este mes</h3>
            {cobros.cobrados.map(c => (
              <div key={c.sus.id} className="fila">
                <span className="suave">{c.sus.nombre} · {c.fecha.getDate()} {MESES_ABREV[c.fecha.getMonth()].toLowerCase()}</span>
                <span className="suave">{formatearCOP(c.monto)}</span>
              </div>
            ))}
            <div className="fila nota">
              <span>Cobrado</span>
              <span>{formatearCOP(cobros.cobrados.reduce((a, b) => a + b.monto, 0))}</span>
            </div>
          </div>
        </section>

      </div>

      {modal && (
        <ModalSuscripcion
          editando={modal.editando}
          billeteras={billeteras}
          tarjetas={tarjetas}
          onCerrar={() => setModal(null)}
          onGuardar={(s) => { onGuardarSuscripcion(s); setModal(null); }}
          onEliminar={(id) => { onEliminarSuscripcion(id); setModal(null); }}
          onCobro={(s) => { setCobrando(s); setModal(null); }}
        />
      )}

      {cobrando && (
        <ModalCobro
          sus={cobrando}
          hoy={hoy}
          billeteras={billeteras}
          onCerrar={() => setCobrando(null)}
          onRegistrar={registrarCobro}
        />
      )}
    </div>
  );
};

// ============================================================
// Modal: registrar el cobro contra una billetera real
// ============================================================
interface ModalCobroProps {
  sus: Suscripcion;
  hoy: Date;
  billeteras: Billetera[];
  onCerrar: () => void;
  onRegistrar: (
    sus: Suscripcion,
    billeteraId: string,
    monto: number,
    fecha: Date,
    actualizarPrecio: boolean
  ) => void;
}

const ModalCobro: React.FC<ModalCobroProps> = ({ sus, hoy, billeteras, onCerrar, onRegistrar }) => {
  const ciclo = cicloDe(sus, hoy);
  const guardado = montoVigente(sus, hoy);

  const [billeteraId, setBilleteraId] = useState(
    () => (billeteras.find((b) => b.saldo > 0) || billeteras[0])?.id ?? ""
  );
  const [montoStr, setMontoStr] = useState(formatearCOP(guardado));
  const [fechaStr, setFechaStr] = useState(isoDia(ciclo.inicio > hoy ? hoy : ciclo.inicio));
  const [actualizar, setActualizar] = useState(true);
  const [error, setError] = useState("");

  const monto = parseInt(montoStr.replace(/[^\d]/g, ""), 10) || 0;
  const billetera = billeteras.find((b) => b.id === billeteraId);
  const cambioDePrecio = monto > 0 && monto !== guardado;
  const diferencia = monto - guardado;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billeteraId) return setError("Elige de dónde sale la plata");
    if (monto <= 0) return setError("Escribe cuánto te cobraron");
    const fecha = fechaISOLocal(fechaStr);
    if (!fecha) return setError("Revisa la fecha");
    onRegistrar(sus, billeteraId, monto, fecha, cambioDePrecio && actualizar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accion)]/10 text-[color:var(--accion)] border border-[var(--accion)]/20">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold font-display text-[color:var(--texto)]">
                Cobro de {sus.nombre}
              </h2>
              <p className="text-[11px] text-[color:var(--texto-2)]">
                {sus.categoria || "Suscripción"} · cobra el {sus.diaCobro} de cada mes
              </p>
            </div>
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
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block">
              ¿De dónde sale?
            </label>
            <select
              value={billeteraId}
              onChange={(e) => { setBilleteraId(e.target.value); if (error) setError(""); }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors appearance-none cursor-pointer"
            >
              {billeteras.map((b) => (
                <option key={b.id} value={b.id} className="bg-[var(--superficie)]">
                  {b.nombre} · {formatearCOP(b.saldo)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block">
                ¿Cuánto te cobraron?
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={montoStr}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
                  setMontoStr(isNaN(n) ? "" : formatearCOP(n));
                  if (error) setError("");
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block">
                ¿Cuándo?
              </label>
              <input
                type="date"
                value={fechaStr}
                onChange={(e) => { setFechaStr(e.target.value); if (error) setError(""); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>
          </div>

          {cambioDePrecio && (
            <div
              className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
              style={{
                borderColor: "color-mix(in srgb, var(--accion) 24%, transparent)",
                background: "color-mix(in srgb, var(--accion) 8%, transparent)",
              }}
            >
              <strong className="text-[color:var(--texto)] font-bold">
                {diferencia > 0 ? "Subió." : "Bajó."}
              </strong>{" "}
              Tenías guardado {formatearCOP(guardado)} y ahora son {formatearCOP(monto)} —{" "}
              <strong className="text-[color:var(--texto)]">
                {formatearCOP(Math.abs(diferencia))} {diferencia > 0 ? "más" : "menos"}
              </strong>
              , {formatearCOP(Math.abs(diferencia) * 12)} al año.
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actualizar}
                  onChange={(e) => setActualizar(e.target.checked)}
                  className="accent-[var(--accion)] cursor-pointer"
                />
                <span className="font-semibold text-[color:var(--accion)]">
                  Actualizar el precio de {sus.nombre}
                </span>
              </label>
            </div>
          )}

          <div
            className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
            style={{
              borderColor: "color-mix(in srgb, var(--acento) 26%, transparent)",
              background: "color-mix(in srgb, var(--acento) 8%, transparent)",
            }}
          >
            Queda como <strong className="text-[color:var(--texto)]">gasto en {sus.categoria || "Suscripciones"}</strong>
            {fechaISOLocal(fechaStr) && (
              <>
                {" "}con fecha del{" "}
                <strong className="text-[color:var(--texto)]">
                  {fechaISOLocal(fechaStr)!.getDate()} de{" "}
                  {MESES_NOMBRE[fechaISOLocal(fechaStr)!.getMonth()].toLowerCase()}
                </strong>
              </>
            )}
            {billetera && (
              <>
                , baja tu saldo de {billetera.nombre} a{" "}
                <strong className="text-[color:var(--texto)]">{formatearCOP(billetera.saldo - monto)}</strong>
              </>
            )}{" "}
            y {sus.nombre} se marca como cobrada este ciclo.
          </div>

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cancelar</Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              Registrar
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Modal crear / editar suscripción
// ============================================================
const CATEGORIAS_SUS = ["Streaming", "Música", "Salud", "Software", "Otro"];

interface ModalSuscripcionProps {
  editando: Suscripcion | null;
  billeteras: Billetera[];
  tarjetas: TarjetaCredito[];
  onCerrar: () => void;
  onGuardar: (s: Suscripcion) => void;
  onEliminar: (id: string) => void;
  onCobro: (s: Suscripcion) => void;
}

const ModalSuscripcion: React.FC<ModalSuscripcionProps> = ({ editando, billeteras, tarjetas, onCerrar, onGuardar, onEliminar, onCobro }) => {
  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [nombre, setNombre] = useState(editando?.nombre || "");
  const [montoStr, setMontoStr] = useState(editando ? formatearCOP(editando.monto) : "");
  const [dia, setDia] = useState<number>(editando?.diaCobro || 1);
  const [categoria, setCategoria] = useState(editando?.categoria || "Streaming");
  const [color, setColor] = useState(editando?.color || COLORES[0]);
  const [pagaCon, setPagaCon] = useState(editando?.pagaCon ? `${editando.pagaCon.tipo}_${editando.pagaCon.id}` : "");
  const [ultimoUso, setUltimoUso] = useState(editando?.ultimoUso ? editando.ultimoUso.split("T")[0] : "");
  const [error, setError] = useState("");

  // --- Promoción ---
  const [tienePromo, setTienePromo] = useState(!!editando?.promo);
  const [promoMontoStr, setPromoMontoStr] = useState(
    formatearCOP(editando?.promo?.monto ?? 0)
  );
  const [duracionId, setDuracionId] = useState<string>("7d");
  const [desdeStr, setDesdeStr] = useState(
    editando?.promo?.desde ?? isoDia(hoy)
  );
  const [hastaManual, setHastaManual] = useState(editando?.promo?.hasta ?? "");

  const monto = parseInt(montoStr.replace(/[^\d]/g, ""), 10) || 0;
  const promoMonto = parseInt(promoMontoStr.replace(/[^\d]/g, ""), 10) || 0;
  const desde = fechaISOLocal(desdeStr) ?? hoy;
  const duracion: DuracionPromo | undefined = DURACIONES_PROMO.find((d) => d.id === duracionId);
  const hasta =
    duracionId === "fecha"
      ? fechaISOLocal(hastaManual)
      : duracion
      ? finSegunDuracion(desde, duracion)
      : null;

  const onMonto = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value.replace(/[^\d]/g, ""), 10);
    setter(isNaN(n) ? "" : formatearCOP(n));
    if (error) setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError("Ponle un nombre");
    if (monto <= 0) return setError("Escribe el precio normal, el de después de la promoción");
    if (tienePromo && !hasta) return setError("Dinos cuándo termina la promoción");

    const promo: PromoSuscripcion | undefined =
      tienePromo && hasta
        ? { monto: promoMonto, desde: isoDia(desde), hasta: isoDia(hasta) }
        : undefined;

    let pagaConObj = undefined;
    if (pagaCon) {
      const [tipo, id] = pagaCon.split("_");
      pagaConObj = { tipo: tipo as "billetera" | "tarjeta", id };
    }

    onGuardar({
      id: editando?.id || `sus-${Date.now()}`,
      nombre: nombre.trim(),
      monto,
      diaCobro: tienePromo && hasta ? hasta.getDate() : dia,
      categoria,
      activa: editando?.activa ?? true,
      color,
      creadoEn: editando?.creadoEn || new Date().toISOString(),
      promo,
      ultimoCobro: editando?.ultimoCobro,
      ultimoUso: ultimoUso ? new Date(ultimoUso + "T12:00:00").toISOString() : editando?.ultimoUso,
      pagaCon: pagaConObj,
    });
  };

  const etq = "text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block";
  const input =
    "w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">
              {editando ? "Editar suscripción" : "Nueva suscripción"}
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); if (error) setError(""); }} placeholder="Ej: Netflix" autoFocus className={input} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={etq}>Precio normal</label>
              <input type="text" inputMode="numeric" value={montoStr} onChange={onMonto(setMontoStr)} placeholder="$0" className={`${input} font-semibold tabular-nums`} />
            </div>
            <div className="space-y-1.5">
              <label className={etq}>Se cobra el día</label>
              <input
                type="number"
                min={1}
                max={31}
                value={tienePromo && hasta ? hasta.getDate() : dia}
                disabled={tienePromo && !!hasta}
                onChange={(e) => setDia(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className={`${input} font-semibold tabular-nums disabled:opacity-60`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={etq}>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${input} appearance-none cursor-pointer`}>
              {CATEGORIAS_SUS.map((c) => <option key={c} value={c} className="bg-[var(--superficie)]">{c}</option>)}
            </select>
          </div>

          {/* ===== Promoción ===== */}
          <button
            type="button"
            onClick={() => { setTienePromo(!tienePromo); if (error) setError(""); }}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              tienePromo
                ? "border-[var(--accion)]/45 bg-[var(--accion)]/8"
                : "border-[var(--linea)] bg-[var(--superficie-2)]"
            }`}
          >
            <span className="text-[13px] font-semibold text-[color:var(--texto)] flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${tienePromo ? "text-[color:var(--accion)]" : "text-[color:var(--texto-3)]"}`} />
              Tiene promoción o prueba gratis
            </span>
            <span
              className={`w-9 h-5 rounded-full relative flex-none transition-colors ${
                tienePromo ? "bg-[var(--accion)]" : "bg-[var(--linea)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  tienePromo ? "right-0.5 bg-[var(--on-accion)]" : "left-0.5 bg-[var(--texto-3)]"
                }`}
              />
            </span>
          </button>

          {tienePromo && (
            <div className="pl-3.5 border-l-2 border-[var(--accion)]/40 space-y-3.5">
              <div className="space-y-1.5">
                <label className={etq}>Mientras dure, pagas</label>
                <input type="text" inputMode="numeric" value={promoMontoStr} onChange={onMonto(setPromoMontoStr)} placeholder="$0" className={`${input} font-semibold tabular-nums`} />
              </div>

              <div className="space-y-1.5">
                <label className={etq}>¿Cuánto dura?</label>
                <div className="flex flex-wrap gap-1.5">
                  {DURACIONES_PROMO.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuracionId(d.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        duracionId === d.id
                          ? "bg-[var(--accion)]/12 border-[var(--accion)] text-[color:var(--accion)]"
                          : "bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]"
                      }`}
                    >
                      {d.etiqueta}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDuracionId("fecha")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed cursor-pointer transition-colors ${
                      duracionId === "fecha"
                        ? "bg-[var(--accion)]/12 border-[var(--accion)] text-[color:var(--accion)]"
                        : "bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-3)] hover:text-[color:var(--texto)]"
                    }`}
                  >
                    una fecha
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={etq}>Empezó el</label>
                  <input type="date" value={desdeStr} onChange={(e) => setDesdeStr(e.target.value)} className={input} />
                </div>
                {duracionId === "fecha" && (
                  <div className="space-y-1.5">
                    <label className={etq}>Termina el</label>
                    <input type="date" value={hastaManual} onChange={(e) => { setHastaManual(e.target.value); if (error) setError(""); }} className={input} />
                  </div>
                )}
              </div>

              {hasta && monto > 0 && (
                <div
                  className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--acento) 26%, transparent)",
                    background: "color-mix(in srgb, var(--acento) 8%, transparent)",
                  }}
                >
                  Hasta {fechaConDiaSemana(hasta)} te cuenta{" "}
                  <strong className="text-[color:var(--texto)]">{formatearCOP(promoMonto)}</strong>. Desde ahí
                  pasa a <strong className="text-[color:var(--texto)]">{formatearCOP(monto)} al mes</strong>,
                  cobrando el <strong className="text-[color:var(--texto)]">{hasta.getDate()} de cada mes</strong>.
                  Te aviso <strong className="text-[color:var(--texto)]">{DIAS_DE_AVISO} días antes</strong>, aquí y en Inicio.
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className={etq}>Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORES.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className="w-8 h-8 rounded-full cursor-pointer"
                  style={{ background: c, outline: color === c ? "2px solid var(--texto)" : "2px solid transparent", outlineOffset: "2px" }} aria-label={`Color ${c}`} />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={etq}>Paga con</label>
            <select value={pagaCon} onChange={(e) => setPagaCon(e.target.value)} className={`${input} appearance-none cursor-pointer`}>
              <option value="" className="bg-[var(--superficie)]">Sin asignar</option>
              {billeteras.map(b => (
                <option key={`billetera_${b.id}`} value={`billetera_${b.id}`} className="bg-[var(--superficie)]">{b.nombre}</option>
              ))}
              {tarjetas.map(t => (
                <option key={`tarjeta_${t.id}`} value={`tarjeta_${t.id}`} className="bg-[var(--superficie)]">{t.nombre} (crédito)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={etq}>Última vez que la usaste (opcional)</label>
            <input type="date" value={ultimoUso} onChange={(e) => setUltimoUso(e.target.value)} className={input} />
          </div>

          {editando && (
            <div className="pt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => onCobro(editando)} className="btn2">Registrar cobro</button>
              <button type="button" onClick={() => onGuardar({ ...editando, activa: !editando.activa })} className="btn2">
                {editando.activa ? "Pausar" : "Reactivar"}
              </button>
              <button type="button" onClick={() => onEliminar(editando.id)} className="link mal ml-auto">Eliminar</button>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            {!editando && <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cancelar</Boton>}
            {editando && <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">Cerrar</Boton>}
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {editando ? "Guardar" : "Agregar"}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
