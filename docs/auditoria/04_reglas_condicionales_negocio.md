# Etapa 4 — Reglas Condicionales de Negocio

> **Fuente**: `../01_documentos_fel/02_metodo_enviar.md`,
>            `../05_ayuda/01_preguntas_frecuentes.md`,
>            `../01_documentos_fel/12_listado_documentos_fel.md`
> **Prioridad**: 🔴 CRÍTICA — Estas reglas causan rechazos silenciosos o errores DGI.

---

## Instrucción para el agente

Cada verificación aquí describe una **regla cruzada** entre dos o más campos.
Busca el código que valida estas relaciones (validators, guards, business-rules).
Si no existe validación para una regla → marca como ❌ FALLA.

---

## 4.1 — Reglas por tipoClienteFE

### Regla 4.1.A — Jurídico siempre es Contribuyente
```
REGLA: Si el cliente tiene RUC jurídico (tipoContribuyente = "2"),
       DEBE declararse como tipoClienteFE = "01" (Contribuyente).
       NUNCA como "02" (Consumidor Final).

Según FAQ oficial:
  "Si es RUC jurídico, debe declararse obligatoriamente como contribuyente.
   Declararlo como consumidor final generará rechazo del servicio."

[V-4.1.A] ¿Existe validación que impide tipoContribuyente="2" + tipoClienteFE="02"?
  ❌ FALLA si: se puede crear una factura con empresa jurídica como consumidor final
```

### Regla 4.1.B — Campos exclusivos del Extranjero
```
REGLA: Cuando tipoClienteFE = "04" (Extranjero), estos campos NO deben incluirse:
  - tipoContribuyente
  - numeroRUC
  - digitoVerificadorRUC
  - codigoUbicacion
  - provincia
  - distrito
  - corregimiento

Y estos campos son OBLIGATORIOS:
  - tipoIdentificacion
  - nroIdentificacionExtranjero

[V-4.1.B] ¿El builder XML omite los campos de RUC/ubicación cuando tipoClienteFE="04"?
[V-4.1.C] ¿El validator exige tipoIdentificacion y nroIdentificacionExtranjero cuando es Extranjero?
```

### Regla 4.1.D — Campos obligatorios para Contribuyente y Gobierno
```
REGLA: Cuando tipoClienteFE = "01" o "03":
  Obligatorios: numeroRUC, digitoVerificadorRUC, razonSocial, direccion

[V-4.1.D] ¿Se validan estos 4 campos como requeridos para tipoClienteFE 01 y 03?
```

### Regla 4.1.E — codigoCPBS obligatorio para Gobierno
```
REGLA: Cuando tipoClienteFE = "03" (Gobierno):
  - codigoCPBS es OBLIGATORIO en cada ítem
  - codigoCPBSAbrev es OBLIGATORIO
  - unidadMedidaCPBS es OBLIGATORIO

[V-4.1.E] ¿Se valida que los ítems tengan codigoCPBS cuando el cliente es Gobierno?
  ❌ FALLA si: se puede emitir factura a Gobierno sin codigoCPBS en los ítems
```

---

## 4.2 — Reglas de destinoOperacion y pais

### Regla 4.2.A — Panamá interno
```
REGLA: Si destinoOperacion = "1" (Panamá):
  → cliente.pais DEBE ser "PA"

[V-4.2.A] ¿Existe validación que enforce pais="PA" cuando destinoOperacion="1"?
```

### Regla 4.2.B — Destino extranjero
```
REGLA: Si destinoOperacion = "2" (Extranjero):
  → cliente.pais NO puede ser "PA"
  → Se requiere la sección datosFacturaExportacion con:
      - condicionesEntrega (INCOTERMS)
      - monedaOperExportacion (ISO 4217)

[V-4.2.B] ¿Se incluye datosFacturaExportacion cuando destinoOperacion="2"?
[V-4.2.C] ¿Se bloquea pais="PA" cuando destinoOperacion="2"?
```

### Regla 4.2.C — País "ZZ"
```
REGLA: Si cliente.pais = "ZZ" (país no en catálogo):
  → paisOtro es OBLIGATORIO (nombre completo del país en texto libre)

[V-4.2.D] ¿Se exige paisOtro cuando pais="ZZ"?
```

---

## 4.3 — Reglas de tipoEmision (Contingencia)

### Regla 4.3.A — Contingencia requiere motivo
```
REGLA: Si tipoEmision = "02" o "04" (contingencia):
  → fechaInicioContingencia es OBLIGATORIO (formato: "AAAA-MM-DD hh:mm:ssTZH")
  → motivoContingencia es OBLIGATORIO (15-250 caracteres)

Si la contingencia dura más de 72 horas:
  → motivoContingencia DEBE explicar por qué no se regresó a operación normal.

[V-4.3.A] ¿Se validan fechaInicioContingencia y motivoContingencia cuando tipoEmision es "02"/"04"?
[V-4.3.B] ¿Existe algún warning o check de las 72 horas?
```

---

## 4.4 — Reglas de Documentos Referenciados (Notas de Crédito/Débito)

### Regla 4.4.A — Notas referentes a una FE
```
REGLA: Si tipoDocumento = "04" (Nota Crédito ref. FE) o "05" (Nota Débito ref. FE):
  → La sección docFiscalReferenciado es OBLIGATORIA
  → cufeFEReferenciada DEBE ser el CUFE de la FE original (66 caracteres)
  → fechaEmisionDocFiscalReferenciado DEBE estar presente

[V-4.4.A] ¿Se incluye docFiscalReferenciado en notas de crédito/débito referentes?
[V-4.4.B] ¿Se valida que cufeFEReferenciada tenga exactamente 66 caracteres?
```

### Regla 4.4.B — Notas genéricas
```
REGLA: Si tipoDocumento = "06" (Nota Crédito genérica) o "07" (Nota Débito genérica):
  → NO debe incluirse cufeFEReferenciada
  → Si hay nroFacturaPapel o nroFacturaIF → no incluir cufeFEReferenciada

[V-4.4.C] ¿Las notas genéricas NO incluyen CUFE referenciado?
```

---

## 4.5 — Reglas de Ítems Especiales

### Regla 4.5.A — Medicinas y materia prima farmacéutica
```
REGLA: Si el ítem es medicina, materia prima farmacéutica o alimento:
  → fechaFabricacion es OBLIGATORIO (formato AAAA-MM-DD)
  → fechaCaducidad es OBLIGATORIO
  → La sección Medicina es OBLIGATORIA:
      - nroLote (5-35 caracteres)
      - cantProductosLote (número)

[V-4.5.A] ¿Existe un flag/tipo de ítem para distinguir medicamentos?
[V-4.5.B] ¿Se exigen fechaFabricacion, fechaCaducidad y sección Medicina para medicamentos?
```

### Regla 4.5.B — Vehículos nuevos
```
REGLA: Si el ítem es un vehículo nuevo:
  → La sección Vehículo es OBLIGATORIA con al menos:
      - modalidadOperacionVenta, chasis (VIN 17 chars), potenciaMotor,
        tipoCombustible, numeroMotor, tipoVehiculo, usoVehiculo

[V-4.5.C] ¿Existe soporte para la sección Vehículo en el builder XML?
```

---

## 4.6 — Reglas de Totales

### Regla 4.6.A — Acarreo y seguro: ítem vs. total
```
REGLA: Si precioAcarreo se informa en el ítem →
         NO informar totalAcarreoCobrado en los totales.
       Si totalAcarreoCobrado se informa en totales →
         NO informar precioAcarreo en ningún ítem.
       Mismo comportamiento para precioSeguro / valorSeguroCobrado.

[V-4.6.A] ¿Existe validación que impide declarar acarreo/seguro en ambos niveles?
```

### Regla 4.6.B — Pago a plazo
```
REGLA: Si tiempoPago = "2" (Plazo) o "3" (Mixto):
  → La sección listaPagoPlazo es OBLIGATORIA con al menos una cuota:
      - fechaVenceCuota
      - valorCuota

[V-4.6.B] ¿Se incluye listaPagoPlazo cuando tiempoPago = "2" o "3"?
[V-4.6.C] ¿La suma de valorCuota en listaPagoPlazo = totalValorRecibido?
```

### Regla 4.6.C — Vuelto
```
REGLA: Si totalValorRecibido > totalFactura:
  → vuelto = totalValorRecibido - totalFactura (debe informarse)
  Si totalValorRecibido = totalFactura:
  → vuelto NO debe informarse (no enviar el nodo)

[V-4.6.D] ¿El campo vuelto se calcula y emite correctamente?
```

---

## 4.7 — Reglas de Retención

### Regla 4.7.A — Cuando aplica retención
```
REGLA: Si aplica retención:
  → codigoRetencion es OBLIGATORIO
  → montoRetencion = tasaITBMS × totalITBMS

[V-4.7.A] ¿La sección Retencion se incluye correctamente?
[V-4.7.B] ¿montoRetencion se calcula como tasaITBMS × totalITBMS?
```

---

## 4.8 — Plazos fiscales críticos

**[V-4.8.1]** ¿Existe validación de plazo para anulación?
```
REGLA FISCAL: Un documento puede anularse MÁXIMO 7 días continuos después de su emisión.
Pasado ese plazo → el sistema debe bloquear la anulación y sugerir Nota de Crédito.

✅ CUMPLE si: hay un pre-check de fecha antes de llamar a AnulacionDocumento()
❌ FALLA si: se puede intentar anular sin verificar el plazo (causará rechazo en HKA)
⚠️ PARCIAL si: existe un warning pero no bloqueo
```

**[V-4.8.2]** ¿Existe advertencia de plazo para Notas de Crédito?
```
REGLA FISCAL: Una Nota de Crédito referente a una FE tiene máximo 180 días
desde la fecha de emisión de la FE original.

✅ CUMPLE si: hay advertencia o validación al crear nota de crédito
❌ No bloqueante per se, pero debe existir al menos un warning
```

---

## 4.9 — Reglas de envioContenedor

```
REGLA: envioContenedor = "1" (Normal)
       envioContenedor = "2" (El receptor exceptúa al emisor de la obligatoriedad)

[V-4.9.1] ¿El campo envioContenedor usa "1" o "2" (1 dígito)?
[V-4.9.2] ¿El valor por defecto es "1"?
```

---

## Checklist Etapa 4

| ID | Verificación | Estado |
|---|---|---|
| V-4.1.A | RUC jurídico SIEMPRE es Contribuyente (no CF) | |
| V-4.1.B | Campos RUC/ubicación omitidos para Extranjero | |
| V-4.1.C | tipoIdentificacion requerido para Extranjero | |
| V-4.1.D | RUC+DV+razonSocial+direccion req. para 01/03 | |
| V-4.1.E | codigoCPBS requerido en ítems para Gobierno | |
| V-4.2.A | pais="PA" cuando destinoOperacion="1" | |
| V-4.2.B | datosFacturaExportacion cuando destinoOperacion="2" | |
| V-4.2.C | pais≠"PA" cuando destinoOperacion="2" | |
| V-4.2.D | paisOtro requerido cuando pais="ZZ" | |
| V-4.3.A | fechaInicioContingencia + motivoContingencia req. para tipoEmision 02/04 | |
| V-4.4.A | docFiscalReferenciado req. para tipoDocumento 04/05 | |
| V-4.4.B | cufeFEReferenciada exactamente 66 chars | |
| V-4.4.C | Notas genéricas (06/07) NO incluyen CUFE ref. | |
| V-4.6.B | listaPagoPlazo req. cuando tiempoPago=2 o 3 | |
| V-4.6.D | Campo vuelto correcto (presente si sobra, omitido si exacto) | |
| V-4.8.1 | Pre-check de 7 días antes de anular | |
| V-4.8.2 | Advertencia de 180 días para nota de crédito | |
