export interface EmisionResult {
  success: true;
  cufe: string;
  qr?: string;
  fechaRecepcionDGI?: string;
  nroProtocoloAutorizacion?: string;
}

export interface AnulacionResult {
  success: true;
  mensaje: string;
}

export interface GestionResult {
  success: true;
  mensaje: string;
}

export interface DescargaPDFResult {
  success: true;
  pdf: string;
}

export interface DescargaXMLResult {
  success: true;
  xmlFirmado: string;
}

export interface FoliosResult {
  success: true;
  licencia: string;
  fechaLicencia: string;
  ciclo: string;
  fechaCiclo: string;
  foliosTotalesCiclo: string;
  foliosUtilizadosCiclo: string;
  foliosDisponibleCiclo: string;
  foliosTotales: string;
}

export interface ConsultarRucDVResult {
  success: true;
  infoRuc?: {
    tipoRuc: string;
    ruc: string;
    dv: string;
    razonSocial: string;
    afiliadoFE: string;
  };
}
