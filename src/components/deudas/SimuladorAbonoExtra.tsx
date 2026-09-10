import React, { useState, useMemo } from 'react';
import { Rocket, ArrowRight, Check } from 'lucide-react';
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

/**
 * El simulador de abono extra.
 *
 * Era tres tarjetas dentro de una tarjeta: el control en su caja, cada
 * resultado en la suya, y todo dentro de otra con padding `lg`. Solo el
 * anidamiento costaba más de 200px de alto, y en una columna estrecha los dos
 * resultados se apilaban y llegaba a 700px.
 *
 * Ahora es una sola superficie con hairlines, como el resto del marco: los
 * resultados son dos filas, no dos cajas.
 */
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

  const hayImpacto =
    abonoExtra > 0 && (simulacion.mesesAhorrados > 0 || simulacion.ahorroIntereses > 0);

  const aplicar = () => {
    if (abonoExtra <= 0 || !onSubirAbono) return;
    onSubirAbono(disponibleMensual + abonoExtra);
    setAplicado(true);
    setTimeout(() => setAplicado(false), 2500);
  };

  return (
    <Tarjeta padding="md" className="border-[var(--linea)] bg-[var(--superficie-2)]">
      {/* Qué es esto, en una línea */}
      <div className="flex items-center gap-2.5">
        <span className="p-1.5 rounded-lg bg-[var(--accion)]/12 text-[color:var(--accion)] border border-[var(--accion)]/25 flex-none">
          <Rocket className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-[color:var(--texto)] tracking-tight">
            Acelera tu libertad
          </h3>
          <p className="text-[11px] text-[color:var(--texto-3)] leading-snug">
            Mueve la barra y mira cuántos meses te ahorras.
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--hairline)] grid gap-x-5 gap-y-3 @2xl:grid-cols-2 @2xl:items-start">
      {/* La palanca */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11.5px] font-semibold text-[color:var(--texto-2)]">
            Abono extra al mes
          </span>
          <span className="font-display font-bold text-[17px] leading-none tabular-nums text-[color:var(--accion)]">
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
          aria-label="Abono extra al mes"
          className="w-full mt-2 accent-[var(--accion)] cursor-pointer h-1.5 bg-[var(--superficie)] rounded-lg appearance-none"
        />

        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESETS_ABONO.map((preset) => {
            const activo = abonoExtra === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAbonoExtra(preset)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums border transition-all cursor-pointer ${
                  activo
                    ? 'bg-[var(--accion)]/15 border-[var(--accion)] text-[color:var(--accion)]'
                    : 'bg-[var(--superficie)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                }`}
              >
                +{formatearCOP(preset)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Qué te devuelve: dos filas, no dos cajas */}
      <div>
      <div className="divide-y divide-[var(--hairline)] border-t border-[var(--hairline)] pt-1 @2xl:border-t-0 @2xl:pt-0">
        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-[11.5px] text-[color:var(--texto-2)]">Sales antes</span>
          <span className="flex items-baseline gap-1.5 min-w-0">
            {simulacion.mesesAhorrados > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--positivo)]/15 text-[color:var(--positivo)] flex-none">
                −{simulacion.mesesAhorrados}{' '}
                {simulacion.mesesAhorrados === 1 ? 'mes' : 'meses'}
              </span>
            )}
            <span className="text-[11px] text-[color:var(--texto-3)] line-through">
              {simulacion.fechaLibertadBase}
            </span>
            <ArrowRight className="w-3 h-3 text-[color:var(--acento)] flex-none self-center" />
            <strong className="font-display font-bold text-[14px] tabular-nums text-[color:var(--texto)]">
              {simulacion.nuevaFechaLibertad}
            </strong>
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-[11.5px] text-[color:var(--texto-2)]">Ahorras en intereses</span>
          <strong className="font-display font-bold text-[15px] tabular-nums text-[color:var(--positivo)]">
            {formatearCOP(simulacion.ahorroIntereses)}
          </strong>
        </div>
      </div>

      {/* Y se puede aplicar de verdad */}
      {onSubirAbono && (
        <>
          <button
            type="button"
            onClick={aplicar}
            disabled={abonoExtra <= 0 || aplicado}
            className={`w-full mt-2.5 py-2.5 rounded-xl font-display font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:cursor-not-allowed ${
              aplicado
                ? 'bg-[var(--positivo)]/15 text-[color:var(--positivo)] border border-[var(--positivo)]/30'
                : 'bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95 disabled:opacity-40'
            }`}
          >
            {aplicado ? (
              <>
                <Check className="w-4 h-4" /> ¡Plan actualizado!
              </>
            ) : (
              <>
                Subir mi abono a {formatearCOP(disponibleMensual + abonoExtra)}/mes{' '}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          {!aplicado && (
            <p className="text-[10.5px] text-[color:var(--texto-3)] text-center mt-1.5 leading-snug">
              {hayImpacto
                ? 'No es solo un cálculo: aplica el cambio a tu plan real.'
                : 'Sube la barra para comprometer más plata a tus deudas.'}
            </p>
          )}
        </>
      )}
      </div>
      </div>
    </Tarjeta>
  );
};
