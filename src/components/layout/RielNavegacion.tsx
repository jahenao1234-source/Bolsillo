/**
 * El riel de escritorio: 68px con los iconos, el saldo abajo y el avatar.
 *
 * Reemplaza al menú lateral de 256px, que en una app de cinco secciones
 * dejaba medio riel vacío. La navegación móvil sigue viviendo en
 * BarraNavegacion (barra inferior) y aquí no se toca.
 */

import React from 'react';
import { Home, Wallet, CreditCard, Sprout, User } from 'lucide-react';
import { SeccionApp } from '../navigation/BarraNavegacion';
import { formatearCOP } from '../../utils/format';
import { useTema } from '../../utils/theme';

interface ItemRiel {
  id: SeccionApp;
  etiqueta: string;
  corta: string;
  icono: React.ComponentType<{ className?: string }>;
}

const ITEMS: ItemRiel[] = [
  { id: 'inicio', etiqueta: 'Inicio', corta: 'Inicio', icono: Home },
  { id: 'billeteras', etiqueta: 'Billeteras', corta: 'Billet.', icono: Wallet },
  { id: 'deudas', etiqueta: 'Deudas', corta: 'Deudas', icono: CreditCard },
  { id: 'crecer', etiqueta: 'Crecer', corta: 'Crecer', icono: Sprout },
  { id: 'perfil', etiqueta: 'Perfil', corta: 'Perfil', icono: User },
];

interface RielNavegacionProps {
  seccionActiva: SeccionApp;
  onCambiarSeccion: (seccion: SeccionApp) => void;
  usuario: string;
  saldoTotal: number;
}

export const RielNavegacion: React.FC<RielNavegacionProps> = ({
  seccionActiva,
  onCambiarSeccion,
  usuario,
  saldoTotal,
}) => {
  const { esPapel } = useTema();

  // "crecer" queda marcado también mientras estás dentro de uno de sus módulos.
  const esActivo = (id: SeccionApp) =>
    seccionActiva === id || (id === 'crecer' && seccionActiva === 'pro');

  return (
    <aside className="hidden md:flex flex-col items-center flex-none w-[68px] bg-[var(--superficie-2)] border-r border-[var(--linea)] py-4 gap-1">
      <div
        className={`w-8 h-8 rounded-[9px] p-[1px] mb-3.5 ${
          esPapel ? 'bg-[var(--acento)]' : 'bg-platinum-gradient'
        }`}
      >
        <div className="w-full h-full rounded-[8px] bg-[var(--superficie-2)] flex items-center justify-center">
          <span
            className={`font-display font-black text-[15px] leading-none ${
              esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'
            }`}
          >
            B
          </span>
        </div>
      </div>

      {ITEMS.map((item) => {
        const Icono = item.icono;
        const activo = esActivo(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onCambiarSeccion(item.id)}
            aria-current={activo ? 'page' : undefined}
            title={item.etiqueta}
            className={`relative w-[46px] h-11 rounded-[10px] grid place-items-center cursor-pointer transition-colors duration-150 ${
              activo
                ? 'bg-[var(--elevada)] text-[color:var(--acento)]'
                : 'text-[color:var(--texto-3)] hover:text-[color:var(--texto-2)] hover:bg-[var(--superficie)]'
            }`}
          >
            {activo && (
              <span className="absolute -left-[11px] w-[3px] h-[21px] rounded-r-[3px] bg-[var(--acento)]" />
            )}
            <Icono className="w-[18px] h-[18px] -mt-1" />
            <span className="absolute bottom-[3px] text-[7px] tracking-tight leading-none">
              {item.corta}
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <div className="text-center leading-tight mb-2 px-1">
        <span className="block text-[6.5px] font-semibold tracking-[0.1em] text-[color:var(--texto-3)]">
          SALDO
        </span>
        <span className="block font-display font-bold text-[9.5px] tabular-nums text-[color:var(--texto-2)]">
          {formatearCOP(saldoTotal)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onCambiarSeccion('perfil')}
        title={usuario || 'Tu perfil'}
        className="w-[34px] h-[34px] rounded-full bg-[var(--elevada)] border border-[var(--linea)] grid place-items-center font-display font-bold text-[10.5px] text-[color:var(--acento)] cursor-pointer hover:border-[var(--acento)]/50 transition-colors"
      >
        {usuario.slice(0, 2).toUpperCase() || '··'}
      </button>
    </aside>
  );
};
