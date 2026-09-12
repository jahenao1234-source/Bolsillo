/**
 * Armar el plan: los diez minutos del principio.
 *
 * Tres partes, en orden: tu mes en limpio, tus deudas y tu plan. No se le pide
 * a nadie que adivine cuánto puede abonar: lo que queda después de lo básico
 * es la plata para salir de deudas. Al final, la promesa con SU número: tu
 * fecha contra la de pagar solo mínimos.
 */

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Deuda, PerfilFlujo } from '../types';
import { RailPasos, Rotulo, Paso } from '../components/sistema/RailPasos';
import { ModalAgregarDeuda } from '../components/deudas/ModalAgregarDeuda';
import { compararConMinimos, deudasActivas, saldoDe } from '../logic/sistema';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE } from '../utils/fechas';

type Parte = 'mes' | 'deudas' | 'plan';

const PARTES: Paso<Parte>[] = [
  { id: 'mes', nombre: 'Tu mes' },
  { id: 'deudas', nombre: 'Tus deudas' },
  { id: 'plan', nombre: 'Tu plan' },
];

interface PantallaPlanListoProps {
  perfil: PerfilFlujo | null;
  deudas: Deuda[];
  onGuardarPerfil: (perfil: { ingresoMensual: number; gastosBasicos: number }) => void;
  onGuardarDeuda: (deuda: Deuda) => void;
  onEliminarDeuda: (id: string) => void;
  onTerminar: () => void;
  /** Solo si ya tenía plan: volver sin cambiar nada. */
  onVolver?: () => void;
}

const leerMonto = (str: string) => parseInt(str.replace(/[^\d]/g, ''), 10) || 0;
const fechaLarga = (corta: string) =>
  corta.replace(/^(\w{3})/, (m) => MESES_NOMBRE.find((n) => n.startsWith(m))?.toLowerCase() ?? m);

export const PantallaPlanListo: React.FC<PantallaPlanListoProps> = ({
  perfil,
  deudas,
  onGuardarPerfil,
  onGuardarDeuda,
  onEliminarDeuda,
  onTerminar,
  onVolver,
}) => {
  const [parte, setParte] = useState<Parte>('mes');
  // Se fija al entrar: guardar el primer paso crea el perfil, y eso no convierte a alguien nuevo en alguien que ya tenía plan.
  const [teniaPlan] = useState(perfil !== null);
  const [ingresoStr, setIngresoStr] = useState(perfil ? formatearCOP(perfil.ingresoMensual) : '');
  const [basicosStr, setBasicosStr] = useState(perfil ? formatearCOP(perfil.gastosBasicos) : '');
  const [modalDeuda, setModalDeuda] = useState<{ abierto: boolean; deuda: Deuda | null }>({ abierto: false, deuda: null });

  const ingreso = leerMonto(ingresoStr);
  const basicos = leerMonto(basicosStr);
  const caja = Math.max(0, ingreso - basicos);

  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const minimos = activas.reduce((a, d) => a + d.pagoMinimo, 0);
  const comparacion = useMemo(() => compararConMinimos(activas, caja), [activas, caja]);

  const campoMonto = (valor: string, cambiar: (v: string) => void, etiqueta: string, ayuda: string) => (
    <label className="block">
      <span className="block text-[13px] font-semibold">{etiqueta}</span>
      <span className="block text-[11.5px] text-texto-3 mt-0.5">{ayuda}</span>
      <input
        inputMode="numeric"
        value={valor}
        onChange={(e) => {
          const n = leerMonto(e.target.value);
          cambiar(n > 0 ? formatearCOP(n) : '');
        }}
        placeholder="$0"
        className="mt-2 w-full px-3.5 py-3 rounded-xl bg-superficie-2 border border-linea font-display font-extrabold text-xl tabular-nums placeholder:text-texto-3 focus:outline-none focus:border-acento"
      />
    </label>
  );

  const botonPrincipal = (texto: string, onClick: () => void, deshabilitado = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      className="w-full py-3 rounded-[13px] bg-accion-gradient text-on-accion font-extrabold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {texto}
    </button>
  );

  const atras = (destino: Parte | null) =>
    destino || (teniaPlan && onVolver) ? (
      <button
        type="button"
        onClick={() => (destino ? setParte(destino) : onVolver?.())}
        className="inline-flex items-center gap-1.5 text-xs text-texto-3 hover:text-texto-2 cursor-pointer self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {destino ? 'Atrás' : 'Volver a mi plan'}
      </button>
    ) : null;

  return (
    <div className="min-h-[calc(100vh-40px)] flex items-start md:items-center justify-center py-4">
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="font-display font-extrabold text-base">Bolsillo</span>
          <span className="text-[11px] text-texto-3">Tu plan en 10 minutos</span>
        </div>
        <RailPasos pasos={PARTES} actual={parte} />

        {/* ---------- Tu mes ---------- */}
        {parte === 'mes' && (
          <>
            {atras(null)}
            <div>
              <h1 className="font-display font-extrabold text-[28px] leading-tight tracking-tight">Tu mes, en limpio</h1>
              <p className="text-sm text-texto-2 mt-1.5 leading-relaxed">
                Dos cifras. Con eso sabemos cuánto tienes para salir de deudas, sin adivinar.
              </p>
            </div>
            {campoMonto(ingresoStr, setIngresoStr, 'Lo que te entra al mes', 'Sueldo, ventas, lo que llega de verdad.')}
            {campoMonto(basicosStr, setBasicosStr, 'Lo básico', 'Arriendo, mercado, servicios y transporte para trabajar.')}
            <div className="flex items-baseline justify-between p-3.5 rounded-2xl border border-linea bg-superficie">
              <span className="text-[13px] font-bold">Para salir de deudas</span>
              <span className={`font-display font-extrabold text-xl tabular-nums ${caja > 0 ? 'text-acento' : 'text-texto-3'}`}>
                {formatearCOP(caja)}
              </span>
            </div>
            {ingreso > 0 && basicos >= ingreso && (
              <p className="text-xs text-alerta -mt-2">Lo básico se come todo lo que entra. Revisa las dos cifras: sin margen no hay plan posible.</p>
            )}
            {botonPrincipal('Seguir', () => {
              onGuardarPerfil({ ingresoMensual: ingreso, gastosBasicos: basicos });
              setParte('deudas');
            }, ingreso <= 0 || caja <= 0)}
          </>
        )}

        {/* ---------- Tus deudas ---------- */}
        {parte === 'deudas' && (
          <>
            {atras('mes')}
            <div>
              <h1 className="font-display font-extrabold text-[28px] leading-tight tracking-tight">Lo que debes</h1>
              <p className="text-sm text-texto-2 mt-1.5 leading-relaxed">
                Todas: tarjetas, créditos, el fiado y el gota a gota. Con el saldo y el pago mínimo basta; la tasa sale en el extracto.
              </p>
            </div>

            <div className="rounded-2xl border border-linea bg-superficie">
              {activas.length === 0 && <p className="text-xs text-texto-3 px-3.5 py-4">Todavía no has anotado ninguna deuda.</p>}
              {activas.map((d, i) => (
                <div key={d.id} className={`flex items-center justify-between gap-2 px-3.5 py-2.5 ${i ? 'border-t border-hairline' : ''}`}>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{d.nombre}</span>
                    <span className="block text-[10.5px] text-texto-3 tabular-nums">
                      Debes {formatearCOP(saldoDe(d))} · mínimo {formatearCOP(d.pagoMinimo)}
                    </span>
                  </span>
                  <span className="flex gap-1 flex-none">
                    <button type="button" aria-label={`Editar ${d.nombre}`} onClick={() => setModalDeuda({ abierto: true, deuda: d })} className="p-2 text-texto-3 hover:text-texto cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" aria-label={`Quitar ${d.nombre}`} onClick={() => onEliminarDeuda(d.id)} className="p-2 text-texto-3 hover:text-alerta cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setModalDeuda({ abierto: true, deuda: null })}
                className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-hairline text-xs font-bold text-acento cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar una deuda
              </button>
            </div>

            {activas.length > 0 && (
              <div className="text-[12.5px] flex flex-col gap-1.5">
                <div className="flex justify-between"><span className="text-texto-2">Suma de mínimos</span><span className="font-bold tabular-nums">{formatearCOP(minimos)}</span></div>
                <div className="flex justify-between"><span className="text-texto-2">Para salir de deudas</span><span className="font-bold tabular-nums">{formatearCOP(caja)}</span></div>
                {caja < minimos ? (
                  <p className="text-xs text-alerta mt-1">
                    No alcanza para los mínimos: faltan {formatearCOP(minimos - caja)}. Así la deuda crece. Revisa lo básico o busca ese margen antes de seguir.
                  </p>
                ) : (
                  <div className="flex justify-between pt-1.5 border-t border-hairline">
                    <span className="font-bold">Para atacar, encima de los mínimos</span>
                    <span className="font-bold text-accion tabular-nums">{formatearCOP(caja - minimos)}</span>
                  </div>
                )}
              </div>
            )}

            {botonPrincipal('Ver mi plan', () => setParte('plan'), activas.length === 0)}
          </>
        )}

        {/* ---------- Tu plan ---------- */}
        {parte === 'plan' && (
          <>
            {atras('deudas')}
            <div>
              <Rotulo>Tu fecha de libertad</Rotulo>
              {comparacion.plan.viable ? (
                <div className="mt-3 flex flex-col gap-3">
                  {comparacion.minimos.viable && (
                    <div>
                      <div className="flex justify-between text-[12.5px] text-texto-2">
                        <span>Pagando solo mínimos</span>
                        <span className="tabular-nums">{fechaLarga(comparacion.minimos.fecha)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-1.5">
                        <div className="h-full w-full rounded-full bg-texto-3" />
                      </div>
                      <p className="text-[10.5px] text-texto-3 mt-1 tabular-nums">{comparacion.minimos.meses} meses</p>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between text-[12.5px] font-bold">
                      <span>Con tu plan</span>
                      <span className="text-acento tabular-nums">{fechaLarga(comparacion.plan.fecha)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-superficie-2 overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full bg-acento"
                        style={{
                          width: `${comparacion.minimos.viable ? Math.max(4, (comparacion.plan.meses / comparacion.minimos.meses) * 100) : 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10.5px] text-texto-3 mt-1 tabular-nums">{comparacion.plan.meses} meses</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-alerta mt-2">
                  Con {formatearCOP(caja)} al mes el interés le gana a los pagos y la deuda no baja. Necesitas más margen: vuelve a tu mes.
                </p>
              )}
            </div>

            {comparacion.plan.viable && (
              <div className="pt-4 border-t border-hairline">
                {!comparacion.minimos.viable ? (
                  <>
                    <p className="font-display font-extrabold text-[26px] leading-tight">Sales en {comparacion.plan.meses} meses.</p>
                    <p className="text-sm text-texto-2 mt-1">Pagando solo mínimos no saldrías nunca: el interés se come el pago.</p>
                  </>
                ) : comparacion.mesesGanados > 0 ? (
                  <>
                    <p className="font-display font-extrabold text-[26px] leading-tight tabular-nums">
                      {comparacion.mesesGanados} {comparacion.mesesGanados === 1 ? 'mes' : 'meses'} antes
                    </p>
                    <p className="text-sm text-texto-2 mt-1 tabular-nums">
                      y <b className="text-texto">{formatearCOP(comparacion.interesesAhorrados)}</b> menos de intereses al banco.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display font-extrabold text-[26px] leading-tight">Sales en {comparacion.plan.meses} meses.</p>
                    <p className="text-sm text-texto-2 mt-1">
                      Tus mínimos ya cubren casi todo. El plan te da el orden y la fecha; cualquier peso extra la acerca.
                    </p>
                  </>
                )}
              </div>
            )}

            {botonPrincipal(teniaPlan ? 'Guardar y volver a mi plan' : 'Empezar mi plan', onTerminar, !comparacion.plan.viable)}
          </>
        )}
      </div>

      <ModalAgregarDeuda
        abierto={modalDeuda.abierto}
        deudaAEditar={modalDeuda.deuda}
        onCerrar={() => setModalDeuda({ abierto: false, deuda: null })}
        onGuardar={onGuardarDeuda}
      />
    </div>
  );
};
