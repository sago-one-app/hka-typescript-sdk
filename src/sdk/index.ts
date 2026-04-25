export { HkaSdk } from './hka-sdk';
export type { HkaSdkConfig } from './hka-sdk';
export { HkaError, HKA_CODES } from './errors';
export type { HkaErrorType, HkaErrorDetails, HkaCode } from './errors';
export { HKA_ENDPOINTS } from './environments';
export type { HkaEnvironment } from './environments';
export type {
  EmisionResult,
  AnulacionResult,
  GestionResult,
  DescargaPDFResult,
  DescargaXMLResult,
  FoliosResult,
  ConsultarRucDVResult,
} from './result.types';
export type {
  BaseEmisionInput,
  ClienteInput,
  ClienteContribuyenteInput,
  ClienteConsumidorFinalInput,
  ClienteGobiernoInput,
  ClienteExtranjeroInput,
  ItemInput,
  PagoInput,
  PagoPlazoInput,
  DescuentoGlobalInput,
  RetencionInput,
} from './inputs/base.input';
export type {
  FacturaInput,
  FacturaImportacionInput,
  FacturaExportacionInput,
  FacturaZonaFrancaInput,
  ReembolsoInput,
  FacturaExtranjeroInput,
} from './inputs/factura.input';
export type {
  NotaCreditoReferenciadaInput,
  NotaDebitoReferenciadaInput,
  NotaCreditoGenericaInput,
  NotaDebitoGenericaInput,
  DocFiscalReferenciadoInput,
  DocFiscalGenericaInput,
} from './inputs/nota.input';
