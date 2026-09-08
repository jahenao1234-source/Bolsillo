import React, { useMemo, useState } from 'react';
import { ArrowRight, Plus, CalendarClock, Sparkles, TrendingDown } from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { GraficoDonut } from '../components/ui/GraficoDonut';
import { GraficoRitmo } from '../components/ui/GraficoRitmo';
import { formatearCOP } from '../utils/format';
import {
  ResumenFinanciero,
  Billetera,
  Deuda,
  Movimiento,
  Presupuesto,
  RetoAhorro,
  Suscripcion,
  TarjetaCredito,
} from '../types';
import { SeccionApp } from '../components/navigation/BarraNavegacion';
import {
  getContextoMes,
  calcularReparto,
  calcularRitmo,
  calcularAgenda,
  restoDelMes,
  categoriasDeGasto,
  DestinoReparto,
  EventoAgenda,
} from '../logic/resumenMes';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import { ModalRegistrarMovimiento } from '../components/billeteras/ModalRegistrarMovimiento';
import { CelebracionLogro } from '../components/ui/CelebracionLogro';

interface PantallaInicioProps {
  resumen: ResumenFinanciero;
  billeteras: Billetera[];
  deudas: Deuda[];
  movimientos: Movimiento[];
  disponibleMensual: number;
  esPro: boolean;
  presupuestos: Presupuesto[];
  retos: RetoAhorro[];
  suscripciones: Suscripcion[];
  tarjetasCredito: TarjetaCredito[];
  onNavegar: (seccion: SeccionApp) => void;
  onRegistrarMovimiento: (movimiento: Omit<Movimiento, 'id'>) => void;
  onAbonarDeuda?: (
    deudaId: string,
    billeteraId: string,
    monto: number
  ) => { exito: boolean; deudaSaldada: boolean };
}

const SEC = 'text-[11px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]';

/**
 * Encabezado de bloque: el rótulo a la izquierda y el dato duro a la derecha.
 * Los datos largos se ocultan en móvil para que el rótulo no se parta en dos.
 */
const EncabezadoBloque: React.FC<{
  titulo: string;
  dato?: React.ReactNode;
  datoSoloEscritorio?: boolean;
}> = ({ titulo, dato, datoSoloEscritorio = false }) => (
  <div className="flex items-baseline justify-between gap-3 px-1">
    <h2 className={`${SEC} whitespace-nowrap`}>{titulo}</h2>
    {dato && (
      <span
        className={`text-[11px] text-[color:var(--texto-3)] text-right ${
          datoSoloEscritorio ? 'hidden sm:inline' : ''
        }`}
      >
        {dato}
      </span>
    )}
  </div>
);

/** Texto y color del cambio contra el mes pasado. */
function leerDelta(
  delta: number | null,
  subirEsBueno: boolean,
  mesAnterior: string
): { texto: string; clase: string } {
  if (delta === null) return { texto: 'primer mes', clase: 'text-[color:var(--texto-3)]' };
  if (Math.abs(delta) < 1000) {
    return { texto: `igual que ${mesAnterior}`, clase: 'text-[color:var(--texto-3)]' };
  }
  const bueno = delta > 0 ? subirEsBueno : !subirEsBueno;
  return {
    texto: `${delta > 0 ? '+' : '−'}${formatearCOP(Math.abs(delta))}`,
    clase: bueno
      ? 'text-[color:var(--positivo)] font-semibold'
      : 'text-[color:var(--texto-2)] font-semibold',
  };
}

/** Una fila del reparto: nombre, cifra y barra sobre la misma escala del mes. */
const FilaDestino: React.FC<{
  destino: DestinoReparto;
  mesAnterior: string;
  onClick: () => void;
}> = ({ destino, mesAnterior, onClick }) => {
  const esLibre = destino.id === 'libre';
  const enRojo = destino.monto < 0;
  const delta = leerDelta(destino.delta, destino.subirEsBueno, mesAnterior);
  const colorCifra = esLibre
    ? enRojo
      ? 'text-[color:var(--alerta)]'
      : 'text-[color:var(--accion)]'
    : 'text-[color:var(--texto)]';

  return (
    <button
      type="button"
      onClick={onClick}
      title={destino.detalle}
      className={`
        w-full text-left cursor-pointer rounded-lg px-1.5 -mx-1.5 py-2
        grid items-center gap-x-3
        grid-cols-[74px_minmax(0,1fr)_auto] sm:grid-cols-[96px_122px_minmax(0,1fr)_104px]
        hover:bg-[var(--superficie-2)] transition-colors
        ${esLibre ? 'mt-1.5 pt-3 border-t border-[var(--hairline)]' : ''}
      `}
    >
      <span
        className={`col-start-1 text-[13px] truncate ${
          esLibre
            ? 'font-bold text-[color:var(--accion)]'
            : 'font-semibold text-[color:var(--texto-2)]'
        }`}
      >
        {esLibre ? 'Libre' : destino.nombre}
      </span>

      <span
        className={`col-start-3 sm:col-start-2 text-right sm:text-left font-display font-bold tabular-nums tracking-tight ${colorCifra} ${
          esLibre ? 'text-[17px] sm:text-[19px]' : 'text-[15px] sm:text-[17px]'
        }`}
      >
        {formatearCOP(destino.monto)}
      </span>

      <span className="col-start-2 sm:col-start-3 block h-2 rounded-full bg-[var(--superficie-2)] overflow-hidden">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(destino.porcentaje > 0 ? 3 : 0, Math.min(100, destino.porcentaje))}%`,
            background: enRojo ? 'var(--alerta)' : destino.color,
          }}
        />
      </span>

      <span className={`hidden sm:block sm:col-start-4 text-[11.5px] text-right ${delta.clase}`}>
        {delta.texto}
      </span>
    </button>
  );
};

/** Una fila de la agenda: el día, qué es y cuánto. */
const FilaEvento: React.FC<{ evento: EventoAgenda; onPagar?: () => void }> = ({
  evento,
  onPagar,
}) => (
  <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
    <div
      className={`flex flex-col items-center justify-center w-[34px] h-9 rounded-lg border ${
        evento.esHoy
          ? 'bg-[var(--accion)]/14 border-[var(--accion)]/45'
          : 'bg-[var(--superficie-2)] border-[var(--linea)]'
      }`}
    >
      <span
        className={`font-display font-bold text-[15px] leading-none ${
          evento.esHoy ? 'text-[color:var(--accion)]' : 'text-[color:var(--texto)]'
        }`}
      >
        {evento.dia}
      </span>
      <span
        className={`text-[8.5px] uppercase tracking-wide mt-0.5 ${
          evento.esHoy ? 'text-[color:var(--accion)]' : 'text-[color:var(--texto-3)]'
        }`}
      >
        {evento.esHoy ? 'hoy' : evento.mesAbrev}
      </span>
    </div>

    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-[color:var(--texto)] truncate">{evento.titulo}</p>
      <p className="text-[11px] text-[color:var(--texto-3)] flex items-center gap-1.5 mt-0.5">
        <span
          className="w-1.5 h-1.5 rounded-[2px] flex-none"
          style={{ background: evento.color }}
        />
        <span className="truncate">{evento.detalle}</span>
      </p>
      {onPagar && (
        <button
          type="button"
          onClick={onPagar}
          className="mt-1.5 px-2.5 py-1 rounded-lg bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-[11.5px] cursor-pointer hover:opacity-95 transition-opacity"
        >
          Registrar pago
        </button>
      )}
    </div>

    {evento.monto > 0 ? (
      <span
        className={`font-display font-bold text-sm tabular-nums text-right whitespace-nowrap ${
          evento.esHoy ? 'text-[color:var(--accion)]' : 'text-[color:var(--texto)]'
        }`}
      >
        {formatearCOP(evento.monto)}
      </span>
    ) : (
      <span className="text-[11px] font-medium text-[color:var(--texto-3)] text-right whitespace-nowrap">
        sin cobro
      </span>
    )}
  </div>
);

export const PantallaInicio: React.FC<PantallaInicioProps> = ({
  resumen,
  billeteras,
  deudas,
  movimientos,
  disponibleMensual,
  esPro,
  presupuestos,
  retos,
  suscripciones,
  tarjetasCredito,
  onNavegar,
  onRegistrarMovimiento,
  onAbonarDeuda,
}) => {
  const [deudaAbono, setDeudaAbono] = useState<Deuda | null>(null);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [celebracion, setCelebracion] = useState<{ nombre: string; monto: number } | null>(null);

  const contexto = useMemo(() => getContextoMes(), []);

  const deudasActivas = useMemo(
    () => deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0),
    [deudas]
  );

  const reparto = useMemo(
    () =>
      calcularReparto({
        contexto,
        movimientos,
        deudas,
        disponibleMensual,
        suscripciones,
        retos,
        esPro,
      }),
    [contexto, movimientos, deudas, disponibleMensual, suscripciones, retos, esPro]
  );

  const ritmo = useMemo(
    () => calcularRitmo({ contexto, movimientos, suscripciones, esPro }),
    [contexto, movimientos, suscripciones, esPro]
  );

  const agenda = useMemo(
    () =>
      calcularAgenda({
        contexto,
        deudas,
        suscripciones,
        tarjetas: tarjetasCredito,
        retos,
        esPro,
      }),
    [contexto, deudas, suscripciones, tarjetasCredito, retos, esPro]
  );

  const resto = useMemo(
    () => restoDelMes({ contexto, deudas, suscripciones, esPro }),
    [contexto, deudas, suscripciones, esPro]
  );

  const coloresCategoria = useMemo(() => {
    const mapa: Record<string, string> = {};
    for (const p of presupuestos) if (p.color) mapa[p.categoria] = p.color;
    return mapa;
  }, [presupuestos]);

  const { categorias, total: totalGastado } = useMemo(
    () => categoriasDeGasto({ contexto, movimientos, colores: coloresCategoria }),
    [contexto, movimientos, coloresCategoria]
  );

  const eventosVisibles = agenda.slice(0, 7);
  const totalAgenda = agenda.reduce((acc, e) => acc + e.monto, 0);

  // Lo que falta del mes = lo de la agenda que no cupo + lo que cae después de los 14 días.
  const ocultos = agenda.slice(eventosVisibles.length);
  const faltanCantidad = ocultos.length + resto.cantidad;
  const faltanMonto = ocultos.reduce((acc, e) => acc + e.monto, 0) + resto.monto;
  const categoriaTop = categorias[0];
  const libreEnRojo = reparto.libre < 0;

  const handleConfirmarAbono = (deudaId: string, billeteraId: string, monto: number) => {
    const nombre = deudaAbono?.nombre || 'esta deuda';
    setDeudaAbono(null);
    if (!onAbonarDeuda) return;
    const resultado = onAbonarDeuda(deudaId, billeteraId, monto);
    if (resultado.exito && resultado.deudaSaldada) {
      setCelebracion({ nombre, monto });
    }
  };

  const irA = (destino: DestinoReparto) => {
    if (destino.id === 'deudas') return onNavegar('deudas');
    if (destino.id === 'guardado') return onNavegar('crecer');
    return onNavegar('billeteras');
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 md:pb-10 animate-screen-enter">
      {/* ===================== Cabecera ===================== */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[color:var(--acento)] uppercase tracking-wider">
              Mi dinero
            </span>
            <span className="text-[color:var(--texto-3)]">·</span>
            <span className="text-xs text-[color:var(--texto-2)]">
              {contexto.nombre} · vas en el{' '}
              <strong className="text-[color:var(--texto)] font-semibold">
                día {contexto.dia} de {contexto.diasDelMes}
              </strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[color:var(--texto)]">
            Hola, <span className="text-platinum-gradient">{resumen.usuario}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {ritmo.hayAnterior && (
            <Chip variante={ritmo.diferenciaHoy >= 0 ? 'aqua' : 'alerta'}>
              {ritmo.diferenciaHoy >= 0 ? 'Más suave que en' : 'Más rápido que en'}{' '}
              {contexto.nombreAnterior.toLowerCase()}
            </Chip>
          )}
          <Boton
            variante="primario"
            tamano="sm"
            icono={<Plus className="w-4 h-4" />}
            onClick={() => setModalMovimiento(true)}
          >
            Registrar movimiento
          </Boton>
        </div>
      </header>

      {/* ===================================================== */}
      {/* El hilo del mes. En móvil el orden cambia: primero el  */}
      {/* reparto, después lo que se viene, y al final el ritmo. */}
      {/* ===================================================== */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">

        {/* ---------- A dónde va tu plata ---------- */}
        <section className="order-1 lg:col-span-7 flex flex-col gap-2.5">
          <EncabezadoBloque
            titulo="A dónde va tu plata"
            dato={`${contexto.nombre} completo · con lo que ya tiene fecha`}
            datoSoloEscritorio
          />
          <Tarjeta padding="lg">
            {reparto.entro > 0 ? (
              <>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="text-xs text-[color:var(--texto-2)]">
                    Este mes cuentas con{' '}
                    <strong className="font-display font-bold text-sm text-[color:var(--texto)] tabular-nums">
                      {formatearCOP(reparto.entro)}
                    </strong>
                    {reparto.entroRecibido < reparto.entro && (
                      <span> · llevas {formatearCOP(reparto.entroRecibido)} recibidos</span>
                    )}
                    {reparto.deltaEntro !== null && Math.abs(reparto.deltaEntro) >= 1000 && (
                      <span
                        className={`ml-2 font-semibold ${
                          reparto.deltaEntro > 0
                            ? 'text-[color:var(--positivo)]'
                            : 'text-[color:var(--texto-2)]'
                        }`}
                      >
                        {reparto.deltaEntro > 0 ? '+' : '−'}
                        {formatearCOP(Math.abs(reparto.deltaEntro))} vs{' '}
                        {contexto.nombreAnterior.toLowerCase()}
                      </span>
                    )}
                  </p>
                  <span className="hidden sm:inline text-[11px] text-[color:var(--texto-3)]">
                    Toca una fila para ir al módulo
                  </span>
                </div>

                <div className="mt-3.5 flex flex-col">
                  {reparto.destinos.map((d) => (
                    <FilaDestino
                      key={d.id}
                      destino={d}
                      mesAnterior={contexto.nombreAnterior.toLowerCase()}
                      onClick={() => irA(d)}
                    />
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--hairline)] flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
                  {libreEnRojo ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-[13px] text-[color:var(--texto-2)]">
                        Este mes te faltan
                      </span>
                      <span className="font-display font-black text-2xl sm:text-3xl leading-none tabular-nums text-[color:var(--alerta)]">
                        {formatearCOP(Math.abs(reparto.libre))}
                      </span>
                      <span className="text-[11px] text-[color:var(--texto-2)]">
                        para cubrir lo que ya tiene fecha
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-[13px] text-[color:var(--texto-2)]">
                        Libre para los{' '}
                        <strong className="text-[color:var(--texto)] font-semibold">
                          {reparto.diasRestantes} días
                        </strong>{' '}
                        que faltan
                      </span>
                      <span className="text-[color:var(--texto-3)]">→</span>
                      <span className="font-display font-black text-2xl sm:text-3xl leading-none tabular-nums text-[color:var(--acento)]">
                        {formatearCOP(reparto.porDia)}
                        <span className="text-xs font-semibold text-[color:var(--texto-2)] ml-1.5">
                          por día
                        </span>
                      </span>
                    </div>
                  )}
                  <span className="text-[11px] text-[color:var(--texto-3)]">
                    Lo que se te viene ya está apartado.
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 py-8">
                <Sparkles className="w-7 h-7 text-[color:var(--acento)]" />
                <p className="text-sm font-semibold text-[color:var(--texto)]">
                  Aún no hay ingresos en {contexto.nombre.toLowerCase()}
                </p>
                <p className="text-xs text-[color:var(--texto-2)] max-w-xs">
                  Registra lo que te entró y te muestro a dónde se va y cuánto te queda libre por día.
                </p>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  className="mt-1"
                  onClick={() => setModalMovimiento(true)}
                >
                  Registrar un ingreso
                </Boton>
              </div>
            )}
          </Tarjeta>
        </section>

        {/* ---------- En qué se va (la dona) ---------- */}
        <section className="order-3 lg:order-2 lg:col-span-5 flex flex-col gap-2.5">
          <EncabezadoBloque
            titulo="En qué se va"
            dato={`vs. ${contexto.nombreAnterior.toLowerCase()}`}
          />
          <Tarjeta padding="lg">
            {totalGastado > 0 ? (
              <>
                <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)]">
                  {categoriaTop.etiqueta} se lleva {Math.round(categoriaTop.porcentaje)} de cada 100
                </h3>
                <p className="text-xs text-[color:var(--texto-2)] mt-1">
                  Llevas {formatearCOP(totalGastado)} de los{' '}
                  {formatearCOP(reparto.gastosProyectados)} que proyectas gastar este mes.
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <GraficoDonut datos={categorias} tamano={128} grosor={17}>
                    <span className="font-display font-black text-[15px] tabular-nums text-[color:var(--texto)] leading-none">
                      {formatearCOP(totalGastado)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wide text-[color:var(--texto-3)] mt-1">
                      llevas gastados
                    </span>
                  </GraficoDonut>

                  <div className="flex-1 min-w-0 divide-y divide-[var(--hairline)]">
                    {categorias.map((c) => {
                      const delta = leerDelta(c.delta, false, contexto.nombreAnterior.toLowerCase());
                      return (
                        <div key={c.etiqueta} className="flex items-center gap-2.5 py-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-[3px] flex-none"
                            style={{ background: c.color }}
                          />
                          <span className="flex-1 text-xs text-[color:var(--texto-2)] truncate">
                            {c.etiqueta}
                          </span>
                          <span className="text-right">
                            <span className="block font-display font-bold text-[13px] tabular-nums text-[color:var(--texto)]">
                              {formatearCOP(c.valor)}
                            </span>
                            <span className={`block text-[10px] ${delta.clase}`}>{delta.texto}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 py-10">
                <TrendingDown className="w-7 h-7 text-[color:var(--texto-3)]" />
                <p className="text-sm font-semibold text-[color:var(--texto)]">
                  Todavía no has gastado nada
                </p>
                <p className="text-xs text-[color:var(--texto-2)] max-w-[26ch]">
                  Cuando registres gastos te muestro en qué se va y qué cambió contra{' '}
                  {contexto.nombreAnterior.toLowerCase()}.
                </p>
              </div>
            )}
          </Tarjeta>
        </section>

        {/* ---------- Tu ritmo de gasto ---------- */}
        <section className="order-4 lg:order-3 lg:col-span-7 flex flex-col gap-2.5">
          <EncabezadoBloque
            titulo="Tu ritmo de gasto"
            dato={
              ritmo.hayAnterior
                ? `Acumulado · ${contexto.nombre.toLowerCase()} vs ${contexto.nombreAnterior.toLowerCase()}`
                : 'Acumulado del mes'
            }
            datoSoloEscritorio
          />
          <Tarjeta padding="lg">
            {ritmo.hayAnterior ? (
              <>
                <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)]">
                  Vas{' '}
                  <span
                    className={
                      ritmo.diferenciaHoy >= 0
                        ? 'text-[color:var(--positivo)]'
                        : 'text-[color:var(--alerta)]'
                    }
                  >
                    {formatearCOP(Math.abs(ritmo.diferenciaHoy))}
                  </span>{' '}
                  {ritmo.diferenciaHoy >= 0 ? 'más suave' : 'más rápido'} que en{' '}
                  {contexto.nombreAnterior.toLowerCase()}
                </h3>
                <p className="text-xs text-[color:var(--texto-2)] mt-1">
                  Llevas {formatearCOP(ritmo.gastadoHoy)} gastados en {contexto.dia} días. A la misma
                  altura, {contexto.nombreAnterior.toLowerCase()} iba en{' '}
                  {formatearCOP(ritmo.gastadoAnteriorMismoDia)}.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)]">
                  Llevas {formatearCOP(ritmo.gastadoHoy)} gastados en {contexto.dia} días
                </h3>
                <p className="text-xs text-[color:var(--texto-2)] mt-1">
                  Cuando tengas un mes completo te pongo la curva del mes pasado al lado para
                  comparar.
                </p>
              </>
            )}

            <div className="mt-3 hidden sm:block">
              <GraficoRitmo
                puntosMes={ritmo.puntosMes}
                puntosAnterior={ritmo.puntosAnterior}
                proyeccion={ritmo.proyeccion}
                diasDelMes={ritmo.diasDelMes}
                diasDelMesAnterior={ritmo.diasDelMesAnterior}
                diaActual={contexto.dia}
                etiquetaAnterior={contexto.nombreAnterior.toLowerCase()}
              />
            </div>
            <div className="mt-3 sm:hidden">
              <GraficoRitmo
                compacto
                puntosMes={ritmo.puntosMes}
                puntosAnterior={ritmo.puntosAnterior}
                proyeccion={ritmo.proyeccion}
                diasDelMes={ritmo.diasDelMes}
                diasDelMesAnterior={ritmo.diasDelMesAnterior}
                diaActual={contexto.dia}
                etiquetaAnterior={contexto.nombreAnterior.toLowerCase()}
              />
            </div>

            <p className="mt-3 pt-3 border-t border-[var(--hairline)] text-xs text-[color:var(--texto-2)]">
              <span className="font-bold text-[color:var(--acento)]">Lo que dice: </span>
              si sigues así cierras {contexto.nombre.toLowerCase()} en{' '}
              <strong className="text-[color:var(--texto)] tabular-nums">
                {formatearCOP(ritmo.proyeccion)}
              </strong>
              {ritmo.hayAnterior && (
                <>
                  {' '}
                  —{' '}
                  <strong className="text-[color:var(--texto)] tabular-nums">
                    {formatearCOP(Math.abs(ritmo.diferenciaCierre))}
                  </strong>{' '}
                  {ritmo.diferenciaCierre >= 0 ? 'menos' : 'más'} que{' '}
                  {contexto.nombreAnterior.toLowerCase()}
                </>
              )}
              .
            </p>
          </Tarjeta>
        </section>

        {/* ---------- Lo que se te viene ---------- */}
        <section className="order-2 lg:order-4 lg:col-span-5 flex flex-col gap-2.5">
          <EncabezadoBloque
            titulo="Lo que se te viene"
            dato={
              agenda.length > 0 ? (
                <>
                  <strong className="text-[color:var(--texto-2)] tabular-nums">
                    {formatearCOP(totalAgenda)}
                  </strong>{' '}
                  en 14 días
                </>
              ) : (
                'próximos 14 días'
              )
            }
          />
          <Tarjeta padding="lg">
            {agenda.length > 0 ? (
              <>
                <div className="divide-y divide-[var(--hairline)] -my-2.5">
                  {eventosVisibles.map((ev) => {
                    const deuda =
                      ev.origen === 'deuda' && ev.esHoy
                        ? deudasActivas.find((d) => d.id === ev.deudaId)
                        : undefined;
                    return (
                      <FilaEvento
                        key={ev.id}
                        evento={ev}
                        onPagar={deuda ? () => setDeudaAbono(deuda) : undefined}
                      />
                    );
                  })}
                </div>

                <div className="mt-3.5 pt-3 border-t border-[var(--hairline)] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[color:var(--texto-3)]">
                    {faltanCantidad > 0
                      ? `Falta${faltanCantidad > 1 ? 'n' : ''} ${faltanCantidad} más este mes · ${formatearCOP(faltanMonto)}`
                      : 'Nada más te cae este mes'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavegar('deudas')}
                    className="text-xs font-bold text-[color:var(--acento)] hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    Ver el plan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 py-10">
                <CalendarClock className="w-7 h-7 text-[color:var(--positivo)]" />
                <p className="text-sm font-semibold text-[color:var(--texto)]">
                  No te cae nada en 14 días
                </p>
                <p className="text-xs text-[color:var(--texto-2)] max-w-[28ch]">
                  Ni pagos de deuda, ni cobros con fecha. Aprovecha para adelantar.
                </p>
              </div>
            )}
          </Tarjeta>
        </section>
      </div>

      {/* ===================== Modales ===================== */}
      <ModalAbonarDeuda
        abierto={!!deudaAbono}
        deuda={deudaAbono}
        billeteras={billeteras}
        onCerrar={() => setDeudaAbono(null)}
        onConfirmarAbono={handleConfirmarAbono}
      />

      <ModalRegistrarMovimiento
        abierto={modalMovimiento}
        billeteras={billeteras}
        onCerrar={() => setModalMovimiento(false)}
        onGuardar={(mov) => {
          onRegistrarMovimiento(mov);
          setModalMovimiento(false);
        }}
      />

      <CelebracionLogro
        activo={!!celebracion}
        nombreDeuda={celebracion?.nombre || ''}
        montoSaldado={celebracion?.monto || 0}
        quedanPocasDeudas={deudasActivas.length <= 1}
        onTerminar={() => setCelebracion(null)}
        onConocerPro={() => onNavegar('pro')}
      />
    </div>
  );
};
