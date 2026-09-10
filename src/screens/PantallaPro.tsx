import React, { useMemo } from 'react';
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
  Briefcase,
} from 'lucide-react';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo, BarraAcciones } from '../components/layout/shell';
import { Chip } from '../components/ui/Chip';
import { formatearCOP } from '../utils/format';
import { calcularReparto, categoriasDeGasto, getContextoMes } from '../logic/resumenMes';
import type { Deuda, Movimiento } from '../types';

interface PantallaProProps {
  onVolver: () => void;
  onIrAActivarCodigo: () => void;
  /** Con qué se arma la vista previa. Si vienen vacíos, se muestra un ejemplo. */
  movimientos?: Movimiento[];
  deudas?: Deuda[];
  disponibleMensual?: number;
}

/**
 * Las cifras del ejemplo. Solo se usan cuando la persona todavía no tiene un
 * mes registrado, y la pantalla lo dice con todas sus letras: son para enseñar
 * de qué va cada módulo, no para hacerlas pasar por suyas.
 */
const EJEMPLO = {
  gastos: 1878976,
  categoriaTop: 'Comida',
  porcentajeTop: 94,
  libre: 431578,
  porDia: 20551,
  diasRestantes: 21,
  movimientos: 47,
  deudasTarjeta: 2,
  deudaTotal: 5270000,
  gastadoHastaHoy: 1675576,
};

export const PantallaPro: React.FC<PantallaProProps> = ({
  onVolver,
  onIrAActivarCodigo,
  movimientos = [],
  deudas = [],
  disponibleMensual = 0,
}) => {
  const contexto = useMemo(() => getContextoMes(), []);

  /*
   * Quien abre esto todavía no es Pro, así que sus sobres, retos y
   * suscripciones están vacíos por definición: pasar [] no es una simplificación,
   * es el estado real.
   */
  const reparto = useMemo(
    () =>
      calcularReparto({
        contexto,
        movimientos,
        deudas,
        disponibleMensual,
        suscripciones: [],
        retos: [],
        esPro: false,
      }),
    [contexto, movimientos, deudas, disponibleMensual]
  );

  const gastos = useMemo(
    () => categoriasDeGasto({ contexto, movimientos }),
    [contexto, movimientos]
  );

  // ¿Hay con qué contar su mes, o toca enseñar el ejemplo?
  const hayDatos = movimientos.length > 0 || deudas.length > 0;

  const d = hayDatos
    ? {
        gastos: gastos.total,
        categoriaTop: gastos.categorias[0]?.etiqueta ?? 'tu categoría más alta',
        porcentajeTop: Math.round(gastos.categorias[0]?.porcentaje ?? 0),
        libre: Math.max(0, reparto.libre),
        porDia: Math.max(0, reparto.porDia),
        diasRestantes: reparto.diasRestantes,
        movimientos: movimientos.length,
        deudasTarjeta: deudas.filter((x) => x.tipo === 'tarjeta').length,
        deudaTotal: deudas.reduce((a, x) => a + (x.saldo ?? x.saldoTotal ?? 0), 0),
        gastadoHastaHoy: reparto.gastadoHastaHoy,
      }
    : EJEMPLO;

  const mes = contexto.nombre.toLowerCase();

  /** "1 tarjeta" y no "1 tarjetas": los números de verdad se leen. */
  const plural = (n: number, singular: string, plural_: string) =>
    `${n} ${n === 1 ? singular : plural_}`;

  const MODULOS = [
    {
      nombre: 'Presupuesto',
      icono: PieChart,
      texto: (
        <>
          Tus <b>{formatearCOP(d.gastos)}</b> de gastos de {mes}, con un tope por categoría — hoy{' '}
          <b>{d.categoriaTop}</b> se lleva {d.porcentajeTop} de cada 100 y nadie te avisa.
        </>
      ),
    },
    {
      nombre: 'Sobres digitales',
      icono: FolderLock,
      texto: (
        <>
          Los <b>{formatearCOP(d.libre)}</b> que te quedan libres, apartados antes de que se vayan.
          Sin abrir una cuenta más.
        </>
      ),
    },
    {
      nombre: 'Retos de ahorro',
      icono: Trophy,
      texto: (
        <>
          A <b>{formatearCOP(d.porDia)} por día</b> te quedan {plural(d.diasRestantes, 'día', 'días')}{' '}
          de mes. Un reto semanal convierte ese sobrante en tu primer millón.
        </>
      ),
    },
    {
      nombre: 'Suscripciones',
      icono: CalendarDays,
      texto: (
        <>
          De tus <b>{plural(d.movimientos, 'movimiento', 'movimientos')}</b> te marco los que se
          repiten solos cada mes, para que los caces antes de que caigan otra vez.
        </>
      ),
    },
    {
      nombre: 'Tarjetas y días de corte',
      icono: CreditCard,
      texto:
        d.deudasTarjeta > 0 ? (
          <>
            {d.deudasTarjeta === 1 ? 'Cuándo pagar tu ' : 'Con cuál de tus '}
            <b>{plural(d.deudasTarjeta, 'tarjeta', 'tarjetas')}</b> para estirar hasta{' '}
            <b>45 días</b> sin intereses, y qué te cuesta pagar solo el mínimo.
          </>
        ) : (
          <>
            Con cuál tarjeta pagar hoy para estirar hasta <b>45 días</b> sin intereses, y qué te
            cuesta de verdad pagar solo el mínimo.
          </>
        ),
    },
  ];

  const DUDAS = [
    {
      q: '¿Hay mensualidad?',
      a: 'No. Pagas $59.000 una vez y es tuyo. No guardamos tu tarjeta.',
    },
    {
      q: '¿Y lo que saquen después?',
      a: 'Entra sin costo. Modo Emprendedor incluido cuando esté listo.',
    },
    {
      q: '¿Pierdo lo que ya registré?',
      a: 'No. Tus deudas, billeteras y movimientos siguen igual — Pro solo suma encima.',
    },
    {
      q: '¿Y si me trabo?',
      a: 'Nos escribes por WhatsApp desde Perfil › Comunidad y soporte.',
    },
  ];

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      {/* Volver, solo en móvil: en escritorio vive en la barra de contexto */}
      <button
        type="button"
        onClick={onVolver}
        className="xl:hidden inline-flex items-center gap-2 text-sm text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors cursor-pointer py-1 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      <Marco columnas="376px minmax(0,1fr) 336px">
        {/* ---------- Columna 1: la oferta, y lo que la sostiene ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Acceso de por vida
            </p>
            <h2 className="font-display font-black text-[21px] leading-[1.15] tracking-tight text-[color:var(--texto)] mt-1.5">
              Ya controlas tu plata.{' '}
              <span className="text-[color:var(--acento)]">Ahora hazla crecer.</span>
            </h2>

            <div className="mt-4 pt-3 border-t border-[var(--hairline)]">
              <div className="font-display font-black text-[38px] leading-none tabular-nums text-[color:var(--texto)]">
                $59.000{' '}
                <span className="text-[13px] font-semibold text-[color:var(--texto-3)]">
                  COP · una vez
                </span>
              </div>
              <p className="text-[11px] text-[color:var(--texto-3)] mt-1.5 leading-relaxed">
                Menos que un solo mes de intereses de mora en una tarjeta.
              </p>
            </div>

            <button
              type="button"
              onClick={onIrAActivarCodigo}
              className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.98] bg-accion-gradient text-[color:var(--on-accion)] hover:opacity-95"
            >
              <span>Activar Bolsillo Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {['Pago único', 'Sin mensualidad', 'Sin cobros sorpresa'].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-[color:var(--texto-2)] bg-[var(--superficie-2)] border border-[var(--linea)]"
                >
                  <Check className="w-3 h-3 text-[color:var(--positivo)]" />
                  {t}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={onIrAActivarCodigo}
              className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] text-[color:var(--texto-3)] hover:text-[color:var(--texto-2)] cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-[color:var(--positivo)]" />
              ¿Ya tienes tu clave? Actívala al instante
            </button>
          </Zona>

          {/*
            Lo que sostiene el precio. Ojo: con datos son SUS cifras, y sin datos
            no se pueden inventar aquí —este bloque afirma algo sobre la persona—,
            así que se cambia por los pasos para llegar a tenerlas.
          */}
          <Zona crece>
            {hayDatos ? (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  Lo que ya llevas con Deuda Cero
                </p>
                <div className="mt-2 divide-y divide-[var(--hairline)]">
                  {[
                    { k: 'Deudas en tu plan', v: formatearCOP(d.deudaTotal) },
                    { k: 'Movimientos registrados', v: `${d.movimientos}` },
                    { k: `Gastado en ${mes}`, v: formatearCOP(d.gastadoHastaHoy) },
                    { k: 'Libre sin dueño', v: formatearCOP(d.libre) },
                  ].map((f) => (
                    <div key={f.k} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-[11.5px] text-[color:var(--texto-3)]">{f.k}</span>
                      <span className="font-display font-bold text-[12.5px] tabular-nums text-[color:var(--texto)]">
                        {f.v}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2.5 leading-relaxed">
                  Esto ya lo tienes. Pro es lo que hace que crezca.
                </p>
              </>
            ) : (
              <>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  Para ver tus propias cifras
                </p>
                <div className="mt-2 divide-y divide-[var(--hairline)]">
                  {[
                    { n: '1', t: 'Registra lo que te entró este mes', d: 'Sueldo, ventas, lo que sea.' },
                    { n: '2', t: 'Agrega tus deudas', d: 'Hasta el fiado de la tienda cuenta.' },
                    { n: '3', t: 'Vuelve aquí', d: 'Y esta pantalla te habla con tus números.' },
                  ].map((f) => (
                    <div key={f.n} className="flex items-start gap-2.5 py-2">
                      <span className="w-4 h-4 flex-none rounded-full bg-[var(--superficie-2)] border border-[var(--linea)] grid place-items-center text-[9px] font-bold text-[color:var(--texto-3)]">
                        {f.n}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold text-[color:var(--texto)] leading-snug">
                          {f.t}
                        </p>
                        <p className="text-[10.5px] text-[color:var(--texto-3)] leading-relaxed">
                          {f.d}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10.5px] text-[color:var(--texto-3)] mt-2.5 leading-relaxed">
                  Pro funciona igual desde el primer día — solo que con tu mes se nota más.
                </p>
              </>
            )}
          </Zona>
        </Columna>

        {/* ---------- Columna 2: qué le hace cada módulo a TU mes ---------- */}
        <Columna ordenMovil={2} borde>
          <Zona crece sinPadding>
            <Scroll className="px-4 xl:px-[17px] py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
                  {hayDatos ? `Lo que cambia en tu ${mes}` : `Así se vería tu ${mes}`}
                </p>
                {!hayDatos && <Chip variante="azul">Cifras de ejemplo</Chip>}
              </div>

              {!hayDatos && (
                <p className="text-[11px] text-[color:var(--texto-3)] mt-1.5 leading-relaxed">
                  Todavía no has registrado tu mes, así que estos números son de un mes de muestra.
                  Cuando registres el tuyo, aquí verás tus propias cifras.
                </p>
              )}

              <div className="mt-2 divide-y divide-[var(--hairline)]">
                {MODULOS.map((m) => {
                  const Icono = m.icono;
                  return (
                    <div key={m.nombre} className="flex items-start gap-3 py-2.5">
                      <span className="w-[30px] h-[30px] flex-none rounded-lg bg-[var(--superficie-2)] border border-[var(--linea)] grid place-items-center text-[color:var(--acento)]">
                        <Icono className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-[12.5px] text-[color:var(--texto)]">
                          {m.nombre}
                        </p>
                        <p className="text-[12px] text-[color:var(--texto-2)] leading-relaxed mt-0.5 [&_b]:text-[color:var(--texto)] [&_b]:font-bold [&_b]:tabular-nums">
                          {m.texto}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Lo que viene, en el mismo riel: no merece tarjeta aparte */}
                <div className="flex items-start gap-3 py-2.5">
                  <span className="w-[30px] h-[30px] flex-none rounded-lg border border-dashed border-[var(--linea)] grid place-items-center text-[color:var(--texto-3)]">
                    <Briefcase className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-[12.5px] text-[color:var(--texto-2)]">
                      Modo Emprendedor{' '}
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--texto-3)]">
                        · muy pronto
                      </span>
                    </p>
                    <p className="text-[12px] text-[color:var(--texto-3)] leading-relaxed mt-0.5">
                      Tarifa por hora, apartar impuestos y caja para tu negocio. Entra sin costo
                      cuando esté.
                    </p>
                  </div>
                </div>
              </div>
            </Scroll>
          </Zona>
        </Columna>

        {/* ---------- Columna 3: lo que se pregunta justo antes de pagar ---------- */}
        <Columna ordenMovil={3}>
          <Zona crece>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[color:var(--texto-3)]">
              Antes de que preguntes
            </p>
            <div className="mt-2 divide-y divide-[var(--hairline)]">
              {DUDAS.map((x) => (
                <div key={x.q} className="py-2.5">
                  <p className="font-display font-bold text-[12px] text-[color:var(--texto)]">
                    {x.q}
                  </p>
                  <p className="text-[11px] text-[color:var(--texto-2)] leading-relaxed mt-1">
                    {x.a}
                  </p>
                </div>
              ))}
            </div>
          </Zona>
        </Columna>
      </Marco>

      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)] whitespace-nowrap">
          Bolsillo Pro
        </h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip variante="aqua">
          <Sparkles className="w-3 h-3" /> El siguiente nivel
        </Chip>
      </BarraTitulo>

      <BarraAcciones>
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--linea)] text-xs font-semibold text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </button>
      </BarraAcciones>
    </div>
  );
};
