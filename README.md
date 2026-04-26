# HKA TypeScript SDK

SDK oficial en TypeScript para la integración con los servicios web de **Facturación Electrónica (FEL)** de [The Factory HKA](https://www.thefactoryhka.com.pa/) en Panamá.

[![GitHub Packages](https://img.shields.io/badge/GitHub%20Packages-%40sago--one--app%2Fhka--sdk--typescripts-blue)](https://github.com/sago-one-app/hka-typescript-sdk/pkgs/npm/hka-sdk-typescripts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-green)](https://nodejs.org/)

---

## Tabla de contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Configuración](#configuración)
- [Emisión de documentos](#emisión-de-documentos)
  - [Factura de operación interna](#factura-de-operación-interna)
  - [Otros tipos de documento](#otros-tipos-de-documento)
  - [Tipos de cliente](#tipos-de-cliente)
  - [Pagos a plazo y descuentos](#pagos-a-plazo-y-descuentos)
- [Gestión de documentos](#gestión-de-documentos)
- [Manejo de errores](#manejo-de-errores)
- [Catálogos DGI](#catálogos-dgi)
- [API de bajo nivel](#api-de-bajo-nivel)
- [Cumplimiento de auditoría](#cumplimiento-de-auditoría)

---

## Características

- **API de alto nivel** — clase `HkaSdk` que orquesta validación, construcción de XML, cálculos fiscales y envío SOAP en un solo paso.
- **10 tipos de documento** — facturas, notas de crédito/débito, reembolsos, zona franca y más.
- **Cálculos automáticos** — ITBMS, subtotales y totales se calculan por el SDK; no tienes que hacerlo manualmente.
- **Validación exhaustiva** — reglas de negocio DGI (tipo cliente ↔ destino, plazos de anulación, etc.) antes de cada envío.
- **Tipado completo** — 100 % TypeScript con tipos estrictos para todos los campos.
- **Catálogos DGI incluidos** — constantes tipadas para todos los códigos oficiales.
- **Manejo de errores estructurado** — clase `HkaError` con tipo (`VALIDATION` | `API` | `NETWORK`) y detalles.
- **Reintentos automáticos** — configurables para errores de red transitorios.

---

## Requisitos

| Dependencia | Versión mínima |
|---|---|
| Node.js | 16 |
| TypeScript | 4.5 |
| axios | 1.x |
| zod | 3.x o 4.x |

---

## Instalación

Este paquete se publica en **GitHub Packages**. Necesitas autenticarte antes de instalarlo.

**1. Configura tu `.npmrc`** (una sola vez por máquina o por proyecto):

```bash
# ~/.npmrc  o  .npmrc en la raíz de tu proyecto
@sago-one-app:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TU_GITHUB_TOKEN
```

> Necesitas un [GitHub Personal Access Token](https://github.com/settings/tokens) con el scope `read:packages`.

**2. Instala el paquete:**

```bash
npm install @sago-one-app/hka-sdk-typescripts
# o
pnpm add @sago-one-app/hka-sdk-typescripts
# o
yarn add @sago-one-app/hka-sdk-typescripts
```

---

## Inicio rápido

```typescript
import { HkaSdk, EMISSION_TYPES, NATURE_OPERATIONS, OPERATION_TYPES,
         OPERATION_DESTINATIONS, CAFE_FORMATS, CLIENT_TYPES,
         CONTRIBUTOR_TYPES, ITBMS_RATES, PAYMENT_METHODS } from '@sago-one-app/hka-sdk-typescripts';

const sdk = new HkaSdk({
  environment: 'demo',                        // 'demo' | 'production'
  tokenEmpresa: process.env.HKA_TOKEN_EMPRESA!,
  tokenPassword: process.env.HKA_TOKEN_PASSWORD!,
});

const resultado = await sdk.emitirFactura({
  codigoSucursalEmisor: '0000',
  numeroDocumentoFiscal: '0000000001',
  puntoFacturacionFiscal: '001',
  fechaEmision: '2025-01-15T10:00:00-05:00',
  tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
  naturalezaOperacion: NATURE_OPERATIONS.VENTA,
  tipoOperacion: OPERATION_TYPES.SALIDA_O_VENTA,
  destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
  formatoCAFE: CAFE_FORMATS.SIN_GENERACION,
  entregaCAFE: '1',
  cliente: {
    tipoClienteFE: CLIENT_TYPES.CONTRIBUYENTE,
    tipoContribuyente: CONTRIBUTOR_TYPES.JURIDICO,
    numeroRUC: '155596713-2-2015',
    digitoVerificadorRUC: '59',
    razonSocial: 'Empresa Compradora SA',
    direccion: 'Ave. Balboa, Ciudad de Panamá',
    pais: 'PA',
  },
  items: [
    {
      descripcion: 'Servicio de consultoría',
      cantidad: '1',
      precioUnitario: '100.00',
      precioUnitarioDescuento: '0.00',
      precioItem: '100.00',
      tasaITBMS: ITBMS_RATES.ESTANDAR,   // 7 % — valorITBMS se calcula solo
    },
  ],
  pagos: [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' }],
});

console.log('CUFE:', resultado.cufe);
console.log('Protocolo:', resultado.nroProtocoloAutorizacion);
```

> El SDK calcula automáticamente `valorITBMS`, `valorTotal` de cada ítem y todos los totalesSubTotales. Solo debes proporcionar `precioItem`.

---

## Configuración

```typescript
import { HkaSdk, HkaSdkConfig } from '@sago-one-app/hka-sdk-typescripts';

const config: HkaSdkConfig = {
  environment: 'production',          // Cambia a 'production' cuando estés listo
  tokenEmpresa: 'TU_TOKEN_EMPRESA',
  tokenPassword: 'TU_TOKEN_PASSWORD',

  // Opcionales
  timeoutMs: 30_000,     // Tiempo de espera por request (ms). Default: 30 000
  maxRetries: 3,          // Reintentos ante errores de red. Default: 3
  customEndpoint: 'https://mi-staging.ejemplo.com/ws/Service.svc',  // Solo staging
};

const sdk = new HkaSdk(config);
```

### Endpoints predeterminados

| Ambiente | URL |
|---|---|
| `demo` | `https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc` |
| `production` | `https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc` |

### Variables de entorno recomendadas

```env
HKA_ENVIRONMENT=demo
HKA_TOKEN_EMPRESA=xxxxxxxxxxxxxxxx
HKA_TOKEN_PASSWORD=yyyyyyyyyyyyyyyy
```

---

## Emisión de documentos

Todos los métodos de emisión reciben un objeto de entrada tipado y devuelven un `Promise<EmisionResult>`:

```typescript
interface EmisionResult {
  success: true;
  cufe: string;
  qr?: string;
  fechaRecepcionDGI?: string;
  nroProtocoloAutorizacion?: string;
}
```

### Factura de operación interna

```typescript
const resultado = await sdk.emitirFactura(input);
```

### Otros tipos de documento

| Método | Tipo de documento |
|---|---|
| `emitirFactura(input)` | Factura de operación interna (01) |
| `emitirFacturaImportacion(input)` | Factura de importación (02) |
| `emitirFacturaExportacion(input)` | Factura de exportación (03) |
| `emitirNotaCreditoReferenciada(input)` | Nota de crédito referente a FE (04) |
| `emitirNotaDebitoReferenciada(input)` | Nota de débito referente a FE (05) |
| `emitirNotaCreditoGenerica(input)` | Nota de crédito genérica (06) |
| `emitirNotaDebitoGenerica(input)` | Nota de débito genérica (07) |
| `emitirFacturaZonaFranca(input)` | Factura de zona franca (08) |
| `emitirReembolso(input)` | Reembolso (09) |
| `emitirFacturaExtranjero(input)` | Factura de operación extranjera (10) |

#### Nota de crédito referenciada

```typescript
const resultado = await sdk.emitirNotaCreditoReferenciada({
  // ...campos base iguales que FacturaInput...
  docFiscalReferenciado: [
    {
      cufeFEReferenciada: 'CUFE_DEL_DOCUMENTO_ORIGINAL',
      fechaEmisionDocFiscalReferenciado: '2025-01-10T09:00:00-05:00',
    },
  ],
});
```

> El SDK valida automáticamente que no hayan pasado más de 5 días desde la emisión del documento referenciado.

#### Factura de exportación

```typescript
const resultado = await sdk.emitirFacturaExportacion({
  // ...campos base...
  datosFacturaExportacion: {
    exportacionClassif: '01',
    exportacionDestin: 'US',
    exportacionDescription: 'Exportación de software',
  },
});
```

### Tipos de cliente

El campo `cliente` es un discriminated union según `tipoClienteFE`:

#### Contribuyente (01)

```typescript
cliente: {
  tipoClienteFE: CLIENT_TYPES.CONTRIBUYENTE,   // '01'
  tipoContribuyente: CONTRIBUTOR_TYPES.JURIDICO,
  numeroRUC: '155596713-2-2015',
  digitoVerificadorRUC: '59',
  razonSocial: 'Empresa SA',
  direccion: 'Ave. Central',
  pais: 'PA',
  correo1: 'facturacion@empresa.com',   // opcional
}
```

#### Consumidor final (02)

```typescript
cliente: {
  tipoClienteFE: CLIENT_TYPES.CONSUMIDOR_FINAL,  // '02'
  razonSocial: 'Consumidor Final',
  pais: 'PA',
}
```

#### Gobierno (03)

```typescript
cliente: {
  tipoClienteFE: CLIENT_TYPES.GOBIERNO,  // '03'
  tipoContribuyente: CONTRIBUTOR_TYPES.JURIDICO,
  numeroRUC: '3-740-2023',
  digitoVerificadorRUC: '15',
  razonSocial: 'Ministerio de Economía',
  direccion: 'Av. Perú, Panamá',
  pais: 'PA',
}
```

#### Extranjero (04)

```typescript
cliente: {
  tipoClienteFE: CLIENT_TYPES.EXTRANJERO,  // '04'
  tipoIdentificacion: IDENTIFICATION_TYPES.PASAPORTE,
  nroIdentificacionExtranjero: 'AB123456',
  razonSocial: 'Foreign Corp LLC',
  paisExtranjero: 'US',
  pais: 'US',
}
```

### Pagos a plazo y descuentos

#### Pago a plazo

```typescript
const resultado = await sdk.emitirFactura({
  // ...campos base...
  pagos: [{ formaPagoFact: PAYMENT_METHODS.TRANSFERENCIA, valorCuotaPagada: '0.00' }],
  pagoPlazo: [
    { fechaVenceCuota: '2025-02-15', valorCuota: '500.00' },
    { fechaVenceCuota: '2025-03-15', valorCuota: '500.00' },
  ],
});
```

#### Descuento global

```typescript
const resultado = await sdk.emitirFactura({
  // ...campos base...
  descuentoGlobal: {
    descDescuento: 'Descuento comercial 10%',
    montoDescuento: '50.00',
  },
});
```

#### Retención

```typescript
const resultado = await sdk.emitirFactura({
  // ...campos base...
  retencion: {
    codigoRetencion: RETENTION_CODES.RETENCION_10,
    montoRetencion: '10.70',
  },
});
```

---

## Gestión de documentos

Todos los métodos de gestión reciben un objeto `DatosDocumento` que identifica el documento:

```typescript
import { DatosDocumento, DOCUMENT_TYPES, EMISSION_TYPES } from '@sago-one-app/hka-sdk-typescripts';

const datos: DatosDocumento = {
  codigoSucursalEmisor: '0000',
  numeroDocumentoFiscal: '0000000001',
  puntoFacturacionFiscal: '001',
  tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
  tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
};
```

### Consultar estado

```typescript
const estado = await sdk.consultarEstado(datos);
// { success: true, mensaje: '...', cufe: '...', estatusDocumento: '...' }
```

### Anular documento

```typescript
await sdk.anularDocumento(datos, 'Error en los datos del receptor', fechaEmisionOriginal);
// El SDK valida que no hayan pasado más de 7 días desde la emisión
```

### Descargar PDF (CAFE)

```typescript
const { pdf } = await sdk.descargarPDF(datos);
// pdf: string en Base64 — puedes escribirlo a disco o enviarlo al navegador
import { writeFileSync } from 'fs';
writeFileSync('factura.pdf', Buffer.from(pdf, 'base64'));
```

### Descargar XML firmado

```typescript
const { xmlFirmado } = await sdk.descargarXML(datos);
```

### Enviar por correo electrónico

```typescript
await sdk.enviarPorCorreo(datos, 'cliente@empresa.com');
```

### Rastrear correos enviados

```typescript
const rastreo = await sdk.rastrearCorreo(cufe);
```

### Consultar folios restantes

```typescript
const { foliosRestantes } = await sdk.consultarFoliosRestantes();
console.log('Folios disponibles:', foliosRestantes);
```

### Consultar RUC / DV

```typescript
const resultado = await sdk.consultarRucDV('155596713-2-2015', '2');
if (resultado.infoRuc) {
  console.log('DV:', resultado.infoRuc.dv);
  console.log('Afiliado FE:', resultado.infoRuc.afiliadoFE);
}
```

---

## Manejo de errores

Todos los métodos del SDK lanzan `HkaError` en caso de fallo. El error tiene tres tipos:

| `type` | Causa |
|---|---|
| `VALIDATION` | Datos inválidos, regla de negocio DGI incumplida o error de schema |
| `API` | La API HKA devolvió un código de error (duplicado, sin folios, etc.) |
| `NETWORK` | Error de red o timeout al contactar el WS |

```typescript
import { HkaError } from '@sago-one-app/hka-sdk-typescripts';

try {
  const resultado = await sdk.emitirFactura(input);
  console.log('CUFE:', resultado.cufe);
} catch (err) {
  if (HkaError.isHkaError(err)) {
    switch (err.type) {
      case 'VALIDATION':
        console.error('Datos inválidos:', err.message);
        if (err.details.zodIssues) {
          err.details.zodIssues.forEach(issue =>
            console.error(` - ${issue.path.join('.')}: ${issue.message}`)
          );
        }
        break;

      case 'API':
        console.error(`Error HKA [${err.details.codigoHka}]:`, err.message);
        break;

      case 'NETWORK':
        console.error('Error de red:', err.message);
        break;
    }
  } else {
    throw err;  // Error inesperado — propagar
  }
}
```

### Códigos de respuesta HKA

| Código | Significado |
|---|---|
| `200` | Éxito |
| `102` | Documento duplicado |
| `119` | Sin folios disponibles |
| `300` | Requiere reenvío |

---

## Catálogos DGI

El SDK exporta todos los catálogos oficiales como constantes de TypeScript con tipado estricto:

```typescript
import {
  DOCUMENT_TYPES,           // Tipos de documento (01–10)
  EMISSION_TYPES,           // Tipos de emisión (01–04)
  CLIENT_TYPES,             // Tipos de cliente FE (01–04)
  CONTRIBUTOR_TYPES,        // Natural / Jurídico
  NATURE_OPERATIONS,        // Naturaleza de la operación
  OPERATION_TYPES,          // Salida/Venta, Entrada/Compra
  OPERATION_DESTINATIONS,   // Panamá / Extranjero
  PAYMENT_METHODS,          // Formas de pago (01–09, 99)
  PAYMENT_TIMES,            // Inmediato / Plazo / Mixto
  ITBMS_RATES,              // 00=Exento, 01=7%, 02=10%, 03=15%
  CAFE_FORMATS,             // Formatos CAFE
  IDENTIFICATION_TYPES,     // Tipos de identificación extranjero
  SALE_TYPES,               // Tipos de venta
  RETENTION_CODES,          // Códigos de retención
  OTI_CODES,                // Códigos OTI
} from '@sago-one-app/hka-sdk-typescripts';
```

Ejemplo de uso de catálogos:

```typescript
// En lugar de cadenas mágicas como '01', '7%', etc.
tasaITBMS: ITBMS_RATES.ESTANDAR         // '01' (7%)
tasaITBMS: ITBMS_RATES.EXENTO           // '00'
tasaITBMS: ITBMS_RATES.DIEZ_PORCIENTO  // '02' (10%)
tasaITBMS: ITBMS_RATES.QUINCE_PORCIENTO // '03' (15%)

tipoClienteFE: CLIENT_TYPES.CONTRIBUYENTE   // '01'
tipoClienteFE: CLIENT_TYPES.CONSUMIDOR_FINAL // '02'
tipoClienteFE: CLIENT_TYPES.GOBIERNO         // '03'
tipoClienteFE: CLIENT_TYPES.EXTRANJERO       // '04'
```

---

## API de bajo nivel

Si necesitas control total sobre la construcción del documento, puedes usar las clases individuales en lugar de `HkaSdk`:

```typescript
import {
  HkaClient,
  XmlBuilder,
  TotalsCalculator,
  ItbmsCalculator,
  ClientValidator,
  DocumentValidator,
  TotalsValidator,
} from '@sago-one-app/hka-sdk-typescripts';

// 1. Cliente SOAP
const client = new HkaClient({
  endpoint: 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
  tokenEmpresa: 'TOKEN',
  tokenPassword: 'PASSWORD',
  timeoutMs: 30_000,
  maxRetries: 3,
});

// 2. Calcular ITBMS por ítem manualmente
const valorITBMS = ItbmsCalculator.calculateItemItbms(ITBMS_RATES.ESTANDAR, 100.00);

// 3. Calcular totales
const totales = TotalsCalculator.calculate(
  items,
  [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' }],
  PAYMENT_TIMES.INMEDIATO,
);

// 4. Validar (lanzan Error si hay problema)
ClientValidator.validate(cliente, destinoOperacion);
DocumentValidator.validate(documento);
TotalsValidator.validate(documento);

// 5. Construir XML
const xml = XmlBuilder.buildDocumentoElectronico(documento);

// 6. Enviar
const response = await client.enviar(xml);
```

---

## Cumplimiento de auditoría

Este SDK ha sido diseñado para superar todas las etapas de auditoría técnica de The Factory HKA:

| Etapa | Descripción | Estado |
|---|---|---|
| 1 | Autenticación por tokens en cada request SOAP | ✅ |
| 2 | Catálogos completos con todos los códigos DGI | ✅ |
| 3 | XML con namespaces `tem:` / `ser:` correctos; campos vacíos omitidos | ✅ |
| 4 | Validación de reglas condicionales (Jurídico→Contribuyente, CPBS Gobierno, etc.) | ✅ |
| 5 | Cálculos fiscales con precisión de 2 a 6 decimales | ✅ |
| 6 | Los 9 métodos del WS implementados con estructura SOAP correcta | ✅ |
| 7 | Los 14 casos de prueba obligatorios DGI cubiertos por tests automatizados | ✅ |

---

## Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar tests
npm test
```

---

*Este proyecto es propiedad intelectual de Sago One.*
