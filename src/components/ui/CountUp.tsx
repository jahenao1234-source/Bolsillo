import React, { useEffect, useState } from 'react';
import { formatearCOP } from '../../utils/format';

interface CountUpProps {
  valor: number;
  duracion?: number; // ms
  formateador?: (val: number) => string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  valor,
  duracion = 850,
  formateador = formatearCOP,
  className = '',
}) => {
  const [actual, setActual] = useState(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return valor;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      setActual(valor);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setActual(valor);
      return;
    }

    let inicio: number | null = null;
    let animId: number;
    const valorInicial = 0;
    const delta = valor - valorInicial;

    const paso = (timestamp: number) => {
      if (!inicio) inicio = timestamp;
      const progreso = Math.min(1, (timestamp - inicio) / duracion);
      // Easing out cubic: 1 - pow(1 - x, 3)
      const eased = 1 - Math.pow(1 - progreso, 3);
      setActual(Math.round(valorInicial + delta * eased));

      if (progreso < 1) {
        animId = requestAnimationFrame(paso);
      } else {
        setActual(valor);
      }
    };

    animId = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(animId);
  }, [valor, duracion]);

  return <span className={`tabular-nums ${className}`}>{formateador(actual)}</span>;
};
