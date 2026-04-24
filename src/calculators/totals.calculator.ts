import { Item } from '../types/item.types';
import { TotalesSubTotales, FormaPago } from '../types/totals.types';
import { PAYMENT_TIMES, PaymentTime } from '../catalogs/payment-times';
import { ItbmsCalculator } from './itbms.calculator';

export class TotalsCalculator {
  private static roundDecimal(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Generates the TotalesSubTotales object by aggregating the items.
   * Also calculates the change (vuelto) if payments are provided.
   */
  static calculate(
    items: Item[],
    listaFormaPago: FormaPago[],
    tiempoPago: PaymentTime,
    options?: {
      totalAcarreoCobrado?: number;
      valorSeguroCobrado?: number;
      totalDescuento?: number;
      totalISC?: number;
      totalOTI?: number;
    }
  ): Partial<TotalesSubTotales> {
    let neto = 0;
    let totalItems = 0;
    let itbms = 0;

    for (const item of items) {
      neto += parseFloat(item.precioItem || '0');
      totalItems += parseFloat(item.valorTotal || '0');
    }

    itbms = ItbmsCalculator.calculateTotalItbms(items);

    const totalPrecioNeto = this.roundDecimal(neto, 2);
    const totalTodosItems = this.roundDecimal(totalItems, 2);

    const acarreo = options?.totalAcarreoCobrado || 0;
    const seguro = options?.valorSeguroCobrado || 0;
    const descuento = options?.totalDescuento || 0;
    const isc = options?.totalISC || 0;
    const oti = options?.totalOTI || 0;

    const totalFactura = this.roundDecimal(totalTodosItems + acarreo + seguro - descuento, 2);
    const totalMontoGravado = this.roundDecimal(itbms + isc + oti, 2);

    let totalRecibido = 0;
    for (const pago of listaFormaPago) {
      totalRecibido += parseFloat(pago.valorCuotaPagada || '0');
    }
    totalRecibido = this.roundDecimal(totalRecibido, 2);

    const diff = this.roundDecimal(totalRecibido - totalFactura, 2);
    const vuelto = diff > 0 ? diff.toFixed(2) : undefined;

    return {
      totalPrecioNeto: totalPrecioNeto.toFixed(2),
      totalITBMS: itbms.toFixed(2),
      totalISC: isc.toFixed(2),
      totalMontoGravado: totalMontoGravado.toFixed(2),
      totalDescuento: descuento > 0 ? descuento.toFixed(2) : undefined,
      totalAcarreoCobrado: acarreo > 0 ? acarreo.toFixed(2) : undefined,
      valorSeguroCobrado: seguro > 0 ? seguro.toFixed(2) : undefined,
      totalFactura: totalFactura.toFixed(2),
      totalValorRecibido: totalRecibido.toFixed(2),
      vuelto,
      tiempoPago,
      nroItems: items.length,
      totalTodosItems: totalTodosItems.toFixed(2),
      listaFormaPago,
    };
  }
}
