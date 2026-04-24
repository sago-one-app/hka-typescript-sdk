export class SoapParser {
  /**
   * Extrae el contenido de un tag XML. Intenta ignorar los namespaces para ser flexible.
   * Ej: <b:codigo>200</b:codigo> o <codigo>200</codigo>
   * @param xml String con la respuesta SOAP
   * @param tagName Nombre del tag a buscar (ej. "codigo")
   */
  static extractTag(xml: string, tagName: string): string | undefined {
    // Busca <(namespace:)?tagName>content</(namespace:)?tagName>
    // Usa non-greedy .*? para el contenido y soporta namespaces como [a-zA-Z0-9_-]+:
    const regex = new RegExp(`<([^>]*:)?${tagName}[^>]*>(.*?)<\\/([^>]*:)?${tagName}>`, 's');
    const match = regex.exec(xml);
    if (match && match[2] !== undefined) {
      // Decode basic entities just in case
      return this.decodeXml(match[2].trim());
    }
    return undefined;
  }

  /**
   * Extrae un arreglo de objetos que comparten una estructura repetitiva.
   * Ej: <a:evento><a:fecha>...</a:fecha><a:mensaje>...</a:mensaje></a:evento>
   */
  static extractList(xml: string, listTagName: string, itemTagName: string, fields: string[]): Array<Record<string, string>> {
    const listMatch = new RegExp(`<([^>]*:)?${listTagName}[^>]*>(.*?)<\\/([^>]*:)?${listTagName}>`, 's').exec(xml);
    if (!listMatch) return [];

    const listContent = listMatch[2];
    const itemRegex = new RegExp(`<([^>]*:)?${itemTagName}[^>]*>(.*?)<\\/([^>]*:)?${itemTagName}>`, 'gs');
    const results: Array<Record<string, string>> = [];

    let match;
    while ((match = itemRegex.exec(listContent)) !== null) {
      const itemContent = match[2];
      const itemObj: Record<string, string> = {};
      for (const field of fields) {
        const val = this.extractTag(itemContent, field);
        if (val !== undefined) {
          itemObj[field] = val;
        }
      }
      results.push(itemObj);
    }

    return results;
  }

  private static decodeXml(xml: string): string {
    return xml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
}
