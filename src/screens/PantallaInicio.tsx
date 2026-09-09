import React, { useMemo, useState } from 'react';
import { ArrowRight, Plus, CalendarClock, Sparkles, TrendingDown } from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { GraficoDonut } from '../components/ui/GraficoDonut';
import { GraficoRitmo } from '../components/ui/GraficoRitmo';
import { formatearCOP } from '../utils/format';
import { Marco, Columna, Zona, Scroll, Zocalo } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import {
  ResumenFinanciero,
  Billetera,
  Deuda,
  Movimiento,
  Presupuesto,
  RetoAhorro,
  Sobre,
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
  gastoPorCategoriaDelMes,
  diasHasta,
  COLOR_TARJETA,
  DestinoReparto,
  EventoAgenda,
} from '../logic/resumenMes';
import { calcularPlan } from '../logic/planDeudas';
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
  saldoTotal: number;
  presupuestos: Presupuesto[];
  sobres: Sobre[];
  totalApartado: number;
  retos: RetoAhorro[];
  suscripciones: Suscripcion[];
  sangradoMensual: number;
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

type TonoEtiqueta = 'ok' | 'ojo' | 'mal' | 'neutro';

interface Frente {
  id: string;
  modulo: string;
  cifra: string;
  sufijo?: string;
  /** Tramos de la barra (porcentajes sobre el total del riel). */
  segmentos: { ancho: number; color: string }[];
  /** Marca fija sobre el riel, en % (ej: por dónde va el mes). */
  hito?: number;
  pie: React.ReactNode;
  etiqueta?: { texto: string; tono: TonoEtiqueta };
  destino: SeccionApp;
}

const TONOS: Record<TonoEtiqueta, string> = {
  ok: 'text-[color:var(--positivo)] bg-[var(--positivo)]/12',
  ojo: 'text-[color:var(--accion)] bg-[var(--accion)]/12',
  mal: 'text-[color:var(--alerta)] bg-[var(--alerta)]/12',
  neutro: 'text-[color:var(--texto-2)] bg-[var(--superficie-2)]',
};

/** Un módulo resumido: cifra, riel y una línea de contexto. Todos idénticos. */
const TarjetaFrente: React.FC<{ frente: Frente; onClick: () => void }> = ({ frente, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-[var(--superficie)] hover:bg-[var(--elevada)] transition-colors cursor-pointer text-left px-4 py-3.5 flex flex-col gap-2"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--texto-2)] truncate">
        {frente.modulo}
      </span>
      {frente.etiqueta && (
        <span
          className={`text-[10.5px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap ${TONOS[frente.etiqueta.tono]}`}
        >
          {frente.etiqueta.texto}
        </span>
      )}
    </div>

    <div className="font-display font-black text-[19px] sm:text-[21px] tabular-nums tracking-tight text-[color:var(--texto)] leading-none">
      {frente.cifra}
      {frente.sufijo && (
        <span className="font-body text-[11.5px] font-medium text-[color:var(--texto-3)] ml-1.5 tracking-normal">
          {frente.sufijo}
        </span>
      )}
    </div>

    <div className="relative">
      <div className="h-[5px] rounded-full bg-[var(--superficie-2)] overflow-hidden flex">
        {frente.segmentos.map((s, i) => (
          <span
            key={i}
            className="h-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, s.ancho))}%`, background: s.color }}
          />
        ))}
      </div>
      {frente.hito !== undefined && (
        <span
          className="absolute -top-[3px] w-0.5 h-[11px] rounded-sm bg-[var(--texto-2)]"
          style={{ left: `${Math.min(99, Math.max(0, frente.hito))}%` }}
          title="por aquí va el mes"
        />
      )}
    </div>

    <p className="text-[11.5px] text-[color:var(--texto-3)] leading-snug">{frente.pie}</p>
  </button>
);

export const PantallaInicio: React.FC<PantallaInicioProps> = ({
  resumen,
  billeteras,
  deudas,
  movimientos,
  disponibleMensual,
  esPro,
  saldoTotal,
  presupuestos,
  sobres,
  totalApartado,
  retos,
  suscripciones,
  sangradoMensual,
  tarjetasCredito,
  onNavegar,
  onRegistrarMovimiento,
  onAbonarDeuda,
}) => {
  const [deudaAbono, setDeudaAbono] = useState<Deuda | null>(null);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [celebracion, setCelebracion] = useState<{ nombre: string; monto: number } | null>(null);

  // Cuando el cajón de Hoy empuja, la columna de la agenda sobra: muestra lo mismo.
  const cajonEmpuja = useCajonEmpuja();

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

  // ---------- Cómo van tus frentes ----------
  const frentes = useMemo<Frente[]>(() => {
    const lista: Frente[] = [];
    const pct = (parte: number, total: number) => (total > 0 ? (parte / total) * 100 : 0);

    // Deudas — el frente que siempre está, sea cual sea el nivel.
    if (deudasActivas.length > 0) {
      const saldo = deudasActivas.reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0);
      const intereses = deudasActivas.reduce(
        (acc, d) => acc + ((d.saldo ?? d.saldoTotal ?? 0) * (d.tasaMensual || 0)) / 100,
        0
      );
      const alPlan = reparto.destinos.find((d) => d.id === 'deudas')?.monto ?? 0;
      const baja = Math.round(alPlan - intereses);
      const plan = calcularPlan(deudasActivas, disponibleMensual, 'bola_de_nieve');

      lista.push({
        id: 'deudas',
        modulo: 'Deudas',
        cifra: formatearCOP(saldo),
        sufijo: 'te faltan',
        segmentos: [{ ancho: resumen.porcentajeDeudaPagada, color: 'var(--acento)' }],
        pie: (
          <>
            Vas <strong className="text-[color:var(--texto-2)] font-semibold">
              {resumen.porcentajeDeudaPagada}% del camino
            </strong>{' '}
            · libre en{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {plan.fechaLibertad}
            </strong>
          </>
        ),
        etiqueta:
          baja > 0
            ? { texto: `−${formatearCOP(baja)} este mes`, tono: 'ok' }
            : { texto: 'no alcanza al interés', tono: 'mal' },
        destino: 'deudas',
      });
    }

    if (!esPro) {
      // Sin Pro, el segundo frente es la plata que sí controla: sus billeteras.
      lista.push({
        id: 'billeteras',
        modulo: 'Tu plata',
        cifra: formatearCOP(saldoTotal),
        sufijo: `en ${billeteras.length} ${billeteras.length === 1 ? 'cuenta' : 'cuentas'}`,
        segmentos: billeteras.map((b) => ({
          ancho: pct(Math.max(0, b.saldo), Math.max(1, saldoTotal)),
          color: b.color || 'var(--acento)',
        })),
        pie: (
          <>
            Llevas{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {formatearCOP(reparto.entroRecibido)}
            </strong>{' '}
            recibidos y {formatearCOP(reparto.gastadoHastaHoy)} gastados
          </>
        ),
        destino: 'billeteras',
      });
      return lista;
    }

    // --- Presupuesto
    const gastosCat = gastoPorCategoriaDelMes(movimientos, contexto.mes, contexto.anio);
    const topeTotal = presupuestos.reduce((acc, p) => acc + (p.tope || 0), 0);
    if (topeTotal > 0) {
      const gastadoEnTopes = presupuestos.reduce(
        (acc, p) => acc + (gastosCat[p.categoria] || 0),
        0
      );
      const pctGastado = pct(gastadoEnTopes, topeTotal);
      const pctMes = pct(contexto.dia, contexto.diasDelMes);
      const apretada = presupuestos
        .map((p) => ({ categoria: p.categoria, uso: pct(gastosCat[p.categoria] || 0, p.tope) }))
        .sort((a, b) => b.uso - a.uso)[0];

      lista.push({
        id: 'presupuesto',
        modulo: 'Presupuesto',
        cifra: formatearCOP(gastadoEnTopes),
        sufijo: `de ${formatearCOP(topeTotal)}`,
        segmentos: [
          {
            ancho: pctGastado,
            color: pctGastado > pctMes + 8 ? 'var(--accion)' : 'var(--positivo)',
          },
        ],
        hito: pctMes,
        pie: (
          <>
            Gastaste{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {Math.round(pctGastado)}%
            </strong>{' '}
            y el mes va en{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {Math.round(pctMes)}%
            </strong>
            {apretada && apretada.uso > 0 && ` · ${apretada.categoria} al ${Math.round(apretada.uso)}%`}
          </>
        ),
        etiqueta:
          apretada && apretada.uso >= 90
            ? { texto: `ojo ${apretada.categoria}`, tono: 'mal' }
            : pctGastado > pctMes + 8
            ? { texto: 'vas rápido', tono: 'ojo' }
            : { texto: 'vas parejo', tono: 'ok' },
        destino: 'crecer',
      });
    }

    // --- Sobres
    if (sobres.length > 0) {
      const metas = sobres.reduce((acc, s) => acc + (s.meta || 0), 0);
      const base = metas > 0 ? metas : Math.max(1, totalApartado);
      const porAvance = [...sobres].sort(
        (a, b) => pct(b.apartado, b.meta || 1) - pct(a.apartado, a.meta || 1)
      );

      lista.push({
        id: 'sobres',
        modulo: 'Sobres',
        cifra: formatearCOP(totalApartado),
        sufijo: 'apartados',
        segmentos: sobres.map((s) => ({
          ancho: pct(s.apartado, base),
          color: s.color || 'var(--positivo)',
        })),
        pie: porAvance
          .slice(0, 3)
          .map((s) => `${s.nombre} ${Math.round(pct(s.apartado, s.meta || s.apartado || 1))}%`)
          .join(' · '),
        etiqueta: {
          texto: `${sobres.length} ${sobres.length === 1 ? 'sobre' : 'sobres'}`,
          tono: 'neutro',
        },
        destino: 'crecer',
      });
    }

    // --- Reto de ahorro
    const reto = retos.find((r) => !r.completado) || retos[0];
    if (reto) {
      lista.push({
        id: 'reto',
        modulo: 'Reto de ahorro',
        cifra: formatearCOP(reto.acumulado),
        sufijo: `de ${formatearCOP(reto.metaTotal)}`,
        segmentos: [
          { ancho: pct(reto.acumulado, reto.metaTotal), color: reto.color || 'var(--positivo)' },
        ],
        pie: (
          <>
            {reto.nombre} · semana{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {Math.min(reto.semanaActual, reto.semanasTotales)} de {reto.semanasTotales}
            </strong>
          </>
        ),
        etiqueta: reto.completado
          ? { texto: 'completado', tono: 'ok' }
          : reto.racha > 0
          ? { texto: `racha de ${reto.racha}`, tono: 'ok' }
          : { texto: 'sin racha aún', tono: 'neutro' },
        destino: 'crecer',
      });
    }

    // --- Suscripciones
    const activas = suscripciones.filter((s) => s.activa);
    if (activas.length > 0) {
      const pctIngreso = pct(sangradoMensual, reparto.entro);
      lista.push({
        id: 'suscripciones',
        modulo: 'Suscripciones',
        cifra: formatearCOP(sangradoMensual),
        sufijo: 'al mes',
        segmentos: [{ ancho: pctIngreso, color: 'var(--alerta)' }],
        pie: (
          <>
            {activas.length} activas · son{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold">
              {formatearCOP(sangradoMensual * 12)}
            </strong>{' '}
            en un año
          </>
        ),
        etiqueta:
          pctIngreso >= 10
            ? { texto: `${Math.round(pctIngreso)}% de lo que entra`, tono: 'mal' }
            : { texto: `${Math.round(pctIngreso)}% de lo que entra`, tono: 'neutro' },
        destino: 'crecer',
      });
    }

    // --- Tarjetas y días de corte
    if (tarjetasCredito.length > 0) {
      const cupo = tarjetasCredito.reduce((acc, t) => acc + (t.cupo || 0), 0);
      const usado = deudas
        .filter((d) => d.tipo === 'tarjeta' && !d.saldada)
        .reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0);
      const pctCupo = pct(usado, cupo);
      const corte = tarjetasCredito
        .map((t) => ({ nombre: t.nombre, dias: diasHasta(t.diaCorte, contexto.hoy) }))
        .sort((a, b) => a.dias - b.dias)[0];

      lista.push({
        id: 'tarjetas',
        modulo: 'Tarjetas',
        cifra: cupo > 0 ? `${Math.round(pctCupo)}%` : `${tarjetasCredito.length}`,
        sufijo: cupo > 0 ? 'de cupo usado' : 'registradas',
        segmentos: [{ ancho: cupo > 0 ? pctCupo : 0, color: COLOR_TARJETA }],
        pie:
          cupo > 0 ? (
            <>
              {formatearCOP(usado)} de{' '}
              <strong className="text-[color:var(--texto-2)] font-semibold">
                {formatearCOP(cupo)}
              </strong>{' '}
              · el corte que sigue es el de {corte.nombre}
            </>
          ) : (
            `${corte.nombre} es la que corta primero`
          ),
        etiqueta: {
          texto: corte.dias === 0 ? 'corta hoy' : `corte en ${corte.dias} ${corte.dias === 1 ? 'día' : 'días'}`,
          tono: corte.dias <= 3 ? 'ojo' : 'neutro',
        },
        destino: 'crecer',
      });
    }

    return lista;
  }, [
    deudasActivas, reparto, resumen.porcentajeDeudaPagada, disponibleMensual, esPro, saldoTotal,
    billeteras, movimientos, contexto, presupuestos, sobres, totalApartado, retos, suscripciones,
    sangradoMensual, tarjetasCredito, deudas,
  ]);

  // Sin Pro se suma la celda que invita a Crecer, para que la rejilla cierre completa.
  const celdasFrentes = frentes.length + (esPro ? 0 : 1);
  const columnasFrentes = celdasFrentes % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
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
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)] whitespace-nowrap">
          {contexto.nombre} · día {contexto.dia} de {contexto.diasDelMes}
        </span>
        <span className="w-[110px] h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden flex-none">
          <span
            className="block h-full rounded-sm bg-[var(--acento)]"
            style={{ width: `${(contexto.dia / contexto.diasDelMes) * 100}%` }}
          />
        </span>
        {ritmo.hayAnterior && (
          <Chip variante={ritmo.diferenciaHoy >= 0 ? 'aqua' : 'alerta'}>
            {ritmo.diferenciaHoy >= 0 ? 'Más suave que en' : 'Más rápido que en'}{' '}
            {contexto.nombreAnterior.toLowerCase()}
          </Chip>
        )}
      </BarraTitulo>

      <BarraAcciones>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => setModalMovimiento(true)}
        >
          Registrar movimiento
        </Boton>
      </BarraAcciones>

      {/* ===================== Cabecera de móvil ===================== */}
      <header className="md:hidden flex flex-col gap-3 mb-1">
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
          <h1 className="text-2xl font-black font-display tracking-tight text-[color:var(--texto)]">
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
      {/* El marco del mes. Tres columnas en escritorio; cuando  */}
      {/* entra el cajón de Hoy la agenda sobra —el cajón muestra */}
      {/* lo mismo— y las otras dos se ensanchan.                */}
      {/* En móvil el marco se deshace en la pila de siempre.    */}
      {/* ===================================================== */}
      <Marco columnas={cajonEmpuja ? '404px minmax(0,1fr)' : '376px minmax(0,1fr) 356px'}>

        {/* ---------- Columna 1: el héroe y el reparto ---------- */}
        <Columna ordenMovil={1} borde>
          {reparto.entro > 0 ? (
            <>
              <Zona className="xl:!py-[18px]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  {libreEnRojo
                    ? 'Este mes te faltan'
                    : `Te queda libre · ${reparto.diasRestantes} días por delante`}
                </p>
                {libreEnRojo ? (
                  <>
                    <p className="font-display font-black text-[44px] leading-none tabular-nums text-[color:var(--alerta)] mt-2">
                      {formatearCOP(Math.abs(reparto.libre))}
                    </p>
                    <p className="text-xs text-[color:var(--texto-2)] mt-2 leading-relaxed">
                      Es lo que falta para cubrir lo que ya tiene fecha este mes.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-black text-[52px] leading-none tabular-nums text-[color:var(--accion)] mt-2">
                      {formatearCOP(reparto.porDia)}
                    </p>
                    <p className="font-display font-bold text-base text-[color:var(--accion)] mb-2">
                      por día
                    </p>
                    <p className="text-xs text-[color:var(--texto-2)] leading-relaxed">
                      Son los{' '}
                      <strong className="text-[color:var(--texto)] font-semibold tabular-nums">
                        {formatearCOP(reparto.libre)}
                      </strong>{' '}
                      que no tienen dueño todavía. Lo que se te viene ya está apartado.
                    </p>
                  </>
                )}
              </Zona>

              <Zona sinPadding className="xl:!py-1">
                <div className="flex flex-col px-4 py-1 xl:px-[17px] xl:py-0">
                  {reparto.destinos.map((d) => (
                    <FilaDestino
                      key={d.id}
                      destino={d}
                      mesAnterior={contexto.nombreAnterior.toLowerCase()}
                      onClick={() => irA(d)}
                    />
                  ))}
                </div>
              </Zona>

              <Zona crece className="xl:flex xl:justify-end">
                <p className="text-[11px] text-[color:var(--texto-3)] leading-relaxed xl:mt-auto">
                  Este mes cuentas con{' '}
                  <strong className="text-[color:var(--texto-2)] font-semibold tabular-nums">
                    {formatearCOP(reparto.entro)}
                  </strong>
                  {reparto.entroRecibido < reparto.entro && (
                    <>
                      {' '}
                      · llevas{' '}
                      <strong className="text-[color:var(--texto-2)] font-semibold tabular-nums">
                        {formatearCOP(reparto.entroRecibido)}
                      </strong>{' '}
                      recibidos
                    </>
                  )}
                  {reparto.deltaEntro !== null && Math.abs(reparto.deltaEntro) >= 1000 && (
                    <span
                      className={`ml-1.5 font-semibold ${
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
                  . Toca una fila para ir al módulo.
                </p>
              </Zona>
            </>
          ) : (
            <Zona crece>
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
            </Zona>
          )}
        </Columna>

        {/* ---------- Columna 2: el ritmo y la dona ---------- */}
        <Columna ordenMovil={3} borde={!cajonEmpuja}>
          <Zona crece>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  Tu ritmo de gasto
                </p>
                {ritmo.hayAnterior ? (
                  <>
                    <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)] mt-1.5">
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
                    <p className="text-[11px] text-[color:var(--texto-3)] mt-1 leading-relaxed">
                      Llevas {formatearCOP(ritmo.gastadoHoy)} gastados en {contexto.dia} días. A la
                      misma altura, {contexto.nombreAnterior.toLowerCase()} iba en{' '}
                      {formatearCOP(ritmo.gastadoAnteriorMismoDia)}.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)] mt-1.5">
                      Llevas {formatearCOP(ritmo.gastadoHoy)} gastados en {contexto.dia} días
                    </h3>
                    <p className="text-[11px] text-[color:var(--texto-3)] mt-1 leading-relaxed">
                      Cuando tengas un mes completo te pongo la curva del mes pasado al lado para
                      comparar.
                    </p>
                  </>
                )}
              </div>
              <div className="hidden lg:flex items-center gap-3 text-[10px] text-[color:var(--texto-3)] flex-none pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[var(--acento)] block" />
                  {contexto.nombre.toLowerCase()}
                </span>
                {ritmo.hayAnterior && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 border-t-2 border-dashed border-[var(--texto-3)] block" />
                    {contexto.nombreAnterior.toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 xl:flex-1 xl:min-h-[168px] xl:overflow-hidden hidden sm:block">
              <div className="w-full h-full">
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

            <p className="mt-3 pt-3 border-t border-[var(--hairline)] text-[11px] text-[color:var(--texto-3)] leading-relaxed flex-none">
              Si sigues así cierras {contexto.nombre.toLowerCase()} en{' '}
              <strong className="text-[color:var(--texto-2)] tabular-nums">
                {formatearCOP(ritmo.proyeccion)}
              </strong>
              {ritmo.hayAnterior && (
                <>
                  {' '}
                  —{' '}
                  <strong className="text-[color:var(--texto-2)] tabular-nums">
                    {formatearCOP(Math.abs(ritmo.diferenciaCierre))}
                  </strong>{' '}
                  {ritmo.diferenciaCierre >= 0 ? 'menos' : 'más'} que{' '}
                  {contexto.nombreAnterior.toLowerCase()}
                </>
              )}
              .
            </p>
          </Zona>

          <Zona>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  En qué se va
                </p>
                {totalGastado > 0 && (
                  <h3 className="font-display font-bold text-[15px] text-[color:var(--texto)] mt-1.5">
                    {categoriaTop.etiqueta} se lleva {Math.round(categoriaTop.porcentaje)} de cada 100
                  </h3>
                )}
              </div>
              <span className="text-[11px] text-[color:var(--texto-3)] whitespace-nowrap">
                vs. {contexto.nombreAnterior.toLowerCase()}
              </span>
            </div>

            {totalGastado > 0 ? (
              <div className="mt-3 flex items-center gap-4">
                <GraficoDonut datos={categorias} tamano={124} grosor={17}>
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
          </Zona>
        </Columna>

        {/* ---------- Columna 3: la agenda ---------- */}
        {/* Sobra en escritorio cuando el cajón está abierto: muestra lo mismo. */}
        <Columna ordenMovil={2} className={cajonEmpuja ? 'xl:hidden' : ''}>
          <Zona>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Lo que se te viene
            </p>
            <div className="flex items-baseline justify-between gap-3 mt-1.5">
              <span className="font-display font-bold text-[22px] tabular-nums text-[color:var(--texto)] leading-none">
                {agenda.length > 0 ? formatearCOP(totalAgenda) : '—'}
              </span>
              <span className="text-[11px] text-[color:var(--texto-3)]">
                en 14 días{agenda.length > 0 ? ` · ${agenda.length} eventos` : ''}
              </span>
            </div>
          </Zona>

          {agenda.length > 0 ? (
            <>
              <Zona crece sinPadding>
                <Scroll className="px-4 xl:px-[17px]">
                  <div className="divide-y divide-[var(--hairline)]">
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
                </Scroll>
              </Zona>

              <Zona>
                <div className="flex items-center justify-between gap-3">
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
              </Zona>
            </>
          ) : (
            <Zona crece>
              <div className="flex flex-col items-center text-center gap-2 py-10">
                <CalendarClock className="w-7 h-7 text-[color:var(--positivo)]" />
                <p className="text-sm font-semibold text-[color:var(--texto)]">
                  No te cae nada en 14 días
                </p>
                <p className="text-xs text-[color:var(--texto-2)] max-w-[28ch]">
                  Ni pagos de deuda, ni cobros con fecha. Aprovecha para adelantar.
                </p>
              </div>
            </Zona>
          )}
        </Columna>
      </Marco>

      {/* ---------- El zócalo: cómo van tus frentes ---------- */}
      {celdasFrentes > 1 && (
        <>
          {/* Escritorio: rieles idénticos bajo el marco */}
          <Zocalo columnas={celdasFrentes}>
            {frentes.map((f) => (
              <TarjetaFrente key={f.id} frente={f} onClick={() => onNavegar(f.destino)} />
            ))}
            {!esPro && (
              <button
                type="button"
                onClick={() => onNavegar('crecer')}
                className="bg-[var(--superficie)] hover:bg-[var(--elevada)] transition-colors cursor-pointer text-left px-4 py-3.5 flex flex-col gap-2"
              >
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--acento)]">
                  Crecer
                </span>
                <div className="font-display font-black text-[17px] tracking-tight text-[color:var(--texto)] leading-tight">
                  5 módulos más
                </div>
                <p className="text-[11px] text-[color:var(--texto-3)] leading-snug">
                  Topes, sobres, retos, suscripciones y días de corte.
                </p>
              </button>
            )}
          </Zocalo>

          {/* Móvil: la rejilla de siempre */}
          <section className="xl:hidden flex flex-col gap-2.5 order-5">
            <EncabezadoBloque
              titulo="Cómo van tus frentes"
              dato="Un vistazo a cada módulo · toca para entrar"
              datoSoloEscritorio
            />
            <div className="grid grid-cols-2 gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-2xl overflow-hidden">
              {frentes.map((f) => (
                <TarjetaFrente key={f.id} frente={f} onClick={() => onNavegar(f.destino)} />
              ))}
              {!esPro && (
                <button
                  type="button"
                  onClick={() => onNavegar('crecer')}
                  className="bg-[var(--superficie)] hover:bg-[var(--elevada)] transition-colors cursor-pointer text-left px-4 py-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[color:var(--acento)]">
                      Crecer
                    </span>
                    <span className="text-[10.5px] font-bold rounded-full px-2 py-0.5 bg-[var(--acento)]/12 text-[color:var(--acento)] whitespace-nowrap">
                      5 módulos
                    </span>
                  </div>
                  <div className="font-display font-black text-[17px] tracking-tight text-[color:var(--texto)] leading-tight">
                    Presupuesto, sobres y más
                  </div>
                  <p className="text-[11.5px] text-[color:var(--texto-3)] leading-snug">
                    Aquí irían tus topes por categoría, tus sobres, tu reto, tus suscripciones y tus
                    días de corte.
                  </p>
                </button>
              )}
            </div>
          </section>
        </>
      )}

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
