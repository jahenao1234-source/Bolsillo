/**
 * Registrar un gasto en tres campos: cuánto, en qué y de dónde salió.
 *
 * Al guardar contesta la pregunta que importa: ¿este gasto me atrasa? Si pasa
 * el techo de la semana y hay deudas, dice cuántos días se corre la fecha de
 * libertad. Con la cifra real del motor, no con una de anuncio.
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Billetera, Deuda, Movimiento, Sobre } from '../../types';
import { formatearCOP } from '../../utils/format';
import { MESES_ABREV } from '../../utils/fechas';
import { diasDeRetraso, CATS_ARRIENDO, CATS_MERCADO, CATS_SERVICIOS, CATS_TRANSPORTE, CATS_GUSTOS, ID_BASICO_ARRIENDO, ID_BASICO_MERCADO, ID_BASICO_SERVICIOS, ID_BASICO_TRANSPORTE, ID_LIBRE_GUSTOS } from '../../logic/sistema';

interface HojaGastoRapidoProps {
  abierto: boolean;
  billeteras: Billetera[];
  sobres: Sobre[];
  /** null si la persona no ha configurado su mes: no hay techo contra el que medir. */
  techoSemanal: number | null;
  gastoSemana: number;
  deudas: Deuda[];
  caja: number;
  enFaseDeudas: boolean;
  onGuardar: (movimiento: Omit<Movimiento, 'id'>) => void;
  onCerrar: () => void;
}

const CATEGORIAS = ['Comida', 'Transporte', 'Servicios', 'Arriendo', 'Ocio', 'Otro'];

interface Resultado {
  concepto: string;
  monto: number;
  exceso: number;
  dias: number;
  quedan: number | null;
}

export const HojaGastoRapido: React.FC<HojaGastoRapidoProps> = ({
  abierto,
  billeteras,
  sobres,
  techoSemanal,
  gastoSemana,
  deudas,
  caja,
  enFaseDeudas,
  onGuardar,
  onCerrar,
}) => {
  const [montoStr, setMontoStr] = useState('');
  const [concepto, setConcepto] = useState('');
  const [billeteraId, setBilleteraId] = useState('');
  const [categoria, setCategoria] = useState('Comida');
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setMontoStr('');
    setConcepto('');
    setCategoria('Comida');
    setError('');
    setResultado(null);
    setBilleteraId((billeteras.find((b) => b.saldo > 0) ?? billeteras[0])?.id ?? '');
    // Solo al abrir: guardar el gasto cambia el saldo de la billetera, y si esto
    // corriera con ese cambio borraría el resultado que la persona tiene que ver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    let sId: string | undefined;
    if (CATS_ARRIENDO.includes(categoria)) sId = ID_BASICO_ARRIENDO;
    else if (CATS_MERCADO.includes(categoria)) sId = ID_BASICO_MERCADO;
    else if (CATS_SERVICIOS.includes(categoria)) sId = ID_BASICO_SERVICIOS;
    else if (CATS_TRANSPORTE.includes(categoria)) sId = ID_BASICO_TRANSPORTE;
    else if (CATS_GUSTOS.includes(categoria)) sId = ID_LIBRE_GUSTOS;

    if (sId) {
      const sobre = sobres.find(s => s.id === sId);
      if (sobre?.billeteraId && billeteras.some(b => b.id === sobre.billeteraId)) {
        setBilleteraId(sobre.billeteraId);
      }
    }
  }, [categoria, sobres, billeteras, abierto]);

  if (!abierto) return null;

  const monto = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) return setError('Escribe cuánto gastaste.');
    if (!billeteraId) return setError('Primero agrega una billetera.');

    const ahora = new Date();
    const nombre = concepto.trim() || categoria;
    
    let sobreId: string | undefined;
    if (CATS_ARRIENDO.includes(categoria)) sobreId = ID_BASICO_ARRIENDO;
    else if (CATS_MERCADO.includes(categoria)) sobreId = ID_BASICO_MERCADO;
    else if (CATS_SERVICIOS.includes(categoria)) sobreId = ID_BASICO_SERVICIOS;
    else if (CATS_TRANSPORTE.includes(categoria)) sobreId = ID_BASICO_TRANSPORTE;
    else if (CATS_GUSTOS.includes(categoria)) sobreId = ID_LIBRE_GUSTOS;

    onGuardar({
      tipo: 'gasto',
      monto,
      billeteraId,
      categoria,
      fecha: `${String(ahora.getDate()).padStart(2, '0')} ${MESES_ABREV[ahora.getMonth()]} ${ahora.getFullYear()}`,
      nota: nombre,
      descripcion: nombre,
      creadoEn: ahora.toISOString(),
      sobreId,
    });

    // Solo la parte de ESTE gasto que queda por encima del techo sale del ataque.
    const exceso =
      techoSemanal === null
        ? 0
        : Math.max(0, gastoSemana + monto - techoSemanal) - Math.max(0, gastoSemana - techoSemanal);
    setResultado({
      concepto: nombre,
      monto,
      exceso,
      dias: enFaseDeudas ? diasDeRetraso(deudas, caja, exceso) : 0,
      quedan: techoSemanal === null ? null : techoSemanal - gastoSemana - monto,
    });
  };

  const campo =
    'w-full px-3.5 py-2.5 rounded-xl bg-superficie-2 border border-linea text-texto placeholder:text-texto-3 focus:outline-none focus:border-acento transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[var(--base)]/80 backdrop-blur-sm" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Registrar un gasto"
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-sm bg-elevada border-t md:border border-linea rounded-t-[22px] md:rounded-2xl px-5 pt-3 pb-6 md:pt-5 shadow-2xl"
      >
        <div className="md:hidden w-10 h-1 rounded-full bg-linea mx-auto mb-3" />

        {resultado ? (
          <div className="flex flex-col gap-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-texto-3">Gasto guardado</p>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold text-sm text-texto truncate">{resultado.concepto}</span>
              <span className="font-display font-extrabold text-xl tabular-nums">{formatearCOP(resultado.monto)}</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-texto-2 p-3 rounded-xl bg-superficie-2 border border-linea">
              {resultado.exceso > 0 ? (
                <>
                  Te pasaste <b className="text-texto tabular-nums">{formatearCOP(resultado.exceso)}</b> del techo de la semana.
                  {resultado.dias > 0 ? (
                    <> Sale de tu ataque de este mes: tu fecha de libertad <b className="text-texto">se corre {resultado.dias} {resultado.dias === 1 ? 'día' : 'días'}</b>.</>
                  ) : enFaseDeudas ? (
                    <> Tu fecha de libertad no se mueve, pero el margen de la semana se acabó.</>
                  ) : null}
                </>
              ) : resultado.quedan !== null ? (
                <>
                  Vas bien: te quedan <b className="text-texto tabular-nums">{formatearCOP(resultado.quedan)}</b> del techo de esta semana.
                </>
              ) : (
                <>Guardado. Configura tu mes para saber si un gasto te atrasa.</>
              )}
            </p>
            <button type="button" onClick={onCerrar} className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer">
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={guardar} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base">Registrar un gasto</h3>
              <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-1 text-texto-3 hover:text-texto cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              inputMode="numeric"
              autoFocus
              value={montoStr}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
                setMontoStr(isNaN(n) ? '' : formatearCOP(n));
                setError('');
              }}
              placeholder="$0"
              aria-label="Cuánto gastaste"
              className={`${campo} text-2xl font-display font-extrabold tabular-nums`}
            />
            <input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="En qué (ej: almuerzo)"
              aria-label="En qué"
              className={`${campo} text-sm`}
            />
            <select
              value={billeteraId}
              onChange={(e) => setBilleteraId(e.target.value)}
              aria-label="De dónde salió"
              className={`${campo} text-sm`}
            >
              {billeteras.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} · {formatearCOP(b.saldo)}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categoría">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                    categoria === c ? 'border-acento text-acento bg-acento/10' : 'border-linea text-texto-3 hover:text-texto-2'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-alerta">{error}</p>}

            <button type="submit" className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer">
              Guardar gasto
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
