import { DocumentoElectronico } from '../types/document.types';

export class XmlBuilder {
  /**
   * Helper to escape special XML characters
   */
  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Helper to generate a tag only if the value is defined and not an empty string.
   */
  private static buildTag(tagName: string, value: string | number | undefined, namespace = 'ser'): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    const valStr = typeof value === 'string' ? this.escapeXml(value) : value.toString();
    return `<${namespace}:${tagName}>${valStr}</${namespace}:${tagName}>\n`;
  }

  /**
   * Builds the inner DocumentoElectronico XML
   */
  static buildDocumentoElectronico(doc: DocumentoElectronico): string {
    let xml = '';
    
    xml += this.buildTag('codigoSucursalEmisor', doc.codigoSucursalEmisor);
    xml += this.buildTag('tipoSucursal', doc.tipoSucursal);

    // datosTransaccion
    const trx = doc.datosTransaccion;
    xml += `<ser:datosTransaccion>\n`;
    xml += this.buildTag('tipoEmision', trx.tipoEmision);
    xml += this.buildTag('tipoDocumento', trx.tipoDocumento);
    xml += this.buildTag('numeroDocumentoFiscal', trx.numeroDocumentoFiscal);
    xml += this.buildTag('puntoFacturacionFiscal', trx.puntoFacturacionFiscal);
    xml += this.buildTag('fechaEmision', trx.fechaEmision);
    xml += this.buildTag('fechaSalida', trx.fechaSalida);
    xml += this.buildTag('fechaInicioContingencia', trx.fechaInicioContingencia);
    xml += this.buildTag('motivoContingencia', trx.motivoContingencia);
    xml += this.buildTag('naturalezaOperacion', trx.naturalezaOperacion);
    xml += this.buildTag('tipoOperacion', trx.tipoOperacion);
    xml += this.buildTag('destinoOperacion', trx.destinoOperacion);
    xml += this.buildTag('formatoCAFE', trx.formatoCAFE);
    xml += this.buildTag('entregaCAFE', trx.entregaCAFE);
    xml += this.buildTag('envioContenedor', trx.envioContenedor);
    xml += this.buildTag('procesoGeneracion', trx.procesoGeneracion);
    xml += this.buildTag('tipoVenta', trx.tipoVenta);
    xml += this.buildTag('informacionInteres', trx.informacionInteres);

    // cliente
    const cli = trx.cliente;
    xml += `<ser:cliente>\n`;
    xml += this.buildTag('tipoClienteFE', cli.tipoClienteFE);
    xml += this.buildTag('tipoContribuyente', cli.tipoContribuyente);
    xml += this.buildTag('numeroRUC', cli.numeroRUC);
    xml += this.buildTag('digitoVerificadorRUC', cli.digitoVerificadorRUC);
    xml += this.buildTag('razonSocial', cli.razonSocial);
    xml += this.buildTag('direccion', cli.direccion);
    xml += this.buildTag('codigoUbicacion', cli.codigoUbicacion);
    xml += this.buildTag('provincia', cli.provincia);
    xml += this.buildTag('distrito', cli.distrito);
    xml += this.buildTag('corregimiento', cli.corregimiento);
    xml += this.buildTag('tipoIdentificacion', cli.tipoIdentificacion);
    xml += this.buildTag('nroIdentificacionExtranjero', cli.nroIdentificacionExtranjero);
    xml += this.buildTag('paisExtranjero', cli.paisExtranjero);
    xml += this.buildTag('telefono1', cli.telefono1);
    xml += this.buildTag('telefono2', cli.telefono2);
    xml += this.buildTag('telefono3', cli.telefono3);
    xml += this.buildTag('correo1', cli.correo1);
    xml += this.buildTag('correo2', cli.correo2);
    xml += this.buildTag('pais', cli.pais);
    xml += this.buildTag('paisOtro', cli.paisOtro);
    xml += `</ser:cliente>\n`;
    xml += `</ser:datosTransaccion>\n`;

    // listaItems
    xml += `<ser:listaItems>\n`;
    for (const item of doc.listaItems) {
      xml += `<ser:item>\n`;
      xml += this.buildTag('descripcion', item.descripcion);
      xml += this.buildTag('codigo', item.codigo);
      xml += this.buildTag('codigoCPBS', item.codigoCPBS);
      xml += this.buildTag('codigoCPBSAbrev', item.codigoCPBSAbrev);
      xml += this.buildTag('unidadMedidaCPBS', item.unidadMedidaCPBS);
      xml += this.buildTag('unidadMedida', item.unidadMedida);
      xml += this.buildTag('cantidad', item.cantidad);
      xml += this.buildTag('fechaFabricacion', item.fechaFabricacion);
      xml += this.buildTag('fechaCaducidad', item.fechaCaducidad);
      xml += this.buildTag('infoInteresItem', item.infoInteresItem);
      xml += this.buildTag('precioUnitario', item.precioUnitario);
      xml += this.buildTag('precioUnitarioDescuento', item.precioUnitarioDescuento);
      xml += this.buildTag('precioItem', item.precioItem);
      xml += this.buildTag('precioAcarreo', item.precioAcarreo);
      xml += this.buildTag('precioSeguro', item.precioSeguro);
      xml += this.buildTag('valorTotal', item.valorTotal);
      xml += this.buildTag('tasaITBMS', item.tasaITBMS);
      xml += this.buildTag('valorITBMS', item.valorITBMS);
      xml += this.buildTag('tasaISC', item.tasaISC);
      xml += this.buildTag('valorISC', item.valorISC);
      xml += this.buildTag('codigoGTIN', item.codigoGTIN);

      if (item.medicina) {
        xml += `<ser:medicina>\n`;
        xml += this.buildTag('nroLote', item.medicina.nroLote);
        xml += this.buildTag('cantProductosLote', item.medicina.cantProductosLote);
        xml += `</ser:medicina>\n`;
      }

      if (item.vehiculo) {
        xml += `<ser:vehiculo>\n`;
        xml += this.buildTag('modalidadOperacionVenta', item.vehiculo.modalidadOperacionVenta);
        xml += this.buildTag('chasis', item.vehiculo.chasis);
        xml += this.buildTag('marca', item.vehiculo.marca);
        xml += this.buildTag('modelo', item.vehiculo.modelo);
        xml += this.buildTag('potenciaMotor', item.vehiculo.potenciaMotor);
        xml += this.buildTag('tipoCombustible', item.vehiculo.tipoCombustible);
        xml += this.buildTag('numeroMotor', item.vehiculo.numeroMotor);
        xml += this.buildTag('capacidadPasajeros', item.vehiculo.capacidadPasajeros);
        xml += this.buildTag('tipoVehiculo', item.vehiculo.tipoVehiculo);
        xml += this.buildTag('usoVehiculo', item.vehiculo.usoVehiculo);
        xml += this.buildTag('tonelaje', item.vehiculo.tonelaje);
        xml += this.buildTag('color', item.vehiculo.color);
        xml += this.buildTag('year', item.vehiculo.year);
        xml += `</ser:vehiculo>\n`;
      }

      if (item.listaItemOTI && item.listaItemOTI.length > 0) {
        xml += `<ser:listaItemOTI>\n`;
        for (const oti of item.listaItemOTI) {
          xml += `<ser:itemOTI>\n`;
          xml += this.buildTag('tasaOTI', oti.tasaOTI);
          xml += this.buildTag('valorOTI', oti.valorOTI);
          xml += `</ser:itemOTI>\n`;
        }
        xml += `</ser:listaItemOTI>\n`;
      }

      xml += `</ser:item>\n`;
    }
    xml += `</ser:listaItems>\n`;

    // totalesSubTotales
    const tot = doc.totalesSubTotales;
    xml += `<ser:totalesSubTotales>\n`;
    xml += this.buildTag('totalPrecioNeto', tot.totalPrecioNeto);
    xml += this.buildTag('totalITBMS', tot.totalITBMS);
    xml += this.buildTag('totalISC', tot.totalISC);
    xml += this.buildTag('totalMontoGravado', tot.totalMontoGravado);
    xml += this.buildTag('totalDescuento', tot.totalDescuento);
    xml += this.buildTag('totalAcarreoCobrado', tot.totalAcarreoCobrado);
    xml += this.buildTag('valorSeguroCobrado', tot.valorSeguroCobrado);
    xml += this.buildTag('totalFactura', tot.totalFactura);
    xml += this.buildTag('totalValorRecibido', tot.totalValorRecibido);
    xml += this.buildTag('vuelto', tot.vuelto);
    xml += this.buildTag('tiempoPago', tot.tiempoPago);
    xml += this.buildTag('nroItems', tot.nroItems);
    xml += this.buildTag('totalTodosItems', tot.totalTodosItems);

    xml += `<ser:listaFormaPago>\n`;
    for (const fp of tot.listaFormaPago) {
      xml += `<ser:formaPago>\n`;
      xml += this.buildTag('formaPagoFact', fp.formaPagoFact);
      xml += this.buildTag('descFormaPago', fp.descFormaPago);
      xml += this.buildTag('valorCuotaPagada', fp.valorCuotaPagada);
      xml += `</ser:formaPago>\n`;
    }
    xml += `</ser:listaFormaPago>\n`;

    if (tot.listaPagoPlazo && tot.listaPagoPlazo.length > 0) {
      xml += `<ser:listaPagoPlazo>\n`;
      for (const pp of tot.listaPagoPlazo) {
        xml += `<ser:pagoPlazo>\n`;
        xml += this.buildTag('fechaVenceCuota', pp.fechaVenceCuota);
        xml += this.buildTag('valorCuota', pp.valorCuota);
        xml += `</ser:pagoPlazo>\n`;
      }
      xml += `</ser:listaPagoPlazo>\n`;
    }

    if (tot.listaTotalOTI && tot.listaTotalOTI.length > 0) {
      xml += `<ser:listaTotalOTI>\n`;
      for (const oti of tot.listaTotalOTI) {
        xml += `<ser:totalOTI>\n`;
        xml += this.buildTag('tasaOTI', oti.tasaOTI);
        xml += this.buildTag('valorTotalOTI', oti.valorTotalOTI);
        xml += `</ser:totalOTI>\n`;
      }
      xml += `</ser:listaTotalOTI>\n`;
    }

    if (tot.retencion) {
      xml += `<ser:retencion>\n`;
      xml += this.buildTag('codigoRetencion', tot.retencion.codigoRetencion);
      xml += this.buildTag('montoRetencion', tot.retencion.montoRetencion);
      xml += `</ser:retencion>\n`;
    }

    if (tot.descuentoBonificacion && tot.descuentoBonificacion.length > 0) {
      xml += `<ser:descuentoBonificacion>\n`;
      for (const db of tot.descuentoBonificacion) {
        xml += `<ser:descuento>\n`;
        xml += this.buildTag('descDescuento', db.descDescuento);
        xml += this.buildTag('montoDescuento', db.montoDescuento);
        xml += `</ser:descuento>\n`;
      }
      xml += `</ser:descuentoBonificacion>\n`;
    }

    xml += `</ser:totalesSubTotales>\n`;

    // docFiscalReferenciado
    if (doc.docFiscalReferenciado && doc.docFiscalReferenciado.length > 0) {
      xml += `<ser:docFiscalReferenciado>\n`;
      for (const ref of doc.docFiscalReferenciado) {
        xml += `<ser:item>\n`;
        xml += this.buildTag('fechaEmisionDocFiscalReferenciado', ref.fechaEmisionDocFiscalReferenciado);
        xml += this.buildTag('cufeFEReferenciada', ref.cufeFEReferenciada);
        xml += this.buildTag('nroFacturaPapel', ref.nroFacturaPapel);
        xml += this.buildTag('nroFacturaIF', ref.nroFacturaIF);
        xml += `</ser:item>\n`;
      }
      xml += `</ser:docFiscalReferenciado>\n`;
    }

    // datosFacturaExportacion
    if (doc.datosFacturaExportacion) {
      const exp = doc.datosFacturaExportacion;
      xml += `<ser:datosFacturaExportacion>\n`;
      xml += this.buildTag('condicionesEntrega', exp.condicionesEntrega);
      xml += this.buildTag('monedaOperExportacion', exp.monedaOperExportacion);
      xml += this.buildTag('puertoEmbarque', exp.puertoEmbarque);
      xml += this.buildTag('puertoDesembarque', exp.puertoDesembarque);
      xml += `</ser:datosFacturaExportacion>\n`;
    }

    // usoPosterior
    if (doc.usoPosterior) {
      xml += `<ser:usoPosterior>\n`;
      xml += this.buildTag('cufe', doc.usoPosterior.cufe);
      xml += `</ser:usoPosterior>\n`;
    }

    return xml;
  }
}
