/**
 * Bolsillo v2 - Finanzas Personales para Colombia
 * Sistema de 2 Temas: Medianoche (Oscuro) y Papel (Cálido Claro)
 */

import React, { useState, useEffect } from 'react';
import { useBolsilloData } from './hooks/useBolsilloData';
import { BarraNavegacion, SeccionApp } from './components/navigation/BarraNavegacion';
import { RielNavegacion } from './components/layout/RielNavegacion';
import { BarraContexto } from './components/layout/BarraContexto';
import { CajonHoy } from './components/layout/CajonHoy';
import { useCajonHoy } from './hooks/useCajonHoy';
import { ProveedorShell } from './components/layout/shell';
import { PantallaInicio } from './screens/PantallaInicio';
import { PantallaBilleteras } from './screens/PantallaBilleteras';
import { PantallaDeudas } from './screens/PantallaDeudas';
import { PantallaPerfil } from './screens/PantallaPerfil';
import { PantallaPro } from './screens/PantallaPro';
import { PantallaCrecer } from './screens/PantallaCrecer';
import { PantallaTermometro } from './screens/PantallaTermometro';
import { PantallaActivarCodigo } from './screens/PantallaActivarCodigo';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { useTema, inicializarTema } from './utils/theme';
import { getContextoMes, ingresoDelMes, calcularAgenda } from './logic/resumenMes';

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionApp>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'billeteras'
      : 'inicio'
  );
  const { esPapel } = useTema();
  // Se incrementa en cada navegación; permite a "Crecer" volver a su hub al re-seleccionarlo.
  const [navTick, setNavTick] = useState(0);

  // Asegurar que el tema esté cargado desde localStorage
  useEffect(() => {
    inicializarTema();
  }, []);

  const {
    resumen,
    billeteras,
    saldoTotal,
    deudas,
    movimientos,
    disponibleMensual,
    flujoMes,
    nivelAcceso,
    guardarBilletera,
    eliminarBilletera,
    registrarMovimiento,
    abonarDeudaDesdeBilletera,
    presupuestos,
    gastoPorCategoria,
    guardarPresupuesto,
    eliminarPresupuesto,
    sobres,
    totalApartado,
    guardarSobre,
    eliminarSobre,
    retos,
    guardarReto,
    eliminarReto,
    aportarSemanaReto,
    suscripciones,
    sangradoMensual,
    guardarSuscripcion,
    eliminarSuscripcion,
    tarjetasCredito,
    guardarTarjetaCredito,
    eliminarTarjetaCredito,
  } = useBolsilloData();

  // Lo que entra en el mes completo. A mitad de mes, `flujoMes.ingresos` solo
  // trae la quincena que ya llegó, y los módulos que comparan contra el ingreso
  // (presupuesto, suscripciones, retos) darían porcentajes al doble.
  const ingresoDelMesCompleto = React.useMemo(
    () => ingresoDelMes(movimientos, getContextoMes()).proyectado,
    [movimientos]
  );

  // El cajón de "Hoy": mobiliario de toda la app, no de una pantalla.
  const cajon = useCajonHoy();

  // La misma agenda que muestra Inicio. Se calcula aquí porque el cajón la
  // necesita esté donde esté el usuario.
  const agendaHoy = React.useMemo(
    () =>
      calcularAgenda({
        contexto: getContextoMes(),
        deudas,
        suscripciones,
        tarjetas: tarjetasCredito,
        retos,
        esPro: nivelAcceso === 'pro',
      }),
    [deudas, suscripciones, tarjetasCredito, retos, nivelAcceso]
  );

  const cobrosPendientes = agendaHoy.filter((e) => e.monto > 0).length;

  // En escritorio el que scrollea es el contenedor del contenido, no la ventana.
  const contenidoRef = React.useRef<HTMLDivElement>(null);

  // Huecos de la barra de contexto. Cada pantalla los llena por portal.
  const [slotBarra, setSlotBarra] = useState<HTMLElement | null>(null);
  const [slotAcciones, setSlotAcciones] = useState<HTMLElement | null>(null);
  const shell = React.useMemo(
    () => ({ slotBarra, slotAcciones, cajonEmpuja: cajon.abierto && !cajon.flotante }),
    [slotBarra, slotAcciones, cajon.abierto, cajon.flotante]
  );

  const handleNavegar = (seccion: SeccionApp) => {
    setSeccionActiva(seccion);
    setNavTick((t) => t + 1);
    contenidoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determinar si debemos renderizar el Termómetro como entrada para Demo
  const mostrarTermometro = nivelAcceso === 'demo' && seccionActiva !== 'activar_codigo';

  // El gancho y la pantalla de código van a pantalla completa, sin shell.
  const conShell = !mostrarTermometro && seccionActiva !== 'activar_codigo';

  return (
    <div className="min-h-screen bg-[var(--fondo)] text-[color:var(--texto)] font-sans antialiased relative overflow-x-hidden transition-colors duration-200">
      {/* Indicador de estado sin conexión para PWA */}
      <OfflineIndicator />

      {/* ========================================================= */}
      {/* EL SHELL: riel · área de trabajo · cajón de Hoy           */}
      {/* En escritorio la página no scrollea: lo hace el contenido. */}
      {/* ========================================================= */}
      <ProveedorShell value={shell}>
      <div className="min-h-screen md:h-screen md:overflow-hidden flex">
        {/* Riel de escritorio (68px) */}
        {conShell && (
          <RielNavegacion
            seccionActiva={seccionActiva}
            onCambiarSeccion={handleNavegar}
            usuario={resumen.usuario}
            saldoTotal={saldoTotal}
          />
        )}

        {/* Barra inferior de móvil (fija, fuera del flujo) */}
        {conShell && (
          <BarraNavegacion
            seccionActiva={seccionActiva}
            onCambiarSeccion={handleNavegar}
            nivelAcceso={nivelAcceso}
          />
        )}

        {/* Área de contenido principal */}
        <main className="flex-1 flex flex-col min-w-0 min-h-screen md:min-h-0 md:h-screen relative z-10">
          {/* Barra superior en móvil solo cuando no estamos en gancho o pantalla de código */}
          {conShell && (
            <header className="md:hidden sticky top-0 z-20 bg-[var(--fondo)]/90 backdrop-blur-md px-4 py-3 border-b border-[var(--linea)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg p-[1px] shadow-xs ${
                    esPapel ? 'bg-[var(--acento)]' : 'bg-platinum-gradient'
                  }`}
                >
                  <div className="w-full h-full rounded-[7px] bg-[var(--superficie)] flex items-center justify-center">
                    <span
                      className={`font-display font-black text-sm ${
                        esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'
                      }`}
                    >
                      B
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display font-bold text-base tracking-tight ${
                      esPapel ? 'text-[color:var(--acento)]' : 'text-platinum-gradient'
                    }`}
                  >
                    Bolsillo
                  </span>
                  <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[var(--superficie-2)] text-[color:var(--texto-2)] border border-[var(--linea)]">
                    COL
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <PWAInstallButton />
              </div>
            </header>
          )}

          {/* La barra de contexto: dónde estás y el botón del cajón de Hoy */}
          {conShell && (
            <div className="hidden md:block px-5 pt-4 pb-1 flex-none">
              <BarraContexto
                refTitulo={setSlotBarra}
                refAcciones={setSlotAcciones}
                cajonAbierto={cajon.abierto}
                pendientes={cobrosPendientes}
                onAlternarCajon={cajon.alternar}
              />
            </div>
          )}

          {/* El contenido. En escritorio scrollea aquí, no la página entera. */}
          <div
            ref={contenidoRef}
            className={`flex-1 min-h-0 md:overflow-y-auto px-4 sm:px-6 md:px-5 py-5 md:pt-3 w-full ${
              conShell ? 'pb-24 md:pb-5' : ''
            }`}
          >
            {/* Pantalla 1: Termómetro de la Deuda (Gancho Demo) */}
            {mostrarTermometro && (
              <div key="termometro" className="animate-screen-enter xl:h-full">
                <PantallaTermometro
                  onIrAActivarCodigo={() => setSeccionActiva('activar_codigo')}
                />
              </div>
            )}

            {/* Pantalla 2: Activar Código de Acceso */}
            {!mostrarTermometro && seccionActiva === 'activar_codigo' && (
              <div key="activar_codigo" className="animate-screen-enter xl:h-full">
                <PantallaActivarCodigo
                  onVolver={() => setSeccionActiva(nivelAcceso === 'demo' ? 'termometro' : 'perfil')}
                  onExito={() => setSeccionActiva('inicio')}
                />
              </div>
            )}

            {/* Pantalla 3: Inicio (Mi Dinero) */}
            {!mostrarTermometro && seccionActiva === 'inicio' && (
              <div key="inicio" className="animate-screen-enter xl:h-full">
                <PantallaInicio
                  resumen={resumen}
                  billeteras={billeteras}
                  deudas={deudas}
                  movimientos={movimientos}
                  disponibleMensual={disponibleMensual}
                  esPro={nivelAcceso === 'pro'}
                  saldoTotal={saldoTotal}
                  presupuestos={presupuestos}
                  sobres={sobres}
                  totalApartado={totalApartado}
                  retos={retos}
                  suscripciones={suscripciones}
                  sangradoMensual={sangradoMensual}
                  tarjetasCredito={tarjetasCredito}
                  onNavegar={handleNavegar}
                  onRegistrarMovimiento={registrarMovimiento}
                  onAbonarDeuda={abonarDeudaDesdeBilletera}
                />
              </div>
            )}

            {/* Pantalla 4: Billeteras & Movimientos */}
            {!mostrarTermometro && seccionActiva === 'billeteras' && (
              <div key="billeteras" className="animate-screen-enter xl:h-full">
                <PantallaBilleteras
                  billeteras={billeteras}
                  saldoTotal={saldoTotal}
                  movimientos={movimientos}
                  flujoMes={flujoMes}
                  deudas={deudas}
                  onVolver={() => setSeccionActiva('inicio')}
                  onNavegar={handleNavegar}
                  onGuardarBilletera={guardarBilletera}
                  onEliminarBilletera={eliminarBilletera}
                  onRegistrarMovimiento={registrarMovimiento}
                  esPro={nivelAcceso === 'pro'}
                />
              </div>
            )}

            {/* Pantalla 5: Plan Deuda Cero */}
            {!mostrarTermometro && seccionActiva === 'deudas' && (
              <div key="deudas" className="animate-screen-enter xl:h-full">
                <PantallaDeudas
                  deudas={deudas}
                  deudaTotal={resumen.deudaTotal}
                  disponibleMensual={disponibleMensual}
                  billeteras={billeteras}
                  onVolver={() => setSeccionActiva('inicio')}
                  onNavegar={handleNavegar}
                  onAbonarDeuda={abonarDeudaDesdeBilletera}
                  esPro={nivelAcceso === 'pro'}
                />
              </div>
            )}

            {/* Pantalla: Crecer (módulos Pro). En entrada muestra la vitrina; en Pro, el hub. */}
            {!mostrarTermometro && seccionActiva === 'crecer' && (
              <div key="crecer" className="animate-screen-enter xl:h-full">
                {nivelAcceso === 'pro' ? (
                  <PantallaCrecer
                    resetToken={navTick}
                    usuario={resumen.usuario}
                    presupuestos={presupuestos}
                    gastoPorCategoria={gastoPorCategoria}
                    ingresoMensual={ingresoDelMesCompleto}
                    billeteras={billeteras}
                    onGuardarPresupuesto={guardarPresupuesto}
                    onEliminarPresupuesto={eliminarPresupuesto}
                    onRegistrarMovimiento={registrarMovimiento}
                    sobres={sobres}
                    totalApartado={totalApartado}
                    saldoTotal={saldoTotal}
                    onGuardarSobre={guardarSobre}
                    onEliminarSobre={eliminarSobre}
                    retos={retos}
                    onGuardarReto={guardarReto}
                    onEliminarReto={eliminarReto}
                    onAportarReto={aportarSemanaReto}
                    suscripciones={suscripciones}
                    sangradoMensual={sangradoMensual}
                    onGuardarSuscripcion={guardarSuscripcion}
                    onEliminarSuscripcion={eliminarSuscripcion}
                    tarjetas={tarjetasCredito}
                    deudas={deudas}
                    movimientos={movimientos}
                    disponibleMensual={disponibleMensual}
                    onAbonarDeuda={abonarDeudaDesdeBilletera}
                    onGuardarTarjeta={guardarTarjetaCredito}
                    onEliminarTarjeta={eliminarTarjetaCredito}
                  />
                ) : (
                  <PantallaPro
                    onVolver={() => setSeccionActiva('inicio')}
                    onIrAActivarCodigo={() => setSeccionActiva('activar_codigo')}
                  />
                )}
              </div>
            )}

            {/* Pantalla 6: Perfil & Ajustes (Reemplaza a "Más") */}
            {!mostrarTermometro && seccionActiva === 'perfil' && (
              <div key="perfil" className="animate-screen-enter xl:h-full">
                <PantallaPerfil
                  usuario={resumen.usuario}
                  nivelAcceso={nivelAcceso}
                  onNavegarPro={() => setSeccionActiva('pro')}
                  onAbrirActivarCodigo={() => setSeccionActiva('activar_codigo')}
                />
              </div>
            )}

            {/* Pantalla 7: Bolsillo Pro (Aspiracional, 1 sola puerta) */}
            {!mostrarTermometro && seccionActiva === 'pro' && (
              <div key="pro" className="animate-screen-enter xl:h-full">
                <PantallaPro
                  onVolver={() => setSeccionActiva('perfil')}
                  onIrAActivarCodigo={() => setSeccionActiva('activar_codigo')}
                />
              </div>
            )}
          </div>
        </main>

        {/* El cajón de Hoy: la misma columna en todas las pantallas */}
        {conShell && (
          <CajonHoy
            abierto={cajon.abierto}
            flotante={cajon.flotante}
            eventos={agendaHoy}
            saldoTotal={saldoTotal}
            onCerrar={cajon.cerrar}
            onNavegar={handleNavegar}
          />
        )}
      </div>
      </ProveedorShell>
    </div>
  );
}
