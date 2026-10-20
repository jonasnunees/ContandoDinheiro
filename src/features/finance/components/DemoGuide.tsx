interface DemoGuideProps {
  onExplore: (search: string, monthOffset?: number) => void;
}

export function DemoGuide({ onExplore }: DemoGuideProps) {
  const buttonClass = 'rounded-lg border border-emerald-700 dark:border-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';
  return <section aria-labelledby="demo-guide-title" className="rounded-2xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-slate-900 p-4 sm:p-5 space-y-3">
    <h2 id="demo-guide-title" className="text-base font-bold text-slate-900 dark:text-white">Explore a demonstração</h2>
    <p className="text-sm text-slate-700 dark:text-slate-300">Experimente receitas recorrentes, contas mensais com e sem término e compras parceladas. Os exemplos são fictícios; suas alterações ficam salvas somente neste navegador.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-2"><h3 className="text-sm font-semibold">Contas que se repetem</h3><p className="text-xs text-slate-700 dark:text-slate-300">Internet de R$ 149,90 por mês. Edite uma ocorrência ou as próximas pendências.</p><button type="button" className={buttonClass} onClick={() => onExplore('Internet residencial')}>Ver conta mensal</button></div>
      <div className="space-y-2"><h3 className="text-sm font-semibold">Compras em parcelas</h3><p className="text-xs text-slate-700 dark:text-slate-300">Notebook em 10 vezes e curso em 6. Veja parcelas pagas e as que ainda faltam.</p><button type="button" className={buttonClass} onClick={() => onExplore('Notebook para trabalho')}>Ver parcelas do notebook</button></div>
      <div className="space-y-2"><h3 className="text-sm font-semibold">Planejamento dos próximos meses</h3><p className="text-xs text-slate-700 dark:text-slate-300">Confira receitas a receber e despesas pendentes, sem alterar o saldo realizado.</p><button type="button" className={buttonClass} onClick={() => onExplore('', 1)}>Explorar próximo mês</button></div>
    </div>
    <p className="text-xs text-slate-700 dark:text-slate-300">Use os filtros, marque pagamentos, consulte os gráficos ou exporte o extrato em CSV. Em Editar, escolha como aplicar a alteração ou cancelar as próximas pendências.</p>
  </section>;
}
