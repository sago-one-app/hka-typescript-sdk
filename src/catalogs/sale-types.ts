export const SALE_TYPES = {
  VENTA_GIRO_NEGOCIO: '1',
  VENTA_ACTIVO_FIJO: '2',
  VENTA_BIENES_RAICES: '3',
  PRESTACION_SERVICIO: '4',
} as const;

export type SaleType = typeof SALE_TYPES[keyof typeof SALE_TYPES];
