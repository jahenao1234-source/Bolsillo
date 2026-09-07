/**
 * Bolsillo v2 - Finanzas Personales para Colombia
 * Sistema de 2 Temas: Medianoche (Oscuro) y Papel (Cálido Claro)
 */

import React, { useState, useEffect } from 'react';
import { useBolsilloData } from './hooks/useBolsilloData';
import { BarraNavegacion, SeccionApp } from './components/navigation/BarraNavegacion';
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
  } = useBolsilloData();

  const handleNavegar = (seccion: SeccionApp) => {
    setSeccionActiva(seccion);
    setNavTick((t) => t + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determinar si debemos renderizar el Termómetro como entrada para Demo
  const mostrarTermometro = nivelAcceso === 'demo' && seccionActiva !== 'activar_codigo';

  return (
    <div className="min-h-screen bg-[var(--fondo)] text-[color:var(--texto)] font-sans antialiased relative overflow-x-hidden transition-colors duration-200">
      {/* Indicador de estado sin conexión para PWA */}
      <OfflineIndicator />

      {/* ========================================================= */}
      {/* ESTRUCTURA PRINCIPAL: NAVEGACIÓN Y CONTENIDO RESPONSIVO */}
      {/* ========================================================= */}
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Barra de navegación (Sidebar en desktop, Bottom Nav en móvil) */}
        {!mostrarTermometro && seccionActiva !== 'activar_codigo' && (
          <BarraNavegacion
            seccionActiva={seccionActiva}
            onCambiarSeccion={handleNavegar}
            usuario={resumen.usuario}
            nivelAcceso={nivelAcceso}
          />
        )}

        {/* Área de contenido principal */}
        <main
          className={`
            flex-1 flex flex-col min-h-screen relative z-10
            ${!mostrarTermometro && seccionActiva !== 'activar_codigo' ? 'md:pl-64' : ''}
          `}
        >
          {/* Barra superior en móvil solo cuando no estamos en gancho o pantalla de código */}
          {!mostrarTermometro && seccionActiva !== 'activar_codigo' && (
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

          {/* Contenedor central del contenido con padding ergonómico y espacio para la barra inferior móvil */}
          <div
            className={`flex-1 px-4 sm:px-6 md:px-8 py-5 sm:py-7 w-full max-w-6xl mx-auto ${
              !mostrarTermometro && seccionActiva !== 'activar_codigo' ? 'pb-24 sm:pb-8' : ''
            }`}
          >
            {/* Pantalla 1: Termómetro de la Deuda (Gancho Demo) */}
            {mostrarTermometro && (
              <div key="termometro" className="animate-screen-enter">
                <PantallaTermometro
                  onIrAActivarCodigo={() => setSeccionActiva('activar_codigo')}
                />
              </div>
            )}

            {/* Pantalla 2: Activar Código de Acceso */}
            {!mostrarTermometro && seccionActiva === 'activar_codigo' && (
              <div key="activar_codigo" className="animate-screen-enter">
                <PantallaActivarCodigo
                  onVolver={() => setSeccionActiva(nivelAcceso === 'demo' ? 'termometro' : 'perfil')}
                  onExito={() => setSeccionActiva('inicio')}
                />
              </div>
            )}

            {/* Pantalla 3: Inicio (Mi Dinero) */}
            {!mostrarTermometro && seccionActiva === 'inicio' && (
              <div key="inicio" className="animate-screen-enter">
                <PantallaInicio
                  resumen={resumen}
                  billeteras={billeteras}
                  deudas={deudas}
                  movimientos={movimientos}
                  disponibleMensual={disponibleMensual}
                  onNavegar={handleNavegar}
                  onAbonarDeuda={abonarDeudaDesdeBilletera}
                />
              </div>
            )}

            {/* Pantalla 4: Billeteras & Movimientos */}
            {!mostrarTermometro && seccionActiva === 'billeteras' && (
              <div key="billeteras" className="animate-screen-enter">
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
                />
              </div>
            )}

            {/* Pantalla 5: Plan Deuda Cero */}
            {!mostrarTermometro && seccionActiva === 'deudas' && (
              <div key="deudas" className="animate-screen-enter">
                <PantallaDeudas
                  deudas={deudas}
                  deudaTotal={resumen.deudaTotal}
                  disponibleMensual={disponibleMensual}
                  billeteras={billeteras}
                  onVolver={() => setSeccionActiva('inicio')}
                  onNavegar={handleNavegar}
                  onAbonarDeuda={abonarDeudaDesdeBilletera}
                />
              </div>
            )}

            {/* Pantalla: Crecer (módulos Pro). En entrada muestra la vitrina; en Pro, el hub. */}
            {!mostrarTermometro && seccionActiva === 'crecer' && (
              <div key="crecer" className="animate-screen-enter">
                {nivelAcceso === 'pro' ? (
                  <PantallaCrecer
                    resetToken={navTick}
                    usuario={resumen.usuario}
                    presupuestos={presupuestos}
                    gastoPorCategoria={gastoPorCategoria}
                    onGuardarPresupuesto={guardarPresupuesto}
                    onEliminarPresupuesto={eliminarPresupuesto}
                    sobres={sobres}
                    totalApartado={totalApartado}
                    saldoTotal={saldoTotal}
                    onGuardarSobre={guardarSobre}
                    onEliminarSobre={eliminarSobre}
                    retos={retos}
                    onGuardarReto={guardarReto}
                    onEliminarReto={eliminarReto}
                    onAportarReto={aportarSemanaReto}
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
              <div key="perfil" className="animate-screen-enter">
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
              <div key="pro" className="animate-screen-enter">
                <PantallaPro
                  onVolver={() => setSeccionActiva('perfil')}
                  onIrAActivarCodigo={() => setSeccionActiva('activar_codigo')}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
