import { z } from 'zod';
import { ITBMS_RATES } from '../catalogs/itbms-rates';
import { OTI_CODES } from '../catalogs/oti-codes';

export const MedicinaSchema = z.object({
  nroLote: z.string().min(5).max(35),
  cantProductosLote: z.number().int().nonnegative(),
});

export const OtiItemSchema = z.object({
  tasaOTI: z.nativeEnum(OTI_CODES),
  valorOTI: z.string(), // Number formatted as string up to 6 decimal places
});

export const VehiculoSchema = z.object({
  modalidadOperacionVenta: z.string(),
  chasis: z.string().length(17),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  potenciaMotor: z.string(),
  tipoCombustible: z.string(),
  numeroMotor: z.string(),
  capacidadPasajeros: z.number().int().optional(),
  tipoVehiculo: z.string(),
  usoVehiculo: z.string(),
  tonelaje: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().optional(),
});

export const ItemSchema = z.object({
  descripcion: z.string().min(2).max(500),
  codigo: z.string().optional(), // Internal code
  codigoCPBS: z.string().optional(), // Mandatory for government
  codigoCPBSAbrev: z.string().optional(), // Mandatory for government
  unidadMedidaCPBS: z.string().optional(), // Mandatory for government
  unidadMedida: z.string().optional(),
  cantidad: z.string(), // Number formatted as string up to 6 dec
  fechaFabricacion: z.string().optional(), // AAAA-MM-DD
  fechaCaducidad: z.string().optional(), // AAAA-MM-DD
  infoInteresItem: z.string().optional(),
  precioUnitario: z.string(), // up to 6 dec
  precioUnitarioDescuento: z.string(), // Default "0.00", up to 6 dec
  precioItem: z.string(), // = cant * (pU - pUD) up to 6 dec
  precioAcarreo: z.string().optional(),
  precioSeguro: z.string().optional(),
  valorTotal: z.string(), // = pI + pA + pS + vITBMS + vISC, up to 6 dec
  tasaITBMS: z.nativeEnum(ITBMS_RATES),
  valorITBMS: z.string(), // = tasa * pI, up to 6 dec
  tasaISC: z.string().optional(),
  valorISC: z.string().optional(),
  codigoGTIN: z.string().optional(),
  medicina: MedicinaSchema.optional(),
  vehiculo: VehiculoSchema.optional(),
  listaItemOTI: z.array(OtiItemSchema).optional(),
});

export type Item = z.infer<typeof ItemSchema>;
export type OtiItem = z.infer<typeof OtiItemSchema>;
export type Medicina = z.infer<typeof MedicinaSchema>;
export type Vehiculo = z.infer<typeof VehiculoSchema>;
