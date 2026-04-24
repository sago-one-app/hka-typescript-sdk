import { DocumentoElectronico } from '../types/document.types';
import { EMISSION_TYPES } from '../catalogs/emission-types';

export class ContingencyValidator {
  static validate(doc: DocumentoElectronico): void {
    const trx = doc.datosTransaccion;

    if (
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_PREVIA_CONTINGENCIA ||
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_POSTERIOR_CONTINGENCIA
    ) {
      // It's contingency. Requires reason and start date.
      // We don't have these exact fields in the DatosTransaccion root, 
      // wait, let's check `datosTransaccion` schema. They were missing from the schema.
      // Wait, let's fix the schema later, or assume they are there as any for now to avoid errors, 
      // then we'll update the schema.
      const anyTrx = trx as any;

      if (!anyTrx.fechaInicioContingencia || !anyTrx.motivoContingencia) {
        throw new Error(
          `Para tipoEmision "${trx.tipoEmision}" (Contingencia), fechaInicioContingencia y motivoContingencia son obligatorios.`
        );
      }

      if (anyTrx.motivoContingencia.length < 15 || anyTrx.motivoContingencia.length > 250) {
        throw new Error(`motivoContingencia debe tener entre 15 y 250 caracteres.`);
      }
    }
  }
}
