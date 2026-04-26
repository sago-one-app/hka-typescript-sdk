import { z } from 'zod';
import { DOCUMENT_TYPES } from '../catalogs/document-types';
import { EMISSION_TYPES } from '../catalogs/emission-types';
import { NATURE_OPERATIONS } from '../catalogs/nature-operations';
import { OPERATION_TYPES } from '../catalogs/operation-types';
import { OPERATION_DESTINATIONS } from '../catalogs/operation-destinations';
import { CAFE_FORMATS, CAFE_DELIVERY } from '../catalogs/cafe-formats';
import { SALE_TYPES } from '../catalogs/sale-types';
import { ClienteSchema } from './client.types';
import { ItemSchema } from './item.types';
import { TotalesSubTotalesSchema } from './totals.types';

export const DocFiscalReferenciadoSchema = z.object({
  fechaEmisionDocFiscalReferenciado: z.string(), // ISO date with timezone
  cufeFEReferenciada: z.string().length(66).optional(), // Requerido solo para tipoDocumento 04/05; omitir en notas genéricas (06/07)
  nroFacturaPapel: z.string().optional(),
  nroFacturaIF: z.string().optional(),
});

export const DatosFacturaExportacionSchema = z.object({
  condicionesEntrega: z.string(), // INCOTERMS
  monedaOperExportacion: z.string(), // ISO 4217
  puertoEmbarque: z.string().optional(),
  puertoDesembarque: z.string().optional(),
});

export const DatosTransaccionSchema = z.object({
  tipoEmision: z.nativeEnum(EMISSION_TYPES),
  tipoDocumento: z.nativeEnum(DOCUMENT_TYPES),
  numeroDocumentoFiscal: z.string().length(10), // Padded with zeros
  puntoFacturacionFiscal: z.string().length(3), // Padded with zeros, never '000'
  fechaEmision: z.string(), // ISO 8601 with timezone (e.g. 2022-07-15T07:49:27-05:00)
  fechaSalida: z.string().optional(), // ISO 8601 with timezone
  fechaInicioContingencia: z.string().optional(), // ISO 8601 with timezone
  motivoContingencia: z.string().optional(), // 15-250 chars
  naturalezaOperacion: z.nativeEnum(NATURE_OPERATIONS),
  tipoOperacion: z.nativeEnum(OPERATION_TYPES),
  destinoOperacion: z.nativeEnum(OPERATION_DESTINATIONS),
  formatoCAFE: z.nativeEnum(CAFE_FORMATS),
  entregaCAFE: z.nativeEnum(CAFE_DELIVERY),
  envioContenedor: z.string().default('1'), // 1=Normal, 2=Receptor exceptúa
  procesoGeneracion: z.string().default('1'),
  tipoVenta: z.nativeEnum(SALE_TYPES).optional(), // Omit if not sale
  informacionInteres: z.string().max(500).optional(),
  cliente: ClienteSchema,
});

export const UsoPosteriorSchema = z.object({
  cufe: z.string(),
});

export const DocumentoElectronicoSchema = z.object({
  codigoSucursalEmisor: z.string().length(4), // "0000" for matriz
  tipoSucursal: z.string().optional(), // '1' or '2'
  datosTransaccion: DatosTransaccionSchema,
  listaItems: z.array(ItemSchema).min(1),
  totalesSubTotales: TotalesSubTotalesSchema,
  docFiscalReferenciado: z.array(DocFiscalReferenciadoSchema).optional(),
  datosFacturaExportacion: DatosFacturaExportacionSchema.optional(),
  usoPosterior: UsoPosteriorSchema.optional(),
});

export type DatosTransaccion = z.infer<typeof DatosTransaccionSchema>;
export type DocFiscalReferenciado = z.infer<typeof DocFiscalReferenciadoSchema>;
export type DatosFacturaExportacion = z.infer<typeof DatosFacturaExportacionSchema>;
export type UsoPosterior = z.infer<typeof UsoPosteriorSchema>;
export type DocumentoElectronico = z.infer<typeof DocumentoElectronicoSchema>;
