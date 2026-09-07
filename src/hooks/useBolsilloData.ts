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
  suscribirStore,
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
  };
}
