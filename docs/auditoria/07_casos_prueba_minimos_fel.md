# Etapa 7 — Casos de Prueba Mínimos FEL (Obligatorios DGI)

> **Fuente**: `../01_documentos_fel/12_listado_documentos_fel.md`
>            `../03_documentos_fiscales/` (17 XMLs de referencia)
> **Prioridad**: 🟡 ALTA — Son los casos que HKA/DGI exige antes de pasar a producción.

---

## Instrucción para el agente

Esta etapa es la **validación end-to-end**. Para cada caso de prueba:
1. Genera el XML usando la implementación del proyecto
2. Compáralo con el XML de referencia en `../03_documentos_fiscales/`
3. Opcionalmente: envíalo al WS Demo y verifica que retorna `codigo=200`
4. Marca el resultado

> Las credenciales para el demo son suministradas por HKA.
> URL Demo: `https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc`

---

## Lista Mínima Oficial de la DGI (9 tipos base + 5 variantes = 14 casos)

| # | Caso | tipoDocumento | tipoClienteFE | Archivo referencia |
|---|---|---|---|---|
| 1 | Factura operación interna — Contribuyente | `01` | `01` | `03_documentos_fiscales/01_factura_operacion_interna.md` |
| 2 | Factura operación interna — Consumidor Final | `01` | `02` | `03_documentos_fiscales/12_factura_consumidor_final.md` |
| 3 | Factura operación interna — Gobierno | `01` | `03` | `03_documentos_fiscales/11_factura_cliente_gobierno.md` |
| 4 | Factura operación interna — Extranjero | `01` | `04` | `03_documentos_fiscales/10_factura_cliente_extranjero.md` |
| 5 | Nota de Crédito referente a FE | `04` | `01` | `03_documentos_fiscales/04_nota_credito_referente_FE.md` |
| 6 | Nota de Débito referente a FE | `05` | `01` | `03_documentos_fiscales/05_nota_debito_referente_FE.md` |
| 7 | Nota de Crédito genérica | `06` | `01` | `03_documentos_fiscales/06_nota_credito_generica.md` |
| 8 | Nota de Débito genérica | `07` | `01` | `03_documentos_fiscales/07_nota_debito_generica.md` |
| 9 | Factura con múltiples tasas ITBMS (00+01+02+03) | `01` | `01` | `03_documentos_fiscales/16_factura_otro_tipo_impuesto.md` |
| 10 | Factura con ítems a precio 0.00 | `01` | `01` | (generar basándose en caso 1) |
| 11 | Factura con descuento por ítem | `01` | `01` | `03_documentos_fiscales/14_factura_descuento_por_item.md` |
| 12 | Factura con descuento global | `01` | `01` | `03_documentos_fiscales/13_factura_descuento_global.md` |
| 13 | Factura a plazo | `01` | `01` | `03_documentos_fiscales/15_factura_pago_plazo.md` |
| 14 | Factura con precios 6 decimales | `01` | `01` | (generar con precioUnitario de 6 decimales) |

---

## Detalle de cada caso

---

### CASO 1 — Factura Operación Interna (Contribuyente)

**Objetivo**: El caso más básico. Verifica el flujo completo de emisión.

**Configuración mínima**:
```
tipoDocumento:       "01"
tipoEmision:         "01"
tipoClienteFE:       "01"
tipoContribuyente:   "2"  (Jurídico)
naturalezaOperacion: "01" (Venta)
tipoOperacion:       "1"  (Salida)
destinoOperacion:    "1"  (Panamá)
pais:                "PA"
tiempoPago:          "1"  (Inmediato)
formaPagoFact:       "02" (Efectivo)
tasaITBMS ítem:      "01" (7%)
```

**Validaciones post-envío**:
- [ ] Respuesta contiene `codigo = "200"`
- [ ] Respuesta contiene `cufe` de 66 caracteres
- [ ] Respuesta contiene `nroProtocoloAutorizacion`
- [ ] Respuesta contiene `fechaRecepcionDGI`
- [ ] El CUFE se almacena en la base de datos

---

### CASO 2 — Factura Consumidor Final

**Objetivo**: Verificar que los campos de RUC son opcionales y el cliente puede ir sin identificación.

**Diferencias vs. Caso 1**:
```
tipoClienteFE:     "02"
tipoContribuyente: "1"  (Natural — si aplica)
numeroRUC:         (OMITIR o usar cédula si el cliente la provee)
digitoVerificadorRUC: (OMITIR)
razonSocial:       (OMITIR — opcional para CF)
direccion:         (OMITIR — opcional para CF)
```

**Validaciones**:
- [ ] El XML generado NO contiene `<digitoVerificadorRUC>` cuando no hay RUC
- [ ] La factura es aceptada sin RUC del cliente

---

### CASO 3 — Factura a Gobierno

**Objetivo**: Verificar que codigoCPBS es requerido en ítems para clientes Gobierno.

**Diferencias vs. Caso 1**:
```
tipoClienteFE:    "03"
```

**Cada ítem DEBE incluir**:
```xml
<ser:codigoCPBSAbrev>CP</ser:codigoCPBSAbrev>
<ser:codigoCPBS>1310</ser:codigoCPBS>
<ser:unidadMedidaCPBS>um</ser:unidadMedidaCPBS>
```

**Validaciones**:
- [ ] El XML incluye codigoCPBS en TODOS los ítems
- [ ] La factura es aceptada con código 200

---

### CASO 4 — Factura Cliente Extranjero

**Objetivo**: Verificar que los campos de RUC/ubicación se OMITEN para extranjeros.

**Configuración**:
```
tipoClienteFE:             "04"
tipoIdentificacion:        "01"  (Pasaporte)
nroIdentificacionExtranjero: "AB123456"
paisExtranjero:            "Colombia"
pais:                      "CO"  (NO puede ser PA)
destinoOperacion:          "1"   (puede ser interna aunque el cliente es extranjero)
```

**El XML NO debe contener**:
```
tipoContribuyente, numeroRUC, digitoVerificadorRUC,
codigoUbicacion, provincia, distrito, corregimiento
```

**Validaciones**:
- [ ] El XML generado NO contiene campos de RUC/ubicación
- [ ] El XML SÍ contiene tipoIdentificacion + nroIdentificacionExtranjero
- [ ] La factura es aceptada con código 200

---

### CASO 5 — Nota de Crédito referente a FE

**Objetivo**: Verificar que una nota de crédito referenciada incluye el CUFE de la FE original.

**Prerequisito**: Debe existir una FE autorizada cuyo CUFE se use como referencia.

**Configuración**:
```
tipoDocumento: "04"
```

**El XML DEBE incluir la sección**:
```xml
<ser:docFiscalReferenciado>
  <ser:item>
    <ser:fechaEmisionDocFiscalReferenciado>2020-12-29T08:28:28-05:00</ser:fechaEmisionDocFiscalReferenciado>
    <ser:cufeFEReferenciada>FE01200001... (66 caracteres)</ser:cufeFEReferenciada>
  </ser:item>
</ser:docFiscalReferenciado>
```

**Validaciones**:
- [ ] `cufeFEReferenciada` tiene exactamente 66 caracteres
- [ ] `fechaEmisionDocFiscalReferenciado` está presente
- [ ] La nota es aceptada con código 200

---

### CASO 6 — Nota de Débito referente a FE
Similar al Caso 5 pero con `tipoDocumento = "05"`.

- [ ] Mismo checklist que Caso 5

---

### CASO 7 — Nota de Crédito Genérica

**Objetivo**: Verificar que una nota genérica NO incluye CUFE referenciado.

**Configuración**:
```
tipoDocumento: "06"
```

**El XML NO debe incluir** `cufeFEReferenciada`.

**Validaciones**:
- [ ] El XML NO contiene la sección docFiscalReferenciado
- [ ] La nota es aceptada con código 200

---

### CASO 8 — Nota de Débito Genérica
Similar al Caso 7 pero con `tipoDocumento = "07"`.

- [ ] Mismo checklist que Caso 7

---

### CASO 9 — Múltiples Tasas ITBMS

**Objetivo**: Verificar que una factura puede tener ítems con diferentes tasas ITBMS.

**Configuración** (4 ítems con tasas distintas):
```
Ítem 1: tasaITBMS="00" (0%  exento)   precioItem=100.00  valorITBMS=0.00
Ítem 2: tasaITBMS="01" (7%)           precioItem=100.00  valorITBMS=7.00
Ítem 3: tasaITBMS="02" (10%)          precioItem=100.00  valorITBMS=10.00
Ítem 4: tasaITBMS="03" (15%)          precioItem=100.00  valorITBMS=15.00
```

**Cálculo esperado**:
```
totalPrecioNeto = 400.00
totalITBMS      = 32.00  (0 + 7 + 10 + 15)
totalTodosItems = 432.00
totalFactura    = 432.00
```

**Validaciones**:
- [ ] Los 4 ítems con tasas distintas se generan correctamente
- [ ] Los totales cuadran exactamente
- [ ] La factura es aceptada con código 200

---

### CASO 10 — Ítems a Precio 0.00

**Objetivo**: Verificar que ítems sin valor monetario se procesan correctamente.

**Configuración (ítem gratuito)**:
```xml
<ser:precioUnitario>0.00</ser:precioUnitario>
<ser:precioUnitarioDescuento>0.00</ser:precioUnitarioDescuento>
<ser:precioItem>0.00</ser:precioItem>
<ser:valorTotal>0.00</ser:valorTotal>
<ser:tasaITBMS>00</ser:tasaITBMS>
<ser:valorITBMS>0.00</ser:valorITBMS>
```

**Validaciones**:
- [ ] El ítem gratuito genera `tasaITBMS="00"` automáticamente
- [ ] `valorITBMS = 0.00` cuando `tasaITBMS = "00"`
- [ ] La factura es aceptada con código 200

---

### CASO 11 — Descuento por Ítem

**Objetivo**: Verificar que `precioUnitarioDescuento` en Balboas se aplica correctamente.

**Configuración**:
```
precioUnitario:          50.00
precioUnitarioDescuento: 5.00   (en Balboas, NO en porcentaje)
cantidad:                2
→ precioItem = 2 × (50.00 − 5.00) = 90.00
→ valorITBMS = 0.07 × 90.00 = 6.30
→ valorTotal = 90.00 + 6.30 = 96.30
```

**Validaciones**:
- [ ] `precioItem` = `cantidad × (precioUnitario − precioUnitarioDescuento)`
- [ ] El descuento NO es un porcentaje
- [ ] La factura es aceptada con código 200

---

### CASO 12 — Descuento Global (a nivel factura)

**Objetivo**: Verificar que `totalDescuento` se aplica en el nivel de totales.

**Configuración**:
```
Los ítems tienen precio sin descuento.
En TotalesSubTotales:
  <ser:descDescuento>Descuento comercial</ser:descDescuento>  (sección DescuentoBonificacion)
  <ser:montoDescuento>100.00</ser:montoDescuento>
  <ser:totalDescuento>100.00</ser:totalDescuento>
  totalFactura = totalTodosItems − 100.00
```

**Validaciones**:
- [ ] La sección DescuentoBonificacion existe y tiene `descDescuento` + `montoDescuento`
- [ ] `totalDescuento` se resta correctamente en `totalFactura`
- [ ] La factura es aceptada con código 200

---

### CASO 13 — Factura a Plazo

**Objetivo**: Verificar que `tiempoPago="2"` incluye la lista de cuotas.

**Configuración**:
```
tiempoPago: "2"  (Plazo)
```

**Debe incluir**:
```xml
<ser:listaPagoPlazo>
  <ser:pagoPlazo>
    <ser:fechaVenceCuota>2021-06-30T00:00:00-05:00</ser:fechaVenceCuota>
    <ser:valorCuota>500.00</ser:valorCuota>
  </ser:pagoPlazo>
  <ser:pagoPlazo>
    <ser:fechaVenceCuota>2021-07-31T00:00:00-05:00</ser:fechaVenceCuota>
    <ser:valorCuota>500.00</ser:valorCuota>
  </ser:pagoPlazo>
</ser:listaPagoPlazo>
```

**Validaciones**:
- [ ] `listaPagoPlazo` presente cuando `tiempoPago = "2"`
- [ ] Suma de `valorCuota` = `totalValorRecibido`
- [ ] La factura es aceptada con código 200

---

### CASO 14 — Precios con 6 Decimales (Redondeo)

**Objetivo**: Verificar que los cálculos de redondeo son correctos con precios de alta precisión.

**Configuración**:
```
Ítem A: cantidad=3, precioUnitario=10.123456
  → precioItem = 3 × 10.123456 = 30.370368
  → valorITBMS = 0.07 × 30.370368 = 2.125926 (6 decimales en ítem)

Ítem B: cantidad=2, precioUnitario=5.666666
  → precioItem = 2 × 5.666666 = 11.333332
  → valorITBMS = 0.07 × 11.333332 = 0.793333

Totales:
  totalPrecioNeto = 30.370368 + 11.333332 = 41.703700
  totalITBMS      = 2.125926 + 0.793333  = 2.919259 → redondeado = 2.92
  totalTodosItems = (30.370368 + 2.125926) + (11.333332 + 0.793333)
                  = 32.496294 + 12.126665 = 44.622959 → redondeado = 44.62
  totalFactura    = 44.62
```

**Validaciones**:
- [ ] Los totales tienen exactamente 2 decimales
- [ ] El redondeo es ROUND_HALF_UP (2.919... → 2.92, no 2.91)
- [ ] La factura es aceptada con código 200 (DGI valida los redondeos)

---

## Resumen de resultados

Al completar los 14 casos, llenar esta tabla:

| # | Caso | XML generado ✓ | Totales correctos ✓ | Aceptado por HKA Demo ✓ | CUFE recibido |
|---|---|---|---|---|---|
| 1 | Factura interna - Contribuyente | ✓ | ✓ | Pendiente | |
| 2 | Factura - Consumidor Final | ✓ | ✓ | Pendiente | |
| 3 | Factura - Gobierno | ✓ | ✓ | Pendiente | |
| 4 | Factura - Extranjero | ✓ | ✓ | Pendiente | |
| 5 | Nota Crédito ref. FE | ✓ | ✓ | Pendiente | |
| 6 | Nota Débito ref. FE | ✓ | ✓ | Pendiente | |
| 7 | Nota Crédito genérica | ✓ | ✓ | Pendiente | |
| 8 | Nota Débito genérica | ✓ | ✓ | Pendiente | |
| 9 | Múltiples tasas ITBMS | ✓ | ✓ | Pendiente | |
| 10 | Ítems precio 0.00 | ✓ | ✓ | Pendiente | |
| 11 | Descuento por ítem | ✓ | ✓ | Pendiente | |
| 12 | Descuento global | ✓ | ✓ | Pendiente | |
| 13 | Factura a plazo | ✓ | ✓ | Pendiente | |
| 14 | Precios 6 decimales | ✓ | ✓ | Pendiente | |

**Criterio de aprobación**: Los 14 casos deben mostrar ✓ en las 4 columnas
antes de solicitar habilitación de producción a The Factory HKA.

---

## → Continuar con Etapa 8: Generar el Reporte Final (08_reporte_final.md)
