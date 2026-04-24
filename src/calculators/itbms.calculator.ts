import { ITBMS_RATES, ITBMSRateCode, ITBMS_RATES_DECIMAL } from '../catalogs/itbms-rates';
import { Item } from '../types/item.types';

export class ItbmsCalculator {
  /**
   * Helper for decimal rounding
   */
  private static roundDecimal(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Calculates the ITBMS value for a single item.
   * Returns a number with up to 6 decimal places.
   */
  static calculateItemItbms(tasaCode: ITBMSRateCode, precioItem: number): number {
    const tasa = ITBMS_RATES_DECIMAL[tasaCode] || 0;
    return this.roundDecimal(tasa * precioItem, 6);
  }

  /**
   * Calculates the total ITBMS for a list of items.
   * Returns a number with exactly 2 decimal places (Banker's rounding usually, or half-up).
   */
  static calculateTotalItbms(items: Item[]): number {
    let total = 0;
    for (const item of items) {
      // Safely parse valorITBMS from the item, or calculate it if missing/invalid
      let valorITBMS = parseFloat(item.valorITBMS || '0');
      
      // If the developer passed an empty string or it's NaN, recalculate
      if (isNaN(valorITBMS) || !item.valorITBMS) {
        const precio = parseFloat(item.precioItem || '0');
        valorITBMS = this.calculateItemItbms(item.tasaITBMS as ITBMSRateCode, precio);
      }
      
      total += valorITBMS;
    }
    return this.roundDecimal(total, 2);
  }
}
