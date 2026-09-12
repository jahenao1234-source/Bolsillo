import { useState, useEffect } from 'react';
import {
  getResumen,
  getBilleteras,
  getSaldoTotal,
  getDeudas,
  getMovimientos,
  getDisponibleMensual,
  getFlujoMes,
  getNivelAcceso,
  setNivelAcceso,
  getDatosTermometro,
  guardarDatosTermometro,
  guardarBilletera,
  eliminarBilletera,
  registrarMovimiento,
  abonarDeudaDesdeBilletera,
  guardarDeuda,
  eliminarDeuda,
  marcarSaldada,
  setDisponibleMensual,
  getNombreUsuario,
  setNombreUsuario,
  reordenarDeudas,
  getPresupuestos,
  guardarPresupuesto,
  eliminarPresupuesto,
  getGastoPorCategoria,
  getSobres,
  guardarSobre,
  eliminarSobre,
  getTotalApartadoSobres,
  getRetos,
  guardarReto,
  eliminarReto,
  aportarSemanaReto,
  getSuscripciones,
  guardarSuscripcion,
  eliminarSuscripcion,
  getSangradoMensual,
  getTarjetasCredito,
  guardarTarjetaCredito,
  eliminarTarjetaCredito,
  suscribirStore,
  getPerfilFlujo,
  setPerfilFlujo,
  aportarASobre,
  asegurarSobresSistema,
  repartirBasicosDeNuevo,
  moverAporteMensual,
} from '../data/store';
import {
  ResumenFinanciero,
  Billetera,
  Deuda,
  Movimiento,
  FlujoMes,
  NivelAcceso,
  DatosTermometro,
  Presupuesto,
  Sobre,
  RetoAhorro,
  Suscripcion,
  TarjetaCredito,
  PerfilFlujo,
} from '../types';

export function useBolsilloData() {
  const [nombreUsuario, setNombreUsuarioState] = useState<string>(getNombreUsuario);
  const [resumen, setResumenState] = useState<ResumenFinanciero>(getResumen);
  const [billeteras, setBilleterasState] = useState<Billetera[]>(getBilleteras);
  const [saldoTotal, setSaldoTotalState] = useState<number>(getSaldoTotal);
  const [deudas, setDeudasState] = useState<Deuda[]>(getDeudas);
  const [movimientos, setMovimientosState] = useState<Movimiento[]>(getMovimientos);
  const [disponibleMensual, setDisponibleState] = useState<number>(getDisponibleMensual);
  const [flujoMes, setFlujoMesState] = useState<FlujoMes>(() => getFlujoMes('sep'));
  const [nivelAcceso, setNivelAccesoState] = useState<NivelAcceso>(getNivelAcceso);
  const [datosTermometro, setDatosTermometroState] = useState<DatosTermometro | null>(getDatosTermometro);
  const [presupuestos, setPresupuestosState] = useState<Presupuesto[]>(getPresupuestos);
  const [gastoPorCategoria, setGastoPorCategoriaState] = useState<Record<string, number>>(() =>
    getGastoPorCategoria('sep')
  );
  const [sobres, setSobresState] = useState<Sobre[]>(getSobres);
  const [totalApartado, setTotalApartadoState] = useState<number>(getTotalApartadoSobres);
  const [retos, setRetosState] = useState<RetoAhorro[]>(getRetos);
  const [suscripciones, setSuscripcionesState] = useState<Suscripcion[]>(getSuscripciones);
  const [sangradoMensual, setSangradoState] = useState<number>(getSangradoMensual);
  const [tarjetasCredito, setTarjetasCreditoState] = useState<TarjetaCredito[]>(getTarjetasCredito);
  const [perfilFlujo, setPerfilFlujoState] = useState<PerfilFlujo | null>(getPerfilFlujo);

  useEffect(() => {
    const desuscribir = suscribirStore(() => {
      setNombreUsuarioState(getNombreUsuario());
      setResumenState(getResumen());
      setBilleterasState(getBilleteras());
      setSaldoTotalState(getSaldoTotal());
      setDeudasState(getDeudas());
      setMovimientosState(getMovimientos());
      setDisponibleState(getDisponibleMensual());
      setFlujoMesState(getFlujoMes('sep'));
      setNivelAccesoState(getNivelAcceso());
      setDatosTermometroState(getDatosTermometro());
      setPresupuestosState(getPresupuestos());
      setGastoPorCategoriaState(getGastoPorCategoria('sep'));
      setSobresState(getSobres());
      setTotalApartadoState(getTotalApartadoSobres());
      setRetosState(getRetos());
      setSuscripcionesState(getSuscripciones());
      setSangradoState(getSangradoMensual());
      setTarjetasCreditoState(getTarjetasCredito());
      setPerfilFlujoState(getPerfilFlujo());
    });
    return desuscribir;
  }, []);

  return {
    nombreUsuario,
    setNombreUsuario,
    resumen,
    billeteras,
    saldoTotal,
    deudas,
    movimientos,
    disponibleMensual,
    flujoMes,
    nivelAcceso,
    datosTermometro,
    setNivelAcceso,
    guardarDatosTermometro,
    guardarBilletera,
    eliminarBilletera,
    registrarMovimiento,
    abonarDeudaDesdeBilletera,
    guardarDeuda,
    eliminarDeuda,
    marcarSaldada,
    reordenarDeudas,
    setDisponibleMensual,
    // Sistema v3
    perfilFlujo,
    setPerfilFlujo,
    aportarASobre,
    asegurarSobresSistema,
    repartirBasicosDeNuevo,
    moverAporteMensual,
    // Módulos Pro (Crecer)
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
  };
}
