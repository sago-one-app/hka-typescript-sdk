import type { BaseEmisionInput } from './base.input';

/** Factura de operación interna — tipoDocumento `01` */
export type FacturaInput = BaseEmisionInput;

/**
 * Factura de importación — tipoDocumento `02`
 *
 * `naturalezaOperacion` se omite del input porque el SDK la fija automáticamente
 * en `'21'` (Importación) según lo exige la DGI. Cualquier otro valor sería inválido.
 */
export type FacturaImportacionInput = Omit<BaseEmisionInput, 'naturalezaOperacion'>;

/**
 * Factura de exportación — tipoDocumento `03`
 *
 * `destinoOperacion` se omite del input porque el SDK la fija automáticamente
 * en `'2'` (Extranjero). Requiere información logística de exportación.
 */
export interface FacturaExportacionInput extends Omit<BaseEmisionInput, 'destinoOperacion'> {
  datosFacturaExportacion: {
    /** INCOTERMS, ej. 'FOB', 'CIF', 'EXW' */
    condicionesEntrega: string;
    /** Código ISO 4217, ej. 'USD', 'EUR' */
    monedaOperExportacion: string;
    tipoDeCambio?: string;
    montoMonedaExtranjera?: string;
    puertoEmbarque?: string;
    puertoDesembarque?: string;
  };
}

/**
 * Factura Zona Franca — tipoDocumento `08`
 *
 * Para contribuyentes autorizados a operar en Zonas Francas de Panamá.
 * Misma estructura que la factura interna; el régimen especial queda registrado
 * en el tipo de documento `08`.
 */
export type FacturaZonaFrancaInput = BaseEmisionInput;

/**
 * Reembolso — tipoDocumento `09`
 *
 * Para restitución de gastos pagados por cuenta de terceros
 * (viáticos, comisiones, gastos de agencia, etc.).
 * El receptor debe ser quien originalmente autorizó el gasto.
 */
export type ReembolsoInput = BaseEmisionInput;

/**
 * Factura de operación extranjera — tipoDocumento `10`
 *
 * Para transacciones internacionales que **no** califican como exportación
 * tradicional de bienes físicos (código 03). A diferencia de la exportación,
 * NO requiere la sección `datosFacturaExportacion` (Incoterms, etc.).
 * Ejemplo: servicios prestados remotamente a clientes en el exterior,
 * operaciones de compraventa sin tránsito físico de mercancías.
 */
export type FacturaExtranjeroInput = BaseEmisionInput;
