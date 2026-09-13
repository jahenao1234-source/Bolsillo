import React, { useState, useEffect, useMemo } from 'react';
import { Mail, X, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { Sobre, Billetera } from '../../types';
import { sinSobre } from '../../logic/sistema';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';

interface ModalMoverSobreProps {
  modo: 'abonar' | 'retirar';
  sobre: Sobre;
  billeteras: Billetera[];
  sobres: Sobre[];
  montoSugerido?: number;
  origen?: 'aporte_mensual' | 'abono';
  onConfirmar: (monto: number, cuentaOrigen: string, cuentaDestino: string) => { exito: boolean; error?: string };
  onCerrar: () => void;
}

export const ModalMoverSobre: React.FC<ModalMoverSobreProps> = ({
  modo,
  sobre,
  billeteras,
  sobres,
  montoSugerido,
  origen = 'abono',
  onConfirmar,
  onCerrar,
}) => {
  const [montoStr, setMontoStr] = useState(montoSugerido ? formatearCOP(montoSugerido) : '');
  const [error, setError] = useState('');

  const cuentasConPlataSinSobre = useMemo(() => {
    return billeteras
      .map(b => ({ b, disponible: sinSobre(b, sobres) }))
      .sort((a, b) => b.disponible - a.disponible);
  }, [billeteras, sobres]);

  // ABONAR: Dónde se guarda (destino)
  // Sin cuenta, la persona la elige: no se da por hecho que la plata va a la primera de la lista.
  const [destinoId, setDestinoId] = useState<string>(sobre.billeteraId || '');

  // ABONAR: De qué cuenta sale (origen)
  const [origenAbonoId, setOrigenAbonoId] = useState<string>(() => {
    if (modo !== 'abonar') return '';
    if (sobre.billeteraId) {
      const cuenta = cuentasConPlataSinSobre.find(c => c.b.id === sobre.billeteraId);
      if (cuenta && cuenta.disponible > 0) return cuenta.b.id;
    }
    return cuentasConPlataSinSobre[0]?.b.id ?? '';
  });

  // RETIRAR: A qué cuenta va (destino)
  const [destinoRetiroId, setDestinoRetiroId] = useState<string>(sobre.billeteraId || (billeteras[0]?.id ?? ''));

  const num = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  const fmtOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setMontoStr(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const monto = num(montoStr);
  const esAbonar = modo === 'abonar';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      setError('Ingresa un monto mayor a cero');
      return;
    }
    
    if (esAbonar) {
      if (!origenAbonoId) return setError('Selecciona de dónde sale la plata');
      if (!destinoId) return setError('Selecciona dónde vas a guardar la plata');
      const cuentaOrigen = cuentasConPlataSinSobre.find(c => c.b.id === origenAbonoId);
      if (cuentaOrigen && monto > cuentaOrigen.disponible) {
        return setError(`${cuentaOrigen.b.nombre} tiene ${formatearCOP(Math.max(0, cuentaOrigen.disponible))} sin sobre`);
      }
      const res = onConfirmar(monto, origenAbonoId, destinoId);
      if (!res.exito) setError(res.error || 'Error al abonar');
      else onCerrar();
    } else {
      if (monto > sobre.apartado) {
        return setError(`El sobre solo tiene ${formatearCOP(sobre.apartado)}`);
      }
      if (!destinoRetiroId) return setError('Selecciona a qué cuenta va');
      const res = onConfirmar(monto, sobre.billeteraId || '', destinoRetiroId);
      if (!res.exito) setError(res.error || 'Error al retirar');
      else onCerrar();
    }
  };

  const cDestino = billeteras.find(b => b.id === destinoId);
  const cOrigen = billeteras.find(b => b.id === origenAbonoId);
  const cRetiro = billeteras.find(b => b.id === destinoRetiroId);
  const cOrigenRetiro = billeteras.find(b => b.id === sobre.billeteraId);
  const disponibleOrigen = cuentasConPlataSinSobre.find(c => c.b.id === origenAbonoId)?.disponible ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              {esAbonar ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[color:var(--texto)]">
                {esAbonar ? `Abonar a ${sobre.nombre}` : `Retirar de ${sobre.nombre}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {esAbonar ? (
            <>
              {/* ¿Dónde vas a guardar esta plata? (Solo si el sobre no tiene cuenta) */}
              {!sobre.billeteraId ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                    ¿Dónde vas a guardar esta plata? <span className="text-[color:var(--alerta)]">*</span>
                  </label>
                  <select
                    value={destinoId}
                    onChange={e => { setDestinoId(e.target.value); if (error) setError(''); }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors cursor-pointer"
                  >
                    <option value="">Elige una cuenta</option>
                    {billeteras.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-between">
                  <p className="text-sm text-[color:var(--texto)]">Se guarda en <strong>{cDestino?.nombre}</strong></p>
                </div>
              )}

              {/* ¿De qué cuenta sale? */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  ¿De qué cuenta sale? <span className="text-[color:var(--alerta)]">*</span>
                </label>
                <select
                  value={origenAbonoId}
                  onChange={e => { setOrigenAbonoId(e.target.value); if (error) setError(''); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors cursor-pointer"
                >
                  {cuentasConPlataSinSobre.map((c) => (
                    <option key={c.b.id} value={c.b.id}>
                      {c.b.nombre} · {formatearCOP(c.disponible)} sin sobre
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* RETIRAR */
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                ¿A qué cuenta va? <span className="text-[color:var(--alerta)]">*</span>
              </label>
              <select
                value={destinoRetiroId}
                onChange={e => { setDestinoRetiroId(e.target.value); if (error) setError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors cursor-pointer"
              >
                {billeteras.map((b) => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Monto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Monto a {esAbonar ? 'abonar' : 'retirar'} <span className="text-[color:var(--alerta)]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={montoStr}
                onChange={fmtOnChange}
                placeholder="$0"
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-xl font-bold font-display tabular-nums text-[color:var(--acento)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">COP</span>
            </div>
            
            {/* Vista Previa */}
            <div className="text-xs text-[color:var(--texto-2)] mt-2 space-y-1">
              <p>
                Ahora {formatearCOP(sobre.apartado)} · quedará en{' '}
                <strong className="text-[color:var(--acento)]">
                  {formatearCOP(esAbonar ? sobre.apartado + monto : Math.max(0, sobre.apartado - monto))}
                </strong>
              </p>
              
              {esAbonar && cOrigen && monto > disponibleOrigen && (
                <p className="text-[color:var(--alerta)]">
                  {cOrigen.nombre} tiene {formatearCOP(Math.max(0, disponibleOrigen))} sin sobre
                </p>
              )}
              {esAbonar && origenAbonoId && destinoId && origenAbonoId !== destinoId && cOrigen && cDestino && monto > 0 && monto <= disponibleOrigen && (
                <p className="opacity-80">
                  {cOrigen.nombre} queda en {formatearCOP(cOrigen.saldo - monto)} · {cDestino.nombre} en {formatearCOP(cDestino.saldo + monto)}
                </p>
              )}
              {!esAbonar && monto > sobre.apartado && (
                <p className="text-[color:var(--alerta)]">El sobre tiene {formatearCOP(sobre.apartado)}</p>
              )}
              {!esAbonar && destinoRetiroId && sobre.billeteraId && destinoRetiroId !== sobre.billeteraId && cOrigenRetiro && cRetiro && monto > 0 && monto <= sobre.apartado && (
                <p className="opacity-80">
                  {cOrigenRetiro.nombre} queda en {formatearCOP(cOrigenRetiro.saldo - monto)} · {cRetiro.nombre} en {formatearCOP(cRetiro.saldo + monto)}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {esAbonar ? `Abonar ${montoStr ? montoStr : ''}` : `Retirar ${montoStr ? montoStr : ''}`}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
