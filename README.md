# HKA SDK TypeScript

SDK desarrollado en TypeScript para la integración con los servicios web de Facturación Electrónica de The Factory HKA (Panamá).

## Instalación

Para integrar este motor en su proyecto, simplemente ejecute:

```bash
npm install hka-sdk-typescripts
# o
pnpm add hka-sdk-typescripts
```

## Inicio Rápido

Importe el cliente y los validadores directamente desde el paquete:

```typescript
import { HkaClient, DocumentValidator, XmlBuilder } from 'hka-sdk-typescripts';

const client = new HkaClient({
  baseUrl: 'https://...',
  tokenEmpresa: '...',
  tokenPassword: '...'
});

// El SDK se encarga de la validación, construcción del XML y comunicación SOAP
```

## Uso del SDK

### Configuración del Cliente

Para iniciar la comunicación con los servicios de HKA, configure una instancia de `HkaClient`:

```typescript
import { HkaClient } from './http/hka-client';

const client = new HkaClient({
  baseUrl: 'https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc',
  tokenEmpresa: 'SU_TOKEN_EMPRESA',
  tokenPassword: 'SU_TOKEN_PASSWORD'
});
```

### Emisión de Documentos (Método Enviar)

El SDK facilita la creación y envío de documentos electrónicos mediante el uso de builders y validadores internos:

```typescript
import { XmlBuilder } from './builders/xml-builder';
import { DocumentValidator } from './validators/document.validator';

// 1. Definir el documento según los tipos definidos en el SDK
const documento = {
  codigoSucursalEmisor: "0000",
  datosTransaccion: {
    tipoEmision: "01",
    tipoDocumento: "01",
    // ... resto de campos obligatorios
  },
  // ... lista de ítems y totales
};

// 2. Validar reglas de negocio antes del envío
DocumentValidator.validate(documento);

// 3. Generar XML y enviar
const xml = XmlBuilder.buildDocumentoElectronico(documento);
const response = await client.enviar(documento);

if (response.codigo === "200") {
  console.log("CUFE:", response.cufe);
}
```

### Métodos Secundarios

El SDK soporta la totalidad de los métodos requeridos para la certificación:

```typescript
// Consultar folios restantes
const folios = await client.foliosRestantes();

// Descargar XML de un documento autorizado
const xmlData = await client.descargaXML("CUFE_DEL_DOCUMENTO");

// Consultar RUC y Dígito Verificador
const rucInfo = await client.consultarRucDV("8-888-8888");
```

## Cumplimiento de Auditoría

Este SDK ha sido diseñado para superar las etapas de auditoría técnica exigidas por The Factory HKA:

- **Etapa 1**: Autenticación y gestión de entornos (Demo/Producción).
- **Etapa 3**: Construcción precisa de XML con namespaces `tem:` y `ser:`.
- **Etapa 4**: Validación de reglas condicionales (Jurídico vs Contribuyente, Destino vs País, etc.).
- **Etapa 5**: Cálculos fiscales con precisión de 2 a 6 decimales según requerimiento.
- **Etapa 6**: Implementación de métodos secundarios de soporte.

## Requisitos Técnicos

- Node.js v16 o superior.
- TypeScript v4.5 o superior.
- Axios v1.x.
- Zod v3.x.

## Licencia

Este proyecto es de uso privado y propiedad intelectual de Sago One.
