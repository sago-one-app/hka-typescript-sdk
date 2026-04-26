/**
 * Tests de robustecimiento — cubren las mejoras de precisión y validaciones
 * de negocio agregadas en la fase de hardening del SDK.
 */
import axios from 'axios';
import { HkaSdk } from '../sdk/hka-sdk';
import { HkaError, HKA_CODES, HKA_CODE_DESCRIPTIONS } from '../sdk/errors';
import {
  EMISSION_TYPES, NATURE_OPERATIONS, OPERATION_TYPES, OPERATION_DESTINATIONS,
  CAFE_FORMATS, CAFE_DELIVERY, ITBMS_RATES, PAYMENT_METHODS, PAYMENT_TIMES,
  CLIENT_TYPES, CONTRIBUTOR_TYPES,
} from '../catalogs';
import { TotalsCalculator } from '../calculators/totals.calculator';
import { ItbmsCalculator } from '../calculators/itbms.calculator';
import type { FacturaInput } from '../sdk/inputs/factura.input';
import type { Item } from '../types/item.types';
import type { FormaPago } from '../types/totals.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAxiosInstance(responseData: string) {
  const instance = {
    post: jest.fn().mockResolvedValue({ data: responseData }),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { headers: {} },
  } as unknown as ReturnType<typeof axios.create>;
  mockedAxios.create.mockReturnValue(instance);
  return instance;
}

function makeSdk() {
  return new HkaSdk({ environment: 'demo', tokenEmpresa: 'T', tokenPassword: 'P' });
}

function baseInput(): FacturaInput {
  return {
    codigoSucursalEmisor: '0000',
    tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
    numeroDocumentoFiscal: '0000000001',
    puntoFacturacionFiscal: '001',
    fechaEmision: '2024-06-15T10:00:00-05:00',
    naturalezaOperacion: NATURE_OPERATIONS.VENTA,
    tipoOperacion: OPERATION_TYPES.SALIDA_O_VENTA,
    destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
    formatoCAFE: CAFE_FORMATS.SIN_GENERACION,
    entregaCAFE: CAFE_DELIVERY.SIN_GENERACION,
    cliente: {
      tipoClienteFE: CLIENT_TYPES.CONTRIBUYENTE,
      tipoContribuyente: CONTRIBUTOR_TYPES.JURIDICO,
      numeroRUC: '155596713-2-2015',
      digitoVerificadorRUC: '59',
      razonSocial: 'Empresa SA',
      direccion: 'Ave. Balboa',
      pais: 'PA',
    },
    items: [{
      descripcion: 'Servicio',
      cantidad: '1',
      precioUnitario: '100.00',
      precioUnitarioDescuento: '0.00',
      precioItem: '100.00',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
    }],
    pagos: [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' }],
  };
}

// ─── P1: Precisión decimal (decimal.js) ───────────────────────────────────────

describe('Precisión decimal — ROUND_HALF_UP con decimal.js', () => {
  it('suma 3 valorITBMS de 0.3885 → totalITBMS = 1.17 (no 1.16)', () => {
    const items: Item[] = [1, 2, 3].map((n) => ({
      descripcion: `Item ${n}`,
      cantidad: '1',
      precioUnitario: '5.550000',
      precioUnitarioDescuento: '0.000000',
      precioItem: '5.550000',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
      valorITBMS: '0.388500',
      valorTotal: '5.938500',
    }));

    const total = ItbmsCalculator.calculateTotalItbms(items);
    // 3 × 0.3885 = 1.1655 → ROUND_HALF_UP a 2 dec = 1.17
    expect(total).toBe(1.17);
  });

  it('ItbmsCalculator.calculateItemItbms usa ROUND_HALF_UP a 6 decimales', () => {
    // 7% × 9.999999 = 0.69999993 → 7mo decimal = 9 ≥ 5 → ROUND_HALF_UP → 0.7 (ROUND_DOWN daría 0.699999)
    const result = ItbmsCalculator.calculateItemItbms(ITBMS_RATES.ESTANDAR, 9.999999);
    expect(result).toBe(0.7);
  });

  it('TotalsCalculator.calculate acumula correctamente sin errores de float', () => {
    const items: Item[] = Array.from({ length: 5 }, (_, i) => ({
      descripcion: `Item ${i + 1}`,
      cantidad: '3',
      precioUnitario: '10.333333',
      precioUnitarioDescuento: '0.000000',
      precioItem: '30.999999',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
      valorITBMS: '2.169999',
      valorTotal: '33.169998',
    }));

    const pagos: FormaPago[] = [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '165.85' }];
    const result = TotalsCalculator.calculate(items, pagos, PAYMENT_TIMES.INMEDIATO);

    // 5 × 30.999999 = 154.999995 → 155.00
    expect(result.totalPrecioNeto).toBe('155.00');
    // 5 × 2.169999 = 10.849995 → 10.85
    expect(result.totalITBMS).toBe('10.85');
  });
});

// ─── P2: Descuento no puede superar precioUnitario ────────────────────────────

describe('Validación — precioUnitarioDescuento ≤ precioUnitario', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando descuento > precio unitario', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      items: [{
        descripcion: 'Item con descuento excesivo',
        cantidad: '1',
        precioUnitario: '100.00',
        precioUnitarioDescuento: '150.00',  // ← mayor que precio
        precioItem: '-50.00',
        tasaITBMS: ITBMS_RATES.ESTANDAR,
      }],
    };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('precioUnitarioDescuento'),
    });
  });

  it('acepta descuento igual al precio unitario (100% descuento)', async () => {
    const cufe = 'R'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      items: [{
        descripcion: 'Item gratuito con 100% descuento',
        cantidad: '1',
        precioUnitario: '100.00',
        precioUnitarioDescuento: '100.00',
        precioItem: '0.00',
        tasaITBMS: ITBMS_RATES.EXENTO,
        valorITBMS: '0.000000',
        valorTotal: '0.000000',
      }],
      pagos: [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '0.00' }],
    };

    const result = await sdk.emitirFactura(input);
    expect(result.success).toBe(true);
  });
});

// ─── P3: Suma de listaPagoPlazo ────────────────────────────────────────────────

describe('Validación — listaPagoPlazo debe cuadrar con totalValorRecibido', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando cuotas a plazo no suman totalValorRecibido (tiempoPago=2)', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      pagos: [{ formaPagoFact: PAYMENT_METHODS.CHEQUE, valorCuotaPagada: '107.00' }],
      pagoPlazo: [
        { fechaVenceCuota: '2025-02-15', valorCuota: '50.00' },
        { fechaVenceCuota: '2025-03-15', valorCuota: '50.00' },
        // Total plazo = 100.00, pero totalValorRecibido = 107.00 → no cuadra
      ],
    };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('listaPagoPlazo'),
    });
  });
});

// ─── P4: Máximo 1000 ítems ────────────────────────────────────────────────────

describe('Validación — máximo 1000 ítems por documento', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando el documento tiene más de 1000 ítems', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const items = Array.from({ length: 1001 }, (_, i) => ({
      descripcion: `Producto ${i + 1}`,
      cantidad: '1',
      precioUnitario: '1.00',
      precioUnitarioDescuento: '0.00',
      precioItem: '1.00',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
    }));

    const input: FacturaInput = { ...baseInput(), items };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('1000'),
    });
  });

  it('acepta exactamente 1000 ítems sin error', async () => {
    const cufe = 'S'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const items = Array.from({ length: 1000 }, (_, i) => ({
      descripcion: `Producto ${i + 1}`,
      cantidad: '1',
      precioUnitario: '1.00',
      precioUnitarioDescuento: '0.00',
      precioItem: '1.00',
      tasaITBMS: ITBMS_RATES.EXENTO,
      valorITBMS: '0.000000',
      valorTotal: '1.000000',
    }));

    const totalValor = (1000).toFixed(2);
    const input: FacturaInput = {
      ...baseInput(),
      items,
      pagos: [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: totalValor }],
    };

    const result = await sdk.emitirFactura(input);
    expect(result.success).toBe(true);
  });
});

// ─── P5: Auto-corrección tasaITBMS para ítems de precio cero ─────────────────

describe('Auto-corrección — tasaITBMS="00" para ítems de precio cero', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fuerza tasaITBMS a EXENTO cuando precioItem=0 aunque se pase ESTANDAR', async () => {
    const cufe = 'T'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      items: [{
        descripcion: 'Producto gratuito (bonificación)',
        cantidad: '1',
        precioUnitario: '0.00',
        precioUnitarioDescuento: '0.00',
        precioItem: '0.00',
        tasaITBMS: ITBMS_RATES.ESTANDAR,  // ← developer lo pone mal
      }],
      pagos: [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '0.00' }],
    };

    await sdk.emitirFactura(input);

    const xml: string = (instance as any).post.mock.calls[0][1];
    // El SDK debe haber corregido a EXENTO ('00')
    expect(xml).toContain(`<ser:tasaITBMS>${ITBMS_RATES.EXENTO}</ser:tasaITBMS>`);
    expect(xml).toContain('<ser:valorITBMS>0.00</ser:valorITBMS>');
  });
});

// ─── P6: Zod constraints ──────────────────────────────────────────────────────

describe('Zod constraints — longitud de campos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando informacionInteres supera 500 caracteres', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      informacionInteres: 'A'.repeat(501),
    };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({ type: 'VALIDATION' });
  });

  it('acepta informacionInteres de exactamente 500 caracteres', async () => {
    const cufe = 'U'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.emitirFactura({
      ...baseInput(),
      informacionInteres: 'B'.repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

// ─── P7: HKA_CODES y descripciones ───────────────────────────────────────────

describe('HKA_CODES — catálogo completo de retornos', () => {
  it('tiene descripción para todos los códigos conocidos', () => {
    const codigosEsperados = ['200', '101', '102', '103', '104', '105', '110', '113', '118', '119', '300', '500'];
    for (const codigo of codigosEsperados) {
      expect(HKA_CODE_DESCRIPTIONS[codigo]).toBeDefined();
      expect(HKA_CODE_DESCRIPTIONS[codigo].length).toBeGreaterThan(5);
    }
  });

  it('HKA_CODES.SUCCESS sigue siendo "200"', () => {
    expect(HKA_CODES.SUCCESS).toBe('200');
  });

  it('el mensaje de error API incluye el código y la descripción', async () => {
    jest.clearAllMocks();
    const instance = {
      post: jest.fn().mockResolvedValue({
        data: `<EnviarResult><codigo>119</codigo><resultado>error</resultado><mensaje>Sin folios</mensaje></EnviarResult>`,
      }),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
      defaults: { headers: {} },
    } as unknown as ReturnType<typeof axios.create>;
    mockedAxios.create.mockReturnValue(instance);

    const sdk = makeSdk();
    await expect(sdk.emitirFactura(baseInput())).rejects.toMatchObject({
      type: 'API',
      details: { codigoHka: '119' },
      message: expect.stringContaining('119'),
    });
  });
});

// ─── P8: ClienteExtranjeroInput con never ────────────────────────────────────

describe('ClienteExtranjeroInput — campos prohibidos en tiempo de compilación', () => {
  it('acepta cliente extranjero bien formado', async () => {
    jest.clearAllMocks();
    const cufe = 'V'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.emitirFactura({
      ...baseInput(),
      destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
      cliente: {
        tipoClienteFE: '04',
        tipoIdentificacion: '01',
        nroIdentificacionExtranjero: 'PASSPORT-123',
        pais: 'US',
        // tipoContribuyente: never — TypeScript lo rechaza en compile time
      },
    });
    expect(result.success).toBe(true);
  });
});
