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

import { currencies, isCurrency } from '../src/features/currency/catalog.ts';
import { formatMoney } from '../src/features/currency/calculations.ts';
import {
  historyInterval,
  normalizeHistory,
  crossHistory,
  dateKey,
} from '../src/features/currency/history.ts';
import { createHistoryService } from '../src/features/currency/historyService.ts';
const interval = { start: '2024-02-01', end: '2024-03-01' };
const row = (date, bid = '5') => ({
  bid,
  timestamp: String(Date.parse(`${date}T20:00:00Z`) / 1000),
});
test('catálogo fiduciário, referências e precisão própria da moeda', () => {
  assert.equal(currencies.length, 12);
  assert.equal(isCurrency('BTC'), false);
  assert.equal(isCurrency('BRLT'), false);
  for (const c of currencies) {
    assert.ok(isCurrency(c.code));
    if (c.reference) {
      const refs = validateReferences(
        { [`${c.code}BRL`]: { code: c.code, codein: 'BRL', ...row('2024-02-20') } },
        [c.code],
      );
      assert.equal(exchangeRate(c.code, 'BRL', refs), 5);
    }
  }
  assert.match(formatMoney(12.5, 'JPY'), /13/);
  assert.match(formatMoney(12.5, 'CLP'), /13/);
  assert.match(formatMoney(5, 'BRL', true), /5,00$/);
  assert.match(formatMoney(5.126, 'BRL', true), /5,13$/);
  assert.equal(exchangeRate('JPY', 'BRL', {}), null);
});
test('meses de calendário, finais de mês e bissextos', () => {
  assert.deepEqual(historyInterval(1, Date.parse('2024-03-31T15:00Z')), {
    start: '2024-02-29',
    end: '2024-03-31',
  });
  assert.equal(historyInterval(1, Date.parse('2023-03-31T15:00Z')).start, '2023-02-28');
  assert.equal(historyInterval(3, Date.parse('2024-05-31T15:00Z')).start, '2024-02-29');
  assert.equal(historyInterval(6, Date.parse('2024-08-31T15:00Z')).start, '2024-02-29');
  assert.equal(dateKey(Date.parse('2024-03-01T01:00Z')), '2024-02-29');
});
test('histórico ordenado, datas duplicadas, lacunas, metadados e registros inválidos', () => {
  const normalized = normalizeHistory(
    [
      row('2024-02-20'),
      row('2024-02-10', '6'),
      row('2024-02-20', '4'),
      row('2024-03-01'),
      { bid: '0', timestamp: '1708459200' },
      { bid: '2', timestamp: '1708459200000' },
      null,
    ],
    'USD',
    interval,
  );
  assert.deepEqual(
    normalized.points.map((p) => [p.date, p.bid]),
    [
      ['2024-02-10', 6],
      ['2024-02-20', 4],
    ],
  );
  assert.equal(normalized.invalid, 3);
  assert.throws(() => normalizeHistory({}, 'USD', interval), /inválida/);
  assert.throws(
    () => normalizeHistory([{ ...row('2024-02-20'), code: 'EUR' }], 'USD', interval),
    /divergente/,
  );
  const reversed = normalizeHistory([row('2024-02-20', '4'), row('2024-02-20')], 'USD', interval);
  assert.equal(reversed.points[0].bid, 4);
});
test('taxas históricas cruzam apenas datas comuns, sem arredondar ou preencher', () => {
  const USD = normalizeHistory([row('2024-02-10', '5'), row('2024-02-20', '6')], 'USD', interval);
  const EUR = normalizeHistory([row('2024-02-20', '7'), row('2024-02-25', '8')], 'EUR', interval);
  const refs = { USD, EUR };
  assert.deepEqual(
    crossHistory('USD', 'EUR', refs).map((p) => [p.date, p.bid]),
    [['2024-02-20', 6 / 7]],
  );
  assert.equal(crossHistory('EUR', 'USD', refs)[0].bid, 7 / 6);
  assert.equal(crossHistory('BRL', 'USD', refs)[0].bid, 1 / 5);
  assert.equal(crossHistory('USD', 'BRL', refs).length, 2);
  assert.deepEqual(crossHistory('USD', 'USD', refs), []);
});
test('histórico compartilha concorrência, reutiliza intervalos, expira em 1h', async () => {
  let now = 0,
    calls = 0;
  const service = createHistoryService(
    async (url, options) => {
      calls++;
      assert.match(url, /daily\/USD-BRL\/360\?start_date=20240201&end_date=20240301/);
      assert.equal(options.cache, 'no-store');
      return new Response(JSON.stringify([row('2024-02-10'), row('2024-02-20')]));
    },
    () => now,
  );
  const [a, b] = await Promise.all([service('USD', interval), service('USD', interval)]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  assert.equal((await service('USD', { start: '2024-02-15', end: '2024-03-01' })).points.length, 1);
  now = 3599999;
  await service('USD', interval);
  assert.equal(calls, 1);
  now++;
  await service('USD', interval);
  assert.equal(calls, 2);
});
test('falhas de histórico liberam tentativa posterior e não afetam outros códigos', async () => {
  let calls = 0;
  const service = createHistoryService(async () =>
    ++calls === 1
      ? new Response('{}', { status: 429 })
      : new Response(JSON.stringify([row('2024-02-20')])),
  );
  await assert.rejects(service('USD', interval), /Limite/);
  assert.equal((await service('USD', interval)).points.length, 1);
  assert.equal((await service('EUR', interval)).points.length, 1);
});
test('histórico respeita timeout e cache limitado', async () => {
  const timeout = createHistoryService(
    (_url, { signal }) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener('abort', () => reject(new Error('abort'))),
      ),
    Date.now,
    5,
  );
  await assert.rejects(timeout('USD', interval), /demorou/);
  let calls = 0;
  const service = createHistoryService(async () => {
    calls++;
    return new Response('[]');
  });
  const windows = Array.from({ length: 33 }, (_, i) => {
    const start = new Date(Date.UTC(2024, 0, i * 2 + 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(2024, 0, i * 2 + 2)).toISOString().slice(0, 10);
    return { start, end };
  });
  for (const window of windows) await service('USD', window);
  assert.equal(calls, 33);
  await service('USD', windows[0]);
  assert.equal(calls, 34);
});
