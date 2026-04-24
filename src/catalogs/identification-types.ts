export const IDENTIFICATION_TYPES = {
  PASAPORTE: '01',
  NUMERO_TRIBUTARIO: '02',
  OTRO: '99',
} as const;

export type IdentificationType = typeof IDENTIFICATION_TYPES[keyof typeof IDENTIFICATION_TYPES];
