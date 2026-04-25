import { DatosDocumento } from '../types/datos-documento.types';

const NS_COMPROBANTE = 'http://schemas.datacontract.org/2004/07/Services.ObjComprobante.v1_0';
const NS_MODEL       = 'http://schemas.datacontract.org/2004/07/Services.Model';
const NS_API_REST    = 'http://schemas.datacontract.org/2004/07/Services.ApiRest';

export class SoapEnvelopeBuilder {
  private static wrap(body: string, serNamespace?: string): string {
    const serNs = serNamespace ? ` xmlns:ser="${serNamespace}"` : '';
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/"${serNs}>
   <soapenv:Header/>
   <soapenv:Body>
      ${body}
   </soapenv:Body>
</soapenv:Envelope>`;
  }

  private static buildDatosDocumento(datos: DatosDocumento): string {
    let xml = `<tem:datosDocumento>\n`;
    xml += `         <ser:codigoSucursalEmisor>${datos.codigoSucursalEmisor}</ser:codigoSucursalEmisor>\n`;
    xml += `         <ser:numeroDocumentoFiscal>${datos.numeroDocumentoFiscal}</ser:numeroDocumentoFiscal>\n`;
    xml += `         <ser:puntoFacturacionFiscal>${datos.puntoFacturacionFiscal}</ser:puntoFacturacionFiscal>\n`;
    if (datos.serialDispositivo) {
      xml += `         <ser:serialDispositivo>${datos.serialDispositivo}</ser:serialDispositivo>\n`;
    }
    xml += `         <ser:tipoDocumento>${datos.tipoDocumento}</ser:tipoDocumento>\n`;
    xml += `         <ser:tipoEmision>${datos.tipoEmision}</ser:tipoEmision>\n`;
    xml += `      </tem:datosDocumento>`;
    return xml;
  }

  static buildEnviar(tokenEmpresa: string, tokenPassword: string, documentoElectronicoXml: string): string {
    const body = `<tem:Enviar>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:documento>
            ${documentoElectronicoXml}
         </tem:documento>
      </tem:Enviar>`;
    return this.wrap(body, NS_COMPROBANTE);
  }

  static buildEstadoDocumento(tokenEmpresa: string, tokenPassword: string, datos: DatosDocumento): string {
    const body = `<tem:EstadoDocumento>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         ${this.buildDatosDocumento(datos)}
      </tem:EstadoDocumento>`;
    return this.wrap(body, NS_MODEL);
  }

  static buildAnulacion(tokenEmpresa: string, tokenPassword: string, datos: DatosDocumento, motivo: string): string {
    const body = `<tem:AnulacionDocumento>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:motivoAnulacion>${motivo}</tem:motivoAnulacion>
         ${this.buildDatosDocumento(datos)}
      </tem:AnulacionDocumento>`;
    return this.wrap(body, NS_MODEL);
  }

  static buildDescargaXML(tokenEmpresa: string, tokenPassword: string, datos: DatosDocumento): string {
    const body = `<tem:DescargaXML>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         ${this.buildDatosDocumento(datos)}
      </tem:DescargaXML>`;
    return this.wrap(body, NS_MODEL);
  }

  static buildDescargaPDF(tokenEmpresa: string, tokenPassword: string, datos: DatosDocumento): string {
    const body = `<tem:DescargaPDF>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         ${this.buildDatosDocumento(datos)}
      </tem:DescargaPDF>`;
    return this.wrap(body, NS_MODEL);
  }

  static buildFoliosRestantes(tokenEmpresa: string, tokenPassword: string): string {
    const body = `<tem:FoliosRestantes>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
      </tem:FoliosRestantes>`;
    return this.wrap(body);
  }

  static buildEnvioCorreo(tokenEmpresa: string, tokenPassword: string, datos: DatosDocumento, correo: string): string {
    const body = `<tem:EnvioCorreo>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         ${this.buildDatosDocumento(datos)}
         <tem:correo>${correo}</tem:correo>
      </tem:EnvioCorreo>`;
    return this.wrap(body, NS_MODEL);
  }

  static buildRastreoCorreo(tokenEmpresa: string, tokenPassword: string, cufe: string): string {
    const body = `<tem:RastreoCorreo>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:cufe>${cufe}</tem:cufe>
      </tem:RastreoCorreo>`;
    return this.wrap(body);
  }

  static buildConsultarRucDV(tokenEmpresa: string, tokenPassword: string, ruc: string, tipoRuc: string = '2'): string {
    const body = `<tem:ConsultarRucDV>
         <tem:consultarRucDVRequest>
            <ser:tokenEmpresa>${tokenEmpresa}</ser:tokenEmpresa>
            <ser:tokenPassword>${tokenPassword}</ser:tokenPassword>
            <ser:tipoRuc>${tipoRuc}</ser:tipoRuc>
            <ser:ruc>${ruc}</ser:ruc>
         </tem:consultarRucDVRequest>
      </tem:ConsultarRucDV>`;
    return this.wrap(body, NS_API_REST);
  }
}
