export type HkaErrorType = 'VALIDATION' | 'API' | 'NETWORK';

export interface HkaErrorDetails {
  codigoHka?: string;
  zodIssues?: Array<{ path: (string | number)[]; message: string }>;
  cause?: unknown;
}

export class HkaError extends Error {
  readonly type: HkaErrorType;
  readonly details: HkaErrorDetails;

  constructor(type: HkaErrorType, message: string, details: HkaErrorDetails = {}) {
    super(message);
    this.name = 'HkaError';
    this.type = type;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HkaError);
    }
  }

  static isHkaError(err: unknown): err is HkaError {
    return err instanceof HkaError;
  }
}

/**
 * Códigos de respuesta del Web Service HKA.
 * Fuente: Catálogo de Códigos de Retorno del Servicio — The Factory HKA Panamá.
 */
export const HKA_CODES = {
  // ─── Éxito ───────────────────────────────────────────────────────────────
  SUCCESS:                    '200',  // Documento procesado correctamente

  // ─── Advertencias / estados especiales ────────────────────────────────────
  DUPLICATE:                  '102',  // Documento duplicado (ya fue procesado)
  RESEND:                     '300',  // Reenvío requerido por la DGI

  // ─── Errores de autenticación ─────────────────────────────────────────────
  INVALID_TOKEN:              '101',  // Token de empresa o contraseña inválidos
  UNAUTHORIZED:               '103',  // Sin permisos para el recurso solicitado

  // ─── Errores de folio/licencia ────────────────────────────────────────────
  NO_FOLIOS:                  '119',  // Sin folios disponibles en el ciclo actual
  LICENSE_EXPIRED:            '120',  // Licencia vencida o suspendida
  FOLIO_LIMIT_REACHED:        '121',  // Límite de folios del ciclo alcanzado

  // ─── Errores de documento ─────────────────────────────────────────────────
  INVALID_XML:                '104',  // XML malformado o no cumple con el esquema
  INVALID_DOCUMENT_TYPE:      '105',  // Tipo de documento no reconocido
  INVALID_RUC:                '106',  // RUC del emisor o receptor inválido
  INVALID_DATE:               '107',  // Fecha de emisión inválida o fuera de rango
  INVALID_AMOUNT:             '108',  // Montos o cálculos fiscales incorrectos
  INVALID_ITBMS:              '109',  // Tasa o monto ITBMS incorrecto
  MISSING_REQUIRED_FIELD:     '110',  // Campo obligatorio ausente en el documento
  DOCUMENT_NOT_FOUND:         '111',  // Documento no encontrado en el sistema HKA
  DOCUMENT_ALREADY_CANCELLED: '112',  // El documento ya fue anulado previamente
  CANCELLATION_PERIOD_EXPIRED:'113',  // Plazo de anulación (7 días) expirado
  INVALID_CPBS:               '114',  // Código CPBS inválido o no encontrado
  INVALID_CUFE:               '115',  // CUFE de referencia inválido o mal formado
  REFERENCE_PERIOD_EXPIRED:   '116',  // Plazo para nota referenciada expirado (>180 días)
  INVALID_SIGNATURE:          '117',  // Firma electrónica inválida o certificado vencido
  DGI_COMMUNICATION_ERROR:    '118',  // Error al comunicarse con la DGI (reintento sugerido)

  // ─── Errores de correo ────────────────────────────────────────────────────
  EMAIL_NOT_SENT:             '201',  // Error al enviar el correo electrónico
  INVALID_EMAIL:              '202',  // Dirección de correo electrónico inválida

  // ─── Errores de descarga ──────────────────────────────────────────────────
  PDF_NOT_AVAILABLE:          '211',  // PDF no disponible (documento aún en proceso)
  XML_NOT_AVAILABLE:          '212',  // XML firmado no disponible

  // ─── Errores internos ─────────────────────────────────────────────────────
  INTERNAL_ERROR:             '500',  // Error interno del servidor HKA
  SERVICE_UNAVAILABLE:        '503',  // Servicio temporalmente no disponible
} as const;

export type HkaCode = typeof HKA_CODES[keyof typeof HKA_CODES];

/** Descripciones legibles por los desarrolladores, indexadas por código HKA */
export const HKA_CODE_DESCRIPTIONS: Record<string, string> = {
  '200': 'Documento procesado correctamente',
  '101': 'Token de empresa o contraseña inválidos',
  '102': 'Documento duplicado — ya fue procesado anteriormente',
  '103': 'Sin permisos para el recurso solicitado',
  '104': 'XML malformado o no cumple con el esquema DGI',
  '105': 'Tipo de documento no reconocido',
  '106': 'RUC del emisor o receptor inválido',
  '107': 'Fecha de emisión inválida o fuera de rango permitido',
  '108': 'Montos o cálculos fiscales incorrectos',
  '109': 'Tasa o monto ITBMS incorrecto',
  '110': 'Campo obligatorio ausente en el documento',
  '111': 'Documento no encontrado en el sistema HKA',
  '112': 'El documento ya fue anulado previamente',
  '113': 'Plazo de anulación expirado (máximo 7 días hábiles)',
  '114': 'Código CPBS inválido o no encontrado',
  '115': 'CUFE de referencia inválido o mal formado',
  '116': 'Plazo para nota referenciada expirado (máximo 180 días)',
  '117': 'Firma electrónica inválida o certificado vencido',
  '118': 'Error de comunicación con la DGI — reintente la operación',
  '119': 'Sin folios disponibles en el ciclo actual — contacte a HKA',
  '120': 'Licencia vencida o suspendida',
  '121': 'Límite de folios del ciclo alcanzado',
  '201': 'Error al enviar el correo electrónico',
  '202': 'Dirección de correo electrónico inválida',
  '211': 'PDF no disponible — el documento puede estar en proceso',
  '212': 'XML firmado no disponible',
  '300': 'Reenvío requerido — el documento debe enviarse nuevamente',
  '500': 'Error interno del servidor HKA',
  '503': 'Servicio temporalmente no disponible — reintente más tarde',
};
