import React, { useState, useMemo, useEffect } from 'react';
import { Presupuesto, Sobre, RetoAhorro, Suscripcion, TarjetaCredito, Billetera, Movimiento, Deuda } from '../types';
import { historial } from '../logic/reportes';
import { cicloDe, montoVigente } from '../logic/suscripciones';
import { mejorTarjetaHoy } from '../logic/tarjetas';
import { formatearCOP } from '../utils/format';
import { aporteDeSemana } from '../logic/retos';
import { MESES_ABREV } from '../utils/fechas';
import { PantallaPresupuesto } from './PantallaPresupuesto';
import { PantallaSobres } from './PantallaSobres';
import { PantallaRetos } from './PantallaRetos';
import { PantallaSuscripciones } from './PantallaSuscripciones';
import { PantallaTarjetas } from './PantallaTarjetas';
import { PantallaReportes } from './PantallaReportes';

interface PantallaCrecerProps {
  resetToken?: number;
  usuario: string;
  presupuestos: Presupuesto[];
  gastoPorCategoria: Record<string, number>;
  ingresoMensual: number;
  billeteras: Billetera[];
  onGuardarPresupuesto: (p: Presupuesto) => void;
  onEliminarPresupuesto: (categoria: string) => void;
  onRegistrarMovimiento: (mov: Omit<Movimiento, 'id'>) => void;
  sobres: Sobre[];
  totalApartado: number;
  saldoTotal: number;
  onGuardarSobre: (sobre: Sobre) => void;
  onEliminarSobre: (id: string) => void;
  retos: RetoAhorro[];
  onGuardarReto: (reto: RetoAhorro) => void;
  onEliminarReto: (id: string) => void;
  onAportarReto: (id: string) => { exito: boolean; aporte: number; completado: boolean; acumulado: number };
  suscripciones: Suscripcion[];
  sangradoMensual: number;
  onGuardarSuscripcion: (sus: Suscripcion) => void;
  onEliminarSuscripcion: (id: string) => void;
  tarjetas: TarjetaCredito[];
  deudas: Deuda[];
  onAbonarDeuda: (deudaId: string, billeteraId: string, monto: number) => { exito: boolean; deudaSaldada: boolean };
  movimientos: Movimiento[];
  disponibleMensual: number;
  onGuardarTarjeta: (tc: TarjetaCredito) => void;
  onEliminarTarjeta: (id: string) => void;
}

type Modulo = 'hub' | 'presupuesto' | 'sobres' | 'retos' | 'suscripciones' | 'tarjetas' | 'reportes';

export const PantallaCrecer: React.FC<PantallaCrecerProps> = (props) => {
  const {
    usuario,
    presupuestos,
    gastoPorCategoria,
    ingresoMensual,
    billeteras,
    onGuardarPresupuesto,
    onEliminarPresupuesto,
    onRegistrarMovimiento,
    sobres,
    totalApartado,
    saldoTotal,
    onGuardarSobre,
    onEliminarSobre,
    retos,
    onGuardarReto,
    onEliminarReto,
    onAportarReto,
    suscripciones,
    sangradoMensual,
    onGuardarSuscripcion,
    onEliminarSuscripcion,
    tarjetas,
    onGuardarTarjeta,
    onEliminarTarjeta,
  } = props;

  const [modulo, setModulo] = useState<Modulo>('hub');

  useEffect(() => {
    setModulo('hub');
  }, [props.resetToken]);

  const hoy = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const resumenRetos = useMemo(() => {
    const activos = retos.filter((r) => !r.completado).length;
    return { activos };
  }, [retos]);

  const retoActivo = useMemo(() => retos.find((r) => !r.completado) ?? null, [retos]);

  const proximosCobros = useMemo(
    () =>
      suscripciones
        .filter((s) => s.activa)
        .map((s) => ({ sus: s, ciclo: cicloDe(s, hoy), monto: montoVigente(s, hoy) }))
        .sort((a, b) => a.ciclo.faltan - b.ciclo.faltan)
        .slice(0, 4),
    [suscripciones, hoy]
  );

  const mejorTarjeta = useMemo(() => mejorTarjetaHoy(tarjetas, hoy), [tarjetas, hoy]);

  const entradaCierre = useMemo(
    () => ({
      movimientos: props.movimientos,
      retos,
      deudas: props.deudas,
      suscripciones,
      disponibleMensual: props.disponibleMensual,
      esPro: true,
    }),
    [props.movimientos, retos, props.deudas, suscripciones, props.disponibleMensual]
  );

  const cierres = useMemo(() => historial(entradaCierre, hoy, 6), [entradaCierre, hoy]);
  const cerrados = useMemo(() => cierres.filter((c) => !c.enCurso), [cierres]);
  const ultimoCierre = cerrados[cerrados.length - 1] ?? null;

  if (modulo === 'presupuesto') {
    return (
      <PantallaPresupuesto
        presupuestos={presupuestos}
        gastoPorCategoria={gastoPorCategoria}
        ingresoMensual={ingresoMensual}
        billeteras={billeteras}
        onGuardarPresupuesto={onGuardarPresupuesto}
        onEliminarPresupuesto={onEliminarPresupuesto}
        onRegistrarMovimiento={onRegistrarMovimiento}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'sobres') {
    return (
      <PantallaSobres
        sobres={sobres}
        totalApartado={totalApartado}
        saldoTotal={saldoTotal}
        onGuardarSobre={onGuardarSobre}
        onEliminarSobre={onEliminarSobre}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'retos') {
    return (
      <PantallaRetos
        retos={retos}
        ingresoMensual={ingresoMensual}
        onGuardarReto={onGuardarReto}
        onEliminarReto={onEliminarReto}
        onAportarReto={onAportarReto}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'suscripciones') {
    return (
      <PantallaSuscripciones
        suscripciones={suscripciones}
        sangradoMensual={sangradoMensual}
        billeteras={billeteras}
        ingresoMensual={ingresoMensual}
        onGuardarSuscripcion={onGuardarSuscripcion}
        onEliminarSuscripcion={onEliminarSuscripcion}
        onRegistrarMovimiento={onRegistrarMovimiento}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'tarjetas') {
    return (
      <PantallaTarjetas
        tarjetas={tarjetas}
        deudas={props.deudas}
        billeteras={billeteras}
        onAbonarDeuda={props.onAbonarDeuda}
        onGuardarTarjeta={onGuardarTarjeta}
        onEliminarTarjeta={onEliminarTarjeta}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  if (modulo === 'reportes') {
    return (
      <PantallaReportes
        movimientos={props.movimientos}
        deudas={props.deudas}
        retos={retos}
        suscripciones={suscripciones}
        disponibleMensual={props.disponibleMensual}
        usuario={usuario}
        onVolver={() => setModulo('hub')}
      />
    );
  }

  type Grupo = {
    titulo: string;
    descripcion: string;
    herramientas: {
      id: Modulo;
      nombre: string;
      cifra: string;
      unidad: string;
      detalle: string;
      chip?: { texto: string; clase: string };
    }[];
  };

  const grupos: Grupo[] = [
    {
      titulo: 'Controlar el mes',
      descripcion: 'Que lo del mes alcance y no se vaya en cobros que no usas.',
      herramientas: [
        {
          id: 'suscripciones' as Modulo,
          nombre: 'Suscripciones',
          cifra: formatearCOP(sangradoMensual),
          unidad: 'al mes',
          detalle: proximosCobros[0]
            ? `${proximosCobros[0].sus.nombre} cobra ${formatearCOP(proximosCobros[0].monto)} el ${proximosCobros[0].ciclo.fin.getDate()} ${MESES_ABREV[proximosCobros[0].ciclo.fin.getMonth()].toLowerCase()}`
            : 'Anota lo que te cobran solo cada mes',
          chip: proximosCobros[0] && proximosCobros[0].ciclo.faltan <= 3
            ? {
                texto: proximosCobros[0].ciclo.esFinDePromo
                  ? `Se acaba la promo en ${proximosCobros[0].ciclo.faltan} días`
                  : proximosCobros[0].ciclo.faltan === 0
                  ? 'Cobra hoy'
                  : proximosCobros[0].ciclo.faltan === 1
                  ? 'Cobra mañana'
                  : `Cobra en ${proximosCobros[0].ciclo.faltan} días`,
                clase: 'aviso',
              }
            : undefined,
        },
      ],
    },
    {
      titulo: 'Protegerme',
      descripcion: 'Que las deudas no vuelvan y el banco no te cobre de más.',
      herramientas: [
        {
          id: 'tarjetas' as Modulo,
          nombre: 'Tarjetas',
          cifra: String(tarjetas.length),
          unidad: tarjetas.length === 1 ? 'tarjeta' : 'tarjetas',
          detalle: mejorTarjeta
            ? `Hoy conviene ${mejorTarjeta.tc.nombre}: pagas en ${mejorTarjeta.plazo.dias} días sin intereses`
            : 'Anota tus fechas de corte y pago',
        },
      ],
    },
    {
      titulo: 'Crecer',
      descripcion: 'Que tu plata trabaje y adelante tu retiro.',
      herramientas: [
        {
          id: 'retos' as Modulo,
          nombre: 'Retos',
          cifra: String(resumenRetos.activos),
          unidad: 'activos',
          detalle: retoActivo
            ? `${retoActivo.nombre} · semana ${retoActivo.semanaActual} de ${retoActivo.semanasTotales} · llevas ${formatearCOP(retoActivo.acumulado)}`
            : 'Empieza un reto de ahorro',
          chip: retoActivo
            ? { texto: `Aporta ${formatearCOP(aporteDeSemana(retoActivo, retoActivo.semanaActual))}`, clase: 'acento' }
            : undefined,
        },
      ],
    },
    {
      titulo: 'Ver cómo voy',
      descripcion: 'El cierre de cada mes.',
      herramientas: [
        {
          id: 'reportes' as Modulo,
          nombre: 'Reportes',
          cifra: ultimoCierre ? formatearCOP(ultimoCierre.queda) : '—',
          unidad: ultimoCierre ? `sobró en ${ultimoCierre.etiqueta.toLowerCase()}` : '',
          detalle: ultimoCierre
            ? `Cierre de ${ultimoCierre.etiquetaLarga || ultimoCierre.etiqueta} listo`
            : 'Con un mes cerrado aparece tu primer reporte',
        },
      ],
    },
  ];

  const conChip = grupos.flatMap((g) => g.herramientas).filter((h) => h.chip).length;

  return (
    <div className="pant">
      <div className="cab">
        <div>
          <h1>Herramientas</h1>
          <p>
            Agrupadas por lo que te resuelven.
            {conChip > 0 && (
              <> <b>{conChip}</b> te {conChip === 1 ? 'pide' : 'piden'} algo esta semana.</>
            )}
          </p>
        </div>
      </div>

      <div className="rejilla llena" style={{ '--cols': 'minmax(0,0.6fr) minmax(0,1fr) minmax(0,1fr)' } as React.CSSProperties}>
        {grupos.map((g) => (
          <React.Fragment key={g.titulo}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, minWidth: 0 }}>
              <h2 className="titulo">{g.titulo}</h2>
              <p className="nota solo-escritorio" style={{ margin: 0 }}>{g.descripcion}</p>
            </div>

            {g.herramientas.length === 2 ? (
              <div className="par ancho-2" style={{ gap: 14 }}>
                {g.herramientas.map((h) => (
                  <div
                    key={h.id}
                    className="panel"
                    role="link"
                    tabIndex={0}
                    onClick={() => setModulo(h.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setModulo(h.id)}
                    style={{ height: '100%', cursor: 'pointer' }}
                  >
                    <div className="panel-cab" style={{ flexWrap: 'wrap' }}>
                      <b>{h.nombre}</b>
                      {h.chip && <span className={`chip ${h.chip.clase}`}>{h.chip.texto}</span>}
                    </div>
                    <div>
                      <span className="cifra-m">{h.cifra}</span> <span className="de">{h.unidad}</span>
                    </div>
                    <div className="fila solo-escritorio" style={{ marginTop: 'auto' }}>
                      <span className="nota">{h.detalle}</span>
                      <span className="link acento">Abrir →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ancho-2">
                {g.herramientas.map((h) => (
                  <div
                    key={h.id}
                    className="panel"
                    role="link"
                    tabIndex={0}
                    onClick={() => setModulo(h.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setModulo(h.id)}
                    style={{ height: '100%', cursor: 'pointer' }}
                  >
                    <div className="panel-cab" style={{ flexWrap: 'wrap' }}>
                      <b>{h.nombre}</b>
                      {h.chip && <span className={`chip ${h.chip.clase}`}>{h.chip.texto}</span>}
                    </div>
                    <div>
                      <span className="cifra-m">{h.cifra}</span> <span className="de">{h.unidad}</span>
                    </div>
                    <div className="fila solo-escritorio" style={{ marginTop: 'auto' }}>
                      <span className="nota">{h.detalle}</span>
                      <span className="link acento">Abrir →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};