import React, { useMemo, useState } from 'react';
import type { Billetera, Deuda, Movimiento, PerfilFlujo, Sobre } from '../types';
import { ModalAgregarBilletera } from '../components/billeteras/ModalAgregarBilletera';
import { ModalRegistrarMovimiento } from '../components/billeteras/ModalRegistrarMovimiento';
import {
  deudasActivas,
  enSobres,
  gastoDeLaSemana,
  techoSemanal,
  gastosDelMes,
  gastoPorCategoriaDelMes,
  inicioDeSemana,
  diasDeRetraso,
} from '../logic/sistema';
import { formatearCOP } from '../utils/format';
import { MESES_NOMBRE, MESES_ABREV } from '../utils/fechas';

interface PantallaBilleteraProps {
  billeteras: Billetera[];
  sobres: Sobre[];
  saldoTotal: number;
  movimientos: Movimiento[];
  deudas: Deuda[];
  disponibleMensual: number;
  perfil: PerfilFlujo | null;
  onGuardarBilletera: (billetera: Billetera) => void;
  onEliminarBilletera: (id: string) => void;
  onRegistrarMovimiento: (movimiento: Omit<Movimiento, 'id'>) => void;
}

const POR_PAGINA = 10;

export const PantallaBilletera: React.FC<PantallaBilleteraProps> = ({
  billeteras,
  sobres,
  saldoTotal,
  movimientos,
  deudas,
  disponibleMensual,
  perfil,
  onGuardarBilletera,
  onEliminarBilletera,
  onRegistrarMovimiento,
}) => {
  const [ingresoAbierto, setIngresoAbierto] = useState(false);
  const [billeteraEditando, setBilleteraEditando] = useState<Billetera | null>(null);
  const [creandoBilletera, setCreandoBilletera] = useState(false);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const hoy = new Date();
  const activas = useMemo(() => deudasActivas(deudas), [deudas]);
  const techo = perfil ? techoSemanal(perfil.gastosBasicos) : null;
  const gastoSemana = gastoDeLaSemana(movimientos);
  
  const lunesDate = inicioDeSemana(hoy);
  const lunes = lunesDate.getDate();
  const domingoDate = new Date(lunesDate);
  domingoDate.setDate(lunesDate.getDate() + 6);
  const domingo = domingoDate.getDate();
  const mesDomAbrev = MESES_ABREV[domingoDate.getMonth()].toLowerCase();

  const delMes = useMemo(() => gastosDelMes(movimientos, hoy), [movimientos, hoy]);
  const gastadoMes = delMes.reduce((a, m) => a + m.monto, 0);
  const categorias = useMemo(() => gastoPorCategoriaDelMes(movimientos, hoy, 5), [movimientos, hoy]);

  const mesStr = hoy.toISOString().substring(0, 7);
  const movMes = useMemo(() => {
    return movimientos
      .filter(m => m.creadoEn?.startsWith(mesStr))
      .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''));
  }, [movimientos, mesStr]);

  const entroMes = movMes.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const salioMes = movMes.filter(m => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);

  const mesNombre = MESES_NOMBRE[hoy.getMonth()].toLowerCase();
  const pctMes = perfil && perfil.gastosBasicos > 0 ? (gastadoMes / perfil.gastosBasicos) * 100 : 0;
  const pasado = techo !== null && gastoSemana > techo;

  return (
    <div className="pant">
      <div className="rejilla llena" style={{ '--cols': 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)' } as React.CSSProperties}>

        {/* PANEL "Techo de esta semana" */}
        <section className="panel destacado">
          <div className="panel-cab">
            <h2 className="titulo">Techo de esta semana</h2>
            <span className="nota">del {lunes} al {domingo} {mesDomAbrev}</span>
          </div>
          
          {techo === null ? (
            <div className="nota">Configura tu mes en Mi plan para saber cuánto puedes gastar por semana.</div>
          ) : (
            <>
              <div>
                <div className="nota">{pasado ? 'Te pasaste esta semana' : 'Te quedan esta semana'}</div>
                <div className={`cifra-xl ${pasado ? 'mal' : 'acento-tx'}`}>{formatearCOP(Math.abs(techo - gastoSemana))}</div>
              </div>
              <div>
                <div className="fila">
                  <span className="nota">Gastado <b className="num">{formatearCOP(gastoSemana)}</b></span>
                  <span className="nota num">de {formatearCOP(techo)}</span>
                </div>
                <div className="barra" style={{ marginTop: 5, '--c': pasado ? 'var(--alerta)' : 'var(--acento)' } as React.CSSProperties}>
                  <i style={{ width: `${Math.min(100, (gastoSemana / techo) * 100)}%` }} />
                </div>
              </div>
              <div className="nota suave solo-escritorio">Sale de lo básico: {formatearCOP(perfil!.gastosBasicos)} × 12 ÷ 52.</div>
              {activas.length > 0 && (
                <div className="caja" style={{ marginTop: 'auto' }}>
                  Pasarte atrasa tu fecha de libertad: <b className="num">$50.000</b> por encima del techo la corren <b>{diasDeRetraso(activas, disponibleMensual, 50000)} días</b>.
                </div>
              )}
            </>
          )}
        </section>

        {/* PANEL "Tus cuentas" */}
        <section className="panel">
          <div className="panel-cab">
            <h2 className="titulo">Tus cuentas</h2>
            <button className="link acento" onClick={() => setCreandoBilletera(true)}>+ Agregar cuenta</button>
          </div>
          <div>
            <span className="cifra-l">{formatearCOP(saldoTotal)}</span> <span className="de">en {billeteras.length} cuentas</span>
          </div>
          <div className="lista">
            {billeteras.length === 0 ? (
              <div className="nota">Agrega dónde tienes tu plata: Nequi, banco, efectivo.</div>
            ) : (
              billeteras.map(b => {
                const enS = enSobres(b.id, sobres);
                return (
                  <div key={b.id} role="button" onClick={() => setBilleteraEditando(b)} style={{ textAlign: 'left', cursor: 'pointer' }}>
                    <div className="fila">
                      <div>{b.nombre}</div>
                      <div className={b.saldo < 0 ? 'mal' : ''}>{formatearCOP(b.saldo)}</div>
                    </div>
                    <div className="barra solo-escritorio" style={{ marginTop: 5 }}>
                      <i style={{ width: `${Math.max(0, saldoTotal > 0 ? (b.saldo / saldoTotal) * 100 : 0)}%` }} />
                    </div>
                    {enS > 0 && (
                      b.saldo - enS < 0 ? (
                        <div className="nota mal">Tus sobres suman más de lo que hay aquí</div>
                      ) : (
                        <div className="nota suave">{formatearCOP(enS)} en sobres · {formatearCOP(b.saldo - enS)} sin sobre</div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
          <button className="btn ancho" style={{ marginTop: 'auto' }} onClick={() => setIngresoAbierto(true)}>Registrar ingreso</button>
        </section>

        {/* PANEL "Gastado en {mes}" */}
        <section className="panel">
          <div className="panel-cab">
            <h2 className="titulo">Gastado en {mesNombre}</h2>
            {perfil && <span className="nota num">{pctMes.toFixed(1).replace('.', ',')}% de lo básico</span>}
          </div>
          <div>
            <span className="cifra-l">{formatearCOP(gastadoMes)}</span>
            {perfil && <span className="de"> de {formatearCOP(perfil.gastosBasicos)}</span>}
            {perfil && (
              <div className="barra" style={{ marginTop: 8 }}>
                <i style={{ width: `${Math.min(100, pctMes)}%` }} />
              </div>
            )}
          </div>
          {categorias.length === 0 ? (
            <div className="nota suave">Todavía no hay gastos este mes.</div>
          ) : (
            <div className="lista solo-escritorio" style={{ gap: 8 }}>
              {categorias.map((c, i) => {
                const colores = ['var(--azul)', 'var(--positivo)', 'var(--alerta)', 'var(--acento)', 'var(--texto-3)'];
                const color = colores[i % colores.length];
                return (
                  <div key={c.categoria}>
                    <div className="fila">
                      <div>{c.categoria}</div>
                      <div>{formatearCOP(c.monto)}</div>
                    </div>
                    <div className="barra" style={{ marginTop: 5, '--c': color } as React.CSSProperties}>
                      <i style={{ width: `${c.porcentaje}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PANEL "Movimientos de {mes}" */}
        <section className="panel ancho-todo">
          <div className="panel-cab">
            <h2 className="titulo">Movimientos de {mesNombre}</h2>
            <span className="nota num solo-escritorio">Entró {formatearCOP(entroMes)} · salió {formatearCOP(salioMes)}</span>
          </div>
          {movMes.length === 0 ? (
            <div className="nota suave">Todavía no hay movimientos este mes.</div>
          ) : (
            <>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th className="opc" style={{ width: '22%' }}>Cuenta</th>
                    <th className="opc2" style={{ width: '20%' }}>Categoría</th>
                    <th style={{ width: 52 }}>Fecha</th>
                    <th style={{ width: 118 }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movMes.slice(0, visibles).map(m => {
                    const esIngreso = m.tipo === 'ingreso';
                    const esTransferencia = m.tipo === 'transferencia';
                    const bNombre = billeteras.find(b => b.id === m.billeteraId)?.nombre ?? 'Cuenta';
                    const destino = billeteras.find(b => b.id === m.billeteraDestinoId)?.nombre ?? 'Otra cuenta';
                    const concepto = esTransferencia ? `${bNombre} → ${destino} · ${m.nota || ''}` : (m.descripcion || m.nota || m.categoria);
                    const d = new Date(m.creadoEn || new Date().toISOString());
                    const fechaStr = `${d.getDate()} ${MESES_ABREV[d.getMonth()].toLowerCase()}`;
                    
                    return (
                      <tr key={m.id}>
                        <td>{concepto}</td>
                        <td className="opc">{bNombre}</td>
                        <td className="opc2">{esTransferencia ? 'Sobres' : m.categoria}</td>
                        <td>{fechaStr}</td>
                        <td>
                          <span className={`pill num ${esTransferencia ? 'traslado' : esIngreso ? 'ingreso' : 'gasto'}`}>
                            {esTransferencia ? formatearCOP(m.monto) : esIngreso ? `+${formatearCOP(m.monto)}` : `−${formatearCOP(m.monto)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {movMes.length > visibles && (
                <button
                  type="button"
                  onClick={() => setVisibles(v => v + POR_PAGINA)}
                  className="link acento"
                  style={{ alignSelf: 'center', marginTop: 12 }}
                >
                  Ver {Math.min(POR_PAGINA, movMes.length - visibles)} más
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <ModalRegistrarMovimiento
        abierto={ingresoAbierto}
        billeteras={billeteras}
        tipoPreseleccionado="ingreso"
        onCerrar={() => setIngresoAbierto(false)}
        onGuardar={onRegistrarMovimiento}
      />
      <ModalAgregarBilletera
        abierto={creandoBilletera || billeteraEditando !== null}
        billeteraAEditar={billeteraEditando}
        onCerrar={() => { setCreandoBilletera(false); setBilleteraEditando(null); }}
        onGuardar={onGuardarBilletera}
      />
      {billeteraEditando && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`¿Eliminar la billetera "${billeteraEditando.nombre}"?`)) {
              onEliminarBilletera(billeteraEditando.id);
              setBilleteraEditando(null);
            }
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] px-4 py-2 rounded-full border border-alerta/40 bg-elevada text-alerta text-xs font-bold shadow-xl cursor-pointer"
        >
          Eliminar esta billetera
        </button>
      )}
    </div>
  );
};
