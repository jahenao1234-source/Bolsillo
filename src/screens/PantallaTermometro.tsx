import React, { useState, useMemo, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Clock,
  DollarSign,
  CreditCard,
  Building2,
  AlertOctagon,
  HelpCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { Chip } from '../components/ui/Chip';
import { formatearCOP } from '../utils/format';
import { calcularPlan } from '../logic/planDeudas';
import { Deuda, DatosTermometro } from '../types';
import { guardarDatosTermometro, getDatosTermometro } from '../data/store';

interface PantallaTermometroProps {
  onIrAActivarCodigo: () => void;
}

type OpcionInteres = 'tarjeta' | 'prestamo' | 'gota_a_gota' | 'no_se';

interface ConfigInteres {
  id: OpcionInteres;
  etiqueta: string;
  subtitulo: string;
  tasaMensual: number;
  icono: React.ComponentType<{ className?: string }>;
}

const OPCIONES_INTERES: ConfigInteres[] = [
  {
    id: 'tarjeta',
    etiqueta: 'Tarjeta de crédito',
    subtitulo: '~2.2% mes (aprox. 30% E.A.)',
    tasaMensual: 2.2,
    icono: CreditCard,
  },
  {
    id: 'prestamo',
    etiqueta: 'Préstamo bancario',
    subtitulo: '~1.6% mes (aprox. 21% E.A.)',
    tasaMensual: 1.6,
    icono: Building2,
  },
  {
    id: 'gota_a_gota',
    etiqueta: 'Gota a gota (Paga diario)',
    subtitulo: '~10.0% mes (tasa informal extrema)',
    tasaMensual: 10.0,
    icono: AlertOctagon,
  },
  {
    id: 'no_se',
    etiqueta: 'No sé / Mixto',
    subtitulo: '~2.0% mes (promedio Colombia)',
    tasaMensual: 2.0,
    icono: HelpCircle,
  },
];

export const PantallaTermometro: React.FC<PantallaTermometroProps> = ({
  onIrAActivarCodigo,
}) => {
  // Inicializar con datos guardados previamente o valores por defecto
  const datosPrevios = getDatosTermometro();
  const [deudaTotal, setDeudaTotal] = useState<number>(datosPrevios?.deudaTotal ?? 8500000);
  const [pagoMensual, setPagoMensual] = useState<number>(datosPrevios?.pagoMensual ?? 380000);
  const [tipoInteres, setTipoInteres] = useState<OpcionInteres>(datosPrevios?.tipoInteres ?? 'tarjeta');

  const configSeleccionada = useMemo(
    () => OPCIONES_INTERES.find((o) => o.id === tipoInteres) || OPCIONES_INTERES[0],
    [tipoInteres]
  );

  const tasaMensual = configSeleccionada.tasaMensual;

  // Persistir en store conforme el usuario manipula los datos
  useEffect(() => {
    guardarDatosTermometro({
      deudaTotal,
      pagoMensual,
      tipoInteres,
      tasaMensual,
    });
  }, [deudaTotal, pagoMensual, tipoInteres, tasaMensual]);

  // Cálculos deterministas
  const calculo = useMemo(() => {
    const interesPrimerMes = deudaTotal * (tasaMensual / 100);
    const cubreIntereses = pagoMensual > interesPrimerMes;

    if (!cubreIntereses) {
      return {
        esViable: false,
        interesPrimerMes,
        mesesTotales: 999,
        interesesTotales: deudaTotal * 3, // Simbólico para mostrar gravedad
        textoTiempo: '¡Nunca saldrás a este ritmo!',
        detalleAlerta: `Tu pago de ${formatearCOP(pagoMensual)} no cubre ni los intereses del mes (${formatearCOP(interesPrimerMes)}). Cada 30 días debes más.`,
        estimadoOptimizadoMeses: Math.max(12, Math.round(deudaTotal / (interesPrimerMes * 1.8))),
      };
    }

    // Deuda sintética agregada
    const deudaSintetica: Deuda = {
      id: 'termometro-deuda-agregada',
      nombre: 'Deuda Consolidada',
      tipo: 'prestamo',
      saldo: deudaTotal,
      saldoTotal: deudaTotal,
      tasaMensual,
      pagoMinimo: pagoMensual,
      saldada: false,
      creadoEn: new Date().toISOString(),
    };

    const plan = calcularPlan([deudaSintetica], pagoMensual, 'bola_de_nieve');
    const anios = Math.floor(plan.mesesTotales / 12);
    const mesesRestantes = plan.mesesTotales % 12;
    let textoTiempo = `${plan.mesesTotales} meses`;
    if (anios > 0) {
      textoTiempo += ` (~${anios} año${anios > 1 ? 's' : ''}${mesesRestantes > 0 ? ` y ${mesesRestantes} m` : ''})`;
    }

    // Estimado motivacional honesto
    const estimadoOptimizadoMeses = Math.max(
      6,
      Math.round(plan.mesesTotales * 0.52)
    );

    return {
      esViable: true,
      interesPrimerMes,
      mesesTotales: plan.mesesTotales,
      interesesTotales: plan.interesesTotales,
      textoTiempo,
      detalleAlerta: null,
      estimadoOptimizadoMeses,
    };
  }, [deudaTotal, pagoMensual, tasaMensual]);

  const handleDesbloquear = () => {
    guardarDatosTermometro({
      deudaTotal,
      pagoMensual,
      tipoInteres,
      tasaMensual,
    });
    onIrAActivarCodigo();
  };

  return (
    <div className="space-y-6 pb-20 pt-2 max-w-2xl mx-auto">
      {/* Barra de cabecera gancho */}
      <div className="flex items-center justify-between gap-3 hairline-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] p-[1px] shadow-sm">
            <div className="w-full h-full rounded-[10px] bg-[var(--superficie)] flex items-center justify-center">
              <span className="font-display font-bold text-sm text-[color:var(--acento)]">
                B
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base tracking-tight text-[color:var(--texto)]">
                Bolsillo
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--superficie-2)] text-[color:var(--texto-2)] border border-[var(--linea)]">
                Colombia
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--texto-2)]">Diagnóstico de endeudamiento</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onIrAActivarCodigo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--superficie)] hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-xs font-semibold text-[color:var(--texto-2)] hover:text-[color:var(--acento)] transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Ya tengo código</span>
        </button>
      </div>

      {/* Título de Entrada y Gancho */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--alerta)]/10 border border-[var(--alerta)]/25 text-[color:var(--alerta)] text-xs font-bold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5" />
          <span>Termómetro de tu Deuda</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-[color:var(--texto)] tracking-tight">
          Descubre el costo real de tus deudas
        </h1>
        <p className="text-sm text-[color:var(--texto-2)] leading-relaxed">
          Ingresa 3 datos rápidos para ver con total honestidad cuántos años e intereses te costará seguir pagando como vienes.
        </p>
      </div>

      {/* ========================================================= */}
      {/* FORMULARIO DE 3 PREGUNTAS CLAVE                          */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* 1. ¿Cuánto debes en total? */}
        <Tarjeta padding="md" className="space-y-3 border-[var(--linea)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--superficie-2)] text-[color:var(--acento)] text-xs flex items-center justify-center font-mono border border-[var(--linea)]">
                1
              </span>
              ¿Cuánto debes en total hoy?
            </label>
            <span className="text-sm font-bold font-display tabular-nums text-[color:var(--texto)]">
              {formatearCOP(deudaTotal)}
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[color:var(--texto-2)] font-bold">
              $
            </div>
            <input
              type="number"
              step="50000"
              min="100000"
              max="500000000"
              value={deudaTotal || ''}
              onChange={(e) => setDeudaTotal(Math.max(0, Number(e.target.value)))}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] focus:border-[var(--acento)] text-[color:var(--texto)] font-mono text-base font-bold focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          {/* Chips de monto rápido */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-[color:var(--texto-3)]">Ejemplos:</span>
            {[3000000, 8500000, 15000000, 25000000].map((monto) => (
              <button
                key={monto}
                type="button"
                onClick={() => setDeudaTotal(monto)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  deudaTotal === monto
                    ? 'bg-[var(--acento)]/20 text-[color:var(--acento)] border border-[var(--acento)]/40'
                    : 'bg-[var(--superficie-2)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] border border-[var(--linea)]'
                }`}
              >
                {monto >= 1000000 ? `$${monto / 1000000}M` : formatearCOP(monto)}
              </button>
            ))}
          </div>
        </Tarjeta>

        {/* 2. ¿Cuánto pagas al mes? */}
        <Tarjeta padding="md" className="space-y-3 border-[var(--linea)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--superficie-2)] text-[color:var(--acento)] text-xs flex items-center justify-center font-mono border border-[var(--linea)]">
                2
              </span>
              ¿Cuánto pagas al mes actualmente?
            </label>
            <span className="text-sm font-bold font-display tabular-nums text-[color:var(--positivo)]">
              {formatearCOP(pagoMensual)}/mes
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[color:var(--texto-2)] font-bold">
              $
            </div>
            <input
              type="number"
              step="20000"
              min="10000"
              max="50000000"
              value={pagoMensual || ''}
              onChange={(e) => setPagoMensual(Math.max(0, Number(e.target.value)))}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] focus:border-[var(--acento)] text-[color:var(--texto)] font-mono text-base font-bold focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-[color:var(--texto-3)]">Rápido:</span>
            {[200000, 380000, 650000, 1200000].map((cuota) => (
              <button
                key={cuota}
                type="button"
                onClick={() => setPagoMensual(cuota)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  pagoMensual === cuota
                    ? 'bg-[var(--positivo)]/20 text-[color:var(--positivo)] border border-[var(--positivo)]/40'
                    : 'bg-[var(--superficie-2)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] border border-[var(--linea)]'
                }`}
              >
                {formatearCOP(cuota)}
              </button>
            ))}
          </div>
        </Tarjeta>

        {/* 3. Interés promedio (Selector de tipo) */}
        <Tarjeta padding="md" className="space-y-3 border-[var(--linea)]">
          <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--texto-2)] flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--superficie-2)] text-[color:var(--acento)] text-xs flex items-center justify-center font-mono border border-[var(--linea)]">
              3
            </span>
            ¿Qué tipo de deuda principal o interés manejas?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {OPCIONES_INTERES.map((opcion) => {
              const Icono = opcion.icono;
              const seleccionada = tipoInteres === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => setTipoInteres(opcion.id)}
                  className={`
                    p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer
                    ${
                      seleccionada
                        ? 'bg-[var(--superficie-2)] border-[var(--acento)] shadow-sm'
                        : 'bg-[var(--superficie)] border-[var(--linea)] hover:bg-[var(--superficie-2)]'
                    }
                  `}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      seleccionada
                        ? 'bg-[var(--acento)]/20 text-[color:var(--acento)]'
                        : 'bg-[var(--superficie-2)] text-[color:var(--texto-2)]'
                    }`}
                  >
                    <Icono className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${seleccionada ? 'text-[color:var(--texto)]' : 'text-[color:var(--texto-2)]'}`}>
                      {opcion.etiqueta}
                    </p>
                    <p className="text-[11px] text-[color:var(--texto-2)] truncate mt-0.5">
                      {opcion.subtitulo}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Tarjeta>
      </div>

      {/* ========================================================= */}
      {/* EL RESULTADO QUE DUELE (EN ROJO / CORAL)                  */}
      {/* ========================================================= */}
      <Tarjeta
        padding="lg"
        className="border-[var(--alerta)]/40 bg-[var(--superficie-2)] relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 translate-x-6 -translate-y-6 w-32 h-32 bg-[var(--alerta)]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 text-[color:var(--alerta)] text-xs font-bold uppercase tracking-wider mb-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>El resultado que duele a este ritmo actual</span>
        </div>

        {calculo.detalleAlerta ? (
          <div className="p-3.5 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 text-xs text-[color:var(--alerta)] font-medium leading-relaxed mb-4">
            {calculo.detalleAlerta}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
          {/* Métrica 1: Tiempo */}
          <div className="p-4 rounded-xl bg-[var(--superficie)] border border-[var(--alerta)]/25">
            <div className="flex items-center gap-2 text-xs text-[color:var(--texto-2)] mb-1">
              <Clock className="w-3.5 h-3.5 text-[color:var(--alerta)]" />
              <span>Tiempo para salir</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[color:var(--alerta)] tabular-nums">
              {calculo.textoTiempo}
            </div>
            <p className="text-[11px] text-[color:var(--texto-2)] mt-1">
              {calculo.esViable ? 'Pagando solo esta cuota fija' : 'La deuda aumentará mes a mes'}
            </p>
          </div>

          {/* Métrica 2: Intereses */}
          <div className="p-4 rounded-xl bg-[var(--superficie)] border border-[var(--alerta)]/25">
            <div className="flex items-center gap-2 text-xs text-[color:var(--texto-2)] mb-1">
              <DollarSign className="w-3.5 h-3.5 text-[color:var(--alerta)]" />
              <span>Intereses que regalarás al banco</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[color:var(--alerta)] tabular-nums">
              {formatearCOP(calculo.interesesTotales)}
            </div>
            <p className="text-[11px] text-[color:var(--texto-2)] mt-1">
              {calculo.esViable
                ? `Equivale al ${Math.round((calculo.interesesTotales / deudaTotal) * 100)}% de lo que pediste prestado`
                : 'Pérdida financiera continua'}
            </p>
          </div>
        </div>

        {/* ESTIMADO MOTIVACIONAL (HONESTO: USA 'PODRÍAS') */}
        <div className="mt-4 pt-3.5 hairline-t border-[var(--alerta)]/20 flex items-start gap-3 text-xs text-[color:var(--texto-2)] leading-relaxed">
          <div className="p-1 rounded-full bg-[var(--positivo)]/20 text-[color:var(--positivo)] flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p>
            <strong className="text-[color:var(--positivo)]">Framing honesto:</strong> Con un plan estructurado (como el método Bola de Nieve) <span className="underline decoration-[var(--positivo)]">podrías</span> salir en ~la mitad del tiempo (<strong className="text-[color:var(--texto)]">~{calculo.estimadoOptimizadoMeses} meses</strong>) y ahorrar buena parte de esos intereses, sin promesas mágicas ni sacrificios imposibles.
          </p>
        </div>
      </Tarjeta>

      {/* ========================================================= */}
      {/* CTA PRINCIPAL (PLATINO)                                   */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <Boton
          variante="platino"
          tamano="lg"
          anchoCompleto
          onClick={handleDesbloquear}
          icono={<ArrowRight className="w-4 h-4" />}
          className="shadow-md py-4 text-sm"
        >
          Desbloquear mi plan &bull; $9 USD
        </Boton>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-xs text-[color:var(--texto-2)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[color:var(--positivo)]" />
            <span>Pago seguro &bull; Acceso de por vida</span>
          </div>

          <button
            type="button"
            onClick={onIrAActivarCodigo}
            className="text-xs font-semibold text-[color:var(--texto-2)] hover:text-[color:var(--acento)] transition-colors cursor-pointer"
          >
            ¿Ya compraste tu acceso? <span className="underline">Activar código</span>
          </button>
        </div>
      </div>
    </div>
  );
};
