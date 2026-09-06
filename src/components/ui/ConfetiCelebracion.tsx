import React, { useEffect, useRef } from 'react';

interface ConfetiCelebracionProps {
  activo: boolean;
  onTerminar?: () => void;
  mensaje?: string;
}

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRotation: number;
  alpha: number;
}

export const ConfetiCelebracion: React.FC<ConfetiCelebracionProps> = ({
  activo,
  onTerminar,
  mensaje = '¡Deuda saldada! Un paso más cerca de tu libertad',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!activo) return;

    // Vibración corta háptica en dispositivos móviles
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([35, 50, 35]);
      } catch {
        // Ignorar si el navegador bloquea vibración sin interacción directa
      }
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Si el usuario prefiere reducir movimiento, solo mostramos el aviso sin partículas
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        if (onTerminar) onTerminar();
      }, 2500);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const isPapel = document.documentElement.getAttribute('data-theme') === 'papel';
    // Colores discretos según tema
    const colores = isPapel
      ? ['#0C8C7E', '#0E9E77', '#EC6A28', '#8AA9FF', '#12A897']
      : ['#25C9BE', '#5FE0A8', '#FF7A3D', '#8AA9FF', '#EAF6F4'];

    const particulas: Particula[] = [];
    const cantidad = 50; // Moderado, no infantil

    for (let i = 0; i < cantidad; i++) {
      particulas.push({
        x: canvas.width * (0.4 + Math.random() * 0.2),
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 4,
        size: Math.random() * 5 + 3,
        color: colores[Math.floor(Math.random() * colores.length)],
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 8,
        alpha: 1,
      });
    }

    let animId: number;
    let frame = 0;

    const animar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      let vivas = 0;
      for (const p of particulas) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravedad suave
        p.vx *= 0.98; // Resistencia
        p.rotation += p.vRotation;
        p.alpha -= 0.012;

        if (p.alpha > 0 && p.y < canvas.height) {
          vivas++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (vivas > 0 && frame < 110) {
        animId = requestAnimationFrame(animar);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onTerminar) onTerminar();
      }
    };

    animId = requestAnimationFrame(animar);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activo, onTerminar]);

  if (!activo) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Banner flotante sobrio con animación spring sutil */}
      <div className="relative bg-[var(--superficie)] border border-[var(--positivo)]/60 shadow-2xl px-5 py-3.5 rounded-2xl flex items-center gap-3.5 backdrop-blur-md transition-all animate-[spring_0.5s_ease-out]">
        <div className="w-8 h-8 rounded-xl bg-[var(--positivo)] text-[color:var(--on-acento)] flex items-center justify-center font-bold text-base shadow-sm shrink-0">
          ✓
        </div>
        <div>
          <h4 className="font-display font-semibold text-sm text-[color:var(--positivo)] tracking-tight">
            ¡Meta cumplida!
          </h4>
          <p className="text-xs text-[color:var(--texto)] opacity-90 leading-tight mt-0.5">{mensaje}</p>
        </div>
      </div>
    </div>
  );
};
