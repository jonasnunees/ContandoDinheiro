import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMoney, localDate, isTransaction } from '../src/services/validation.ts';
import { readStorage, writeStorage } from '../src/services/storage.ts';

test('valores brasileiros e decimais são convertidos sem truncamento', () => {
  for (const [input, expected] of [['1.234,56', 1234.56], ['1234,56', 1234.56], ['1234.56', 1234.56], ['1.234', 1234], ['0,01', .01], ['9999999999,99', 9999999999.99]]) {
    assert.equal(parseMoney(input), expected);
  }
  for (const input of ['123abc', 'Infinity', 'NaN', '-1', '0', '', '1,234', '12.34,56', '1e3', '10000000000']) assert.throws(() => parseMoney(input));
});

test('data local mantém dia e mês do navegador', () => {
  assert.equal(localDate(new Date(2026, 9, 5, 23, 30)), '2026-10-05');
});

test('registros inválidos e datas inexistentes são rejeitados', () => {
  const valid = { id: '1', user_id: 'demo-user-id', descricao: 'Teste', valor: 10.5, tipo: 'despesa', data: '2026-10-05', forma_pagamento: 'Pix', status: 'pago', categoria: 'Outros' };
  assert.equal(isTransaction(valid), true);
  for (const invalid of [null, [], {}, { ...valid, valor: Infinity }, { ...valid, valor: '10' }, { ...valid, data: '2026-02-30' }, { ...valid, descricao: ' ' }, { ...valid, status: 'invalido' }]) assert.equal(isTransaction(invalid), false);
});

test('armazenamento bloqueado não derruba leitura e informa falha de gravação', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Quota'); } };
  try { assert.equal(readStorage('test'), null); assert.throws(() => writeStorage('test', 'value'), /Não foi possível salvar/); }
  finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
