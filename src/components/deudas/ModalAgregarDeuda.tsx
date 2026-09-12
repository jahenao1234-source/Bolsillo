import React, { useState, useEffect } from 'react';
import { X, Plus, CreditCard, Landmark, Zap, ShoppingBag, FileText, AlertCircle, Pencil } from 'lucide-react';
import { TipoDeuda, Deuda } from '../../types';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';
import { eaDesdeMensual, mensualDesdeEA } from '../../logic/sistema';

interface ModalAgregarDeudaProps {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (deuda: Deuda) => void;
  deudaAEditar?: Deuda | null;
}

const OPCIONES_TIPO: { tipo: TipoDeuda; etiqueta: string; desc: string; icon: React.ReactNode; tasaSugerida: number }[] = [
  {
    tipo: 'tarjeta',
    etiqueta: 'Tarjeta de crédito',
    desc: 'Bancolombia, Falabella, Tuya, Nu...',
    icon: <CreditCard className="w-4 h-4" />,
    tasaSugerida: 28,
  },
  {
    tipo: 'gota_a_gota',
    etiqueta: 'Gota a gota / Paga diario',
    desc: 'Cobro de interés diario o semanal',
    icon: <Zap className="w-4 h-4 text-[color:var(--alerta)]" />,
    tasaSugerida: 214,
  },
  {
    tipo: 'fiado',
    etiqueta: 'Fiado en tienda o persona',
    desc: 'Deuda informal de barrio o familiar',
    icon: <ShoppingBag className="w-4 h-4 text-[color:var(--positivo)]" />,
    tasaSugerida: 0.0,
  },
  {
    tipo: 'libranza',
    etiqueta: 'Crédito de Libranza',
    desc: 'Descuento directo por nómina',
    icon: <FileText className="w-4 h-4 text-[color:var(--acento)]" />,
    tasaSugerida: 18,
  },
  {
    tipo: 'prestamo',
    etiqueta: 'Préstamo bancario libre',
    desc: 'Crédito de consumo personal',
    icon: <Landmark className="w-4 h-4" />,
    tasaSugerida: 24,
  },
];

export const ModalAgregarDeuda: React.FC<ModalAgregarDeudaProps> = ({
  abierto,
  onCerrar,
  onGuardar,
  deudaAEditar,
}) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoDeuda>('tarjeta');
  const [saldoStr, setSaldoStr] = useState('');
  const [tasaStr, setTasaStr] = useState('28');
  const [pagoMinimoStr, setPagoMinimoStr] = useState('');
  const [diaCorteStr, setDiaCorteStr] = useState('');
  const [diaPagoStr, setDiaPagoStr] = useState('');
  const [cupoStr, setCupoStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deudaAEditar) {
      setNombre(deudaAEditar.nombre);
      setTipo(deudaAEditar.tipo);
      const saldo = deudaAEditar.saldo ?? deudaAEditar.saldoTotal ?? 0;
      setSaldoStr(saldo > 0 ? formatearCOP(saldo) : '');
      const ea = deudaAEditar.tasaEA ?? eaDesdeMensual(deudaAEditar.tasaMensual);
      setTasaStr((Math.round(ea * 10) / 10).toString());
      setPagoMinimoStr(deudaAEditar.pagoMinimo > 0 ? formatearCOP(deudaAEditar.pagoMinimo) : '');
      setDiaCorteStr(deudaAEditar.diaCorte ? String(deudaAEditar.diaCorte) : '');
      setDiaPagoStr(deudaAEditar.diaPago ? String(deudaAEditar.diaPago) : '');
      setCupoStr(deudaAEditar.cupo ? formatearCOP(deudaAEditar.cupo) : '');
      setError(null);
    } else {
      setNombre('');
      setTipo('tarjeta');
      setSaldoStr('');
      setTasaStr('28');
      setPagoMinimoStr('');
      setDiaCorteStr('');
      setDiaPagoStr('');
      setCupoStr('');
      setError(null);
    }
  }, [deudaAEditar, abierto]);

  if (!abierto) return null;

  const handleTipoChange = (nuevoTipo: TipoDeuda) => {
    setTipo(nuevoTipo);
    const opcion = OPCIONES_TIPO.find((o) => o.tipo === nuevoTipo);
    if (opcion && !deudaAEditar) {
      setTasaStr(opcion.tasaSugerida.toString());
    }
  };

  const parseMonto = (str: string): number => {
    const clean = str.replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
  };

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseMonto(e.target.value);
    setSaldoStr(val > 0 ? formatearCOP(val) : '');
    if (!pagoMinimoStr && val > 0) {
      const sugerido = Math.round(val * 0.08);
      setPagoMinimoStr(formatearCOP(sugerido));
    }
  };

  const handlePagoMinimoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseMonto(e.target.value);
    setPagoMinimoStr(val > 0 ? formatearCOP(val) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saldo = parseMonto(saldoStr);
    const pagoMinimo = parseMonto(pagoMinimoStr);
    const tasaEA = parseFloat(tasaStr.replace(',', '.')) || 0;
    const dia = (str: string) => {
      const n = parseInt(str, 10);
      return n >= 1 && n <= 31 ? n : undefined;
    };
    const cupo = parseMonto(cupoStr);

    if (!nombre.trim()) {
      setError('Por favor escribe un nombre para la deuda.');
      return;
    }

    if (saldo <= 0) {
      setError('El saldo pendiente debe ser mayor a $0.');
      return;
    }

    if (pagoMinimo <= 0) {
      setError('El pago mínimo mensual debe ser mayor a $0.');
      return;
    }

    const deudaGuardada: Deuda = {
      id: deudaAEditar ? deudaAEditar.id : `deuda-${Date.now()}`,
      nombre: nombre.trim(),
      tipo,
      saldo,
      saldoTotal: saldo,
      montoOriginal: deudaAEditar?.montoOriginal ?? saldo,
      tasaEA,
      tasaMensual: mensualDesdeEA(tasaEA),
      pagoMinimo,
      diaPago: dia(diaPagoStr),
      diaCorte: tipo === 'tarjeta' ? dia(diaCorteStr) : undefined,
      cupo: tipo === 'tarjeta' && cupo > 0 ? cupo : undefined,
      proximoPagoMonto: pagoMinimo,
      proximaFechaPago: deudaAEditar?.proximaFechaPago || 'Fin de mes',
      saldada: deudaAEditar ? deudaAEditar.saldada : false,
      creadoEn: deudaAEditar?.creadoEn || new Date().toISOString(),
      entidad: deudaAEditar?.entidad || (tipo === 'fiado' ? 'Particular' : tipo === 'gota_a_gota' ? 'Paga diario' : 'Entidad financiera'),
      orden: deudaAEditar?.orden,
    };

    onGuardar(deudaGuardada);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        {/* Cabecera del modal */}
        <div className="px-5 py-4 border-b border-[var(--linea)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-center text-[color:var(--acento)]">
              {deudaAEditar ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[color:var(--texto)]">
                {deudaAEditar ? 'Editar deuda' : 'Nueva Obligación'}
              </h3>
              <p className="text-[11px] text-[color:var(--texto-2)]">
                {deudaAEditar ? 'Modifica los detalles de esta obligación' : 'Agrega una deuda a tu plan Deuda Cero'}
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/12 border border-[var(--alerta)]/30 flex items-center gap-2 text-xs text-[color:var(--alerta)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre de la deuda */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
              Nombre de la deuda *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Tarjeta Falabella, Fiado tienda don Pedro..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {/* Tipo de deuda */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
              Tipo de obligación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OPCIONES_TIPO.map((opcion) => {
                const activo = tipo === opcion.tipo;
                return (
                  <button
                    key={opcion.tipo}
                    type="button"
                    onClick={() => handleTipoChange(opcion.tipo)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                      activo
                        ? 'bg-[var(--elevada)] border-[var(--acento)] text-[color:var(--texto)] shadow-xs'
                        : 'bg-[var(--superficie-2)]/60 border-[var(--linea)] text-[color:var(--texto-2)] hover:border-[var(--acento)]/40'
                    }`}
                  >
                    <div className="mt-0.5">{opcion.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight text-[color:var(--texto)]">
                        {opcion.etiqueta}
                      </p>
                      <p className="text-[10px] text-[color:var(--texto-2)] truncate mt-0.5">
                        {opcion.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saldo y Pago Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                Saldo pendiente ($ COP) *
              </label>
              <input
                type="text"
                required
                value={saldoStr}
                onChange={handleSaldoChange}
                placeholder="$1.500.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                Pago mínimo mensual ($ COP) *
              </label>
              <input
                type="text"
                required
                value={pagoMinimoStr}
                onChange={handlePagoMinimoChange}
                placeholder="$120.000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>
          </div>

          {/* Tasa: en E.A., que es como sale en el extracto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                Tasa efectiva anual (% E.A.)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="400"
                required
                value={tasaStr}
                onChange={(e) => setTasaStr(e.target.value)}
                placeholder="28"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
              <p className="text-[10.5px] text-[color:var(--texto-3)] mt-1">
                Sale en tu extracto. Si no la sabes, deja la sugerida.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                Día límite de pago
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaPagoStr}
                onChange={(e) => setDiaPagoStr(e.target.value)}
                placeholder="15"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
              />
            </div>
          </div>

          {/* Tarjeta: corte y cupo, para saber cuándo cierra y cuánto le queda */}
          {tipo === 'tarjeta' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                  Día de corte
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={diaCorteStr}
                  onChange={(e) => setDiaCorteStr(e.target.value)}
                  placeholder="16"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[color:var(--texto-2)] uppercase tracking-wider mb-1.5">
                  Cupo total ($ COP)
                </label>
                <input
                  type="text"
                  value={cupoStr}
                  onChange={(e) => {
                    const val = parseMonto(e.target.value);
                    setCupoStr(val > 0 ? formatearCOP(val) : '');
                  }}
                  placeholder="$5.000.000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm font-semibold tabular-nums text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-3">
            <Boton
              type="button"
              variante="secundario"
              tamano="md"
              onClick={onCerrar}
            >
              Cancelar
            </Boton>
            <Boton
              type="submit"
              variante="primario"
              tamano="md"
              icono={deudaAEditar ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {deudaAEditar ? 'Guardar cambios' : 'Guardar en plan'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
