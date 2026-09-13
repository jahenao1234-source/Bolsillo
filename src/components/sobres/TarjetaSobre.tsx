import React from 'react';
import { Chip } from '../ui/Chip';

export interface TarjetaSobreProps {
  color: string;
  nombre: string;
  chip?: React.ReactNode;
  derecha: React.ReactNode;
  linea?: React.ReactNode;
  progreso: number;
  marcaHito?: number;
  pie?: string;
  puente?: { texto: string; onClick: (e: React.MouseEvent) => void };
  cuenta?: { texto: string; onAbonar: (e: React.MouseEvent) => void };
  variante: 'completa' | 'mini';
  onClick?: () => void;
}

export const TarjetaSobre: React.FC<TarjetaSobreProps> = ({
  color,
  nombre,
  chip,
  derecha,
  linea,
  progreso,
  marcaHito,
  pie,
  puente,
  cuenta,
  variante,
  onClick,
}) => {
  if (variante === 'mini') {
    return (
      <div 
        className="rounded-2xl border border-[var(--linea)] bg-[var(--superficie)] px-[13px] py-3 flex flex-col gap-1.5 cursor-pointer hover:border-[var(--texto-3)] transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="text-[12.5px] font-bold text-[color:var(--texto)] truncate">{nombre}</div>
        </div>
        <div className="text-[15px] font-bold text-[color:var(--texto)]">
          {derecha}
        </div>
        {linea && (
          <div className="text-[11.5px] text-[color:var(--texto-3)]">
            {linea}
          </div>
        )}
        <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden relative mt-1">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progreso)}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-[18px] border bg-[var(--superficie)] px-[18px] py-[17px] flex flex-col gap-[11px] cursor-pointer hover:border-[color:var(--texto-3)] transition-colors"
      style={{ borderColor: puente ? `color-mix(in srgb, ${color} 38%, var(--linea))` : 'var(--linea)' }}
      onClick={onClick}
    >
      <div className="flex justify-between items-baseline gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="font-bold text-[14.5px] text-[color:var(--texto)]">{nombre}</div>
          {chip}
        </div>
        <div className="text-right">
          {derecha}
        </div>
      </div>

      {linea && (
        <div className="text-[12.5px] text-[color:var(--texto-3)] -mt-[5px]">
          {linea}
        </div>
      )}

      <div className="h-1.5 rounded-full bg-[var(--superficie-2)] overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progreso)}%`, backgroundColor: color }} />
        {marcaHito !== undefined && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-[10px] bg-[var(--texto-2)] rounded-full z-10" 
            style={{ left: `${marcaHito}%`, transform: 'translate(-50%, -50%)' }} 
          />
        )}
      </div>

      {cuenta && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-[12px] text-[color:var(--texto-3)]">{cuenta.texto}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cuenta.onAbonar(e);
            }}
            className="text-[12.5px] font-bold cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0"
            style={{ color: color }}
          >
            + Abonar
          </button>
        </div>
      )}

      {puente ? (
        <button
          type="button"
          onClick={puente.onClick}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold mt-1 cursor-pointer transition-colors"
          style={{
            color: color,
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
          }}
        >
          {puente.texto} →
        </button>
      ) : pie ? (
        <div className="text-center text-[12px] text-[color:var(--texto-3)] pt-2">
          {pie}
        </div>
      ) : null}
    </div>
  );
};
