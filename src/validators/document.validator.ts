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

    // Regla 4.1.A - Jurídico siempre es Contribuyente
    if (trx.cliente.tipoContribuyente === '2' && trx.cliente.tipoClienteFE !== '01') {
      throw new Error(
        `Si el cliente es Jurídico (tipoContribuyente="2"), debe ser declarado como Contribuyente (tipoClienteFE="01").`
      );
    }

    // Regla 4.1.D - Campos obligatorios para Contribuyente (01) y Gobierno (03)
    if (trx.cliente.tipoClienteFE === '01' || trx.cliente.tipoClienteFE === '03') {
      const { numeroRUC, digitoVerificadorRUC, razonSocial, direccion } = trx.cliente;
      if (!numeroRUC || !digitoVerificadorRUC || !razonSocial || !direccion) {
        throw new Error(
          `Para Contribuyente o Gobierno (01/03), los campos RUC, DV, Razón Social y Dirección son obligatorios.`
        );
      }
    }

    // Regla 4.2.A/B/C - Destino y País
    if (trx.destinoOperacion === '1') {
      // Panamá interno — excepción: clientes Extranjero (04) pueden tener pais != PA
      if (trx.cliente.pais && trx.cliente.pais !== 'PA' && trx.cliente.tipoClienteFE !== '04') {
        throw new Error(`Si destinoOperacion="1" (Panamá), el país del cliente debe ser "PA".`);
      }
    } else if (trx.destinoOperacion === '2') {
      // Extranjero
      if (trx.cliente.pais === 'PA') {
        throw new Error(`Si destinoOperacion="2" (Extranjero), el país del cliente no puede ser "PA".`);
      }
      if (!doc.datosFacturaExportacion) {
        throw new Error(`Si destinoOperacion="2", la sección 'datosFacturaExportacion' es obligatoria.`);
      }
    }

    // Regla 4.2.D - País "ZZ"
    if (trx.cliente.pais === 'ZZ' && !trx.cliente.paisOtro) {
      throw new Error(`Si el país es "ZZ", el campo 'paisOtro' es obligatorio.`);
    }

    // Regla 4.6.A - Acarreo y seguro: ítem vs total
    const tot = doc.totalesSubTotales;
    const hasAcarreoInItems = doc.listaItems.some((i) => i.precioAcarreo && parseFloat(i.precioAcarreo) > 0);
    const hasSeguroInItems = doc.listaItems.some((i) => i.precioSeguro && parseFloat(i.precioSeguro) > 0);

    if (hasAcarreoInItems && tot.totalAcarreoCobrado && parseFloat(tot.totalAcarreoCobrado) > 0) {
      throw new Error(`No se puede informar 'precioAcarreo' en ítems y 'totalAcarreoCobrado' en totales simultáneamente.`);
    }
    if (hasSeguroInItems && tot.valorSeguroCobrado && parseFloat(tot.valorSeguroCobrado) > 0) {
      throw new Error(`No se puede informar 'precioSeguro' en ítems y 'valorSeguroCobrado' en totales simultáneamente.`);
    }

    // Regla 4.6.B - Pago a plazo (tiempoPago 2=Plazo, 3=Mixto)
    if (tot.tiempoPago === '2' || tot.tiempoPago === '3') {
      if (!tot.listaPagoPlazo || tot.listaPagoPlazo.length === 0) {
        throw new Error(`Para tiempoPago "${tot.tiempoPago}", 'listaPagoPlazo' es obligatoria.`);
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
        const hasCufe = doc.docFiscalReferenciado.some((ref) => ref.cufeFEReferenciada);
        if (hasCufe) {
          throw new Error(`Para Notas genéricas (06/07), no se debe incluir 'cufeFEReferenciada'.`);
        }
      }
    }
    
    // Regla 4.1.E - Gobierno requiere CPBS en ítems
    if (trx.cliente.tipoClienteFE === '03') {
      for (let i = 0; i < doc.listaItems.length; i++) {
        const item = doc.listaItems[i];
        if (!item.codigoCPBS || !item.codigoCPBSAbrev || !item.unidadMedidaCPBS) {
          throw new Error(
            `Para clientes Gobierno (03), los ítems deben incluir codigoCPBS, codigoCPBSAbrev y unidadMedidaCPBS (Falta en ítem ${i+1}).`
          );
        }
      }
    }
  }
}
