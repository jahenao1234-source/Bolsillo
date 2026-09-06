import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowLeft,
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Banknote,
  Smartphone,
  Landmark,
  PiggyBank,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { EstadoVacio } from '../components/ui/EstadoVacio';
import { formatearCOP } from '../utils/format';
import { ordenarDeudasSegunEstrategia } from '../logic/planDeudas';
import { Billetera, Movimiento, FlujoMes, TipoBilletera, Deuda } from '../types';
import { SeccionApp } from '../components/navigation/BarraNavegacion';
import { ModalAgregarBilletera } from '../components/billeteras/ModalAgregarBilletera';
import { ModalRegistrarMovimiento } from '../components/billeteras/ModalRegistrarMovimiento';
import { AvisoContextualPro } from '../components/ui/AvisoContextualPro';

interface PantallaBilleterasProps {
  billeteras: Billetera[];
  saldoTotal: number;
  movimientos: Movimiento[];
  flujoMes: FlujoMes;
  deudas?: Deuda[];
  onVolver: () => void;
  onNavegar?: (seccion: SeccionApp) => void;
  onGuardarBilletera: (billetera: Billetera) => void;
  onEliminarBilletera: (id: string) => void;
  onRegistrarMovimiento: (mov: Omit<Movimiento, 'id'>) => void;
}

export const PantallaBilleteras: React.FC<PantallaBilleterasProps> = ({
  billeteras,
  saldoTotal,
  movimientos,
  flujoMes,
  deudas = [],
  onVolver,
  onNavegar,
  onGuardarBilletera,
  onEliminarBilletera,
  onRegistrarMovimiento,
}) => {
  const [modalBilleteraAbierto, setModalBilleteraAbierto] = useState(false);
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [billeteraSeleccionadaParaMov, setBilleteraSeleccionadaParaMov] = useState<string | undefined>(
    undefined
  );

  // Filtros de movimientos
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [filtroBilleteraId, setFiltroBilleteraId] = useState<string>('todas');

  // Filtrado reactivo de movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) {
        return false;
      }
      if (filtroBilleteraId !== 'todas' && m.billeteraId !== filtroBilleteraId) {
        return false;
      }
      return true;
    });
  }, [movimientos, filtroTipo, filtroBilleteraId]);

  const abrirModalMovimientoConBilletera = (billeteraId?: string) => {
    setBilleteraSeleccionadaParaMov(billeteraId);
    setModalMovimientoAbierto(true);
  };

  const proximaDeuda = ordenarDeudasSegunEstrategia(deudas, 'bola_de_nieve')[0] || null;

  const getIconoBilletera = (tipo: TipoBilletera) => {
    switch (tipo) {
      case 'efectivo':
        return <Banknote className="w-4 h-4 text-[color:var(--positivo)]" />;
      case 'nequi':
        return <Smartphone className="w-4 h-4 text-[color:var(--acento)]" />;
      case 'banco':
        return <Landmark className="w-4 h-4 text-[color:var(--texto-2)]" />;
      case 'ahorros':
        return <PiggyBank className="w-4 h-4 text-[color:var(--acento)]" />;
      default:
        return <Wallet className="w-4 h-4 text-[color:var(--texto-2)]" />;
    }
  };

  return (
    <div className="space-y-6 pb-28 md:pb-14 max-w-4xl mx-auto animate-screen-enter">
      {/* Cabecera */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors cursor-pointer"
            aria-label="Volver a inicio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Plata disponible
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
              Billeteras & Movimientos
            </h1>
          </div>
        </div>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-2">
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setModalBilleteraAbierto(true)}
            icono={<Plus className="w-3.5 h-3.5" />}
          >
            Billetera
          </Boton>
          <Boton
            variante="primario"
            tamano="sm"
            onClick={() => abrirModalMovimientoConBilletera(undefined)}
            icono={<Plus className="w-3.5 h-3.5" />}
          >
            Movimiento
          </Boton>
        </div>
      </header>

      {/* Saldo total consolidado */}
      <Tarjeta padding="lg" className="relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)]">
              Total disponible en todas las cuentas
            </span>
            <Chip variante="aqua">
              {billeteras.length} {billeteras.length === 1 ? 'cuenta' : 'cuentas'} activas
            </Chip>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-black font-display tracking-tight tabular-nums ${saldoTotal >= 0 ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto)]'}`}>
              {formatearCOP(saldoTotal)}
            </span>
            <span className="text-xs text-[color:var(--texto-2)] uppercase font-semibold">COP</span>
          </div>

          {/* Tarjeta de flujo del mes (Ingresos - Gastos) */}
          <div className="pt-3 border-t border-[var(--linea)] grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] block">Ingresos mes</span>
              <span className="text-xs font-bold font-display tabular-nums text-[color:var(--positivo)] mt-0.5 block">
                +{formatearCOP(flujoMes.ingresos)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] block">Gastos mes</span>
              <span className="text-xs font-bold font-display tabular-nums text-[color:var(--alerta)] mt-0.5 block">
                -{formatearCOP(flujoMes.gastos)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] block">Flujo neto</span>
              <span
                className={`text-xs font-bold font-display tabular-nums mt-0.5 block ${
                  flujoMes.neto >= 0 ? 'text-[color:var(--positivo)]' : 'text-[color:var(--alerta)]'
                }`}
              >
                {flujoMes.neto >= 0 ? '+' : ''}
                {formatearCOP(flujoMes.neto)}
              </span>
            </div>
          </div>
        </div>
      </Tarjeta>

      {/* Próxima deuda (compacto) — enlaza al plan */}
      {proximaDeuda && onNavegar && (
        <button
          onClick={() => onNavegar('deudas')}
          className="w-full text-left flex items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--superficie)] border border-[var(--hairline)] hover:border-[var(--acento)]/40 transition-all cursor-pointer"
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--acento)] block mb-0.5">
              Próximo pago
            </span>
            <span className="text-sm font-semibold text-[color:var(--texto)] truncate block">
              {proximaDeuda.nombre}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <div className="text-right">
              <div className="font-display font-bold text-base tabular-nums text-[color:var(--texto)]">
                {formatearCOP(proximaDeuda.pagoMinimo > 0 ? proximaDeuda.pagoMinimo : (proximaDeuda.saldo ?? 0))}
              </div>
              <div className="text-[10px] text-[color:var(--texto-3)]">Ver plan</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
          </div>
        </button>
      )}

      {/* Aviso Contextual Just-in-Time (Sección 6 del prompt) */}
      {onNavegar && (
        <AvisoContextualPro
          id="aviso-billeteras-presupuesto"
          texto="¿Se te va la plata sin saber en qué? Presupuesto te pone topes."
          onAbrirPro={() => onNavegar('pro')}
        />
      )}

      {/* Listado de Billeteras */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
            Tus Billeteras ({billeteras.length})
          </h2>
          <button
            onClick={() => setModalBilleteraAbierto(true)}
            className="text-xs font-semibold text-[color:var(--acento)] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {billeteras.length === 0 ? (
          <EstadoVacio
            icono={Wallet}
            titulo="Sin billeteras activas"
            descripcion="Crea tu primera billetera para administrar tus saldos bancarios y efectivo en mano."
            textoBoton="Crea tu primera billetera"
            varianteBoton="primario"
            onAccion={() => setModalBilleteraAbierto(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {billeteras.map((billetera) => (
              <Tarjeta
                key={billetera.id}
                padding="md"
                className="flex flex-col justify-between hover:border-[var(--acento)]/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-center flex-shrink-0">
                      {getIconoBilletera(billetera.tipo)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[color:var(--texto)]">{billetera.nombre}</h3>
                      <p className="text-[11px] text-[color:var(--texto-2)]">
                        {billetera.entidad || billetera.tipo}
                        {billetera.numeroCuentaCorto && ` ${billetera.numeroCuentaCorto}`}
                      </p>
                    </div>
                  </div>

                  {billeteras.length > 1 && (
                    <button
                      onClick={() => onEliminarBilletera(billetera.id)}
                      className="opacity-40 group-hover:opacity-100 p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--alerta)] hover:bg-[var(--alerta)]/10 transition-all cursor-pointer"
                      title="Eliminar billetera"
                      aria-label={`Eliminar billetera ${billetera.nombre}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--linea)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[color:var(--texto-2)] uppercase tracking-wider block">
                      Saldo
                    </span>
                    <span className={`font-display font-bold text-base tabular-nums ${billetera.saldo >= 0 ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto)]'}`}>
                      {formatearCOP(billetera.saldo)}
                    </span>
                  </div>

                  <button
                    onClick={() => abrirModalMovimientoConBilletera(billetera.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--superficie-2)] border border-[var(--linea)] text-[color:var(--texto)] hover:border-[var(--acento)]/40 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[color:var(--acento)]" />
                    <span>Movimiento</span>
                  </button>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </section>

      {/* Historial de Movimientos */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
              Movimientos ({movimientosFiltrados.length})
            </h2>
          </div>

          {/* Filtros de Tipo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filtroTipo === 'todos'
                  ? 'bg-[var(--superficie-2)] border border-[var(--linea)] text-[color:var(--texto)]'
                  : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('ingreso')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'ingreso'
                  ? 'bg-[var(--positivo)]/15 border border-[var(--positivo)]/30 text-[color:var(--positivo)]'
                  : 'text-[color:var(--texto-2)] hover:text-[color:var(--positivo)]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Ingresos
            </button>
            <button
              onClick={() => setFiltroTipo('gasto')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'gasto'
                  ? 'bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-[color:var(--alerta)]'
                  : 'text-[color:var(--texto-2)] hover:text-[color:var(--alerta)]'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              Gastos
            </button>

            {/* Selector de Billetera para filtrar */}
            {billeteras.length > 1 && (
              <select
                value={filtroBilleteraId}
                onChange={(e) => setFiltroBilleteraId(e.target.value)}
                className="ml-1 px-2.5 py-1 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] text-xs text-[color:var(--texto-2)] focus:outline-none focus:text-[color:var(--texto)] cursor-pointer"
              >
                <option value="todas">Todas las billeteras</option>
                {billeteras.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de movimientos */}
        {movimientosFiltrados.length > 0 ? (
          <div className="space-y-2">
            {movimientosFiltrados.map((mov) => {
              const esIngreso = mov.tipo === 'ingreso';
              const esAbonoDeuda = Boolean(mov.deudaId) || mov.categoria === 'Deudas';

              return (
                <Tarjeta
                  key={mov.id}
                  padding="md"
                  className="flex items-center justify-between gap-3 hover:border-[var(--acento)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        esIngreso
                          ? 'bg-[var(--positivo)]/12 border-[var(--positivo)]/25 text-[color:var(--positivo)]'
                          : esAbonoDeuda
                          ? 'bg-[var(--acento)]/12 border-[var(--acento)]/25 text-[color:var(--acento)]'
                          : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--alerta)]'
                      }`}
                    >
                      {esIngreso ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : esAbonoDeuda ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-[color:var(--texto)] truncate">
                          {mov.nota || mov.descripcion || mov.categoria}
                        </h4>
                        {esAbonoDeuda && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[var(--acento)]/15 text-[color:var(--acento)] border border-[var(--acento)]/30 flex-shrink-0">
                            Abono a deuda
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[color:var(--texto-2)] mt-0.5">
                        <span>{mov.categoria}</span>
                        <span>&bull;</span>
                        <span>{mov.billeteraNombre || 'Billetera'}</span>
                        <span>&bull;</span>
                        <span>{mov.fecha}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-display font-bold text-base tabular-nums ${
                        esIngreso ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto)]'
                      }`}
                    >
                      {esIngreso ? '+' : '-'}
                      {formatearCOP(mov.monto)}
                    </span>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        ) : movimientos.length === 0 ? (
          <EstadoVacio
            icono={TrendingUp}
            titulo="Sin movimientos registrados"
            descripcion="Registra tu primer ingreso o gasto para controlar tu plata en tiempo real."
            textoBoton="Registra tu primer ingreso o gasto"
            varianteBoton="primario"
            onAccion={() => abrirModalMovimientoConBilletera()}
          />
        ) : (
          <Tarjeta padding="lg" className="text-center py-8 border-dashed border-[var(--linea)]">
            <p className="text-xs text-[color:var(--texto-2)]">No hay movimientos con los filtros seleccionados.</p>
            <div className="mt-3">
              <Boton
                variante="fantasma"
                tamano="sm"
                onClick={() => {
                  setFiltroTipo('todos');
                  setFiltroBilleteraId('todas');
                }}
              >
                Limpiar filtros
              </Boton>
            </div>
          </Tarjeta>
        )}
      </section>

      {/* Modales */}
      <ModalAgregarBilletera
        abierto={modalBilleteraAbierto}
        onCerrar={() => setModalBilleteraAbierto(false)}
        onGuardar={onGuardarBilletera}
      />

      <ModalRegistrarMovimiento
        abierto={modalMovimientoAbierto}
        billeteras={billeteras}
        billeteraPreseleccionadaId={billeteraSeleccionadaParaMov}
        onCerrar={() => setModalMovimientoAbierto(false)}
        onGuardar={onRegistrarMovimiento}
      />
    </div>
  );
};
