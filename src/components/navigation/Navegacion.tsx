/**
 * La navegación cambia con la fase, no con lo que la persona compró.
 *
 * - Modo deuda (3 botones): Mi plan · Deudas · Billetera.
 * - Modo Pro   (3 botones): Inicio · Sobres · Más.
 *
 * Nunca hay candados: si algo no toca todavía, no se enseña. Si la persona
 * es Pro y además tiene deudas, el conmutador de la cabecera la deja pasar
 * de un modo al otro sin llenar la barra.
 */

import React from 'react';
import { CreditCard, FolderLock, Home, LayoutGrid, Target, Wallet } from 'lucide-react';

export type SeccionApp =
  | 'plan'
  | 'deudas'
  | 'billetera'
  | 'plan_listo'
  | 'pro_inicio'
  | 'sobres'
  | 'herramientas'
  | 'perfil'
  | 'pro'
  | 'termometro'
  | 'activar_codigo';

export type ModoApp = 'deuda' | 'pro';

interface ItemNav {
  id: SeccionApp;
  etiqueta: string;
  icono: React.ComponentType<{ className?: string }>;
}

export const ITEMS_POR_MODO: Record<ModoApp, ItemNav[]> = {
  deuda: [
    { id: 'pro_inicio', etiqueta: 'Inicio', icono: Home },
    { id: 'plan', etiqueta: 'Mi plan', icono: Target },
    { id: 'deudas', etiqueta: 'Deudas', icono: CreditCard },
    { id: 'billetera', etiqueta: 'Billetera', icono: Wallet },
  ],
  pro: [
    { id: 'pro_inicio', etiqueta: 'Inicio', icono: Home },
    { id: 'sobres', etiqueta: 'Sobres', icono: FolderLock },
    { id: 'billetera', etiqueta: 'Mi plata', icono: Wallet },
    { id: 'herramientas', etiqueta: 'Más', icono: LayoutGrid },
  ],
};

export const INICIO_POR_MODO: Record<ModoApp, SeccionApp> = {
  deuda: 'pro_inicio',
  pro: 'pro_inicio',
};

interface NavProps {
  modo: ModoApp;
  seccionActiva: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
}

/** Barra inferior del celular. */
export const BarraInferior: React.FC<NavProps> = ({ modo, seccionActiva, onCambiarSeccion }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-fondo/95 backdrop-blur-md border-t border-linea pb-[env(safe-area-inset-bottom,8px)]">
    <div className={`grid h-16 max-w-lg mx-auto px-2 ${ITEMS_POR_MODO[modo].length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {ITEMS_POR_MODO[modo].map(({ id, etiqueta, icono: Icono }) => {
        const activo = seccionActiva === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onCambiarSeccion(id)}
            aria-current={activo ? 'page' : undefined}
            className="relative flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <span className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[10px] ${activo ? 'bg-nav-activo text-on-nav-activo' : 'text-texto-3 hover:text-texto-2'}`}>
              <Icono className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{etiqueta}</span>
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

interface RielProps extends NavProps {
  usuario: string;
}

/** Riel de escritorio: los mismos tres destinos, y el perfil abajo. */
export const RielLateral: React.FC<RielProps> = ({ modo, seccionActiva, onCambiarSeccion, usuario }) => (
  <aside className="hidden md:flex flex-col items-center flex-none w-[68px] bg-superficie-2 border-r border-linea py-4 gap-1 xl:w-[232px] xl:items-stretch xl:px-3 xl:py-6">
    <div className="w-8 h-8 mb-3.5 rounded-[9px] grid place-items-center bg-superficie border border-linea xl:hidden">
      <span className="font-display font-black text-[15px] leading-none text-acento">B</span>
    </div>
    <div className="max-xl:hidden px-2.5 mb-6 font-display font-extrabold text-[22px] tracking-tight text-texto">Bolsillo<span className="text-acento">.</span></div>

    {ITEMS_POR_MODO[modo].map(({ id, etiqueta, icono: Icono }) => {
      const activo = seccionActiva === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onCambiarSeccion(id)}
          aria-current={activo ? 'page' : undefined}
          title={etiqueta}
          className={`relative w-[46px] h-11 rounded-[10px] grid place-items-center cursor-pointer transition-colors xl:w-full xl:h-11 xl:flex xl:items-center xl:gap-3 xl:px-3.5 xl:justify-start ${
            activo ? 'bg-elevada text-acento xl:bg-nav-activo xl:text-on-nav-activo xl:font-semibold' : 'text-texto-3 hover:text-texto-2 hover:bg-superficie xl:text-texto-2 xl:hover:bg-superficie'
          }`}
        >
          {activo && <span className="absolute -left-[11px] w-[3px] h-[21px] rounded-r-[3px] bg-acento xl:hidden" />}
          <Icono className="w-[18px] h-[18px] -mt-1 xl:mt-0" />
          <span className="absolute bottom-[3px] text-[7px] leading-none tracking-tight xl:hidden">{etiqueta}</span>
          <span className="max-xl:hidden text-[14.5px]">{etiqueta}</span>
        </button>
      );
    })}

    <div className="flex-1" />

    <button
      type="button"
      onClick={() => onCambiarSeccion('perfil')}
      aria-current={seccionActiva === 'perfil' ? 'page' : undefined}
      title={usuario || 'Tu perfil'}
      className="w-[34px] h-[34px] rounded-full bg-elevada border border-linea grid place-items-center font-display font-bold text-[10.5px] text-acento cursor-pointer hover:border-acento/50 xl:w-full xl:h-auto xl:rounded-[10px] xl:flex xl:items-center xl:gap-3 xl:px-3 xl:py-2.5 xl:bg-transparent xl:border-0"
    >
      <span className="xl:w-[34px] xl:h-[34px] xl:rounded-full xl:bg-elevada xl:border xl:border-linea xl:flex xl:items-center xl:justify-center xl:flex-none">
        {usuario.slice(0, 2).toUpperCase() || '··'}
      </span>
      <span className="max-xl:hidden text-[14px] font-semibold text-texto">{usuario || 'Tu perfil'}</span>
    </button>
  </aside>
);

interface ConmutadorProps {
  modo: ModoApp;
  onCambiar: (modo: ModoApp) => void;
}

/** Solo aparece cuando conviven deudas y Pro. El punto rojo recuerda que hay deuda viva. */
export const ConmutadorModo: React.FC<ConmutadorProps> = ({ modo, onCambiar }) => (
  <div role="tablist" aria-label="Modo" className="inline-flex p-[3px] rounded-full border border-linea bg-superficie-2 text-[11.5px] font-bold">
    {(['deuda', 'pro'] as ModoApp[]).map((m) => (
      <button
        key={m}
        type="button"
        role="tab"
        aria-selected={modo === m}
        onClick={() => onCambiar(m)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer ${
          modo === m ? 'bg-elevada text-texto' : 'text-texto-3 hover:text-texto-2'
        }`}
      >
        {m === 'deuda' ? 'Deuda' : 'Pro'}
        {m === 'deuda' && <span className="w-1.5 h-1.5 rounded-full bg-alerta" aria-label="Tienes deudas activas" />}
      </button>
    ))}
  </div>
);
