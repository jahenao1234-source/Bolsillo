/**
 * Bolsillo v3 — un solo sistema, guiado.
 *
 * La app responde siempre tres cosas: en qué fase está la persona (salir de
 * deudas · blindar · crecer), qué hace este mes y a dónde se va su plata cuando
 * algo se completa. La navegación sigue a la fase; los momentos (una deuda en
 * $0, la última en $0) enseñan el traspaso en el instante en que ocurre.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBolsilloData } from './hooks/useBolsilloData';
import {
  BarraInferior,
  ConmutadorModo,
  INICIO_POR_MODO,
  ITEMS_POR_MODO,
  ModoApp,
  RielLateral,
  SeccionApp,
} from './components/navigation/Navegacion';
import { ProveedorShell } from './components/layout/shell';
import { MomentoGraduacion, MomentoTraspaso } from './components/sistema/Momentos';
import { PantallaMiPlan } from './screens/PantallaMiPlan';
import { PantallaDeudas } from './screens/PantallaDeudas';
import { PantallaBilletera } from './screens/PantallaBilletera';
import { PantallaPlanListo } from './screens/PantallaPlanListo';
import { PantallaProInicio } from './screens/PantallaProInicio';
import { PantallaSobresBaseCero } from './screens/PantallaSobresBaseCero';
import { PantallaCrecer } from './screens/PantallaCrecer';
import { PantallaPerfil } from './screens/PantallaPerfil';
import { PantallaPro } from './screens/PantallaPro';
import { PantallaTermometro } from './screens/PantallaTermometro';
import { PantallaActivarCodigo } from './screens/PantallaActivarCodigo';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { inicializarTema } from './utils/theme';
import { getContextoMes, ingresoDelMes } from './logic/resumenMes';
import { deudasActivas, escaleraAtaque, type Escalon, gastoDeLaSemana, techoSemanal } from './logic/sistema';
import { HojaGastoRapido } from './components/sistema/HojaGastoRapido';
import type { Deuda } from './types';

type Momento =
  | { tipo: 'traspaso'; deuda: Deuda; siguiente: Escalon | null; minimoSiguiente: number; saldadas: number; total: number }
  | { tipo: 'graduacion'; totalPagado: number; libre: number };

/** Secciones que existen en los dos modos. */
const GLOBALES: SeccionApp[] = ['perfil', 'pro', 'activar_codigo', 'plan_listo'];

export default function App() {
  useEffect(() => {
    inicializarTema();
  }, []);

  const datos = useBolsilloData();
  const {
    resumen,
    billeteras,
    saldoTotal,
    deudas,
    movimientos,
    disponibleMensual,
    nivelAcceso,
    perfilFlujo,
  } = datos;

  const esPro = nivelAcceso === 'pro';
  const activas = useMemo(() => deudasActivas(deudas), [deudas]);

  // ---------- Modo: lo decide la fase; el conmutador solo si conviven deudas y Pro ----------
  const [modoElegido, setModoElegido] = useState<ModoApp>('deuda');
  const hibrido = esPro && activas.length > 0;
  const modo: ModoApp = !esPro ? 'deuda' : activas.length === 0 ? 'pro' : modoElegido;

  const [seccion, setSeccion] = useState<SeccionApp>(INICIO_POR_MODO[modo]);
  const [momento, setMomento] = useState<Momento | null>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);

  // Sin su mes configurado no hay plan que enseñar: se fija la sección en el armado
  // del plan, para que guardar el primer paso no la saque de ahí a la mitad.
  useEffect(() => {
    if (!perfilFlujo && nivelAcceso !== 'demo') {
      setSeccion('plan_listo');
    } else {
      datos.asegurarSobresSistema(perfilFlujo);
    }
  }, [perfilFlujo, nivelAcceso]);

  // Si la sección no existe en el modo actual, vuelve al inicio de ese modo.
  useEffect(() => {
    const valida = GLOBALES.includes(seccion) || ITEMS_POR_MODO[modo].some((i) => i.id === seccion);
    if (!valida) setSeccion(INICIO_POR_MODO[modo]);
  }, [modo, seccion]);

  const navegar = (destino: SeccionApp) => {
    if (destino === 'pro_inicio' || destino === 'sobres' || destino === 'herramientas') setModoElegido('pro');
    if (destino === 'plan' || destino === 'deudas') setModoElegido('deuda');
    setSeccion(destino);
    contenidoRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  };

  const cambiarModo = (m: ModoApp) => {
    setModoElegido(m);
    setSeccion(INICIO_POR_MODO[m]);
  };

  // ---------- Momentos: se evalúan contra las deudas de ANTES del pago ----------
  const evaluarMomento = (deudaId: string, antes: Deuda[]) => {
    const restantes = antes.filter((d) => d.id !== deudaId);
    const deuda = antes.find((d) => d.id === deudaId);
    if (!deuda) return;

    if (restantes.length === 0) {
      setMomento({
        tipo: 'graduacion',
        totalPagado: deudas.reduce((a, d) => a + (d.montoOriginal ?? 0), 0),
        libre: disponibleMensual,
      });
      return;
    }

    const siguiente = escaleraAtaque(restantes, disponibleMensual)[0] ?? null;
    setMomento({
      tipo: 'traspaso',
      deuda,
      siguiente,
      minimoSiguiente: restantes.find((d) => d.id === siguiente?.deudaId)?.pagoMinimo ?? 0,
      saldadas: deudas.length - restantes.length,
      total: deudas.length,
    });
  };

  const abonar = (deudaId: string, billeteraId: string, monto: number) => {
    const antes = activas;
    const resultado = datos.abonarDeudaDesdeBilletera(deudaId, billeteraId, monto);
    if (!resultado.exito) {
      window.alert(resultado.error ?? 'No se pudo registrar el pago.');
      return;
    }
    if (resultado.deudaSaldada) evaluarMomento(deudaId, antes);
  };

  const marcarSaldada = (deudaId: string) => {
    const antes = activas;
    datos.marcarSaldada(deudaId, true);
    evaluarMomento(deudaId, antes);
  };

  const ingresoMensual = useMemo(() => ingresoDelMes(movimientos, getContextoMes()).proyectado, [movimientos]);
  // Huecos de la barra de contexto del escritorio. Cada pantalla los llena por portal.
  const [slotBarra, setSlotBarra] = useState<HTMLElement | null>(null);
  const [slotAcciones, setSlotAcciones] = useState<HTMLElement | null>(null);
  const [hojaGastoAbierta, setHojaGastoAbierta] = useState(false);
  const valorShell = useMemo(() => ({ slotBarra, slotAcciones, cajonEmpuja: false }), [slotBarra, slotAcciones]);

  // ---------- Pantallas sin shell ----------
  if (nivelAcceso === 'demo' && seccion !== 'activar_codigo') {
    return (
      <div className="min-h-screen bg-fondo text-texto">
        <OfflineIndicator />
        <div className="px-4 sm:px-6 py-5">
          <PantallaTermometro onIrAActivarCodigo={() => setSeccion('activar_codigo')} />
        </div>
      </div>
    );
  }

  if (seccion === 'activar_codigo') {
    return (
      <div className="min-h-screen bg-fondo text-texto px-4 sm:px-6 py-5">
        <PantallaActivarCodigo
          onVolver={() => setSeccion(nivelAcceso === 'demo' ? 'termometro' : 'perfil')}
          onExito={() => setSeccion(INICIO_POR_MODO[modo])}
        />
      </div>
    );
  }

  if (!perfilFlujo || seccion === 'plan_listo') {
    return (
      <div className="min-h-screen bg-fondo text-texto px-4 sm:px-6">
        <PantallaPlanListo
          perfil={perfilFlujo}
          deudas={deudas}
          onGuardarPerfil={datos.setPerfilFlujo}
          onGuardarDeuda={datos.guardarDeuda}
          onEliminarDeuda={datos.eliminarDeuda}
          onTerminar={() => navegar('plan')}
          onVolver={perfilFlujo ? () => navegar('plan') : undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo text-texto antialiased overflow-x-hidden">
      <OfflineIndicator />
      <ProveedorShell value={valorShell}>
        <div className="app-shell min-h-screen flex">
          <RielLateral modo={modo} seccionActiva={seccion} onCambiarSeccion={navegar} usuario={resumen.usuario} />
          <BarraInferior modo={modo} seccionActiva={seccion} onCambiarSeccion={navegar} />

          <main className="app-main flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Cabecera del celular: marca, conmutador y perfil */}
            <header className="md:hidden sticky top-0 z-20 bg-fondo/90 backdrop-blur-md px-4 py-3 border-b border-linea flex items-center justify-between gap-3">
              <span className="font-display font-extrabold text-base">
                Bolsillo{modo === 'pro' && <span className="text-acento"> Pro</span>}
              </span>
              {hibrido && <ConmutadorModo modo={modo} onCambiar={cambiarModo} />}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHojaGastoAbierta(true)}
                  className="px-3 py-1.5 rounded-full border border-[color:var(--acento)]/45 text-[color:var(--acento)] text-[12px] font-bold"
                >
                  + Gasto
                </button>
                <PWAInstallButton />
                <button
                  type="button"
                  onClick={() => navegar('perfil')}
                  aria-label="Tu perfil"
                  className="w-8 h-8 rounded-full bg-elevada border border-linea grid place-items-center font-display font-bold text-[11px] text-acento cursor-pointer"
                >
                  {resumen.usuario.slice(0, 2).toUpperCase() || '··'}
                </button>
              </div>
            </header>

            {/* Barra de contexto del escritorio: cada pantalla la llena por portal */}
            <div className="no-imprimir hidden md:flex items-center justify-between gap-5 px-5 pt-4 pb-1 min-h-[38px] flex-none">
              <div ref={setSlotBarra} className="flex items-center gap-3 min-w-0" />
              <div className="flex items-center gap-2 flex-none">
                <div ref={setSlotAcciones} className="flex items-center gap-2" />
                <button
                  onClick={() => setHojaGastoAbierta(true)}
                  className="px-3 py-1.5 rounded-full border border-[color:var(--acento)]/45 text-[color:var(--acento)] text-[12px] font-bold"
                >
                  + Gasto
                </button>
                {hibrido && <ConmutadorModo modo={modo} onCambiar={cambiarModo} />}
              </div>
            </div>

            <div
              ref={contenidoRef}
              className="app-contenido flex-1 xl:flex xl:flex-col px-4 sm:px-6 md:px-5 py-5 md:pt-3 pb-24 md:pb-5 w-full"
            >
              <div key={seccion} className="animate-screen-enter xl:flex-1 xl:flex xl:flex-col">
                {seccion === 'plan' && (
                  <PantallaMiPlan
                    deudas={deudas}
                    movimientos={movimientos}
                    billeteras={billeteras}
                    saldoTotal={saldoTotal}
                    disponibleMensual={disponibleMensual}
                    perfil={perfilFlujo}
                    esPro={esPro}
                    onAbonarDeuda={abonar}
                    onIrA={navegar}
                  />
                )}

                {seccion === 'deudas' && (
                  <PantallaDeudas
                    deudas={deudas}
                    billeteras={billeteras}
                    movimientos={movimientos}
                    disponibleMensual={disponibleMensual}
                    onGuardarDeuda={datos.guardarDeuda}
                    onEliminarDeuda={datos.eliminarDeuda}
                    onMarcarSaldada={marcarSaldada}
                    onAbonarDeuda={abonar}
                  />
                )}

                {seccion === 'billetera' && (
                  <PantallaBilletera
                    billeteras={billeteras}
                    saldoTotal={saldoTotal}
                    totalApartado={datos.totalApartado}
                    movimientos={movimientos}
                    deudas={deudas}
                    disponibleMensual={disponibleMensual}
                    perfil={perfilFlujo}
                    onGuardarBilletera={datos.guardarBilletera}
                    onEliminarBilletera={datos.eliminarBilletera}
                    onRegistrarMovimiento={datos.registrarMovimiento}
                  />
                )}

                {seccion === 'pro_inicio' && (
                  <PantallaProInicio
                    perfil={perfilFlujo}
                    billeteras={billeteras}
                    deudas={deudas}
                    sobres={datos.sobres}
                    saldoTotal={saldoTotal}
                    onAbonarASobre={datos.abonarASobre}
                    onIrA={navegar}
                  />
                )}

                {seccion === 'sobres' && (
                  <PantallaSobresBaseCero
                    perfilFlujo={perfilFlujo}
                    sobres={datos.sobres}
                    billeteras={billeteras}
                    deudas={deudas}
                    movimientos={movimientos}
                    onRepartirBasicos={datos.repartirBasicosDeNuevo}
                    onGuardarSobre={datos.guardarSobre}
                    onEliminarSobre={datos.eliminarSobre}
                    onAportarASobre={datos.aportarASobre}
                    onAbonarASobre={datos.abonarASobre}
                    onRetirarDeSobre={datos.retirarDeSobre}
                    onVolver={() => navegar('pro_inicio')}
                    onIrAMiPlan={() => navegar('plan')}
                  />
                )}

                {seccion === 'herramientas' && (
                  <PantallaCrecer
                    usuario={resumen.usuario}
                    presupuestos={datos.presupuestos}
                    gastoPorCategoria={datos.gastoPorCategoria}
                    ingresoMensual={ingresoMensual}
                    billeteras={billeteras}
                    onGuardarPresupuesto={datos.guardarPresupuesto}
                    onEliminarPresupuesto={datos.eliminarPresupuesto}
                    onRegistrarMovimiento={datos.registrarMovimiento}
                    sobres={datos.sobres}
                    totalApartado={datos.sobres.filter(s => !s.grupo).reduce((a, s) => a + s.apartado, 0)}
                    saldoTotal={saldoTotal}
                    onGuardarSobre={datos.guardarSobre}
                    onEliminarSobre={datos.eliminarSobre}
                    retos={datos.retos}
                    onGuardarReto={datos.guardarReto}
                    onEliminarReto={datos.eliminarReto}
                    onAportarReto={datos.aportarSemanaReto}
                    suscripciones={datos.suscripciones}
                    sangradoMensual={datos.sangradoMensual}
                    onGuardarSuscripcion={datos.guardarSuscripcion}
                    onEliminarSuscripcion={datos.eliminarSuscripcion}
                    tarjetas={datos.tarjetasCredito}
                    deudas={deudas}
                    movimientos={movimientos}
                    disponibleMensual={disponibleMensual}
                    onAbonarDeuda={(deudaId, billeteraId, monto) => {
                      const antes = activas;
                      const r = datos.abonarDeudaDesdeBilletera(deudaId, billeteraId, monto);
                      if (r.exito && r.deudaSaldada) evaluarMomento(deudaId, antes);
                      return r;
                    }}
                    onGuardarTarjeta={datos.guardarTarjetaCredito}
                    onEliminarTarjeta={datos.eliminarTarjetaCredito}
                  />
                )}

                {seccion === 'perfil' && (
                  <PantallaPerfil
                    usuario={resumen.usuario}
                    nivelAcceso={nivelAcceso}
                    onNavegarPro={() => navegar('pro')}
                    onAbrirActivarCodigo={() => setSeccion('activar_codigo')}
                  />
                )}

                {seccion === 'pro' && (
                  <PantallaPro
                    onVolver={() => navegar('perfil')}
                    onIrAActivarCodigo={() => setSeccion('activar_codigo')}
                    movimientos={movimientos}
                    deudas={deudas}
                    disponibleMensual={disponibleMensual}
                  />
                )}
              </div>

              <HojaGastoRapido
                abierto={hojaGastoAbierta}
                billeteras={billeteras}
                sobres={datos.sobres}
                techoSemanal={techoSemanal(perfilFlujo!.gastosBasicos)}
                gastoSemana={gastoDeLaSemana(movimientos)}
                deudas={activas}
                caja={disponibleMensual}
                enFaseDeudas={activas.length > 0}
                onGuardar={(mov) => {
                  datos.registrarMovimiento(mov);
                  setHojaGastoAbierta(false);
                }}
                onCerrar={() => setHojaGastoAbierta(false)}
              />
            </div>
          </main>
        </div>
      </ProveedorShell>

      {momento?.tipo === 'traspaso' && (
        <MomentoTraspaso
          deuda={momento.deuda}
          siguiente={momento.siguiente}
          minimoSiguiente={momento.minimoSiguiente}
          saldadas={momento.saldadas}
          total={momento.total}
          onContinuar={() => {
            setMomento(null);
            navegar('plan');
          }}
        />
      )}
      {momento?.tipo === 'graduacion' && (
        <MomentoGraduacion
          totalPagado={momento.totalPagado}
          libre={momento.libre}
          esPro={esPro}
          onActivarPro={() => {
            setMomento(null);
            setSeccion('activar_codigo');
          }}
          onEmpezarBlindar={() => {
            setMomento(null);
            navegar('pro_inicio');
          }}
          onCerrar={() => setMomento(null)}
        />
      )}
    </div>
  );
}
