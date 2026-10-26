export type Currency = 'BRL' | 'USD' | 'EUR';
export interface References {
  USD: { bid: number; timestamp: number };
  EUR: { bid: number; timestamp: number };
}
