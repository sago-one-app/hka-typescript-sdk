# Etapa 3 — Construcción XML del Método Enviar()

> **Fuente**: `../01_documentos_fel/02_metodo_enviar.md`
>            `../03_documentos_fiscales/01_factura_operacion_interna.md` (y demás 16 XMLs)
> **Prioridad**: 🔴 CRÍTICA — Es el método principal. Un XML malformado → rechazo DGI.

---

## Regla de oro de la construcción XML

> **⚠️ NOTA OFICIAL DE HKA**: "Al momento de crear la estructura del XML en el método
> de Enviar, los campos que no sean requeridos, en caso de que correspondan,
> **NO informar o no dejar sin valor esos campos**, para que se procese el XML
> en el servicio sin inconveniente alguno."

**Esto significa**: si un campo opcional no tiene valor → **NO incluir el nodo en el XML**.
No incluir `<campo></campo>` ni `<campo/>`. **Simplemente no emitir el nodo.**

---

## 3.1 — Estructura del Envelope SOAP

**[V-3.1.1]** ¿La estructura raíz del request es exactamente esta?

```xml
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:tem="http://tempuri.org/"
  xmlns:ser="http://schemas.datacontract.org/2004/07/Services.Request">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Enviar>
      <tem:tokenEmpresa>TOKEN_EMPRESA</tem:tokenEmpresa>
      <tem:tokenPassword>TOKEN_PASSWORD</tem:tokenPassword>
      <tem:documento>
        <!-- DocumentoElectronico aquí -->
      </tem:documento>
    </tem:Enviar>
  </soapenv:Body>
</soapenv:Envelope>
```

Verificar:
- ✅ `<tem:Enviar>` (no `<Enviar>` sin namespace)
- ✅ `<tem:tokenEmpresa>` (no `<tokenEmpresa>`)
- ✅ `<tem:documento>` (no `<documento>`)
- ✅ Los hijos del documento usan namespace `ser:` (no `tem:`)

---

## 3.2 — DocumentoElectronico — Nivel raíz

**[V-3.2.1]** ¿Los dos primeros campos son exactamente?

```xml
<ser:codigoSucursalEmisor>0000</ser:codigoSucursalEmisor>
<ser:tipoSucursal>1</ser:tipoSucursal>
```

| Campo | Req | Regla |
|---|---|---|
| `codigoSucursalEmisor` | SI | `"0000"` = casa matriz. `"0001"` en adelante = sucursales. Permite letras y números. Formato AN\|4 |
| `tipoSucursal` | NO | `1` = mayor operaciones al detal. `2` = mayor al por mayor. Solo 1 dígito. |

---

## 3.3 — DatosTransaccion (datosTransaccion)

**[V-3.3.1]** ¿Los campos obligatorios de datosTransaccion están presentes?

```xml
<ser:datosTransaccion>
  <ser:tipoEmision>01</ser:tipoEmision>
  <!-- C/C: fechaInicioContingencia → SOLO si tipoEmision = "02" o "04" -->
  <!-- C/C: motivoContingencia      → SOLO si tipoEmision = "02" o "04" -->
  <ser:tipoDocumento>01</ser:tipoDocumento>
  <ser:numeroDocumentoFiscal>0000000176</ser:numeroDocumentoFiscal>
  <ser:puntoFacturacionFiscal>505</ser:puntoFacturacionFiscal>
  <ser:fechaEmision>2022-07-15T07:49:27-05:00</ser:fechaEmision>
  <!-- NO: fechaSalida → opcional, solo si es conocida -->
  <ser:naturalezaOperacion>01</ser:naturalezaOperacion>
  <ser:tipoOperacion>1</ser:tipoOperacion>
  <ser:destinoOperacion>1</ser:destinoOperacion>
  <ser:formatoCAFE>1</ser:formatoCAFE>
  <ser:entregaCAFE>1</ser:entregaCAFE>
  <ser:envioContenedor>1</ser:envioContenedor>
  <ser:procesoGeneracion>1</ser:procesoGeneracion>
  <ser:tipoVenta>1</ser:tipoVenta>
  <!-- NO: informacionInteres → opcional -->
  <ser:cliente>...</ser:cliente>
</ser:datosTransaccion>
```

**[V-3.3.2]** ¿`numeroDocumentoFiscal` tiene padding de ceros a la izquierda hasta 10 dígitos?
```
Correcto:   "0000000176"
Incorrecto: "176" o 176
```

**[V-3.3.3]** ¿`puntoFacturacionFiscal` tiene padding de ceros a la izquierda hasta 3 dígitos?
```
Correcto:   "001", "505", "100"
Incorrecto: "1" o "0" o "000" (el valor CERO no está permitido)
❌ FALLA si: puntoFacturacionFiscal puede ser "000"
```

**[V-3.3.4]** ¿`fechaEmision` usa el formato ISO 8601 con timezone?
```
Formato correcto: "AAAA-MM-DDThh:mm:ssTZH"
Ejemplo:          "2022-07-15T07:49:27-05:00"

❌ FALLA si: la fecha es "2022-07-15 07:49:27" (sin la T ni el timezone)
❌ FALLA si: el timezone es UTC (+00:00) cuando debería ser -05:00 (Panamá)
```

---

## 3.4 — Cliente

**[V-3.4.1]** ¿La sección `<ser:cliente>` incluye los campos según `tipoClienteFE`?

### Para tipoClienteFE = "01" (Contribuyente) o "03" (Gobierno):
```xml
<ser:tipoClienteFE>01</ser:tipoClienteFE>
<ser:tipoContribuyente>2</ser:tipoContribuyente>      <!-- 1=Natural, 2=Jurídico -->
<ser:numeroRUC>155596713-2-2015</ser:numeroRUC>         <!-- OBLIGATORIO -->
<ser:digitoVerificadorRUC>59</ser:digitoVerificadorRUC> <!-- OBLIGATORIO -->
<ser:razonSocial>Empresa SA</ser:razonSocial>           <!-- OBLIGATORIO -->
<ser:direccion>Ave. La Paz</ser:direccion>               <!-- OBLIGATORIO -->
<ser:codigoUbicacion>1-1-1</ser:codigoUbicacion>
<ser:provincia>Bocas del Toro</ser:provincia>
<ser:distrito>Bocas del Toro</ser:distrito>
<ser:corregimiento>Bocas del Toro</ser:corregimiento>
<ser:pais>PA</ser:pais>                                 <!-- DEBE ser PA -->
<!-- NO incluir: tipoIdentificacion, nroIdentificacionExtranjero, paisExtranjero -->
```

### Para tipoClienteFE = "02" (Consumidor Final):
```xml
<ser:tipoClienteFE>02</ser:tipoClienteFE>
<ser:tipoContribuyente>1</ser:tipoContribuyente>
<!-- numeroRUC: OPCIONAL (solo si el cliente provee su cédula) -->
<!-- digitoVerificadorRUC: NO enviar si no hay RUC -->
<!-- razonSocial, direccion, ubicación: opcionales -->
<ser:pais>PA</ser:pais>
```

### Para tipoClienteFE = "04" (Extranjero):
```xml
<ser:tipoClienteFE>04</ser:tipoClienteFE>
<!-- tipoContribuyente: NO ENVIAR -->
<!-- numeroRUC: NO ENVIAR -->
<!-- digitoVerificadorRUC: NO ENVIAR -->
<!-- codigoUbicacion: NO ENVIAR -->
<!-- provincia: NO ENVIAR -->
<!-- distrito: NO ENVIAR -->
<!-- corregimiento: NO ENVIAR -->
<ser:tipoIdentificacion>01</ser:tipoIdentificacion>     <!-- OBLIGATORIO -->
<ser:nroIdentificacionExtranjero>AB123456</ser:nroIdentificacionExtranjero>
<ser:paisExtranjero>Colombia</ser:paisExtranjero>        <!-- Si es pasaporte -->
<ser:pais>CO</ser:pais>                                 <!-- NO puede ser PA -->
```

**[V-3.4.2]** ¿Se cumple la regla: `pais = "PA"` SI `destinoOperacion = "1"` y `pais ≠ "PA"` SI `destinoOperacion = "2"`?
```
❌ FALLA si: una factura de exportación (destinoOperacion=2) tiene pais=PA
❌ FALLA si: una factura interna (destinoOperacion=1) tiene pais distinto a PA
```

**[V-3.4.3]** ¿Se conoce y aplica la regla del `pais = "ZZ"`?
```
"ZZ" se usa cuando el país del cliente no existe en el catálogo.
Si pais = "ZZ" → el campo paisOtro es OBLIGATORIO (nombre completo del país).
```

---

## 3.5 — Lista de Ítems

**[V-3.5.1]** ¿Cada ítem incluye los campos obligatorios?

```xml
<ser:item>
  <ser:descripcion>Producto X</ser:descripcion>         <!-- OBLIGATORIO, 2-500 chars -->
  <!-- codigo: opcional -->
  <!-- unidadMedida: opcional -->
  <ser:cantidad>1.000000</ser:cantidad>                  <!-- OBLIGATORIO, hasta 6 dec -->
  <!-- fechaFabricacion: C/C solo si farmacéutico/medicina/alimento -->
  <!-- fechaCaducidad: C/C -->
  <ser:precioUnitario>100.00</ser:precioUnitario>        <!-- OBLIGATORIO -->
  <ser:precioUnitarioDescuento>0.00</ser:precioUnitarioDescuento>  <!-- OBLIGATORIO -->
  <ser:precioItem>100.00</ser:precioItem>                <!-- OBLIGATORIO -->
  <ser:valorTotal>107.00</ser:valorTotal>                <!-- OBLIGATORIO -->
  <ser:tasaITBMS>01</ser:tasaITBMS>                     <!-- OBLIGATORIO: "00","01","02","03" -->
  <ser:valorITBMS>7.00</ser:valorITBMS>                  <!-- OBLIGATORIO -->
  <!-- codigoGTIN: NO es obligatorio -->
  <!-- listaItemOTI: solo si aplica impuesto OTI -->
</ser:item>
```

**[V-3.5.2]** ¿`precioUnitarioDescuento` se envía como `"0.00"` cuando no hay descuento?
```
❌ FALLA si: se omite el campo cuando no hay descuento (debe ir como "0.00")
❌ FALLA si: se envía el monto en porcentaje en lugar de Balboas
```

**[V-3.5.3]** ¿Los ítems de precio 0.00 se manejan correctamente?
```
Cuando un ítem no es valorable:
  precioUnitario = "0.00"
  precioItem     = "0.00"
  valorTotal     = "0.00"
  valorITBMS     = "0.00"
  tasaITBMS      = "00"  (exento)
```

---

## 3.6 — TotalesSubTotales

**[V-3.6.1]** ¿La sección de totales incluye todos los campos obligatorios?

```xml
<ser:totalesSubTotales>
  <ser:totalPrecioNeto>...</ser:totalPrecioNeto>     <!-- Suma precios antes de impuestos -->
  <ser:totalITBMS>...</ser:totalITBMS>               <!-- Suma de todos los valorITBMS -->
  <ser:totalISC>0.00</ser:totalISC>                  <!-- Suma ISC (0.00 si no aplica) -->
  <ser:totalMontoGravado>...</ser:totalMontoGravado> <!-- totalITBMS + totalISC + OTI -->
  <!-- totalDescuento: NO incluir si es 0 -->
  <!-- totalAcarreoCobrado: NO incluir si es 0 -->
  <!-- valorSeguroCobrado: NO incluir si es 0 -->
  <ser:totalFactura>...</ser:totalFactura>
  <ser:totalValorRecibido>...</ser:totalValorRecibido>
  <!-- vuelto: C/C solo si hay diferencia -->
  <ser:tiempoPago>1</ser:tiempoPago>
  <ser:nroItems>1</ser:nroItems>
  <ser:totalTodosItems>...</ser:totalTodosItems>     <!-- Suma de todos los valorTotal -->
  <ser:listaFormaPago>...</ser:listaFormaPago>
  <!-- listaPagoPlazo: solo si tiempoPago = "2" o "3" -->
  <!-- listaTotalOTI: solo si hay OTI -->
</ser:totalesSubTotales>
```

**[V-3.6.2]** ¿El campo `nroItems` es el conteo correcto de ítems?
```
✅ CUMPLE si: nroItems = len(listaItems)
❌ FALLA si: nroItems es hardcodeado o siempre 1
```

---

## 3.7 — FormaPago

**[V-3.7.1]** ¿La lista de formas de pago está incluida correctamente?

```xml
<ser:listaFormaPago>
  <ser:formaPago>
    <ser:formaPagoFact>02</ser:formaPagoFact>           <!-- Código de 2 dígitos -->
    <!-- descFormaPago: solo si formaPagoFact = "99" -->
    <ser:valorCuotaPagada>100.00</ser:valorCuotaPagada>
  </ser:formaPago>
</ser:listaFormaPago>
```

**[V-3.7.2]** ¿La suma de todos los `valorCuotaPagada` = `totalValorRecibido`?
```
❌ FALLA si: son inconsistentes
```

---

## 3.8 — Uso Posterior (usoPosterior)

**[V-3.8.1]** ¿El campo `usoPosterior` se incluye cuando `tipoEmision = "03"` o `"04"`?

```xml
<ser:usoPosterior>
  <ser:cufe>CUFE_PREVIO_SI_APLICA</ser:cufe>
</ser:usoPosterior>
```

```
Para tipoEmision "01" o "02" (uso previo):
  → Incluir <ser:usoPosterior><ser:cufe/></ser:usoPosterior> vacío o no incluir

Para tipoEmision "03" o "04" (uso posterior):
  → El CUFE de la autorización previa debe estar en <ser:cufe>
```

---

## 3.9 — Campos críticos que deben OMITIRSE (no ir vacíos)

**[V-3.9.1]** ¿El builder de XML omite nodos en lugar de dejarlos vacíos?

Lista de campos que NUNCA deben ir como `<campo></campo>`:
- `tipoIdentificacion` (si no es extranjero)
- `nroIdentificacionExtranjero` (si no es extranjero)
- `paisExtranjero` (si no es extranjero/pasaporte)
- `fechaSalida` (si no es conocida)
- `informacionInteres` (si no hay)
- `codigoCPBS` (si no es venta a gobierno)
- `tipoVenta` (si no es venta)
- `codigo` del ítem (si no hay código interno)

```
❌ FALLA si: el XML emitido contiene <ser:tipoIdentificacion></ser:tipoIdentificacion>
             cuando el cliente NO es extranjero

Ejemplo de validación: buscar en el XML generado por etiquetas con contenido vacío.
```

---

## 3.10 — Response del método Enviar

**[V-3.10.1]** ¿El parser de respuesta extrae correctamente todos los campos?

```xml
<EnviarResponse xmlns="http://tempuri.org/">
  <EnviarResult xmlns:a="http://schemas.datacontract.org/2004/07/Services.Response">
    <a:codigo>200</a:codigo>
    <a:resultado>procesado</a:resultado>
    <a:mensaje>El documento se envió correctamente.</a:mensaje>
    <a:cufe>FE01200001...</a:cufe>
    <a:qr>https://dgi-fep.mef.gob.pa...</a:qr>
    <a:fechaRecepcionDGI>2019-05-29T13:32:21+00:00</a:fechaRecepcionDGI>
    <a:nroProtocoloAutorizacion>20190000000000179413</a:nroProtocoloAutorizacion>
  </EnviarResult>
</EnviarResponse>
```

**[V-3.10.2]** ¿Se valida que `codigo = "200"` antes de considerar el envío exitoso?

**[V-3.10.3]** ¿Se almacena el CUFE retornado? (Es el identificador único DGI)

**[V-3.10.4]** ¿Se almacena el `nroProtocoloAutorizacion`?

**[V-3.10.5]** ¿Se almacena la `fechaRecepcionDGI`?

---

## Checklist Etapa 3

| ID | Verificación | Estado |
|---|---|---|
| V-3.1.1 | Envelope SOAP con namespaces correctos | |
| V-3.2.1 | codigoSucursalEmisor y tipoSucursal correctos | |
| V-3.3.2 | numeroDocumentoFiscal paddeado a 10 dígitos | |
| V-3.3.3 | puntoFacturacionFiscal paddeado a 3 dígitos, no "000" | |
| V-3.3.4 | fechaEmision con T y timezone -05:00 | |
| V-3.4.1 | Campos cliente según tipoClienteFE (contribuyente/CF/gobierno/extranjero) | |
| V-3.4.2 | pais=PA↔destinoOperacion=1 sincronizados | |
| V-3.5.2 | precioUnitarioDescuento siempre presente (0.00 si no hay) | |
| V-3.6.2 | nroItems = count real de ítems | |
| V-3.7.2 | Suma valorCuotaPagada = totalValorRecibido | |
| V-3.8.1 | usoPosterior presente en tipoEmision 03/04 | |
| V-3.9.1 | Campos opcionales sin valor → nodo OMITIDO (no vacío) | |
| V-3.10.2 | Se valida codigo="200" en respuesta | |
| V-3.10.3 | CUFE almacenado | |
| V-3.10.4 | nroProtocoloAutorizacion almacenado | |
| V-3.10.5 | fechaRecepcionDGI almacenada | |
