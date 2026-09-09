import React from 'react';
import { Home, Wallet, CreditCard, User, Sprout } from 'lucide-react';
import { NivelAcceso } from '../../types';

export type SeccionApp = 'inicio' | 'billeteras' | 'deudas' | 'crecer' | 'perfil' | 'pro' | 'termometro' | 'activar_codigo';

interface BarraNavegacionProps {
  seccionActiva: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
  nivelAcceso?: NivelAcceso;
}

interface ItemNav {
  id: SeccionApp;
  etiqueta: string;
  icono: React.ComponentType<{ className?: string }>;
}

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
  nivelAcceso = 'entrada',
}) => {
  // Si el nivel es 'demo', ocultar la barra para enfocar el gancho Termómetro
  if (nivelAcceso === 'demo') {
    return null;
  }

  return (
    <>
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
