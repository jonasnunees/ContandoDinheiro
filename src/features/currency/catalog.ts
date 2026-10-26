export const currencies = [
  { code: 'BRL', name: 'Real brasileiro', reference: null },
  { code: 'USD', name: 'Dólar americano', reference: 'USD-BRL' },
  { code: 'EUR', name: 'Euro', reference: 'EUR-BRL' },
  { code: 'GBP', name: 'Libra esterlina', reference: 'GBP-BRL' },
  { code: 'CAD', name: 'Dólar canadense', reference: 'CAD-BRL' },
  { code: 'AUD', name: 'Dólar australiano', reference: 'AUD-BRL' },
  { code: 'CHF', name: 'Franco suíço', reference: 'CHF-BRL' },
  { code: 'JPY', name: 'Iene japonês', reference: 'JPY-BRL' },
  { code: 'ARS', name: 'Peso argentino', reference: 'ARS-BRL' },
  { code: 'CLP', name: 'Peso chileno', reference: 'CLP-BRL' },
  { code: 'MXN', name: 'Peso mexicano', reference: 'MXN-BRL' },
  { code: 'CNY', name: 'Yuan chinês', reference: 'CNY-BRL' },
] as const;
export type Currency = (typeof currencies)[number]['code'];
export type ReferenceCurrency = Exclude<Currency, 'BRL'>;
export function isCurrency(value: string): value is Currency {
  return currencies.some(({ code }) => code === value);
}
export function requiredReferences(from: Currency, to: Currency): ReferenceCurrency[] {
  return from === to
    ? []
    : [...new Set([from, to].filter((c): c is ReferenceCurrency => c !== 'BRL'))].sort();
}
