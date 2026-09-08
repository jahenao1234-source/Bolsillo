import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Mail,
  Trophy,
  Flame,
  Repeat,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Presupuesto, Sobre, RetoAhorro, Suscripcion, TarjetaCredito, Billetera, Movimiento } from '../types';
import { Tarjeta } from '../components/ui/Tarjeta';
import { formatearCOP } from '../utils/format';
import { PantallaPresupuesto } from './PantallaPresupuesto';
import { PantallaSobres } from './PantallaSobres';
import { PantallaRetos } from './PantallaRetos';
import { PantallaSuscripciones } from './PantallaSuscripciones';
import { PantallaTarjetas } from './PantallaTarjetas';

interface PantallaCrecerProps {
  resetToken?: number;
  usuario: string;
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  ingresoMensual: number;
  billeteras: Billetera[];
  onGuardarPresupuesto: (p: Presupuesto) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  onRegistrarMovimiento: (mov: Omit<Movimiento, 'id'>) => void;
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  retos: RetoAhorro[];
  onGuardarReto: (reto: RetoAhorro) => void;
  onEliminarReto: (id: string) => void;
  onAportarReto: (id: string) => { exito: boolean; aporte: number; completado: boolean; acumulado: number };
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  tarjetas: TarjetaCredito[];
  onGuardarTarjeta: (tc: TarjetaCredito) => void;
  onEliminarTarjeta: (id: string) => void;
}

type Modulo = 'hub' | 'presupuesto' | 'sobres' | 'retos' | 'suscripciones' | 'tarjetas';

export const PantallaCrecer: React.FC<PantallaCrecerProps> = (props) => {
  const {
    usuario,
    presupuestos,
    gastoPorCategoria,
    ingresoMensual,
    billeteras,
    onGuardarPresupuesto,
    onEliminarPresupuesto,
    onRegistrarMovimiento,
    sobres,
    totalApartado,
    saldoTotal,
    onGuardarSobre,
    onEliminarSobre,
    retos,
    onGuardarReto,
    onEliminarReto,
    onAportarReto,
    suscripciones,
    sangradoMensual,
    onGuardarSuscripcion,
    onEliminarSuscripcion,
    tarjetas,
    onGuardarTarjeta,
    onEliminarTarjeta,
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

  const resumenRetos = useMemo(() => {
    const activos = retos.filter((r) => !r.completado).length;
    const acumulado = retos.reduce((s, r) => s + r.acumulado, 0);
    const mejorRacha = retos.reduce((m, r) => Math.max(m, r.racha), 0);
    return { activos, acumulado, mejorRacha };
  }, [retos]);

  if (modulo === 'presupuesto') {
    return (
      <PantallaPresupuesto
        presupuestos={presupuestos}
        gastoPorCategoria={gastoPorCategoria}
        ingresoMensual={ingresoMensual}
        billeteras={billeteras}
        onGuardarPresupuesto={onGuardarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onRegistrarMovimiento={onRegistrarMovimiento}
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

  if (modulo === 'retos') {
    return (
      <PantallaRetos
        retos={retos}
        onGuardarReto={onGuardarReto}
        onEliminarReto={onEliminarReto}
        onAportarReto={onAportarReto}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'suscripciones') {
    return (
      <PantallaSuscripciones
        suscripciones={suscripciones}
        sangradoMensual={sangradoMensual}
        onGuardarSuscripcion={onGuardarSuscripcion}
        onEliminarSuscripcion={onEliminarSuscripcion}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'tarjetas') {
    return (
      <PantallaTarjetas
        tarjetas={tarjetas}
        onGuardarTarjeta={onGuardarTarjeta}
        onEliminarTarjeta={onEliminarTarjeta}
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
          <span className="text-xs text-[color:var(--texto-3)]">5 herramientas</span>
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

          {/* Retos de ahorro (activo) */}
          <button
            onClick={() => setModulo('retos')}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl grid place-items-center border border-[var(--hairline)]" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                <Trophy className="w-5 h-5 text-[color:var(--acento)]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Retos de ahorro</h3>
              <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed flex items-center gap-1">
                {resumenRetos.activos > 0 ? (
                  <>
                    {formatearCOP(resumenRetos.acumulado)} juntado ·
                    <Flame className="w-3 h-3 text-[color:var(--accion)]" />
                    <span className="text-[color:var(--accion)] font-semibold">{resumenRetos.mejorRacha}</span>
                  </>
                ) : (
                  'Junta tu primer millón con retos guiados'
                )}
              </p>
            </div>
          </button>

          {/* Suscripciones */}
          <button
            onClick={() => setModulo('suscripciones')}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl grid place-items-center border border-[var(--hairline)]" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                <Repeat className="w-5 h-5 text-[color:var(--acento)]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Suscripciones</h3>
              <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                {suscripciones.length > 0
                  ? `${formatearCOP(sangradoMensual)}/mes · ${suscripciones.filter((s) => s.activa).length} activas`
                  : 'Caza los cobros que se comen tu sueldo'}
              </p>
            </div>
          </button>

          {/* Tarjetas y corte */}
          <button
            onClick={() => setModulo('tarjetas')}
            className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] transition-all hover:border-[var(--acento)]/50 hover:bg-[var(--superficie-2)] active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl grid place-items-center border border-[var(--hairline)]" style={{ background: 'color-mix(in srgb, var(--acento) 12%, transparent)' }}>
                <CreditCard className="w-5 h-5 text-[color:var(--acento)]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--texto-3)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[color:var(--texto)]">Tarjetas y corte</h3>
              <p className="mt-1 text-xs text-[color:var(--texto-2)] leading-relaxed">
                {tarjetas.length > 0
                  ? `${tarjetas.length} tarjeta${tarjetas.length === 1 ? '' : 's'} · con cuál pagar hoy`
                  : 'Sabe con cuál pagar para no pagar intereses'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
