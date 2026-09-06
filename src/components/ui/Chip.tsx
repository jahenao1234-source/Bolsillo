import React from 'react';

export type VarianteChip = 'aqua' | 'alerta' | 'advertencia' | 'platino' | 'azul' | 'neutro';

interface ChipProps {
  variante?: VarianteChip;
  icono?: React.ReactNode | React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  variante = 'neutro',
  icono,
  children,
  className = '',
}) => {
  const estilosVariante = {
    // Logro / celebración / saldo positivo
    aqua: 'bg-[var(--positivo)]/12 text-[color:var(--positivo)] border-[var(--positivo)]/30',
    // Alerta / mora real / atrasado
    alerta: 'bg-[var(--alerta)]/12 text-[color:var(--alerta)] border-[var(--alerta)]/30',
    // Advertencia / aviso temprano
    advertencia: 'bg-[var(--advertencia)]/12 text-[color:var(--advertencia)] border-[var(--advertencia)]/30',
    // Platino (en medianoche) / Tinta (en papel)
    platino: 'bg-[var(--superficie-2)] text-[color:var(--texto)] border-[var(--linea)] shadow-sm',
    // Interactivo acento plano
    azul: 'bg-[var(--acento)]/12 text-[color:var(--acento)] border-[var(--acento)]/30',
    // Neutro discreto
    neutro: 'bg-[var(--superficie-2)] text-[color:var(--texto-2)] border-[var(--linea)]',
  }[variante];

  const renderIcono = (icon?: React.ReactNode | React.ComponentType<{ className?: string }>) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-3 h-3" />;
    }
    return icon as React.ReactNode;
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        rounded-full text-xs font-medium tracking-tight
        border border-solid whitespace-nowrap select-none
        ${estilosVariante}
        ${className}
      `}
    >
      {icono && <span className="shrink-0 text-current flex items-center">{renderIcono(icono)}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};
