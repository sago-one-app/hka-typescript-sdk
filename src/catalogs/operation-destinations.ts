export const OPERATION_DESTINATIONS = {
  PANAMA: '1',
  EXTRANJERO: '2',
} as const;

export type OperationDestination = typeof OPERATION_DESTINATIONS[keyof typeof OPERATION_DESTINATIONS];
