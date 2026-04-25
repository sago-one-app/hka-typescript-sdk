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

/** HKA WS response codes */
export const HKA_CODES = {
  SUCCESS:    '200',
  DUPLICATE:  '102',
  NO_FOLIOS:  '119',
  RESEND:     '300',
} as const;

export type HkaCode = typeof HKA_CODES[keyof typeof HKA_CODES];

