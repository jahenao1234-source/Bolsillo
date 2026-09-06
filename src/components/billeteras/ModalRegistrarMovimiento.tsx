import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Tag,
  FileText,
  Plus,
  Check,
} from 'lucide-react';
import { Billetera, Movimiento, TipoMovimiento } from '../../types';
import { CATEGORIAS_INGRESOS_DEFECTO, CATEGORIAS_GASTOS_DEFECTO } from '../../data/store';
import { Boton } from '../ui/Boton';
import { formatearCOP } from '../../utils/format';

interface ModalRegistrarMovimientoProps {
  abierto: boolean;
  billeteras: Billetera[];
  billeteraPreseleccionadaId?: string;
  onCerrar: () => void;
  onGuardar: (movimiento: Omit<Movimiento, 'id'>) => void;
}

export const ModalRegistrarMovimiento: React.FC<ModalRegistrarMovimientoProps> = ({
  abierto,
  billeteras,
  billeteraPreseleccionadaId,
  onCerrar,
  onGuardar,
}) => {
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [montoStr, setMontoStr] = useState('');
  const [billeteraId, setBilleteraId] = useState<string>(() => {
    return billeteraPreseleccionadaId || (billeteras[0]?.id ?? '');
  });
  const [categoria, setCategoria] = useState<string>('Comida');
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState('');
  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  // Sincronizar billetera preseleccionada si cambia
  React.useEffect(() => {
    if (billeteraPreseleccionadaId) {
      setBilleteraId(billeteraPreseleccionadaId);
    } else if (billeteras.length > 0 && !billeteraId) {
      setBilleteraId(billeteras[0].id);
    }
  }, [billeteraPreseleccionadaId, billeteras, billeteraId]);

  // Ajustar categoría por defecto al cambiar el tipo
  const categoriasDisponibles = useMemo(() => {
    return tipo === 'ingreso' ? CATEGORIAS_INGRESOS_DEFECTO : CATEGORIAS_GASTOS_DEFECTO;
  }, [tipo]);

  React.useEffect(() => {
    if (!mostrarNuevaCategoria) {
      setCategoria(tipo === 'ingreso' ? 'Salario' : 'Comida');
    }
  }, [tipo, mostrarNuevaCategoria]);

  if (!abierto) return null;

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = parseInt(raw, 10);
    setMontoStr(isNaN(num) ? '' : formatearCOP(num));
    if (error) setError('');
  };

  const handleConfirmarNuevaCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoriaPersonalizada.trim()) {
      setCategoria(categoriaPersonalizada.trim());
      setMostrarNuevaCategoria(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseInt(montoStr.replace(/[^\d]/g, ''), 10) || 0;

    if (montoNum <= 0) {
      setError('Por favor ingresa un monto mayor a cero');
      return;
    }

    if (!billeteraId) {
      setError('Por favor selecciona una billetera');
      return;
    }

    const catFinal = mostrarNuevaCategoria && categoriaPersonalizada.trim()
      ? categoriaPersonalizada.trim()
      : categoria;

    if (!catFinal) {
      setError('Por favor selecciona o define una categoría');
      return;
    }

    const bSeleccionada = billeteras.find((b) => b.id === billeteraId);

    // Formatear fecha amigable para la vista en español de Colombia
    let fechaLegible = fecha;
    try {
      const partes = fecha.split('-');
      if (partes.length === 3) {
        const dia = partes[2];
        const mesIdx = parseInt(partes[1], 10) - 1;
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        fechaLegible = `${dia} ${meses[mesIdx] || 'sep'} ${partes[0]}`;
      }
    } catch {
      fechaLegible = fecha;
    }

    const nuevoMovimiento: Omit<Movimiento, 'id'> = {
      tipo: tipo as TipoMovimiento,
      monto: montoNum,
      billeteraId,
      billeteraNombre: bSeleccionada?.nombre || 'Billetera',
      categoria: catFinal,
      fecha: fechaLegible,
      nota: nota.trim(),
      descripcion: nota.trim() || catFinal,
      creadoEn: new Date().toISOString(),
    };

    onGuardar(nuevoMovimiento);
    // Limpiar estado y cerrar
    setMontoStr('');
    setNota('');
    setCategoriaPersonalizada('');
    setMostrarNuevaCategoria(false);
    setError('');
    onCerrar();
  };

  const billeteraActiva = billeteras.find((b) => b.id === billeteraId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--base)]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--superficie)] border border-[var(--linea)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-movimiento-titulo"
      >
        {/* Cabecera modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--linea)] bg-[var(--superficie-2)]">
          <div>
            <h2 id="modal-movimiento-titulo" className="text-base font-bold text-[color:var(--texto)]">
              Registrar movimiento
            </h2>
            <p className="text-xs text-[color:var(--texto-2)]">Ingresos y gastos para actualizar tu saldo</p>
          </div>

          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)]">
              {error}
            </div>
          )}

          {/* Selector de Tipo: Ingreso / Gasto */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
            <button
              type="button"
              onClick={() => setTipo('gasto')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tipo === 'gasto'
                  ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-sm border border-[var(--linea)]'
                  : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-[color:var(--alerta)]" />
              <span>Gasto (Salida)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('ingreso')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tipo === 'ingreso'
                  ? 'bg-[var(--superficie)] text-[color:var(--positivo)] shadow-sm border border-[var(--positivo)]/30'
                  : 'text-[color:var(--texto-2)] hover:text-[color:var(--positivo)]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
              <span>Ingreso (Entrada)</span>
            </button>
          </div>

          {/* Monto del movimiento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
              Monto en COP <span className="text-[color:var(--alerta)]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={montoStr}
                onChange={handleMontoChange}
                placeholder="$0"
                autoFocus
                className={`w-full px-3.5 py-3 rounded-xl bg-[var(--superficie-2)] border text-xl font-bold font-display tabular-nums placeholder-[var(--texto-3)] focus:outline-none transition-colors ${
                  tipo === 'ingreso'
                    ? 'text-[color:var(--positivo)] border-[var(--positivo)]/40 focus:border-[var(--positivo)]'
                    : 'text-[color:var(--texto)] border-[var(--linea)] focus:border-[var(--acento)]'
                }`}
              />
              <span className="absolute right-3.5 top-3.5 text-xs text-[color:var(--texto-2)] uppercase">
                COP
              </span>
            </div>
          </div>

          {/* Selector de Billetera de origen o destino */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center justify-between">
              <span>{tipo === 'ingreso' ? 'Billetera destino' : 'Billetera de pago'}</span>
              {billeteraActiva && (
                <span className="text-[11px] font-normal text-[color:var(--texto-2)]">
                  Saldo: <strong className="text-[color:var(--positivo)]">{formatearCOP(billeteraActiva.saldo)}</strong>
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
                    {b.nombre} ({formatearCOP(b.saldo)})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[color:var(--texto-2)]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Selector de Categoría */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Categoría
              </label>

              {!mostrarNuevaCategoria ? (
                <button
                  type="button"
                  onClick={() => setMostrarNuevaCategoria(true)}
                  className="text-[11px] text-[color:var(--acento)] hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Otra categoría
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMostrarNuevaCategoria(false)}
                  className="text-[11px] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer"
                >
                  Volver a sugeridas
                </button>
              )}
            </div>

            {mostrarNuevaCategoria ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={categoriaPersonalizada}
                  onChange={(e) => setCategoriaPersonalizada(e.target.value)}
                  placeholder="Escribe el nombre de la categoría..."
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--superficie-2)] border border-[var(--acento)] text-xs text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleConfirmarNuevaCategoria}
                  className="px-3 py-2 rounded-xl bg-[var(--acento)] text-[color:var(--on-acento)] font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Listo
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {categoriasDisponibles.map((cat) => {
                  const activa = categoria === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        activa
                          ? 'bg-[var(--superficie)] border-[var(--acento)] text-[color:var(--texto)] shadow-sm font-semibold'
                          : 'bg-[var(--superficie-2)] border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fecha del movimiento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {/* Nota opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Nota o descripción (opcional)
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. Almuerzo corrientazo, quincena, recarga..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] text-sm text-[color:var(--texto)] placeholder-[var(--texto-3)] focus:outline-none focus:border-[var(--acento)] transition-colors"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[var(--linea)] flex items-center justify-end gap-2.5">
            <Boton variante="fantasma" tamano="md" onClick={onCerrar} type="button">
              Cancelar
            </Boton>
            <Boton
              variante={tipo === 'ingreso' ? 'primario' : 'secundario'}
              tamano="md"
              type="submit"
            >
              {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar gasto'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
};
