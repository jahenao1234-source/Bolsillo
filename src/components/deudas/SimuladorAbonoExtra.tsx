import React, { useState, useMemo } from 'react';
import { Rocket, Calendar, TrendingDown, ArrowRight, Check } from 'lucide-react';
import { Tarjeta } from '../ui/Tarjeta';
import { Deuda, EstrategiaPago } from '../../types';
import { simularAbonoExtra } from '../../logic/planDeudas';
import { formatearCOP } from '../../utils/format';

interface SimuladorAbonoExtraProps {
  deudas: Deuda[];
  disponibleMensual: number;
  estrategia: EstrategiaPago;
  onSubirAbono?: (nuevoDisponibleMensual: number) => void;
}

const PRESETS_ABONO = [50000, 100000, 200000, 500000];

export const SimuladorAbonoExtra: React.FC<SimuladorAbonoExtraProps> = ({
  deudas,
  disponibleMensual,
  estrategia,
  onSubirAbono,
}) => {
  const [abonoExtra, setAbonoExtra] = useState<number>(100000);
  const [aplicado, setAplicado] = useState(false);

  const simulacion = useMemo(() => {
    return simularAbonoExtra(deudas, disponibleMensual, estrategia, abonoExtra);
  }, [deudas, disponibleMensual, estrategia, abonoExtra]);

  const deudasActivas = deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0);
  if (deudasActivas.length === 0) return null;

  const hayImpacto = abonoExtra > 0 && (simulacion.mesesAhorrados > 0 || simulacion.ahorroIntereses > 0);

  const aplicar = () => {
    if (abonoExtra <= 0 || !onSubirAbono) return;
    onSubirAbono(disponibleMensual + abonoExtra);
    setAplicado(true);
    setTimeout(() => setAplicado(false), 2500);
  };

  return (
    <Tarjeta padding="lg" className="border-[var(--linea)] bg-[var(--superficie-2)] space-y-4">
      {/* Cabecera */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-[var(--accion)]/12 text-[color:var(--accion)] border border-[var(--accion)]/25 flex-shrink-0">
          <Rocket className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[color:var(--texto)] tracking-tight">Acelera tu libertad</h3>
          <p className="text-[11px] text-[color:var(--texto-2)] leading-snug mt-0.5">
            Cada peso extra que le metes cada mes te saca meses antes y te ahorra intereses. Mueve la barra y míralo.
          </p>
        </div>
      </div>

      {/* Control deslizante */}
      <div className="p-4 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[color:var(--texto-2)]">Abono extra al mes</span>
          <span className="font-display font-bold text-lg tabular-nums text-[color:var(--accion)]">
            +{formatearCOP(abonoExtra)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1000000"
          step="20000"
          value={abonoExtra}
          onChange={(e) => setAbonoExtra(parseInt(e.target.value, 10) || 0)}
          className="w-full accent-[var(--accion)] cursor-pointer h-2 bg-[var(--superficie-2)] rounded-lg appearance-none"
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS_ABONO.map((preset) => {
            const activo = abonoExtra === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAbonoExtra(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                  activo
                    ? 'bg-[var(--accion)]/15 border-[var(--accion)] text-[color:var(--accion)]'
                    : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                +{formatearCOP(preset)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Impacto */}
      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[color:var(--texto-2)] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              Sales antes
            </span>
            {simulacion.mesesAhorrados > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--positivo)]/15 text-[color:var(--positivo)]">
                -{simulacion.mesesAhorrados} {simulacion.mesesAhorrados === 1 ? 'mes' : 'meses'}
              </span>
            )}
          </div>
          <div className="font-display font-bold text-xl @lg:text-2xl text-[color:var(--texto)] tracking-tight mt-1">
            {simulacion.nuevaFechaLibertad}
          </div>
          <div className="text-[11px] text-[color:var(--texto-2)] mt-2 pt-2 border-t border-[var(--hairline)] flex items-center gap-1.5">
            <span className="line-through opacity-70">{simulacion.fechaLibertadBase}</span>
            <ArrowRight className="w-3 h-3 text-[color:var(--acento)]" />
            <strong className="text-[color:var(--texto)]">{simulacion.nuevaFechaLibertad}</strong>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[color:var(--texto-2)] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingDown className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
              Ahorras en intereses
            </span>
          </div>
          <div className="font-display font-bold text-xl @lg:text-2xl text-[color:var(--positivo)] tabular-nums tracking-tight mt-1">
            {simulacion.ahorroIntereses > 0 ? formatearCOP(simulacion.ahorroIntereses) : '$0'}
          </div>
          <p className="text-[11px] text-[color:var(--texto-2)] mt-2 pt-2 border-t border-[var(--hairline)] leading-tight">
            {simulacion.ahorroIntereses > 0
              ? 'Plata que no le pagas a bancos ni prestamistas.'
              : 'Sube el abono para adelantar tu libertad.'}
          </p>
        </div>
      </div>

      {/* Acción ejecutable: se vuelve real */}
      {onSubirAbono && (
        <button
          type="button"
          onClick={aplicar}
          disabled={abonoExtra <= 0 || aplicado}
          className={`w-full py-3.5 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:cursor-not-allowed ${
            aplicado
              ? 'bg-[var(--positivo)]/15 text-[color:var(--positivo)] border border-[var(--positivo)]/30'
              : 'bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95 disabled:opacity-40'
          }`}
        >
          {aplicado ? (
            <><Check className="w-4 h-4" /> ¡Plan actualizado!</>
          ) : (
            <>Subir mi abono a {formatearCOP(disponibleMensual + abonoExtra)}/mes <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      )}
      {onSubirAbono && !aplicado && (
        <p className="text-[11px] text-[color:var(--texto-3)] text-center -mt-1.5">
          {hayImpacto
            ? 'Esto no es solo un cálculo: aplica el cambio a tu plan real.'
            : 'Sube la barra para comprometer más plata a tus deudas.'}
        </p>
      )}
    </Tarjeta>
  );
};
