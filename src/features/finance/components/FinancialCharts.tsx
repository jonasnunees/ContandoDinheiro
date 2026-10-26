import { formatCurrency } from '../formatCurrency';
import { useCategories } from '../CategoryContext';
import {
  CATEGORY_PALETTE,
  PAYMENT_PALETTE,
  createCategoryChartConfig,
  createGroupedMonthlyChartConfig,
  createSingleCategoryChartConfig,
  createPaymentChartConfig,
  createMonthlyCashflowChartConfig,
} from './financialChartConfig';
import {
  composePaymentChart,
  PAYMENT_VIEWS,
  PaymentView,
  compareTransactionMonths,
  ComparisonRange,
  groupTransactionValues,
  summarizeTransactions,
} from '../calculations';
import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { PAYMENT_METHODS, Transaction, TransactionPeriod, FilterState } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  Title,
  DoughnutController,
  BarController,
} from 'chart.js';
import type { ChartType, TooltipModel } from 'chart.js';
import { PieChart, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

// Habilita os tipos de gráfico, eixos e recursos que a biblioteca usará.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  Title,
  DoughnutController,
  BarController,
);

interface ChartTooltip {
  heading: string;
  title: string;
  rows: { label: string; value: number; color: string }[];
  left: number;
  top: number;
  width: number;
}

interface FinancialChartsProps {
  comparisonRange: ComparisonRange;
  onComparisonRangeChange: (range: ComparisonRange) => void;
  transactions: Transaction[];
  comparisonTransactions: Transaction[];
  period: TransactionPeriod;
  filters: FilterState;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  comparisonRange,
  onComparisonRangeChange,
  comparisonTransactions,
  period,
  filters,
}) => {
  const { categories } = useCategories();
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState<ChartTooltip | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [legendMonthLabel, setLegendMonthLabel] = useState<string | null>(null);
  const [hiddenGroups, setHiddenGroups] = useState<Record<string, boolean>>({});
  const [comparisonMode, setComparisonMode] = useState('totals');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alimentação');
  const [paymentView, setPaymentView] = useState<PaymentView>('paidExpenses');
  const [selectedPayment, setSelectedPayment] = useState<string>('Pix');
  const isPayment = comparisonMode === 'payment' || comparisonMode === 'payments';
  const isGrouped = comparisonMode === 'all' || comparisonMode === 'payments';
  const selectedGroup = isPayment ? selectedPayment : selectedCategory;
  const groupOptions = isPayment ? PAYMENT_METHODS : categoryNames;
  const [rangeIndex, setRangeIndex] = useState(0);
  const groupSize = comparisonRange === 'quarter' ? 3 : 6;
  const isExtended = comparisonRange !== 'selected';
  const isLight = theme === 'light';

  // As referências apontam para as áreas de desenho; as instâncias guardam os gráficos criados.
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paymentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cashflowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const categoryChartInstance = useRef<ChartJS<'doughnut'> | null>(null);
  const paymentChartInstance = useRef<ChartJS<'bar', number[]> | null>(null);
  const cashflowChartInstance = useRef<ChartJS<'line', number[]> | null>(null);

  // Todos os gráficos compartilham o mesmo cartão de detalhes e limites da tela.
  const showChartTooltip = useCallback(
    <T extends ChartType>({
      chart,
      tooltip: model,
    }: {
      chart: ChartJS;
      tooltip: TooltipModel<T>;
    }) => {
      if (!model.opacity) {
        if (!tooltipRef.current?.matches(':hover')) setTooltip(null);
        return;
      }
      const chartType = 'type' in chart.config ? chart.config.type : undefined;
      const rect = chart.canvas.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 32);
      const rows = model.dataPoints.map((point, index) => ({
        label:
          chartType === 'line'
            ? (chart.data.datasets[point.datasetIndex]?.label ?? '')
            : point.label,
        value: point.raw as number,
        color: String(model.labelColors[index]?.backgroundColor ?? '#94a3b8'),
      }));
      const height = Math.min(360, window.innerHeight - 32, 80 + rows.length * 36);
      const x = rect.left + model.caretX;
      const y = rect.top + model.caretY;
      setTooltip({
        heading:
          chartType === 'line'
            ? 'Resumo do mês'
            : chartType === 'doughnut'
              ? 'Despesas por categoria'
              : (chart.data.datasets[0]?.label ?? 'Forma de pagamento'),
        title: model.title.join(' '),
        rows,
        width,
        left: Math.max(16, Math.min(window.innerWidth - width - 16, x - width / 2)),
        top: Math.max(
          16,
          Math.min(
            window.innerHeight - height - 16,
            y - height - 16 > 16 ? y - height - 16 : y + 16,
          ),
        ),
      });
    },
    [],
  );

  // Categorias e comparação usam despesas pagas; a seleção das barras é local.
  const expenses = useMemo(
    () => transactions.filter((t) => t.tipo === 'despesa' && t.status === 'pago'),
    [transactions],
  );

  const categoryTotals = useMemo(() => groupTransactionValues(expenses, 'categoria'), [expenses]);
  const paymentComposition = useMemo(
    () => composePaymentChart(transactions, paymentView),
    [transactions, paymentView],
  );
  const paymentTotals = paymentComposition.totals;
  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);
  const sourceMonths = useMemo(
    () =>
      compareTransactionMonths(
        comparisonTransactions,
        isExtended ? { month: -1, year: period.year } : period,
        filters,
      ),
    [comparisonTransactions, period, filters, isExtended],
  );
  const periodGroups = useMemo(
    () =>
      Array.from({ length: 12 / groupSize }, (_, index) => ({
        label: `${index + 1}º ${comparisonRange === 'quarter' ? 'trimestre' : 'semestre'} de ${period.year}`,
      })),
    [groupSize, comparisonRange, period.year],
  );
  const activeIndex = Math.min(rangeIndex, periodGroups.length - 1);
  const months = useMemo(
    () =>
      isExtended
        ? sourceMonths.slice(activeIndex * groupSize, (activeIndex + 1) * groupSize)
        : sourceMonths,
    [sourceMonths, isExtended, activeIndex, groupSize],
  );
  const comparisonMonths = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        categories: isPayment ? month.payments : month.categories,
      })),
    [months, isPayment],
  );
  const chartMonths = comparisonMonths;
  const hasFlow =
    comparisonMode === 'totals'
      ? months.some((month) => month.totalEntradas > 0 || month.totalSaidas > 0)
      : chartMonths.some((month) =>
          !isGrouped
            ? (month.categories[selectedGroup] ?? 0) > 0
            : Object.values(month.categories).some((value) => value > 0),
        );
  const comparisonTitle =
    comparisonMode === 'totals'
      ? 'Receitas e despesas por mês'
      : isGrouped
        ? isPayment
          ? 'Todas as formas de pagamento'
          : 'Todas as categorias de despesas'
        : isPayment
          ? `Despesas por ${selectedPayment}`
          : `Despesas com ${selectedCategory}`;
  const now = new Date();
  const comparisonPeriods = months;
  const partial = comparisonPeriods.some(
    (item) =>
      item.year === now.getFullYear() &&
      now.getMonth() >= item.month &&
      now.getMonth() < item.month + 1,
  );
  const future = comparisonPeriods.some(
    (item) =>
      item.year > now.getFullYear() ||
      (item.year === now.getFullYear() && item.month > now.getMonth()),
  );
  const legendMonth =
    comparisonMonths.find((month) => month.label === legendMonthLabel) ??
    comparisonMonths.find(
      (month) => month.year === now.getFullYear() && month.month === now.getMonth(),
    ) ??
    comparisonMonths[comparisonMonths.length - 1];
  const legendRows =
    comparisonMode === 'totals'
      ? [
          {
            label: 'Receitas recebidas',
            value: legendMonth.totalEntradas,
            color: isLight ? '#047857' : '#34d399',
          },
          {
            label: 'Despesas pagas',
            value: legendMonth.totalSaidas,
            color: isLight ? '#be123c' : '#fb7185',
          },
        ]
      : (isGrouped
          ? groupOptions.filter((label) =>
              comparisonMonths.some((month) => (month.categories[label] ?? 0) > 0),
            )
          : [selectedGroup]
        ).map((label) => ({
          label: isGrouped ? label : `Despesas pagas: ${label}`,
          value: legendMonth.categories[label] ?? 0,
          color: isGrouped
            ? (isPayment ? PAYMENT_PALETTE : CATEGORY_PALETTE)[label]
            : isLight
              ? '#c2410c'
              : '#fb923c',
        }));

  useEffect(() => {
    const dismiss = (event: Event) => {
      if (
        event.target instanceof Node &&
        (categoryCanvasRef.current?.contains(event.target) ||
          paymentCanvasRef.current?.contains(event.target) ||
          cashflowCanvasRef.current?.contains(event.target) ||
          tooltipRef.current?.contains(event.target))
      )
        return;
      setTooltip(null);
    };
    const resize = () => setTooltip(null);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Recria o gráfico de categorias quando os gastos ou as cores do tema mudam.
  useEffect(() => {
    if (!categoryCanvasRef.current) return;

    // Remove o desenho anterior antes de usar a mesma área para um novo gráfico.
    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
      categoryChartInstance.current = null;
    }

    if (expenses.length === 0) return;

    const ctx = categoryCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const config = createCategoryChartConfig(categoryTotals, isLight);
    config.options!.plugins!.tooltip = { enabled: false, external: showChartTooltip };
    categoryChartInstance.current = new ChartJS(ctx, config);

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
        categoryChartInstance.current = null;
      }
    };
  }, [expenses, categoryTotals, isLight, showChartTooltip]);

  // Atualiza a instância existente; destrói ao esvaziar ou desmontar o cartão.
  useEffect(() => {
    if (!paymentCanvasRef.current || paymentComposition.count === 0) {
      paymentChartInstance.current?.destroy();
      paymentChartInstance.current = null;
      return;
    }
    const config = createPaymentChartConfig(paymentTotals, isLight, paymentComposition.title);
    config.options!.plugins!.tooltip = { enabled: false, external: showChartTooltip };
    if (paymentChartInstance.current) {
      paymentChartInstance.current.data = config.data;
      paymentChartInstance.current.options = config.options!;
      paymentChartInstance.current.update();
    } else {
      const ctx = paymentCanvasRef.current.getContext('2d');
      if (ctx) paymentChartInstance.current = new ChartJS(ctx, config);
    }
  }, [paymentComposition, paymentTotals, isLight, showChartTooltip]);

  useEffect(
    () => () => {
      paymentChartInstance.current?.destroy();
      paymentChartInstance.current = null;
    },
    [],
  );

  // Mostra dois meses ou os doze meses do ano.
  useEffect(() => {
    if (!cashflowCanvasRef.current) return;

    if (cashflowChartInstance.current) {
      cashflowChartInstance.current.destroy();
      cashflowChartInstance.current = null;
    }

    if (!hasFlow) return;

    const ctx = cashflowCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const config = isGrouped
      ? createGroupedMonthlyChartConfig(
          comparisonMonths,
          isLight,
          isPayment ? 'payment' : 'category',
        )
      : comparisonMode !== 'totals'
        ? createSingleCategoryChartConfig(comparisonMonths, selectedGroup, isLight)
        : createMonthlyCashflowChartConfig(months, isLight);
    config.options!.plugins!.legend!.display = false;
    config.data.datasets.forEach((dataset) => {
      dataset.hidden = hiddenGroups[`${isPayment}:${dataset.label}`] ?? false;
    });
    config.options!.plugins!.tooltip = {
      ...config.options!.plugins!.tooltip,
      enabled: false,
      external: showChartTooltip,
    };
    cashflowChartInstance.current = new ChartJS<'line', number[]>(ctx, config);

    return () => {
      if (cashflowChartInstance.current) {
        cashflowChartInstance.current.destroy();
        cashflowChartInstance.current = null;
      }
    };
  }, [
    months,
    comparisonMonths,
    hasFlow,
    isLight,
    comparisonMode,
    isGrouped,
    selectedGroup,
    isPayment,
    hiddenGroups,
    showChartTooltip,
  ]);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Categorias: despesas pagas. Comparação: receitas recebidas e despesas pagas, ou apenas
        despesas pagas ao comparar categorias e formas. Todos respeitam busca e filtros globais. O
        período segue o vencimento do lançamento, não a data efetiva do pagamento.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição das despesas pagas por categoria. */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-800 dark:text-orange-400 border border-orange-500/20">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Despesas por Categoria
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Distribuição percentual dos gastos
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Doughnut
            </span>
          </div>

          <div className="h-[300px] relative flex items-center justify-center mt-3">
            {expenses.length === 0 ? (
              <div className="text-center p-6 text-slate-600 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span>Sem registros de despesas no período selecionado.</span>
              </div>
            ) : (
              <canvas
                ref={categoryCanvasRef}
                role="img"
                aria-label="Despesas pagas por categoria. Dados disponíveis em tabela para leitores de tela."
              />
            )}
          </div>
        </div>

        {/* Recorte local aplicado aos lançamentos já filtrados. */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {paymentComposition.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {paymentComposition.description}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Bar
            </span>
          </div>

          <label className="field-label mt-3 flex flex-col gap-1">
            Visualização por forma de pagamento
            <select
              value={paymentView}
              onChange={(event) => {
                setTooltip(null);
                setPaymentView(event.target.value as PaymentView);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 focus-visible:outline-2 focus-visible:outline-orange-500"
            >
              {Object.entries(PAYMENT_VIEWS).map(([value, view]) => (
                <option key={value} value={value}>
                  {view.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            Período do cabeçalho, por vencimento; busca e filtros globais aplicados.
          </p>
          <p className="mt-2 text-sm font-semibold" aria-live="polite">
            {paymentComposition.label}: {formatCurrency(paymentComposition.total)}
          </p>
          <div className="h-[300px] relative flex items-center justify-center mt-3">
            {paymentComposition.count === 0 ? (
              <div className="text-center p-6 text-slate-600 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span>
                  Nenhum lançamento de {paymentComposition.label.toLowerCase()} no período e filtros
                  atuais. Ajuste a seleção, a busca ou os filtros globais.
                </span>
              </div>
            ) : (
              <canvas
                ref={paymentCanvasRef}
                role="img"
                aria-label={`${paymentComposition.title}. Total: ${formatCurrency(paymentComposition.total)}. Dados na tabela abaixo.`}
              />
            )}
          </div>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-orange-500">
              Ver dados por forma em tabela
            </summary>
            <table className="mt-2 w-full text-left text-xs">
              <caption>{paymentComposition.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{paymentComposition.description}</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paymentTotals).map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{formatCurrency(value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td>{formatCurrency(paymentComposition.total)}</td>
                </tr>
              </tfoot>
            </table>
          </details>
        </div>

        {/* Comparativo de Fluxo: Entradas vs Saídas */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Comparação visual por período
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{comparisonTitle}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Comparativo
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-4 mt-4">
            <label className="field-label flex flex-col gap-1">
              Período do comparativo
              <select
                aria-label="Período do comparativo"
                value={comparisonRange}
                onChange={(event) => {
                  const range = event.target.value as ComparisonRange;
                  if (range !== 'selected') {
                    const index = Math.floor(
                      (period.month === -1 ? new Date().getMonth() : period.month) /
                        (range === 'quarter' ? 3 : 6),
                    );
                    setRangeIndex(index);
                  }
                  onComparisonRangeChange(range);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="selected">Mês ou ano do cabeçalho</option>
                <option value="quarter">Trimestre</option>
                <option value="semester">Semestre</option>
              </select>
            </label>
            {isExtended && (
              <label className="field-label flex flex-col gap-1">
                {comparisonRange === 'quarter' ? 'Trimestre' : 'Semestre'}
                <select
                  aria-label="Intervalo do comparativo"
                  value={activeIndex}
                  onChange={(event) => setRangeIndex(Number(event.target.value))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                >
                  {periodGroups.map((group, index) => (
                    <option key={group.label} value={index}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field-label flex flex-col gap-1">
              O que comparar
              <select
                value={comparisonMode}
                onChange={(event) => setComparisonMode(event.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
              >
                <option value="totals">Totais de receitas e despesas</option>
                <option value="category">Uma categoria de despesas</option>
                <option value="all">Todas as categorias de despesas</option>
                <option value="payment">Uma forma de pagamento</option>
                <option value="payments">Todas as formas de pagamento</option>
              </select>
            </label>
            {comparisonMode === 'category' && (
              <label className="field-label flex flex-col gap-1">
                Categoria
                <select
                  aria-label="Categoria"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                >
                  {categoryNames.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            )}
            {comparisonMode === 'payment' && (
              <label className="field-label flex flex-col gap-1">
                Forma de pagamento
                <select
                  aria-label="Forma de pagamento da comparação"
                  value={selectedPayment}
                  onChange={(event) => setSelectedPayment(event.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300">
              {isExtended
                ? periodGroups[activeIndex].label
                : period.month === -1
                  ? `Ano de ${period.year}`
                  : 'Mês selecionado e anterior'}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300">
              {comparisonMode === 'totals'
                ? 'Receitas recebidas e despesas pagas'
                : 'Despesas pagas'}
            </span>
            {partial && (
              <span
                role="note"
                className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-3 py-1 text-amber-800 dark:text-amber-300"
              >
                Parcial até {now.toLocaleDateString('pt-BR')}
              </span>
            )}
            {future && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-3 py-1 text-amber-800 dark:text-amber-300">
                Inclui meses futuros
              </span>
            )}
          </div>
          {/* A área com rolagem precisa receber foco para navegação por teclado. */}
          <div
            className="overflow-x-auto"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label="Gráfico comparativo; deslize para ver todos os meses"
          >
            <div
              style={{
                minWidth: months.length > 2 ? months.length * 80 : undefined,
                height: 340,
              }}
              className="relative flex items-center justify-center mt-3"
            >
              {!hasFlow ? (
                <div className="text-center p-6 text-slate-600 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  <span>Sem valores realizados para esta comparação.</span>
                </div>
              ) : (
                <canvas
                  ref={cashflowCanvasRef}
                  role="img"
                  aria-label={`${comparisonTitle}. Dados disponíveis em tabela para leitores de tela.`}
                />
              )}
            </div>
          </div>
          {hasFlow && (
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="field-label flex items-center gap-2">
                Valores de
                <select
                  aria-label="Mês dos valores da legenda"
                  value={legendMonth.label}
                  onChange={(event) => setLegendMonthLabel(event.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-700 dark:text-slate-200"
                >
                  {comparisonMonths.map((month) => (
                    <option key={month.label}>{month.label}</option>
                  ))}
                </select>
              </label>
              <div
                role="group"
                aria-label="Séries e valores do gráfico"
                className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
              >
                {legendRows.map(({ label, value, color }) => {
                  const key = `${isPayment}:${label}`;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={!hiddenGroups[key]}
                      onClick={() => {
                        setTooltip(null);
                        setHiddenGroups((previous) => ({ ...previous, [key]: !previous[key] }));
                      }}
                      className={`flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 ${hiddenGroups[key] ? 'opacity-50 line-through' : ''}`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="min-w-0 flex-1">{label}</span>
                      <span className="font-semibold tabular-nums whitespace-nowrap">
                        {formatCurrency(value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tooltip && (
            <div
              ref={tooltipRef}
              role="tooltip"
              aria-label={`Detalhes de ${tooltip.title}`}
              style={{
                position: 'fixed',
                left: tooltip.left,
                top: tooltip.top,
                width: tooltip.width,
                maxHeight: 'min(360px, calc(100dvh - 32px))',
              }}
              className="z-[80] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {tooltip.heading}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {tooltip.title}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar detalhes do gráfico"
                  onClick={() => setTooltip(null)}
                  className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-lg text-slate-500 dark:text-slate-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1 p-2">
                {tooltip.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="flex-1 text-slate-600 dark:text-slate-300">{row.label}</span>
                    <span className="font-semibold tabular-nums whitespace-nowrap text-slate-900 dark:text-white">
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasFlow && (
            <div className="sr-only">
              <div>
                <table className="w-full text-left">
                  <caption className="sr-only">{comparisonTitle}</caption>
                  <thead>
                    <tr>
                      <th scope="col">
                        {comparisonMode === 'totals'
                          ? 'Total'
                          : isPayment
                            ? 'Forma de pagamento'
                            : 'Categoria'}
                      </th>
                      {chartMonths.map((month) => (
                        <th scope="col" key={month.label}>
                          {month.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(comparisonMode === 'totals'
                      ? ['Receitas recebidas', 'Despesas pagas']
                      : !isGrouped
                        ? [selectedGroup]
                        : groupOptions.filter((category) =>
                            chartMonths.some((month) => (month.categories[category] ?? 0) > 0),
                          )
                    ).map((category) => (
                      <tr key={category}>
                        <th scope="row">{category}</th>
                        {chartMonths.map((month) => (
                          <td key={month.label}>
                            {formatCurrency(
                              comparisonMode === 'totals'
                                ? category === 'Receitas recebidas'
                                  ? month.totalEntradas
                                  : month.totalSaidas
                                : (month.categories[category] ?? 0),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Alternativa textual ao canvas, com os mesmos totais para leitura acessível. */}
      <div className="sr-only">
        <div>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Valores agregados dos gráficos financeiros</caption>
            <thead>
              <tr>
                <th scope="col">Gráfico</th>
                <th scope="col">Grupo</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...Object.entries(categoryTotals).map(
                  ([label, value]) => ['Despesas pagas', label, value] as const,
                ),
                ...Object.entries(paymentTotals).map(
                  ([label, value]) => [paymentComposition.title, label, value] as const,
                ),
                ['Fluxo realizado', 'Entradas recebidas', summary.totalEntradas] as const,
                ['Fluxo realizado', 'Despesas pagas', summary.totalSaidas] as const,
              ].map(([chart, label, value]) => (
                <tr key={`${chart}-${label}`}>
                  <td>{chart}</td>
                  <th scope="row" className="font-normal">
                    {label}
                  </th>
                  <td>{formatCurrency(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
