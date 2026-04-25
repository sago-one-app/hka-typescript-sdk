# HKA SDK TypeScript

SDK desarrollado en TypeScript para la integración con los servicios web de Facturación Electrónica de The Factory HKA (Panamá).

## Instalación

```bash
npm install hka-sdk-typescripts
# o
pnpm add hka-sdk-typescripts
```

## Inicio Rápido

```typescript
import { HkaClient, XmlBuilder, DocumentValidator, TotalsValidator, ClientValidator } from 'hka-sdk-typescripts';

const client = new HkaClient({
  endpoint: 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
  tokenEmpresa: 'SU_TOKEN_EMPRESA',
  tokenPassword: 'SU_TOKEN_PASSWORD',
});
```

## Uso del SDK

### Configuración del Cliente

```typescript
import { HkaClient } from 'hka-sdk-typescripts';

const client = new HkaClient({
  endpoint: process.env.HKA_ENDPOINT!,   // URL del WS (demo o producción)
  tokenEmpresa: process.env.HKA_TOKEN_EMPRESA!,
  tokenPassword: process.env.HKA_TOKEN_PASSWORD!,
  timeoutMs: 30000,   // 30 segundos recomendado
  maxRetries: 3,
});
```

### Emisión de Documentos (Método Enviar)

```typescript
import {
  HkaClient, XmlBuilder, DocumentValidator, TotalsValidator, ClientValidator,
  DOCUMENT_TYPES, EMISSION_TYPES, NATURE_OPERATIONS, OPERATION_TYPES,
  OPERATION_DESTINATIONS, CAFE_FORMATS, CAFE_DELIVERY, PAYMENT_METHODS,
  PAYMENT_TIMES, ITBMS_RATES, CLIENT_TYPES, CONTRIBUTOR_TYPES,
  TotalsCalculator, ItbmsCalculator,
} from 'hka-sdk-typescripts';

// 1. Construir el documento
const documento = {
  codigoSucursalEmisor: '0000',
  datosTransaccion: {
    tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
    tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
    numeroDocumentoFiscal: '0000000001',
    puntoFacturacionFiscal: '001',
    fechaEmision: new Date().toISOString().replace('Z', '-05:00'),
    naturalezaOperacion: NATURE_OPERATIONS.VENTA,
    tipoOperacion: OPERATION_TYPES.SALIDA_O_VENTA,
    destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
    formatoCAFE: CAFE_FORMATS.SIN_GENERACION,
    entregaCAFE: CAFE_DELIVERY.SIN_GENERACION,
    envioContenedor: '1',
    procesoGeneracion: '1',
    cliente: {
      tipoClienteFE: CLIENT_TYPES.CONTRIBUYENTE,
      tipoContribuyente: CONTRIBUTOR_TYPES.JURIDICO,
      numeroRUC: '155596713-2-2015',
      digitoVerificadorRUC: '59',
      razonSocial: 'Mi Empresa SA',
      direccion: 'Ave. Balboa, Ciudad de Panamá',
      pais: 'PA',
    },
  },
  listaItems: [
    {
      descripcion: 'Servicio de consultoría',
      cantidad: '1',
      precioUnitario: '100.00',
      precioUnitarioDescuento: '0.00',
      precioItem: '100.00',
      valorTotal: '107.00',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
      valorITBMS: '7.00',
    },
  ],
  totalesSubTotales: TotalsCalculator.calculate(
    items,
    [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' }],
    PAYMENT_TIMES.INMEDIATO
  ),
};

// 2. Validar reglas de negocio
ClientValidator.validate(documento.datosTransaccion.cliente, documento.datosTransaccion.destinoOperacion);
DocumentValidator.validate(documento);
TotalsValidator.validate(documento);

// 3. Construir XML y enviar
const xml = XmlBuilder.buildDocumentoElectronico(documento);
const response = await client.enviar(xml);

if (response.codigo === '200') {
  console.log('CUFE:', response.cufe);
  console.log('Protocolo:', response.nroProtocoloAutorizacion);
}
```

### Métodos Secundarios

Todos los métodos secundarios reciben un objeto `DatosDocumento` que identifica el documento:

```typescript
import { DatosDocumento, DOCUMENT_TYPES, EMISSION_TYPES } from 'hka-sdk-typescripts';

const datosDoc: DatosDocumento = {
  codigoSucursalEmisor: '0000',
  numeroDocumentoFiscal: '0000000001',
  puntoFacturacionFiscal: '001',
  tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
  tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
};

// Consultar estado de un documento
const estado = await client.estadoDocumento(datosDoc);

// Descargar XML firmado
const xml = await client.descargaXML(datosDoc);

// Descargar PDF (CAFE)
const pdf = await client.descargaPDF(datosDoc);

// Enviar por correo (un correo por llamada)
const correo = await client.envioCorreo(datosDoc, 'cliente@empresa.com');

// Anular (con validación de plazo de 7 días)
import { AnulacionValidator } from 'hka-sdk-typescripts';
AnulacionValidator.validatePlazo(fechaEmisionOriginal); // Lanza error si > 7 días
const anulacion = await client.anulacionDocumento(datosDoc, 'Error en los datos del receptor');

// Rastreo de correos enviados (usa CUFE, no DatosDocumento)
const rastreo = await client.rastreoCorreo(cufe);

// Consultar folios disponibles
const folios = await client.foliosRestantes();

// Consultar RUC y Dígito Verificador
const rucInfo = await client.consultarRucDV('155596713-2-2015', '2');
if (rucInfo.infoRuc) {
  console.log('DV:', rucInfo.infoRuc.dv);
  console.log('Afiliado FE:', rucInfo.infoRuc.afiliadoFE);
}
```

## Catálogos disponibles

```typescript
import {
  DOCUMENT_TYPES,       // Tipos de documento (01-10)
  EMISSION_TYPES,       // Tipos de emisión (01-04)
  CLIENT_TYPES,         // Tipos de cliente FE (01-04)
  CONTRIBUTOR_TYPES,    // Tipos de contribuyente (Natural/Jurídico)
  NATURE_OPERATIONS,    // Naturaleza de la operación
  OPERATION_TYPES,      // Tipo de operación (Salida/Entrada)
  OPERATION_DESTINATIONS, // Destino (Panamá/Extranjero)
  PAYMENT_METHODS,      // Formas de pago (01-09, 99)
  PAYMENT_TIMES,        // Tiempo de pago (Inmediato/Plazo/Mixto)
  ITBMS_RATES,          // Tasas ITBMS (00=Exento, 01=7%, 02=10%, 03=15%)
  CAFE_FORMATS,         // Formatos CAFE
  SALE_TYPES,           // Tipos de venta
  IDENTIFICATION_TYPES, // Tipos de identificación extranjero
  OTI_CODES,            // Códigos OTI
  RETENTION_CODES,      // Códigos de retención
} from 'hka-sdk-typescripts';
```

## Cumplimiento de Auditoría

Este SDK ha sido diseñado para superar las etapas de auditoría técnica exigidas por The Factory HKA:

- **Etapa 1**: Autenticación por tokens en cada request SOAP. URL configurable por ambiente.
- **Etapa 2**: Catálogos completos con todos los códigos DGI.
- **Etapa 3**: Construcción precisa de XML con namespaces `tem:` y `ser:`. Campos opcionales sin valor se omiten (nunca vacíos).
- **Etapa 4**: Validación de reglas condicionales (Jurídico→Contribuyente, Destino↔País, CPBS para Gobierno, etc.).
- **Etapa 5**: Cálculos fiscales con precisión de 2 a 6 decimales según requerimiento.
- **Etapa 6**: Los 9 métodos del WS implementados con estructura SOAP correcta.
- **Etapa 7**: Los 14 casos de prueba obligatorios DGI cubiertos por tests automatizados.

## Requisitos Técnicos

- Node.js v16 o superior.
- TypeScript v4.5 o superior.
- Axios v1.x.
- Zod v3.x.

## Estado del Proyecto

Actualmente en fase de desarrollo y pruebas de integración. Se planea publicación oficial en npm una vez validada la integración completa en ambiente de producción.

---

Este proyecto es propiedad intelectual de Sago One.
