import type { ReferenceCurrency } from './catalog.ts';
export type { Currency } from './catalog.ts';
export type References = Partial<Record<ReferenceCurrency, { bid: number; timestamp: number }>>;
export interface Observation {
  date: string;
  bid: number;
  timestamp: number;
}
export interface History {
  points: Observation[];
  invalid: number;
  fetchedAt: number;
}
export interface Interval {
  start: string;
  end: string;
}
