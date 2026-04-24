import { Cliente } from '../types/client.types';
import { CLIENT_TYPES } from '../catalogs/client-types';
import { CONTRIBUTOR_TYPES } from '../catalogs/contributor-types';

export class ClientValidator {
  /**
   * Validates cross-field rules for a Cliente object.
   * Throws an Error with a specific message if a rule is violated.
   */
  static validate(cliente: Cliente, destinoOperacion: string): void {
    // Regla 4.1.A - Jurídico siempre es Contribuyente
    if (
      cliente.tipoContribuyente === CONTRIBUTOR_TYPES.JURIDICO &&
      cliente.tipoClienteFE !== CLIENT_TYPES.CONTRIBUYENTE
    ) {
      throw new Error(
        `Cliente jurídico (tipoContribuyente="2") debe ser tipoClienteFE="01" (Contribuyente), se recibió "${cliente.tipoClienteFE}".`
      );
    }

    // Regla 4.1.B y 4.1.C - Campos exclusivos del Extranjero
    if (cliente.tipoClienteFE === CLIENT_TYPES.EXTRANJERO) {
      const invalidFields = [
        'tipoContribuyente',
        'numeroRUC',
        'digitoVerificadorRUC',
        'codigoUbicacion',
        'provincia',
        'distrito',
        'corregimiento',
      ].filter((field) => (cliente as any)[field] !== undefined);

      if (invalidFields.length > 0) {
        throw new Error(
          `Cliente Extranjero (tipoClienteFE="04") no debe incluir los siguientes campos: ${invalidFields.join(', ')}.`
        );
      }

      if (!cliente.tipoIdentificacion || !cliente.nroIdentificacionExtranjero) {
        throw new Error(
          `Cliente Extranjero (tipoClienteFE="04") debe incluir 'tipoIdentificacion' y 'nroIdentificacionExtranjero'.`
        );
      }
    }

    // Regla 4.1.D - Campos obligatorios para Contribuyente y Gobierno
    if (
      cliente.tipoClienteFE === CLIENT_TYPES.CONTRIBUYENTE ||
      cliente.tipoClienteFE === CLIENT_TYPES.GOBIERNO
    ) {
      const requiredFields = ['numeroRUC', 'digitoVerificadorRUC', 'razonSocial', 'direccion'];
      const missingFields = requiredFields.filter((field) => !(cliente as any)[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Cliente Contribuyente/Gobierno (tipoClienteFE="${cliente.tipoClienteFE}") debe incluir los siguientes campos: ${missingFields.join(', ')}.`
        );
      }
    }

    // Regla 4.2.A - Panamá interno
    if (destinoOperacion === '1' && cliente.pais !== 'PA' && cliente.tipoClienteFE !== CLIENT_TYPES.EXTRANJERO) {
      throw new Error(`Si destinoOperacion="1" (Panamá), el país del cliente debe ser "PA" a menos que sea Extranjero.`);
    }

    // Regla 4.2.B y 4.2.C - Destino extranjero
    if (destinoOperacion === '2' && cliente.pais === 'PA') {
      throw new Error(`Si destinoOperacion="2" (Extranjero), el país del cliente no puede ser "PA".`);
    }

    // Regla 4.2.C (País "ZZ")
    if (cliente.pais === 'ZZ' && !cliente.paisOtro) {
      throw new Error(`Si el país es "ZZ", el campo 'paisOtro' es obligatorio.`);
    }
  }
}
