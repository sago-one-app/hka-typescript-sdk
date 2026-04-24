# Etapa 5 — Cálculos Fiscales y Fórmulas

> **Fuente**: `../01_documentos_fel/02_metodo_enviar.md` (secciones Item y TotalesSubTotales)
> **Prioridad**: 🔴 CRÍTICA — Un centavo de diferencia en los totales causa rechazo en DGI.

---

## Instrucción para el agente

Busca las funciones de cálculo en el proyecto. Ejecuta las fórmulas con los casos
de prueba incluidos en cada sección y verifica que los resultados coincidan.
Presta especial atención al **redondeo** — es la causa más común de rechazo.

---

## 5.1 — Fórmulas por Ítem

### 5.1.1 — precioItem

```
FÓRMULA OFICIAL:
  precioItem = cantidad × (precioUnitario − precioUnitarioDescuento)

CASOS DE PRUEBA:
  Caso A: cantidad=1, precioUnitario=100.00, descuento=0.00
    → precioItem = 1 × (100.00 − 0.00) = 100.00 ✓

  Caso B: cantidad=2, precioUnitario=50.00, descuento=5.00
    → precioItem = 2 × (50.00 − 5.00) = 90.00 ✓

  Caso C: cantidad=3.5, precioUnitario=10.123456, descuento=0.00
    → precioItem = 3.5 × 10.123456 = 35.432096 ✓

[V-5.1.1] ¿La fórmula precioItem usa exactamente cantidad × (precioUnitario − descuento)?
  ❌ FALLA si: precioItem = cantidad × precioUnitario (sin restar descuento)
  ❌ FALLA si: el descuento se aplica como porcentaje en lugar de Balboas
```

### 5.1.2 — valorITBMS

```
FÓRMULA OFICIAL:
  valorITBMS = tasaITBMS × precioItem

Tasas numéricas:
  "00" → 0.00   (0%)
  "01" → 0.07   (7%)
  "02" → 0.10   (10%)
  "03" → 0.15   (15%)

CASOS DE PRUEBA:
  Caso A: tasaITBMS="01", precioItem=1234.12
    → valorITBMS = 0.07 × 1234.12 = 86.3884 ✓
    (Nota: 6 decimales de precisión en el ítem)

  Caso B: tasaITBMS="00", precioItem=50.00
    → valorITBMS = 0.00 × 50.00 = 0.00 ✓

  Caso C: tasaITBMS="02", precioItem=100.00
    → valorITBMS = 0.10 × 100.00 = 10.00 ✓

  Caso D: tasaITBMS="03", precioItem=200.00
    → valorITBMS = 0.15 × 200.00 = 30.00 ✓

[V-5.1.2] ¿valorITBMS = tasa decimal × precioItem con hasta 6 decimales de precisión?
  ❌ FALLA CRÍTICA si: la tasa se usa como 7 en lugar de 0.07
```

### 5.1.3 — valorTotal del ítem

```
FÓRMULA OFICIAL:
  valorTotal = precioItem + precioAcarreo + precioSeguro + valorITBMS + valorISC

Cuando no hay acarreo, seguro ni ISC:
  valorTotal = precioItem + valorITBMS

CASOS DE PRUEBA:
  Caso A: precioItem=1234.12, valorITBMS=86.3884, sin acarreo/seguro/ISC
    → valorTotal = 1234.12 + 86.3884 = 1320.5084 ✓
    (En el ejemplo oficial del WS: 1335.3384 porque incluía OTI)

  Caso B: precioItem=5.55, valorITBMS=0.3885
    → valorTotal = 5.55 + 0.3885 = 5.9385 ✓

[V-5.1.3] ¿valorTotal = precioItem + valorITBMS (+ ISC si aplica + acarreo/seguro si aplica)?
```

---

## 5.2 — Fórmulas de TotalesSubTotales

### 5.2.1 — totalPrecioNeto

```
FÓRMULA OFICIAL:
  totalPrecioNeto = SUMA de precioItem de todos los ítems

(Es la suma ANTES de impuestos)

CASO DE PRUEBA (1 ítem):
  precioItem = 1234.12
  → totalPrecioNeto = 1234.12 ✓

[V-5.2.1] ¿totalPrecioNeto es la suma de precioItem (no de valorTotal)?
  ❌ FALLA si: suma los valorTotal en lugar de los precioItem
```

### 5.2.2 — totalITBMS

```
FÓRMULA OFICIAL:
  totalITBMS = SUMA de valorITBMS de todos los ítems
  (Redondeado a 2 decimales en los totales)

CASO DE PRUEBA (1 ítem):
  valorITBMS_item = 86.3884
  → totalITBMS = 86.39 (redondeado a 2 decimales) ✓

  Nota: El valorITBMS del ítem puede tener 4+ decimales,
        pero totalITBMS en los totales usa 2 decimales.

[V-5.2.2] ¿totalITBMS se redondea a 2 decimales en el nodo de totales?
  ❌ FALLA si: totalITBMS tiene más de 2 decimales en <ser:totalITBMS>
  ❌ FALLA si: totalITBMS tiene menos precisión que la suma real (truncado en lugar de redondeado)
```

### 5.2.3 — totalMontoGravado

```
FÓRMULA OFICIAL:
  totalMontoGravado = totalITBMS + totalISC + valorTotalOTI

Cuando no hay ISC ni OTI:
  totalMontoGravado = totalITBMS

CASO DE PRUEBA:
  totalITBMS=86.39, totalISC=0.00, sin OTI
  → totalMontoGravado = 86.39 ✓

[V-5.2.3] ¿totalMontoGravado incluye ISC y OTI además del ITBMS?
```

### 5.2.4 — totalTodosItems

```
FÓRMULA OFICIAL:
  totalTodosItems = SUMA de valorTotal de todos los ítems

(Incluye los impuestos a nivel ítem)

CASO DE PRUEBA (1 ítem):
  valorTotal_item = 1335.34
  → totalTodosItems = 1335.34 ✓

[V-5.2.4] ¿totalTodosItems = suma de valorTotal (con impuestos)?
  ❌ FALLA si: suma los precioItem en lugar de los valorTotal
```

### 5.2.5 — totalFactura

```
FÓRMULA OFICIAL:
  totalFactura = totalTodosItems + totalAcarreoCobrado + valorSeguroCobrado − totalDescuento

Cuando no hay acarreo, seguro ni descuento:
  totalFactura = totalTodosItems

CASOS DE PRUEBA:
  Caso A: totalTodosItems=1335.34, sin acarreo/seguro/descuento
    → totalFactura = 1335.34 ✓

  Caso B: totalTodosItems=500.00, totalDescuento=50.00
    → totalFactura = 500.00 − 50.00 = 450.00 ✓

  Caso C: totalTodosItems=500.00, totalAcarreoCobrado=20.00, totalDescuento=0.00
    → totalFactura = 500.00 + 20.00 = 520.00 ✓

[V-5.2.5] ¿totalFactura usa la fórmula correcta incluyendo descuentos/acarreo/seguro?
```

### 5.2.6 — totalValorRecibido

```
FÓRMULA OFICIAL:
  totalValorRecibido = SUMA de valorCuotaPagada de todas las formas de pago

CASO DE PRUEBA (pago completo en efectivo):
  valorCuotaPagada_efectivo = 1335.34
  → totalValorRecibido = 1335.34 ✓

CASO DE PRUEBA (pago mixto):
  valorCuotaPagada_tarjeta = 800.00
  valorCuotaPagada_efectivo = 535.34
  → totalValorRecibido = 1335.34 ✓

[V-5.2.6] ¿totalValorRecibido es la suma real de los pagos recibidos?
  ❌ FALLA si: totalValorRecibido = totalFactura (siempre igual, sin calcular)
```

### 5.2.7 — vuelto

```
FÓRMULA OFICIAL:
  Si totalValorRecibido > totalFactura:
    vuelto = totalValorRecibido − totalFactura

  Si totalValorRecibido = totalFactura:
    → NO informar vuelto (omitir el nodo)

CASO DE PRUEBA:
  totalFactura=100.00, totalValorRecibido=120.00
    → vuelto = "20.00" (incluir el nodo)

  totalFactura=100.00, totalValorRecibido=100.00
    → omitir <vuelto/> del XML

[V-5.2.7] ¿El vuelto se calcula y el nodo se omite cuando es cero?
```

---

## 5.3 — Reglas de Redondeo

> Esta es la causa más frecuente de rechazo en DGI. Prestar máxima atención.

**[V-5.3.1]** ¿La implementación usa redondeo bancario (ROUND_HALF_UP o similar)?
```
Recomendado: Math.round(valor * 100) / 100 para 2 decimales
             o usar una librería de Decimal precisión arbitraria

❌ RIESGO si: se usan operaciones de punto flotante sin Decimal/BigDecimal
             Ejemplo: 0.1 + 0.2 = 0.30000000000000004 en JavaScript nativo
```

**[V-5.3.2]** ¿Los ítems usan hasta 6 decimales y los totales usan 2 decimales?
```
A nivel ítem: valorITBMS, precioItem, etc. → hasta 6 decimales
A nivel total: totalITBMS, totalFactura, etc. → 2 decimales

CASO DE PRUEBA CRÍTICO:
  3 ítems con valorITBMS: 0.3885 + 0.3885 + 0.3885 = 1.1655
  totalITBMS redondeado = 1.17 (no 1.16 ni 1.1655)

[V-5.3.2] ¿El redondeo de totalITBMS es correcto al acumular ítems con decimales?
```

**[V-5.3.3]** ¿Se usa Decimal.js, big.js o similar para los cálculos fiscales?
```
En JavaScript/TypeScript, los cálculos de punto flotante pueden causar errores sutiles.
✅ RECOMENDADO: usar una librería de aritmética decimal precisa
⚠️ RIESGO si: todos los cálculos usan number nativo sin redondeo controlado
```

---

## 5.4 — Cálculo del DV del RUC

El dígito verificador (DV) del RUC se calcula mediante el algoritmo oficial de la DGI.
HKA provee el método `ConsultarRucDV()` para obtenerlo, pero también puede calcularse localmente.

**[V-5.4.1]** ¿Existe implementación local del algoritmo DV del RUC?
```
Si existe, verificar con estos casos conocidos:
  RUC: 155596713-2-2015  → DV esperado: 59
  (Usar el endpoint ConsultarRucDV() de HKA Demo para validar otros casos)

✅ CUMPLE si: el cálculo local produce el mismo DV que el endpoint de HKA
❌ FALLA si: el cálculo difiere del DV oficial de la DGI
🔍 N/A si: siempre se consulta el DV via ConsultarRucDV() (también válido)
```

---

## 5.5 — Consistencia Interna de un Documento

**[V-5.5.1]** Ejecutar esta validación cruzada sobre cualquier factura generada:

```
1. precioItem[i] = cantidad[i] × (precioUnitario[i] − precioUnitarioDescuento[i])
2. valorITBMS[i] = tasa[tasaITBMS[i]] × precioItem[i]
3. valorTotal[i] = precioItem[i] + valorITBMS[i] (+ ISC/acarreo/seguro si aplica)
4. totalPrecioNeto = Σ precioItem[i]
5. totalITBMS = Σ valorITBMS[i]  (redondeado a 2 dec)
6. totalTodosItems = Σ valorTotal[i]  (redondeado a 2 dec)
7. totalFactura = totalTodosItems ± ajustes (descuento, acarreo, seguro)
8. totalValorRecibido = Σ valorCuotaPagada
9. nroItems = count(listaItems)
10. totalMontoGravado = totalITBMS (+ ISC + OTI si aplica)

Si CUALQUIERA de estas ecuaciones no se cumple → el documento será rechazado.
```

---

## Checklist Etapa 5

| ID | Verificación | Estado |
|---|---|---|
| V-5.1.1 | precioItem = cantidad × (precio − descuento) | |
| V-5.1.2 | valorITBMS = tasa decimal (0.07 no 7) × precioItem | |
| V-5.1.3 | valorTotal = precioItem + valorITBMS (+ otros si aplican) | |
| V-5.2.1 | totalPrecioNeto = suma de precioItem (sin impuestos) | |
| V-5.2.2 | totalITBMS redondeado a 2 decimales | |
| V-5.2.3 | totalMontoGravado = totalITBMS + totalISC + OTI | |
| V-5.2.4 | totalTodosItems = suma de valorTotal (con impuestos) | |
| V-5.2.5 | totalFactura = totalTodosItems + ajustes − descuento | |
| V-5.2.6 | totalValorRecibido = suma real de formas de pago | |
| V-5.2.7 | vuelto calculado y nodo omitido cuando es cero | |
| V-5.3.1 | Redondeo controlado (no float nativo) | |
| V-5.3.2 | Ítems: hasta 6 dec. / Totales: 2 dec. | |
| V-5.3.3 | Librería de precisión decimal (Decimal.js o similar) | |
| V-5.5.1 | Validación cruzada completa de un documento de prueba | |
