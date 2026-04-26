import { z } from 'zod';
import { CLIENT_TYPES } from '../catalogs/client-types';
import { CONTRIBUTOR_TYPES } from '../catalogs/contributor-types';
import { IDENTIFICATION_TYPES } from '../catalogs/identification-types';

export const ClienteSchema = z.object({
  tipoClienteFE: z.nativeEnum(CLIENT_TYPES),
  tipoContribuyente: z.nativeEnum(CONTRIBUTOR_TYPES).optional(),
  numeroRUC: z.string().optional(),
  digitoVerificadorRUC: z.string().optional(),
  razonSocial: z.string().min(2).max(250).optional(),
  direccion: z.string().min(2).max(250).optional(),
  codigoUbicacion: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  corregimiento: z.string().optional(),
  tipoIdentificacion: z.nativeEnum(IDENTIFICATION_TYPES).optional(),
  nroIdentificacionExtranjero: z.string().optional(),
  paisExtranjero: z.string().optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  telefono3: z.string().optional(),
  correo1: z.string().email().optional(),
  correo2: z.string().email().optional(),
  pais: z.string().length(2),
  paisOtro: z.string().min(2).max(100).optional(),
});

export type Cliente = z.infer<typeof ClienteSchema>;
