import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parseAmount,
  exchangeRate,
  convert,
  quoteTimestamp,
} from '../src/features/currency/calculations.ts';
import { createQuoteService, validateReferences } from '../src/features/currency/service.ts';
const payload = () => ({
  USDBRL: { code: 'USD', codein: 'BRL', bid: '5.123456', timestamp: '1792950000' },
  EURBRL: { code: 'EUR', codein: 'BRL', bid: '6.234567', timestamp: '1792950010' },
});
test('conversões diretas, inversas, cruzadas e iguais sem referência', () => {
  const refs = validateReferences(payload());
  assert.equal(exchangeRate('USD', 'BRL', refs), 5.123456);
  assert.equal(exchangeRate('BRL', 'USD', refs), 1 / 5.123456);
  assert.equal(exchangeRate('USD', 'EUR', refs), 5.123456 / 6.234567);
  assert.equal(exchangeRate('EUR', 'USD', refs), 6.234567 / 5.123456);
  assert.equal(exchangeRate('EUR', 'EUR'), 1);
  assert.equal(exchangeRate('USD', 'BRL'), null);
  assert.equal(quoteTimestamp('USD', 'EUR', refs), 1792950000000);
  assert.equal(convert(2, 5.123456), 10.246912);
  assert.equal(convert(0, 5), 0);
  assert.equal(convert(Number.MAX_VALUE, 5), null);
  assert.equal(convert(-1, 5), null);
});
test('entrada brasileira sem valores enganosos', () => {
  for (const [input, value] of [
    ['1', 1],
    ['0', 0],
    ['1,25', 1.25],
    ['1.234,56', 1234.56],
    [' 12,34 ', 12.34],
  ])
    assert.equal(parseAmount(input), value);
  for (const input of [
    '',
    ' ',
    '-1',
    'NaN',
    'Infinity',
    '1e3',
    '1.23',
    '1,2,3',
    '12.34,56',
    '9'.repeat(400),
  ])
    assert.equal(parseAmount(input), null);
});
test('validação estrita das referências', () => {
  for (const value of [null, {}, [], { USDBRL: {} }])
    assert.throws(() => validateReferences(value));
  for (const patch of [
    { bid: '0' },
    { bid: '-1' },
    { bid: 'Infinity' },
    { bid: 'x' },
    { bid: 5 },
    { timestamp: 'x' },
    { timestamp: '0' },
    { timestamp: '99999999999999999999' },
    { code: 'EUR' },
    { codein: 'USD' },
  ]) {
    const data = payload();
    Object.assign(data.USDBRL, patch);
    assert.throws(() => validateReferences(data));
  }
});
test('cache 60s e requisições concorrentes compartilhadas', async () => {
  let now = 0,
    calls = 0;
  const service = createQuoteService(
    async (_url, options) => {
      calls++;
      assert.equal(options.cache, 'no-store');
      return new Response(JSON.stringify(payload()));
    },
    () => now,
  );
  const [a, b] = await Promise.all([service(), service()]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  now = 59999;
  assert.equal(await service(), a);
  assert.equal(calls, 1);
  now = 60000;
  await service();
  assert.equal(calls, 2);
});
test('falhas HTTP, limite, rede e resposta inválida não entram no cache', async () => {
  for (const [fetcher, message] of [
    [async () => new Response('', { status: 429 }), /Limite/],
    [async () => new Response('', { status: 503 }), /indisponível/],
    [
      async () => {
        throw new TypeError('offline');
      },
      /conexão/,
    ],
    [async () => new Response('{}'), /inválida/],
    [async () => new Response('not-json'), /inválida/],
  ]) {
    let calls = 0;
    const service = createQuoteService((...args) => {
      calls++;
      return fetcher(...args);
    });
    await assert.rejects(service(), message);
    await assert.rejects(service(), message);
    assert.equal(calls, 2);
  }
});
test('timeout aborta e libera nova tentativa', async () => {
  const service = createQuoteService(
    (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
      ),
    Date.now,
    5,
  );
  await assert.rejects(service(), /demorou/);
  await assert.rejects(service(), /demorou/);
});
