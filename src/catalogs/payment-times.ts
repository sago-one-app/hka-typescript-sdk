export const PAYMENT_TIMES = {
  INMEDIATO: '1',
  PLAZO: '2',
  MIXTO: '3',
} as const;

export type PaymentTime = typeof PAYMENT_TIMES[keyof typeof PAYMENT_TIMES];
