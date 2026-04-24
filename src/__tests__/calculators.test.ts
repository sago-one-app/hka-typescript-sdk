import { ItbmsCalculator } from '../calculators/itbms.calculator';
import { RucDvCalculator } from '../calculators/ruc-dv.calculator';
import { ITBMS_RATES } from '../catalogs/itbms-rates';
import { Item } from '../types/item.types';

describe('Calculators', () => {
  describe('ItbmsCalculator', () => {
    it('calculates ITBMS at 7%', () => {
      expect(ItbmsCalculator.calculateItemItbms(ITBMS_RATES.ESTANDAR, 100)).toBe(7);
      expect(ItbmsCalculator.calculateItemItbms(ITBMS_RATES.ESTANDAR, 15.5)).toBe(1.085);
    });

    it('calculates total ITBMS properly', () => {
      const items: Item[] = [
        {
          descripcion: 'Item 1',
          cantidad: '1',
          precioUnitario: '100',
          precioUnitarioDescuento: '0',
          precioItem: '100',
          valorTotal: '107',
          tasaITBMS: ITBMS_RATES.ESTANDAR,
          valorITBMS: '7',
        },
        {
          descripcion: 'Item 2',
          cantidad: '2',
          precioUnitario: '50',
          precioUnitarioDescuento: '0',
          precioItem: '100',
          valorTotal: '110',
          tasaITBMS: ITBMS_RATES.ESPECIAL,
          valorITBMS: '10',
        }
      ];

      expect(ItbmsCalculator.calculateTotalItbms(items)).toBe(17.00);
    });
  });

  describe('RucDvCalculator', () => {
    it('calculates standard DGI modulo 11 RUC DV', () => {
      // Un RUC normal de prueba. Si usamos '155596713-2-2015', limpio es 15559671322015
      // Prueba teórica con RUC = '123456789'
      const dv = RucDvCalculator.calculateDV('123456789');
      // sum: 9*2 + 8*3 + 7*4 + 6*5 + 5*6 + 4*7 + 3*2 + 2*3 + 1*4
      // 18 + 24 + 28 + 30 + 30 + 28 + 6 + 6 + 4 = 174
      // 174 % 11 = 9
      // 11 - 9 = 2
      // dv = "02"
      expect(dv).toBe('02');
    });
  });
});
