export class RetryHandler {
  /**
   * Ejecuta una promesa con reintentos automáticos.
   * Útil para peticiones HTTP SOAP que pueden fallar por problemas de red intermitentes.
   * 
   * @param operation Función que retorna una Promesa
   * @param maxRetries Número máximo de reintentos
   * @param delayMs Tiempo de espera inicial entre reintentos en milisegundos
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        // Exponential backoff
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Unreachable');
  }
}
