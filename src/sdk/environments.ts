export const HKA_ENDPOINTS = {
  demo:       'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
  production: 'https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
} as const;

export type HkaEnvironment = keyof typeof HKA_ENDPOINTS;
