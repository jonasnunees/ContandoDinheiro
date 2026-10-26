import type { Currency, References } from './types.ts';
export const currencies: { code: Currency; name: string }[] = [
  { code: 'BRL', name: 'Real brasileiro' },
  { code: 'USD', name: 'Dólar americano' },
  { code: 'EUR', name: 'Euro' },
];
export function parseAmount(input: string): number | null {
  const value = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value)) return null;
  const number = Number(value.replaceAll('.', '').replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function exchangeRate(from: Currency, to: Currency, refs?: References): number | null {
  if (from === to) return 1;
  if (!refs) return null;
  const rate = (from === 'BRL' ? 1 : refs[from].bid) / (to === 'BRL' ? 1 : refs[to].bid);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}
export function convert(amount: number, rate: number): number | null {
  const result = amount * rate;
  return amount >= 0 && rate > 0 && Number.isFinite(result) ? result : null;
}
export function quoteTimestamp(from: Currency, to: Currency, refs: References): number {
  return Math.min(
    ...[from, to]
      .filter((code) => code !== 'BRL')
      .map((code) => refs[code as 'USD' | 'EUR'].timestamp),
  );
}
export function formatMoney(value: number, currency: Currency, rate = false): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    ...(rate
      ? { minimumSignificantDigits: 6, maximumSignificantDigits: 8 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }).format(value);
}
