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
        className="rounded-[14px] border border-[var(--linea)] bg-[var(--superficie)] px-[11px] py-2.5 flex flex-col gap-[5px] cursor-pointer hover:border-[var(--texto-3)] transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="text-[11.5px] font-bold text-[color:var(--texto)] tracking-[-0.01em] whitespace-nowrap">{nombre}</div>
        </div>
        <div className="font-display font-extrabold text-[14px] text-[color:var(--texto)]">
          {derecha}
        </div>
        {linea && (
          <div className="text-[11.5px] text-[color:var(--texto-3)]">
            {linea}
          </div>
        )}
        <div className="h-[7px] rounded-full bg-[var(--superficie-2)] overflow-hidden relative mt-1">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, progreso)}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="@container rounded-[14px] border border-[var(--linea)] bg-[var(--superficie)] px-4 py-3.5 gap-[9px] md:px-5 md:py-[18px] md:gap-[11px] flex flex-col cursor-pointer hover:border-[color:var(--texto-3)] transition-colors"
      onClick={onClick}
    >
      {/* Nombre y cifra se achican con la tarjeta (cqw): en 4 columnas a 1280 px no caben a 17 y 19 px. */}
      <div className="flex justify-between items-baseline gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div className="font-bold text-[clamp(14px,6.2cqw,17px)] text-[color:var(--texto)] truncate">{nombre}</div>
          {chip}
        </div>
        <div className="text-right whitespace-nowrap">
          {derecha}
        </div>
      </div>

      {linea && (
        <div className="text-[14px] text-[color:var(--texto-3)] -mt-[5px]">
          {linea}
        </div>
      )}

      <div className="h-[7px] rounded-full bg-[var(--superficie-2)] overflow-hidden relative">
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
          <span className="text-[13.5px] text-[color:var(--texto-3)]">{cuenta.texto}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cuenta.onAbonar(e);
            }}
            className="text-[13.5px] text-[color:var(--acento)] font-bold cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-none p-0"
          >
            + Abonar
          </button>
        </div>
      )}

      {puente ? (
        <button
          type="button"
          onClick={puente.onClick}
          className="w-full py-2.5 rounded-[10px] border border-[var(--linea)] bg-[var(--superficie-2)] text-[color:var(--texto)] text-[14px] font-bold mt-1 cursor-pointer hover:bg-[var(--elevada)] transition-colors"
        >
          {puente.texto} →
        </button>
      ) : pie ? (
        <div className="text-center text-[13.5px] text-[color:var(--texto-3)] pt-2">
          {pie}
        </div>
      ) : null}
    </div>
  );
};
