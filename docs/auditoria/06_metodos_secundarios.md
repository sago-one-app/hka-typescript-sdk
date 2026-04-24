# Etapa 6 — Métodos Secundarios del Web Service

> **Fuentes**:
>   `../01_documentos_fel/03_metodo_estadodocumento.md`
>   `../01_documentos_fel/04_metodo_anulacion.md`
>   `../01_documentos_fel/05_metodo_descargaxml.md`
>   `../01_documentos_fel/06_metodo_foliosrestantes.md`
>   `../01_documentos_fel/07_metodo_enviocorreo.md`
>   `../01_documentos_fel/08_metodo_descargapdf.md`
>   `../01_documentos_fel/09_metodo_rastreocorreo.md`
>   `../01_documentos_fel/10_metodo_consultarucdv.md`
> **Prioridad**: 🟡 ALTA

---

## 6.1 — EstadoDocumento()

Consulta el estatus de un documento por número.

### REQUEST esperado:
```xml
<tem:EstadoDocumento>
  <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>TOKEN</tem:tokenPassword>
  <tem:datosDocumento>
    <ser:codigoSucursalEmisor>0001</ser:codigoSucursalEmisor>
    <ser:numeroDocumentoFiscal>0000099176</ser:numeroDocumentoFiscal>
    <ser:puntoFacturacionFiscal>565</ser:puntoFacturacionFiscal>
    <ser:tipoDocumento>01</ser:tipoDocumento>
    <ser:tipoEmision>01</ser:tipoEmision>
  </tem:datosDocumento>
</tem:EstadoDocumento>
```

### RESPONSE esperado:
```
campos: codigo, mensaje, cufe, fechaEmisionDocumento,
        fechaRecepcionDocumento, estatusDocumento, mensajeDocumento, resultado

Valor de estatusDocumento cuando es válido: "Autorizada"
```

**[V-6.1.1]** ¿El método EstadoDocumento existe y construye el XML correcto?
**[V-6.1.2]** ¿El parser extrae `estatusDocumento` y `cufe` de la respuesta?
**[V-6.1.3]** ¿`numeroDocumentoFiscal` va paddeado a 10 dígitos?

---

## 6.2 — AnulacionDocumento()

> ⚠️ **BUG CONOCIDO DE LA WIKI**: La documentación menciona el método como "Anulacion",
> pero el nombre real del método SOAP es **`AnulacionDocumento`**.
> Verificar que el código usa `AnulacionDocumento` (no `Anulacion`).

### REQUEST esperado:
```xml
<soapenv:Body>
  <tem:AnulacionDocumento>
    <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
    <tem:tokenPassword>TOKEN</tem:tokenPassword>
    <tem:motivoAnulacion>Motivo de la anulacion</tem:motivoAnulacion>
    <tem:datosDocumento>
      <ser:codigoSucursalEmisor>0000</ser:codigoSucursalEmisor>
      <ser:numeroDocumentoFiscal>0000001212</ser:numeroDocumentoFiscal>
      <ser:puntoFacturacionFiscal>999</ser:puntoFacturacionFiscal>
      <ser:tipoDocumento>01</ser:tipoDocumento>
      <ser:tipoEmision>01</ser:tipoEmision>
    </tem:datosDocumento>
  </tem:AnulacionDocumento>
</soapenv:Body>
```

### RESPONSE esperado:
```
campos: codigo, resultado, mensaje
Éxito: codigo="200", resultado="procesado"
```

**[V-6.2.1]** ¿El método SOAP se llama `AnulacionDocumento` (no `Anulacion`)?
```
❌ FALLA CRÍTICA si: el código usa "Anulacion" como nombre del método SOAP.
                    Esto causará error 500 o "Method not found" en el WS.
```

**[V-6.2.2]** ¿El campo `motivoAnulacion` se incluye ANTES de `datosDocumento` en el XML?
**[V-6.2.3]** ¿Existe pre-validación de los 7 días antes de llamar al WS?
**[V-6.2.4]** ¿La respuesta de anulación exitosa actualiza el estado del documento en la BD?

---

## 6.3 — DescargaXML()

Descarga el XML firmado de un documento autorizado.

### REQUEST esperado:
```xml
<tem:DescargaXML>
  <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>TOKEN</tem:tokenPassword>
  <tem:datosDocumento>
    <ser:codigoSucursalEmisor>0000</ser:codigoSucursalEmisor>
    <ser:numeroDocumentoFiscal>0000000176</ser:numeroDocumentoFiscal>
    <ser:puntoFacturacionFiscal>505</ser:puntoFacturacionFiscal>
    <ser:tipoDocumento>01</ser:tipoDocumento>
    <ser:tipoEmision>01</ser:tipoEmision>
  </tem:datosDocumento>
</tem:DescargaXML>
```

### RESPONSE:
```
campos: codigo, resultado, mensaje, xmlFirmado (Base64 o string XML)
```

**[V-6.3.1]** ¿El método DescargaXML está implementado?
**[V-6.3.2]** ¿El XML descargado se almacena o entrega al usuario correctamente?

---

## 6.4 — FoliosRestantes()

Consulta la disponibilidad de folios en la licencia.

### REQUEST esperado:
```xml
<FoliosRestantes>
  <tokenEmpresa>TOKEN</tokenEmpresa>
  <tokenPassword>TOKEN</tokenPassword>
</FoliosRestantes>
```

### RESPONSE — campos a extraer:
```
licencia            → Código de la licencia (ej: "URFT-F1E3-VSGY")
fechaLicencia       → "YYYY-MM-DD / YYYY-MM-DD" (dos fechas concatenadas con " / ")
ciclo               → Número del ciclo actual
fechaCiclo          → "YYYY-MM-DD / YYYY-MM-DD"
foliosTotalesCiclo  → Total de folios del ciclo
foliosUtilizadosCiclo → Folios usados en el ciclo
foliosDisponibleCiclo → Folios disponibles (campo con typo: "Disponible" sin 's')
foliosTotales       → Total folios de la licencia
```

**[V-6.4.1]** ¿El método FoliosRestantes está implementado?
**[V-6.4.2]** ¿El parser maneja el campo `fechaLicencia` con formato `"YYYY-MM-DD / YYYY-MM-DD"`?
```
⚠️ Este campo viene como string concatenado, no como dos fechas separadas.
Hay que parsearlo dividiendo por " / " si se quiere usar como Date.
```
**[V-6.4.3]** ¿El campo tiene el typo correcto: `foliosDisponibleCiclo` (sin 's' al final)?
```
La respuesta oficial dice: <a:foliosDisponibleCiclo> (no foliosDisponiblesCiclo)
❌ FALLA si: el parser espera "foliosDisponiblesCiclo" y no encuentra el campo
```
**[V-6.4.4]** ¿Se usan los folios para alertar cuando quedan pocos?

---

## 6.5 — EnvioCorreo()

Envía el documento al correo del receptor.

### REQUEST esperado:
```xml
<tem:EnvioCorreo>
  <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>TOKEN</tem:tokenPassword>
  <tem:correo>receptor@empresa.com</tem:correo>
  <tem:datosDocumento>
    <!-- mismos 5 campos de datosDocumento -->
  </tem:datosDocumento>
</tem:EnvioCorreo>
```

**[V-6.5.1]** ¿El método EnvioCorreo está implementado?
**[V-6.5.2]** ¿El campo `correo` se valida como email válido antes de enviarlo?
**[V-6.5.3]** ¿Se permite enviar a múltiples correos o solo a uno?
```
El método acepta UN solo correo por llamada.
Para múltiples correos hay que llamar el método múltiples veces.
```

---

## 6.6 — DescargaPDF()

Descarga el CAFE (Comprobante Auxiliar de Factura Electrónica) en PDF.

### REQUEST esperado:
```xml
<tem:DescargaPDF>
  <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>TOKEN</tem:tokenPassword>
  <tem:datosDocumento>
    <!-- mismos 5 campos de datosDocumento -->
  </tem:datosDocumento>
</tem:DescargaPDF>
```

### RESPONSE:
```
campos: codigo, resultado, mensaje, pdf (Base64)
```

**[V-6.6.1]** ¿El método DescargaPDF está implementado?
**[V-6.6.2]** ¿El PDF en Base64 se decodifica correctamente?
**[V-6.6.3]** ¿El CAFE descargado se almacena o se sirve al usuario?

---

## 6.7 — RastreoCorreo()

Consulta el historial de correos enviados para un documento.

### REQUEST esperado:
```xml
<tem:RastreoCorreo>
  <tem:tokenEmpresa>TOKEN</tem:tokenEmpresa>
  <tem:tokenPassword>TOKEN</tem:tokenPassword>
  <tem:datosDocumento>
    <!-- mismos 5 campos de datosDocumento -->
  </tem:datosDocumento>
</tem:RastreoCorreo>
```

**[V-6.7.1]** ¿El método RastreoCorreo está implementado?
**[V-6.7.2]** ¿La respuesta muestra el historial de envíos con fechas y estados?

---

## 6.8 — ConsultarRucDV()

Consulta el dígito verificador del RUC y el estado de afiliación al sistema FE.

### REQUEST esperado:
```xml
<tem:ConsultarRucDV>
  <tem:consultarRucDVRequest>
    <ser:tokenEmpresa>TOKEN</ser:tokenEmpresa>
    <ser:tokenPassword>TOKEN</ser:tokenPassword>
    <ser:tipoRuc>2</ser:tipoRuc>          <!-- 1=Natural, 2=Jurídico -->
    <ser:ruc>155596713-2-2015</ser:ruc>
  </tem:consultarRucDVRequest>
</tem:ConsultarRucDV>
```

> ⚠️ **Diferencia de estructura**: Este método envuelve los tokens dentro de
> `consultarRucDVRequest`, no directamente en el método. Verificar esta diferencia.

### RESPONSE — campos clave:
```
infoRuc.tipoRuc     → Tipo de contribuyente
infoRuc.ruc         → RUC consultado
infoRuc.dv          → Dígito Verificador calculado
infoRuc.razonSocial → Razón social del contribuyente
infoRuc.afiliadoFE  → Estado de afiliación al sistema FE (texto libre)
mensaje             → Mensaje adicional
resultado           → "Procesado"
```

**[V-6.8.1]** ¿El método ConsultarRucDV tiene la estructura de request correcta?
```
❌ FALLA si: los tokens van directamente en <tem:ConsultarRucDV>
             (deben ir dentro de <tem:consultarRucDVRequest>)
```
**[V-6.8.2]** ¿Se usa ConsultarRucDV para validar clientes antes de emitir facturas?
**[V-6.8.3]** ¿El campo `afiliadoFE` se muestra al usuario como información relevante?
**[V-6.8.4]** ¿El DV retornado se usa para auto-completar el campo `digitoVerificadorRUC`?

---

## 6.9 — Manejo de Errores en todos los métodos

**[V-6.9.1]** ¿Todos los métodos manejan los códigos de error de HKA?
```
Códigos de respuesta conocidos:
  200 → Éxito
  400 → Error de validación / parámetros incorrectos
  401 → Credenciales inválidas
  404 → Documento no encontrado
  500 → Error interno del servicio

❌ FALLA si: el código solo verifica código=200 y no maneja otros casos
❌ FALLA si: los errores de HKA se exponen directamente al usuario final sin mapeo
```

**[V-6.9.2]** ¿Existe lógica de retry para errores transitorios?
```
Recomendado: 2-3 reintentos con backoff exponencial para errores 5xx
❌ FALLA si: un error temporal de red causa fallo permanente sin retry
```

**[V-6.9.3]** ¿Los timeouts están configurados apropiadamente?
```
El WS de HKA puede tardar 2-5 segundos en responder.
✅ RECOMENDADO: timeout de 30s mínimo
❌ RIESGO si: el timeout es de 5s o menos (causará fallos en demos/pruebas)
```

---

## Checklist Etapa 6

| ID | Verificación | Estado |
|---|---|---|
| V-6.1.1 | EstadoDocumento implementado con XML correcto | |
| V-6.1.3 | numeroDocumentoFiscal paddeado en EstadoDocumento | |
| V-6.2.1 | ⚠️ Método SOAP se llama `AnulacionDocumento` (no `Anulacion`) | |
| V-6.2.3 | Pre-validación 7 días antes de anular | |
| V-6.4.2 | Parser de fechaLicencia (formato "DATE / DATE") | |
| V-6.4.3 | Campo `foliosDisponibleCiclo` (sin 's') parseado correctamente | |
| V-6.5.3 | EnvioCorreo: un correo por llamada (no array) | |
| V-6.8.1 | ConsultarRucDV: tokens dentro de consultarRucDVRequest | |
| V-6.9.1 | Manejo de códigos de error distintos a 200 | |
| V-6.9.2 | Lógica de retry para errores 5xx | |
| V-6.9.3 | Timeout mínimo de 30 segundos | |
