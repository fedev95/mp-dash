import { AUTO_CATEGORY_NAMES, categorizeTransaction } from './transaction-category';

describe('categorizeTransaction', () => {
  it('buckets known prefixes, ignoring case and surrounding spaces', () => {
    expect(categorizeTransaction('Transferencia enviada Ana Garcia')).toBe(
      'Transferencias enviadas',
    );
    expect(categorizeTransaction('TRANSFERENCIA RECIBIDA Juan')).toBe('Transferencias recibidas');
    expect(categorizeTransaction(' Rendimientos ')).toBe('Rendimientos');
    expect(categorizeTransaction('Pago en Kiosco')).toBe('Pagos');
    expect(categorizeTransaction('Cobro con QR')).toBe('Cobros');
  });

  it('falls back to "Otros"', () => {
    expect(categorizeTransaction('Devolución')).toBe('Otros');
  });

  it('lists every category it can produce', () => {
    expect(AUTO_CATEGORY_NAMES).toEqual([
      'Transferencias enviadas',
      'Transferencias recibidas',
      'Rendimientos',
      'Pagos',
      'Cobros',
      'Otros',
    ]);
  });
});
