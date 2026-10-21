import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueGroups, upcomingLimit, overdueDays } from '../src/features/finance/dueDates.ts';
import { isTransaction } from '../src/features/finance/validation.ts';
import { materialize, editFollowing } from '../src/features/finance/scheduling.ts';
const draft = { descricao:'Conta', valor:100, tipo:'despesa', data:'2026-10-10', status:'pendente', categoria:'Moradia', forma_pagamento:'Pix' };
const row = (data, extra={}) => ({...draft,id:data,user_id:'demo-user-id',data,...extra});
test('pendências incluem meses anteriores, excluem pagos e receitas e ordenam vencimentos',()=>{
 const groups=dueGroups([row('2026-09-30'),row('2025-12-01'),row('2026-10-21'),row('2026-10-28'),row('2026-10-29'),row('2026-10-01',{status:'pago'}),row('2026-10-02',{tipo:'receita'})],'2026-10-21');
 assert.deepEqual(groups.map(g=>g.rows.map(t=>t.data)),[['2025-12-01','2026-09-30'],['2026-10-21'],['2026-10-28']]);
 assert.equal(overdueDays('2026-09-30','2026-10-21'),21);
 assert.equal(upcomingLimit('2026-12-28'),'2027-01-04');
 assert.equal(upcomingLimit('2028-02-25'),'2028-03-03');
});
test('datas de pagamento antigas desconhecidas, inválidas e pendentes',()=>{
 assert.ok(isTransaction(row('2026-10-01',{status:'pago'})));
 assert.ok(isTransaction(row('2026-10-01',{status:'pago',data_pagamento:'2026-10-15'})));
 for(const data_pagamento of ['2026-02-30','9999-01-01','ontem']) assert.equal(isTransaction(row('2026-10-01',{status:'pago',data_pagamento})),false);
 assert.equal(isTransaction(row('2026-10-01',{data_pagamento:'2026-10-15'})),false);
});
test('parcelas futuras e edições em conjunto não herdam pagamento da primeira',()=>{
 const series={id:'s',template:{...draft,status:'pago',data_pagamento:'2026-10-15'},mode:'installments',count:3,next:0};
 const rows=materialize(series,'2026-10-21');
 assert.deepEqual(rows.map(t=>t.data_pagamento),['2026-10-15',null,null]);
 const edited=editFollowing(rows,series,rows[1],{...draft,status:'pago',data_pagamento:'2026-10-15'});
 assert.equal(edited[0].data_pagamento,'2026-10-15');
 assert.ok(edited.slice(1).every(t=>t.data_pagamento===null));
});
