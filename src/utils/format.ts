/**
 * Formateo de moneda y datos para Colombia (COP)
 * Ejemplo: $8.500.000 con puntos de miles.
 */

/**
 * Formatea un número como pesos colombianos sin decimales y con puntos de miles.
 * Ej: 1240000 -> "$1.240.000"
 *     -210000 -> "-$210.000"
 */
export function formatearCOP(valor: number): string {
  const esNegativo = valor < 0;
  const entero = Math.round(Math.abs(valor));
  // Separador de miles con punto
  const partes = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return esNegativo ? `-$${partes}` : `$${partes}`;
}

/**
 * Helper unificado solicitado para pesos colombianos:
 * formatearPeso(1240000) -> "$1.240.000"
 */
export const formatearPeso = formatearCOP;

/**
 * Formato compacto para cifras cuando el espacio es reducido (ej: $1,2M o $850k)
 */
export function formatearCOPCorto(valor: number): string {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) {
    const millones = (abs / 1_000_000).toFixed(1).replace('.', ',');
    return `${valor < 0 ? '-' : ''}$${millones}M`;
  }
  if (abs >= 1_000) {
    const miles = Math.round(abs / 1_000);
    return `${valor < 0 ? '-' : ''}$${miles}k`;
  }
  return formatearCOP(valor);
}

/**
 * Formatea porcentajes enteros o con un decimal
 * Ej: 68 -> "68%"
 */
export function formatearPorcentaje(porcentaje: number): string {
  return `${Math.round(porcentaje)}%`;
}
