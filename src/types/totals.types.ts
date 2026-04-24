import { z } from 'zod';
import { PAYMENT_METHODS } from '../catalogs/payment-methods';
import { OTI_CODES } from '../catalogs/oti-codes';
import { RETENTION_CODES } from '../catalogs/retention-codes';
import { PAYMENT_TIMES } from '../catalogs/payment-times';

export const FormaPagoSchema = z.object({
  formaPagoFact: z.nativeEnum(PAYMENT_METHODS),
  descFormaPago: z.string().optional(), // Mandatory if formaPagoFact === '99'
  valorCuotaPagada: z.string(), // Number formatted as string up to 2 decimal places
});

export const PagoPlazoSchema = z.object({
  fechaVenceCuota: z.string(), // ISO String with timezone
  valorCuota: z.string(), // Number formatted as string up to 2 decimal places
});

export const TotalOTISchema = z.object({
  tasaOTI: z.nativeEnum(OTI_CODES),
  valorTotalOTI: z.string(), // Number formatted as string up to 2 decimal places
});

export const RetencionSchema = z.object({
  codigoRetencion: z.nativeEnum(RETENTION_CODES),
  montoRetencion: z.string(), // Number formatted as string up to 2 decimal places
});

export const DescuentoBonificacionSchema = z.object({
  descDescuento: z.string(),
  montoDescuento: z.string(), // Number formatted as string up to 2 decimal places
});

export const TotalesSubTotalesSchema = z.object({
  totalPrecioNeto: z.string(), // Sum of precioItem of all items, up to 2 dec
  totalITBMS: z.string(), // Sum of valorITBMS of all items, up to 2 dec
  totalISC: z.string(), // Sum of valorISC of all items, up to 2 dec
  totalMontoGravado: z.string(), // totalITBMS + totalISC + totalOTI, up to 2 dec
  totalDescuento: z.string().optional(), // Omit if 0
  totalAcarreoCobrado: z.string().optional(), // Omit if 0
  valorSeguroCobrado: z.string().optional(), // Omit if 0
  totalFactura: z.string(), // totalTodosItems + acarreo + seguro - descuento
  totalValorRecibido: z.string(), // Sum of valorCuotaPagada
  vuelto: z.string().optional(), // totalValorRecibido - totalFactura. Omit if <= 0
  tiempoPago: z.nativeEnum(PAYMENT_TIMES),
  nroItems: z.number().int().positive(), // Count of items
  totalTodosItems: z.string(), // Sum of valorTotal of all items
  listaFormaPago: z.array(FormaPagoSchema).min(1),
  listaPagoPlazo: z.array(PagoPlazoSchema).optional(), // Mandatory if tiempoPago === '2' or '3'
  listaTotalOTI: z.array(TotalOTISchema).optional(),
  retencion: RetencionSchema.optional(),
  descuentoBonificacion: z.array(DescuentoBonificacionSchema).optional(),
});

export type FormaPago = z.infer<typeof FormaPagoSchema>;
export type PagoPlazo = z.infer<typeof PagoPlazoSchema>;
export type TotalOTI = z.infer<typeof TotalOTISchema>;
export type Retencion = z.infer<typeof RetencionSchema>;
export type DescuentoBonificacion = z.infer<typeof DescuentoBonificacionSchema>;
export type TotalesSubTotales = z.infer<typeof TotalesSubTotalesSchema>;
