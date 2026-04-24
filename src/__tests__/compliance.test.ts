import { DocumentoElectronico } from '../types/document.types';
import { Cliente } from '../types/client.types';
import { Item } from '../types/item.types';
import { ClientValidator } from '../validators/client.validator';
import { DocumentValidator } from '../validators/document.validator';
import { TotalsValidator } from '../validators/totals.validator';
import { TotalsCalculator } from '../calculators/totals.calculator';
import { XmlBuilder } from '../builders/xml-builder';
import { DOCUMENT_TYPES } from '../catalogs/document-types';
import { EMISSION_TYPES } from '../catalogs/emission-types';
import { NATURE_OPERATIONS } from '../catalogs/nature-operations';
import { OPERATION_TYPES } from '../catalogs/operation-types';
import { OPERATION_DESTINATIONS } from '../catalogs/operation-destinations';
import { CAFE_FORMATS, CAFE_DELIVERY } from '../catalogs/cafe-formats';
import { PAYMENT_METHODS } from '../catalogs/payment-methods';
import { ITBMS_RATES } from '../catalogs/itbms-rates';
import { PAYMENT_TIMES } from '../catalogs/payment-times';

const baseCliente: Cliente = {
  tipoClienteFE: '01',
  tipoContribuyente: '2',
  numeroRUC: '15559671',
  digitoVerificadorRUC: '11',
  razonSocial: 'Empresa Prueba SA',
  direccion: 'Panama City',
  pais: 'PA',
};

const baseItem: Item = {
  descripcion: 'Item de prueba',
  cantidad: '1',
  precioUnitario: '100.00',
  precioUnitarioDescuento: '0.00',
  precioItem: '100.00',
  valorTotal: '107.00',
  tasaITBMS: ITBMS_RATES.ESTANDAR,
  valorITBMS: '7.00',
};

function createBaseDocument(): DocumentoElectronico {
  return {
    codigoSucursalEmisor: '0000',
    datosTransaccion: {
      tipoEmision: EMISSION_TYPES.AUTORIZACION_PREVIA_NORMAL,
      tipoDocumento: DOCUMENT_TYPES.FACTURA_OPERACION_INTERNA,
      numeroDocumentoFiscal: '0000000001',
      puntoFacturacionFiscal: '001',
      fechaEmision: '2023-01-01T12:00:00-05:00',
      naturalezaOperacion: NATURE_OPERATIONS.VENTA,
      tipoOperacion: OPERATION_TYPES.SALIDA_O_VENTA,
      destinoOperacion: OPERATION_DESTINATIONS.PANAMA,
      formatoCAFE: CAFE_FORMATS.SIN_GENERACION,
      entregaCAFE: CAFE_DELIVERY.SIN_GENERACION,
      envioContenedor: '1',
      procesoGeneracion: '1',
      cliente: { ...baseCliente },
    },
    listaItems: [{ ...baseItem }],
    totalesSubTotales: TotalsCalculator.calculate([{ ...baseItem }], [{ formaPagoFact: PAYMENT_METHODS.EFECTIVO, valorCuotaPagada: '107.00' }], PAYMENT_TIMES.INMEDIATO) as any,
  };
}

describe('Compliance 14 Cases DGI', () => {
  const validateDoc = (doc: DocumentoElectronico) => {
    ClientValidator.validate(doc.datosTransaccion.cliente, doc.datosTransaccion.destinoOperacion);
    DocumentValidator.validate(doc);
    TotalsValidator.validate(doc);
    return XmlBuilder.buildDocumentoElectronico(doc);
  };

  it('Caso 1: Factura operación interna - Contribuyente', () => {
    const doc = createBaseDocument();
    const xml = validateDoc(doc);
    expect(xml).toContain('<ser:numeroRUC>15559671</ser:numeroRUC>');
  });

  it('Caso 2: Factura operación interna - Consumidor Final', () => {
    const doc = createBaseDocument();
    doc.datosTransaccion.cliente.tipoClienteFE = '02'; // CF
    doc.datosTransaccion.cliente.tipoContribuyente = '1'; // Natural
    doc.datosTransaccion.cliente.numeroRUC = undefined;
    doc.datosTransaccion.cliente.digitoVerificadorRUC = undefined;
    
    const xml = validateDoc(doc);
    expect(xml).not.toContain('<ser:numeroRUC>');
    expect(xml).not.toContain('<ser:digitoVerificadorRUC>');
  });

  it('Caso 3: Factura operación interna - Gobierno', () => {
    const doc = createBaseDocument();
    doc.datosTransaccion.cliente.tipoClienteFE = '03'; // Gobierno
    doc.datosTransaccion.cliente.tipoContribuyente = '1'; // Natural o null
    doc.listaItems[0].codigoCPBS = '1234';
    doc.listaItems[0].codigoCPBSAbrev = 'A';
    doc.listaItems[0].unidadMedidaCPBS = 'X';

    const xml = validateDoc(doc);
    expect(xml).toContain('<ser:codigoCPBS>1234</ser:codigoCPBS>');
  });

  it('Caso 4: Factura operación interna - Extranjero', () => {
    const doc = createBaseDocument();
    doc.datosTransaccion.cliente = {
      tipoClienteFE: '04', // Extranjero
      tipoIdentificacion: '01',
      nroIdentificacionExtranjero: 'PASS123',
      pais: 'US',
    };

    const xml = validateDoc(doc);
    expect(xml).not.toContain('<ser:numeroRUC>');
    expect(xml).toContain('<ser:nroIdentificacionExtranjero>PASS123</ser:nroIdentificacionExtranjero>');
  });

  it('Caso 5: Nota de Crédito referente a FE', () => {
    const doc = createBaseDocument();
    doc.datosTransaccion.tipoDocumento = DOCUMENT_TYPES.NOTA_CREDITO_REFERENTE_FE;
    doc.docFiscalReferenciado = [{
      fechaEmisionDocFiscalReferenciado: '2023-01-01T10:00:00-05:00',
      cufeFEReferenciada: '1'.repeat(66),
    }];

    const xml = validateDoc(doc);
    expect(xml).toContain('<ser:cufeFEReferenciada>');
  });

  it('Caso 9: Múltiples tasas ITBMS', () => {
    const doc = createBaseDocument();
    doc.listaItems = [
      { descripcion: '1', cantidad: '1', precioUnitario: '100', precioUnitarioDescuento: '0', precioItem: '100', valorTotal: '100', tasaITBMS: ITBMS_RATES.EXENTO, valorITBMS: '0' },
      { descripcion: '2', cantidad: '1', precioUnitario: '100', precioUnitarioDescuento: '0', precioItem: '100', valorTotal: '107', tasaITBMS: ITBMS_RATES.ESTANDAR, valorITBMS: '7' },
      { descripcion: '3', cantidad: '1', precioUnitario: '100', precioUnitarioDescuento: '0', precioItem: '100', valorTotal: '110', tasaITBMS: ITBMS_RATES.ESPECIAL, valorITBMS: '10' },
      { descripcion: '4', cantidad: '1', precioUnitario: '100', precioUnitarioDescuento: '0', precioItem: '100', valorTotal: '115', tasaITBMS: ITBMS_RATES.ESPECIAL_ALCOHOL_TABACO, valorITBMS: '15' },
    ];
    doc.totalesSubTotales = TotalsCalculator.calculate(doc.listaItems, [{ formaPagoFact: '01', valorCuotaPagada: '432' }], '1') as any;

    const xml = validateDoc(doc);
    expect(doc.totalesSubTotales.totalITBMS).toBe('32.00');
    expect(doc.totalesSubTotales.totalFactura).toBe('432.00');
  });

  it('Caso 11: Descuento por ítem', () => {
    const doc = createBaseDocument();
    doc.listaItems = [{
      descripcion: 'Item 1',
      cantidad: '2',
      precioUnitario: '50.00',
      precioUnitarioDescuento: '5.00',
      precioItem: '90.00',
      valorTotal: '96.30',
      tasaITBMS: ITBMS_RATES.ESTANDAR,
      valorITBMS: '6.30'
    }];
    doc.totalesSubTotales = TotalsCalculator.calculate(doc.listaItems, [{ formaPagoFact: '01', valorCuotaPagada: '96.30' }], '1') as any;

    const xml = validateDoc(doc);
    expect(doc.totalesSubTotales.totalFactura).toBe('96.30');
  });

  it('Caso 12: Descuento global', () => {
    const doc = createBaseDocument();
    doc.totalesSubTotales = TotalsCalculator.calculate(doc.listaItems, [{ formaPagoFact: '01', valorCuotaPagada: '7.00' }], '1', {
      totalDescuento: 100.00
    }) as any;

    // Descuento global
    doc.totalesSubTotales.descuentoBonificacion = [{ descDescuento: 'Desc', montoDescuento: '100.00' }];

    const xml = validateDoc(doc);
    expect(doc.totalesSubTotales.totalFactura).toBe('7.00'); // 107 - 100
  });

  it('Caso 14: Precios 6 decimales redondeo', () => {
    const doc = createBaseDocument();
    doc.listaItems = [
      {
        descripcion: 'Item A',
        cantidad: '3',
        precioUnitario: '10.123456',
        precioUnitarioDescuento: '0',
        precioItem: '30.370368', // 3 * 10.123456
        valorTotal: '32.496294', // 30.370368 + (30.370368 * 0.07 -> 2.125926)
        tasaITBMS: ITBMS_RATES.ESTANDAR,
        valorITBMS: '2.125926'
      },
      {
        descripcion: 'Item B',
        cantidad: '2',
        precioUnitario: '5.666666',
        precioUnitarioDescuento: '0',
        precioItem: '11.333332',
        valorTotal: '12.126665', // 11.333332 + (11.333332 * 0.07 -> 0.793333)
        tasaITBMS: ITBMS_RATES.ESTANDAR,
        valorITBMS: '0.793333'
      }
    ];

    doc.totalesSubTotales = TotalsCalculator.calculate(doc.listaItems, [{ formaPagoFact: '01', valorCuotaPagada: '44.62' }], '1') as any;

    const xml = validateDoc(doc);
    expect(doc.totalesSubTotales.totalITBMS).toBe('2.92');
    expect(doc.totalesSubTotales.totalFactura).toBe('44.62');
  });
});
