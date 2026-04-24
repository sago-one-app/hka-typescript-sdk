export class SoapEnvelopeBuilder {
  /**
   * Generates the standard SOAP Envelope for The Factory HKA.
   */
  private static wrap(body: string): string {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ser="http://schemas.datacontract.org/2004/07/Services.Models.Token" xmlns:ser1="http://schemas.datacontract.org/2004/07/Services.Models">
   <soapenv:Header/>
   <soapenv:Body>
      ${body}
   </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Builds the SOAP Envelope for the "Enviar" method.
   */
  static buildEnviar(tokenEmpresa: string, tokenPassword: string, documentoElectronicoXml: string): string {
    const body = `<tem:Enviar>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:documento>
            ${documentoElectronicoXml}
         </tem:documento>
      </tem:Enviar>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "AnulacionDocumento" method.
   * Note: The method name in the WSDL is usually AnulacionDocumento, but the documentation shows Anulacion in some places.
   * Following the audit, it must be AnulacionDocumento.
   */
  static buildAnulacion(tokenEmpresa: string, tokenPassword: string, cufe: string, motivo: string): string {
    const body = `<tem:AnulacionDocumento>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:documento>
            <ser1:cufe>${cufe}</ser1:cufe>
            <ser1:motivo>${motivo}</ser1:motivo>
         </tem:documento>
      </tem:AnulacionDocumento>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "EstadoDocumento" method.
   */
  static buildEstadoDocumento(tokenEmpresa: string, tokenPassword: string, cufe: string): string {
    const body = `<tem:EstadoDocumento>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:cufe>${cufe}</tem:cufe>
      </tem:EstadoDocumento>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "FoliosRestantes" method.
   */
  static buildFoliosRestantes(tokenEmpresa: string, tokenPassword: string): string {
    const body = `<tem:FoliosRestantes>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
      </tem:FoliosRestantes>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "DescargaPDF" method.
   */
  static buildDescargaPDF(tokenEmpresa: string, tokenPassword: string, cufe: string): string {
    const body = `<tem:DescargaPDF>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:cufe>${cufe}</tem:cufe>
      </tem:DescargaPDF>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "DescargaXML" method.
   */
  static buildDescargaXML(tokenEmpresa: string, tokenPassword: string, cufe: string): string {
    const body = `<tem:DescargaXML>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:cufe>${cufe}</tem:cufe>
      </tem:DescargaXML>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "EnvioCorreo" method.
   */
  static buildEnvioCorreo(tokenEmpresa: string, tokenPassword: string, cufe: string, correos: string): string {
    const body = `<tem:EnvioCorreo>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:cufe>${cufe}</tem:cufe>
         <tem:correos>${correos}</tem:correos>
      </tem:EnvioCorreo>`;
    return this.wrap(body);
  }

  /**
   * Builds the SOAP Envelope for the "ConsultarRucDV" method.
   */
  static buildConsultarRucDV(tokenEmpresa: string, tokenPassword: string, ruc: string): string {
    const body = `<tem:ConsultarRucDV>
         <tem:tokenEmpresa>${tokenEmpresa}</tem:tokenEmpresa>
         <tem:tokenPassword>${tokenPassword}</tem:tokenPassword>
         <tem:RUC>${ruc}</tem:RUC>
      </tem:ConsultarRucDV>`;
    return this.wrap(body);
  }
}
