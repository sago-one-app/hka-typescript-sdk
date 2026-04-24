export class RucDvCalculator {
  /**
   * Calcula el Dígito Verificador (DV) para un RUC panameño usando el algoritmo
   * Módulo 11 oficial de la DGI.
   *
   * @param ruc El número de RUC sin el DV (ej. '155596713-2-2015')
   * @returns El Dígito Verificador calculado como string de 2 dígitos.
   */
  static calculateDV(ruc: string): string {
    // Eliminar guiones y letras, quedarse solo con números
    const cleanRuc = ruc.replace(/[^0-9]/g, '');
    
    if (!cleanRuc) return '00';

    let sum = 0;
    let weight = 2;

    // Se procesa de derecha a izquierda
    for (let i = cleanRuc.length - 1; i >= 0; i--) {
      sum += parseInt(cleanRuc[i], 10) * weight;
      weight++;
      if (weight > 7) {
        weight = 2;
      }
    }

    const rest = sum % 11;
    let dv = 11 - rest;

    // Reglas de ajuste final del DV
    if (dv === 11) dv = 0;
    if (dv === 10) dv = 1;

    // El DV siempre debe tener 2 dígitos (padded)
    return dv.toString().padStart(2, '0');
  }
}
