import React, { useState, useEffect } from 'react';
import {
  User,
  Sparkles,
  ShieldCheck,
  Moon,
  Sun,
  Globe2,
  MessageCircle,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Trophy,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Tarjeta } from '../components/ui/Tarjeta';
import { Chip } from '../components/ui/Chip';
import { PWAInstallButton } from '../components/ui/PWAInstallButton';
import { NivelAcceso } from '../types';
import { restablecerDatosEjemplo, setNivelAcceso, setNombreUsuario } from '../data/store';
import { useTema } from '../utils/theme';
import { getVictorias, Victoria } from '../utils/victorias';
import { Marco, Columna, Zona, Scroll } from '../components/layout/Marco';
import { BarraTitulo } from '../components/layout/shell';
import { formatearCOP } from '../utils/format';

interface PantallaPerfilProps {
  usuario: string;
  nivelAcceso: NivelAcceso;
  onNavegarPro: () => void;
  onAbrirActivarCodigo: () => void;
}

export const PantallaPerfil: React.FC<PantallaPerfilProps> = ({
  usuario,
  nivelAcceso,
  onNavegarPro,
  onAbrirActivarCodigo,
}) => {
  const { tema, cambiarTema, esPapel } = useTema();
  const [victorias, setVictorias] = useState<Victoria[]>(getVictorias);
  const [restablecido, setRestablecido] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreTmp, setNombreTmp] = useState(usuario);

  const guardarNombre = () => {
    const n = nombreTmp.trim();
    if (n) setNombreUsuario(n);
    setEditandoNombre(false);
  };

  useEffect(() => {
    const handleVictorias = () => {
      setVictorias(getVictorias());
    };
    window.addEventListener('bolsillo:victorias_actualizadas', handleVictorias);
    return () => window.removeEventListener('bolsillo:victorias_actualizadas', handleVictorias);
  }, []);

  const handleRestablecer = () => {
    restablecerDatosEjemplo();
    setRestablecido(true);
    setTimeout(() => setRestablecido(false), 3000);
  };

  const enlaceWhatsApp = 'https://wa.me/573001234567?text=Hola%20Bolsillo,%20quiero%20hacer%20una%20consulta';

  return (
    <div className="w-full pb-24 xl:pb-0 animate-screen-enter xl:flex-1 xl:flex xl:flex-col xl:gap-2.5">
      {/* ===================== Barra de contexto (escritorio) ===================== */}
      <BarraTitulo>
        <h1 className="font-display font-bold text-[15.5px] text-[color:var(--texto)]">Perfil</h1>
        <span className="w-px h-4 bg-[var(--linea)]" />
        <Chip variante={nivelAcceso === 'pro' ? 'aqua' : 'neutro'}>
          {nivelAcceso === 'pro' ? '✦ Bolsillo Pro · vitalicio' : 'Plan Deuda Cero'}
        </Chip>
      </BarraTitulo>

      {/* ===================== Cabecera de móvil ===================== */}
      <header className="md:hidden pt-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-[color:var(--texto)]">
          Perfil
        </h1>
      </header>

      <Marco columnas="420px minmax(0,1fr)">
        {/* ---------- Columna 1: quién eres y tus victorias ---------- */}
        <Columna ordenMovil={1} borde>
          <Zona>
            <div className="p-5 rounded-3xl bg-[var(--superficie)] border border-[var(--linea)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)] flex items-center justify-center font-display font-black text-base text-[color:var(--texto)] flex-shrink-0">
                  {(usuario || '?').slice(0, 2).toUpperCase()}
                </div>

                {editandoNombre ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); guardarNombre(); }}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <input
                      autoFocus
                      value={nombreTmp}
                      onChange={(e) => setNombreTmp(e.target.value)}
                      placeholder="Tu nombre"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[var(--superficie-2)] border border-[var(--acento)] text-sm font-semibold text-[color:var(--texto)] focus:outline-none"
                    />
                    <button type="submit" className="p-2 rounded-lg bg-[var(--acento)]/15 text-[color:var(--acento)] cursor-pointer" aria-label="Guardar nombre">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditandoNombre(false)} className="p-2 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] cursor-pointer" aria-label="Cancelar">
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-bold text-[color:var(--texto)] truncate">
                        {usuario}
                      </h2>
                      <p className="text-xs text-[color:var(--texto-2)]">
                        {nivelAcceso === 'pro' ? 'Bolsillo Pro · Acceso vitalicio' : 'Plan Deuda Cero'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setNombreTmp(usuario); setEditandoNombre(true); }}
                      className="p-1.5 rounded-lg text-[color:var(--texto-3)] hover:text-[color:var(--texto)] hover:bg-[var(--superficie-2)] transition-colors cursor-pointer flex-shrink-0"
                      aria-label="Editar nombre"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {!editandoNombre && (
                <Chip
                  variante={nivelAcceso === 'pro' ? 'platino' : 'aqua'}
                  icono={<Sparkles className="w-3.5 h-3.5" />}
                >
                  {nivelAcceso === 'pro' ? 'Pro' : 'Activo'}
                </Chip>
              )}
            </div>
          </Zona>

          <Zona crece sinPadding>
            <div className="p-4 xl:px-[17px] xl:pt-[13px] xl:pb-1">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[color:var(--acento)]" />
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
                      Línea de victorias
                    </h3>
                  </div>
                  <span className="text-xs text-[color:var(--texto-3)] font-medium">
                    {victorias.length} {victorias.length === 1 ? 'logro' : 'logros'}
                  </span>
                </div>

                {victorias.length > 0 ? (
                  <div className="space-y-2.5">
                    {victorias.map((v) => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] flex items-start gap-3.5"
                      >
                        <div className="p-2 rounded-xl bg-[var(--positivo)]/12 text-[color:var(--positivo)] shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-bold text-[color:var(--texto)] truncate">
                              {v.titulo}
                            </p>
                            <span className="text-[11px] text-[color:var(--texto-3)] shrink-0 font-medium">
                              {v.fecha}
                            </span>
                          </div>
                          <p className="text-xs text-[color:var(--texto-2)] mt-0.5 leading-snug">
                            {v.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)] text-center text-xs text-[color:var(--texto-2)]">
                    Aquí aparecerán las deudas que vayas liquidando paso a paso.
                  </div>
                )}
              </div>
            </div>
          </Zona>

          {nivelAcceso !== 'pro' ? (
            <div
              onClick={onNavegarPro}
              className="p-5 sm:p-6 rounded-3xl bg-[var(--superficie-2)] border border-[var(--acento)]/30 hover:border-[var(--acento)] cursor-pointer transition-all duration-200 group"
              role="button"
              tabIndex={0}
              aria-label="Conocer Bolsillo Pro"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[color:var(--acento)] bg-[var(--superficie)] border border-[var(--linea)]">
                  <Sparkles className="w-3.5 h-3.5" /> Bolsillo Pro
                </span>
                <div className="p-1 rounded-full text-[color:var(--acento)] group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <h4 className="font-display text-lg sm:text-xl font-bold text-[color:var(--texto)] mb-1">
                Haz que tu plata trabaje para ti
              </h4>
              <p className="text-xs sm:text-sm text-[color:var(--texto-2)] leading-relaxed">
                Presupuesto inteligente, sobres para lo intocable, retos de ahorro y fechas de corte optimizadas. Pago único y tus datos en tu teléfono.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[var(--superficie)] border border-[var(--linea)] flex items-center gap-3 text-xs text-[color:var(--texto-2)]">
              <ShieldCheck className="w-4 h-4 text-[color:var(--positivo)] shrink-0" />
              <span>Tienes activo Bolsillo Pro de por vida. Todas las funciones están desbloqueadas.</span>
            </div>
          )}

          {/* ========================================================= */}
        </Columna>

        {/* ---------- Columna 2: lo que puedes cambiar ---------- */}
        <Columna ordenMovil={2}>
          <Zona crece sinPadding>
            <Scroll className="p-4 xl:px-[17px] xl:py-[13px]">
              <div className="space-y-3">
                <h3 className="px-1 font-display text-sm font-bold uppercase tracking-wider text-[color:var(--texto-2)]">
                  Ajustes
                </h3>

                <div className="rounded-3xl bg-[var(--superficie)] border border-[var(--linea)] divide-y divide-[var(--linea)] overflow-hidden">
                  {/* Selector de Tema */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        {esPapel ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Tema visual</p>
                        <p className="text-xs text-[color:var(--texto-3)]">
                          {esPapel ? 'Claro' : 'Oscuro'}
                        </p>
                      </div>
                    </div>

                    {/* Interruptor de 2 opciones */}
                    <div className="flex items-center p-1 rounded-xl bg-[var(--superficie-2)] border border-[var(--linea)]">
                      <button
                        type="button"
                        onClick={() => cambiarTema('medianoche')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          !esPapel
                            ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-xs font-semibold'
                            : 'text-[color:var(--texto-3)] hover:text-[color:var(--texto)]'
                        }`}
                      >
                        Oscuro
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarTema('papel')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          esPapel
                            ? 'bg-[var(--superficie)] text-[color:var(--texto)] shadow-xs font-semibold'
                            : 'text-[color:var(--texto-3)] hover:text-[color:var(--texto)]'
                        }`}
                      >
                        Claro
                      </button>
                    </div>
                  </div>

                  {/* Región e idioma */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        <Globe2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Región y moneda</p>
                        <p className="text-xs text-[color:var(--texto-3)]">Español (Colombia) &bull; COP ($)</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--superficie-2)] text-[color:var(--texto-2)] border border-[var(--linea)]">
                      es-CO
                    </span>
                  </div>

                  {/* Activar Código */}
                  <button
                    type="button"
                    onClick={onAbrirActivarCodigo}
                    className="w-full p-4 flex items-center justify-between gap-4 hover:bg-[var(--superficie-2)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Activar clave de acceso</p>
                        <p className="text-xs text-[color:var(--texto-3)]">Ingresar código de licencia de por vida</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[color:var(--texto-3)]" />
                  </button>

                  {/* Comunidad y soporte WhatsApp */}
                  <a
                    href={enlaceWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 flex items-center justify-between gap-4 hover:bg-[var(--superficie-2)] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Comunidad y soporte</p>
                        <p className="text-xs text-[color:var(--texto-3)]">Escríbenos por WhatsApp si necesitas ayuda</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[color:var(--texto-3)]" />
                  </a>

                  {/* Instalar App (PWA) */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Instalar aplicación</p>
                        <p className="text-xs text-[color:var(--texto-3)]">Funciona offline directo desde tu inicio</p>
                      </div>
                    </div>
                    <PWAInstallButton />
                  </div>

                  {/* Restablecer datos de ejemplo */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--superficie-2)] text-[color:var(--texto-2)]">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--texto)]">Restablecer datos</p>
                        <p className="text-xs text-[color:var(--texto-3)]">Reinicia los saldos y deudas a la plantilla inicial</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRestablecer}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--linea)] hover:bg-[var(--superficie-2)] text-[color:var(--texto-2)] hover:text-[color:var(--texto)] transition-colors cursor-pointer"
                    >
                      {restablecido ? 'Restablecido' : 'Restablecer'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--superficie-2)] border border-[var(--linea)] text-center space-y-1">
                <p className="text-xs font-semibold text-[color:var(--texto)]">
                  Bolsillo v2 &bull; Privacidad total
                </p>
                <p className="text-[11px] text-[color:var(--texto-3)] max-w-sm mx-auto leading-relaxed">
                  Tus datos viven en tu teléfono, no vemos tus cuentas ni compartimos tu información financiera.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-[color:var(--texto-3)]">
                <span>Nivel de prueba:</span>
                <button
                  type="button"
                  onClick={() => setNivelAcceso('entrada')}
                  className={`px-2 py-0.5 rounded border ${
                    nivelAcceso === 'entrada' ? 'border-[var(--linea)] bg-[var(--superficie)] text-[color:var(--texto)]' : 'border-transparent text-[color:var(--texto-3)]'
                  }`}
                >
                  Deuda Cero
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => setNivelAcceso('pro')}
                  className={`px-2 py-0.5 rounded border ${
                    nivelAcceso === 'pro' ? 'border-[var(--linea)] bg-[var(--superficie)] text-[color:var(--texto)]' : 'border-transparent text-[color:var(--texto-3)]'
                  }`}
                >
                  Pro
                </button>
              </div>
            </Scroll>
          </Zona>
        </Columna>
      </Marco>
    </div>
  );
};