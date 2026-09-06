import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Wallet,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Deuda, Billetera } from '../../types';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';

interface ModalAbonarDeudaProps {
  abierto: boolean;
  deuda: Deuda | null;
  billeteras: Billetera[];
  onCerrar: () => void;
  onConfirmarAbono: (deudaId: string, billeteraId: string, monto: number) => void;
}

export const ModalAbonarDeuda: React.FC<ModalAbonarDeudaProps> = ({
  abierto,
  deuda,
  billeteras,
  onCerrar,
  onConfirmarAbono,
}) => {
  const [billeteraId, setBilleteraId] = useState<string>('');
  const [montoStr, setMontoStr] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Inicializar billetera por defecto con saldo disponible
  useEffect(() => {
    if (billeteras.length > 0) {
      const conSaldo = billeteras.find((b) => b.saldo > 0) || billeteras[0];
      setBilleteraId(conSaldo.id);
    }
    if (deuda) {
      // Sugerir el pago mínimo por defecto o el saldo si es menor
      const saldoActual = deuda.saldo ?? deuda.saldoTotal ?? 0;
      const sugerido = Math.min(saldoActual, deuda.pagoMinimo > 0 ? deuda.pagoMinimo : saldoActual);
      setMontoStr(sugerido > 0 ? formatearCOP(sugerido) : '');
    }
  }, [deuda, billeteras]);

  if (!abierto || !deuda) return null;

  const saldoDeuda = deuda.saldo ?? deuda.saldoTotal ?? 0;
  const montoNum = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;
  const billeteraSeleccionada = billeteras.find((b) => b.id === billeteraId);
  const saldoBilletera = billeteraSeleccionada ? billeteraSeleccionada.saldo : 0;

  const nuevoSaldoDeuda = Math.max(0, saldoDeuda - montoNum);
  const nuevoSaldoBilletera = saldoBilletera - montoNum;
  const quedaraSaldada = montoNum >= saldoDeuda && saldoDeuda > 0;

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = parseInt(raw, 10);
    setMontoStr(isNaN(num) ? '' : formatearCOP(num));
    if (error) setError('');
  };

  const aplicarPreset = (monto: number) => {
    const valor = Math.min(saldoDeuda, Math.max(0, monto));
    setMontoStr(formatearCOP(valor));
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (montoNum <= 0) {
      setError('Por favor ingresa un monto a abonar');
      return;
    }

    if (!billeteraId) {
      setError('Por favor selecciona la billetera de origen');
      return;
    }

    if (montoNum > saldoBilletera) {
      setError(
        `La billetera "${billeteraSeleccionada?.nombre}" solo dispone de ${formatearCOP(saldoBilletera)}`
      );
      return;
    }

    onConfirmarAbono(deuda.id, billeteraId, montoNum);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-abonar-titulo"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-abonar-titulo" className="text-base font-bold text-[color:var(--texto)]">
                Abonar a obligación
              </h2>
              <p className="text-xs text-[color:var(--texto-2)]">{deuda.nombre}</p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Resumen de la deuda a atacar */}
          <div className="p-3.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider block">
                Saldo pendiente
              </span>
              <div className="font-display font-bold text-xl tabular-nums text-[color:var(--alerta)] mt-0.5">
                {formatearCOP(saldoDeuda)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider block">
                Pago mínimo sugerido
              </span>
              <div className="font-display font-semibold text-sm tabular-nums text-[color:var(--texto)] mt-0.5">
                {formatearCOP(deuda.pagoMinimo)}
              </div>
            </div>
          </div>

          {/* Selector de Billetera de Origen */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center justify-between">
              <span>Billetera de origen (de donde sale el dinero)</span>
              {billeteraSeleccionada && (
                <span className="text-[11px] text-[color:var(--texto-2)]">
                  Disponible: <strong className="text-[color:var(--positivo)]">{formatearCOP(saldoBilletera)}</strong>
                </span>
              )}
            </label>

            <div className="relative">
              <select
                value={billeteraId}
                onChange={(e) => setBilleteraId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors appearance-none cursor-pointer"
              >
                {billeteras.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[var(--superficie)] text-[color:var(--texto)]">
                    {b.nombre} — Saldo: {formatearCOP(b.saldo)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[color:var(--texto-2)]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Campo de Monto a Abonar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Monto a abonar <span className="text-[color:var(--alerta)]">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                required
                value={montoStr}
                onChange={handleMontoChange}
                placeholder="$0"
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xl font-bold font-display tabular-nums text-[color:var(--positivo)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--positivo)] transition-colors"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">
                COP
              </span>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {deuda.pagoMinimo > 0 && deuda.pagoMinimo < saldoDeuda && (
                <button
                  type="button"
                  onClick={() => aplicarPreset(deuda.pagoMinimo)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer"
                >
                  Mínimo ({formatearCOP(deuda.pagoMinimo)})
                </button>
              )}

              <button
                type="button"
                onClick={() => aplicarPreset(Math.round(saldoDeuda / 2))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer"
              >
                50% ({formatearCOP(Math.round(saldoDeuda / 2))})
              </button>

              <button
                type="button"
                onClick={() => aplicarPreset(saldoDeuda)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--positivo)]/10 border border-[var(--positivo)]/30 text-[color:var(--positivo)] hover:bg-[var(--positivo)]/20 cursor-pointer"
              >
                Liquidar 100% ({formatearCOP(saldoDeuda)})
              </button>
            </div>
          </div>

          {/* Tarjeta de simulación del impacto */}
          {montoNum > 0 && (
            <div className="p-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] space-y-2">
              <span className="text-[11px] font-semibold text-[color:var(--texto-2)] uppercase tracking-wider block">
                Impacto en tiempo real
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[color:var(--texto-2)] block">Nuevo saldo deuda:</span>
                  <div className="font-display font-bold text-sm tabular-nums text-[color:var(--texto)] mt-0.5">
                    {formatearCOP(nuevoSaldoDeuda)}
                  </div>
                </div>

                <div>
                  <span className="text-[color:var(--texto-2)] block">Restante en billetera:</span>
                  <div
                    className={`font-display font-bold text-sm tabular-nums mt-0.5 ${
                      nuevoSaldoBilletera < 0 ? 'text-[color:var(--alerta)]' : 'text-[color:var(--positivo)]'
                    }`}
                  >
                    {formatearCOP(nuevoSaldoBilletera)}
                  </div>
                </div>
              </div>

              {quedaraSaldada && (
                <div className="pt-2 border-t border-[var(--linea)] flex items-center gap-1.5 text-xs font-bold text-[color:var(--positivo)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¡Esta obligación quedará 100% liquidada!</span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              tamano="md"
              type="submit"
              iconoDerecha={<ArrowRight className="w-4 h-4" />}
            >
              Confirmar abono
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
