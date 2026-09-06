import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Boton, VarianteBoton } from './Boton';

interface EstadoVacioProps {
  icono: LucideIcon | React.ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
  textoBoton?: string;
  onAccion?: () => void;
  varianteBoton?: VarianteBoton;
  className?: string;
}

export const EstadoVacio: React.FC<EstadoVacioProps> = ({
  icono: Icono,
  titulo,
  descripcion,
  textoBoton,
  onAccion,
  varianteBoton = 'platino',
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl p-8 sm:p-10 text-center border border-[var(--linea)] bg-[var(--superficie-2)] flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] flex items-center justify-center text-[color:var(--acento)] mb-4 shadow-sm">
        <Icono className="w-6 h-6" />
      </div>

      <h3 className="font-display font-semibold text-base sm:text-lg text-[color:var(--texto)] tracking-tight mb-1.5">
        {titulo}
      </h3>

      <p className="text-xs sm:text-sm text-[color:var(--texto-2)] max-w-sm leading-relaxed mb-5">
        {descripcion}
      </p>

      {textoBoton && onAccion && (
        <Boton
          variante={varianteBoton}
          tamano="md"
          onClick={onAccion}
        >
          {textoBoton}
        </Boton>
      )}
    </div>
  );
};
