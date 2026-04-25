import type { BaseEmisionInput } from './base.input';

export interface DocFiscalReferenciadoInput {
  /** ISO 8601 con timezone */
  fechaEmisionDocFiscalReferenciado: string;
  /** Exactamente 66 caracteres. Requerido solo en notas referenciadas (04/05). */
  cufeFEReferenciada?: string;
  nroFacturaPapel?: string;
  nroFacturaIF?: string;
}

/** Nota de Crédito referenciada a una FE — tipoDocumento `04` */
export interface NotaCreditoReferenciadaInput extends BaseEmisionInput {
  /** Al menos un elemento con `cufeFEReferenciada` de 66 caracteres. */
  docFiscalReferenciado: [DocFiscalReferenciadoInput, ...DocFiscalReferenciadoInput[]];
}

/** Nota de Débito referenciada a una FE — tipoDocumento `05` */
export interface NotaDebitoReferenciadaInput extends BaseEmisionInput {
  /** Al menos un elemento con `cufeFEReferenciada` de 66 caracteres. */
  docFiscalReferenciado: [DocFiscalReferenciadoInput, ...DocFiscalReferenciadoInput[]];
}

/** Nota de Crédito genérica — tipoDocumento `06`. Sin CUFE referenciado. */
export interface NotaCreditoGenericaInput extends BaseEmisionInput {
  /** Opcional. Si se provee, NO debe incluir `cufeFEReferenciada`. */
  docFiscalReferenciado?: DocFiscalReferenciadoInput[];
}

/** Nota de Débito genérica — tipoDocumento `07`. Sin CUFE referenciado. */
export interface NotaDebitoGenericaInput extends BaseEmisionInput {
  /** Opcional. Si se provee, NO debe incluir `cufeFEReferenciada`. */
  docFiscalReferenciado?: DocFiscalReferenciadoInput[];
}
