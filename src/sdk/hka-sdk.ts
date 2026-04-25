import { ZodError } from 'zod';
import { HkaClient } from '../http/hka-client';
import { XmlBuilder } from '../builders/xml-builder';
import { ClientValidator } from '../validators/client.validator';
import { DocumentValidator } from '../validators/document.validator';
import { TotalsValidator } from '../validators/totals.validator';
import { ContingencyValidator } from '../validators/contingency.validator';
import { AnulacionValidator } from '../validators/anulacion.validator';
import { NotaReferenciadaValidator } from '../validators/nota-referenciada.validator';
import { ItbmsCalculator } from '../calculators/itbms.calculator';
import { TotalsCalculator } from '../calculators/totals.calculator';
import { DocumentoElectronicoSchema } from '../types/document.types';
import type { DocumentoElectronico, DocFiscalReferenciado, DatosFacturaExportacion } from '../types/document.types';
import type { Cliente } from '../types/client.types';
import type { Item } from '../types/item.types';
import type { FormaPago, PagoPlazo, Retencion, DescuentoBonificacion, TotalesSubTotales } from '../types/totals.types';
import type { RastreoCorreoResponse } from '../types/response.types';
import { PAYMENT_TIMES } from '../catalogs/payment-times';
import { DOCUMENT_TYPES } from '../catalogs/document-types';
import { NATURE_OPERATIONS } from '../catalogs/nature-operations';
import { OPERATION_DESTINATIONS } from '../catalogs/operation-destinations';
import { HKA_ENDPOINTS, type HkaEnvironment } from './environments';
import { HkaError } from './errors';
import type {
  EmisionResult,
  AnulacionResult,
  GestionResult,
  DescargaPDFResult,
  DescargaXMLResult,
  FoliosResult,
  ConsultarRucDVResult,
} from './result.types';
import type {
  BaseEmisionInput,
  ClienteInput,
  ItemInput,
  PagoInput,
  PagoPlazoInput,
} from './inputs/base.input';
import type {
  FacturaInput,
  FacturaImportacionInput,
  FacturaExportacionInput,
  FacturaZonaFrancaInput,
  ReembolsoInput,
  FacturaExtranjeroInput,
} from './inputs/factura.input';
import type {
  NotaCreditoReferenciadaInput,
  NotaDebitoReferenciadaInput,
  NotaCreditoGenericaInput,
  NotaDebitoGenericaInput,
  DocFiscalReferenciadoInput,
} from './inputs/nota.input';
import type { DatosDocumento } from '../types/datos-documento.types';

// ─── Configuración ────────────────────────────────────────────────────────────

export interface HkaSdkConfig {
  environment: HkaEnvironment;
  tokenEmpresa: string;
  tokenPassword: string;
  /** Override para URL personalizada (staging, etc.) */
  customEndpoint?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class HkaSdk {
  private readonly client: HkaClient;

  constructor(config: HkaSdkConfig) {
    this.client = new HkaClient({
      endpoint: config.customEndpoint ?? HKA_ENDPOINTS[config.environment],
      tokenEmpresa: config.tokenEmpresa,
      tokenPassword: config.tokenPassword,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
    });
  }

  // ─── Emisión de documentos ───────────────────────────────────────────────────

  async emitirFactura(input: FacturaInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA);
  }

  async emitirFacturaImportacion(input: FacturaImportacionInput): Promise<EmisionResult> {
    return this.orquestar(
      { ...input, naturalezaOperacion: NATURE_OPERATIONS.IMPORTACION } as BaseEmisionInput,
      DOCUMENT_TYPES.FACTURA_IMPORTACION,
    );
  }

  async emitirFacturaExportacion(input: FacturaExportacionInput): Promise<EmisionResult> {
    return this.orquestar(
      { ...input, destinoOperacion: OPERATION_DESTINATIONS.EXTRANJERO } as BaseEmisionInput,
      DOCUMENT_TYPES.FACTURA_EXPORTACION,
      { datosFacturaExportacion: input.datosFacturaExportacion },
    );
  }

  async emitirNotaCreditoReferenciada(input: NotaCreditoReferenciadaInput): Promise<EmisionResult> {
    try {
      for (const ref of input.docFiscalReferenciado) {
        NotaReferenciadaValidator.validatePlazo(ref.fechaEmisionDocFiscalReferenciado);
      }
    } catch (err) {
      throw new HkaError('VALIDATION', (err as Error).message, { cause: err });
    }
    return this.orquestar(input, DOCUMENT_TYPES.NOTA_CREDITO_REFERENTE_FE, {
      docFiscalReferenciado: input.docFiscalReferenciado,
    });
  }

  async emitirNotaDebitoReferenciada(input: NotaDebitoReferenciadaInput): Promise<EmisionResult> {
    try {
      for (const ref of input.docFiscalReferenciado) {
        NotaReferenciadaValidator.validatePlazo(ref.fechaEmisionDocFiscalReferenciado);
      }
    } catch (err) {
      throw new HkaError('VALIDATION', (err as Error).message, { cause: err });
    }
    return this.orquestar(input, DOCUMENT_TYPES.NOTA_DEBITO_REFERENTE_FE, {
      docFiscalReferenciado: input.docFiscalReferenciado,
    });
  }

  async emitirNotaCreditoGenerica(input: NotaCreditoGenericaInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.NOTA_CREDITO_GENERICA, {
      docFiscalReferenciado: input.docFiscalReferenciado,
    });
  }

  async emitirNotaDebitoGenerica(input: NotaDebitoGenericaInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.NOTA_DEBITO_GENERICA, {
      docFiscalReferenciado: input.docFiscalReferenciado,
    });
  }

  async emitirFacturaZonaFranca(input: FacturaZonaFrancaInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.FACTURA_ZONA_FRANCA);
  }

  async emitirReembolso(input: ReembolsoInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.REEMBOLSO);
  }

  async emitirFacturaExtranjero(input: FacturaExtranjeroInput): Promise<EmisionResult> {
    return this.orquestar(input, DOCUMENT_TYPES.FACTURA_OPERACION_EXTRANJERA);
  }

  // ─── Gestión de documentos ───────────────────────────────────────────────────

  async anularDocumento(datos: DatosDocumento, motivo: string, fechaEmision: string): Promise<AnulacionResult> {
    try {
      AnulacionValidator.validatePlazo(fechaEmision);
    } catch (err) {
      throw new HkaError('VALIDATION', (err as Error).message, { cause: err });
    }

    try {
      const response = await this.client.anulacionDocumento(datos, motivo);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      return { success: true, mensaje: response.mensaje };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al anular documento: ${(err as Error).message}`, { cause: err });
    }
  }

  async consultarEstado(datos: DatosDocumento): Promise<GestionResult & { cufe?: string; estatusDocumento?: string }> {
    try {
      const response = await this.client.estadoDocumento(datos);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      return {
        success: true,
        mensaje: response.mensajeDocumento ?? response.mensaje,
        cufe: response.cufe,
        estatusDocumento: response.estatusDocumento,
      };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al consultar estado: ${(err as Error).message}`, { cause: err });
    }
  }

  async descargarPDF(datos: DatosDocumento): Promise<DescargaPDFResult> {
    try {
      const response = await this.client.descargaPDF(datos);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      if (!response.pdf) {
        throw new HkaError('API', 'La API no devolvió el PDF en la respuesta', { codigoHka: response.codigo });
      }
      return { success: true, pdf: response.pdf };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al descargar PDF: ${(err as Error).message}`, { cause: err });
    }
  }

  async descargarXML(datos: DatosDocumento): Promise<DescargaXMLResult> {
    try {
      const response = await this.client.descargaXML(datos);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      if (!response.xmlFirmado) {
        throw new HkaError('API', 'La API no devolvió el XML en la respuesta', { codigoHka: response.codigo });
      }
      return { success: true, xmlFirmado: response.xmlFirmado };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al descargar XML: ${(err as Error).message}`, { cause: err });
    }
  }

  async consultarFoliosRestantes(): Promise<FoliosResult> {
    try {
      const response = await this.client.foliosRestantes();
      return { success: true, ...response };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al consultar folios: ${(err as Error).message}`, { cause: err });
    }
  }

  async enviarPorCorreo(datos: DatosDocumento, correo: string): Promise<GestionResult> {
    try {
      const response = await this.client.envioCorreo(datos, correo);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      return { success: true, mensaje: response.mensaje };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al enviar correo: ${(err as Error).message}`, { cause: err });
    }
  }

  async rastrearCorreo(cufe: string): Promise<RastreoCorreoResponse> {
    try {
      return await this.client.rastreoCorreo(cufe);
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al rastrear correo: ${(err as Error).message}`, { cause: err });
    }
  }

  async consultarRucDV(ruc: string, tipoRuc?: string): Promise<ConsultarRucDVResult> {
    try {
      const response = await this.client.consultarRucDV(ruc, tipoRuc);
      if (response.codigo !== '200') {
        throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
      }
      return { success: true, infoRuc: response.infoRuc };
    } catch (err) {
      if (HkaError.isHkaError(err)) throw err;
      throw new HkaError('NETWORK', `Error de red al consultar RUC/DV: ${(err as Error).message}`, { cause: err });
    }
  }

  // ─── Orquestador privado ──────────────────────────────────────────────────────

  private async orquestar(
    input: BaseEmisionInput,
    tipoDocumento: string,
    extras?: {
      datosFacturaExportacion?: DatosFacturaExportacion;
      docFiscalReferenciado?: DocFiscalReferenciadoInput[];
    }
  ): Promise<EmisionResult> {
    // 1. Completar items (auto-calcular valorITBMS y valorTotal si faltan)
    const itemsCompletos = this.completarItems(input.items);

    // 2. Auto-calcular totales desde los items y pagos
    const tiempoPago = input.pagoPlazo && input.pagoPlazo.length > 0
      ? PAYMENT_TIMES.PLAZO
      : PAYMENT_TIMES.INMEDIATO;

    const listaFormaPago: FormaPago[] = input.pagos.map((p) => ({
      formaPagoFact: p.formaPagoFact,
      descFormaPago: p.descFormaPago,
      valorCuotaPagada: p.valorCuotaPagada,
    }));

    const descuentoMontoNum = input.descuentoGlobal
      ? parseFloat(input.descuentoGlobal.montoDescuento)
      : 0;

    const totalesBase = TotalsCalculator.calculate(
      itemsCompletos,
      listaFormaPago,
      tiempoPago,
      descuentoMontoNum > 0 ? { totalDescuento: descuentoMontoNum } : undefined
    );

    const totalesSubTotales: TotalesSubTotales = {
      ...(totalesBase as TotalesSubTotales),
      listaPagoPlazo: input.pagoPlazo?.map((p) => ({
        fechaVenceCuota: p.fechaVenceCuota,
        valorCuota: p.valorCuota,
      })) as PagoPlazo[] | undefined,
      retencion: input.retencion
        ? ({ codigoRetencion: input.retencion.codigoRetencion, montoRetencion: input.retencion.montoRetencion } as Retencion)
        : undefined,
      descuentoBonificacion: input.descuentoGlobal
        ? ([{ descDescuento: input.descuentoGlobal.descDescuento, montoDescuento: input.descuentoGlobal.montoDescuento }] as DescuentoBonificacion[])
        : undefined,
    };

    // 3. Ensamblar DocumentoElectronico completo
    const doc = this.ensamblarDocumento(input, tipoDocumento, itemsCompletos, totalesSubTotales, extras);

    // 4. Parsear con Zod (barrera de schema)
    let parsedDoc: DocumentoElectronico;
    try {
      parsedDoc = DocumentoElectronicoSchema.parse(doc);
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ');
        throw new HkaError('VALIDATION', `Error de schema: ${msg}`, {
          zodIssues: err.issues.map((i) => ({ path: i.path as (string | number)[], message: i.message })),
          cause: err,
        });
      }
      throw err;
    }

    // 5. Validadores de negocio
    try {
      ClientValidator.validate(parsedDoc.datosTransaccion.cliente, parsedDoc.datosTransaccion.destinoOperacion);
      DocumentValidator.validate(parsedDoc);
      TotalsValidator.validate(parsedDoc);
      ContingencyValidator.validate(parsedDoc);
    } catch (err) {
      throw new HkaError('VALIDATION', (err as Error).message, { cause: err });
    }

    // 6. Construir XML
    let xmlString: string;
    try {
      xmlString = XmlBuilder.buildDocumentoElectronico(parsedDoc);
    } catch (err) {
      throw new HkaError('VALIDATION', `Error al construir XML: ${(err as Error).message}`, { cause: err });
    }

    // 7. Enviar al WS
    let response;
    try {
      response = await this.client.enviar(xmlString);
    } catch (err) {
      throw new HkaError('NETWORK', `Error de red al enviar documento: ${(err as Error).message}`, { cause: err });
    }

    // 8. Verificar respuesta
    if (response.codigo !== '200') {
      throw new HkaError('API', response.mensaje, { codigoHka: response.codigo });
    }

    if (!response.cufe) {
      throw new HkaError('API', 'La DGI aprobó el documento pero no devolvió CUFE', { codigoHka: response.codigo });
    }

    return {
      success: true,
      cufe: response.cufe,
      qr: response.qr,
      fechaRecepcionDGI: response.fechaRecepcionDGI,
      nroProtocoloAutorizacion: response.nroProtocoloAutorizacion,
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private completarItems(items: ItemInput[]): Item[] {
    return items.map((item) => {
      const precioItem = parseFloat(item.precioItem);
      const valorITBMS = item.valorITBMS !== undefined
        ? item.valorITBMS
        : ItbmsCalculator.calculateItemItbms(item.tasaITBMS, precioItem).toFixed(6);

      const acarreo = parseFloat(item.precioAcarreo ?? '0');
      const seguro = parseFloat(item.precioSeguro ?? '0');
      const isc = parseFloat(item.valorISC ?? '0');
      const valorTotal = item.valorTotal !== undefined
        ? item.valorTotal
        : (precioItem + parseFloat(valorITBMS) + acarreo + seguro + isc).toFixed(6);

      return {
        ...item,
        valorITBMS,
        valorTotal,
      } as Item;
    });
  }

  private ensamblarDocumento(
    input: BaseEmisionInput,
    tipoDocumento: string,
    items: Item[],
    totalesSubTotales: TotalesSubTotales,
    extras?: {
      datosFacturaExportacion?: DatosFacturaExportacion;
      docFiscalReferenciado?: DocFiscalReferenciadoInput[];
    }
  ): DocumentoElectronico {
    const cliente: Cliente = this.mapearCliente(input.cliente);

    const docFiscalReferenciado: DocFiscalReferenciado[] | undefined =
      extras?.docFiscalReferenciado?.map((ref) => ({
        fechaEmisionDocFiscalReferenciado: ref.fechaEmisionDocFiscalReferenciado,
        cufeFEReferenciada: ref.cufeFEReferenciada,
        nroFacturaPapel: ref.nroFacturaPapel,
        nroFacturaIF: ref.nroFacturaIF,
      }));

    return {
      codigoSucursalEmisor: input.codigoSucursalEmisor,
      tipoSucursal: input.tipoSucursal,
      datosTransaccion: {
        tipoEmision: input.tipoEmision,
        tipoDocumento: tipoDocumento as DocumentoElectronico['datosTransaccion']['tipoDocumento'],
        numeroDocumentoFiscal: input.numeroDocumentoFiscal.padStart(10, '0'),
        puntoFacturacionFiscal: input.puntoFacturacionFiscal.padStart(3, '0'),
        fechaEmision: input.fechaEmision,
        fechaSalida: input.fechaSalida,
        fechaInicioContingencia: input.fechaInicioContingencia,
        motivoContingencia: input.motivoContingencia,
        naturalezaOperacion: input.naturalezaOperacion,
        tipoOperacion: input.tipoOperacion,
        destinoOperacion: input.destinoOperacion,
        formatoCAFE: input.formatoCAFE,
        entregaCAFE: input.entregaCAFE,
        envioContenedor: input.envioContenedor ?? '1',
        procesoGeneracion: input.procesoGeneracion ?? '1',
        tipoVenta: input.tipoVenta,
        informacionInteres: input.informacionInteres,
        cliente,
      },
      listaItems: items,
      totalesSubTotales,
      docFiscalReferenciado: docFiscalReferenciado,
      datosFacturaExportacion: extras?.datosFacturaExportacion,
      usoPosterior: input.usoPosterior,
    };
  }

  private mapearCliente(cliente: ClienteInput): Cliente {
    switch (cliente.tipoClienteFE) {
      case '01':
        return {
          tipoClienteFE: '01',
          tipoContribuyente: cliente.tipoContribuyente,
          numeroRUC: cliente.numeroRUC,
          digitoVerificadorRUC: cliente.digitoVerificadorRUC,
          razonSocial: cliente.razonSocial,
          direccion: cliente.direccion,
          codigoUbicacion: cliente.codigoUbicacion,
          provincia: cliente.provincia,
          distrito: cliente.distrito,
          corregimiento: cliente.corregimiento,
          telefono1: cliente.telefono1,
          telefono2: cliente.telefono2,
          telefono3: cliente.telefono3,
          correo1: cliente.correo1,
          correo2: cliente.correo2,
          pais: cliente.pais,
          paisOtro: cliente.paisOtro,
        };
      case '02':
        return {
          tipoClienteFE: '02',
          razonSocial: cliente.razonSocial,
          direccion: cliente.direccion,
          codigoUbicacion: cliente.codigoUbicacion,
          provincia: cliente.provincia,
          distrito: cliente.distrito,
          corregimiento: cliente.corregimiento,
          telefono1: cliente.telefono1,
          correo1: cliente.correo1,
          pais: cliente.pais,
          paisOtro: cliente.paisOtro,
        };
      case '03':
        return {
          tipoClienteFE: '03',
          tipoContribuyente: cliente.tipoContribuyente,
          numeroRUC: cliente.numeroRUC,
          digitoVerificadorRUC: cliente.digitoVerificadorRUC,
          razonSocial: cliente.razonSocial,
          direccion: cliente.direccion,
          codigoUbicacion: cliente.codigoUbicacion,
          provincia: cliente.provincia,
          distrito: cliente.distrito,
          corregimiento: cliente.corregimiento,
          telefono1: cliente.telefono1,
          correo1: cliente.correo1,
          pais: cliente.pais,
          paisOtro: cliente.paisOtro,
        };
      case '04':
        return {
          tipoClienteFE: '04',
          tipoIdentificacion: cliente.tipoIdentificacion,
          nroIdentificacionExtranjero: cliente.nroIdentificacionExtranjero,
          razonSocial: cliente.razonSocial,
          paisExtranjero: cliente.paisExtranjero,
          telefono1: cliente.telefono1,
          correo1: cliente.correo1,
          pais: cliente.pais,
          paisOtro: cliente.paisOtro,
        };
    }
  }
}
