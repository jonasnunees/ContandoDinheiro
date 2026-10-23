import { ArrowRight, CalendarDays, CreditCard, Info, Repeat2, ShieldCheck } from 'lucide-react';

interface DemoGuideProps {
  onExplore: (search: string, monthOffset?: number) => void;
}

const examples = [
  {
    icon: Repeat2,
    title: 'Contas que se repetem',
    description: 'Internet de R$ 149,90 por mês. Edite uma ocorrência ou as próximas pendências.',
    action: 'Ver conta mensal',
    search: 'Internet residencial',
  },
  {
    icon: CreditCard,
    title: 'Compras em parcelas',
    description: 'Notebook em 10 vezes e curso em 6. Veja parcelas pagas e as que ainda faltam.',
    action: 'Ver parcelas do notebook',
    search: 'Notebook para trabalho',
  },
  {
    icon: CalendarDays,
    title: 'Planejamento dos próximos meses',
    description: 'Confira receitas a receber e despesas pendentes, sem alterar o saldo realizado.',
    action: 'Explorar próximo mês',
    search: '',
    monthOffset: 1,
  },
];

export function DemoGuide({ onExplore }: DemoGuideProps) {
  return (
    <section
      aria-labelledby="demo-guide-title"
      className="overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="max-w-2xl space-y-2">
          <h2
            id="demo-guide-title"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Explore a demonstração
          </h2>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Experimente receitas recorrentes, contas mensais com e sem término e compras parceladas.
            Escolha um exemplo para começar.
          </p>
        </div>
        <div className="flex max-w-sm items-start gap-2.5 rounded-xl border border-emerald-200 bg-white/70 p-3 text-xs leading-relaxed text-slate-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-slate-300">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
          />
          <p>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Explore com dados fictícios.
            </span>{' '}
            Suas alterações ficam salvas somente neste navegador.
          </p>
        </div>
      </div>

      <div className="grid gap-3 px-5 pb-5 sm:px-6 sm:pb-6 md:grid-cols-3 lg:gap-4">
        {examples.map(({ icon: Icon, title, description, action, search, monthOffset }) => (
          <div
            key={title}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 sm:p-5"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {description}
            </p>
            <button
              type="button"
              className="mt-auto flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-emerald-700 px-3 py-2 text-left text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
              onClick={() => onExplore(search, monthOffset)}
            >
              {action}
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 border-t border-emerald-200 bg-white/40 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30 sm:px-6">
        <Info
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400"
        />
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Explore também:</span>{' '}
          use os filtros, marque pagamentos, consulte os gráficos ou exporte o extrato em CSV. Em
          Editar, escolha como aplicar a alteração ou cancelar as próximas pendências.
        </p>
      </div>
    </section>
  );
}
