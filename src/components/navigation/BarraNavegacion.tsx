import React from 'react';
import { Home, Wallet, CreditCard, User, Sparkles, Sprout } from 'lucide-react';
import { PWAInstallButton } from '../ui/PWAInstallButton';
import { NivelAcceso } from '../../types';
import { useTema } from '../../utils/theme';

export type SeccionApp = 'inicio' | 'billeteras' | 'deudas' | 'crecer' | 'perfil' | 'pro' | 'termometro' | 'activar_codigo';

interface BarraNavegacionProps {
  seccionActiva: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
  usuario?: string;
  nivelAcceso?: NivelAcceso;
}

interface ItemNav {
  id: SeccionApp;
  etiqueta: string;
  icono: React.ComponentType<{ className?: string }>;
}

// Ítems limpios, TODOS accesibles, SIN candados. "Crecer" es la puerta a Pro.
const ITEMS_NAV: ItemNav[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: Home },
  { id: 'billeteras', etiqueta: 'Billeteras', icono: Wallet },
  { id: 'deudas', etiqueta: 'Deudas', icono: CreditCard },
  { id: 'crecer', etiqueta: 'Crecer', icono: Sprout },
  { id: 'perfil', etiqueta: 'Perfil', icono: User },
];

// En móvil la Billetera es la entrada principal (app "billetera-first")
const ITEMS_NAV_MOVIL: ItemNav[] = [
  { id: 'billeteras', etiqueta: 'Billeteras', icono: Wallet },
  { id: 'inicio', etiqueta: 'Inicio', icono: Home },
  { id: 'deudas', etiqueta: 'Deudas', icono: CreditCard },
  { id: 'crecer', etiqueta: 'Crecer', icono: Sprout },
  { id: 'perfil', etiqueta: 'Perfil', icono: User },
];

export const BarraNavegacion: React.FC<BarraNavegacionProps> = ({
  seccionActiva,
  onCambiarSeccion,
  usuario = 'Marcela',
  nivelAcceso = 'entrada',
}) => {
  const { esPapel } = useTema();

  // Si el nivel es 'demo', ocultar la barra para enfocar el gancho Termómetro
  if (nivelAcceso === 'demo') {
    return null;
  }

  return (
    <>
      {/* ========================================================= */}
      {/* NAVEGACIÓN DE ESCRITORIO: MENÚ LATERAL (DESKTOP SIDEBAR) */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-30 bg-[var(--fondo)] border-r border-[var(--linea)]">
        {/* Cabecera / Marca Bolsillo */}
        <div className="p-6 border-b border-[var(--linea)]">
          <div className="flex items-center gap-3">
            {/* Logo Bolsillo */}
            <div
              className={`w-10 h-10 rounded-xl p-[1px] shadow-sm ${
                esPapel ? 'bg-[var(--acento)]' : 'bg-platinum-gradient'
              }`}
            >
              <div className="w-full h-full rounded-[11px] bg-[var(--superficie)] flex items-center justify-center">
                <span
                  className={`font-display font-black text-lg tracking-tighter ${
                    esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'
                  }`}
                >
                  B
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-display font-bold text-lg tracking-tight ${
                    esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'
                  }`}
                >
                  Bolsillo
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--superficie-2)] text-[color:var(--texto-2)] border border-[var(--linea)]">
                  CO
                </span>
              </div>
              <p className="text-[11px] text-[color:var(--texto-2)] leading-tight">Finanzas Personales</p>
            </div>
          </div>
        </div>

        {/* Lista de navegación vertical */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--texto-3)]">
            Mi Bolsillo
          </div>
          {ITEMS_NAV.map((item) => {
            const Icono = item.icono;
            const esActivo = seccionActiva === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onCambiarSeccion(item.id)}
                className={`
                  w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl
                  text-sm font-medium transition-all duration-150 cursor-pointer select-none
                  ${
                    esActivo
                      ? 'bg-[var(--superficie-2)] text-[color:var(--acento)] border border-[var(--linea)] font-semibold shadow-xs'
                      : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)]'
                  }
                `}
              >
                <Icono className={`w-5 h-5 ${esActivo ? 'text-[color:var(--acento)]' : 'text-[color:var(--texto-2)]'}`} />
                <span>{item.etiqueta}</span>

                {esActivo && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--acento)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Pie del menú lateral en escritorio */}
        <div className="p-4 border-t border-[var(--linea)] bg-[var(--base)]/40 space-y-3">
          <PWAInstallButton />

          {/* Tarjeta de usuario */}
          <div
            onClick={() => onCambiarSeccion('perfil')}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] cursor-pointer hover:border-[var(--acento)]/40 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--superficie-2)] flex items-center justify-center text-xs font-bold text-[color:var(--texto)] border border-[var(--linea)]">
              {usuario.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[color:var(--texto)] truncate">{usuario}</p>
              <p className="text-[10px] text-[color:var(--positivo)] flex items-center gap-1 font-medium">
                <Sparkles className="w-2.5 h-2.5" />
                {nivelAcceso === 'pro' ? 'Bolsillo Pro' : 'Plan Deuda Cero'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* NAVEGACIÓN MÓVIL: BARRA INFERIOR FIJA (BOTTOM NAV BAR)   */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--fondo)]/95 backdrop-blur-md border-t border-[var(--linea)] pb-[env(safe-area-inset-bottom,8px)]">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {ITEMS_NAV_MOVIL.map((item) => {
            const Icono = item.icono;
            const esActivo = seccionActiva === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onCambiarSeccion(item.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 py-1.5
                  transition-colors duration-150 cursor-pointer select-none
                  ${esActivo ? 'text-[color:var(--acento)] font-bold' : 'text-[color:var(--texto-2)] hover:text-[color:var(--texto)]'}
                `}
                aria-label={item.etiqueta}
              >
                {/* Indicador superior activo */}
                {esActivo && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--acento)] rounded-full" />
                )}

                <Icono className={`w-5 h-5 transition-transform duration-150 ${esActivo ? 'scale-110' : ''}`} />

                <span className="text-[11px] font-medium tracking-tight">
                  {item.etiqueta}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
