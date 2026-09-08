import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { Billetera, Movimiento, PromoSuscripcion, Suscripcion } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { formatearCOP } from '../utils/format';
import { NotaModulo } from '../components/ui/NotaModulo';
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
} from '../logic/suscripciones';
import {
  MESES_ABREV,
  MESES_NOMBRE,
  fechaConDiaSemana,
  fechaISOLocal,
} from '../utils/fechas';

interface PantallaSuscripcionesProps {
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  billeteras: Billetera[];
  ingresoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  onRegistrarMovimiento: (movimiento: Omit<Movimiento, 'id'>) => void;
  onVolver: () => void;
}

const COLORES = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879', '#E89385'];

/** El día en formato ISO corto, que es como se guarda `ultimoCobro`. */
function isoDia(fecha: Date): string {
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** "15 sep 2026", el formato legible que usan los movimientos. */
function fechaLegible(fecha: Date): string {
  return `${`${fecha.getDate()}`.padStart(2, '0')} ${MESES_ABREV[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

function etiquetaFaltan(dias: number): string {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  return `en ${dias} días`;
}

// ============================================================
// La barra del ciclo: cuánto falta para que se renueve
// ============================================================
const BarraCiclo: React.FC<{ sus: Suscripcion; hoy: Date }> = ({ sus, hoy }) => {
  const ciclo = cicloDe(sus, hoy);
  const urgente = ciclo.faltan <= DIAS_DE_AVISO;
  const color = urgente ? 'var(--accion)' : 'var(--acento)';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-[color:var(--texto)]">
          {ciclo.esFinDePromo ? 'Te quedan ' : 'Se renueva '}
          <strong className="font-bold" style={{ color }}>
            {ciclo.esFinDePromo
              ? `${ciclo.faltan} ${ciclo.faltan === 1 ? 'día' : 'días'} de prueba`
              : etiquetaFaltan(ciclo.faltan)}
          </strong>
        </span>
        <span className="text-[10.5px] text-[color:var(--texto-3)] whitespace-nowrap tabular-nums">
          {ciclo.transcurridos} de {ciclo.totalDias} días
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, ciclo.pct)}%`, background: color }}
        />
      </div>

      <span className="text-[11px] text-[color:var(--texto-3)]">
        {ciclo.esFinDePromo ? 'Termina ' : ''}
        {fechaConDiaSemana(ciclo.fin)}
      </span>
    </div>
  );
};

export const PantallaSuscripciones: React.FC<PantallaSuscripcionesProps> = ({
  suscripciones,
  billeteras,
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
  const hayPromos = normal > vigente;
  const pctIngreso = ingresoMensual > 0 ? (vigente / ingresoMensual) * 100 : 0;
  // La barra va de 0 a 20% para que la marca del 10% quede a la mitad y se lea.
  const anchoPeso = Math.min(100, (pctIngreso / 20) * 100);

  const activas = suscripciones.filter((s) => s.activa);

  const toggleActiva = (s: Suscripcion) => onGuardarSuscripcion({ ...s, activa: !s.activa });

  /** "Me la quedo": la promo se acaba y queda como suscripción normal. */
  const quedarse = (s: Suscripcion) => {
    const fin = s.promo ? fechaISOLocal(s.promo.hasta) : null;
    onGuardarSuscripcion({
      ...s,
      promo: undefined,
      diaCobro: fin ? fin.getDate() : s.diaCobro,
    });
  };

  /** "La voy a cancelar": se pausa aquí; cancelarla de verdad es con el proveedor. */
  const cancelar = (s: Suscripcion) => onGuardarSuscripcion({ ...s, activa: false, promo: undefined });

  const registrarCobro = (
    sus: Suscripcion,
    billeteraId: string,
    monto: number,
    fecha: Date,
    actualizarPrecio: boolean
  ) => {
    onRegistrarMovimiento({
      tipo: 'gasto',
      monto,
      billeteraId,
      categoria: sus.categoria || 'Suscripciones',
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

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-5xl mx-auto animate-screen-enter">
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
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">Suscripciones</h1>
          </div>
        </div>
        <Boton variante="primario" tamano="sm" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
          Nueva
        </Boton>
      </header>

      <NotaModulo texto="Los cobros automáticos son la plata que se va sin que la decidas. Aquí ves cuándo se renueva cada uno, para cancelar a tiempo lo que ya no usas." />

      {/* ===== El aviso: lo que este módulo viene a resolver ===== */}
      {aviso && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-2.5"
          style={{
            borderColor: 'color-mix(in srgb, var(--accion) 45%, transparent)',
            background: 'color-mix(in srgb, var(--accion) 10%, var(--superficie))',
          }}
        >
          <span className="self-start inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--accion)] border border-[var(--accion)]/40 rounded-full px-2.5 py-0.5">
            <Zap className="w-3 h-3" /> Ojo con esta
          </span>

          <h2 className="font-display font-black text-xl sm:text-[21px] tracking-tight text-[color:var(--texto)]">
            {aviso.tipo === 'promo'
              ? `La prueba de ${aviso.sus.nombre} termina ${etiquetaFaltan(aviso.dias)}`
              : `${aviso.sus.nombre} se renueva ${etiquetaFaltan(aviso.dias)}`}
          </h2>

          <p className="text-[13px] text-[color:var(--texto-2)]">
            {aviso.tipo === 'promo' ? (
              <>
                El <strong className="text-[color:var(--texto)]">{aviso.ciclo.fin.getDate()} de {MESES_NOMBRE[aviso.ciclo.fin.getMonth()].toLowerCase()}</strong> pasa de{' '}
                <strong className="text-[color:var(--texto)]">{formatearCOP(aviso.sus.promo?.monto ?? 0)}</strong> a{' '}
                <strong className="text-[color:var(--texto)]">{formatearCOP(aviso.sus.monto)} al mes</strong>. Si no la cancelas, son{' '}
                <strong className="text-[color:var(--texto)]">{formatearCOP(aviso.sus.monto * 12)} al año</strong> por algo que empezaste a probar.
              </>
            ) : (
              <>
                Te van a cobrar <strong className="text-[color:var(--texto)]">{formatearCOP(montoVigente(aviso.sus, hoy))}</strong>{' '}
                {fechaConDiaSemana(aviso.ciclo.fin)}. Si ya no la usas, este es el momento de cancelarla.
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <Boton variante="primario" tamano="sm" onClick={() => cancelar(aviso.sus)}>
              La voy a cancelar
            </Boton>
            {aviso.tipo === 'promo' ? (
              <Boton variante="secundario" tamano="sm" onClick={() => quedarse(aviso.sus)}>
                Me la quedo
              </Boton>
            ) : (
              <Boton variante="secundario" tamano="sm" onClick={() => setCobrando(aviso.sus)}>
                Registrar el cobro
              </Boton>
            )}
          </div>

          <span className="text-[11px] text-[color:var(--texto-3)]">
            Bolsillo no cancela por ti: te avisa a tiempo para que lo hagas donde la contrataste.
          </span>
        </div>
      )}

      {/* ===== Cifras de apoyo ===== */}
      {suscripciones.length > 0 && (
        <Tarjeta padding="lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-[color:var(--texto-2)] uppercase tracking-wider">
                Te sangran al mes
              </span>
              <div className="font-display font-black text-2xl tabular-nums text-[color:var(--texto)] tracking-tight">
                {formatearCOP(vigente)}
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)]">
                {hayPromos ? (
                  <>
                    sube a{' '}
                    <strong className="text-[color:var(--accion)] font-bold">{formatearCOP(normal)}</strong>{' '}
                    cuando terminen las promos
                  </>
                ) : (
                  `${activas.length} ${activas.length === 1 ? 'activa' : 'activas'}`
                )}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-[color:var(--texto-2)] uppercase tracking-wider">
                Al año
              </span>
              <div className="font-display font-black text-2xl tabular-nums text-[color:var(--texto)] tracking-tight">
                {formatearCOP(normal * 12)}
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)]">contando las promos ya terminadas</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10.5px] font-bold text-[color:var(--texto-2)] uppercase tracking-wider">
                Peso sobre lo que te entra
              </span>
              {ingresoMensual > 0 ? (
                <>
                  <div className="font-display font-black text-2xl tabular-nums tracking-tight text-[color:var(--texto)]">
                    {pctIngreso.toFixed(1).replace('.', ',')}%
                  </div>
                  <div className="relative pt-1 pb-4">
                    <div className="h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, anchoPeso)}%`,
                          background: pctIngreso > 10 ? 'var(--accion)' : 'var(--acento)',
                        }}
                      />
                    </div>
                    <span className="absolute left-1/2 top-0 w-0.5 h-4 rounded-sm bg-[var(--texto-2)]" />
                    <span className="absolute left-1/2 top-4 -translate-x-1/2 text-[9.5px] text-[color:var(--texto-3)] whitespace-nowrap">
                      límite sano 10%
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-[color:var(--texto-3)] pt-1">
                  Registra un ingreso y te digo qué tajada se llevan.
                </p>
              )}
            </div>
          </div>
        </Tarjeta>
      )}

      {/* ===== Lista ===== */}
      {suscripciones.length === 0 ? (
        <Tarjeta padding="lg" className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
            <Repeat className="w-7 h-7 text-[color:var(--acento)]" />
          </div>
          <h3 className="font-display font-bold text-lg text-[color:var(--texto)]">Sin suscripciones registradas</h3>
          <p className="text-sm text-[color:var(--texto-2)] mt-1 max-w-sm mx-auto">
            Anota tus cobros automáticos —y las pruebas gratis, sobre todo— para que ninguno te agarre por sorpresa.
          </p>
          <div className="mt-5">
            <Boton variante="primario" tamano="md" icono={<Plus className="w-4 h-4" />} onClick={() => setModal({ editando: null })}>
              Agregar la primera
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {ordenadas.map((s) => {
            const color = s.color || 'var(--acento)';
            const estado = estadoDe(s, hoy);
            const ciclo = cicloDe(s, hoy);
            const urgente = s.activa && ciclo.faltan <= DIAS_DE_AVISO;

            return (
              <Tarjeta
                key={s.id}
                padding="md"
                className={`flex flex-col gap-3 ${!s.activa ? 'opacity-60' : ''} ${
                  estado === 'promo'
                    ? 'border-[var(--accion)]/55'
                    : urgente
                    ? 'border-[var(--accion)]/45'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
                      {estado === 'promo' ? (
                        <Zap className="w-4 h-4" style={{ color: 'var(--accion)' }} />
                      ) : (
                        <Repeat className="w-4 h-4" style={{ color }} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[color:var(--texto)] truncate">{s.nombre}</h3>
                      <p className="text-xs text-[color:var(--texto-2)] truncate">
                        {s.categoria || 'Suscripción'}
                        {s.activa && estado !== 'promo' && ` · cobra el ${s.diaCobro}`}
                      </p>
                    </div>
                  </div>

                  {estado === 'promo' ? (
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[color:var(--accion)] bg-[var(--accion)]/15 border border-[var(--accion)]/35 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      {(s.promo?.monto ?? 0) === 0 ? 'prueba gratis' : 'promoción'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setModal({ editando: s })} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Editar ${s.nombre}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onEliminarSuscripcion(s.id)} className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors" aria-label={`Eliminar ${s.nombre}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {s.activa && <BarraCiclo sus={s} hoy={hoy} />}

                {estado === 'promo' ? (
                  <>
                    <div className="text-xs text-[color:var(--texto-2)] rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] px-3 py-2.5">
                      Ahora pagas{' '}
                      <strong className="text-[color:var(--positivo)] font-bold">
                        {formatearCOP(s.promo?.monto ?? 0)}
                      </strong>{' '}
                      · el {ciclo.fin.getDate()} pasa a{' '}
                      <strong className="text-[color:var(--accion)] font-bold">
                        {formatearCOP(s.monto)}/mes
                      </strong>{' '}
                      — <strong className="text-[color:var(--texto)]">{formatearCOP(s.monto * 12)} al año</strong>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelar(s)}
                        className="flex-1 py-2 rounded-xl bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-xs cursor-pointer hover:opacity-95 transition-opacity"
                      >
                        La voy a cancelar
                      </button>
                      <button
                        onClick={() => quedarse(s)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                      >
                        Me la quedo
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display font-bold text-lg tabular-nums text-[color:var(--texto)]">
                        {formatearCOP(s.monto)}
                        <span className="text-xs font-medium text-[color:var(--texto-2)]">/mes</span>
                      </span>
                      {estado === 'cobrada' ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-[color:var(--positivo)] bg-[var(--positivo)]/13">
                          ✓ cobrada
                        </span>
                      ) : estado === 'pausada' ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-[color:var(--texto-3)] bg-[var(--superficie-2)]">
                          pausada
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-[color:var(--texto-3)] bg-[var(--superficie-2)]">
                          sin cobrar
                        </span>
                      )}
                    </div>

                    {estado === 'cobrada' ? (
                      <p className="text-[11.5px] text-[color:var(--texto-3)]">
                        Registrada el {fechaISOLocal(s.ultimoCobro || '')?.getDate()} de{' '}
                        {MESES_NOMBRE[
                          (fechaISOLocal(s.ultimoCobro || '') ?? hoy).getMonth()
                        ].toLowerCase()}
                      </p>
                    ) : estado === 'pausada' ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11.5px] text-[color:var(--positivo)] font-semibold">
                          Te ahorras {formatearCOP(s.monto * 12)} al año
                        </span>
                        <button
                          onClick={() => toggleActiva(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
                        >
                          Reactivar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCobrando(s)}
                          className="flex-1 py-2 rounded-xl bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-xs cursor-pointer hover:opacity-95 transition-opacity"
                        >
                          Registrar cobro
                        </button>
                        <button
                          onClick={() => toggleActiva(s)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
                        >
                          Pausar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Tarjeta>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalSuscripcion
          editando={modal.editando}
          onCerrar={() => setModal(null)}
          onGuardar={(s) => { onGuardarSuscripcion(s); setModal(null); }}
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
    () => (billeteras.find((b) => b.saldo > 0) || billeteras[0])?.id ?? ''
  );
  const [montoStr, setMontoStr] = useState(formatearCOP(guardado));
  const [fechaStr, setFechaStr] = useState(isoDia(ciclo.inicio > hoy ? hoy : ciclo.inicio));
  const [actualizar, setActualizar] = useState(true);
  const [error, setError] = useState('');

  const monto = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const billetera = billeteras.find((b) => b.id === billeteraId);
  const cambioDePrecio = monto > 0 && monto !== guardado;
  const diferencia = monto - guardado;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billeteraId) return setError('Elige de dónde sale la plata');
    if (monto <= 0) return setError('Escribe cuánto te cobraron');
    const fecha = fechaISOLocal(fechaStr);
    if (!fecha) return setError('Revisa la fecha');
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
                {sus.categoria || 'Suscripción'} · cobra el {sus.diaCobro} de cada mes
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
              onChange={(e) => { setBilleteraId(e.target.value); if (error) setError(''); }}
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
                  const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                  setMontoStr(isNaN(n) ? '' : formatearCOP(n));
                  if (error) setError('');
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
                onChange={(e) => { setFechaStr(e.target.value); if (error) setError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>
          </div>

          {cambioDePrecio && (
            <div
              className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
              style={{
                borderColor: 'color-mix(in srgb, var(--accion) 24%, transparent)',
                background: 'color-mix(in srgb, var(--accion) 8%, transparent)',
              }}
            >
              <strong className="text-[color:var(--texto)] font-bold">
                {diferencia > 0 ? 'Subió.' : 'Bajó.'}
              </strong>{' '}
              Tenías guardado {formatearCOP(guardado)} y ahora son {formatearCOP(monto)} —{' '}
              <strong className="text-[color:var(--texto)]">
                {formatearCOP(Math.abs(diferencia))} {diferencia > 0 ? 'más' : 'menos'}
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
              borderColor: 'color-mix(in srgb, var(--acento) 26%, transparent)',
              background: 'color-mix(in srgb, var(--acento) 8%, transparent)',
            }}
          >
            Queda como <strong className="text-[color:var(--texto)]">gasto en {sus.categoria || 'Suscripciones'}</strong>
            {fechaISOLocal(fechaStr) && (
              <>
                {' '}con fecha del{' '}
                <strong className="text-[color:var(--texto)]">
                  {fechaISOLocal(fechaStr)!.getDate()} de{' '}
                  {MESES_NOMBRE[fechaISOLocal(fechaStr)!.getMonth()].toLowerCase()}
                </strong>
              </>
            )}
            {billetera && (
              <>
                , baja tu saldo de {billetera.nombre} a{' '}
                <strong className="text-[color:var(--texto)]">{formatearCOP(billetera.saldo - monto)}</strong>
              </>
            )}{' '}
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
const CATEGORIAS_SUS = ['Streaming', 'Música', 'Salud', 'Software', 'Otro'];

interface ModalSuscripcionProps {
  editando: Suscripcion | null;
  onCerrar: () => void;
  onGuardar: (s: Suscripcion) => void;
}

const ModalSuscripcion: React.FC<ModalSuscripcionProps> = ({ editando, onCerrar, onGuardar }) => {
  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [nombre, setNombre] = useState(editando?.nombre || '');
  const [montoStr, setMontoStr] = useState(editando ? formatearCOP(editando.monto) : '');
  const [dia, setDia] = useState<number>(editando?.diaCobro || 1);
  const [categoria, setCategoria] = useState(editando?.categoria || 'Streaming');
  const [color, setColor] = useState(editando?.color || COLORES[0]);
  const [error, setError] = useState('');

  // --- Promoción ---
  const [tienePromo, setTienePromo] = useState(!!editando?.promo);
  const [promoMontoStr, setPromoMontoStr] = useState(
    formatearCOP(editando?.promo?.monto ?? 0)
  );
  const [duracionId, setDuracionId] = useState<string>('7d');
  const [desdeStr, setDesdeStr] = useState(
    editando?.promo?.desde ?? isoDia(hoy)
  );
  const [hastaManual, setHastaManual] = useState(editando?.promo?.hasta ?? '');

  const monto = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const promoMonto = parseInt(promoMontoStr.replace(/[^\d]/g, ''), 10) || 0;
  const desde = fechaISOLocal(desdeStr) ?? hoy;
  const duracion: DuracionPromo | undefined = DURACIONES_PROMO.find((d) => d.id === duracionId);
  const hasta =
    duracionId === 'fecha'
      ? fechaISOLocal(hastaManual)
      : duracion
      ? finSegunDuracion(desde, duracion)
      : null;

  const onMonto = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
    setter(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Ponle un nombre');
    if (monto <= 0) return setError('Escribe el precio normal, el de después de la promoción');
    if (tienePromo && !hasta) return setError('Dinos cuándo termina la promoción');

    const promo: PromoSuscripcion | undefined =
      tienePromo && hasta
        ? { monto: promoMonto, desde: isoDia(desde), hasta: isoDia(hasta) }
        : undefined;

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
    });
  };

  const etq = 'text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] block';
  const input =
    'w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">
              {editando ? 'Editar suscripción' : 'Nueva suscripción'}
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
            <input type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }} placeholder="Ej: Netflix" autoFocus className={input} />
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
            onClick={() => { setTienePromo(!tienePromo); if (error) setError(''); }}
            className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              tienePromo
                ? 'border-[var(--accion)]/45 bg-[var(--accion)]/8'
                : 'border-[var(--linea)] bg-[var(--superficie-2)]'
            }`}
          >
            <span className="text-[13px] font-semibold text-[color:var(--texto)] flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${tienePromo ? 'text-[color:var(--accion)]' : 'text-[color:var(--texto-3)]'}`} />
              Tiene promoción o prueba gratis
            </span>
            <span
              className={`w-9 h-5 rounded-full relative flex-none transition-colors ${
                tienePromo ? 'bg-[var(--accion)]' : 'bg-[var(--linea)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  tienePromo ? 'right-0.5 bg-[var(--on-accion)]' : 'left-0.5 bg-[var(--texto-3)]'
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
                          ? 'bg-[var(--accion)]/12 border-[var(--accion)] text-[color:var(--accion)]'
                          : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                      }`}
                    >
                      {d.etiqueta}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDuracionId('fecha')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-dashed cursor-pointer transition-colors ${
                      duracionId === 'fecha'
                        ? 'bg-[var(--accion)]/12 border-[var(--accion)] text-[color:var(--accion)]'
                        : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-3)] hover:text-[color:var(--texto)]'
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
                {duracionId === 'fecha' && (
                  <div className="space-y-1.5">
                    <label className={etq}>Termina el</label>
                    <input type="date" value={hastaManual} onChange={(e) => { setHastaManual(e.target.value); if (error) setError(''); }} className={input} />
                  </div>
                )}
              </div>

              {hasta && monto > 0 && (
                <div
                  className="p-3 rounded-xl border text-[11.5px] leading-relaxed text-[color:var(--texto-2)]"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--acento) 26%, transparent)',
                    background: 'color-mix(in srgb, var(--acento) 8%, transparent)',
                  }}
                >
                  Hasta {fechaConDiaSemana(hasta)} te cuenta{' '}
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
