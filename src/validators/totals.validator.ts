import Decimal from 'decimal.js';
import { DocumentoElectronico } from '../types/document.types';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

const ITEM_TOLERANCE  = new Decimal('0.000001');
const TOTAL_TOLERANCE = new Decimal('0.01');

function dec(value: string | number | undefined): Decimal {
  return new Decimal(value ?? 0);
}

function near(a: Decimal, b: Decimal, tolerance: Decimal): boolean {
  return a.minus(b).abs().lessThanOrEqualTo(tolerance);
}

export class TotalsValidator {
  static validate(doc: DocumentoElectronico): void {
    const items  = doc.listaItems;
    const totals = doc.totalesSubTotales;

    let calculatedNeto  = new Decimal(0);
    let calculatedITBMS = new Decimal(0);
    let calculatedISC   = new Decimal(0);
    let calculatedTotalItems = new Decimal(0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const cantidad               = dec(item.cantidad);
      const precioUnitario         = dec(item.precioUnitario);
      const precioUnitarioDescuento = dec(item.precioUnitarioDescuento ?? '0');

      // P2: descuento no puede superar el precio unitario
      if (precioUnitarioDescuento.greaterThan(precioUnitario)) {
        throw new Error(
          `precioUnitarioDescuento (${precioUnitarioDescuento}) no puede ser mayor que ` +
          `precioUnitario (${precioUnitario}) en ítem ${i + 1}.`
        );
      }

      // 5.1.1: precioItem = cantidad × (precioUnitario − precioUnitarioDescuento)
      const expectedPrecioItem = cantidad.times(precioUnitario.minus(precioUnitarioDescuento)).toDecimalPlaces(6);
      const actualPrecioItem   = dec(item.precioItem);

      if (!near(expectedPrecioItem, actualPrecioItem, ITEM_TOLERANCE)) {
        throw new Error(
          `precioItem en ítem ${i + 1} es incorrecto. ` +
          `Esperado: ${expectedPrecioItem.toFixed(6)}, Actual: ${item.precioItem}`
        );
      }

      // 5.1.3: valorTotal = precioItem + acarreo + seguro + valorITBMS + valorISC
      const valorITBMS   = dec(item.valorITBMS ?? '0');
      const valorISC     = dec(item.valorISC   ?? '0');
      const precioAcarreo = dec(item.precioAcarreo ?? '0');
      const precioSeguro  = dec(item.precioSeguro  ?? '0');
      const expectedValorTotal = actualPrecioItem.plus(precioAcarreo).plus(precioSeguro).plus(valorITBMS).plus(valorISC).toDecimalPlaces(6);
      const actualValorTotal   = dec(item.valorTotal);

      if (!near(expectedValorTotal, actualValorTotal, ITEM_TOLERANCE)) {
        throw new Error(
          `valorTotal en ítem ${i + 1} es incorrecto. ` +
          `Esperado: ${expectedValorTotal.toFixed(6)}, Actual: ${item.valorTotal}`
        );
      }

      calculatedNeto       = calculatedNeto.plus(actualPrecioItem);
      calculatedITBMS      = calculatedITBMS.plus(valorITBMS);
      calculatedISC        = calculatedISC.plus(valorISC);
      calculatedTotalItems = calculatedTotalItems.plus(actualValorTotal);
    }

    // Totales de cabecera
    const expectedTotalNeto = calculatedNeto.toDecimalPlaces(2);
    if (!near(expectedTotalNeto, dec(totals.totalPrecioNeto), TOTAL_TOLERANCE)) {
      throw new Error(`totalPrecioNeto incorrecto. Esperado: ${expectedTotalNeto.toFixed(2)}, Actual: ${totals.totalPrecioNeto}`);
    }

    const expectedTotalITBMS = calculatedITBMS.toDecimalPlaces(2);
    if (!near(expectedTotalITBMS, dec(totals.totalITBMS), TOTAL_TOLERANCE)) {
      throw new Error(`totalITBMS incorrecto. Esperado: ${expectedTotalITBMS.toFixed(2)}, Actual: ${totals.totalITBMS}`);
    }

    const expectedTotalTodosItems = calculatedTotalItems.toDecimalPlaces(2);
    if (!near(expectedTotalTodosItems, dec(totals.totalTodosItems), TOTAL_TOLERANCE)) {
      throw new Error(`totalTodosItems incorrecto. Esperado: ${expectedTotalTodosItems.toFixed(2)}, Actual: ${totals.totalTodosItems}`);
    }

    // totalFactura = totalTodosItems + acarreo + seguro − descuento
    const totalDescuento = dec(totals.totalDescuento ?? '0');
    const totalAcarreo   = dec(totals.totalAcarreoCobrado ?? '0');
    const totalSeguro    = dec(totals.valorSeguroCobrado  ?? '0');

    const expectedTotalFactura = expectedTotalTodosItems.plus(totalAcarreo).plus(totalSeguro).minus(totalDescuento).toDecimalPlaces(2);
    if (!near(expectedTotalFactura, dec(totals.totalFactura), TOTAL_TOLERANCE)) {
      throw new Error(`totalFactura incorrecto. Esperado: ${expectedTotalFactura.toFixed(2)}, Actual: ${totals.totalFactura}`);
    }

    // totalValorRecibido = suma de listaFormaPago
    let received = new Decimal(0);
    for (const pago of totals.listaFormaPago) {
      received = received.plus(dec(pago.valorCuotaPagada));
    }
    const expectedReceived = received.toDecimalPlaces(2);
    if (!near(expectedReceived, dec(totals.totalValorRecibido), TOTAL_TOLERANCE)) {
      throw new Error(`totalValorRecibido incorrecto. Esperado: ${expectedReceived.toFixed(2)}, Actual: ${totals.totalValorRecibido}`);
    }

    // P3 — Regla 4.6.B: listaPagoPlazo debe cuadrar según tiempoPago
    if (totals.tiempoPago === '2' || totals.tiempoPago === '3') {
      if (!totals.listaPagoPlazo || totals.listaPagoPlazo.length === 0) {
        throw new Error(`listaPagoPlazo es obligatorio cuando tiempoPago es '2' (Plazo) o '3' (Mixto).`);
      }

      let sumPlazo = new Decimal(0);
      for (const plazo of totals.listaPagoPlazo) {
        sumPlazo = sumPlazo.plus(dec(plazo.valorCuota));
      }
      sumPlazo = sumPlazo.toDecimalPlaces(2);

      if (totals.tiempoPago === '2') {
        // Plazo puro: la totalidad del valor debe estar en las cuotas
        if (!near(sumPlazo, expectedReceived, TOTAL_TOLERANCE)) {
          throw new Error(
            `Para tiempoPago='2' (Plazo), la suma de listaPagoPlazo (${sumPlazo.toFixed(2)}) ` +
            `debe ser igual a totalValorRecibido (${expectedReceived.toFixed(2)}).`
          );
        }
      } else {
        // Mixto: pago inmediato + cuotas = totalValorRecibido
        let sumInmediato = new Decimal(0);
        for (const pago of totals.listaFormaPago) {
          sumInmediato = sumInmediato.plus(dec(pago.valorCuotaPagada));
        }
        const sumTotal = sumInmediato.plus(sumPlazo).toDecimalPlaces(2);
        if (!near(sumTotal, expectedReceived, TOTAL_TOLERANCE)) {
          throw new Error(
            `Para tiempoPago='3' (Mixto), la suma de pagos inmediatos + cuotas a plazo ` +
            `(${sumTotal.toFixed(2)}) debe ser igual a totalValorRecibido (${expectedReceived.toFixed(2)}).`
          );
        }
      }
    }

    // Regla 4.6.C — Vuelto
    const diff = expectedReceived.minus(expectedTotalFactura).toDecimalPlaces(2);
    if (diff.greaterThan(0)) {
      if (!totals.vuelto || !near(dec(totals.vuelto), diff, TOTAL_TOLERANCE)) {
        throw new Error(`Vuelto incorrecto. Esperado: ${diff.toFixed(2)}`);
      }
    } else {
      if (totals.vuelto && dec(totals.vuelto).greaterThan(0)) {
        throw new Error(`Vuelto no debe informarse si totalValorRecibido ≤ totalFactura.`);
      }
    }

    // Regla 4.6.A — Acarreo/Seguro exclusivos (ítem vs total)
    const hasItemAcarreo = items.some(item => dec(item.precioAcarreo ?? '0').greaterThan(0));
    if (hasItemAcarreo && totalAcarreo.greaterThan(0)) {
      throw new Error(`Acarreo no puede informarse simultáneamente en ítem y en totales.`);
    }

    const hasItemSeguro = items.some(item => dec(item.precioSeguro ?? '0').greaterThan(0));
    if (hasItemSeguro && totalSeguro.greaterThan(0)) {
      throw new Error(`Seguro no puede informarse simultáneamente en ítem y en totales.`);
    }
  }
}
