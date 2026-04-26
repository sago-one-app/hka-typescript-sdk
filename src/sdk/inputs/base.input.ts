import type { CONTRIBUTOR_TYPES } from '../../catalogs/contributor-types';
import type { IDENTIFICATION_TYPES } from '../../catalogs/identification-types';
import type { EMISSION_TYPES } from '../../catalogs/emission-types';
import type { NATURE_OPERATIONS } from '../../catalogs/nature-operations';
import type { OPERATION_TYPES } from '../../catalogs/operation-types';
import type { OPERATION_DESTINATIONS } from '../../catalogs/operation-destinations';
import type { CAFE_FORMATS, CAFE_DELIVERY } from '../../catalogs/cafe-formats';
import type { SALE_TYPES } from '../../catalogs/sale-types';
import type { ITBMS_RATES } from '../../catalogs/itbms-rates';
import type { PAYMENT_METHODS } from '../../catalogs/payment-methods';
import type { RETENTION_CODES } from '../../catalogs/retention-codes';
import type { OTI_CODES } from '../../catalogs/oti-codes';

// ─── Tipos de valor de catálogos ─────────────────────────────────────────────

type ContributorType = typeof CONTRIBUTOR_TYPES[keyof typeof CONTRIBUTOR_TYPES];
type IdentificationType = typeof IDENTIFICATION_TYPES[keyof typeof IDENTIFICATION_TYPES];
type EmissionType = typeof EMISSION_TYPES[keyof typeof EMISSION_TYPES];
type NatureOperation = typeof NATURE_OPERATIONS[keyof typeof NATURE_OPERATIONS];
type OperationType = typeof OPERATION_TYPES[keyof typeof OPERATION_TYPES];
type OperationDestination = typeof OPERATION_DESTINATIONS[keyof typeof OPERATION_DESTINATIONS];
type CafeFormat = typeof CAFE_FORMATS[keyof typeof CAFE_FORMATS];
type CafeDelivery = typeof CAFE_DELIVERY[keyof typeof CAFE_DELIVERY];
type SaleType = typeof SALE_TYPES[keyof typeof SALE_TYPES];
type ItbmsRate = typeof ITBMS_RATES[keyof typeof ITBMS_RATES];
type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
type RetentionCode = typeof RETENTION_CODES[keyof typeof RETENTION_CODES];
type OtiCode = typeof OTI_CODES[keyof typeof OTI_CODES];

// ─── Discriminated union para cliente ────────────────────────────────────────

export interface ClienteContribuyenteInput {
  tipoClienteFE: '01';
  tipoContribuyente: ContributorType;
  numeroRUC: string;
  digitoVerificadorRUC: string;
  razonSocial: string;
  direccion: string;
  codigoUbicacion?: string;
  provincia?: string;
  distrito?: string;
  corregimiento?: string;
  telefono1?: string;
  telefono2?: string;
  telefono3?: string;
  correo1?: string;
  correo2?: string;
  pais: string;
  paisOtro?: string;
}

export interface ClienteConsumidorFinalInput {
  tipoClienteFE: '02';
  razonSocial?: string;
  direccion?: string;
  codigoUbicacion?: string;
  provincia?: string;
  distrito?: string;
  corregimiento?: string;
  telefono1?: string;
  correo1?: string;
  pais: string;
  paisOtro?: string;
}

export interface ClienteGobiernoInput {
  tipoClienteFE: '03';
  tipoContribuyente: ContributorType;
  numeroRUC: string;
  digitoVerificadorRUC: string;
  razonSocial: string;
  direccion: string;
  codigoUbicacion?: string;
  provincia?: string;
  distrito?: string;
  corregimiento?: string;
  telefono1?: string;
  correo1?: string;
  pais: string;
  paisOtro?: string;
}

export interface ClienteExtranjeroInput {
  tipoClienteFE: '04';
  // Campos explícitamente prohibidos para Extranjero (DGI regla 4.1.B)
  tipoContribuyente?: never;
  numeroRUC?: never;
  digitoVerificadorRUC?: never;
  codigoUbicacion?: never;
  provincia?: never;
  distrito?: never;
  corregimiento?: never;
  // Campos propios del cliente extranjero
  tipoIdentificacion: IdentificationType;
  nroIdentificacionExtranjero: string;
  razonSocial?: string;
  paisExtranjero?: string;
  telefono1?: string;
  correo1?: string;
  pais: string;
  paisOtro?: string;
}

export type ClienteInput =
  | ClienteContribuyenteInput
  | ClienteConsumidorFinalInput
  | ClienteGobiernoInput
  | ClienteExtranjeroInput;

// ─── Item de entrada ─────────────────────────────────────────────────────────

export interface OtiItemInput {
  tasaOTI: OtiCode;
  valorOTI: string;
}

export interface MedicinaInput {
  nroLote: string;
  cantProductosLote: number;
}

export interface VehiculoInput {
  modalidadOperacionVenta: string;
  /** Exactamente 17 caracteres */
  chasis: string;
  marca?: string;
  modelo?: string;
  potenciaMotor: string;
  tipoCombustible: string;
  numeroMotor: string;
  capacidadPasajeros?: number;
  tipoVehiculo: string;
  usoVehiculo: string;
  tonelaje?: string;
  color?: string;
  year?: number;
}

export interface ItemInput {
  descripcion: string;
  codigo?: string;
  codigoCPBS?: string;
  codigoCPBSAbrev?: string;
  unidadMedidaCPBS?: string;
  unidadMedida?: string;
  cantidad: string;
  fechaFabricacion?: string;
  fechaCaducidad?: string;
  infoInteresItem?: string;
  precioUnitario: string;
  precioUnitarioDescuento: string;
  precioItem: string;
  precioAcarreo?: string;
  precioSeguro?: string;
  tasaITBMS: ItbmsRate;
  valorITBMS?: string;  // Si se omite, el SDK lo calcula: precioItem × tasa
  valorTotal?: string;  // Si se omite, el SDK lo calcula: precioItem + valorITBMS
  tasaISC?: string;
  valorISC?: string;
  codigoGTIN?: string;
  medicina?: MedicinaInput;
  vehiculo?: VehiculoInput;
  listaItemOTI?: OtiItemInput[];
}

// ─── Pago y plazo de entrada ──────────────────────────────────────────────────

export interface PagoInput {
  formaPagoFact: PaymentMethod;
  descFormaPago?: string;
  valorCuotaPagada: string;
}

export interface PagoPlazoInput {
  fechaVenceCuota: string;
  valorCuota: string;
}

// ─── Opciones adicionales de totales ────────────────────────────────────────

export interface DescuentoGlobalInput {
  descDescuento: string;
  montoDescuento: string;
}

export interface RetencionInput {
  codigoRetencion: RetentionCode;
  montoRetencion: string;
}

// ─── Base compartida por los 10 tipos de documento ───────────────────────────

export interface BaseEmisionInput {
  /** '0000' para casa matriz */
  codigoSucursalEmisor: string;
  tipoSucursal?: string;
  tipoEmision: EmissionType;
  /** 10 dígitos. El SDK padea con ceros a la izquierda si es necesario. */
  numeroDocumentoFiscal: string;
  /** 3 dígitos. Nunca '000'. */
  puntoFacturacionFiscal: string;
  /** ISO 8601 con timezone, ej. '2024-01-15T10:00:00-05:00' */
  fechaEmision: string;
  fechaSalida?: string;
  /** Requerido si tipoEmision es '02' o '04' (contingencia) */
  fechaInicioContingencia?: string;
  /** Requerido si tipoEmision es '02' o '04'. Entre 15 y 250 caracteres. */
  motivoContingencia?: string;
  naturalezaOperacion: NatureOperation;
  tipoOperacion: OperationType;
  destinoOperacion: OperationDestination;
  formatoCAFE: CafeFormat;
  entregaCAFE: CafeDelivery;
  /** '1' = normal (default), '2' = receptor exceptuado */
  envioContenedor?: string;
  procesoGeneracion?: string;
  tipoVenta?: SaleType;
  informacionInteres?: string;
  cliente: ClienteInput;
  items: ItemInput[];
  /** Formas de pago. Al menos una requerida. */
  pagos: PagoInput[];
  /** Requerido si tiempoPago es '2' (plazo) o '3' (mixto) */
  pagoPlazo?: PagoPlazoInput[];
  /** Descuento aplicado al total de la factura */
  descuentoGlobal?: DescuentoGlobalInput;
  /** Retención fiscal */
  retencion?: RetencionInput;
  /** Requerido si tipoEmision es '03' o '04' (uso posterior) */
  usoPosterior?: { cufe: string };
}
