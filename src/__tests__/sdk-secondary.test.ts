import axios from 'axios';
import { HkaSdk } from '../sdk/hka-sdk';
import { HkaError } from '../sdk/errors';
import {
  EMISSION_TYPES,
  NATURE_OPERATIONS,
  OPERATION_TYPES,
  OPERATION_DESTINATIONS,
  CAFE_FORMATS,
  CAFE_DELIVERY,
  ITBMS_RATES,
  PAYMENT_METHODS,
  DOCUMENT_TYPES,
  CONTRIBUTOR_TYPES,
  CLIENT_TYPES,
} from '../catalogs';
import type { DatosDocumento } from '../types/datos-documento.types';
import type { FacturaInput } from '../sdk/inputs/factura.input';
import type {
  FacturaZonaFrancaInput,
  ReembolsoInput,
  FacturaExtranjeroInput,
  FacturaImportacionInput,
} from '../sdk/inputs/factura.input';

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

const datosDoc: DatosDocumento = {
  codigoSucursalEmisor: '0000',
  numeroDocumentoFiscal: '0000000001',
  puntoFacturacionFiscal: '001',
  tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
  tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
};

// ─── Tipos de documento faltantes ────────────────────────────────────────────

describe('HkaSdk — emitirFacturaImportacion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa tipoDocumento 02 y naturalezaOperacion de importación', async () => {
    const cufe = 'I'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    // naturalezaOperacion es omitida: el SDK la fija automáticamente en IMPORTACION
    const input: FacturaImportacionInput = {
      ...baseInput(),
    };

    const result = await sdk.emitirFacturaImportacion(input);

    expect(result.success).toBe(true);
    expect(result.cufe).toBe(cufe);
    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoDocumento>02</ser:tipoDocumento>');
    expect(xml).toContain(`<ser:naturalezaOperacion>${NATURE_OPERATIONS.IMPORTACION}</ser:naturalezaOperacion>`);
  });
});

describe('HkaSdk — emitirFacturaZonaFranca', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa tipoDocumento 08', async () => {
    const cufe = 'J'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaZonaFrancaInput = baseInput();
    const result = await sdk.emitirFacturaZonaFranca(input);

    expect(result.success).toBe(true);
    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoDocumento>08</ser:tipoDocumento>');
  });
});

describe('HkaSdk — emitirReembolso', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa tipoDocumento 09', async () => {
    const cufe = 'K'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: ReembolsoInput = baseInput();
    const result = await sdk.emitirReembolso(input);

    expect(result.success).toBe(true);
    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoDocumento>09</ser:tipoDocumento>');
  });
});

describe('HkaSdk — emitirFacturaExtranjero', () => {
  beforeEach(() => jest.clearAllMocks());

  it('usa tipoDocumento 10 sin datosFacturaExportacion', async () => {
    const cufe = 'L'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaExtranjeroInput = {
      ...baseInput(),
      destinoOperacion: OPERATION_DESTINATIONS.EXTRANJERO,
      cliente: {
        tipoClienteFE: CLIENT_TYPES.EXTRANJERO as '04',
        tipoIdentificacion: '01' as const,
        nroIdentificacionExtranjero: 'PASSPORT999',
        pais: 'US',
      },
    };

    const result = await sdk.emitirFacturaExtranjero(input);

    expect(result.success).toBe(true);
    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:tipoDocumento>10</ser:tipoDocumento>');
    expect(xml).not.toContain('<ser:condicionesEntrega>');
  });
});

// ─── Métodos secundarios ───────────────────────────────────────────────────────

describe('HkaSdk — consultarEstado', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna cufe y estatusDocumento cuando el código es 200', async () => {
    const cufe = 'M'.repeat(66);
    makeAxiosInstance(
      `<EstadoDocumentoResult><codigo>200</codigo><resultado>ok</resultado><mensaje>Aceptado</mensaje>` +
      `<mensajeDocumento>Documento procesado</mensajeDocumento><cufe>${cufe}</cufe>` +
      `<estatusDocumento>02</estatusDocumento></EstadoDocumentoResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.consultarEstado(datosDoc);

    expect(result.success).toBe(true);
    expect(result.cufe).toBe(cufe);
    expect(result.estatusDocumento).toBe('02');
    expect(result.mensaje).toBe('Documento procesado');
  });

  it('lanza HkaError tipo API cuando el código no es 200', async () => {
    makeAxiosInstance(
      `<EstadoDocumentoResult><codigo>101</codigo><resultado>error</resultado><mensaje>Token inválido</mensaje></EstadoDocumentoResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.consultarEstado(datosDoc)).rejects.toMatchObject({
      type: 'API',
      details: { codigoHka: '101' },
    });
  });

  it('lanza HkaError tipo NETWORK ante fallo de red', async () => {
    const instance = {
      post: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as unknown as ReturnType<typeof axios.create>;
    mockedAxios.create.mockReturnValue(instance);
    const sdk = makeSdk();

    await expect(sdk.consultarEstado(datosDoc)).rejects.toMatchObject({ type: 'NETWORK' });
  });
});

describe('HkaSdk — descargarPDF', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna el PDF en base64 cuando el código es 200', async () => {
    const pdfBase64 = 'JVBERi0xLjQ=';
    makeAxiosInstance(
      `<DescargaPDFResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje>` +
      `<documento>${pdfBase64}</documento></DescargaPDFResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.descargarPDF(datosDoc);

    expect(result.success).toBe(true);
    expect(result.pdf).toBe(pdfBase64);
  });

  it('lanza HkaError API si la respuesta no trae pdf', async () => {
    makeAxiosInstance(
      `<DescargaPDFResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje></DescargaPDFResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.descargarPDF(datosDoc)).rejects.toMatchObject({
      type: 'API',
      message: expect.stringContaining('PDF'),
    });
  });

  it('lanza HkaError API cuando el código no es 200', async () => {
    makeAxiosInstance(
      `<DescargaPDFResult><codigo>105</codigo><resultado>error</resultado><mensaje>Documento no encontrado</mensaje></DescargaPDFResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.descargarPDF(datosDoc)).rejects.toMatchObject({
      type: 'API',
      details: { codigoHka: '105' },
    });
  });
});

describe('HkaSdk — descargarXML', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna el XML firmado cuando el código es 200', async () => {
    const xmlFirmado = '<DocumentoElectronico>...</DocumentoElectronico>';
    makeAxiosInstance(
      `<DescargaXMLResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje>` +
      `<documento>${xmlFirmado}</documento></DescargaXMLResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.descargarXML(datosDoc);

    expect(result.success).toBe(true);
    expect(result.xmlFirmado).toBe(xmlFirmado);
  });

  it('lanza HkaError API si la respuesta no trae xml', async () => {
    makeAxiosInstance(
      `<DescargaXMLResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje></DescargaXMLResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.descargarXML(datosDoc)).rejects.toMatchObject({
      type: 'API',
      message: expect.stringContaining('XML'),
    });
  });
});

describe('HkaSdk — consultarFoliosRestantes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna los datos de folios correctamente', async () => {
    makeAxiosInstance(
      `<FoliosRestantesResult>` +
      `<licencia>LIC-001</licencia>` +
      `<fechaLicencia>2026-12-31</fechaLicencia>` +
      `<ciclo>1</ciclo>` +
      `<fechaCiclo>2026-04-01</fechaCiclo>` +
      `<foliosTotalesCiclo>1000</foliosTotalesCiclo>` +
      `<foliosUtilizadosCiclo>250</foliosUtilizadosCiclo>` +
      `<foliosDisponibleCiclo>750</foliosDisponibleCiclo>` +
      `<foliosTotales>5000</foliosTotales>` +
      `</FoliosRestantesResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.consultarFoliosRestantes();

    expect(result.success).toBe(true);
    expect(result.foliosDisponibleCiclo).toBe('750');
    expect(result.foliosTotalesCiclo).toBe('1000');
    expect(result.licencia).toBe('LIC-001');
  });

  it('lanza HkaError NETWORK ante fallo de red', async () => {
    const instance = {
      post: jest.fn().mockRejectedValue(new Error('timeout')),
    } as unknown as ReturnType<typeof axios.create>;
    mockedAxios.create.mockReturnValue(instance);
    const sdk = makeSdk();

    await expect(sdk.consultarFoliosRestantes()).rejects.toMatchObject({ type: 'NETWORK' });
  });
});

describe('HkaSdk — enviarPorCorreo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna success cuando el código es 200', async () => {
    makeAxiosInstance(
      `<EnvioCorreoResult><codigo>200</codigo><resultado>ok</resultado><mensaje>Correo enviado</mensaje></EnvioCorreoResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.enviarPorCorreo(datosDoc, 'cliente@empresa.com');

    expect(result.success).toBe(true);
    expect(result.mensaje).toBe('Correo enviado');
  });

  it('lanza HkaError API cuando el código no es 200', async () => {
    makeAxiosInstance(
      `<EnvioCorreoResult><codigo>110</codigo><resultado>error</resultado><mensaje>Correo inválido</mensaje></EnvioCorreoResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.enviarPorCorreo(datosDoc, 'malo')).rejects.toMatchObject({
      type: 'API',
      details: { codigoHka: '110' },
    });
  });
});

describe('HkaSdk — rastrearCorreo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna lista de rastreo correctamente', async () => {
    const cufe = 'N'.repeat(66);
    makeAxiosInstance(
      `<RastreoCorreoResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje>` +
      `<listaRastreo><listTracking>` +
      `<correo>cliente@empresa.com</correo><creado_en>2026-04-25T10:00:00</creado_en>` +
      `<estado>entregado</estado><messageId>MSG-001</messageId>` +
      `</listTracking></listaRastreo></RastreoCorreoResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.rastrearCorreo(cufe);

    expect(result.codigo).toBe('200');
    expect(result.listaRastreo).toHaveLength(1);
    expect(result.listaRastreo![0].correo).toBe('cliente@empresa.com');
    expect(result.listaRastreo![0].estado).toBe('entregado');
  });

  it('lanza HkaError NETWORK ante fallo de red', async () => {
    const instance = {
      post: jest.fn().mockRejectedValue(new Error('network error')),
    } as unknown as ReturnType<typeof axios.create>;
    mockedAxios.create.mockReturnValue(instance);
    const sdk = makeSdk();

    await expect(sdk.rastrearCorreo('X'.repeat(66))).rejects.toMatchObject({ type: 'NETWORK' });
  });
});

describe('HkaSdk — consultarRucDV', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna infoRuc cuando el código es 200', async () => {
    makeAxiosInstance(
      `<ConsultarRucDVResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje>` +
      `<infoRuc><tipoRuc>2</tipoRuc><ruc>155596713-2-2015</ruc><dv>59</dv>` +
      `<razonSocial>Empresa SA</razonSocial><afiliadoFE>SI</afiliadoFE></infoRuc>` +
      `</ConsultarRucDVResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.consultarRucDV('155596713-2-2015');

    expect(result.success).toBe(true);
    expect(result.infoRuc?.dv).toBe('59');
    expect(result.infoRuc?.ruc).toBe('155596713-2-2015');
    expect(result.infoRuc?.afiliadoFE).toBe('SI');
  });

  it('retorna infoRuc undefined cuando no hay datos de RUC', async () => {
    makeAxiosInstance(
      `<ConsultarRucDVResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje></ConsultarRucDVResult>`
    );
    const sdk = makeSdk();

    const result = await sdk.consultarRucDV('000000000-0-0000');

    expect(result.success).toBe(true);
    expect(result.infoRuc).toBeUndefined();
  });

  it('lanza HkaError API cuando el código no es 200', async () => {
    makeAxiosInstance(
      `<ConsultarRucDVResult><codigo>115</codigo><resultado>error</resultado><mensaje>RUC no encontrado</mensaje></ConsultarRucDVResult>`
    );
    const sdk = makeSdk();

    await expect(sdk.consultarRucDV('RUC-INVALIDO')).rejects.toMatchObject({
      type: 'API',
      details: { codigoHka: '115' },
    });
  });
});

// ─── Validaciones nuevas ──────────────────────────────────────────────────────

describe('HkaSdk — validación descFormaPago', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando formaPagoFact=99 sin descFormaPago', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      pagos: [{ formaPagoFact: '99', valorCuotaPagada: '107.00' }],
    };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('descFormaPago'),
    });
  });

  it('no lanza error cuando formaPagoFact=99 con descFormaPago', async () => {
    const cufe = 'O'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      pagos: [{ formaPagoFact: '99', descFormaPago: 'Criptomoneda', valorCuotaPagada: '107.00' }],
    };

    const result = await sdk.emitirFactura(input);
    expect(result.success).toBe(true);
  });
});

describe('HkaSdk — validación paisOtro', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lanza VALIDATION cuando pais=ZZ sin paisOtro', async () => {
    makeAxiosInstance('');
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      destinoOperacion: OPERATION_DESTINATIONS.EXTRANJERO,
      cliente: {
        tipoClienteFE: CLIENT_TYPES.EXTRANJERO as '04',
        tipoIdentificacion: '01' as const,
        nroIdentificacionExtranjero: 'PASS123',
        pais: 'ZZ',
      },
    };

    await expect(sdk.emitirFactura(input)).rejects.toMatchObject({
      type: 'VALIDATION',
      message: expect.stringContaining('paisOtro'),
    });
  });

  it('no lanza error cuando pais=ZZ con paisOtro usando emitirFacturaExtranjero', async () => {
    const cufe = 'P'.repeat(66);
    makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    // Doc tipo 10 (operación extranjera) permite destinoOperacion='2' sin datosFacturaExportacion
    const input: FacturaExtranjeroInput = {
      ...baseInput(),
      destinoOperacion: OPERATION_DESTINATIONS.EXTRANJERO,
      cliente: {
        tipoClienteFE: CLIENT_TYPES.EXTRANJERO as '04',
        tipoIdentificacion: '01' as const,
        nroIdentificacionExtranjero: 'PASS123',
        pais: 'ZZ',
        paisOtro: 'Micronesia',
      },
    };

    const result = await sdk.emitirFacturaExtranjero(input);
    expect(result.success).toBe(true);
  });
});

describe('HkaSdk — ítem con Vehiculo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('incluye los datos del vehículo en el XML', async () => {
    const cufe = 'Q'.repeat(66);
    const instance = makeAxiosInstance(
      `<EnviarResult><codigo>200</codigo><resultado>ok</resultado><mensaje>ok</mensaje><cufe>${cufe}</cufe></EnviarResult>`
    );
    const sdk = makeSdk();

    const input: FacturaInput = {
      ...baseInput(),
      items: [{
        descripcion: 'Vehículo Toyota Corolla 2024',
        cantidad: '1',
        precioUnitario: '20000.00',
        precioUnitarioDescuento: '0.00',
        precioItem: '20000.00',
        tasaITBMS: ITBMS_RATES.ESTANDAR,
        vehiculo: {
          modalidadOperacionVenta: '1',
          chasis: '1HGCM82633A123456',
          marca: 'Toyota',
          modelo: 'Corolla',
          potenciaMotor: '150',
          tipoCombustible: '1',
          numeroMotor: 'MOT-123456',
          tipoVehiculo: '1',
          usoVehiculo: '1',
          year: 2024,
        },
      }],
      pagos: [{ formaPagoFact: PAYMENT_METHODS.TRANSFERENCIA_DEPOSITO, valorCuotaPagada: '21400.00' }],
    };

    await sdk.emitirFactura(input);

    const xml: string = (instance as any).post.mock.calls[0][1];
    expect(xml).toContain('<ser:chasis>1HGCM82633A123456</ser:chasis>');
    expect(xml).toContain('<ser:marca>Toyota</ser:marca>');
    expect(xml).toContain('<ser:year>2024</ser:year>');
  });
});
