# Changelog

All notable changes to this project are documented in this file.

## [1.1.0] - 2026-04-26

### Added
- `VehiculoInput` type exposed in `base.input.ts` for type-safe vehicle item declarations.
- Validation: `descFormaPago` is now required when `formaPagoFact = '99'` (forma de pago "Otro").
- Tests for all secondary SDK methods: `consultarEstado`, `descargarPDF`, `descargarXML`,
  `consultarFoliosRestantes`, `enviarPorCorreo`, `rastrearCorreo`, `consultarRucDV`.
- Tests for previously untested document types: `emitirFacturaImportacion`,
  `emitirFacturaZonaFranca`, `emitirReembolso`, `emitirFacturaExtranjero`.
- Tests for `descFormaPago` and `paisOtro` validations.
- Tests for vehicle item XML generation.

### Fixed
- `ItemInput` was missing the `vehiculo` field even though `Item` (internal type) supported it.

## [1.0.0] - 2025-12-01

### Added
- Initial release.
- `HkaSdk` high-level class with orchestration of all 10 DGI document types.
- `HkaClient` SOAP client with all 9 WS methods and retry logic.
- `XmlBuilder` / `SoapEnvelopeBuilder` for correct XML and SOAP construction.
- `TotalsCalculator`, `ItbmsCalculator`, `RucDvCalculator`.
- Complete DGI catalog set (16 catalogs).
- `ClientValidator`, `DocumentValidator`, `TotalsValidator`, `ContingencyValidator`,
  `AnulacionValidator`, `NotaReferenciadaValidator`.
- `HkaError` with typed error categories (`VALIDATION` | `API` | `NETWORK`).
- All 14 mandatory DGI audit test cases covered by automated tests.
- Demo and production environment endpoints.
