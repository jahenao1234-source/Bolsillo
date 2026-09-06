import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  PieChart,
  FolderLock,
  Trophy,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { useTema } from '../utils/theme';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';

interface PantallaProProps {
  onVolver: () => void;
  onIrAActivarCodigo: () => void;
}

export const PantallaPro: React.FC<PantallaProProps> = ({
  onVolver,
  onIrAActivarCodigo,
}) => {
  const { esPapel } = useTema();

  const beneficios = [
    {
      modulo: 'Presupuesto inteligente',
      icono: PieChart,
      resultado: 'Ponle un tope a cada categoría y no llegues raspando a fin de mes.',
    },
    {
      modulo: 'Sobres digitales',
      icono: FolderLock,
      resultado: 'Aparta lo intocable antes de gastarlo, sin abrir más cuentas.',
    },
    {
      modulo: 'Retos de ahorro',
      icono: Trophy,
      resultado: 'Junta tu primer millón con retos semanales guiados.',
    },
    {
      modulo: 'Suscripciones y recurrentes',
      icono: CalendarDays,
      resultado: 'Caza los cobros automáticos que se comen tu sueldo sin que te des cuenta.',
    },
    {
      modulo: 'Tarjetas y fechas de corte',
      icono: CreditCard,
      resultado: 'Aprovecha hasta 45 días sin intereses sabiendo exactamente con cuál tarjeta pagar hoy.',
    },
  ];

  return (
    <div className="space-y-7 pb-24 md:pb-12 max-w-xl mx-auto animate-screen-enter">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      {/* 1) Eyebrow "El siguiente nivel" + Título de RESULTADO */}
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[color:var(--acento)] bg-[var(--superficie-2)] border border-[var(--linea)]">
          <Sparkles className="w-3.5 h-3.5" />
          El siguiente nivel
        </span>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-[color:var(--texto)] tracking-tight leading-snug">
          Ya controlas tu plata y tus deudas.{' '}
          <span className={esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'}>
            Ahora haz que tu plata trabaje para ti.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[color:var(--texto-2)] leading-relaxed">
          Bolsillo Pro desbloquea el conjunto completo de herramientas para que dejes atrás la angustia y construyas tu patrimonio mes a mes.
        </p>
      </div>

      {/* 2) 5 BENEFICIOS EN LENGUAJE DE RESULTADO */}
      <div className="space-y-3">
        {beneficios.map((b, idx) => {
          const Icono = b.icono;
          return (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/30"
            >
              <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] text-[color:var(--acento)] shrink-0 border border-[var(--linea)]">
                <Icono className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--texto)] leading-snug">
                  {b.resultado}
                </p>
                <p className="text-xs text-[color:var(--texto-3)] font-medium">
                  {b.modulo}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3) REASEGURAMIENTO PROMINENTE (no letra pequeña) */}
      <div className="p-5 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)] text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--positivo)]/15 text-[color:var(--positivo)] mx-auto mb-1">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="font-display text-base font-bold text-[color:var(--texto)]">
          Pago único. Sin mensualidad.
        </h3>
        <p className="text-xs sm:text-sm text-[color:var(--texto-2)] max-w-sm mx-auto leading-relaxed">
          Tus datos viven y se quedan exclusivamente en tu teléfono. No vemos tus cuentas bancarias ni cobramos suscripciones recurrentes.
        </p>
      </div>

      {/* 4) PRECIO COMO CIFRA ÚNICA CONTEXTUALIZADA */}
      <div className="p-6 rounded-3xl bg-[var(--superficie)] border border-[var(--linea)] text-center space-y-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-[color:var(--texto-2)] block">
          Acceso de por vida
        </span>
        <div className="font-display text-3xl sm:text-4xl font-black text-[color:var(--texto)] tracking-tight tabular-nums">
          $59.000 <span className="text-sm font-medium text-[color:var(--texto-2)]">COP</span>
        </div>
        <p className="text-xs text-[color:var(--texto-2)] max-w-xs mx-auto">
          Menos de lo que te cobra un solo mes de intereses de mora en una tarjeta.
        </p>
      </div>

      {/* 5) UN CTA DE CONTINUIDAD */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onIrAActivarCodigo}
          className={`
            w-full py-4 px-6 rounded-2xl text-base font-black flex items-center justify-center gap-2.5
            transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98]
            bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95
          `}
        >
          <span>Activar Bolsillo Pro</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-xs text-[color:var(--texto-3)]">
          ¿Ya tienes tu clave de licencia? Ingrésala para activar al instante.
        </p>
      </div>
    </div>
  );
};
