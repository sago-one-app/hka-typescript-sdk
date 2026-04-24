import axios, { AxiosInstance } from 'axios';
import { SoapEnvelopeBuilder } from '../builders/soap-envelope';
import { SoapParser } from './soap-parser';
import { RetryHandler } from './retry';
import {
  EnviarResponse,
  EstadoDocumentoResponse,
  AnulacionResponse,
  DescargaXMLResponse,
  FoliosRestantesResponse,
  EnvioCorreoResponse,
  DescargaPDFResponse,
  ConsultarRucDVResponse,
  RastreoCorreoResponse,
} from '../types/response.types';

export interface HkaClientConfig {
  endpoint: string;
  tokenEmpresa: string;
  tokenPassword: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class HkaClient {
  private axiosInstance: AxiosInstance;
  private config: HkaClientConfig;

  constructor(config: HkaClientConfig) {
    this.config = {
      timeoutMs: 15000,
      maxRetries: 3,
      ...config,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeoutMs,
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
      },
    });
  }

  private async postSoapAction(soapAction: string, xmlBody: string): Promise<string> {
    return RetryHandler.withRetry(
      async () => {
        const response = await this.axiosInstance.post('', xmlBody, {
          headers: {
            SOAPAction: `http://tempuri.org/IService/${soapAction}`,
          },
        });
        return response.data;
      },
      this.config.maxRetries,
      1000
    );
  }

  async enviar(documentoXmlStr: string): Promise<EnviarResponse> {
    const envelope = SoapEnvelopeBuilder.buildEnviar(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      documentoXmlStr
    );

    const data = await this.postSoapAction('Enviar', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      cufe: SoapParser.extractTag(data, 'cufe'),
      qr: SoapParser.extractTag(data, 'qr'),
      fechaRecepcionDGI: SoapParser.extractTag(data, 'fechaRecepcionDGI'),
      nroProtocoloAutorizacion: SoapParser.extractTag(data, 'nroProtocoloAutorizacion'),
    };
  }

  async anulacionDocumento(cufe: string, motivo: string): Promise<AnulacionResponse> {
    const envelope = SoapEnvelopeBuilder.buildAnulacion(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe,
      motivo
    );

    const data = await this.postSoapAction('AnulacionDocumento', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
    };
  }

  async estadoDocumento(cufe: string): Promise<EstadoDocumentoResponse> {
    const envelope = SoapEnvelopeBuilder.buildEstadoDocumento(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe
    );

    const data = await this.postSoapAction('EstadoDocumento', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      cufe: SoapParser.extractTag(data, 'cufe'),
      fechaEmisionDocumento: SoapParser.extractTag(data, 'fechaEmisionDocumento'),
      fechaRecepcionDocumento: SoapParser.extractTag(data, 'fechaRecepcionDocumento'),
      estatusDocumento: SoapParser.extractTag(data, 'estatusDocumento'),
      mensajeDocumento: SoapParser.extractTag(data, 'mensajeDocumento'),
    };
  }

  async descargaPDF(cufe: string): Promise<DescargaPDFResponse> {
    const envelope = SoapEnvelopeBuilder.buildDescargaPDF(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe
    );

    const data = await this.postSoapAction('DescargaPDF', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      pdf: SoapParser.extractTag(data, 'documento'),
    };
  }

  async descargaXML(cufe: string): Promise<DescargaXMLResponse> {
    const envelope = SoapEnvelopeBuilder.buildDescargaXML(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe
    );

    const data = await this.postSoapAction('DescargaXML', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      xmlFirmado: SoapParser.extractTag(data, 'documento'),
    };
  }

  async foliosRestantes(): Promise<FoliosRestantesResponse> {
    const envelope = SoapEnvelopeBuilder.buildFoliosRestantes(
      this.config.tokenEmpresa,
      this.config.tokenPassword
    );

    const data = await this.postSoapAction('FoliosRestantes', envelope);

    return {
      licencia: SoapParser.extractTag(data, 'licencia') || '',
      fechaLicencia: SoapParser.extractTag(data, 'fechaLicencia') || '',
      ciclo: SoapParser.extractTag(data, 'ciclo') || '',
      fechaCiclo: SoapParser.extractTag(data, 'fechaCiclo') || '',
      foliosTotalesCiclo: SoapParser.extractTag(data, 'foliosTotalesCiclo') || '',
      foliosUtilizadosCiclo: SoapParser.extractTag(data, 'foliosUtilizadosCiclo') || '',
      foliosDisponibleCiclo: SoapParser.extractTag(data, 'foliosDisponibleCiclo') || '',
      foliosTotales: SoapParser.extractTag(data, 'foliosTotales') || '',
    };
  }

  async envioCorreo(cufe: string, correos: string): Promise<EnvioCorreoResponse> {
    const envelope = SoapEnvelopeBuilder.buildEnvioCorreo(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe,
      correos
    );

    const data = await this.postSoapAction('EnvioCorreo', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
    };
  }

  async rastreoCorreo(cufe: string): Promise<RastreoCorreoResponse> {
    const envelope = SoapEnvelopeBuilder.buildRastreoCorreo(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      cufe
    );

    const data = await this.postSoapAction('RastreoCorreo', envelope);

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      eventosCorreo: (SoapParser.extractList(data, 'eventosCorreo', 'evento', ['fecha', 'estatus', 'mensaje']) as Array<{ fecha: string; estatus: string; mensaje: string }>) || [],
    };
  }

  async consultarRucDV(ruc: string, tipoRuc: string = '2'): Promise<ConsultarRucDVResponse> {
    const envelope = SoapEnvelopeBuilder.buildConsultarRucDV(
      this.config.tokenEmpresa,
      this.config.tokenPassword,
      ruc,
      tipoRuc
    );

    const data = await this.postSoapAction('ConsultarRucDV', envelope);
    const infoRucStr = SoapParser.extractTag(data, 'infoRuc') || '';

    return {
      codigo: SoapParser.extractTag(data, 'codigo') || '',
      resultado: SoapParser.extractTag(data, 'resultado') || '',
      mensaje: SoapParser.extractTag(data, 'mensaje') || '',
      infoRuc: infoRucStr ? {
        tipoRuc: SoapParser.extractTag(infoRucStr, 'tipoRuc') || '',
        ruc: SoapParser.extractTag(infoRucStr, 'ruc') || '',
        dv: SoapParser.extractTag(infoRucStr, 'dv') || '',
        razonSocial: SoapParser.extractTag(infoRucStr, 'razonSocial') || '',
        afiliadoFE: SoapParser.extractTag(infoRucStr, 'afiliadoFE') || '',
      } : undefined,
    };
  }
}
