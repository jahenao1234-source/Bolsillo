import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Mail,
  Trophy,
  CalendarDays,
  CreditCard,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Presupuesto, Sobre } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { formatearCOP } from '../utils/format';
import { PantallaPresupuesto } from './PantallaPresupuesto';
import { PantallaSobres } from './PantallaSobres';

interface PantallaCrecerProps {
  resetToken?: number;
  usuario: string;
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  onGuardarPresupuesto: (categoria: string, tope: number) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
}

type Modulo = 'hub' | 'presupuesto' | 'sobres';

export const PantallaCrecer: React.FC<PantallaCrecerProps> = (props) => {
  const {
    usuario,
    presupuestos,
    gastoPorCategoria,
    onGuardarPresupuesto,
    onEliminarPresupuesto,
    sobres,
    totalApartado,
    saldoTotal,
    onGuardarSobre,
    onEliminarSobre,
  } = props;

  const [modulo, setModulo] = useState<Modulo>('hub');

  // Al re-seleccionar "Crecer" en la nav, vuelve al hub.
  useEffect(() => {
    setModulo('hub');
  }, [props.resetToken]);

  const resumenPresupuesto = useMemo(() => {
    const totalTope = presupuestos.reduce((s, p) => s + p.tope, 0);
    const totalGastado = presupuestos.reduce((s, p) => s + (gastoPorCategoria[p.categoria] || 0), 0);
    const pct = totalTope > 0 ? Math.round((totalGastado / totalTope) * 100) : 0;
    return { totalTope, totalGastado, pct, n: presupuestos.length };
  }, [presupuestos, gastoPorCategoria]);

  if (modulo === 'presupuesto') {
    return (
      <PantallaPresupuesto
        presupuestos={presupuestos}
        gastoPorCategoria={gastoPorCategoria}
        onGuardarPresupuesto={onGuardarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'sobres') {
    return (
      <PantallaSobres
        sobres={sobres}
        totalApartado={totalApartado}
        saldoTotal={saldoTotal}
        onGuardarSobre={onGuardarSobre}
        onEliminarSobre={onEliminarSobre}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto animate-screen-enter">
      {/* Cabecera */}
      <header className="flex items-center justify-between gap-3 pt-1">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Bolsillo Pro
          </span>
          <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
            Crecer
          </h1>
        </div>
      </header>

      {/* Hero */}
      <Tarjeta padding="lg" className="overflow-hidden relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: 'radial-gradient(60% 100% at 20% 0%, color-mix(in srgb, var(--acento) 16%, transparent) 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-md">
            <h2 className="font-display font-black text-xl sm:text-2xl text-[color:var(--texto)] tracking-tight text-balance">
              {usuario ? `${usuario}, ya` : 'Ya'} controlas tu plata.{' '}
              <span className="text-platinum-gradient">Ahora hazla crecer.</span>
            </h2>
            <p className="mt-2 text-sm text-[color:var(--texto-2)] leading-relaxed">
              Ponle topes, aparta lo intocable y convierte lo que te sobra en metas cumplidas.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="text-center px-4 py-3 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <div className="font-display font-bold text-xl tabular-nums text-[color:var(--acento)]">
                {formatearCOP(totalApartado)}
              </div>
              <div className="text-[11px] text-[color:var(--texto-2)] mt-0.5">apartado</div>
            </div>
            <div className="text-center px-4 py-3 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)]">
              <div className="font-display font-bold text-xl tabular-nums text-[color:var(--texto)]">
                {resumenPresupuesto.pct}%
              </div>
              <div className="text-[11px] text-[color:var(--texto-2)] mt-0.5">del presupuesto</div>
            </div>
          </div>
        </div>
      </Tarjeta>

      {/* Módulos */}
      <div>
        <div className="flex items-baseline justify-between px-1 mb-3">
          <h2 className="font-display font-bold text-base text-[color:var(--texto)]">Tus herramientas</h2>
          <span className="text-xs text-[color:var(--texto-3)]">2 activas · 3 en camino</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Presupuesto */}
          <button
            onClick={() => setModulo('presupuesto')}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl grid place-items-center border border-[var(--hairline)]" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                <PieChart className="w-5 h-5 text-[color:var(--acento)]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Presupuesto</h3>
              <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                {resumenPresupuesto.n > 0
                  ? `${resumenPresupuesto.pct}% usado · ${resumenPresupuesto.n} topes activos`
                  : 'Ponle un tope a cada categoría'}
              </p>
            </div>
          </button>

          {/* Sobres */}
          <button
            onClick={() => setModulo('sobres')}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl grid place-items-center border border-[var(--hairline)]" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                <Mail className="w-5 h-5 text-[color:var(--acento)]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Sobres digitales</h3>
              <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                {sobres.length > 0
                  ? `${formatearCOP(totalApartado)} apartado · ${sobres.length} sobres`
                  : 'Aparta lo intocable antes de gastarlo'}
              </p>
            </div>
          </button>

          {/* Próximamente */}
          {[
            { nombre: 'Retos de ahorro', icono: Trophy, desc: 'Junta tu primer millón con retos guiados.' },
            { nombre: 'Suscripciones', icono: CalendarDays, desc: 'Caza los cobros que se comen tu sueldo.' },
            { nombre: 'Tarjetas y corte', icono: CreditCard, desc: 'Sabe con cuál pagar para no pagar intereses.' },
          ].map((m) => {
            const Icono = m.icono;
            return (
              <div
                key={m.nombre}
                className="flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie-2)] border border-dashed border-[var(--linea)] opacity-80"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl grid place-items-center bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-3)]">
                    <Icono className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--texto-3)] bg-[var(--superficie)] border border-[var(--linea)] rounded-full px-2 py-0.5">
                    <Lock className="w-3 h-3" /> Pronto
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[color:var(--texto-2)]">{m.nombre}</h3>
                  <p className="mt-1 text-xs text-[color:var(--texto-3)] leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
