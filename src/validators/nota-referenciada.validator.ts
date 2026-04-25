const MAX_DIAS = 180;

export class NotaReferenciadaValidator {
  /**
   * Verifica que no hayan transcurrido más de 180 días desde la fecha de emisión del
   * documento original referenciado. La DGI rechaza NC/ND referenciadas fuera de ese plazo.
   *
   * @param fechaEmisionOriginal ISO 8601 con timezone (ej. '2023-01-15T10:00:00-05:00')
   */
  static validatePlazo(fechaEmisionOriginal: string): void {
    const emision = new Date(fechaEmisionOriginal);

    if (isNaN(emision.getTime())) {
      throw new Error(
        `fechaEmisionDocFiscalReferenciado inválida: "${fechaEmisionOriginal}". Use formato ISO 8601 con timezone.`
      );
    }

    const ahora = new Date();
    const diferenciaDias = (ahora.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24);

    if (diferenciaDias > MAX_DIAS) {
      throw new Error(
        `Han transcurrido ${Math.floor(diferenciaDias)} días desde la emisión del documento referenciado. ` +
        `Las Notas de Crédito/Débito referenciadas solo pueden emitirse dentro de los ${MAX_DIAS} días ` +
        `posteriores a la factura original. Para reversar documentos más antiguos, utilice la DGI directamente.`
      );
    }
  }
}
