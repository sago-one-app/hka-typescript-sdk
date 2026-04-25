const MAX_DIAS_ANULACION = 7;

export class AnulacionValidator {
  /**
   * Verifica que no hayan transcurrido más de 7 días continuos desde la fecha de emisión.
   * La DGI rechaza anulaciones fuera de este plazo; en ese caso se debe usar Nota de Crédito.
   *
   * @param fechaEmision Fecha de emisión del documento en formato ISO 8601 (ej. "2022-07-15T07:49:27-05:00")
   */
  static validatePlazo(fechaEmision: string): void {
    const emision = new Date(fechaEmision);

    if (isNaN(emision.getTime())) {
      throw new Error(`fechaEmision inválida: "${fechaEmision}". Use formato ISO 8601 con timezone.`);
    }

    const ahora = new Date();
    const diferenciaDias = (ahora.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24);

    if (diferenciaDias > MAX_DIAS_ANULACION) {
      throw new Error(
        `Han transcurrido ${Math.floor(diferenciaDias)} días desde la emisión. ` +
        `La anulación solo está permitida dentro de los primeros ${MAX_DIAS_ANULACION} días. ` +
        `Use una Nota de Crédito para reversar este documento.`
      );
    }
  }
}
