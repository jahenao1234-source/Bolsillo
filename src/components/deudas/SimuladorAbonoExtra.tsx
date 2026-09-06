import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, TrendingDown, ArrowRight } from 'lucide-react';
import { Tarjeta } from '../ui/Tarjeta';
import { Chip } from '../ui/Chip';
import { Deuda, EstrategiaPago } from '../../types';
import { simularAbonoExtra } from '../../logic/planDeudas';
import { formatearCOP } from '../../utils/format';

interface SimuladorAbonoExtraProps {
  deudas: Deuda[];
  disponibleMensual: number;
  estrategia: EstrategiaPago;
}

const PRESETS_ABONO = [50000, 100000, 200000, 500000];

export const SimuladorAbonoExtra: React.FC<SimuladorAbonoExtraProps> = ({
  deudas,
  disponibleMensual,
  estrategia,
}) => {
  const [abonoExtra, setAbonoExtra] = useState<number>(100000);

  const simulacion = useMemo(() => {
    return simularAbonoExtra(deudas, disponibleMensual, estrategia, abonoExtra);
  }, [deudas, disponibleMensual, estrategia, abonoExtra]);

  const deudasActivas = deudas.filter((d) => !d.saldada && (d.saldo ?? d.saldoTotal ?? 0) > 0);
  if (deudasActivas.length === 0) return null;

  return (
    <Tarjeta padding="lg" className="border-[var(--linea)] bg-[var(--superficie-2)] space-y-4">
      {/* Cabecera del simulador */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[var(--positivo)]/10 text-[color:var(--positivo)] border border-[var(--positivo)]/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[color:var(--texto)] tracking-tight">
              Simulador de Pago Extra
            </h3>
            <p className="text-[11px] text-[color:var(--texto-2)]">
              Descubre cuánto tiempo y dinero ahorras inyectando excedentes
            </p>
          </div>
        </div>

        <Chip variante="aqua">En vivo</Chip>
      </div>

      {/* Control deslizante y cifra */}
      <div className="p-4 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[color:var(--texto-2)]">
            Abono extra al mes:
          </span>
          <span className="font-display font-bold text-lg tabular-nums text-[color:var(--positivo)]">
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
          className="w-full accent-[var(--positivo)] cursor-pointer h-2 bg-[var(--superficie-2)] rounded-lg appearance-none"
        />

        {/* Presets rápidos */}
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
                    ? 'bg-[var(--positivo)]/15 border-[var(--positivo)] text-[color:var(--positivo)]'
                    : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                +{formatearCOP(preset)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta de impacto gratificante */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Nueva fecha de libertad */}
        <div className="p-3.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[color:var(--texto-2)] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              Nueva fecha de libertad
            </span>
            {simulacion.mesesAhorrados > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--positivo)]/15 text-[color:var(--positivo)]">
                -{simulacion.mesesAhorrados} {simulacion.mesesAhorrados === 1 ? 'mes' : 'meses'}
              </span>
            )}
          </div>

          <div className="font-display font-bold text-xl sm:text-2xl text-[color:var(--texto)] tracking-tight mt-1">
            {simulacion.nuevaFechaLibertad}
          </div>

          <div className="text-[11px] text-[color:var(--texto-2)] mt-2 pt-2 hairline-t flex items-center gap-1.5">
            <span>Base: {simulacion.fechaLibertadBase}</span>
            <ArrowRight className="w-3 h-3 text-[color:var(--acento)]" />
            <strong className="text-[color:var(--texto)]">{simulacion.nuevaFechaLibertad}</strong>
          </div>
        </div>

        {/* Ahorro en intereses bancarios */}
        <div className="p-3.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[color:var(--texto-2)] mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingDown className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
              Ahorro en intereses
            </span>
            <span className="text-[10px] text-[color:var(--texto-2)]">vs. plan base</span>
          </div>

          <div className="font-display font-bold text-xl sm:text-2xl text-[color:var(--positivo)] tabular-nums tracking-tight mt-1">
            {simulacion.ahorroIntereses > 0
              ? `Ahorras ${formatearCOP(simulacion.ahorroIntereses)}`
              : '$0 ahorrados'}
          </div>

          <p className="text-[11px] text-[color:var(--texto-2)] mt-2 pt-2 hairline-t leading-tight">
            {simulacion.ahorroIntereses > 0
              ? 'Dinero que no pagarás a bancos ni prestamistas.'
              : 'Aumenta el abono para adelantar tu libertad financiera.'}
          </p>
        </div>
      </div>
    </Tarjeta>
  );
};
