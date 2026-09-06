/**
 * Bolsillo - Registro de la Línea de Victorias
 * Almacena los hitos de deudas liquidadas y metas financieras alcanzadas
 */

export interface Victoria {
  id: string;
  titulo: string;
  descripcion: string;
  monto: number;
  fecha: string; // ej: "15 Sep 2026"
  tipo: 'deuda_saldada' | 'meta_alcanzada' | 'abono_importante';
}

const STORAGE_KEY_VICTORIAS = 'bolsillo:linea_victorias';

const VICTORIAS_INICIALES: Victoria[] = [
  {
    id: 'vic-1',
    titulo: 'Fiado tienda doña Rosa',
    descripcion: 'Obligación liquidada al 100% con abono final.',
    monto: 130000,
    fecha: '15 Ago 2026',
    tipo: 'deuda_saldada',
  },
];

export function getVictorias(): Victoria[] {
  if (typeof window === 'undefined') return VICTORIAS_INICIALES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VICTORIAS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback a lista inicial
  }
  return VICTORIAS_INICIALES;
}

export function registrarVictoria(
  datos: Omit<Victoria, 'id' | 'fecha'> & { fecha?: string }
): Victoria {
  const actuales = getVictorias();
  
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const hoy = new Date();
  const fechaFormateada = datos.fecha || `${hoy.getDate()} ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

  const nueva: Victoria = {
    id: `vic-${Date.now()}`,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fecha: fechaFormateada,
    tipo: datos.tipo,
  };

  const actualizadas = [nueva, ...actuales];
  try {
    localStorage.setItem(STORAGE_KEY_VICTORIAS, JSON.stringify(actualizadas));
    window.dispatchEvent(new CustomEvent('bolsillo:victorias_actualizadas'));
  } catch {
    // Manejo de cuota o restricción de storage
  }

  return nueva;
}
