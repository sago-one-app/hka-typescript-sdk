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
}
