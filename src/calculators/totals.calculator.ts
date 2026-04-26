import Decimal from 'decimal.js';
import { Item } from '../types/item.types';
import { TotalesSubTotales, FormaPago } from '../types/totals.types';
import { PaymentTime } from '../catalogs/payment-times';
import { ItbmsCalculator } from './itbms.calculator';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export class TotalsCalculator {
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
    let neto = new Decimal(0);
    let totalItems = new Decimal(0);

    for (const item of items) {
      neto = neto.plus(new Decimal(item.precioItem || '0'));
      totalItems = totalItems.plus(new Decimal(item.valorTotal || '0'));
    }

    const itbms = new Decimal(ItbmsCalculator.calculateTotalItbms(items));

    const totalPrecioNeto = neto.toDecimalPlaces(2);
    const totalTodosItems = totalItems.toDecimalPlaces(2);

    const acarreo = new Decimal(options?.totalAcarreoCobrado ?? 0);
    const seguro  = new Decimal(options?.valorSeguroCobrado  ?? 0);
    const descuento = new Decimal(options?.totalDescuento ?? 0);
    const isc = new Decimal(options?.totalISC ?? 0);
    const oti = new Decimal(options?.totalOTI ?? 0);

    const totalFactura = totalTodosItems.plus(acarreo).plus(seguro).minus(descuento).toDecimalPlaces(2);
    const totalMontoGravado = itbms.plus(isc).plus(oti).toDecimalPlaces(2);

    let totalRecibido = new Decimal(0);
    for (const pago of listaFormaPago) {
      totalRecibido = totalRecibido.plus(new Decimal(pago.valorCuotaPagada || '0'));
    }
    totalRecibido = totalRecibido.toDecimalPlaces(2);

    const diff = totalRecibido.minus(totalFactura).toDecimalPlaces(2);
    const vuelto = diff.greaterThan(0) ? diff.toFixed(2) : undefined;

    return {
      totalPrecioNeto: totalPrecioNeto.toFixed(2),
      totalITBMS: itbms.toFixed(2),
      totalISC: isc.toFixed(2),
      totalMontoGravado: totalMontoGravado.toFixed(2),
      totalDescuento: descuento.greaterThan(0) ? descuento.toFixed(2) : undefined,
      totalAcarreoCobrado: acarreo.greaterThan(0) ? acarreo.toFixed(2) : undefined,
      valorSeguroCobrado: seguro.greaterThan(0) ? seguro.toFixed(2) : undefined,
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
