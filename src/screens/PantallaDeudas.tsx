import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  ArrowLeft,
  Plus,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  ShoppingBag,
  FileText,
  Landmark,
  Trash2,
  Target,
  Edit3,
  Check,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
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
import { GraficoLinea } from '../components/ui/GraficoLinea';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { EstadoVacio } from '../components/ui/EstadoVacio';
import { formatearCOP } from '../utils/format';
import { Deuda, TipoDeuda, EstrategiaPago, Billetera } from '../types';
import { calcularPlan, ordenarDeudasSegunEstrategia, calcularSerieSaldoDeuda } from '../logic/planDeudas';
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

  const esProximaAAtacar = idx === 0;
  const tipoInfo = getTipoInfo(deuda.tipo);
  const saldo = deuda.saldo ?? deuda.saldoTotal ?? 0;
  const montoOrig = deuda.montoOriginal || saldo;
  const porcentajePagado =
    montoOrig > 0
      ? Math.min(100, Math.max(0, Math.round(((montoOrig - saldo) / montoOrig) * 100)))
      : 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Tarjeta
        padding="md"
        className={`transition-all relative ${
          esProximaAAtacar
            ? 'border-[var(--acento)]/60 bg-[var(--superficie-2)] shadow-sm'
            : 'border-[var(--linea)] hover:border-[var(--acento)]/30'
        }`}
      >
        {/* Badge de Próxima a Atacar */}
        {esProximaAAtacar && (
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-[var(--acento)] text-white shadow-xs">
              ★ Próxima a liquidar
            </span>
            <span className="text-[11px] text-[color:var(--acento)] font-semibold">
              Recibe el abono extra
            </span>
          </div>
        )}

        {/* Fila principal de datos */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            {/* Si es personalizado, handle de arrastre y botones subir/bajar */}
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

          {/* Saldo pendiente */}
          <div className="text-right flex-shrink-0">
            <div className="font-display font-bold text-base sm:text-lg tabular-nums text-[color:var(--alerta)]">
              {formatearCOP(saldo)}
            </div>
            <p className="text-[10px] text-[color:var(--texto-2)]">Por pagar</p>
          </div>
        </div>

        {/* Barra de progreso de lo pagado */}
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

        {/* Botones de acción ergonómicos */}
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
  );
};

export const PantallaDeudas: React.FC<PantallaDeudasProps> = ({
  deudas,
  disponibleMensual,
  billeteras = [],
  onVolver,
  onNavegar,
  onAbonarDeuda,
}) => {
  const { esPapel } = useTema();
  const [estrategia, setEstrategia] = useState<EstrategiaPago>('bola_de_nieve');
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [modalAbonarAbierto, setModalAbonarAbierto] = useState(false);
  const [deudaSeleccionadaAbono, setDeudaSeleccionadaAbono] = useState<Deuda | null>(null);
  const [deudaAEditar, setDeudaAEditar] = useState<Deuda | null>(null);

  // Configuración de sensores dnd-kit para táctil y ratón
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Estado para la celebración temática
  const [celebracionActiva, setCelebracionActiva] = useState(false);
  const [deudaCelebrada, setDeudaCelebrada] = useState<{ nombre: string; monto: number }>({
    nombre: '',
    monto: 0,
  });

  // Estado para editar la caja ligera (disponible mensual para deudas)
  const [editandoDisponible, setEditandoDisponible] = useState(false);
  const [disponibleTemp, setDisponibleTemp] = useState(formatearCOP(disponibleMensual));

  // Separar activas de saldadas
  const deudasActivas = useMemo(() => {
    return deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0);
  }, [deudas]);

  const deudasSaldadas = useMemo(() => {
    return deudas.filter((d) => d.saldada || (d.saldo ?? d.saldoTotal ?? 0) <= 0);
  }, [deudas]);

  // Cálculo dinámico del plan de deudas con la lógica matemática pura
  const plan = useMemo(() => {
    return calcularPlan(deudasActivas, disponibleMensual, estrategia);
  }, [deudasActivas, disponibleMensual, estrategia]);

  const puntosDeuda = useMemo(
    () =>
      calcularSerieSaldoDeuda(deudasActivas, disponibleMensual, estrategia).map((p) => ({
        etiqueta: p.etiqueta,
        valor: p.saldo,
      })),
    [deudasActivas, disponibleMensual, estrategia]
  );

  // Lista ordenada de deudas según la estrategia activa
  const deudasOrdenadas = useMemo(() => {
    return ordenarDeudasSegunEstrategia(deudasActivas, estrategia);
  }, [deudasActivas, estrategia]);

  const totalSaldosActivos = useMemo(() => {
    return deudasActivas.reduce((acc, d) => acc + (d.saldo ?? d.saldoTotal ?? 0), 0);
  }, [deudasActivas]);

  // Manejador para marcar como saldada con celebración y registro de victoria
  const handleMarcarSaldada = (deuda: Deuda) => {
    marcarSaldada(deuda.id, true);
    const monto = deuda.saldo ?? deuda.saldoTotal ?? 0;
    
    registrarVictoria({
      titulo: deuda.nombre,
      descripcion: `Deuda saldada al 100% (${deuda.tipo}).`,
      monto,
      tipo: 'deuda_saldada',
    });

    setDeudaCelebrada({
      nombre: deuda.nombre,
      monto,
    });
    setCelebracionActiva(true);
  };

  const handleReactivarDeuda = (deuda: Deuda) => {
    marcarSaldada(deuda.id, false);
  };

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
    let resultado: { exito: boolean; deudaSaldada: boolean; deuda?: Deuda };
    if (onAbonarDeuda) {
      resultado = onAbonarDeuda(deudaId, billeteraId, monto);
    } else {
      resultado = abonarDeudaDesdeBilletera(deudaId, billeteraId, monto);
    }

    if (resultado.exito) {
      if (resultado.deudaSaldada) {
        const nombreDeuda = deudaSeleccionadaAbono?.nombre || 'esta deuda';
        registrarVictoria({
          titulo: nombreDeuda,
          descripcion: 'Deuda liquidada al 100% con abono directo.',
          monto,
          tipo: 'deuda_saldada',
        });
        setDeudaCelebrada({
          nombre: nombreDeuda,
          monto,
        });
        setCelebracionActiva(true);
      }
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

  // Reordenar por Drag & Drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const viejosIds = deudasOrdenadas.map((d) => d.id);
      const oldIndex = viejosIds.indexOf(active.id as string);
      const newIndex = viejosIds.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const nuevosIds = arrayMove<string>(viejosIds, oldIndex, newIndex);
        reordenarDeudas(nuevosIds);
      }
    }
  };

  // Reordenar por botones accesibles ↑ y ↓
  const handleMover = (id: string, direccion: 'arriba' | 'abajo') => {
    const ids = deudasOrdenadas.map((d) => d.id);
    const index = ids.indexOf(id);
    if (index === -1) return;
    const targetIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    const nuevosIds = arrayMove<string>(ids, index, targetIndex);
    reordenarDeudas(nuevosIds);
  };

  const getTipoInfo = (tipo: TipoDeuda) => {
    switch (tipo) {
      case 'gota_a_gota':
        return {
          etiqueta: 'Gota a gota',
          icon: <Zap className="w-3.5 h-3.5 text-[color:var(--alerta)]" />,
          variante: 'alerta' as const,
        };
      case 'fiado':
        return {
          etiqueta: 'Fiado tienda',
          icon: <ShoppingBag className="w-3.5 h-3.5 text-[color:var(--positivo)]" />,
          variante: 'aqua' as const,
        };
      case 'libranza':
        return {
          etiqueta: 'Libranza',
          icon: <FileText className="w-3.5 h-3.5 text-[color:var(--acento)]" />,
          variante: 'azul' as const,
        };
      case 'prestamo':
        return {
          etiqueta: 'Préstamo',
          icon: <Landmark className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />,
          variante: 'platino' as const,
        };
      case 'tarjeta':
      default:
        return {
          etiqueta: 'Tarjeta',
          icon: <CreditCard className="w-3.5 h-3.5 text-[color:var(--texto-2)]" />,
          variante: 'platino' as const,
        };
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto animate-screen-enter">
      {/* Modal para agregar / editar deuda */}
      <ModalAgregarDeuda
        abierto={modalAgregarAbierto}
        deudaAEditar={deudaAEditar}
        onCerrar={() => {
          setModalAgregarAbierto(false);
          setDeudaAEditar(null);
        }}
        onGuardar={handleGuardarNuevaDeuda}
      />

      {/* ========================================================= */}
      {/* CABECERA PRINCIPAL CON RETORNO Y BOTÓN AGREGAR          */}
      {/* ========================================================= */}
      <header className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
            aria-label="Volver a inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[color:var(--alerta)] uppercase tracking-wider">
                Plan Deuda Cero
              </span>
              {deudasSaldadas.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--positivo)]/15 text-[color:var(--positivo)]">
                  {deudasSaldadas.length} saldada{deudasSaldadas.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
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
          Agregar deuda
        </Boton>
      </header>

      {/* ========================================================= */}
      {/* PANEL RESUMEN: FECHA DE LIBERTAD + LO QUE DEBES          */}
      {/* ========================================================= */}
      <Tarjeta padding="lg" className="overflow-hidden relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--linea)]">
          {/* Fecha de libertad calculada */}
          <div className="space-y-1 sm:pr-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              Fecha de libertad estimada
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl tracking-tight text-[color:var(--texto)]">
              {deudasActivas.length === 0 ? (
                <span className="text-[color:var(--positivo)]">¡Libre de deudas!</span>
              ) : (
                <span className={esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'}>
                  {plan.fechaLibertad}
                </span>
              )}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">
              {deudasActivas.length === 0
                ? 'No tienes deudas pendientes activas.'
                : `${plan.mesesTotales} ${plan.mesesTotales === 1 ? 'mes' : 'meses'} de pagos programados`}
            </p>
          </div>

          {/* Lo que debes en total */}
          <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4">
            <span className="text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[color:var(--alerta)]" />
              Lo que debes hoy
            </span>
            <div className="font-display font-bold text-2xl sm:text-3xl tabular-nums text-[color:var(--alerta)] tracking-tight">
              {formatearCOP(totalSaldosActivos)}
            </div>
            <p className="text-xs text-[color:var(--texto-2)]">
              En {deudasActivas.length} deuda{deudasActivas.length === 1 ? '' : 's'} pendiente{deudasActivas.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {plan.mensajeAdvertencia && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--alerta)]/12 border border-[var(--alerta)]/25 flex items-start gap-2.5 text-xs text-[color:var(--alerta)]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{plan.mensajeAdvertencia}</span>
          </div>
        )}
      </Tarjeta>

      {/* Curva: tu deuda va bajando (reacciona a la estrategia) */}
      {deudasActivas.length > 0 && (
        <Tarjeta padding="lg">
          <div className="flex items-center justify-between mb-1 gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Tu deuda va bajando</h2>
              <p className="text-xs text-[color:var(--texto-2)] mt-0.5 truncate">
                Proyección con la estrategia actual · libre en {plan.fechaLibertad}
              </p>
            </div>
            <Chip variante="aqua">−{formatearCOP(plan.interesesTotales)} interés</Chip>
          </div>
          <div className="mt-2">
            <GraficoLinea puntos={puntosDeuda} color="var(--acento)" altura={200} />
          </div>
        </Tarjeta>
      )}

      {/* Aviso Contextual Pro Just-in-Time */}
      {onNavegar && (
        <AvisoContextualPro
          id="aviso-deudas-sobres"
          texto="Aparta lo intocable en Sobres antes de gastarlo."
          onAbrirPro={() => onNavegar('pro')}
        />
      )}

      {/* ========================================================= */}
      {/* CONTROL DE ESTRATEGIA Y CAJA LIGERA (DISPONIBLE MENSUAL) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Toggle de Estrategia (3 opciones: Bola de nieve, Avalancha, Mi orden) */}
        <Tarjeta padding="md" className="flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider block mb-2">
              Estrategia de pago
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <button
                type="button"
                onClick={() => setEstrategia('bola_de_nieve')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                  estrategia === 'bola_de_nieve'
                    ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-xs border border-[var(--linea)]'
                    : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                Bola de nieve
              </button>
              <button
                type="button"
                onClick={() => setEstrategia('avalancha')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                  estrategia === 'avalancha'
                    ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-xs border border-[var(--linea)]'
                    : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                Avalancha
              </button>
              <button
                type="button"
                onClick={() => setEstrategia('personalizado')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                  estrategia === 'personalizado'
                    ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-xs border border-[var(--linea)]'
                    : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                Mi orden
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[color:var(--texto-2)] mt-2.5 leading-relaxed">
            {estrategia === 'bola_de_nieve'
              ? 'Menor saldo primero: victorias rápidas liberando cuotas de raíz.'
              : estrategia === 'avalancha'
              ? 'Mayor interés primero: ahorra la mayor cantidad de plata en intereses.'
              : 'Orden personalizado: arrastra las tarjetas o usa ↑/↓ para fijar la prioridad.'}
          </p>
        </Tarjeta>

        {/* Caja Ligera: Plata disponible mensual para abonar a deudas */}
        <Tarjeta padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider">
              Plata para pagar deudas al mes
            </span>
            {!editandoDisponible && (
              <button
                onClick={() => {
                  setDisponibleTemp(formatearCOP(disponibleMensual));
                  setEditandoDisponible(true);
                }}
                className="p-1 rounded text-[color:var(--texto-2)] hover:text-[color:var(--acento)] cursor-pointer"
                aria-label="Editar plata disponible"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editandoDisponible ? (
            <form onSubmit={handleGuardarDisponible} className="flex items-center gap-2 my-1">
              <input
                type="text"
                value={disponibleTemp}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^\d]/g, '');
                  const num = parseInt(clean, 10) || 0;
                  setDisponibleTemp(num > 0 ? formatearCOP(num) : '');
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--superficie-2)] border border-[var(--acento)] text-sm font-bold tabular-nums text-[color:var(--texto)] focus:outline-none"
                placeholder="$600.000"
                autoFocus
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-[var(--positivo)] text-[color:var(--on-acento)] font-bold cursor-pointer"
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="font-display font-bold text-2xl tabular-nums text-[color:var(--positivo)] tracking-tight">
              {formatearCOP(disponibleMensual)}
              <span className="text-xs font-normal text-[color:var(--texto-2)] ml-1.5">/ mes</span>
            </div>
          )}

          <div className="text-[11px] text-[color:var(--texto-2)] mt-2 flex items-center justify-between pt-1 border-t border-[var(--linea)]">
            <span>Cuotas mínimas: {formatearCOP(plan.pagoMinimoTotal)}</span>
            <span className="text-[color:var(--positivo)] font-semibold">
              Abono extra: {formatearCOP(Math.max(0, disponibleMensual - plan.pagoMinimoTotal))}
            </span>
          </div>
        </Tarjeta>
      </div>

      {/* ========================================================= */}
      {/* SIMULADOR DE ABONO EXTRA EN TIEMPO REAL                   */}
      {/* ========================================================= */}
      <SimuladorAbonoExtra
        deudas={deudasActivas}
        disponibleMensual={disponibleMensual}
        estrategia={estrategia}
      />

      {/* ========================================================= */}
      {/* LISTA DE DEUDAS ORDENADAS POR ESTRATEGIA                  */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
              Plan de ataque ({deudasActivas.length})
            </h3>
            <p className="text-[11px] text-[color:var(--texto-3)]">
              {estrategia === 'bola_de_nieve'
                ? 'Ordenadas de menor a mayor saldo'
                : estrategia === 'avalancha'
                ? 'Ordenadas de mayor a menor tasa de interés'
                : 'Ordenadas según tu prioridad personalizada'}
            </p>
          </div>

          <span className="text-xs text-[color:var(--acento)] font-semibold">
            {estrategia === 'bola_de_nieve'
              ? 'Menor saldo primero'
              : estrategia === 'avalancha'
              ? 'Mayor tasa primero'
              : 'Mi orden'}
          </span>
        </div>

        {deudasActivas.length === 0 ? (
          deudas.length === 0 ? (
            <EstadoVacio
              icono={CreditCard}
              titulo="Sin deudas registradas"
              descripcion="Agrega tu primera deuda para ver tu fecha de libertad y proyectar tu plan de salida."
              textoBoton="Agregar mi primera deuda"
              varianteBoton="primario"
              onAccion={() => {
                setDeudaAEditar(null);
                setModalAgregarAbierto(true);
              }}
            />
          ) : (
            <EstadoVacio
              icono={Sparkles}
              titulo="¡Felicidades! No tienes deudas activas"
              descripcion="Todas tus deudas registradas han sido liquidadas al 100%. ¡Estás en libertad financiera!"
              textoBoton="Agregar otra deuda"
              varianteBoton="secundario"
              onAccion={() => {
                setDeudaAEditar(null);
                setModalAgregarAbierto(true);
              }}
            />
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={deudasOrdenadas.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {deudasOrdenadas.map((deuda, idx) => (
                  <TarjetaDeudaItem
                    key={deuda.id}
                    deuda={deuda}
                    idx={idx}
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
        )}
      </div>

      {/* ========================================================= */}
      {/* SECCIÓN DEUDAS SALDADAS (TACHADAS, ATENUADAS)             */}
      {/* ========================================================= */}
      {deudasSaldadas.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
              Deudas liquidadas ({deudasSaldadas.length})
            </h3>
            <span className="text-[11px] text-[color:var(--positivo)] font-semibold">
              ¡Libertad conseguida!
            </span>
          </div>

          <div className="space-y-2">
            {deudasSaldadas.map((deuda) => (
              <Tarjeta
                key={deuda.id}
                padding="sm"
                className="opacity-70 hover:opacity-100 transition-opacity bg-[var(--superficie)] border-[var(--linea)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--superficie-2)] flex items-center justify-center text-[color:var(--positivo)]">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[color:var(--texto)] line-through truncate">
                        {deuda.nombre}
                      </h4>
                      <p className="text-[10px] text-[color:var(--texto-2)]">
                        {deuda.tipo} &bull; Liquidada al 100%
                      </p>
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

      {/* Modal para abonar con descuento directo de billetera */}
      <ModalAbonarDeuda
        abierto={modalAbonarAbierto}
        deuda={deudaSeleccionadaAbono}
        billeteras={billeteras.length > 0 ? billeteras : getBilleteras()}
        onCerrar={() => {
          setModalAbonarAbierto(false);
          setDeudaSeleccionadaAbono(null);
        }}
        onConfirmarAbono={handleConfirmarAbono}
      />

      {/* Celebración de logro */}
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

