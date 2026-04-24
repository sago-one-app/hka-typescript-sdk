import { DocumentoElectronico } from '../types/document.types';

export class TotalsValidator {
  /**
   * Helper for decimal rounding using Math.round(val * 10^precision) / 10^precision
   * This handles basic banker's rounding if applied carefully, but standard JS rounding is half-up.
   */
  private static roundDecimal(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  static validate(doc: DocumentoElectronico): void {
    const items = doc.listaItems;
    const totals = doc.totalesSubTotales;

    let calculatedNeto = 0;
    let calculatedITBMS = 0;
    let calculatedISC = 0;
    let calculatedTotalItems = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // 5.1.1 precioItem = cantidad * (precioUnitario - precioUnitarioDescuento)
      const cantidad = parseFloat(item.cantidad);
      const precioUnitario = parseFloat(item.precioUnitario);
      const precioUnitarioDescuento = parseFloat(item.precioUnitarioDescuento || '0');
      const expectedPrecioItem = this.roundDecimal(cantidad * (precioUnitario - precioUnitarioDescuento), 6);
      const actualPrecioItem = parseFloat(item.precioItem);

      if (Math.abs(expectedPrecioItem - actualPrecioItem) > 0.000001) {
        throw new Error(`precioItem en ítem ${i+1} es incorrecto. Esperado: ${expectedPrecioItem}, Actual: ${actualPrecioItem}`);
      }

      // 5.1.3 valorTotal = precioItem + precioAcarreo + precioSeguro + valorITBMS + valorISC
      const valorITBMS = parseFloat(item.valorITBMS || '0');
      const valorISC = parseFloat(item.valorISC || '0');
      const precioAcarreo = parseFloat(item.precioAcarreo || '0');
      const precioSeguro = parseFloat(item.precioSeguro || '0');
      const expectedValorTotal = this.roundDecimal(actualPrecioItem + precioAcarreo + precioSeguro + valorITBMS + valorISC, 6);
      const actualValorTotal = parseFloat(item.valorTotal);

      if (Math.abs(expectedValorTotal - actualValorTotal) > 0.000001) {
        throw new Error(`valorTotal en ítem ${i+1} es incorrecto. Esperado: ${expectedValorTotal}, Actual: ${actualValorTotal}`);
      }

      calculatedNeto += actualPrecioItem;
      calculatedITBMS += valorITBMS;
      calculatedISC += valorISC;
      calculatedTotalItems += actualValorTotal;
    }

    // Totals level validation
    const expectedTotalNeto = this.roundDecimal(calculatedNeto, 2);
    if (parseFloat(totals.totalPrecioNeto) !== expectedTotalNeto) {
      throw new Error(`totalPrecioNeto incorrecto. Esperado: ${expectedTotalNeto}, Actual: ${totals.totalPrecioNeto}`);
    }

    const expectedTotalITBMS = this.roundDecimal(calculatedITBMS, 2);
    if (parseFloat(totals.totalITBMS) !== expectedTotalITBMS) {
      throw new Error(`totalITBMS incorrecto. Esperado: ${expectedTotalITBMS}, Actual: ${totals.totalITBMS}`);
    }

    const expectedTotalTodosItems = this.roundDecimal(calculatedTotalItems, 2);
    if (parseFloat(totals.totalTodosItems) !== expectedTotalTodosItems) {
      throw new Error(`totalTodosItems incorrecto. Esperado: ${expectedTotalTodosItems}, Actual: ${totals.totalTodosItems}`);
    }

    // totalFactura = totalTodosItems + acarreo + seguro - descuento
    const totalDescuento = parseFloat(totals.totalDescuento || '0');
    const totalAcarreo = parseFloat(totals.totalAcarreoCobrado || '0');
    const totalSeguro = parseFloat(totals.valorSeguroCobrado || '0');
    
    const expectedTotalFactura = this.roundDecimal(expectedTotalTodosItems + totalAcarreo + totalSeguro - totalDescuento, 2);
    if (parseFloat(totals.totalFactura) !== expectedTotalFactura) {
      throw new Error(`totalFactura incorrecto. Esperado: ${expectedTotalFactura}, Actual: ${totals.totalFactura}`);
    }

    // totalValorRecibido sum check
    let received = 0;
    for (const pago of totals.listaFormaPago) {
      received += parseFloat(pago.valorCuotaPagada);
    }
    const expectedReceived = this.roundDecimal(received, 2);
    if (parseFloat(totals.totalValorRecibido) !== expectedReceived) {
      throw new Error(`totalValorRecibido incorrecto. Esperado: ${expectedReceived}, Actual: ${totals.totalValorRecibido}`);
    }

    // Regla 4.6.B - Pago a plazo
    if (totals.tiempoPago === '2' || totals.tiempoPago === '3') {
      if (!totals.listaPagoPlazo || totals.listaPagoPlazo.length === 0) {
        throw new Error(`listaPagoPlazo es obligatorio cuando tiempoPago es 2 (Plazo) o 3 (Mixto).`);
      }
      let sumPlazo = 0;
      for (const plazo of totals.listaPagoPlazo) {
        sumPlazo += parseFloat(plazo.valorCuota);
      }
      sumPlazo = this.roundDecimal(sumPlazo, 2);
      // Not always equal to totalValorRecibido if mixed, but the list must exist.
    }

    // Regla 4.6.C - Vuelto
    const diffVuelto = this.roundDecimal(expectedReceived - expectedTotalFactura, 2);
    if (diffVuelto > 0) {
      if (!totals.vuelto || parseFloat(totals.vuelto) !== diffVuelto) {
        throw new Error(`Vuelto incorrecto. Esperado: ${diffVuelto}`);
      }
    } else {
      if (totals.vuelto && parseFloat(totals.vuelto) > 0) {
        throw new Error(`Vuelto no debe informarse si totalValorRecibido <= totalFactura.`);
      }
    }
    
    // Regla 4.6.A - Acarreo y Seguro exclusivos
    const hasItemAcarreo = items.some(item => parseFloat(item.precioAcarreo || '0') > 0);
    if (hasItemAcarreo && totalAcarreo > 0) {
      throw new Error(`Acarreo no puede informarse simultáneamente en ítem y en totales.`);
    }

    const hasItemSeguro = items.some(item => parseFloat(item.precioSeguro || '0') > 0);
    if (hasItemSeguro && totalSeguro > 0) {
      throw new Error(`Seguro no puede informarse simultáneamente en ítem y en totales.`);
    }
  }
}
