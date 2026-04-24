export const OPERATION_TYPES = {
  SALIDA_O_VENTA: '1',
  ENTRADA_O_COMPRA: '2',
} as const;

export type OperationType = typeof OPERATION_TYPES[keyof typeof OPERATION_TYPES];
