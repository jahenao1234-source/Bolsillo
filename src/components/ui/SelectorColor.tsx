import React from 'react';

interface SelectorColorProps {
  valor: string;
  onChange: (color: string) => void;
  colores?: string[];
  label?: string;
}

/** Paleta reutilizable alineada al sistema Teal + Naranja. */
export const COLORES_COMPONENTE = ['#5FE0A8', '#25C9BE', '#FF7A3D', '#8AA9FF', '#F2C879', '#E89385'];

export const SelectorColor: React.FC<SelectorColorProps> = ({
  valor,
  onChange,
  colores = COLORES_COMPONENTE,
  label = 'Color',
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--texto-2)] block">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {colores.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
            style={{
              background: c,
              outline: valor === c ? '2px solid var(--texto)' : '2px solid transparent',
              outlineOffset: '2px',
            }}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
    </div>
  );
};
