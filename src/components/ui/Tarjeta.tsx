import React from 'react';

interface TarjetaProps extends React.HTMLAttributes<HTMLDivElement> {
  elevada?: boolean;
  bordeInteractivo?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Tarjeta: React.FC<TarjetaProps> = ({
  elevada = false,
  bordeInteractivo = false,
  clickable = false,
  padding = 'md',
  className = '',
  onClick,
  children,
  ...props
}) => {
  const paddingClases = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  const baseBackground = elevada ? 'bg-[var(--elevada)]' : 'bg-[var(--superficie)]';
  const baseBorder = 'border border-[var(--linea)]';

  const interactiveClases = clickable
    ? 'cursor-pointer transition-all duration-200 hover:border-[var(--acento)]/40 hover:bg-[var(--superficie-2)] active:scale-[0.99]'
    : bordeInteractivo
    ? 'transition-colors duration-200 hover:border-[var(--acento)]/30'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl ${baseBackground} ${baseBorder} text-[color:var(--texto)]
        ${paddingClases} ${interactiveClases} ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
