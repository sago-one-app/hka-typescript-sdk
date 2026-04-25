import { DocumentoElectronico } from '../types/document.types';
import { EMISSION_TYPES } from '../catalogs/emission-types';

export class ContingencyValidator {
  static validate(doc: DocumentoElectronico): void {
    const trx = doc.datosTransaccion;

    if (
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_PREVIA_CONTINGENCIA ||
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_POSTERIOR_CONTINGENCIA
    ) {
      if (!trx.fechaInicioContingencia || !trx.motivoContingencia) {
        throw new Error(
          `Para tipoEmision "${trx.tipoEmision}" (Contingencia), fechaInicioContingencia y motivoContingencia son obligatorios.`
        );
      }

      if (trx.motivoContingencia.length < 15 || trx.motivoContingencia.length > 250) {
        throw new Error(`motivoContingencia debe tener entre 15 y 250 caracteres.`);
      }
    }

    // Autorización de uso posterior requiere usoPosterior con el CUFE previo
    if (
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_POSTERIOR_NORMAL ||
      trx.tipoEmision === EMISSION_TYPES.AUTORIZACION_POSTERIOR_CONTINGENCIA
    ) {
      if (!doc.usoPosterior) {
        throw new Error(
          `Para tipoEmision "${trx.tipoEmision}" (Uso Posterior), la sección 'usoPosterior' con el CUFE previo es obligatoria.`
        );
      }
    }
  }
}
