import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, CheckCheck, ChevronDown, ChevronUp, Clock3, TriangleAlert } from 'lucide-react';
import type { Transaction } from '../types';
import { dueGroups, overdueDays } from '../dueDates';
import { localDate } from '../validation';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const styles = [
  { icon: TriangleAlert, color: 'text-rose-700 dark:text-rose-400', background: 'bg-rose-500/10', empty: 'Nenhuma conta atrasada' },
  { icon: Clock3, color: 'text-amber-800 dark:text-amber-400', background: 'bg-amber-500/10', empty: 'Nenhuma conta vence hoje' },
  { icon: CalendarDays, color: 'text-blue-700 dark:text-blue-400', background: 'bg-blue-500/10', empty: 'Nenhuma conta nos próximos 7 dias' },
];

export function DueDates({ transactions, onPay }: { transactions: Transaction[]; onPay: (tx: Transaction) => void }) {
  const [expanded, setExpanded] = useState(false);
  const today = localDate();
  const groups = dueGroups(transactions, today);
  const hasPending = groups.some(group => group.rows.length > 0);

  return <section aria-labelledby="due-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-400"><CalendarDays aria-hidden="true" className="h-5 w-5" /></span>
          <div>
            <h2 id="due-title" className="font-bold tracking-tight">Pendências e próximos vencimentos</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Suas contas organizadas por vencimento</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">Hoje, {today.split('-').reverse().join('/')}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {groups.map((group, index) => {
          const { icon: Icon, color, background, empty } = styles[index];
          return <div key={group.title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Icon aria-hidden="true" className={`h-4 w-4 ${color}`} />
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">{group.title}</h3>
              <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${background} ${color}`} aria-label={`${group.rows.length} contas`}>{group.rows.length}</span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">{currency(group.rows.reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0) / 100)}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">{!group.rows.length && <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}{group.rows.length ? `${group.rows.length} ${group.rows.length === 1 ? 'conta a pagar' : 'contas a pagar'}` : empty}</p>
          </div>;
        })}
      </div>
    </div>
    {hasPending ? <div className="border-t border-slate-200 dark:border-slate-800">
      {groups.map((group, index) => group.rows.length > 0 && <div key={group.title} className="px-4 py-4 sm:px-6">
        <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${styles[index].color}`}>{group.title}</h3>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">{(expanded ? group.rows : group.rows.slice(0, 3)).map(tx => {
          const days = index === 0 ? overdueDays(tx.data, today) : overdueDays(today, tx.data);
          return <li key={tx.id} className="flex flex-wrap items-center gap-3 py-3 sm:gap-4">
            <div aria-hidden="true" className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <span className="text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-400">{new Date(`${tx.data}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
              <span className="text-lg font-bold leading-5 text-slate-700 dark:text-slate-200">{tx.data.slice(8)}</span>
            </div>
            <div className="min-w-0 flex-1 basis-36">
              <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{tx.descricao}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><time dateTime={tx.data}>{tx.data.split('-').reverse().join('/')}</time><span aria-hidden="true"> · </span><span className={index < 2 ? styles[index].color : ''}>{index === 0 ? `Atrasada há ${days} ${days === 1 ? 'dia' : 'dias'}` : index === 1 ? 'Vence hoje' : days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`}</span></p>
            </div>
            <p className="ml-auto text-sm font-bold text-slate-900 tabular-nums dark:text-white">{currency(tx.valor)}</p>
            <button type="button" onClick={() => onPay(tx)} aria-label={`Registrar pagamento de ${tx.descricao}`} className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800">Registrar pagamento<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></button>
          </li>;
        })}</ul>
      </div>)}
      {groups.some(g => g.rows.length > 3) && <div className="px-4 pb-4 sm:px-6"><button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">{expanded ? 'Mostrar menos' : 'Ver todas as pendências'}{expanded ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}</button></div>}
    </div> : <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 sm:mx-6"><CheckCheck aria-hidden="true" className="h-5 w-5 shrink-0" /><p className="text-sm">Tudo em dia! Nenhuma conta pendente até os próximos 7 dias.</p></div>}
    <p className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-6">Inclui contas de meses anteriores, independentemente do período selecionado no painel.</p>
  </section>;
}

