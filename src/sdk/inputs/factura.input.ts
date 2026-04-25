import type { BaseEmisionInput } from './base.input';

/** Factura de operación interna — tipoDocumento `01` */
export type FacturaInput = BaseEmisionInput;

/** Factura de importación — tipoDocumento `02` */
export type FacturaImportacionInput = BaseEmisionInput;

/** Factura de exportación — tipoDocumento `03`. Requiere datos de exportación. */
export interface FacturaExportacionInput extends BaseEmisionInput {
  datosFacturaExportacion: {
    /** INCOTERMS (ej. 'FOB', 'CIF') */
    condicionesEntrega: string;
    /** Código ISO 4217 (ej. 'USD') */
    monedaOperExportacion: string;
    tipoDeCambio?: string;
    montoMonedaExtranjera?: string;
    puertoEmbarque?: string;
    puertoDesembarque?: string;
  };
}

/** Factura Zona Franca — tipoDocumento `08` */
export type FacturaZonaFrancaInput = BaseEmisionInput;

/** Reembolso — tipoDocumento `09` */
export type ReembolsoInput = BaseEmisionInput;

/** Factura de operación extranjera — tipoDocumento `10` */
export type FacturaExtranjeroInput = BaseEmisionInput;
