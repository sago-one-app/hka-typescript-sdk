# Etapa 1 — Autenticación y Configuración de Entornos

> **Fuente**: `../01_documentos_fel/01_manual_integracion_ws.md`
> **Prioridad**: 🔴 CRÍTICA — Sin esto, nada funciona.

---

## 1.1 — Credenciales de acceso

La autenticación con HKA se hace mediante dos tokens enviados en **cada request SOAP**,
NO mediante headers HTTP ni Bearer tokens.

### Verificar en el código:

**[V-1.1.1]** ¿Existen variables de entorno para los tokens?
```
Debe existir:
  HKA_TOKEN_EMPRESA  (o equivalente)
  HKA_TOKEN_PASSWORD (o equivalente)

❌ FALLA si: los tokens están hardcodeados en el código fuente.
❌ FALLA si: se pasan desde el body de la petición HTTP del cliente.
✅ CUMPLE si: vienen de variables de entorno del servidor.
```

**[V-1.1.2]** ¿Los tokens son por tenant/empresa o globales?
```
Según la documentación:
  "Las credenciales son únicas por cada RUC"
  "Si tienes varias empresas, no puedes usar las mismas credenciales"

✅ CUMPLE si: los tokens se obtienen de la configuración de la empresa (por company_id/RUC)
❌ FALLA si: hay un único par de tokens para todas las empresas
```

**[V-1.1.3]** ¿Los tokens se envían correctamente en el XML SOAP?
```xml
Formato correcto en cada método:
  <tem:tokenEmpresa>VALOR_TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>VALOR_TOKEN</tem:tokenPassword>

Namespace correcto: xmlns:tem="http://tempuri.org/"
```

---

## 1.2 — URLs y Ambientes

### URLs oficiales según documentación

| Ambiente | URL base | Sufijo |
|---|---|---|
| **Demo / Integración** | `https://demoemision.thefactoryhka.com.pa` | `/ws/obj/v1.0/Service.svc` |
| **Demo WSDL** | `https://demoemision.thefactoryhka.com.pa` | `/ws/obj/v1.0/Service.svc?wsdl` |
| **Demo singleWsdl** | `https://demoemision.thefactoryhka.com.pa` | `/ws/obj/v1.0/Service.svc?singleWsdl` |
| **Producción** | *(suministrada por HKA al contratar)* | `/ws/obj/v1.0/Service.svc` |

### Verificar en el código:

**[V-1.2.1]** ¿La URL del WS es configurable por ambiente?
```
✅ CUMPLE si: existe una variable de entorno (HKA_WS_URL, HKA_ENDPOINT, etc.)
              que cambia entre demo y producción
❌ FALLA si: la URL está hardcodeada
⚠️ PARCIAL si: existe pero solo apunta a demo
```

**[V-1.2.2]** ¿La URL termina exactamente en `/ws/obj/v1.0/Service.svc`?
```
✅ CUMPLE si: la URL base + el path producen el endpoint correcto
❌ FALLA si: falta el path o usa una ruta distinta
```

**[V-1.2.3]** ¿Los datos de demo NO se usan en producción?
```
Según la documentación:
  "Los datos creados en el ambiente demo NO son válidos para producción.
   Una vez se cambie de ambiente se debe volver a cargar la data."

✅ CUMPLE si: existe un mecanismo que diferencia claramente los dos ambientes
⚠️ ADVERTENCIA si: no hay validación que impida usar credenciales demo en producción
```

---

## 1.3 — Protocolo SOAP

**[V-1.3.1]** ¿El cliente usa SOAP (no REST)?
```
El WS de HKA es exclusivamente SOAP.
No existe endpoint REST.

✅ CUMPLE si: se construyen envelopes SOAP/XML
❌ FALLA si: se hace fetch() a una URL esperando JSON
```

**[V-1.3.2]** ¿El Content-Type del request es correcto?
```
HTTP Header requerido:
  Content-Type: text/xml; charset=utf-8
  o
  Content-Type: application/soap+xml; charset=utf-8

✅ CUMPLE si: se especifica el Content-Type correcto
❌ FALLA si: se usa application/json
```

**[V-1.3.3]** ¿El SOAPAction se especifica en los headers?
```
Para SOAP 1.1 debe incluirse el header:
  SOAPAction: "http://tempuri.org/IService/[NombreMetodo]"

Ejemplo para Enviar:
  SOAPAction: "http://tempuri.org/IService/Enviar"

✅ CUMPLE si: se incluye SOAPAction por método
⚠️ PARCIAL si: usa un SOAPAction genérico o vacío
```

---

## 1.4 — Namespaces XML

Los namespaces son obligatorios y deben ser exactos.

**[V-1.4.1]** ¿El envelope SOAP usa los namespaces correctos?
```xml
Estructura base requerida:
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tem="http://tempuri.org/"
  xmlns:ser="http://schemas.datacontract.org/2004/07/Services.Request">
  <soapenv:Body>
    ...
  </soapenv:Body>
</soapenv:Envelope>

Verificar:
  ✅ soapenv → http://schemas.xmlsoap.org/soap/envelope/
  ✅ tem      → http://tempuri.org/
  ✅ ser      → http://schemas.datacontract.org/2004/07/Services.Request

❌ FALLA si: cualquiera de estos namespaces tiene un valor diferente
```

---

## Checklist Etapa 1

| ID | Verificación | Estado |
|---|---|---|
| V-1.1.1 | Tokens en variables de entorno | |
| V-1.1.2 | Tokens por empresa/RUC | |
| V-1.1.3 | Tokens en XML SOAP correctamente | |
| V-1.2.1 | URL configurable por ambiente | |
| V-1.2.2 | URL termina en `/ws/obj/v1.0/Service.svc` | |
| V-1.2.3 | Demo ≠ Producción diferenciados | |
| V-1.3.1 | Protocolo SOAP (no REST) | |
| V-1.3.2 | Content-Type correcto | |
| V-1.3.3 | SOAPAction por método | |
| V-1.4.1 | Namespaces XML exactos | |

**→ Continuar con Etapa 2 solo si V-1.3.1 y V-1.4.1 son ✅**
