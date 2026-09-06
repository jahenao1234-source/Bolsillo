import React, { useState } from 'react';
import { X, Plus, Banknote, Smartphone, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { TipoBilletera, Billetera } from '../../types';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';

interface ModalAgregarBilleteraProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (billetera: Billetera) => void;
}

const OPCIONES_TIPO: {
  tipo: TipoBilletera;
  etiqueta: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    tipo: 'efectivo',
    etiqueta: 'Efectivo',
    desc: 'Billetes y monedas físicas en mano',
    icon: <Banknote className="w-4 h-4 text-[color:var(--positivo)]" />,
    color: 'var(--positivo)',
  },
  {
    tipo: 'nequi',
    etiqueta: 'Nequi / Billetera digital',
    desc: 'Nequi, Daviplata, Dale, RappiPay',
    icon: <Smartphone className="w-4 h-4 text-[color:var(--acento)]" />,
    color: 'var(--acento)',
  },
  {
    tipo: 'banco',
    etiqueta: 'Cuenta de banco',
    desc: 'Bancolombia, Davivienda, Nu, BBVA',
    icon: <Landmark className="w-4 h-4 text-[color:var(--texto)]" />,
    color: 'var(--texto)',
  },
  {
    tipo: 'ahorros',
    etiqueta: 'Ahorros / Bolsillos',
    desc: 'Fondo de emergencia o metas de ahorro',
    icon: <PiggyBank className="w-4 h-4 text-[color:var(--positivo)]" />,
    color: 'var(--positivo)',
  },
  {
    tipo: 'otro',
    etiqueta: 'Otro activo',
    desc: 'Fondos especiales u otras cuentas',
    icon: <Wallet className="w-4 h-4 text-[color:var(--texto-2)]" />,
    color: 'var(--texto-2)',
  },
];

export const ModalAgregarBilletera: React.FC<ModalAgregarBilleteraProps> = ({
  abierto,
  onCerrar,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoBilletera>('nequi');
  const [saldoStr, setSaldoStr] = useState('');
  const [error, setError] = useState('');

  if (!abierto) return null;

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = parseInt(raw, 10);
    setSaldoStr(isNaN(num) ? '' : formatearCOP(num));
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Por favor escribe un nombre para la billetera');
      return;
    }

    const saldoNum = parseInt(saldoStr.replace(/[^\d]/g, ''), 10) || 0;
    const opcionSeleccionada = OPCIONES_TIPO.find((o) => o.tipo === tipo);

    const nuevaBilletera: Billetera = {
      id: `bil-${Date.now()}`,
      nombre: nombre.trim(),
      tipo,
      saldo: saldoNum,
      creadoEn: new Date().toISOString(),
      entidad: opcionSeleccionada?.etiqueta.split('/')[0].trim(),
      color: opcionSeleccionada?.color,
    };

    onGuardar(nuevaBilletera);
    // Limpiar formulario y cerrar
    setNombre('');
    setSaldoStr('');
    setTipo('nequi');
    setError('');
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-billetera-titulo"
      >
        {/* Cabecera modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--acento)]/10 text-[color:var(--acento)] border border-[var(--acento)]/20">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 id="modal-billetera-titulo" className="text-base font-bold text-[color:var(--texto)]">
                Nueva billetera o cuenta
              </h2>
              <p className="text-xs text-[color:var(--texto-2)]">Agrega un fondo para registrar tus movimientos</p>
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

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Nombre de la cuenta */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Nombre de la billetera <span className="text-[color:var(--alerta)]">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ej. Bancolombia Nómina, Nequi, Caja fuerte..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {/* Saldo inicial */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Saldo inicial en COP
            </label>
            <div className="relative">
              <input
                type="text"
                value={saldoStr}
                onChange={handleMontoChange}
                placeholder="$0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--positivo)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--positivo)] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[color:var(--texto-2)]">
              Puedes dejarlo en $0 si empezarás a cargar ingresos luego.
            </p>
          </div>

          {/* Selector de tipo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-1 gap-2">
              {OPCIONES_TIPO.map((opcion) => {
                const seleccionada = tipo === opcion.tipo;
                return (
                  <button
                    key={opcion.tipo}
                    type="button"
                    onClick={() => setTipo(opcion.tipo)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      seleccionada
                        ? 'bg-[var(--superficie)] border-[var(--acento)] shadow-sm'
                        : 'bg-[var(--superficie-2)] border-[var(--linea)] hover:bg-[var(--superficie)]'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-[var(--superficie)] border border-[var(--linea)] flex-shrink-0 mt-0.5">
                      {opcion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[color:var(--texto)]">{opcion.etiqueta}</span>
                        {seleccionada && (
                          <span className="w-2 h-2 rounded-full bg-[var(--acento)]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[color:var(--texto-2)] mt-0.5 leading-snug">{opcion.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton variante="primario" tamano="md" type="submit">
              Guardar billetera
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
