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
  ArrowRight,
  Check,
} from 'lucide-react';

interface PantallaProProps {
  onVolver: () => void;
  onIrAActivarCodigo: () => void;
}

const MODULOS = [
  {
    modulo: 'Presupuesto',
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
    modulo: 'Suscripciones',
    icono: CalendarDays,
    resultado: 'Caza los cobros automáticos que se comen tu sueldo sin que lo notes.',
  },
  {
    modulo: 'Tarjetas y días de corte',
    icono: CreditCard,
    resultado: 'Aprovecha hasta 45 días sin intereses sabiendo con cuál pagar hoy.',
  },
];

export const PantallaPro: React.FC<PantallaProProps> = ({ onVolver, onIrAActivarCodigo }) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-12 animate-screen-enter">
      {/* Volver */}
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-2 text-sm text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors cursor-pointer py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      {/* ===================== HERO ===================== */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--hairline)] bg-[var(--superficie)] px-6 py-10 md:px-12 md:py-14 text-center">
        {/* glow teal sutil */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56"
          style={{
            background:
              'radial-gradient(60% 100% at 50% 0%, rgba(37,201,190,0.16) 0%, rgba(37,201,190,0) 70%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-[color:var(--acento)] bg-[var(--superficie-2)] border border-[var(--linea)]">
            <Sparkles className="w-3.5 h-3.5" />
            El siguiente nivel
          </span>

          <h1 className="mt-4 font-display text-2xl sm:text-4xl font-black text-[color:var(--texto)] tracking-tight leading-tight text-balance max-w-2xl mx-auto">
            Ya controlas tu plata y tus deudas.{' '}
            <span className="text-platinum-gradient">Ahora haz que trabaje para ti.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[color:var(--texto-2)] leading-relaxed max-w-xl mx-auto">
            Bolsillo Pro desbloquea todas las herramientas para dejar atrás la angustia y empezar a
            construir tu patrimonio, mes a mes.
          </p>

          {/* chips de reaseguramiento */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {['Pago único', 'Sin mensualidad', 'Sin cobros sorpresa'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[color:var(--texto-2)] bg-[var(--superficie-2)] border border-[var(--linea)]"
              >
                <Check className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== MÓDULOS ===================== */}
      <div>
        <div className="flex items-baseline justify-between px-1 mb-3">
          <h2 className="font-display font-bold text-base text-[color:var(--texto)]">
            Lo que desbloqueas
          </h2>
          <span className="text-xs text-[color:var(--texto-3)]">5 módulos nuevos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {MODULOS.map((m) => {
            const Icono = m.icono;
            return (
              <div
                key={m.modulo}
                className="flex flex-col gap-3 p-4 md:p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--hairline)] transition-all hover:border-[var(--acento)]/40"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--superficie-2)] text-[color:var(--acento)] grid place-items-center border border-[var(--linea)]">
                  <Icono className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">
                    {m.modulo}
                  </h3>
                  <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                    {m.resultado}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Tarjeta "próximamente" para insinuar el futuro (Modo Emprendedor) */}
          <div className="flex flex-col justify-center gap-1.5 p-4 md:p-5 rounded-2xl bg-[var(--superficie-2)] border border-dashed border-[var(--linea)]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--texto-3)]">
              Muy pronto
            </span>
            <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">
              Modo Emprendedor
            </h3>
            <p className="text-xs text-[color:var(--texto-3)] leading-relaxed">
              Tarifa por hora, apartar impuestos y caja para tu negocio.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== PRECIO + CTA ===================== */}
      <div className="rounded-3xl border border-[var(--hairline)] bg-[var(--superficie)] p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Precio */}
        <div className="text-center md:text-left">
          <span className="text-xs uppercase font-semibold tracking-wider text-[color:var(--texto-2)] block">
            Acceso de por vida
          </span>
          <div className="mt-1 font-display text-4xl font-black text-[color:var(--texto)] tracking-tight tabular-nums">
            $59.000 <span className="text-sm font-medium text-[color:var(--texto-2)]">COP</span>
          </div>
          <p className="mt-2 text-xs text-[color:var(--texto-2)] max-w-xs mx-auto md:mx-0 leading-relaxed">
            Menos de lo que cuesta un solo mes de intereses de mora en una tarjeta.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onIrAActivarCodigo}
            className="w-full py-4 px-6 rounded-2xl text-base font-black flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.98] bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95"
          >
            <span>Activar Bolsillo Pro</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[color:var(--texto-3)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[color:var(--positivo)]" />
            ¿Ya tienes tu clave? Actívala al instante.
          </p>
        </div>
      </div>
    </div>
  );
};
