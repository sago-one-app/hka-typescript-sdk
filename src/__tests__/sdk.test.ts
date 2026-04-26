import axios from 'axios';
import { HkaSdk } from '../sdk/hka-sdk';
import { HkaError } from '../sdk/errors';
import { HKA_ENDPOINTS } from '../sdk/environments';
import {
  EMISSION_TYPES,
  NATURE_OPERATIONS,
  OPERATION_TYPES,
  OPERATION_DESTINATIONS,
  CAFE_FORMATS,
  CAFE_DELIVERY,
  ITBMS_RATES,
  PAYMENT_METHODS,
  PAYMENT_TIMES,
  DOCUMENT_TYPES,
  CONTRIBUTOR_TYPES,
  CLIENT_TYPES,
} from '../catalogs';
import type { FacturaInput } from '../sdk/inputs/factura.input';
import type { NotaCreditoReferenciadaInput } from '../sdk/inputs/nota.input';
import type { DatosDocumento } from '../types/datos-documento.types';

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

function makeRespXml(codigo: string, resultado: string, mensaje: string, extras = '') {
  return `<EnviarResult><codigo>${codigo}</codigo><resultado>${resultado}</resultado><mensaje>${mensaje}</mensaje>${extras}</EnviarResult>`;
}

function makeSdk(endpoint = 'demo') {
  return new HkaSdk({
    environment: 'demo',
    tokenEmpresa: 'TEST_TOKEN',
    tokenPassword: 'TEST_PASS',
  });
}

function baseFacturaInput(): FacturaInput {
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
      direccion: 'Ave. Balboa, Ciudad de Panamá',
      pais: 'PA',
    },
    items: [
      {
        descripcion: 'Servicio de consultoría',
        cantidad: '1',
        precioUnitario: '100.000000',
        precioUnitarioDescuento: '0.000000',
        precioItem: '100.000000',
        tasaITBMS: ITBMS_RATES.ESTANDAR,
      },
    ],
    pagos: [
      { formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' },
    ],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HkaSdk — Instanciación', () => {
  beforeEach(() => jest.clearAllMocks());

  it('instancia en demo y usa el endpoint correcto', () => {
    makeAxiosInstance('');
    new HkaSdk({ environment: 'demo', tokenEmpresa: 'T', tokenPassword: 'P' });
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: HKA_ENDPOINTS.demo })
    );
  });

  it('instancia en production y usa el endpoint correcto', () => {
    makeAxiosInstance('');
    new HkaSdk({ environment: 'production', tokenEmpresa: 'T', tokenPassword: 'P' });
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: HKA_ENDPOINTS.production })
    );
  });

  it('usa customEndpoint cuando se provee', () => {
    makeAxiosInstance('');
    new HkaSdk({
      environment: 'demo',
      tokenEmpresa: 'T',
      tokenPassword: 'P',
      customEndpoint: 'https://mi-proxy.com/ws',
    });
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://mi-proxy.com/ws' })
    );
  });
});

describe('HkaSdk — emitirFactura', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna EmisionResult con cufe cuando la respuesta es 200', async () => {
    const cufe = 'A'.repeat(66);
    makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', `<cufe>${cufe}</cufe><qr>https://qr.example.com</qr>`));
    const sdk = makeSdk();

    const result = await sdk.emitirFactura(baseFacturaInput());

    expect(result.success).toBe(true);
    expect(result.cufe).toBe(cufe);
    expect(result.qr).toBe('https://qr.example.com');
  });

  it('auto-calcula valorITBMS y valorTotal cuando no se proveen en items', async () => {
    const cufe = 'B'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    await sdk.emitirFactura(baseFacturaInput());

    // Verifica que se envió XML al WS (el post fue llamado)
    expect((instance as any).post).toHaveBeenCalledTimes(1);
    const xmlEnviado: string = (instance as any).post.mock.calls[0][1];
    // El XML formatea con 2 decimales (buildTag isAmount:true → toFixed(2))
    // 7% de 100.000000 = 7.000000 → 7.00
    expect(xmlEnviado).toContain('<ser:valorITBMS>7.00</ser:valorITBMS>');
    // 100.000000 + 7.000000 = 107.000000 → 107.00
    expect(xmlEnviado).toContain('<ser:valorTotal>107.00</ser:valorTotal>');
  });

  it('lanza HkaError tipo API cuando codigo !== 200', async () => {
    makeAxiosInstance(makeRespXml('101', 'error', 'Token inválido'));
    const sdk = makeSdk();

    await expect(sdk.emitirFactura(baseFacturaInput())).rejects.toMatchObject({
      type: 'API',
      message: expect.stringContaining('Token inválido'),
      details: { codigoHka: '101' },
    });
  });

  it('lanza HkaError tipo VALIDATION cuando falta naturalezaOperacion', async () => {
    makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', '<cufe>x</cufe>'));
    const sdk = makeSdk();

    const input: any = { ...baseFacturaInput(), naturalezaOperacion: undefined };
    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({ type: 'VALIDATION' });
  });

  it('lanza HkaError tipo VALIDATION cuando puntoFacturacionFiscal es 000', async () => {
    makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', '<cufe>x</cufe>'));
    const sdk = makeSdk();

    const input = { ...baseFacturaInput(), puntoFacturacionFiscal: '000' };
    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({ type: 'VALIDATION' });
  });

  it('lanza HkaError tipo NETWORK cuando axios falla', async () => {
    const instance = {
      post: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    } as unknown as ReturnType<typeof axios.create>;
    mockedAxios.create.mockReturnValue(instance);
    const sdk = makeSdk();

    await expect(sdk.emitirFactura(baseFacturaInput())).rejects.toMatchObject({ type: 'NETWORK' });
  });

  it('lanza HkaError tipo API si la respuesta 200 no trae cufe', async () => {
    makeAxiosInstance(makeRespXml('200', 'procesado', 'OK'));
    const sdk = makeSdk();

    await expect(sdk.emitirFactura(baseFacturaInput())).rejects.toMatchObject({
      type: 'API',
      message: expect.stringContaining('CUFE'),
    });
  });

  it('padea numeroDocumentoFiscal a 10 dígitos automáticamente', async () => {
    const cufe = 'C'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    const input = { ...baseFacturaInput(), numeroDocumentoFiscal: '5' };
    await sdk.emitirFactura(input);

    const xmlEnviado: string = (instance as any).post.mock.calls[0][1];
    expect(xmlEnviado).toContain('<ser:numeroDocumentoFiscal>0000000005</ser:numeroDocumentoFiscal>');
  });
});

describe('HkaSdk — emitirNotaCreditoReferenciada', () => {
  beforeEach(() => jest.clearAllMocks());

  it('incluye docFiscalReferenciado con cufeFEReferenciada en el XML', async () => {
    const cufe = 'D'.repeat(66);
    const cufeFE = 'E'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    const input: NotaCreditoReferenciadaInput = {
      ...baseFacturaInput(),
      docFiscalReferenciado: [{
        fechaEmisionDocFiscalReferenciado: '2026-01-15T10:00:00-05:00',
        cufeFEReferenciada: cufeFE,
      }],
    };

    await sdk.emitirNotaCreditoReferenciada(input);

    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain(`<ser:cufeFEReferenciada>${cufeFE}</ser:cufeFEReferenciada>`);
    expect(xml).toContain('<ser:tipoDocumento>04</ser:tipoDocumento>');
  });

  it('lanza VALIDATION cuando cufeFEReferenciada no tiene 66 chars', async () => {
    makeAxiosInstance(makeRespXml('200', 'OK', 'OK', '<cufe>x</cufe>'));
    const sdk = makeSdk();

    const input: NotaCreditoReferenciadaInput = {
      ...baseFacturaInput(),
      docFiscalReferenciado: [{
        fechaEmisionDocFiscalReferenciado: '2026-01-15T10:00:00-05:00',
        cufeFEReferenciada: 'CUFE_CORTO',
      }],
    };

    await expect(sdk.emitirNotaCreditoReferenciada(input)).rejects.toMatchObject({ type: 'VALIDATION' });
  });
});

describe('HkaSdk — emitirFacturaExportacion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('incluye datosFacturaExportacion en el XML', async () => {
    const cufe = 'F'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'procesado', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    const input = {
      ...baseFacturaInput(),
      destinoOperacion: OPERATION_DESTINATIONS.EXTRANJERO,
      cliente: {
        tipoClienteFE: CLIENT_TYPES.EXTRANJERO as '04',
        tipoIdentificacion: '01' as const,
        nroIdentificacionExtranjero: 'PASSPORT123',
        pais: 'US',
      },
      datosFacturaExportacion: {
        condicionesEntrega: 'FOB',
        monedaOperExportacion: 'USD',
        tipoDeCambio: '1.00',
        montoMonedaExtranjera: '100.00',
      },
    };

    await sdk.emitirFacturaExportacion(input);

    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:condicionesEntrega>FOB</ser:condicionesEntrega>');
    expect(xml).toContain('<ser:monedaOperExportacion>USD</ser:monedaOperExportacion>');
    expect(xml).toContain('<ser:tipoDocumento>03</ser:tipoDocumento>');
  });
});

describe('HkaSdk — anularDocumento', () => {
  beforeEach(() => jest.clearAllMocks());

  const datosDoc: DatosDocumento = {
    codigoSucursalEmisor: '0000',
    numeroDocumentoFiscal: '0000000001',
    puntoFacturacionFiscal: '001',
    tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
    tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
  };

  it('retorna AnulacionResult cuando la anulación es exitosa y está dentro de 7 días', async () => {
    makeAxiosInstance('<AnulacionDocumentoResult><codigo>200</codigo><resultado>procesado</resultado><mensaje>Anulado</mensaje></AnulacionDocumentoResult>');
    const sdk = makeSdk();

    // Fecha de hoy (dentro del plazo)
    const fechaReciente = new Date().toISOString().replace('Z', '-05:00');
    const result = await sdk.anularDocumento(datosDoc, 'Error en datos', fechaReciente);

    expect(result.success).toBe(true);
    expect(result.mensaje).toBe('Anulado');
  });

  it('lanza HkaError VALIDATION si han pasado más de 7 días desde la emisión', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const fechaVieja = '2020-01-01T10:00:00-05:00';
    await expect(sdk.anularDocumento(datosDoc, 'Error', fechaVieja)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('días'),
    });
  });
});

describe('HkaSdk — mapearCliente (via emitirFactura)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mapea cliente Contribuyente (01) correctamente', async () => {
    const cufe = 'G'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'OK', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    await sdk.emitirFactura(baseFacturaInput());

    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoClienteFE>01</ser:tipoClienteFE>');
    expect(xml).toContain('<ser:numeroRUC>155596713-2-2015</ser:numeroRUC>');
    expect(xml).not.toContain('<ser:nroIdentificacionExtranjero>');
  });

  it('mapea cliente Extranjero (04) sin RUC ni ubicación PA', async () => {
    const cufe = 'H'.repeat(66);
    const instance = makeAxiosInstance(makeRespXml('200', 'OK', 'OK', `<cufe>${cufe}</cufe>`));
    const sdk = makeSdk();

    // Extranjero comprando en Panamá: destinoOperacion=1, tipoClienteFE=04 — válido según DGI
    const input: FacturaInput = {
      ...baseFacturaInput(),
      destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
      cliente: {
        tipoClienteFE: CLIENT_TYPES.EXTRANJERO as '04',
        tipoIdentificacion: '01' as const,
        nroIdentificacionExtranjero: 'PASSPORT-US-999',
        pais: 'US',
      },
    };

    await sdk.emitirFactura(input);

    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoClienteFE>04</ser:tipoClienteFE>');
    expect(xml).toContain('<ser:nroIdentificacionExtranjero>PASSPORT-US-999</ser:nroIdentificacionExtranjero>');
    expect(xml).not.toContain('<ser:numeroRUC>');
  });
});

describe('HkaSdk — HkaError', () => {
  it('HkaError.isHkaError retorna true para instancias de HkaError', () => {
    const err = new HkaError('VALIDATION', 'test error');
    expect(HkaError.isHkaError(err)).toBe(true);
  });

  it('HkaError.isHkaError retorna false para errores nativos', () => {
    expect(HkaError.isHkaError(new Error('native'))).toBe(false);
  });

  it('HkaError hereda de Error correctamente', () => {
    const err = new HkaError('API', 'api error', { codigoHka: '404' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HkaError');
    expect(err.type).toBe('API');
    expect(err.details.codigoHka).toBe('404');
  });

  it('ENVIRONMENTS.demo apunta a la URL de demoemision', () => {
    expect(HKA_ENDPOINTS.demo).toContain('demoemision');
    expect(HKA_ENDPOINTS.production).not.toContain('demo');
  });
});
