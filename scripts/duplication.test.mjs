import assert from 'node:assert/strict';
import { test } from 'node:test';
import { duplicateTransactionDraft } from '../src/features/finance/duplication.ts';
import { initialCategories } from '../src/features/finance/categories.ts';

test('duplicação permite só campos do rascunho, mantém valor da ocorrência e preserva original', () => {
  const categories = initialCategories();
  for (const tipo of ['receita', 'despesa']) {
    for (const status of ['pago', 'pendente']) {
      for (const metadata of [
        {},
        { serie_id: 'series', ocorrencia: 2 },
        { serie_id: 'series', ocorrencia: 2, parcelas: 10 },
      ]) {
        const source = {
          id: 'original',
          user_id: 'demo-user-id',
          created_at: 'old',
          descricao: 'Teste',
          valor: 33.33,
          tipo,
          status,
          data: '2026-01-01',
          data_pagamento: status === 'pago' ? '2026-01-01' : null,
          categoria: categories[0].name,
          categoria_id: categories[0].id,
          forma_pagamento: 'Pix',
          ...metadata,
        };
        const before = structuredClone(source);
        const draft = duplicateTransactionDraft(
          source,
          categories,
          source.user_id,
          new Date(2026, 9, 24, 23, 59),
        );
        assert.deepEqual(
          Object.keys(draft).sort(),
          [
            'descricao',
            'valor',
            'tipo',
            'categoria',
            'categoria_id',
            'forma_pagamento',
            'data',
            'status',
            'data_pagamento',
          ].sort(),
        );
        assert.equal(draft.valor, 33.33);
        assert.equal(draft.tipo, tipo);
        assert.equal(draft.status, 'pendente');
        assert.equal(draft.data_pagamento, null);
        assert.equal(draft.data, '2026-10-24');
        assert.deepEqual(source, before);
        assert.equal(
          duplicateTransactionDraft(source, categories, source.user_id, new Date(2026, 9, 25, 0, 1))
            .data,
          '2026-10-25',
        );
        assert.equal(
          duplicateTransactionDraft(
            source,
            categories.map((c) => ({ ...c, archived: true })),
            source.user_id,
          ).categoria_id,
          '',
        );
        assert.throws(() => duplicateTransactionDraft(source, categories, 'other'));
        assert.throws(() =>
          duplicateTransactionDraft({ ...source, valor: NaN }, categories, source.user_id),
        );
      }
    }
  }
});
