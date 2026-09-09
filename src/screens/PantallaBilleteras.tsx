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
  Pencil,
} from 'lucide-react';
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
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones, useCajonEmpuja } from '../components/layout/shell';
import { getContextoMes, movimientosDelMes } from '../logic/resumenMes';

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
  esPro?: boolean;
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
  esPro = false,
}) => {
  const [modalBilleteraAbierto, setModalBilleteraAbierto] = useState(false);
  const [billeteraAEditar, setBilleteraAEditar] = useState<Billetera | null>(null);
  const abrirNuevaBilletera = () => {
    setBilleteraAEditar(null);
    setModalBilleteraAbierto(true);
  };
  const abrirEditarBilletera = (b: Billetera) => {
    setBilleteraAEditar(b);
    setModalBilleteraAbierto(true);
  };
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [billeteraSeleccionadaParaMov, setBilleteraSeleccionadaParaMov] = useState<string | undefined>(
    undefined
  );

  // Filtros de movimientos
  // Cuando el cajón empuja, el resumen del mes se pliega bajo la tabla.
  const cajonEmpuja = useCajonEmpuja();

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

  // ---------- Lo que el mes deja ver: salidas ordenadas y flujo por billetera ----------
  const contexto = useMemo(() => getContextoMes(), []);

  const delMes = useMemo(
    () => movimientosDelMes(movimientos, contexto.mes, contexto.anio),
    [movimientos, contexto]
  );

  /** Todas las salidas del mes, de mayor a menor. La lista que explica el mes. */
  const salidas = useMemo(
    () =>
      delMes
        .filter((m) => m.tipo === 'gasto')
        .sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto)),
    [delMes]
  );

  const totalSalidas = salidas.reduce((acc, m) => acc + Math.abs(m.monto), 0);

  /** Cuántas salidas hacen falta para llegar al 70% del mes. Ahí va la marca. */
  const corteSetenta = useMemo(() => {
    let suma = 0;
    for (let i = 0; i < salidas.length; i++) {
      suma += Math.abs(salidas[i].monto);
      if (totalSalidas > 0 && suma / totalSalidas >= 0.7) {
        return { indice: i, suma, porcentaje: Math.round((suma / totalSalidas) * 100) };
      }
    }
    return null;
  }, [salidas, totalSalidas]);

  /** Entró y salió de cada billetera este mes. */
  const flujoPorBilletera = useMemo(
    () =>
      billeteras.map((b) => {
        const suyos = delMes.filter((m) => m.billeteraId === b.id);
        const entro = suyos
          .filter((m) => m.tipo === 'ingreso')
          .reduce((acc, m) => acc + Math.abs(m.monto), 0);
        const salio = suyos
          .filter((m) => m.tipo !== 'ingreso')
          .reduce((acc, m) => acc + Math.abs(m.monto), 0);
        return { billetera: b, entro, salio, neto: entro - salio };
      }),
    [billeteras, delMes]
  );

  /**
   * El resumen del mes. Vive en su propia columna, y cuando el cajón de Hoy
   * empuja se pliega debajo de la tabla en vez de desaparecer.
   */
  const ResumenDelMes = () => (
    <>
      <Zona>
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
          Entra y sale · {contexto.nombre.toLowerCase()}
        </p>
        <div className="flex flex-col gap-1.5 mt-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11.5px] text-[color:var(--texto-2)]">Recibido</span>
            <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--positivo)]">
              +{formatearCOP(flujoMes.ingresos)}
            </span>
          </div>
          <span className="h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden block">
            <span className="block h-full bg-[var(--positivo)]" style={{ width: '100%' }} />
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[11.5px] text-[color:var(--texto-2)]">Gastado</span>
            <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--alerta)]">
              −{formatearCOP(flujoMes.gastos)}
            </span>
          </div>
          <span className="h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden block">
            <span
              className="block h-full bg-[var(--alerta)]"
              style={{
                width: `${flujoMes.ingresos > 0 ? Math.min(100, (flujoMes.gastos / flujoMes.ingresos) * 100) : 0}%`,
              }}
            />
          </span>
          <div className="flex items-baseline justify-between pt-2.5 mt-1 border-t border-[var(--linea)]">
            <span className="text-[11.5px] text-[color:var(--texto)]">Te quedó</span>
            <span
              className={`font-display font-bold text-[19px] tabular-nums ${
                flujoMes.neto >= 0 ? 'text-[color:var(--acento)]' : 'text-[color:var(--alerta)]'
              }`}
            >
              {flujoMes.neto >= 0 ? '+' : '−'}
              {formatearCOP(Math.abs(flujoMes.neto))}
            </span>
          </div>
        </div>
      </Zona>

      {salidas.length > 0 && (
        <Zona crece sinPadding>
          <div className="p-4 xl:px-[17px] xl:py-[13px] xl:pb-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Todas las salidas, de mayor a menor
            </p>
            {corteSetenta && (
              <h3 className="font-display font-bold text-[13.5px] text-[color:var(--texto)] mt-1.5">
                Las {corteSetenta.indice + 1} primeras se llevan{' '}
                <span className="text-[color:var(--acento)]">
                  {corteSetenta.porcentaje} de cada 100
                </span>
              </h3>
            )}
          </div>
          <Scroll className="px-4 xl:px-[17px] pb-2">
            <div className="flex flex-col">
              {salidas.map((m, i) => (
                <React.Fragment key={m.id}>
                  <div className="flex items-center justify-between gap-3 py-[7px] border-b border-[var(--hairline)]">
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-[color:var(--texto)] truncate">
                        {m.nota || m.descripcion || m.categoria}
                      </span>
                      <span className="block text-[10px] text-[color:var(--texto-3)] truncate">
                        {m.fecha} · {m.categoria}
                        {m.billeteraNombre ? ` · ${m.billeteraNombre}` : ''}
                      </span>
                    </span>
                    <span className="font-display font-bold text-[13px] tabular-nums text-[color:var(--texto)] whitespace-nowrap">
                      {formatearCOP(Math.abs(m.monto))}
                    </span>
                  </div>
                  {corteSetenta && i === corteSetenta.indice && i < salidas.length - 1 && (
                    <div className="py-1.5 px-2 my-0.5 rounded-md bg-[var(--superficie-2)] text-[10px] text-[color:var(--texto-3)]">
                      Hasta aquí: {formatearCOP(corteSetenta.suma)} · el {corteSetenta.porcentaje}%
                      del mes
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Scroll>
        </Zona>
      )}
    </>
  );

  return (
    <div className="w-full pb-28 xl:pb-0 animate-screen-enter xl:h-full xl:flex xl:flex-col xl:gap-2.5">
      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)] whitespace-nowrap">
          Billeteras y movimientos
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip>
          {billeteras.length} {billeteras.length === 1 ? 'cuenta' : 'cuentas'}
        </Chip>
        <Chip>{movimientos.length} movimientos</Chip>
        {flujoMes.neto !== 0 && (
          <Chip variante={flujoMes.neto >= 0 ? 'aqua' : 'alerta'}>
            {flujoMes.neto >= 0 ? '+' : '−'}
            {formatearCOP(Math.abs(flujoMes.neto))} este mes
          </Chip>
        )}
      </BarraTitulo>

      <BarraAcciones>
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={() => abrirNuevaBilletera()}
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
      </BarraAcciones>

      {/* ===================== Cabecera de móvil ===================== */}
      <header className="md:hidden flex items-center justify-between gap-4 pt-1 mb-1">
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
              Billeteras
            </h1>
          </div>
        </div>
        <Boton
          variante="primario"
          tamano="sm"
          onClick={() => abrirModalMovimientoConBilletera(undefined)}
          icono={<Plus className="w-3.5 h-3.5" />}
        >
          Movimiento
        </Boton>
      </header>

      <Marco
        columnas={
          cajonEmpuja ? '356px minmax(0,1fr)' : '356px minmax(0,1fr) 336px'
        }
      >
        {/* ---------- Columna 1: el total y las billeteras ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona className="xl:!py-[18px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Total disponible
            </p>
            <p
              className={`font-display font-black text-[40px] leading-none tabular-nums mt-2 ${
                saldoTotal >= 0 ? 'text-[color:var(--acento)]' : 'text-[color:var(--alerta)]'
              }`}
            >
              {formatearCOP(saldoTotal)}
            </p>
            <p className="text-[11.5px] text-[color:var(--texto-3)] mt-2">
              Repartido en {billeteras.length}{' '}
              {billeteras.length === 1 ? 'billetera' : 'billeteras'}.
            </p>
          </Zona>

          {billeteras.length === 0 ? (
            <Zona crece>
              <EstadoVacio
                icono={Wallet}
                titulo="Sin billeteras activas"
                descripcion="Crea tu primera billetera para administrar tus saldos bancarios y efectivo en mano."
                textoBoton="Crea tu primera billetera"
                varianteBoton="primario"
                onAccion={() => abrirNuevaBilletera()}
              />
            </Zona>
          ) : (
            <Zona sinPadding>
              <div className="flex flex-col px-4 xl:px-0">
                {billeteras.map((b) => {
                  const peso = saldoTotal > 0 ? (b.saldo / saldoTotal) * 100 : 0;
                  return (
                    <div
                      key={b.id}
                      className="group grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5 xl:px-[17px] border-b border-[var(--hairline)] last:border-b-0"
                    >
                      <div
                        className="w-[30px] h-[30px] rounded-lg border flex items-center justify-center flex-none"
                        style={{
                          background: `color-mix(in srgb, ${b.color || 'var(--acento)'} 16%, transparent)`,
                          borderColor: 'var(--hairline)',
                        }}
                      >
                        {getIconoBilletera(b.tipo)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-[color:var(--texto)] truncate">
                            {b.nombre}
                          </span>
                          <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
                            <button
                              onClick={() => abrirEditarBilletera(b)}
                              className="p-1 rounded text-[color:var(--texto-3)] hover:text-[color:var(--texto)] cursor-pointer"
                              aria-label={`Editar billetera ${b.nombre}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            {billeteras.length > 1 && (
                              <button
                                onClick={() => onEliminarBilletera(b.id)}
                                className="p-1 rounded text-[color:var(--texto-3)] hover:text-[color:var(--alerta)] cursor-pointer"
                                aria-label={`Eliminar billetera ${b.nombre}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-[color:var(--texto-3)] truncate">
                          {b.entidad || b.tipo}
                          {b.numeroCuentaCorto && ` · ${b.numeroCuentaCorto}`}
                        </p>
                        <span className="mt-1.5 h-[3px] rounded-sm bg-[var(--hairline)] overflow-hidden block">
                          <span
                            className="block h-full rounded-sm"
                            style={{
                              width: `${Math.max(0, Math.min(100, peso))}%`,
                              background: b.color || 'var(--acento)',
                            }}
                          />
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="block font-display font-bold text-[13.5px] tabular-nums text-[color:var(--texto)]">
                          {formatearCOP(b.saldo)}
                        </span>
                        <span className="block text-[10px] text-[color:var(--texto-3)] tabular-nums">
                          {peso.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Zona>
          )}

          <Zona crece>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Cómo se movió cada una
            </p>
            <table className="w-full mt-2 tabular-nums">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.13em] text-[color:var(--texto-3)]">
                  <th className="text-left font-semibold pb-1.5"></th>
                  <th className="text-right font-semibold pb-1.5">Entró</th>
                  <th className="text-right font-semibold pb-1.5">Salió</th>
                  <th className="text-right font-semibold pb-1.5">Neto</th>
                </tr>
              </thead>
              <tbody>
                {flujoPorBilletera.map((f) => (
                  <tr key={f.billetera.id} className="border-b border-[var(--hairline)] last:border-b-0">
                    <td className="py-1.5 text-[11.5px] text-[color:var(--texto)] truncate max-w-[96px]">
                      {f.billetera.nombre}
                    </td>
                    <td
                      className={`py-1.5 text-right font-display font-semibold text-[11.5px] ${
                        f.entro > 0 ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto-3)]'
                      }`}
                    >
                      {f.entro > 0 ? `+${formatearCOP(f.entro)}` : '—'}
                    </td>
                    <td
                      className={`py-1.5 text-right font-display font-semibold text-[11.5px] ${
                        f.salio > 0 ? 'text-[color:var(--texto)]' : 'text-[color:var(--texto-3)]'
                      }`}
                    >
                      {f.salio > 0 ? `−${formatearCOP(f.salio)}` : '—'}
                    </td>
                    <td
                      className={`py-1.5 text-right font-display font-bold text-[11.5px] ${
                        f.neto > 0
                          ? 'text-[color:var(--positivo)]'
                          : f.neto < 0
                          ? 'text-[color:var(--alerta)]'
                          : 'text-[color:var(--texto-3)]'
                      }`}
                    >
                      {f.neto === 0 ? '—' : `${f.neto > 0 ? '+' : '−'}${formatearCOP(Math.abs(f.neto))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {proximaDeuda && onNavegar && (
              <button
                onClick={() => onNavegar('deudas')}
                className="mt-auto pt-3 w-full text-left flex items-center justify-between gap-3 cursor-pointer group"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--accion)]">
                    Próximo pago
                  </span>
                  <span className="block text-xs font-semibold text-[color:var(--texto)] truncate mt-0.5">
                    {proximaDeuda.nombre}
                  </span>
                </span>
                <span className="flex items-center gap-2 flex-none">
                  <span className="font-display font-bold text-[15px] tabular-nums text-[color:var(--accion)]">
                    {formatearCOP(
                      proximaDeuda.pagoMinimo > 0 ? proximaDeuda.pagoMinimo : proximaDeuda.saldo ?? 0
                    )}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[color:var(--texto-3)] group-hover:text-[color:var(--acento)] transition-colors" />
                </span>
              </button>
            )}
          </Zona>
        </Columna>

        {/* ---------- Columna 2: los movimientos ---------- */}
        <Columna ordenMovil={3} borde={!cajonEmpuja}>
          <Zona>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  Movimientos
                </p>
                <p className="text-[11.5px] text-[color:var(--texto-3)] mt-1.5">
                  <span className="text-[color:var(--texto-2)] font-semibold">
                    {movimientosFiltrados.length}
                  </span>{' '}
                  de {movimientos.length} en total
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    ['todos', 'Todos'],
                    ['ingreso', 'Ingresos'],
                    ['gasto', 'Gastos'],
                  ] as const
                ).map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    onClick={() => setFiltroTipo(valor)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filtroTipo === valor
                        ? 'bg-[var(--elevada)] border border-[var(--linea)] text-[color:var(--texto)]'
                        : 'text-[color:var(--texto-3)] hover:text-[color:var(--texto)]'
                    }`}
                  >
                    {etiqueta}
                  </button>
                ))}
                {billeteras.length > 1 && (
                  <select
                    value={filtroBilleteraId}
                    onChange={(e) => setFiltroBilleteraId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] text-xs text-[color:var(--texto-2)] focus:outline-none focus:text-[color:var(--texto)] cursor-pointer"
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
          </Zona>

          <Zona crece sinPadding>
            {movimientosFiltrados.length > 0 ? (
              <Scroll className="px-4 xl:px-[17px] py-1">
                <div className="flex flex-col">
                  {movimientosFiltrados.map((mov) => {
                    const esIngreso = mov.tipo === 'ingreso';
                    const esAbonoDeuda = Boolean(mov.deudaId) || mov.categoria === 'Deudas';
                    return (
                      <div
                        key={mov.id}
                        className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-2.5 border-b border-[var(--hairline)] last:border-b-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none border ${
                            esIngreso
                              ? 'bg-[var(--positivo)]/12 border-[var(--positivo)]/25 text-[color:var(--positivo)]'
                              : esAbonoDeuda
                              ? 'bg-[var(--acento)]/12 border-[var(--acento)]/25 text-[color:var(--acento)]'
                              : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--alerta)]'
                          }`}
                        >
                          {esIngreso ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : esAbonoDeuda ? (
                            <CreditCard className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12.5px] font-medium text-[color:var(--texto)] truncate">
                              {mov.nota || mov.descripcion || mov.categoria}
                            </span>
                            {esAbonoDeuda && (
                              <span className="px-1.5 rounded text-[9.5px] font-bold bg-[var(--acento)]/15 text-[color:var(--acento)] border border-[var(--acento)]/30 flex-none">
                                Abono
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-[color:var(--texto-3)] truncate mt-0.5">
                            {mov.fecha} · {mov.categoria}
                            {mov.billeteraNombre ? ` · ${mov.billeteraNombre}` : ''}
                          </p>
                        </div>

                        <span
                          className={`font-display font-bold text-[13.5px] tabular-nums text-right whitespace-nowrap ${
                            esIngreso ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto)]'
                          }`}
                        >
                          {esIngreso ? '+' : '−'}
                          {formatearCOP(Math.abs(mov.monto))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Scroll>
            ) : movimientos.length === 0 ? (
              <div className="p-4">
                <EstadoVacio
                  icono={TrendingUp}
                  titulo="Sin movimientos registrados"
                  descripcion="Registra tu primer ingreso o gasto para controlar tu plata en tiempo real."
                  textoBoton="Registra tu primer ingreso o gasto"
                  varianteBoton="primario"
                  onAccion={() => abrirModalMovimientoConBilletera()}
                />
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs text-[color:var(--texto-2)]">
                  No hay movimientos con los filtros seleccionados.
                </p>
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
              </div>
            )}
          </Zona>

          {/* Cuando el cajón empuja, el resumen del mes se pliega aquí debajo */}
          {cajonEmpuja && <ResumenDelMes />}
        </Columna>

        {/* ---------- Columna 3: el resumen del mes ---------- */}
        <Columna ordenMovil={2} className={cajonEmpuja ? 'xl:hidden' : ''}>
          <ResumenDelMes />
        </Columna>
      </Marco>

      {/* Aviso contextual, solo donde cabe sin estorbar */}
      {onNavegar && (
        <div className="xl:hidden">
          <AvisoContextualPro
            id="aviso-billeteras-presupuesto"
            texto="¿Se te va la plata sin saber en qué? Presupuesto te pone topes."
            esPro={esPro}
            onAbrirPro={() => onNavegar('pro')}
          />
        </div>
      )}

      {/* Modales */}
      <ModalAgregarBilletera
        abierto={modalBilleteraAbierto}
        billeteraAEditar={billeteraAEditar}
        onCerrar={() => {
          setModalBilleteraAbierto(false);
          setBilleteraAEditar(null);
        }}
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
