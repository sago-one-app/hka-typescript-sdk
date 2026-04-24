export const CAFE_FORMATS = {
  SIN_GENERACION: '1',
  CINTA_PAPEL: '2',
  PAPEL_CARTA: '3',
} as const;

export type CafeFormat = typeof CAFE_FORMATS[keyof typeof CAFE_FORMATS];

export const CAFE_DELIVERY = {
  SIN_GENERACION: '1',
  CINTA_PAPEL: '2',
  PAPEL_CARTA: '3',
} as const;

export type CafeDelivery = typeof CAFE_DELIVERY[keyof typeof CAFE_DELIVERY];
