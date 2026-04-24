# Etapa 2 — Catálogos y Códigos

> **Fuente**: `../00_INDICE_PRINCIPAL.md`, `../01_documentos_fel/02_metodo_enviar.md`
> **Prioridad**: 🔴 CRÍTICA — Un código incorrecto causa rechazo inmediato en DGI.

---

## Instrucción para el agente

Busca en el código todos los archivos de constantes, enums, catálogos o tipos
relacionados con HKA/FEL. Verifica que cada valor coincida exactamente con los
catálogos oficiales definidos abajo.

---

## 2.1 — tipoDocumento

| Código | Descripción correcta |
|---|---|
| `01` | Factura de operación interna |
| `02` | Factura de importación |
| `03` | Factura de exportación |
| `04` | Nota de Crédito referente a una FE |
| `05` | Nota de Débito referente a una FE |
| `06` | Nota de Crédito genérica |
| `07` | Nota de Débito genérica |
| `08` | Factura de Zona Franca |
| `09` | Reembolso |
| `10` | Factura de operación extranjera |

**[V-2.1.1]** ¿Existen exactamente los 10 tipos de documento? ¿Con código de 2 dígitos (`"01"` string, no `1` number)?

---

## 2.2 — tipoEmision

| Código | Descripción correcta |
|---|---|
| `01` | Autorización de Uso Previa, operación normal |
| `02` | Autorización de Uso Previa, operación en contingencia |
| `03` | Autorización de Uso Posterior, operación normal |
| `04` | Autorización de Uso Posterior, operación en contingencia |

**[V-2.2.1]** ¿Se usan exactamente 4 tipos de emisión con formato string de 2 dígitos?

---

## 2.3 — tipoClienteFE

| Código | Descripción correcta |
|---|---|
| `01` | Contribuyente |
| `02` | Consumidor final |
| `03` | Gobierno |
| `04` | Extranjero |

**[V-2.3.1]** ¿Existen los 4 tipos de cliente con código string de 2 dígitos?

---

## 2.4 — tasaITBMS

| Código | Tasa real | Descripción |
|---|---|---|
| `00` | 0% | Exento |
| `01` | 7% | Tasa estándar |
| `02` | 10% | Tasa especial |
| `03` | 15% | Tasa especial (bebidas alcohólicas, tabaco) |

**[V-2.4.1]** ¿Los 4 códigos ITBMS existen como strings de 2 dígitos (`"00"`, `"01"`, `"02"`, `"03"`)?

**[V-2.4.2]** ¿Los valores numéricos asociados son correctos?
```
❌ FALLA CRÍTICA si: tasaITBMS "01" tiene valor 0.7 en lugar de 0.07
❌ FALLA CRÍTICA si: tasaITBMS "02" tiene valor 0.1 en lugar de 0.10
❌ FALLA CRÍTICA si: tasaITBMS "03" tiene valor 0.5 en lugar de 0.15
```

---

## 2.5 — formaPagoFact

| Código | Descripción correcta |
|---|---|
| `01` | Crédito |
| `02` | Efectivo |
| `03` | Tarjeta Crédito |
| `04` | Tarjeta Débito |
| `05` | Tarjeta Fidelización |
| `06` | Vale |
| `07` | Tarjeta de Regalo |
| `08` | Transferencia/Depósito cuenta bancaria |
| `09` | Cheque |
| `99` | Otro |

**[V-2.5.1]** ¿Existen los 10 códigos de forma de pago?

**[V-2.5.2]** Si `formaPagoFact = "99"`, ¿se exige el campo `descFormaPago`?
```
Regla: descFormaPago es OBLIGATORIO si formaPagoFact = "99"
❌ FALLA si: se puede enviar formaPago=99 sin descripción
```

---

## 2.6 — naturalezaOperacion

| Código | Descripción |
|---|---|
| `01` | Venta |
| `02` | Exportación |
| `03` | Re-exportación |
| `04` | Venta de fuente extranjera |
| `10` | Transferencia/Traspaso |
| `11` | Devolución |
| `12` | Consignación |
| `13` | Remesa |
| `14` | Entrega gratuita |
| `20` | Compra |
| `21` | Importación |

**[V-2.6.1]** ¿Los 11 códigos de naturaleza de operación están implementados?

---

## 2.7 — tipoOperacion

| Código | Descripción |
|---|---|
| `1` | Salida o venta |
| `2` | Entrada o compra |

> ⚠️ Este campo usa código de **1 dígito** (`"1"` o `"2"`), a diferencia de la mayoría.

**[V-2.7.1]** ¿El campo `tipoOperacion` usa 1 dígito (no 2)?

---

## 2.8 — destinoOperacion

| Código | Descripción |
|---|---|
| `1` | Panamá |
| `2` | Extranjero |

> ⚠️ Este campo usa código de **1 dígito**.

**[V-2.8.1]** ¿El campo `destinoOperacion` usa 1 dígito?

---

## 2.9 — formatoCAFE y entregaCAFE

| Código | Descripción |
|---|---|
| `1` | Sin generación de CAFE |
| `2` | Cinta de papel |
| `3` | Papel formato carta |

> ⚠️ Ambos campos usan **1 dígito**.

**[V-2.9.1]** ¿`formatoCAFE` y `entregaCAFE` usan 1 dígito?

---

## 2.10 — tiempoPago

| Código | Descripción |
|---|---|
| `1` | Inmediato |
| `2` | Plazo |
| `3` | Mixto |

> ⚠️ **1 dígito**.

**[V-2.10.1]** ¿`tiempoPago` usa 1 dígito?

---

## 2.11 — tasaOTI (Otros Tributos e Impuestos)

| Código | Descripción |
|---|---|
| `01` | SUME 911 |
| `02` | Tasa Portabilidad Numérica |
| `03` | Impuesto sobre seguro (5%) |
| `04` | ATTT-Impuesto sobre seguro autos (1%) |
| `05` | Tasa Salida Aeropuerto (FZ) |
| `06` | Cargo Incentivo Desarrollo Aeropuerto (F3) |
| `07` | Cargo Seguridad Aeropuerto (AH) |
| `08` | Otros Cargos (XT) |
| `09` | Combustible (YQ) |
| `10` | FECI |
| `11` | Intereses |

**[V-2.11.1]** Si se implementan OTIs, ¿los 11 códigos están correctos con 2 dígitos?

---

## 2.12 — codigoRetencion

| Código | Descripción |
|---|---|
| `1` | Pago por servicio profesional al estado 100% |
| `2` | Pago por venta de bienes/servicios al estado 50% |
| `3` | Pago o acreditación a no domiciliado 100% |
| `4` | Pago o acreditación por compra bienes/servicios 50% |
| `7` | Pago a comercio afiliado TC/TD 50% |
| `8` | Otros (disminución de retención) |

**[V-2.12.1]** Si se implementa retención, ¿los códigos son correctos?

---

## 2.13 — tipoContribuyente

| Código | Descripción |
|---|---|
| `1` | Natural |
| `2` | Jurídico |

> ⚠️ **1 dígito**. Se usa tanto en `cliente.tipoContribuyente` como en
> `autorizadoDescargaFEyEventos.tipoContribuyente` y en `InfoEntrega.tipoRucEntrega`.

**[V-2.13.1]** ¿`tipoContribuyente` usa 1 dígito en todos sus usos?

---

## 2.14 — tipoIdentificacion (solo para tipoClienteFE=04 / Extranjero)

| Código | Descripción |
|---|---|
| `01` | Pasaporte |
| `02` | Número Tributario |
| `99` | Otro |

**[V-2.14.1]** ¿Se implementan los 3 tipos de identificación para clientes extranjeros?

---

## 2.15 — tipoVenta

| Código | Descripción |
|---|---|
| `1` | Venta de giro del negocio |
| `2` | Venta Activo Fijo |
| `3` | Venta de Bienes Raíces |
| `4` | Prestación de Servicio |

> ⚠️ **1 dígito**. Según la documentación: "Si no es venta, no informar."

**[V-2.15.1]** ¿El campo `tipoVenta` se omite cuando no es venta (no se envía vacío ni 0)?

---

## 2.16 — Formato de datos (tipificación)

Según la documentación, **todos los campos se envían como String** aunque representen números.

**[V-2.16.1]** ¿Los campos numéricos se serializan como String en el XML?
```
❌ FALLA si: cantidad se envía como number (1) en lugar de string ("1.000000")
❌ FALLA si: tasaITBMS se envía como number (1) en lugar de string ("01")
✅ CUMPLE si: todos los campos del XML son strings
```

**[V-2.16.2]** Convenciones de formato por tipo:

| Formato doc | Significado | Ejemplo correcto |
|---|---|---|
| `N\|2` | 2 dígitos numéricos fijos | `"01"` |
| `N\|1` | 1 dígito numérico | `"1"` |
| `N\|10` | 10 dígitos, rellenar ceros izq | `"0000000176"` |
| `N\|3` | 3 dígitos, rellenar ceros izq | `"001"` |
| `AN\|25` | Alfanumérico max 25 chars | `"2022-07-15T07:49:27-05:00"` |
| `N..8/5.2` | Hasta 5 enteros + 2 decimales | `"12345.67"` |
| `N\|1..9\|2.6` | 1-9 dígitos, 2-6 decimales | `"1234.123456"` |

---

## Checklist Etapa 2

| ID | Verificación | Estado |
|---|---|---|
| V-2.1.1 | 10 tipos de documento como string "01".."10" | |
| V-2.2.1 | 4 tipos de emisión como string "01".."04" | |
| V-2.3.1 | 4 tipos de cliente como string "01".."04" | |
| V-2.4.1 | 4 tasas ITBMS como string "00","01","02","03" | |
| V-2.4.2 | Valores numéricos ITBMS correctos (7%=0.07, no 0.7) | |
| V-2.5.1 | 10 formas de pago incluyendo "99" | |
| V-2.5.2 | descFormaPago obligatorio cuando formaPago="99" | |
| V-2.6.1 | 11 naturalezas de operación | |
| V-2.7.1 | tipoOperacion usa 1 dígito | |
| V-2.8.1 | destinoOperacion usa 1 dígito | |
| V-2.9.1 | formatoCAFE y entregaCAFE usan 1 dígito | |
| V-2.10.1 | tiempoPago usa 1 dígito | |
| V-2.13.1 | tipoContribuyente usa 1 dígito en todos sus usos | |
| V-2.15.1 | tipoVenta se OMITE cuando no aplica (no vacío) | |
| V-2.16.1 | Todos los campos del XML son String | |
| V-2.16.2 | Padding de zeros en campos N\|2, N\|3, N\|10 | |
