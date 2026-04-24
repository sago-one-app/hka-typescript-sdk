export const CLIENT_TYPES = {
  CONTRIBUYENTE: '01',
  CONSUMIDOR_FINAL: '02',
  GOBIERNO: '03',
  EXTRANJERO: '04',
} as const;

export type ClientType = typeof CLIENT_TYPES[keyof typeof CLIENT_TYPES];
