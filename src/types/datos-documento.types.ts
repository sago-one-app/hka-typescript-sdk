import { z } from 'zod';
import { DOCUMENT_TYPES } from '../catalogs/document-types';
import { EMISSION_TYPES } from '../catalogs/emission-types';

export const DatosDocumentoSchema = z.object({
  codigoSucursalEmisor: z.string().length(4),
  numeroDocumentoFiscal: z.string().length(10),
  puntoFacturacionFiscal: z.string().length(3).refine((v) => v !== '000', {
    message: 'puntoFacturacionFiscal no puede ser "000"',
  }),
  tipoDocumento: z.nativeEnum(DOCUMENT_TYPES),
  tipoEmision: z.nativeEnum(EMISSION_TYPES),
  serialDispositivo: z.string().optional(),
});

export type DatosDocumento = z.infer<typeof DatosDocumentoSchema>;
