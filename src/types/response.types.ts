export interface HkaBaseResponse {
  codigo: string;
  resultado: string;
  mensaje: string;
}

export interface EnviarResponse extends HkaBaseResponse {
  cufe?: string;
  qr?: string;
  fechaRecepcionDGI?: string;
  nroProtocoloAutorizacion?: string;
}

export interface EstadoDocumentoResponse extends HkaBaseResponse {
  cufe?: string;
  fechaEmisionDocumento?: string;
  fechaRecepcionDocumento?: string;
  estatusDocumento?: string;
  mensajeDocumento?: string;
}

export interface AnulacionResponse extends HkaBaseResponse {}

export interface DescargaXMLResponse extends HkaBaseResponse {
  xmlFirmado?: string;
}

export interface FoliosRestantesResponse {
  licencia: string;
  fechaLicencia: string;
  ciclo: string;
  fechaCiclo: string;
  foliosTotalesCiclo: string;
  foliosUtilizadosCiclo: string;
  foliosDisponibleCiclo: string;
  foliosTotales: string;
}

export interface EnvioCorreoResponse extends HkaBaseResponse {}

export interface DescargaPDFResponse extends HkaBaseResponse {
  pdf?: string; // base64
}

export interface RastreoCorreoResponse extends HkaBaseResponse {
  eventosCorreo?: Array<{
    fecha: string;
    estatus: string;
    mensaje: string;
  }>;
}

export interface ConsultarRucDVResponse extends HkaBaseResponse {
  infoRuc?: {
    tipoRuc: string;
    ruc: string;
    dv: string;
    razonSocial: string;
    afiliadoFE: string;
  };
}
