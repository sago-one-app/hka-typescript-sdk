import Decimal from 'decimal.js';
import { ITBMS_RATES, ITBMSRateCode, ITBMS_RATES_DECIMAL } from '../catalogs/itbms-rates';
import { Item } from '../types/item.types';

Decimal.set({ rounding: Decimal.ROUND_HALF_UP });

export class ItbmsCalculator {
  static calculateItemItbms(tasaCode: ITBMSRateCode, precioItem: number): number {
    const tasa = ITBMS_RATES_DECIMAL[tasaCode] ?? 0;
    return new Decimal(tasa).times(new Decimal(precioItem)).toDecimalPlaces(6).toNumber();
  }

  static calculateTotalItbms(items: Item[]): number {
    let total = new Decimal(0);
    for (const item of items) {
      let valorITBMS = parseFloat(item.valorITBMS || '0');
      if (isNaN(valorITBMS) || !item.valorITBMS) {
        const precio = parseFloat(item.precioItem || '0');
        valorITBMS = this.calculateItemItbms(item.tasaITBMS as ITBMSRateCode, precio);
      }
      total = total.plus(new Decimal(valorITBMS));
    }
    return total.toDecimalPlaces(2).toNumber();
  }
}
