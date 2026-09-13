import React from 'react';

export type VarianteBoton = 'platino' | 'primario' | 'secundario' | 'fantasma' | 'alerta';
export type TamanoBoton = 'sm' | 'md' | 'lg';

interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  icono?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconoDerecha?: React.ReactNode | React.ComponentType<{ className?: string }>;
  anchoCompleto?: boolean;
  children: React.ReactNode;
}

export const Boton: React.FC<BotonProps> = ({
  variante = 'platino',
  tamano = 'md',
  icono,
  iconoDerecha,
  anchoCompleto = false,
  className = '',
  disabled = false,
  children,
  ...props
}) => {
  // Dimensiones siguiendo la regla matemática: padding horizontal = 2x vertical (mínimo 44px de toque en md/lg)
  const clasesTamano = {
    sm: 'py-2 px-4 text-xs gap-1.5 rounded-xl min-h-[38px]',
    md: 'py-2.5 px-5 text-sm gap-2 rounded-xl min-h-[44px]',
    lg: 'py-3.5 px-7 text-base gap-2.5 rounded-xl min-h-[48px]',
  }[tamano];

  // Variantes con tokens semánticos compartidos
  const clasesVariante = {
    platino: `
      btn-accion bg-accion-gradient
      text-[color:var(--on-boton-principal)] font-bold tracking-tight
      shadow-[var(--sombra-boton)]
      hover:opacity-95 active:scale-[0.98]
    `,
    primario: `
      bg-[var(--boton-principal)] text-[color:var(--on-boton-principal)] font-bold tracking-tight
      shadow-[var(--sombra-boton)]
      hover:opacity-90 active:scale-[0.98]
    `,
    secundario: `
      bg-[var(--superficie-2)] text-[color:var(--texto)] font-medium
      border border-[var(--linea)]
      hover:bg-[var(--elevada)] hover:border-[var(--linea)]
      active:scale-[0.98]
    `,
    fantasma: `
      bg-transparent text-[color:var(--texto-2)] font-medium
      hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)]
      active:scale-[0.98]
    `,
    alerta: `
      bg-[var(--alerta)]/12 text-[color:var(--alerta)] font-medium
      border border-[var(--alerta)]/25
      hover:bg-[var(--alerta)]/20
      active:scale-[0.98]
    `,
  }[variante];

  const renderIcono = (icon?: React.ReactNode | React.ComponentType<{ className?: string }>) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      const tamanoClase = tamano === 'sm' ? 'w-3.5 h-3.5' : tamano === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
      return <IconComponent className={tamanoClase} />;
    }
    return icon as React.ReactNode;
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center
        transition-all duration-150 cursor-pointer
        select-none whitespace-nowrap outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--acento)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--base)]
        active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${clasesTamano}
        ${clasesVariante}
        ${anchoCompleto ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {icono && <span className="shrink-0 flex items-center">{renderIcono(icono)}</span>}
      <span className="truncate">{children}</span>
      {iconoDerecha && <span className="shrink-0 flex items-center">{renderIcono(iconoDerecha)}</span>}
    </button>
  );
};
