import { ClientValidator } from '../validators/client.validator';
import { Cliente } from '../types/client.types';

describe('Validators', () => {
  describe('ClientValidator', () => {
    it('throws if Juridico is not Contribuyente', () => {
      const cliente: Cliente = {
        tipoClienteFE: '02', // Consumidor Final
        tipoContribuyente: '2', // Jurídico
        pais: 'PA'
      };

      expect(() => ClientValidator.validate(cliente, '1')).toThrow(/Cliente jurídico.*debe ser tipoClienteFE="01"/);
    });

    it('throws if Extranjero has forbidden fields', () => {
      const cliente: Cliente = {
        tipoClienteFE: '04', // Extranjero
        numeroRUC: '123',
        tipoIdentificacion: '01',
        nroIdentificacionExtranjero: 'X123',
        pais: 'US'
      };

      expect(() => ClientValidator.validate(cliente, '2')).toThrow(/Cliente Extranjero.*no debe incluir.*numeroRUC/);
    });

    it('passes a valid Contribuyente', () => {
      const cliente: Cliente = {
        tipoClienteFE: '01', // Contribuyente
        tipoContribuyente: '2', // Jurídico
        numeroRUC: '1555',
        digitoVerificadorRUC: '99',
        razonSocial: 'Empresa SA',
        direccion: 'Calle 50',
        pais: 'PA'
      };

      expect(() => ClientValidator.validate(cliente, '1')).not.toThrow();
    });
  });
});
