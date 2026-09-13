/**
 * Pro · Inicio: blindar y crecer con el mismo traspaso.
 *
 * La plata que antes iba a deudas queda libre y se reparte en tres: gustos
 * (para que el sistema aguante), colchón e inversión. Primero se llena el
 * colchón de $1.000.000; cuando se llena, su parte pasa a inversión.
 */

import React, { useMemo, useState } from 'react';
import { Check, FolderLock, Wrench } from 'lucide-react';
import type { Deuda, Sobre, PerfilFlujo } from '../types';
import { Marco, Columna, Zona } from '../components/layout/Marco';
import { BarraTitulo } from '../components/layout/shell';
import { FASES, RailPasos, Rotulo } from '../components/sistema/RailPasos';
import {
  deudasActivas,
  faseActual,
  fechaColchonCompleto,
  ID_SOBRE_COLCHON,
  ID_SOBRE_INVERSION,
  metaFondoBlindado,
  repartoPro,
  movidoEsteMes,
  fechaAporteEsteMes,
} from '../logic/sistema';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE } from '../utils/fechas';

interface PantallaProInicioProps {
  deudas: Deuda[];
  sobres: Sobre[];
  disponibleMensual: number;
  perfil: PerfilFlujo | null;
  onAportarASobre: (id: string, nombre: string, monto: number, meta?: number, color?: string) => void;
  onMoverAporte: (sobreId: string, monto: number) => boolean;
  onIrA: (destino: 'sobres' | 'herramientas' | 'plan') => void;
}

export const PantallaProInicio: React.FC<PantallaProInicioProps> = ({
  deudas,
  sobres,
  disponibleMensual,
  perfil,
  onAportarASobre,
  onMoverAporte,
  onIrA,
}) => {
  const [movido, setMovido] = useState<string | null>(null);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const metaFondo = perfil ? metaFondoBlindado(perfil.gastosBasicos) : 0;
  const fase = faseActual(deudas, sobres, perfil?.gastosBasicos ?? 0);
  const colchon = sobres.find((s) => s.id === ID_SOBRE_COLCHON);
  const inversion = sobres.find((s) => s.id === ID_SOBRE_INVERSION);
  const apartadoColchon = colchon?.apartado ?? 0;



  // Mientras haya deudas, toda la plata del mes va al plan: aquí no hay libre que repartir.
  const libre = activas.length > 0 ? 0 : disponibleMensual;
  const reparto = repartoPro(libre, apartadoColchon, metaFondo);
  const mesNombre = MESES_NOMBRE[new Date().getMonth()].toLowerCase();
  const progreso = Math.min(100, (apartadoColchon / metaFondo) * 100);

  const mover = (id: string, nombre: string, monto: number, meta?: number, color?: string) => {
    if (monto <= 0) return;
    const exito = onMoverAporte(id, monto);
    if (exito) {
      setMovido(`Listo: ${formatearCOP(monto)} apartados en tu ${nombre.toLowerCase()}.`);
      window.setTimeout(() => setMovido(null), 3000);
    }
  };

  const accion =
    fase === 'blindar'
      ? { 
          texto: `Mover ${formatearCOP(reparto.colchon)} al fondo blindado`, 
          hacer: () => mover(ID_SOBRE_COLCHON, 'Fondo blindado', reparto.colchon, metaFondo, '#25C9BE'),
          movido: colchon ? movidoEsteMes(colchon, new Date()) : 0,
          monto: reparto.colchon,
          fecha: colchon ? fechaAporteEsteMes(colchon, new Date()) : null,
        }
      : { 
          texto: `Mover ${formatearCOP(reparto.inversion)} a inversión`, 
          hacer: () => mover(ID_SOBRE_INVERSION, 'Inversión', reparto.inversion, undefined, '#5FE0A8'),
          movido: inversion ? movidoEsteMes(inversion, new Date()) : 0,
          monto: reparto.inversion,
          fecha: inversion ? fechaAporteEsteMes(inversion, new Date()) : null,
        };

  return (
    <div className="w-full pb-24 xl:pb-0 xl:flex-1 xl:flex xl:flex-col">
      <BarraTitulo>
        <span className="font-display font-extrabold text-[15px]">Bolsillo <span className="text-acento">Pro</span></span>
        <RailPasos pasos={FASES} actual={fase} className="w-[330px] ml-3" />
      </BarraTitulo>

      <Marco columnas="380px minmax(0,1fr)">
        <Columna ordenMovil={1} borde>
          <Zona crece plana className="flex flex-col gap-4">
            <RailPasos pasos={FASES} actual={fase} className="xl:hidden" />

            {activas.length > 0 && (
              <div className="p-3.5 rounded-2xl border border-accion/40 bg-accion/5">
                <p className="text-[13px] font-bold">Primero, tus deudas.</p>
                <p className="text-xs text-texto-2 mt-1 leading-relaxed">
                  Tienes {activas.length} {activas.length === 1 ? 'deuda activa' : 'deudas activas'}: toda la plata del mes va al plan.
                  El colchón empieza cuando la última llegue a $0. Mientras tanto, tus sobres y herramientas ya están abiertos.
                </p>
                <button type="button" onClick={() => onIrA('plan')} className="mt-2.5 text-xs font-bold text-accion cursor-pointer">
                  Ir a mi plan de deudas →
                </button>
              </div>
            )}

            {fase !== 'crecer' ? (
              <div>
                <Rotulo>Tu fondo blindado</Rotulo>
                <p className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-[34px] leading-none tabular-nums">{formatearCOP(apartadoColchon)}</span>
                  <span className="text-[13px] text-texto-3 tabular-nums">de {formatearCOP(metaFondo)}</span>
                </p>
                <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-2.5">
                  <div className="h-full rounded-full bg-acento" style={{ width: `${progreso}%` }} />
                </div>
                <p className="text-xs text-texto-2 mt-2">
                  {reparto.colchon > 0 ? `Completo en ${fechaColchonCompleto(apartadoColchon, reparto.colchon, metaFondo).toLowerCase()}.` : 'Para que la próxima emergencia no sea tarjeta.'}
                </p>
              </div>
            ) : (
              <div>
                <Rotulo>Tu inversión</Rotulo>
                <p className="font-display font-extrabold text-[34px] leading-none tabular-nums mt-1.5">{formatearCOP(inversion?.apartado ?? 0)}</p>
                <p className="text-xs text-texto-2 mt-2">
                  Colchón completo <Check className="inline w-3.5 h-3.5 text-positivo -mt-0.5" /> · ahora todo el ahorro va a crecer.
                </p>
              </div>
            )}

            {libre > 0 && accion.monto > 0 && accion.movido === 0 && !movido && (
              <button type="button" onClick={accion.hacer} className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer mt-4">
                {accion.texto}
              </button>
            )}
            {(accion.movido > 0 || movido) && libre > 0 && (
              <p role="status" className="text-sm font-semibold text-positivo text-center mt-4">
                {movido || `Movido el ${accion.fecha?.getDate()} ✓`}
              </p>
            )}
          </Zona>
        </Columna>

        <Columna ordenMovil={2}>
          {libre > 0 && (
            <Zona plana className="max-xl:mt-4">
              <Rotulo>Tus {formatearCOP(libre)} de {mesNombre}</Rotulo>
              <div className="mt-2 rounded-2xl border border-linea bg-superficie">
                {[
                  { nombre: 'Fondo blindado', desc: 'Para que la próxima emergencia no sea tarjeta', monto: reparto.colchon, color: 'text-acento', primero: fase === 'blindar' },
                  { nombre: 'Inversión', desc: 'CDT o fondo que tú abras', monto: reparto.inversion, color: 'text-texto', primero: fase === 'crecer' },
                  { nombre: 'Gustos', desc: 'Sin culpa y sin deuda', monto: reparto.gustos, color: 'text-texto', primero: false },
                ].map((fila, i) => (
                  <div key={fila.nombre} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${i ? 'border-t border-hairline' : ''}`}>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                        {fila.nombre}
                        {fila.primero && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded-full border border-acento/45 text-acento">Primero</span>
                        )}
                      </span>
                      <span className="block text-[10.5px] text-texto-3">{fila.desc}</span>
                    </span>
                    <span className={`font-bold text-[13px] tabular-nums ${fila.color}`}>{formatearCOP(fila.monto)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3.5 py-2.5 border-t border-hairline text-[13px] font-bold">
                  <span>Asignado</span>
                  <span className="tabular-nums">{formatearCOP(reparto.total)}</span>
                </div>
              </div>
              {fase === 'blindar' && (
                <p className="text-xs text-texto-2 mt-2.5 leading-relaxed">
                  Cuando el fondo blindado llegue a {formatearCOP(metaFondo)}, <b className="text-texto">su parte pasa a inversión</b>:{' '}
                  {formatearCOP(reparto.colchon + reparto.inversion)} al mes para crecer.
                </p>
              )}
            </Zona>
          )}

          <Zona crece plana className="max-xl:mt-4">
            <Rotulo className="mb-2">Tus herramientas</Rotulo>
            <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2.5">
              <button type="button" onClick={() => onIrA('sobres')} className="text-left p-3.5 rounded-2xl border border-linea bg-superficie hover:border-texto-3 cursor-pointer">
                <FolderLock className="w-4 h-4 text-acento" />
                <p className="text-[13px] font-bold mt-2">Sobres</p>
                <p className="text-[11px] text-texto-3 mt-0.5">Aparta plata para metas propias.</p>
              </button>
              <button type="button" onClick={() => onIrA('herramientas')} className="text-left p-3.5 rounded-2xl border border-linea bg-superficie hover:border-texto-3 cursor-pointer">
                <Wrench className="w-4 h-4 text-acento" />
                <p className="text-[13px] font-bold mt-2">Más herramientas</p>
                <p className="text-[11px] text-texto-3 mt-0.5">Presupuesto, retos, suscripciones, tarjetas y reportes.</p>
              </button>
            </div>
          </Zona>
        </Columna>
      </Marco>
    </div>
  );
};
