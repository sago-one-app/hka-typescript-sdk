import { DocumentoElectronico } from '../types/document.types';
import { DOCUMENT_TYPES } from '../catalogs/document-types';

export class DocumentValidator {
  static validate(doc: DocumentoElectronico): void {
    const trx = doc.datosTransaccion;

    // Regla: Padding numeroDocumentoFiscal
    if (!/^\d{10}$/.test(trx.numeroDocumentoFiscal)) {
      throw new Error(`numeroDocumentoFiscal debe tener 10 dígitos paddeados con ceros.`);
    }

    // Regla: Padding puntoFacturacionFiscal
    if (!/^\d{3}$/.test(trx.puntoFacturacionFiscal)) {
      throw new Error(`puntoFacturacionFiscal debe tener 3 dígitos paddeados con ceros.`);
    }
    if (trx.puntoFacturacionFiscal === '000') {
      throw new Error(`puntoFacturacionFiscal no puede ser "000".`);
    }

    // Regla 4.2.B - Destino extranjero
    if (trx.destinoOperacion === '2') {
      if (!doc.datosFacturaExportacion) {
        throw new Error(
          `Si destinoOperacion="2" (Extranjero), 'datosFacturaExportacion' es obligatorio.`
        );
      }
    }

    // Regla 4.4.A - Notas referentes a una FE
    if (
      trx.tipoDocumento === DOCUMENT_TYPES.NOTA_CREDITO_REFERENTE_FE ||
      trx.tipoDocumento === DOCUMENT_TYPES.NOTA_DEBITO_REFERENTE_FE
    ) {
      if (!doc.docFiscalReferenciado || doc.docFiscalReferenciado.length === 0) {
        throw new Error(
          `Para Notas de Crédito/Débito referentes (04/05), 'docFiscalReferenciado' es obligatorio.`
        );
      }
      for (const ref of doc.docFiscalReferenciado) {
        if (!ref.cufeFEReferenciada || ref.cufeFEReferenciada.length !== 66) {
          throw new Error(`cufeFEReferenciada debe tener exactamente 66 caracteres.`);
        }
      }
    }

    // Regla 4.4.B - Notas genéricas
    if (
      trx.tipoDocumento === DOCUMENT_TYPES.NOTA_CREDITO_GENERICA ||
      trx.tipoDocumento === DOCUMENT_TYPES.NOTA_DEBITO_GENERICA
    ) {
      if (doc.docFiscalReferenciado && doc.docFiscalReferenciado.length > 0) {
        // En notas genéricas no debe haber CUFE referenciado
        const hasCufe = doc.docFiscalReferenciado.some((ref) => ref.cufeFEReferenciada);
        if (hasCufe) {
          throw new Error(
            `Para Notas genéricas (06/07), no se debe incluir 'cufeFEReferenciada'.`
          );
        }
      }
    }
    
    // Regla 4.1.E - Gobierno requiere CPBS en ítems
    if (trx.cliente.tipoClienteFE === '03') {
      for (let i = 0; i < doc.listaItems.length; i++) {
        const item = doc.listaItems[i];
        if (!item.codigoCPBS || !item.codigoCPBSAbrev || !item.unidadMedidaCPBS) {
          throw new Error(
            `Para clientes Gobierno (03), todos los ítems deben incluir codigoCPBS, codigoCPBSAbrev y unidadMedidaCPBS (Falta en ítem ${i+1}).`
          );
        }
      }
    }
  }
}
