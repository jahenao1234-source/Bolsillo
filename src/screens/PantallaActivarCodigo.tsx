import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ClipboardPaste,
  MessageCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Boton } from '../components/ui/Boton';
import { Chip } from '../components/ui/Chip';
import { ConfetiCelebracion } from '../components/ui/ConfetiCelebracion';
import { validarCodigo } from '../logic/licencia';
import { setNivelAcceso, getDatosTermometro, guardarDeuda, getDeudas } from '../data/store';
import { NivelAcceso, Deuda } from '../types';

interface PantallaActivarCodigoProps {
  onVolver: () => void;
  onExito: () => void;
}

export const PantallaActivarCodigo: React.FC<PantallaActivarCodigoProps> = ({
  onVolver,
  onExito,
}) => {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exitoInfo, setExitoInfo] = useState<{
    nivel: NivelAcceso;
    mensaje: string;
  } | null>(null);

  const handlePegar = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const texto = await navigator.clipboard.readText();
        if (texto) {
          setCodigo(texto.trim().toUpperCase());
          setError(null);
        }
      }
    } catch {
      // Ignorar fallo de portapapeles si el navegador lo restringe
    }
  };

  const handleActivar = (codigoAProbar?: string) => {
    const clave = (codigoAProbar ?? codigo).trim().toUpperCase();
    if (!clave) {
      setError('Por favor ingresa un código de acceso.');
      return;
    }

    setCargando(true);
    setError(null);

    // Validación mediante la capa desacoplada
    setTimeout(() => {
      const resultado = validarCodigo(clave);

      if (resultado.valido && resultado.nivel) {
        // 1. Guardar en el store de la app
        setNivelAcceso(resultado.nivel);

        // 2. Si venía del termómetro y no hay deudas cargadas, precargar la deuda diagnosticada
        const datosTermometro = getDatosTermometro();
        const deudasExistentes = getDeudas();
        if (datosTermometro && deudasExistentes.length === 0) {
          const nuevaDeuda: Deuda = {
            id: `deuda-termometro-${Date.now()}`,
            nombre: 'Mi Deuda Principal (Termómetro)',
            tipo: datosTermometro.tipoInteres === 'no_se' ? 'prestamo' : (datosTermometro.tipoInteres as any),
            saldo: datosTermometro.deudaTotal,
            saldoTotal: datosTermometro.deudaTotal,
            montoOriginal: datosTermometro.deudaTotal,
            tasaMensual: datosTermometro.tasaMensual,
            pagoMinimo: datosTermometro.pagoMensual,
            proximoPagoMonto: datosTermometro.pagoMensual,
            proximaFechaPago: '15 próx. mes',
            saldada: false,
            creadoEn: new Date().toISOString(),
            entidad: 'Cargada desde diagnóstico',
          };
          guardarDeuda(nuevaDeuda);
        }

        setExitoInfo({
          nivel: resultado.nivel,
          mensaje: resultado.mensaje || '¡Bienvenido a Bolsillo!',
        });

        // Transición automática a la app completa tras la celebración
        setTimeout(() => {
          onExito();
        }, 2200);
      } else {
        setError(resultado.error || 'Código no válido. Revisa e intenta de nuevo.');
      }
      setCargando(false);
    }, 350);
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/57XXXXXXXXXX?text=Hola%2C%20necesito%20ayuda%20para%20adquirir%20mi%20c%C3%B3digo%20de%20Bolsillo', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-20 pt-2 max-w-lg mx-auto">
      {/* Celebración de Confeti */}
      <ConfetiCelebracion
        activo={Boolean(exitoInfo)}
        mensaje={exitoInfo ? '¡Bienvenido a Bolsillo!' : ''}
      />

      {/* Cabecera */}
      <div className="flex items-center gap-3 hairline-b pb-4">
        <button
          type="button"
          onClick={onVolver}
          className="p-2 rounded-xl bg-[var(--superficie)] border border-[var(--linea)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] cursor-pointer transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs font-semibold text-[color:var(--acento)] uppercase tracking-wider">
            Licencia & Acceso
          </span>
          <h1 className="text-xl font-bold font-display text-[color:var(--texto)]">
            Activar código
          </h1>
        </div>
      </div>

      {/* Pantalla de Éxito / Bienvenida */}
      {exitoInfo ? (
        <Tarjeta
          padding="lg"
          className="text-center py-10 space-y-4 border-[var(--positivo)]/40 bg-[var(--superficie-2)]"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--positivo)]/20 border border-[var(--positivo)]/40 flex items-center justify-center text-[color:var(--positivo)] shadow-sm animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-display text-[color:var(--positivo)]">
              ¡Bienvenido a Bolsillo!
            </h2>
            <p className="text-xs text-[color:var(--texto)] max-w-sm mx-auto leading-relaxed">
              {exitoInfo.mensaje}
            </p>
          </div>

          <div className="pt-2">
            <Boton
              variante="primario"
              anchoCompleto
              onClick={onExito}
            >
              Ingresar a Mi Dinero
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        /* Formulario de Entrada de Código */
        <div className="space-y-5">
          <Tarjeta padding="lg" className="space-y-5 border-[var(--linea)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--superficie-2)] text-[color:var(--acento)] border border-[var(--acento)]/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[color:var(--texto)]">
                  Código de activación
                </h2>
                <p className="text-xs text-[color:var(--texto-2)]">
                  Pega o escribe el código de 8 a 12 caracteres
                </p>
              </div>
            </div>

            {/* Input de Código */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleActivar();
                  }}
                  placeholder="EJ: DEUDACERO"
                  autoFocus
                  className="
                    w-full px-4 py-3.5 pr-12 rounded-xl bg-[var(--superficie-2)]
                    border border-[var(--linea)] focus:border-[var(--acento)]
                    text-[color:var(--texto)] font-mono text-center text-lg font-bold
                    tracking-widest uppercase focus:outline-none transition-colors
                  "
                />

                <button
                  type="button"
                  onClick={handlePegar}
                  title="Pegar del portapapeles"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[color:var(--texto-2)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie)] transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="p-3 rounded-xl bg-[var(--alerta)]/15 border border-[var(--alerta)]/30 flex items-center gap-2.5 text-xs text-[color:var(--alerta)]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Botón Activar */}
            <Boton
              variante="platino"
              anchoCompleto
              tamano="lg"
              disabled={cargando}
              onClick={() => handleActivar()}
              className="py-3.5"
            >
              {cargando ? 'Verificando licencia...' : 'Activar mi código'}
            </Boton>
          </Tarjeta>

          {/* Ayuda de prueba rápida (Para testing y evaluación) */}
          <div className="p-4 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)] space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
              <Zap className="w-3.5 h-3.5 text-[color:var(--acento)]" />
              <span>Códigos de prueba disponibles:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCodigo('DEUDACERO');
                  handleActivar('DEUDACERO');
                }}
                className="p-2.5 rounded-lg bg-[var(--superficie)] hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-left flex flex-col cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[color:var(--positivo)]">DEUDACERO</span>
                  <Chip variante="platino">Entrada</Chip>
                </div>
                <span className="text-[10px] text-[color:var(--texto-2)] mt-0.5">
                  Deuda Cero + Mi Dinero
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodigo('BOLSILLOPRO');
                  handleActivar('BOLSILLOPRO');
                }}
                className="p-2.5 rounded-lg bg-[var(--superficie)] hover:bg-[var(--superficie-2)] border border-[var(--linea)] text-left flex flex-col cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[color:var(--acento)]">BOLSILLOPRO</span>
                  <Chip variante="platino">Pro Total</Chip>
                </div>
                <span className="text-[10px] text-[color:var(--texto-2)] mt-0.5">
                  Todo desbloqueado + Billeteras
                </span>
              </button>
            </div>
          </div>

          {/* Enlace secundario WhatsApp */}
          <div className="pt-2 text-center space-y-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 text-xs text-[color:var(--texto-2)] hover:text-[color:var(--positivo)] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[color:var(--positivo)]" />
              <span>¿Aún no tienes acceso? Escríbenos por WhatsApp</span>
            </button>
            <p className="text-[11px] text-[color:var(--texto-3)]">
              Te atendemos en minutos con medios de pago locales (Nequi, Bancolombia, PSE).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
