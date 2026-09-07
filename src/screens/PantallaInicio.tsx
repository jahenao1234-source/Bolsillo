import React, { useState, useMemo } from 'react';
import {
  Wallet,
  CreditCard,
  Target,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { Boton } from '../components/ui/Boton';
import { CountUp } from '../components/ui/CountUp';
import { GraficoLinea } from '../components/ui/GraficoLinea';
import { GraficoDonut } from '../components/ui/GraficoDonut';
import { formatearCOP } from '../utils/format';
import { ResumenFinanciero, Billetera, Deuda, Movimiento } from '../types';
import { SeccionApp } from '../components/navigation/BarraNavegacion';
import {
  calcularPlan,
  calcularSerieSaldoDeuda,
  ordenarDeudasSegunEstrategia,
} from '../logic/planDeudas';
import { ModalAbonarDeuda } from '../components/deudas/ModalAbonarDeuda';
import { CelebracionLogro } from '../components/ui/CelebracionLogro';

interface PantallaInicioProps {
  resumen: ResumenFinanciero;
  billeteras: Billetera[];
  deudas: Deuda[];
  movimientos: Movimiento[];
  disponibleMensual: number;
  onNavegar: (seccion: SeccionApp) => void;
  onAbonarDeuda?: (
    deudaId: string,
    billeteraId: string,
    monto: number
  ) => { exito: boolean; deudaSaldada: boolean };
}

// Colores de categorías para el donut (solo colores del sistema)
const PALETA_CATEGORIAS = ['#25C9BE', '#8AA9FF', '#5FE0A8', '#FF7A3D'];

export const PantallaInicio: React.FC<PantallaInicioProps> = ({
  resumen,
  billeteras,
  deudas,
  movimientos,
  disponibleMensual,
  onNavegar,
  onAbonarDeuda,
}) => {
  const [modalAbonarAbierto, setModalAbonarAbierto] = useState(false);
  const [celebracionActiva, setCelebracionActiva] = useState(false);
  const [deudaCelebrada, setDeudaCelebrada] = useState<{ nombre: string; monto: number }>({
    nombre: '',
    monto: 0,
  });

  const deudasActivas = useMemo(
    () => deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0),
    [deudas]
  );

  const plan = useMemo(
    () => calcularPlan(deudasActivas, disponibleMensual, 'bola_de_nieve'),
    [deudasActivas, disponibleMensual]
  );

  const puntosDeuda = useMemo(
    () =>
      calcularSerieSaldoDeuda(deudasActivas, disponibleMensual, 'bola_de_nieve').map((p) => ({
        etiqueta: p.etiqueta,
        valor: p.saldo,
      })),
    [deudasActivas, disponibleMensual]
  );

  const proximaDeuda = useMemo(() => {
    const ordenadas = ordenarDeudasSegunEstrategia(deudasActivas, 'bola_de_nieve');
    return ordenadas[0] || null;
  }, [deudasActivas]);

  // Gastos del mes por categoría (para el donut)
  const gastosPorCategoria = useMemo(() => {
    const gastos = movimientos.filter((m) => m.tipo === 'gasto' || m.tipo === 'pago_deuda');
    const mapa = new Map<string, number>();
    for (const m of gastos) {
      const cat = m.categoria || 'Otros';
      mapa.set(cat, (mapa.get(cat) || 0) + Math.abs(m.monto));
    }
    const arr = [...mapa.entries()]
      .map(([etiqueta, valor]) => ({ etiqueta, valor }))
      .sort((a, b) => b.valor - a.valor);
    const top = arr.slice(0, 4).map((d, i) => ({ ...d, color: PALETA_CATEGORIAS[i] }));
    const restoValor = arr.slice(4).reduce((a, d) => a + d.valor, 0);
    if (restoValor > 0) top.push({ etiqueta: 'Otros', valor: restoValor, color: 'var(--texto-3)' });
    return top;
  }, [movimientos]);

  const totalGastos = gastosPorCategoria.reduce((a, d) => a + d.valor, 0);
  const categoriaTop = gastosPorCategoria[0];
  const porcentajeTop =
    categoriaTop && totalGastos > 0 ? Math.round((categoriaTop.valor / totalGastos) * 100) : 0;

  const movimientosRecientes = useMemo(() => movimientos.slice(0, 4), [movimientos]);

  const handleConfirmarAbono = (deudaId: string, billeteraId: string, monto: number) => {
    if (onAbonarDeuda) {
      const resultado = onAbonarDeuda(deudaId, billeteraId, monto);
      setModalAbonarAbierto(false);
      if (resultado.deudaSaldada && proximaDeuda) {
        setDeudaCelebrada({ nombre: proximaDeuda.nombre, monto });
        setCelebracionActiva(true);
      }
    } else {
      setModalAbonarAbierto(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 md:space-y-6 pb-24 md:pb-10 animate-screen-enter">
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
              Mi dinero
            </span>
            <span className="text-[color:var(--texto-3)]">&bull;</span>
            <span className="text-xs text-[color:var(--texto-2)]">{resumen.mesActual}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[color:var(--texto)]">
            Hola,{' '}
            <span className="text-platinum-gradient">{resumen.usuario}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Chip variante="aqua" icono={<ShieldCheck className="w-3.5 h-3.5 text-[color:var(--positivo)]" />}>
            Al día
          </Chip>
          {proximaDeuda && (
            <div className="hidden sm:block">
              <Boton
                variante="primario"
                tamano="sm"
                icono={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => setModalAbonarAbierto(true)}
              >
                Abonar a deuda
              </Boton>
            </div>
          )}
        </div>
      </header>

      {/* Tarjetas de estadística */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Disponible */}
        <button
          onClick={() => onNavegar('billeteras')}
          className="text-left p-4 md:p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--hairline)] hover:border-[var(--acento)]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet className="w-4 h-4 text-[color:var(--acento)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--texto-2)]">
              Disponible
            </span>
          </div>
          <div className={`font-display text-xl md:text-2xl font-bold tabular-nums tracking-tight ${resumen.saldoDisponible >= 0 ? 'text-[color:var(--acento)]' : 'text-[color:var(--alerta)]'}`}>
            <CountUp valor={resumen.saldoDisponible} />
          </div>
          <p className="text-[11px] text-[color:var(--texto-3)] mt-1 truncate">
            {billeteras.length} {billeteras.length === 1 ? 'cuenta' : 'cuentas'}
          </p>
        </button>

        {/* Deuda total */}
        <button
          onClick={() => onNavegar('deudas')}
          className="text-left p-4 md:p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--hairline)] hover:border-[var(--acento)]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="w-4 h-4 text-[color:var(--alerta)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--texto-2)]">
              Deuda total
            </span>
          </div>
          <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-[color:var(--alerta)] tracking-tight">
            <CountUp valor={resumen.deudaTotal} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-[var(--superficie-2)] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[var(--positivo)] h-full rounded-full transition-all duration-700"
                style={{ width: `${resumen.porcentajeDeudaPagada}%` }}
              />
            </div>
            <span className="text-[10px] text-[color:var(--texto-2)] tabular-nums">
              {resumen.porcentajeDeudaPagada}%
            </span>
          </div>
        </button>

        {/* Fecha de libertad */}
        <div className="col-span-2 sm:col-span-1 p-4 md:p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--hairline)]">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-[color:var(--acento)]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--texto-2)]">
              Fecha de libertad
            </span>
          </div>
          <div className="font-display text-xl md:text-2xl font-bold tracking-tight text-platinum-gradient">
            {deudasActivas.length === 0 ? '¡Libre!' : plan.fechaLibertad}
          </div>
          <p className="text-[11px] text-[color:var(--texto-3)] mt-1">
            {deudasActivas.length === 0
              ? 'Sin deudas activas'
              : `${plan.mesesTotales} ${plan.mesesTotales === 1 ? 'mes' : 'meses'} de plan`}
          </p>
        </div>
      </div>

      {/* Paneles principales: curva de deuda + donut de gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Curva "tu deuda bajando" */}
        <Tarjeta padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Tu deuda va bajando</h2>
              <p className="text-xs text-[color:var(--texto-2)] mt-0.5">
                {deudasActivas.length === 0
                  ? 'No tienes deudas activas.'
                  : `Proyección con tu abono actual · libre en ${plan.fechaLibertad}`}
              </p>
            </div>
            {deudasActivas.length > 0 && (
              <Chip variante="aqua">−{formatearCOP(plan.interesesTotales)} interés</Chip>
            )}
          </div>

          {deudasActivas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
              <Sparkles className="w-8 h-8 text-[color:var(--positivo)]" />
              <p className="text-sm font-semibold text-[color:var(--texto)]">¡Estás libre de deudas!</p>
              <p className="text-xs text-[color:var(--texto-2)]">Agrega una deuda para ver tu plan de salida.</p>
            </div>
          ) : (
            <div className="mt-2">
              <GraficoLinea puntos={puntosDeuda} color="var(--acento)" altura={200} />
            </div>
          )}
        </Tarjeta>

        {/* Donut "en qué se va tu plata" */}
        <Tarjeta padding="lg" className="lg:col-span-1">
          <h2 className="font-display font-bold text-base text-[color:var(--texto)] mb-1">
            En qué se va tu plata
          </h2>
          <p className="text-xs text-[color:var(--texto-2)] mb-4">Gastos de {resumen.mesActual}</p>

          {totalGastos === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 gap-2">
              <TrendingDown className="w-7 h-7 text-[color:var(--texto-3)]" />
              <p className="text-xs text-[color:var(--texto-2)]">Aún no hay gastos este mes.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <GraficoDonut datos={gastosPorCategoria} tamano={116} grosor={16}>
                <span className="font-display font-bold text-lg text-[color:var(--texto)] leading-none">
                  {porcentajeTop}%
                </span>
                <span className="text-[9px] uppercase tracking-wide text-[color:var(--texto-3)] mt-0.5">
                  {categoriaTop?.etiqueta}
                </span>
              </GraficoDonut>

              <div className="flex-1 min-w-0 space-y-2">
                {gastosPorCategoria.map((c) => (
                  <div key={c.etiqueta} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-[3px] flex-none"
                      style={{ background: c.color }}
                    />
                    <span className="flex-1 text-xs text-[color:var(--texto-2)] truncate">{c.etiqueta}</span>
                    <span className="text-xs font-semibold text-[color:var(--texto)] tabular-nums">
                      {formatearCOP(c.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Tarjeta>
      </div>

      {/* Próximo pago + movimientos recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Próximo pago + CTA */}
        <Tarjeta padding="lg" className="lg:col-span-2 flex flex-col">
          <h2 className="font-display font-bold text-base text-[color:var(--texto)] mb-3">Próximo pago</h2>

          {proximaDeuda ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[color:var(--texto)] truncate">
                      {proximaDeuda.nombre}
                    </span>
                    <Chip variante="aqua">Prioridad #1</Chip>
                  </div>
                  <p className="text-xs text-[color:var(--texto-2)] mt-1">
                    Interés {proximaDeuda.tasaMensual}% mes · Vence{' '}
                    {proximaDeuda.proximaFechaPago || 'pronto'}
                  </p>
                </div>
                <div className="text-right flex-none">
                  <div className="font-display font-bold text-lg tabular-nums text-[color:var(--texto)]">
                    {formatearCOP(
                      proximaDeuda.pagoMinimo > 0
                        ? proximaDeuda.pagoMinimo
                        : proximaDeuda.saldo ?? 0
                    )}
                  </div>
                  <p className="text-[10px] text-[color:var(--texto-3)]">pago sugerido</p>
                </div>
              </div>

              <div className="mt-auto">
                <Boton
                  variante="platino"
                  anchoCompleto
                  tamano="lg"
                  iconoDerecha={<ArrowRight className="w-5 h-5" />}
                  onClick={() => setModalAbonarAbierto(true)}
                >
                  Abonar a esta deuda
                </Boton>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 gap-2 flex-1">
              <ShieldCheck className="w-8 h-8 text-[color:var(--positivo)]" />
              <p className="text-sm font-semibold text-[color:var(--texto)]">Estás al día</p>
              <p className="text-xs text-[color:var(--texto-2)]">No tienes pagos de deuda pendientes.</p>
            </div>
          )}
        </Tarjeta>

        {/* Movimientos recientes */}
        <Tarjeta padding="lg" className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Movimientos</h2>
            <button
              onClick={() => onNavegar('billeteras')}
              className="text-xs font-semibold text-[color:var(--acento)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver todo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {movimientosRecientes.length === 0 ? (
            <p className="text-xs text-[color:var(--texto-2)] py-4 text-center">Sin movimientos aún.</p>
          ) : (
            <div className="divide-y divide-[var(--hairline)]">
              {movimientosRecientes.map((mov) => {
                const esIngreso = mov.tipo === 'ingreso';
                return (
                  <div key={mov.id} className="flex items-center gap-3 py-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-none ${
                        esIngreso
                          ? 'bg-[var(--positivo)]/12 text-[color:var(--positivo)]'
                          : 'bg-[var(--superficie-2)] text-[color:var(--texto-2)]'
                      }`}
                    >
                      {esIngreso ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[color:var(--texto)] truncate">
                        {mov.nota || mov.descripcion || mov.categoria}
                      </p>
                      <p className="text-[10px] text-[color:var(--texto-3)] truncate">
                        {mov.categoria} · {mov.fecha}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums flex-none ${
                        esIngreso ? 'text-[color:var(--positivo)]' : 'text-[color:var(--texto)]'
                      }`}
                    >
                      {esIngreso ? '+' : '−'}
                      {formatearCOP(mov.monto)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Tarjeta>
      </div>

      {/* Modal abonar */}
      {proximaDeuda && (
        <ModalAbonarDeuda
          abierto={modalAbonarAbierto}
          deuda={proximaDeuda}
          billeteras={billeteras}
          onCerrar={() => setModalAbonarAbierto(false)}
          onConfirmarAbono={handleConfirmarAbono}
        />
      )}

      <CelebracionLogro
        activo={celebracionActiva}
        nombreDeuda={deudaCelebrada.nombre}
        montoSaldado={deudaCelebrada.monto}
        quedanPocasDeudas={deudasActivas.length <= 1}
        onTerminar={() => setCelebracionActiva(false)}
        onConocerPro={() => onNavegar('pro')}
      />
    </div>
  );
};
