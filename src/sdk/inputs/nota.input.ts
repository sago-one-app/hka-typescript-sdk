import type { BaseEmisionInput } from './base.input';

// ─── Notas referenciadas (04 / 05) ───────────────────────────────────────────

/**
 * Referencia a una Factura Electrónica existente.
 * Usada en Notas de Crédito/Débito referenciadas (tipos 04 y 05).
 */
export interface DocFiscalReferenciadoInput {
  /** ISO 8601 con timezone, ej. '2023-01-15T10:00:00-05:00' */
  fechaEmisionDocFiscalReferenciado: string;
  /** Exactamente 66 caracteres — CUFE de la FE original. Obligatorio en tipos 04/05. */
  cufeFEReferenciada?: string;
  nroFacturaPapel?: string;
  nroFacturaIF?: string;
}

/**
 * Nota de Crédito referenciada a una FE — tipoDocumento `04`
 *
 * Uso: anular o aplicar descuentos a una FE emitida previamente.
 * - `cufeFEReferenciada` de 66 chars es **obligatorio** en cada referencia.
 * - Solo puede emitirse dentro de los **180 días** posteriores a la FE original.
 * - Requiere al menos un elemento en `docFiscalReferenciado`.
 */
export interface NotaCreditoReferenciadaInput extends BaseEmisionInput {
  docFiscalReferenciado: [DocFiscalReferenciadoInput, ...DocFiscalReferenciadoInput[]];
}

/**
 * Nota de Débito referenciada a una FE — tipoDocumento `05`
 *
 * Uso: incrementar el monto de una FE previamente autorizada
 * (ajustes al alza, intereses de mora, cargos adicionales).
 * - Mismas reglas que la NC Referenciada: CUFE obligatorio, límite 180 días.
 */
export interface NotaDebitoReferenciadaInput extends BaseEmisionInput {
  docFiscalReferenciado: [DocFiscalReferenciadoInput, ...DocFiscalReferenciadoInput[]];
}

// ─── Notas genéricas (06 / 07) ────────────────────────────────────────────────

/**
 * Referencia a un documento **no electrónico** (factura en papel).
 * Usada en Notas genéricas (tipos 06 y 07).
 *
 * `cufeFEReferenciada` está **ausente** por diseño: las notas genéricas no se
 * vinculan a ninguna FE del sistema. TypeScript prevendrá su uso en tiempo de compilación.
 */
export interface DocFiscalGenericaInput {
  /** ISO 8601 con timezone */
  fechaEmisionDocFiscalReferenciado: string;
  /** Número de factura en papel (si aplica) */
  nroFacturaPapel?: string;
  /** Número de factura interna (si aplica) */
  nroFacturaIF?: string;
}

/**
 * Nota de Crédito genérica — tipoDocumento `06`
 *
 * Uso: créditos o ajustes a favor del cliente cuando no es posible
 * rastrear la operación a una FE específica del sistema.
 * - La sección `docFiscalReferenciado` es **completamente opcional**.
 * - Si se provee, solo puede contener `nroFacturaPapel` o `nroFacturaIF` (nunca CUFE).
 */
export interface NotaCreditoGenericaInput extends BaseEmisionInput {
  docFiscalReferenciado?: DocFiscalGenericaInput[];
}

/**
 * Nota de Débito genérica — tipoDocumento `07`
 *
 * Uso: cargos adicionales al cliente cuando la transacción no puede
 * asociarse directamente a una FE procesada por el sistema FEL.
 * - Mismas reglas que la NC Genérica: sin CUFE, referencia opcional.
 */
export interface NotaDebitoGenericaInput extends BaseEmisionInput {
  docFiscalReferenciado?: DocFiscalGenericaInput[];
}
