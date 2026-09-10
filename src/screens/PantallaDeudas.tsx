import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  ShoppingBag,
  FileText,
  Landmark,
  Trash2,
  Check,
  Edit3,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  MoreHorizontal,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { EstadoVacio } from '../components/ui/EstadoVacio';
import { formatearCOP } from '../utils/format';
import { Deuda, TipoDeuda, EstrategiaPago, Billetera } from '../types';
import { calcularPlan, ordenarDeudasSegunEstrategia, calcularTablaPlan } from '../logic/planDeudas';
import {
  marcarSaldada,
  eliminarDeuda,
  guardarDeuda,
  setDisponibleMensual,
  abonarDeudaDesdeBilletera,
  getBilleteras,
  reordenarDeudas,
} from '../data/store';
import { ModalAgregarDeuda } from '../components/deudas/ModalAgregarDeuda';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import { SimuladorAbonoExtra } from '../components/deudas/SimuladorAbonoExtra';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { CelebracionLogro } from '../components/ui/CelebracionLogro';
import { AvisoContextualPro } from '../components/ui/AvisoContextualPro';
import { registrarVictoria } from '../utils/victorias';
import { SeccionApp } from '../components/navigation/BarraNavegacion';
import { useTema } from '../utils/theme';

interface PantallaDeudasProps {
  deudas: Deuda[];
  deudaTotal: number;
  disponibleMensual: number;
  billeteras?: Billetera[];
  onVolver: () => void;
  onNavegar?: (seccion: SeccionApp) => void;
  onAbonarDeuda?: (
    deudaId: string,
    billeteraId: string,
    monto: number
  ) => { exito: boolean; deudaSaldada: boolean; deuda?: Deuda };
  esPro?: boolean;
}

interface ItemDeudaProps {
  deuda: Deuda;
  idx: number;
  totalDeudas: number;
  esPersonalizado: boolean;
  onAbrirAbono: (deuda: Deuda) => void;
  onMarcarSaldada: (deuda: Deuda) => void;
  onEditarDeuda: (deuda: Deuda) => void;
  onEliminarDeuda: (id: string, nombre: string) => void;
  onMover: (id: string, direccion: 'arriba' | 'abajo') => void;
  getTipoInfo: (tipo: TipoDeuda) => {
    etiqueta: string;
    icon: React.ReactNode;
    variante: 'alerta' | 'aqua' | 'azul' | 'platino';
  };
}

interface AccionMenu {
  etiqueta: string;
  icono: React.ReactNode;
  onClick: () => void;
  tono?: 'normal' | 'positivo' | 'alerta';
}

/**
 * Las acciones de una vez: saldar, editar, eliminar. Viven aqui para que la
 * fila no gaste una linea entera en botones que casi nunca se tocan. Abonar se
 * queda fuera, a la vista, porque esa si se usa todos los meses.
 */
const MenuAcciones: React.FC<{ acciones: AccionMenu[]; nombre: string }> = ({ acciones, nombre }) => {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  const color = (t?: AccionMenu['tono']) =>
    t === 'positivo'
      ? 'text-[color:var(--positivo)]'
      : t === 'alerta'
        ? 'text-[color:var(--alerta)]'
        : 'text-[color:var(--texto-2)]';

  return (
    <div className="relative flex-none" ref={caja}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Mas acciones para ${nombre}`}
        className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 min-w-[152px] rounded-xl border border-[var(--linea)] bg-[var(--elevada)] shadow-lg py-1"
        >
          {acciones.map((a) => (
            <button
              key={a.etiqueta}
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false);
                a.onClick();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-[var(--superficie-2)] cursor-pointer transition-colors ${color(a.tono)}`}
            >
              {a.icono}
              <span>{a.etiqueta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TarjetaDeudaItem: React.FC<ItemDeudaProps> = ({
  deuda,
  idx,
  totalDeudas,
  esPersonalizado,
  onAbrirAbono,
  onMarcarSaldada,
  onEditarDeuda,
  onEliminarDeuda,
  onMover,
  getTipoInfo,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deuda.id, disabled: !esPersonalizado });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1,
  };

  const tipoInfo = getTipoInfo(deuda.tipo);
  const saldo = deuda.saldo ?? deuda.saldoTotal ?? 0;
  const montoOrig = deuda.montoOriginal || saldo;
  const porcentajePagado =
    montoOrig > 0
      ? Math.min(100, Math.max(0, Math.round(((montoOrig - saldo) / montoOrig) * 100)))
      : 0;

  /* Lo de una vez: al menu. Con orden propio, subir y bajar entran tambien. */
  const accionesMenu: AccionMenu[] = [
    ...(esPersonalizado
      ? [
          {
            etiqueta: 'Subir prioridad',
            icono: <ChevronUp className="w-3.5 h-3.5" />,
            onClick: () => onMover(deuda.id, 'arriba'),
          },
          {
            etiqueta: 'Bajar prioridad',
            icono: <ChevronDown className="w-3.5 h-3.5" />,
            onClick: () => onMover(deuda.id, 'abajo'),
          },
        ]
      : []),
    {
      etiqueta: 'Marcar saldada',
      icono: <CheckCircle2 className="w-3.5 h-3.5" />,
      onClick: () => onMarcarSaldada(deuda),
      tono: 'positivo' as const,
    },
    {
      etiqueta: 'Editar deuda',
      icono: <Pencil className="w-3.5 h-3.5" />,
      onClick: () => onEditarDeuda(deuda),
    },
    {
      etiqueta: 'Quitar del plan',
      icono: <Trash2 className="w-3.5 h-3.5" />,
      onClick: () => onEliminarDeuda(deuda.id, deuda.nombre),
      tono: 'alerta' as const,
    },
  ];

  return (
    <div ref={setNodeRef} style={style}>
      {/* ---- Escritorio: tres lineas y las acciones de una vez, plegadas ---- */}
      <div className="hidden xl:block">
        <Tarjeta
          padding="sm"
          className="relative border-[var(--linea)] hover:border-[var(--acento)]/30 transition-colors"
        >
          {/* Quien es y cuanto debes */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {esPersonalizado && (
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  className="p-0.5 -ml-0.5 rounded text-[color:var(--texto-3)] hover:text-[color:var(--texto)] cursor-grab active:cursor-grabbing touch-none flex-none"
                  title="Arrastrar para reordenar"
                  aria-label={`Arrastrar para reordenar ${deuda.nombre}`}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}
              <h4 className="text-[13px] font-semibold text-[color:var(--texto)] truncate">
                {deuda.nombre}
              </h4>
            </div>
            <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--alerta)] flex-none">
              {formatearCOP(saldo)}
            </span>
          </div>

          {/* De que es, a que interes, y el minimo del mes */}
          <p className="text-[10.5px] text-[color:var(--texto-3)] mt-0.5 truncate">
            {tipoInfo.etiqueta} &middot; {deuda.tasaMensual}% mes &middot; mínimo{' '}
            <strong className="text-[color:var(--texto-2)] font-semibold tabular-nums">
              {formatearCOP(deuda.pagoMinimo)}
            </strong>
          </p>

          {/* Lo que llevas pagado, y que puedes hacer */}
          <div className="flex items-center gap-2 mt-2">
            {montoOrig > saldo ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="h-1 flex-1 rounded-full bg-[var(--superficie-2)] border border-[var(--linea)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--positivo)] rounded-full transition-all duration-500"
                    style={{ width: `${porcentajePagado}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold tabular-nums text-[color:var(--positivo)] flex-none">
                  {porcentajePagado}%
                </span>
              </div>
            ) : (
              <span className="flex-1 text-[10px] text-[color:var(--texto-3)]">
                Sin abonos todavía
              </span>
            )}

            <button
              type="button"
              onClick={() => onAbrirAbono(deuda)}
              className="flex-none inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--acento)]/40 text-[11px] font-semibold text-[color:var(--acento)] hover:bg-[var(--acento)]/10 cursor-pointer transition-colors"
            >
              <CreditCard className="w-3 h-3" />
              <span>Abonar</span>
            </button>

            <MenuAcciones acciones={accionesMenu} nombre={deuda.nombre} />
          </div>
        </Tarjeta>
      </div>

      {/* ---- Movil: la ficha de siempre. Aqui hay ancho de sobra y no estorba. ---- */}
      <div className="xl:hidden">
      <Tarjeta
        padding="md"
        className="transition-all relative border-[var(--linea)] hover:border-[var(--acento)]/30"
      >
        {/* Fila principal de datos */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            {esPersonalizado && (
              <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5 mr-0.5">
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  className="p-1 rounded text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-grab active:cursor-grabbing touch-none"
                  title="Arrastrar para reordenar"
                  aria-label={`Arrastrar para reordenar ${deuda.nombre}`}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => onMover(deuda.id, 'arriba')}
                    disabled={idx === 0}
                    className="p-0.5 text-[color:var(--texto-2)] hover:text-[color:var(--texto)] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                    title="Subir prioridad"
                    aria-label="Subir prioridad"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMover(deuda.id, 'abajo')}
                    disabled={idx === totalDeudas - 1}
                    className="p-0.5 text-[color:var(--texto-2)] hover:text-[color:var(--texto)] disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                    title="Bajar prioridad"
                    aria-label="Bajar prioridad"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] flex items-center justify-center flex-shrink-0 mt-0.5">
              {tipoInfo.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-[color:var(--texto)] truncate">
                  {deuda.nombre}
                </h4>
                <Chip variante={tipoInfo.variante}>{tipoInfo.etiqueta}</Chip>
              </div>

              <div className="flex items-center gap-2 text-xs text-[color:var(--texto-2)] mt-1">
                <span>
                  Interés: <strong className="text-[color:var(--texto)]">{deuda.tasaMensual}% mes</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Mínimo: <strong className="text-[color:var(--texto)]">{formatearCOP(deuda.pagoMinimo)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="font-display font-bold text-base sm:text-lg tabular-nums text-[color:var(--alerta)]">
              {formatearCOP(saldo)}
            </div>
            <p className="text-[10px] text-[color:var(--texto-2)]">Por pagar</p>
          </div>
        </div>

        {montoOrig > saldo && (
          <div className="mt-3 pt-2 border-t border-[var(--linea)]">
            <div className="flex items-center justify-between text-[11px] text-[color:var(--texto-2)] mb-1">
              <span>Ya pagado</span>
              <span className="tabular-nums font-semibold text-[color:var(--positivo)]">
                {porcentajePagado}%
              </span>
            </div>
            <div className="w-full bg-[var(--superficie)] h-1.5 rounded-full overflow-hidden border border-[var(--linea)]">
              <div
                className="bg-[var(--positivo)] h-full rounded-full transition-all duration-500"
                style={{ width: `${porcentajePagado}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 pt-2.5 border-t border-[var(--linea)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAbrirAbono(deuda)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--superficie)] hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-xs font-semibold text-[color:var(--texto)] cursor-pointer transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              <span>Abonar</span>
            </button>

            <button
              type="button"
              onClick={() => onMarcarSaldada(deuda)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--positivo)]/12 hover:bg-[var(--positivo)]/20 border border-[var(--positivo)]/30 text-xs font-semibold text-[color:var(--positivo)] cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saldada</span>
            </button>

            <button
              type="button"
              onClick={() => onEditarDeuda(deuda)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--superficie)] hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-xs font-semibold text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
              title="Editar deuda"
            >
              <Pencil className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              <span>Editar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEliminarDeuda(deuda.id, deuda.nombre)}
            className="p-2 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--alerta)] hover:bg-[var(--alerta)]/10 cursor-pointer transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Eliminar de mi plan"
            aria-label={`Eliminar deuda ${deuda.nombre}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </Tarjeta>
      </div>
    </div>
  );
};

const ESTRATEGIA_INFO: Record<EstrategiaPago, { etiqueta: string; por: string }> = {
  bola_de_nieve: { etiqueta: '❄️ Bola de nieve', por: 'la más pequeña primero' },
  avalancha: { etiqueta: '⛰️ Avalancha', por: 'la de mayor interés primero' },
  personalizado: { etiqueta: '✍️ Mi orden', por: 'el orden que tú elijas' },
};

export const PantallaDeudas: React.FC<PantallaDeudasProps> = ({
  deudas,
  disponibleMensual,
  billeteras = [],
  onVolver,
  onNavegar,
  onAbonarDeuda,
  esPro = false,
}) => {
  const { esPapel } = useTema();
  // Con el cajón abierto, el camino se pliega bajo la tabla.
  const cajonEmpuja = useCajonEmpuja();

  const [estrategia, setEstrategia] = useState<EstrategiaPago>('bola_de_nieve');
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [modalAbonarAbierto, setModalAbonarAbierto] = useState(false);
  const [deudaSeleccionadaAbono, setDeudaSeleccionadaAbono] = useState<Deuda | null>(null);
  const [deudaAEditar, setDeudaAEditar] = useState<Deuda | null>(null);
  const [selectorEstrategiaAbierto, setSelectorEstrategiaAbierto] = useState(false);
  const [tablaAbierta, setTablaAbierta] = useState(false);
  const [mesElegido, setMesElegido] = useState<number | null>(null);
  // Las liquidadas son historia, no decision: plegadas por defecto.
  const [liquidadasAbiertas, setLiquidadasAbiertas] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [celebracionActiva, setCelebracionActiva] = useState(false);
  const [deudaCelebrada, setDeudaCelebrada] = useState<{ nombre: string; monto: number }>({
    nombre: '',
    monto: 0,
  });

  const [editandoDisponible, setEditandoDisponible] = useState(false);
  const [disponibleTemp, setDisponibleTemp] = useState(formatearCOP(disponibleMensual));

  const deudasActivas = useMemo(
    () => deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0),
    [deudas]
  );
  const deudasSaldadas = useMemo(
    () => deudas.filter((d) => d.saldada || (d.saldo ?? d.saldoTotal ?? 0) <= 0),
    [deudas]
  );

  const plan = useMemo(
    () => calcularPlan(deudasActivas, disponibleMensual, estrategia),
    [deudasActivas, disponibleMensual, estrategia]
  );
  const planBola = useMemo(
    () => calcularPlan(deudasActivas, disponibleMensual, 'bola_de_nieve'),
    [deudasActivas, disponibleMensual]
  );
  const planAval = useMemo(
    () => calcularPlan(deudasActivas, disponibleMensual, 'avalancha'),
    [deudasActivas, disponibleMensual]
  );
  const ahorroAvalancha = Math.max(0, planBola.interesesTotales - planAval.interesesTotales);

  const deudasOrdenadas = useMemo(
    () => ordenarDeudasSegunEstrategia(deudasActivas, estrategia),
    [deudasActivas, estrategia]
  );
  const totalSaldosActivos = useMemo(
    () => deudasActivas.reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0),
    [deudasActivas]
  );
  const tabla = useMemo(
    () => calcularTablaPlan(deudasActivas, disponibleMensual, estrategia),
    [deudasActivas, disponibleMensual, estrategia]
  );

  /*
   * Si el plan no cierra, la simulacion llega al tope de 360 meses. Enseniar
   * 30 anios de un saldo que no baja no dice nada: se corta en 12 y la pantalla
   * explica por que.
   */
  const filasTabla = plan.esViable ? tabla.filas : tabla.filas.slice(0, 12);

  // El mes que se esta mirando en el grafico. Por defecto, el primero.
  const filaElegida =
    filasTabla.find((f) => f.mes === mesElegido) ?? filasTabla[0] ?? null;
  const maxSaldoTabla = filasTabla.reduce((a, f) => Math.max(a, f.total), 0);

  const prioridad = deudasOrdenadas[0] || null;
  const demas = deudasOrdenadas.slice(1);
  const minimosTotal = plan.pagoMinimoTotal;
  const extraMensual = Math.max(0, disponibleMensual - minimosTotal);
  const saldoPrio = prioridad ? (prioridad.saldo ?? prioridad.saldoTotal ?? 0) : 0;
  const baseFoco = prioridad ? Math.min(prioridad.pagoMinimo, saldoPrio) : 0;
  const abonoPrioridad = prioridad ? Math.min(saldoPrio, baseFoco + extraMensual) : 0;
  const extraFoco = Math.max(0, abonoPrioridad - baseFoco);
  const caeEsteMes = prioridad ? abonoPrioridad >= saldoPrio : false;

  const handleMarcarSaldada = (deuda: Deuda) => {
    marcarSaldada(deuda.id, true);
    const monto = deuda.saldo ?? deuda.saldoTotal ?? 0;
    registrarVictoria({
      titulo: deuda.nombre,
      descripcion: `Deuda saldada al 100% (${deuda.tipo}).`,
      monto,
      tipo: 'deuda_saldada',
    });
    setDeudaCelebrada({ nombre: deuda.nombre, monto });
    setCelebracionActiva(true);
  };

  const handleReactivarDeuda = (deuda: Deuda) => marcarSaldada(deuda.id, false);

  const handleEliminarDeuda = (id: string, nombre: string) => {
    if (window.confirm(`¿Deseas eliminar "${nombre}" de tu lista?`)) {
      eliminarDeuda(id);
    }
  };

  const handleAbrirAbono = (deuda: Deuda) => {
    setDeudaSeleccionadaAbono(deuda);
    setModalAbonarAbierto(true);
  };

  const handleEditarDeuda = (deuda: Deuda) => {
    setDeudaAEditar(deuda);
    setModalAgregarAbierto(true);
  };

  const handleConfirmarAbono = (deudaId: string, billeteraId: string, monto: number) => {
    const resultado = onAbonarDeuda
      ? onAbonarDeuda(deudaId, billeteraId, monto)
      : abonarDeudaDesdeBilletera(deudaId, billeteraId, monto);

    if (resultado.exito && resultado.deudaSaldada) {
      const nombreDeuda = deudaSeleccionadaAbono?.nombre || 'esta deuda';
      registrarVictoria({
        titulo: nombreDeuda,
        descripcion: 'Deuda liquidada al 100% con abono directo.',
        monto,
        tipo: 'deuda_saldada',
      });
      setDeudaCelebrada({ nombre: nombreDeuda, monto });
      setCelebracionActiva(true);
    }
  };

  const handleGuardarNuevaDeuda = (deuda: Deuda) => {
    guardarDeuda(deuda);
    setDeudaAEditar(null);
  };

  const handleGuardarDisponible = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parseInt(disponibleTemp.replace(/[^\d]/g, ''), 10) || 0;
    if (clean > 0) {
      setDisponibleMensual(clean);
      setDisponibleTemp(formatearCOP(clean));
      setEditandoDisponible(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const viejosIds = deudasOrdenadas.map((d) => d.id);
      const oldIndex = viejosIds.indexOf(active.id as string);
      const newIndex = viejosIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        reordenarDeudas(arrayMove<string>(viejosIds, oldIndex, newIndex));
      }
    }
  };

  const handleMover = (id: string, direccion: 'arriba' | 'abajo') => {
    const ids = deudasOrdenadas.map((d) => d.id);
    const index = ids.indexOf(id);
    if (index === -1) return;
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    reordenarDeudas(arrayMove<string>(ids, index, targetIndex));
  };

  const getTipoInfo = (tipo: TipoDeuda) => {
    switch (tipo) {
      case 'gota_a_gota':
        return { etiqueta: 'Gota a gota', icon: <Zap className="w-3.5 h-3.5 text-[color:var(--alerta)]" />, variante: 'alerta' as const };
      case 'fiado':
        return { etiqueta: 'Fiado tienda', icon: <ShoppingBag className="w-3.5 h-3.5 text-[color:var(--positivo)]" />, variante: 'aqua' as const };
      case 'libranza':
        return { etiqueta: 'Libranza', icon: <FileText className="w-3.5 h-3.5 text-[color:var(--acento)]" />, variante: 'azul' as const };
      case 'prestamo':
        return { etiqueta: 'Préstamo', icon: <Landmark className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />, variante: 'platino' as const };
      case 'tarjeta':
      default:
        return { etiqueta: 'Tarjeta', icon: <CreditCard className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />, variante: 'platino' as const };
    }
  };

  const secH = 'text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] px-1';

  /**
   * A dónde llegas: el camino de estaciones. Vive en su propia columna, y
   * cuando el cajón de Hoy empuja se pliega debajo de la tabla en vez de
   * desaparecer.
   */
  /**
   * La bola de nieve, estación por estación.
   *
   * En cada tramo el ataque es toda tu plata menos los mínimos de las deudas
   * que siguen vivas. Por eso cuando una cae su cuota no se pierde: se suma a
   * la siguiente, y cada deuda tarda menos que la anterior. El plan ya lo
   * calculaba; lo que faltaba era decirlo.
   */
  const camino = useMemo(() => {
    const orden = plan.ordenSaldado;
    const minimosDesde = (i: number) =>
      orden.slice(i).reduce((a, d) => a + (d.pagoMinimo || 0), 0);
    const ataqueEn = (i: number) => Math.max(0, disponibleMensual - minimosDesde(i + 1));

    return orden.map((item, i) => ({
      item,
      ataque: ataqueEn(i),
      siguiente: orden[i + 1] ?? null,
      ataqueSiguiente: orden[i + 1] ? ataqueEn(i + 1) : 0,
      restante: tabla.filas.find((f) => f.mes === item.mesSaldado)?.total ?? 0,
      esUltimo: i === orden.length - 1,
    }));
  }, [plan.ordenSaldado, disponibleMensual, tabla.filas]);

  /**
   * Un color por deuda, estable entre el gráfico y el desglose. Se evita el
   * naranja a propósito: en esta app significa "acción", no "dato".
   */
  const COLORES_DEUDA = [
    'var(--alerta)',
    'var(--azul)',
    'var(--acento)',
    'var(--positivo)',
    'var(--texto-3)',
  ];
  const colorDeuda = (i: number) => COLORES_DEUDA[i % COLORES_DEUDA.length];

  const enMeses = (n: number) => `en ${n} ${n === 1 ? 'mes' : 'meses'}`;

  /** Cuánto de la plata total se está concentrando en una sola deuda. */
  const anchoAtaque = (monto: number) =>
    disponibleMensual > 0 ? Math.max(3, Math.round((monto / disponibleMensual) * 100)) : 0;

  const panelCamino = (
    <>
      {camino.length > 0 && (
        <div className="space-y-3">
          <h2 className={secH}>Tu camino</h2>
          <Tarjeta padding="lg">
            {/* Hoy: contra cuál vas, y con cuánto */}
            <div className="relative pl-8 pb-5">
              <span className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-[var(--hairline)]" />
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[var(--accion)] border-2 border-[var(--accion)]" />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--accion)]">
                  Hoy · estás aquí
                </span>
                <span className="text-[11px] tabular-nums text-[color:var(--texto-3)]">
                  debes {formatearCOP(totalSaldosActivos)}
                </span>
              </div>
              <div className="text-sm font-bold text-[color:var(--texto)] mt-0.5">
                Atacas <span className="text-[color:var(--accion)]">{camino[0].item.nombre}</span>
              </div>
              <div className="mt-1.5 rounded-lg border border-[var(--accion)]/25 bg-[var(--accion)]/8 px-2.5 py-1.5 text-[11px] text-[color:var(--texto-2)] leading-relaxed">
                Recibe su mínimo de{' '}
                <strong className="text-[color:var(--accion)] font-bold tabular-nums">
                  {formatearCOP(camino[0].item.pagoMinimo)}
                </strong>
                {extraMensual > 0 ? (
                  <>
                    {' '}más tus{' '}
                    <strong className="text-[color:var(--accion)] font-bold tabular-nums">
                      {formatearCOP(extraMensual)}
                    </strong>{' '}
                    de extra ={' '}
                    <strong className="text-[color:var(--accion)] font-bold tabular-nums">
                      {formatearCOP(camino[0].ataque)}
                    </strong>{' '}
                    al mes.
                  </>
                ) : (
                  <> al mes. Sin extra, el plan avanza a su paso más lento.</>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[color:var(--texto-3)]">
                <span>ataque</span>
                <div className="flex-1 h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accion)] transition-all duration-500"
                    style={{ width: `${anchoAtaque(camino[0].ataque)}%` }}
                  />
                </div>
                <strong className="tabular-nums text-[color:var(--texto-2)] font-bold">
                  {formatearCOP(camino[0].ataque)}
                </strong>
              </div>
            </div>

            {/* Cada caída empuja a la siguiente */}
            {camino.map((e) => (
              <div key={e.item.id} className="relative pl-8 pb-5 last:pb-0">
                {!e.esUltimo && (
                  <span className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-[var(--hairline)]" />
                )}
                <span
                  className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                    e.esUltimo
                      ? 'bg-[var(--positivo)] border-[var(--positivo)]'
                      : 'border-[var(--positivo)] bg-[var(--superficie)]'
                  }`}
                />
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--texto-3)]">
                    {e.item.fechaEstimada} · {enMeses(e.item.mesSaldado)}
                  </span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      e.esUltimo
                        ? 'text-[color:var(--positivo)] font-semibold'
                        : 'text-[color:var(--texto-3)]'
                    }`}
                  >
                    {e.esUltimo ? 'te queda $0' : `te quedan ${formatearCOP(e.restante)}`}
                  </span>
                </div>

                <div className="text-sm font-bold mt-0.5">
                  {e.esUltimo ? (
                    <span className="text-[color:var(--positivo)]">Libre de deudas 🎉</span>
                  ) : (
                    <>
                      Te quitas <span className="text-[color:var(--positivo)]">{e.item.nombre}</span>{' '}
                      de encima
                    </>
                  )}
                </div>

                {!e.esUltimo && e.siguiente && (
                  <div className="mt-1.5 rounded-lg border border-[var(--accion)]/25 bg-[var(--accion)]/8 px-2.5 py-1.5 text-[11px] text-[color:var(--texto-2)] leading-relaxed">
                    Sus{' '}
                    <strong className="text-[color:var(--accion)] font-bold tabular-nums">
                      {formatearCOP(e.item.pagoMinimo)}
                    </strong>{' '}
                    quedan libres y se suman al extra:{' '}
                    <strong className="text-[color:var(--texto)] font-semibold">{e.siguiente.nombre}</strong>{' '}
                    pasa a recibir{' '}
                    <strong className="text-[color:var(--accion)] font-bold tabular-nums">
                      {formatearCOP(e.ataqueSiguiente)}
                    </strong>
                    .
                  </div>
                )}

                {!e.esUltimo && (
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[color:var(--texto-3)]">
                    <span>ataque</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accion)] transition-all duration-500"
                        style={{ width: `${anchoAtaque(e.ataqueSiguiente)}%` }}
                      />
                    </div>
                    <strong className="tabular-nums text-[color:var(--texto-2)] font-bold">
                      {formatearCOP(e.ataqueSiguiente)}
                    </strong>
                  </div>
                )}

                {e.esUltimo && (
                  <p className="text-[11px] text-[color:var(--texto-2)] mt-1">
                    Toda tu plata —{formatearCOP(disponibleMensual)} al mes— vuelve a ser tuya.
                  </p>
                )}
              </div>
            ))}
          </Tarjeta>
        </div>
      )}
    </>
  );

  /**
   * El simulador vive bajo la tabla, en la columna ancha: ahí las pastillas de
   * abono caben en una línea y los dos resultados van lado a lado. En la
   * columna estrecha de al lado se apilaba y costaba el doble de alto.
   */
  const panelAcelera = (
    <SimuladorAbonoExtra
      deudas={deudasActivas}
      disponibleMensual={disponibleMensual}
      estrategia={estrategia}
      onSubirAbono={(n) => setDisponibleMensual(n)}
    />
  );

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      <ModalAgregarDeuda
        abierto={modalAgregarAbierto}
        deudaAEditar={deudaAEditar}
        onCerrar={() => {
          setModalAgregarAbierto(false);
          setDeudaAEditar(null);
        }}
        onGuardar={handleGuardarNuevaDeuda}
      />

      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)] whitespace-nowrap">
          Plan Deuda Cero
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip variante="alerta">{deudasActivas.length} activas</Chip>
        {deudasSaldadas.length > 0 && (
          <Chip variante="aqua">
            {deudasSaldadas.length} saldada{deudasSaldadas.length > 1 ? 's' : ''}
          </Chip>
        )}
      </BarraTitulo>

      <BarraAcciones>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => {
            setDeudaAEditar(null);
            setModalAgregarAbierto(true);
          }}
        >
          Agregar deuda
        </Boton>
      </BarraAcciones>

      {/* ===================== Cabecera de móvil ===================== */}
      <header className="md:hidden flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
            aria-label="Volver a inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-[color:var(--alerta)] uppercase tracking-wider">
              Plan Deuda Cero
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Deudas
            </h1>
          </div>
        </div>
        <Boton
          variante="primario"
          tamano="sm"
          icono={<Plus className="w-4 h-4" />}
          onClick={() => {
            setDeudaAEditar(null);
            setModalAgregarAbierto(true);
          }}
        >
          Agregar
        </Boton>
      </header>

      {deudasActivas.length === 0 ? (
        deudas.length === 0 ? (
          <EstadoVacio
            icono={CreditCard}
            titulo="Sin deudas registradas"
            descripcion="Agrega tu primera deuda para ver tu fecha de libertad y tu plan de salida paso a paso."
            textoBoton="Agregar mi primera deuda"
            varianteBoton="primario"
            onAccion={() => { setDeudaAEditar(null); setModalAgregarAbierto(true); }}
          />
        ) : (
          <EstadoVacio
            icono={Sparkles}
            titulo="¡Felicidades! No tienes deudas activas"
            descripcion="Todas tus deudas registradas han sido liquidadas al 100%. ¡Estás en libertad financiera!"
            textoBoton="Agregar otra deuda"
            varianteBoton="secundario"
            onAccion={() => { setDeudaAEditar(null); setModalAgregarAbierto(true); }}
          />
        )
      ) : (
        <>
          {/* ===== Barra de control: estrategia · plata · libre ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectorEstrategiaAbierto(true)}
              className="bg-[var(--superficie)] p-4 text-left hover:bg-[var(--superficie-2)] transition-colors cursor-pointer"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">Estrategia</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display font-bold text-[15px] text-[color:var(--texto)]">{ESTRATEGIA_INFO[estrategia].etiqueta}</span>
                <span className="text-[10.5px] font-bold text-[color:var(--acento)] border border-[var(--acento)] rounded-full px-2 py-0.5">cambiar</span>
              </div>
            </button>

            <div className="bg-[var(--superficie)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">Le metes a las deudas</span>
              {editandoDisponible ? (
                <form onSubmit={handleGuardarDisponible} className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={disponibleTemp}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0;
                      setDisponibleTemp(num > 0 ? formatearCOP(num) : '');
                    }}
                    className="w-28 px-2 py-1 rounded-lg bg-[var(--superficie-2)] border border-[var(--acento)] text-sm font-bold tabular-nums text-[color:var(--texto)] focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" className="p-1.5 rounded-lg bg-[var(--positivo)] text-[color:var(--on-acento)] cursor-pointer" title="Guardar">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => { setDisponibleTemp(formatearCOP(disponibleMensual)); setEditandoDisponible(true); }}
                  className="mt-1 flex items-center gap-1.5 font-display font-bold text-[15px] text-[color:var(--texto)] hover:text-[color:var(--acento)] cursor-pointer transition-colors"
                >
                  <span className="tabular-nums">{formatearCOP(disponibleMensual)}</span>
                  <span className="text-[10px] font-semibold text-[color:var(--texto-3)]">al mes</span>
                  <Edit3 className="w-3.5 h-3.5 text-[color:var(--acento)]" />
                </button>
              )}
            </div>

            <div className="bg-[var(--superficie)] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">Libre en</span>
              <div className={`mt-1 font-display font-bold text-[15px] ${esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'}`}>
                {plan.fechaLibertad}
              </div>
            </div>
          </div>

          {/* En qué se parte esa plata: lo obligatorio y lo que de verdad acelera */}
          {disponibleMensual > 0 && (
            <div className="rounded-2xl border border-[var(--linea)] bg-[var(--superficie)] px-4 py-3">
              <div className="flex h-2 rounded-full overflow-hidden bg-[var(--superficie-2)]">
                <span
                  className="block h-full bg-[var(--texto-3)]"
                  style={{ width: `${Math.min(100, (minimosTotal / disponibleMensual) * 100)}%` }}
                />
                <span
                  className="block h-full bg-[var(--accion)]"
                  style={{ width: `${Math.max(0, (extraMensual / disponibleMensual) * 100)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 flex-wrap text-[11px]">
                <span className="text-[color:var(--texto-3)]">
                  <span className="inline-block w-[7px] h-[7px] rounded-[2px] bg-[var(--texto-3)] mr-1.5" />
                  Mínimos ·{' '}
                  <strong className="text-[color:var(--texto-2)] font-semibold tabular-nums">
                    {formatearCOP(minimosTotal)}
                  </strong>
                </span>
                <span className="text-[color:var(--texto-3)]">
                  <span className="inline-block w-[7px] h-[7px] rounded-[2px] bg-[var(--accion)] mr-1.5" />
                  Tu extra ·{' '}
                  <strong className="text-[color:var(--accion)] font-semibold tabular-nums">
                    {formatearCOP(extraMensual)}
                  </strong>
                </span>
              </div>

              <p className="mt-2 pt-2 border-t border-[var(--hairline)] text-[11px] text-[color:var(--texto-2)] leading-relaxed">
                {extraMensual > 0 ? (
                  <>
                    Los{' '}
                    <strong className="text-[color:var(--texto)] font-semibold tabular-nums">
                      {formatearCOP(minimosTotal)}
                    </strong>{' '}
                    son obligatorios: es lo que piden tus {deudasActivas.length}{' '}
                    {deudasActivas.length === 1 ? 'deuda' : 'deudas'} para no atrasarte. Los{' '}
                    <strong className="text-[color:var(--accion)] font-semibold tabular-nums">
                      {formatearCOP(extraMensual)}
                    </strong>{' '}
                    son los únicos que acortan el plan
                    {prioridad ? <> — van completos a {prioridad.nombre} hasta tumbarla</> : null}.
                  </>
                ) : (
                  <>
                    Todo se va en los mínimos, así que el plan avanza a su paso más lento. Cada peso
                    que subas por encima de{' '}
                    <strong className="text-[color:var(--texto)] font-semibold tabular-nums">
                      {formatearCOP(minimosTotal)}
                    </strong>{' '}
                    ataca una sola deuda y te adelanta la fecha.
                  </>
                )}
              </p>
            </div>
          )}

          {plan.mensajeAdvertencia && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/12 border border-[var(--alerta)]/25 flex items-start gap-2.5 text-xs text-[color:var(--alerta)]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{plan.mensajeAdvertencia}</span>
            </div>
          )}

          <Marco
            columnas={
              cajonEmpuja ? '376px minmax(0,1fr)' : '376px minmax(0,1fr) 336px'
            }
          >
            {/* ---------- Columna 1: tu jugada de este mes ---------- */}
            <Columna ordenMovil={1} borde>
              <Zona crece sinPadding>
                <Scroll className="px-4 xl:px-[17px] py-3">
                  <div className="space-y-4">
                    <h2 className={secH}>Tu jugada de este mes</h2>

                    {prioridad && (
                      <Tarjeta padding="lg" className="relative overflow-hidden border-[var(--accion)]">
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-28"
                          style={{ background: 'radial-gradient(120% 100% at 100% 0%, color-mix(in srgb, var(--accion) 12%, transparent) 0%, transparent 55%)' }}
                        />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[color:var(--accion)]">
                              ★ Tu foco de este mes
                            </span>
                            <div className="flex items-center gap-2 flex-none">
                              {caeEsteMes && (
                                <span className="text-[11px] font-bold text-[color:var(--accion)] bg-[var(--accion)]/12 border border-[var(--accion)]/30 rounded-full px-2.5 py-0.5">🔥 cae este mes</span>
                              )}
                              <MenuAcciones
                                nombre={prioridad.nombre}
                                acciones={[
                                  ...(estrategia === 'personalizado' && deudasActivas.length > 1
                                    ? [
                                        {
                                          etiqueta: 'Quitar del foco',
                                          icono: <ChevronDown className="w-3.5 h-3.5" />,
                                          onClick: () => handleMover(prioridad.id, 'abajo'),
                                        },
                                      ]
                                    : []),
                                  {
                                    etiqueta: 'Marcar saldada',
                                    icono: <CheckCircle2 className="w-3.5 h-3.5" />,
                                    onClick: () => handleMarcarSaldada(prioridad),
                                    tono: 'positivo' as const,
                                  },
                                  {
                                    etiqueta: 'Editar deuda',
                                    icono: <Pencil className="w-3.5 h-3.5" />,
                                    onClick: () => handleEditarDeuda(prioridad),
                                  },
                                  {
                                    etiqueta: 'Quitar del plan',
                                    icono: <Trash2 className="w-3.5 h-3.5" />,
                                    onClick: () => handleEliminarDeuda(prioridad.id, prioridad.nombre),
                                    tono: 'alerta' as const,
                                  },
                                ]}
                              />
                            </div>
                          </div>
                          <h3 className="font-display font-black text-xl text-[color:var(--texto)] mt-2">{prioridad.nombre}</h3>
                          <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                            La atacas primero porque es {ESTRATEGIA_INFO[estrategia].por}. Saldo {formatearCOP(saldoPrio)}.
                          </p>

                          {/* Desglose base + extra */}
                          <div className="mt-4 grid grid-cols-2 @2xl:grid-cols-3 gap-px bg-[var(--linea)] border border-[var(--linea)] rounded-xl overflow-hidden">
                            <div className="bg-[var(--superficie)] p-3">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--texto-2)]">Mínimo (base)</div>
                              <div className="font-display font-bold text-[17px] tabular-nums text-[color:var(--texto)] mt-0.5">{formatearCOP(baseFoco)}</div>
                            </div>
                            <div className="p-3" style={{ background: 'color-mix(in srgb, var(--accion) 12%, transparent)' }}>
                              <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--accion)]">+ Tu extra</div>
                              <div className="font-display font-bold text-[17px] tabular-nums text-[color:var(--accion)] mt-0.5">{formatearCOP(extraFoco)}</div>
                            </div>
                            <div className="bg-[var(--superficie-2)] p-3 col-span-2 @2xl:col-span-1 flex items-baseline justify-between gap-2 @2xl:block">
                              <div className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--texto-2)]">Págale</div>
                              <div className="font-display font-bold text-[17px] tabular-nums text-[color:var(--texto)] mt-0.5">{formatearCOP(abonoPrioridad)}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => { setDeudaSeleccionadaAbono(prioridad); setModalAbonarAbierto(true); }}
                            className="mt-4 w-full py-3.5 rounded-xl bg-accion-gradient text-[color:var(--on-accion)] font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
                          >
                            Registrar mi pago de este mes <ArrowRight className="w-4 h-4" />
                          </button>
                          {extraFoco > 0 && (
                            <p className="text-[11px] text-[color:var(--texto-3)] text-center mt-2">
                              El extra ({formatearCOP(extraFoco)}) va aquí por tu estrategia. Cuando esta caiga, su cuota impulsa a la siguiente.
                            </p>
                          )}
                        </div>
                      </Tarjeta>
                    )}

                    {demas.length > 0 && (
                      <div className="space-y-3">
                        <h2 className={secH}>Y el mínimo de las demás este mes</h2>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                          <SortableContext items={demas.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                              {demas.map((deuda, i) => (
                                <TarjetaDeudaItem
                                  key={deuda.id}
                                  deuda={deuda}
                                  idx={i + 1}
                                  totalDeudas={deudasOrdenadas.length}
                                  esPersonalizado={estrategia === 'personalizado'}
                                  onAbrirAbono={handleAbrirAbono}
                                  onMarcarSaldada={handleMarcarSaldada}
                                  onEditarDeuda={handleEditarDeuda}
                                  onEliminarDeuda={handleEliminarDeuda}
                                  onMover={handleMover}
                                  getTipoInfo={getTipoInfo}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </div>
                  {/* Deudas saldadas */}
                  {deudasSaldadas.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setLiquidadasAbiertas((v) => !v)}
                        aria-expanded={liquidadasAbiertas}
                        className="w-full flex items-center justify-between gap-2 px-1 py-1.5 cursor-pointer group"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] group-hover:text-[color:var(--texto)] flex items-center gap-1.5 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
                          {deudasSaldadas.length} liquidada{deudasSaldadas.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] text-[color:var(--positivo)] font-semibold">
                          ¡Libertad conseguida! {liquidadasAbiertas ? '▴' : '▾'}
                        </span>
                      </button>
                      <div className={liquidadasAbiertas ? 'space-y-2' : 'hidden'}>
                        {deudasSaldadas.map((deuda) => (
                          <Tarjeta key={deuda.id} padding="sm" className="opacity-70 hover:opacity-100 transition-opacity bg-[var(--superficie)] border-[var(--linea)]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[var(--superficie-2)] flex items-center justify-center text-[color:var(--positivo)]">✓</div>
                                <div>
                                  <h4 className="text-xs font-semibold text-[color:var(--texto)] line-through truncate">{deuda.nombre}</h4>
                                  <p className="text-[10px] text-[color:var(--texto-2)]">{deuda.tipo} &bull; Liquidada al 100%</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Chip variante="aqua">Saldada</Chip>
                                <button
                                  type="button"
                                  onClick={() => handleReactivarDeuda(deuda)}
                                  className="p-1.5 rounded text-[color:var(--texto-2)] hover:text-[color:var(--acento)] cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  title="Reactivar si fue error"
                                  aria-label={`Reactivar deuda ${deuda.nombre}`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </Tarjeta>
                        ))}
                      </div>
                    </div>
                  )}
                </Scroll>
              </Zona>
            </Columna>

            {/* ---------- Columna 2: el detalle mes a mes ---------- */}
            <Columna ordenMovil={3} borde={!cajonEmpuja}>
              <Zona crece sinPadding>
                <Scroll className="px-4 xl:px-[17px] py-3">
                            {filasTabla.length > 0 && (
                  <div className="space-y-3">
                    <div className="px-1">
                      <h2 className="font-display font-bold text-base text-[color:var(--texto)]">
                        Cómo se achica tu deuda
                      </h2>
                      <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                        Cada barra es un mes. Toca una para ver el saldo deuda por deuda.
                      </p>
                    </div>

                    <Tarjeta padding="md">
                      {/*
                        Barras apiladas en vez de una tabla de 7 columnas: con 4 deudas
                        ya no cabía y aparecía scroll horizontal. Esto entra igual con
                        2 deudas que con 8, y enseña la forma del plan —que se dobla
                        cada vez que una deuda cae— que la tabla no podía mostrar.
                      */}
                      <div className="flex items-end gap-[3px] h-[116px]">
                        {filasTabla.map((f) => {
                          const alto = maxSaldoTabla > 0 ? (f.total / maxSaldoTabla) * 100 : 0;
                          const elegido = f.mes === filaElegida?.mes;
                          return (
                            <button
                              key={f.mes}
                              type="button"
                              onClick={() => setMesElegido(f.mes)}
                              title={`${f.etiqueta} · te quedan ${formatearCOP(f.total)}`}
                              aria-label={`${f.etiqueta}, te quedan ${formatearCOP(f.total)}`}
                              aria-pressed={elegido}
                              className="flex-1 min-w-0 h-full flex flex-col justify-end cursor-pointer group"
                            >
                              <div
                                className={`flex flex-col-reverse rounded-t-[3px] overflow-hidden transition-opacity ${
                                  elegido ? 'opacity-100' : 'opacity-55 group-hover:opacity-85'
                                }`}
                                style={{ height: `${Math.max(2, alto)}%` }}
                              >
                                {tabla.columnas.map((c, i) => {
                                  const saldo = f.saldos[c.id] ?? 0;
                                  if (saldo <= 0) return null;
                                  return (
                                    <span
                                      key={c.id}
                                      className="block w-full"
                                      style={{
                                        height: `${(saldo / f.total) * 100}%`,
                                        background: colorDeuda(i),
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              <span
                                className={`block h-[2px] mt-[3px] rounded-full ${
                                  elegido ? 'bg-[var(--acento)]' : 'bg-transparent'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-[10px] text-[color:var(--texto-3)] mt-1">
                        <span>{filasTabla[0]?.etiqueta}</span>
                        <span className={plan.esViable ? 'text-[color:var(--positivo)] font-semibold' : ''}>
                          {plan.esViable
                            ? `${filasTabla[filasTabla.length - 1]?.etiqueta} · $0`
                            : filasTabla[filasTabla.length - 1]?.etiqueta}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[10px] text-[color:var(--texto-3)]">
                        {tabla.columnas.map((c, i) => (
                          <span key={c.id} className="inline-flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-[7px] h-[7px] rounded-[2px] flex-none"
                              style={{ background: colorDeuda(i) }}
                            />
                            <span className="truncate">{c.nombre}</span>
                          </span>
                        ))}
                      </div>

                      {/*
                        La tabla y el desglose van lado a lado: la columna mide 955px y
                        apilarlos costaba 157px de alto para nada. Por debajo del ancho
                        del contenedor vuelven a apilarse.
                      */}
                      <div className="mt-3 grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_240px] @2xl:items-start">
                        <div className="min-w-0">
                      {/* Tres columnas fijas: caben siempre, con 2 deudas o con 8. */}
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-2 text-[10px] uppercase tracking-wide text-[color:var(--texto-3)] font-bold">
                              Mes
                            </th>
                            <th className="text-right py-2 text-[10px] uppercase tracking-wide text-[color:var(--texto-3)] font-bold">
                              Te queda
                            </th>
                            <th className="text-right py-2 text-[10px] uppercase tracking-wide text-[color:var(--alerta)] font-bold">
                              Interés del mes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(tablaAbierta ? filasTabla : filasTabla.slice(0, 6)).map((f) => (
                            <tr
                              key={f.mes}
                              onClick={() => setMesElegido(f.mes)}
                              className={`border-t border-[var(--hairline)] cursor-pointer transition-colors ${
                                f.mes === filaElegida?.mes
                                  ? 'bg-[var(--acento)]/8'
                                  : 'hover:bg-[var(--superficie-2)]'
                              }`}
                            >
                              <td className="py-2 text-[color:var(--texto)] font-semibold whitespace-nowrap">
                                {f.etiqueta}
                              </td>
                              <td className="py-2 text-right tabular-nums font-semibold text-[color:var(--texto)] whitespace-nowrap">
                                {f.total <= 0 ? '$0' : formatearCOP(f.total)}
                              </td>
                              <td className="py-2 text-right tabular-nums whitespace-nowrap text-[color:var(--alerta)]">
                                {f.interes > 0 ? formatearCOP(f.interes) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {filasTabla.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setTablaAbierta((v) => !v)}
                          className="mt-2 w-full text-center text-xs font-semibold text-[color:var(--acento)] cursor-pointer py-1"
                        >
                          {tablaAbierta ? 'Ver menos ▴' : `Ver los ${filasTabla.length} meses ▾`}
                        </button>
                      )}

                      {!plan.esViable && (
                        <p className="mt-2 text-[11px] text-[color:var(--alerta)] leading-relaxed">
                          Con este abono el saldo no baja, así que no hay un último mes que mostrar.
                          Estos son los próximos 12.
                        </p>
                      )}
                        </div>

                      {/* El desglose por deuda no se pierde: se pide. */}
                      {filaElegida && (
                        <div className="min-w-0 pt-3 border-t border-[var(--linea)] @2xl:pt-0 @2xl:border-t-0 @2xl:pl-4 @2xl:border-l @2xl:border-[var(--hairline)]">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--texto-3)]">
                            {filaElegida.etiqueta}, deuda por deuda
                          </p>
                          <div className="mt-1.5 divide-y divide-[var(--hairline)]">
                            {tabla.columnas.map((c, i) => {
                              const saldo = filaElegida.saldos[c.id] ?? 0;
                              return (
                                <div key={c.id} className="flex items-center gap-2.5 py-1.5">
                                  <span
                                    className="w-[7px] h-[7px] rounded-[2px] flex-none"
                                    style={{ background: colorDeuda(i) }}
                                  />
                                  <span className="flex-1 min-w-0 text-[11.5px] text-[color:var(--texto-2)] truncate">
                                    {c.nombre}
                                  </span>
                                  <span
                                    className={`text-[12px] font-display font-bold tabular-nums ${
                                      saldo <= 0
                                        ? 'text-[color:var(--positivo)]'
                                        : 'text-[color:var(--texto)]'
                                    }`}
                                  >
                                    {saldo <= 0 ? '✓ libre' : formatearCOP(saldo)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </div>
                    </Tarjeta>
                  </div>
                            )}
                </Scroll>
              </Zona>

              {/* Con el cajón abierto, el camino se pliega aquí debajo */}
              {cajonEmpuja && (
                <Zona sinPadding className="xl:flex xl:flex-col">
                  <Scroll className="px-4 xl:px-[17px] py-3">{panelCamino}</Scroll>
                </Zona>
              )}

              {/* Acelera tu libertad: bajo la tabla, donde hay ancho de sobra */}
              <Zona sinPadding className="xl:flex xl:flex-col">
                <Scroll className="px-4 xl:px-[17px] py-3">{panelAcelera}</Scroll>
              </Zona>
            </Columna>

            {/* ---------- Columna 3: a dónde llegas ---------- */}
            <Columna ordenMovil={2} className={cajonEmpuja ? 'xl:hidden' : ''}>
              <Zona crece sinPadding>
                <Scroll className="px-4 xl:px-[17px] py-3">{panelCamino}</Scroll>
              </Zona>
            </Columna>
          </Marco>
        </>
      )}

      {/* Aviso Contextual Pro */}
      {onNavegar && (
        <AvisoContextualPro
          id="aviso-deudas-sobres"
          texto="Aparta lo intocable en Sobres antes de gastarlo."
          esPro={esPro}
          onAbrirPro={() => onNavegar('pro')}
        />
      )}


      {/* Selector de estrategia */}
      {selectorEstrategiaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
              <div>
                <h2 className="text-base font-bold text-[color:var(--texto)]">¿Cómo quieres atacar?</h2>
                <p className="text-xs text-[color:var(--texto-2)]">Las dos pagan todo; cambian el orden y lo que ahorras.</p>
              </div>
              <button onClick={() => setSelectorEstrategiaAbierto(false)} className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] cursor-pointer" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setEstrategia('bola_de_nieve'); setSelectorEstrategiaAbierto(false); }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${estrategia === 'bola_de_nieve' ? 'border-[var(--acento)] bg-[var(--superficie-2)]' : 'border-[var(--linea)] hover:border-[var(--acento)]/40'}`}
                >
                  <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">❄️ Bola de nieve</h3>
                  <p className="text-[11px] text-[color:var(--texto-3)] mt-0.5">La más pequeña primero. Victorias rápidas.</p>
                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-[color:var(--texto-2)]">Libre en</span><b className="font-display text-[color:var(--texto)]">{planBola.fechaLibertad}</b></div>
                    <div className="flex justify-between"><span className="text-[color:var(--texto-2)]">Intereses</span><b className="font-display tabular-nums text-[color:var(--texto)]">{formatearCOP(planBola.interesesTotales)}</b></div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEstrategia('avalancha'); setSelectorEstrategiaAbierto(false); }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${estrategia === 'avalancha' ? 'border-[var(--acento)] bg-[var(--superficie-2)]' : 'border-[var(--linea)] hover:border-[var(--acento)]/40'}`}
                >
                  <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">⛰️ Avalancha</h3>
                  <p className="text-[11px] text-[color:var(--texto-3)] mt-0.5">La de mayor interés primero. Ahorra más.</p>
                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-[color:var(--texto-2)]">Libre en</span><b className="font-display text-[color:var(--texto)]">{planAval.fechaLibertad}</b></div>
                    <div className="flex justify-between"><span className="text-[color:var(--texto-2)]">Intereses</span><b className="font-display tabular-nums text-[color:var(--positivo)]">{formatearCOP(planAval.interesesTotales)}</b></div>
                  </div>
                  {ahorroAvalancha > 0 && <p className="mt-2 text-[11px] font-semibold text-[color:var(--positivo)]">✦ Ahorras {formatearCOP(ahorroAvalancha)} en intereses</p>}
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setEstrategia('personalizado'); setSelectorEstrategiaAbierto(false); }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${estrategia === 'personalizado' ? 'border-[var(--acento)] bg-[var(--superficie-2)]' : 'border-[var(--linea)] hover:border-[var(--acento)]/40'}`}
              >
                <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">✍️ Yo ordeno</h3>
                <p className="text-[11px] text-[color:var(--texto-3)] mt-0.5">Arrastra las deudas para elegir tú el orden de ataque.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal abonar */}
      <ModalAbonarDeuda
        abierto={modalAbonarAbierto}
        deuda={deudaSeleccionadaAbono}
        billeteras={billeteras.length > 0 ? billeteras : getBilleteras()}
        montoInicial={deudaSeleccionadaAbono && prioridad && deudaSeleccionadaAbono.id === prioridad.id ? abonoPrioridad : undefined}
        onCerrar={() => {
          setModalAbonarAbierto(false);
          setDeudaSeleccionadaAbono(null);
        }}
        onConfirmarAbono={handleConfirmarAbono}
      />

      {/* Celebración */}
      <CelebracionLogro
        activo={celebracionActiva}
        nombreDeuda={deudaCelebrada.nombre}
        montoSaldado={deudaCelebrada.monto}
        quedanPocasDeudas={deudasActivas.length <= 1}
        onTerminar={() => setCelebracionActiva(false)}
        onConocerPro={() => onNavegar?.('pro')}
      />
    </div>
  );
};
