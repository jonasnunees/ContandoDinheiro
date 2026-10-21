import { useState } from 'react';
import type { Transaction } from '../types';
import { dueGroups, overdueDays } from '../dueDates';
import { localDate } from '../validation';
const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function DueDates({ transactions, onPay }: { transactions: Transaction[]; onPay: (tx: Transaction) => void }) {
  const [expanded, setExpanded] = useState(false);
  const today = localDate();
  const groups = dueGroups(transactions, today);
  return <section aria-labelledby="due-title" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4">
    <h2 id="due-title" className="font-bold">Pendências e próximos vencimentos</h2>
    <p className="text-sm text-slate-600 dark:text-slate-400">Referência: hoje, {today.split('-').reverse().join('/')}. Inclui meses anteriores, independentemente do período selecionado.</p>
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((group, index) => <div key={group.title} className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <h3 className={`font-semibold ${index === 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>{group.title} ({group.rows.length})</h3>
        <p className="font-bold my-2">{currency(group.rows.reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0) / 100)}</p>
        {!group.rows.length && <p className="text-sm text-slate-600 dark:text-slate-400">Nenhuma conta neste grupo.</p>}
        <ul className="space-y-3">{(expanded ? group.rows : group.rows.slice(0, 3)).map(tx => <li key={tx.id} className="border-t border-slate-200 dark:border-slate-700 pt-3 text-sm">
          <p className="font-semibold break-words">{tx.descricao}</p>
          <p>{currency(tx.valor)} · {tx.data.split('-').reverse().join('/')}</p>
          <p className="text-slate-600 dark:text-slate-400">{index === 0 ? `Atrasada há ${overdueDays(tx.data, today)} dia(s)` : index === 1 ? 'Vence hoje' : `Vence em ${overdueDays(today, tx.data)} dia(s)`}</p>
          <button type="button" onClick={() => onPay(tx)} aria-label={`Registrar pagamento de ${tx.descricao}`} className="mt-2 rounded-lg px-3 py-2 bg-emerald-700 text-white font-semibold">Registrar pagamento</button>
        </li>)}</ul>
      </div>)}
    </div>
    {groups.some(g => g.rows.length > 3) && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="text-sm underline">{expanded ? 'Mostrar menos' : 'Ver todas as pendências'}</button>}
  </section>;
}
