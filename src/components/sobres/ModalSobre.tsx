import React, { useState } from 'react';
import { Mail, X, AlertTriangle, Check } from 'lucide-react';
import { Billetera, Sobre } from '../../types';
import { ID_LIBRE_GUSTOS, esSobreDeAcumulacion } from '../../logic/sistema';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';
import { MESES_ABREV } from '../../utils/fechas';

const COLORES_SOBRE = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];

export type ModoModal = 'crear' | 'editar';

interface ModalSobreProps {
  modo: ModoModal;
  sobre: Sobre | null;
  billeteras?: Billetera[];
  onCerrar: () => void;
  onGuardar: (sobre: Sobre) => void;
  /** Sobres de ahorro: abren el modal de mover plata. */
  onAbonar?: () => void;
  onRetirar?: () => void;
}

const ETIQUETA_ORIGEN = {
  abono: 'Abono desde',
  aporte_mensual: 'Aporte del mes desde',
  retiro: 'Retiro a',
  rescate: 'Rescate a',
  ajuste: 'Ajuste en',
} as const;

export const ModalSobre: React.FC<ModalSobreProps> = ({ modo, sobre, billeteras = [], onCerrar, onGuardar, onAbonar, onRetirar }) => {
  const [nombre, setNombre] = useState(sobre?.nombre || '');
  const [metaStr, setMetaStr] = useState(sobre?.meta ? formatearCOP(sobre.meta) : '');
  // Solo el presupuesto se escribe aquí. El apartado cambia al abonar o retirar,
  // que mueven plata real entre cuentas: escribirlo a mano la crearía de la nada.
  const [montoStr, setMontoStr] = useState(sobre?.presupuestoMensual ? formatearCOP(sobre.presupuestoMensual) : '');
  const [color, setColor] = useState(sobre?.color || COLORES_SOBRE[0]);
  const [cuentaId, setCuentaId] = useState(sobre?.billeteraId || '');
  const [error, setError] = useState('');

  const num = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
  const fmtOnChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const n = parseInt(raw, 10);
    setter(isNaN(n) ? '' : formatearCOP(n));
    if (error) setError('');
  };

  const esSistema = sobre?.sistema;
  const esBasico = sobre?.grupo === 'basico';
  const esDetalleAhorro = modo === 'editar' && !!sobre && esSobreDeAcumulacion(sobre);
  const titulo = esDetalleAhorro ? sobre!.nombre : modo === 'crear' ? 'Nuevo sobre' : 'Editar sobre';

  const nombreCuenta = (id?: string) => billeteras.find((b) => b.id === id)?.nombre;
  const cuentaActual = nombreCuenta(sobre?.billeteraId);
  const apartado = sobre?.apartado ?? 0;
  const mueveCuenta = esDetalleAhorro && apartado > 0 && !!cuentaId && cuentaId !== sobre?.billeteraId;
  const historial = [...(sobre?.historial ?? [])].reverse().slice(0, 5);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!esSistema && !nombre.trim()) {
      setError('Ponle un nombre al sobre');
      return;
    }

    let nuevo: Sobre;
    if (esSistema) {
      nuevo = {
        ...sobre!,
        presupuestoMensual: esBasico || sobre?.id === ID_LIBRE_GUSTOS ? num(montoStr) : sobre!.presupuestoMensual,
        meta: !esBasico && sobre?.id !== ID_LIBRE_GUSTOS && num(metaStr) > 0 ? num(metaStr) : sobre!.meta,
      };
    } else {
      nuevo = {
        id: sobre?.id || `sobre-${Date.now()}`,
        nombre: nombre.trim(),
        meta: num(metaStr) > 0 ? num(metaStr) : undefined,
        apartado: sobre?.apartado ?? 0,
        billeteraId: sobre?.billeteraId,
        historial: sobre?.historial,
        color,
        creadoEn: sobre?.creadoEn || new Date().toISOString(),
      };
    }
    if (esDetalleAhorro) nuevo.billeteraId = cuentaId || undefined;

    onGuardar(nuevo);
  };

  const claseCampo =
    'w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors';
  const claseRotulo = 'text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[color:var(--texto)]">{titulo}</h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {esDetalleAhorro && (
            <>
              <div>
                <p className="font-display font-extrabold text-[28px] tabular-nums text-[color:var(--texto)] leading-none">{formatearCOP(apartado)}</p>
                <p className="text-[12.5px] text-[color:var(--texto-3)] mt-1.5">
                  {cuentaActual ? `En ${cuentaActual}` : 'Sin cuenta todavía'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Boton variante="primario" tamano="md" type="button" onClick={onAbonar} disabled={billeteras.length === 0}>
                  Abonar
                </Boton>
                <Boton variante="secundario" tamano="md" type="button" onClick={onRetirar} disabled={apartado <= 0 || !sobre?.billeteraId}>
                  Retirar
                </Boton>
              </div>

              <div className="space-y-1.5">
                <label className={claseRotulo}>Dónde está la plata</label>
                <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={`${claseCampo} cursor-pointer`}>
                  <option value="">Elige una cuenta</option>
                  {billeteras.map((b) => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
                {mueveCuenta && (
                  <p className="text-xs text-[color:var(--advertencia)]">
                    Se moverán {formatearCOP(apartado)} de {cuentaActual ?? 'la cuenta anterior'} a {nombreCuenta(cuentaId)}
                  </p>
                )}
              </div>

              {historial.length > 0 && (
                <div>
                  <p className={claseRotulo}>Últimos movimientos</p>
                  <ul className="mt-1.5">
                    {historial.map((h, i) => {
                      const f = new Date(h.fecha);
                      const sale = h.origen === 'retiro' || h.origen === 'rescate';
                      const cuenta = nombreCuenta(h.billeteraId);
                      return (
                        <li key={`${h.fecha}-${i}`} className={`flex justify-between gap-3 py-2 text-[12.5px] ${i ? 'border-t border-[var(--hairline)]' : ''}`}>
                          <span className="text-[color:var(--texto-2)] min-w-0 truncate">
                            {f.getDate()} {MESES_ABREV[f.getMonth()]} · {cuenta ? `${ETIQUETA_ORIGEN[h.origen]} ${cuenta}` : ETIQUETA_ORIGEN[h.origen].split(' ')[0]}
                          </span>
                          <span className={`flex-none font-bold tabular-nums ${sale ? 'text-[color:var(--texto)]' : 'text-[color:var(--positivo)]'}`}>
                            {sale ? '−' : '+'}{formatearCOP(h.monto)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}

          {!(esDetalleAhorro && esSistema) && (
            <div className="space-y-1.5">
              <label className={claseRotulo}>
                Nombre del sobre {esSistema ? '' : <span className="text-[color:var(--alerta)]">*</span>}
              </label>
              <input
                type="text"
                required={!esSistema}
                disabled={esSistema}
                value={esSistema ? (sobre?.nombre || '') : nombre}
                onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }}
                placeholder="Ej: Fondo de emergencia"
                autoFocus={!esSistema && !esDetalleAhorro}
                className={`${claseCampo} disabled:opacity-50`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {(!esSistema || (!esBasico && sobre?.id !== ID_LIBRE_GUSTOS)) && (
              <div className="space-y-1.5">
                <label className={claseRotulo}>Meta (opcional)</label>
                <input
                  type="text"
                  disabled={esSistema && sobre?.id === 'sobre-colchon'}
                  value={metaStr}
                  onChange={fmtOnChange(setMetaStr)}
                  placeholder="$0"
                  className={`${claseCampo} font-semibold tabular-nums disabled:opacity-50`}
                />
              </div>
            )}

            {esSistema && (esBasico || sobre?.id === ID_LIBRE_GUSTOS) && (
              <div className="space-y-1.5">
                <label className={claseRotulo}>Presupuesto Mensual</label>
                <input
                  type="text"
                  value={montoStr}
                  onChange={fmtOnChange(setMontoStr)}
                  placeholder="$0"
                  autoFocus={esSistema}
                  className={`${claseCampo} font-semibold tabular-nums`}
                />
              </div>
            )}
          </div>

          {!esSistema && (
            <div className="space-y-1.5">
              <label className={claseRotulo}>Color</label>
              <div className="flex items-center gap-2">
                {COLORES_SOBRE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-transform cursor-pointer"
                    style={{
                      background: c,
                      outline: color === c ? '2px solid var(--texto)' : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton variante="primario" tamano="md" type="submit" iconoDerecha={<Check className="w-4 h-4" />}>
              {modo === 'editar' ? 'Guardar' : 'Crear sobre'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
