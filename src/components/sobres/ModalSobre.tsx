import React, { useState } from 'react';
import { Mail, X, AlertTriangle, Check } from 'lucide-react';
import { Sobre } from '../../types';
import { ID_LIBRE_GUSTOS } from '../../logic/sistema';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';

const COLORES_SOBRE = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879'];

export type ModoModal = 'crear' | 'editar';

interface ModalSobreProps {
  modo: ModoModal;
  sobre: Sobre | null;
  onCerrar: () => void;
  onGuardar: (sobre: Sobre) => void;
}

export const ModalSobre: React.FC<ModalSobreProps> = ({ modo, sobre, onCerrar, onGuardar }) => {
  const [nombre, setNombre] = useState(sobre?.nombre || '');
  const [metaStr, setMetaStr] = useState(sobre?.meta ? formatearCOP(sobre.meta) : '');
  // Solo el presupuesto se escribe aquí. El apartado cambia al abonar o retirar,
  // que mueven plata real entre cuentas: escribirlo a mano la crearía de la nada.
  const [montoStr, setMontoStr] = useState(sobre?.presupuestoMensual ? formatearCOP(sobre.presupuestoMensual) : '');
  const [color, setColor] = useState(sobre?.color || COLORES_SOBRE[0]);
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
  const titulo = modo === 'crear' ? 'Nuevo sobre' : 'Editar sobre';

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
    
    onGuardar(nuevo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[color:var(--texto)]">{titulo}</h2>
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

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Nombre del sobre {esSistema ? '' : <span className="text-[color:var(--alerta)]">*</span>}
                </label>
                <input
                  type="text"
                  required={!esSistema}
                  disabled={esSistema}
                  value={esSistema ? (sobre?.nombre || '') : nombre}
                  onChange={(e) => { setNombre(e.target.value); if (error) setError(''); }}
                  placeholder="Ej: Fondo de emergencia"
                  autoFocus={!esSistema}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(!esSistema || (!esBasico && sobre?.id !== ID_LIBRE_GUSTOS)) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                    Meta (opcional)
                  </label>
                  <input
                    type="text"
                    disabled={esSistema && sobre?.id === 'sobre-colchon'}
                    value={metaStr}
                    onChange={fmtOnChange(setMetaStr)}
                    placeholder="$0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors disabled:opacity-50"
                  />
                </div>
                )}
                
                {esSistema && (esBasico || sobre?.id === ID_LIBRE_GUSTOS) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                    Presupuesto Mensual
                  </label>
                  <input
                    type="text"
                    value={montoStr}
                    onChange={fmtOnChange(setMontoStr)}
                    placeholder="$0"
                    autoFocus={esSistema}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                  />
                </div>
                )}
              </div>

              {!esSistema && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
                  Color
                </label>
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
            </>

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
