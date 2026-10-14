import { groupTransactionValues, summarizeTransactions } from '../calculations';
import React, { useEffect, useRef, useMemo } from 'react';
import { Transaction } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  DoughnutController,
  BarController,
} from 'chart.js';
import { PieChart, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

// Habilita os tipos de gráfico, eixos e recursos que a biblioteca usará.
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  DoughnutController,
  BarController
);

interface FinancialChartsProps {
  transactions: Transaction[];
}

const CATEGORY_PALETTE: Record<string, string> = {
  Alimentação: '#f97316',
  Moradia: '#6366f1',
  Transporte: '#06b6d4',
  Saúde: '#f43f5e',
  Educação: '#3b82f6',
  Lazer: '#a855f7',
  Salário: '#10b981',
  Investimentos: '#14b8a6',
  Serviços: '#eab308',
  Outros: '#94a3b8',
};

const PAYMENT_PALETTE: Record<string, string> = {
  'Pix': '#10b981',
  'Cartão de Crédito': '#f43f5e',
  'Cartão de Débito': '#0ea5e9',
  'Dinheiro': '#eab308',
  'Boleto': '#8b5cf6',
  'Transferência': '#06b6d4',
  'Outro': '#64748b',
};

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // As referências apontam para as áreas de desenho; as instâncias guardam os gráficos criados.
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paymentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cashflowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const categoryChartInstance = useRef<ChartJS | null>(null);
  const paymentChartInstance = useRef<ChartJS | null>(null);
  const cashflowChartInstance = useRef<ChartJS | null>(null);

  // Categorias usam somente despesas pagas. Formas de pagamento somam receitas e
  // despesas, incluindo pendentes; o fluxo usa entradas/saídas realizadas do resumo.
  const expenses = useMemo(() => transactions.filter(t => t.tipo === 'despesa' && t.status === 'pago'), [transactions]);

  const categoryTotals = useMemo(() => groupTransactionValues(expenses, 'categoria'), [expenses]);
  const paymentTotals = useMemo(() => groupTransactionValues(transactions, 'forma_pagamento'), [transactions]);
  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);

  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#1e293b';
  const doughnutBorder = isLight ? '#ffffff' : '#0f172a';

  // Recria o gráfico de categorias quando os gastos ou as cores do tema mudam.
  useEffect(() => {
    if (!categoryCanvasRef.current) return;

    // Remove o desenho anterior antes de usar a mesma área para um novo gráfico.
    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
      categoryChartInstance.current = null;
    }

    if (expenses.length === 0) return;

    // Usa os totais já calculados para definir o tamanho das fatias.
    const catTotals = categoryTotals;

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);
    const backgroundColor = labels.map((l) => CATEGORY_PALETTE[l] || '#94a3b8');

    const ctx = categoryCanvasRef.current.getContext('2d');
    if (!ctx) return;

    categoryChartInstance.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            borderColor: doughnutBorder,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              color: textColor,
              font: {
                size: 11,
                family: 'system-ui, -apple-system, sans-serif',
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const val = context.raw as number;
                return ` ${label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
        cutout: '68%',
      },
    });

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
        categoryChartInstance.current = null;
      }
    };
  }, [expenses, categoryTotals, isLight, textColor, doughnutBorder]);

  // Recria o gráfico que compara as formas de pagamento.
  useEffect(() => {
    if (!paymentCanvasRef.current) return;

    if (paymentChartInstance.current) {
      paymentChartInstance.current.destroy();
      paymentChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    // Soma os valores por forma de pagamento, incluindo lançamentos pendentes.
    const pmTotals = paymentTotals;

    const labels = Object.keys(pmTotals);
    const data = Object.values(pmTotals);
    const backgroundColor = labels.map((l) => PAYMENT_PALETTE[l] || '#64748b');

    const ctx = paymentCanvasRef.current.getContext('2d');
    if (!ctx) return;

    paymentChartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Volume (R$)',
            data,
            backgroundColor,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                return ` Total: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: textColor,
              font: { size: 10 },
            },
          },
          y: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (value) => `R$ ${value}`,
            },
          },
        },
      },
    });

    return () => {
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
        paymentChartInstance.current = null;
      }
    };
  }, [transactions, paymentTotals, isLight, textColor, gridColor]);

  // Compara os totais já recebidos e pagos em duas barras.
  useEffect(() => {
    if (!cashflowCanvasRef.current) return;

    if (cashflowChartInstance.current) {
      cashflowChartInstance.current.destroy();
      cashflowChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    const totalEntradas = summary.totalEntradas;
    const totalSaidas = summary.totalSaidas;

    const ctx = cashflowCanvasRef.current.getContext('2d');
    if (!ctx) return;

    cashflowChartInstance.current = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels: ['Entradas', 'Saídas'],
        datasets: [
          {
            label: 'Total (R$)',
            data: [totalEntradas, totalSaidas],
            backgroundColor: ['#10b981', '#f43f5e'],
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                return ` R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor },
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => `R$ ${value}`,
            },
          },
        },
      },
    });

    return () => {
      if (cashflowChartInstance.current) {
        cashflowChartInstance.current.destroy();
        cashflowChartInstance.current = null;
      }
    };
  }, [summary, transactions, isLight, textColor, gridColor]);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Categorias e fluxo consideram lançamentos pagos ou recebidos. Formas de pagamento incluem também os pendentes.</p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Distribuição das despesas pagas por categoria. */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-800 dark:text-orange-400 border border-orange-500/20">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Despesas por Categoria</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribuição percentual dos gastos</p>
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
            <canvas ref={categoryCanvasRef} role="img" aria-label="Despesas pagas por categoria. Valores disponíveis na tabela abaixo." />
          )}
        </div>
      </div>

      {/* Volume de lançamentos por forma de pagamento, incluindo pendentes. */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Formas de Pagamento</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Volume por método (Pix, Cartão, etc.)</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Bar
          </span>
        </div>

        <div className="h-[300px] relative flex items-center justify-center mt-3">
          {transactions.length === 0 ? (
            <div className="text-center p-6 text-slate-600 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>Nenhuma transação cadastrada no período.</span>
            </div>
          ) : (
            <canvas ref={paymentCanvasRef} role="img" aria-label="Volume por forma de pagamento, incluindo pendentes. Valores disponíveis na tabela abaixo." />
          )}
        </div>
      </div>

      {/* Comparativo de Fluxo: Entradas vs Saídas */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fluxo de Caixa Realizado</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Entradas recebidas vs despesas pagas</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Comparativo
          </span>
        </div>

        <div className="h-[300px] relative flex items-center justify-center mt-3">
          {transactions.length === 0 ? (
            <div className="text-center p-6 text-slate-600 dark:text-slate-400 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>Sem dados de fluxo para este período.</span>
            </div>
          ) : (
            <canvas ref={cashflowCanvasRef} role="img" aria-label="Fluxo realizado: entradas recebidas e despesas pagas. Valores disponíveis na tabela abaixo." />
          )}
        </div>
      </div>
    </div>
      {/* Alternativa textual ao canvas, com os mesmos totais para leitura acessível. */}
      <details className="mt-4 rounded-xl border border-slate-300 dark:border-slate-700 p-4">
        <summary className="cursor-pointer font-semibold">Consultar valores dos gráficos em tabela</summary>
        <div className="overflow-x-auto mt-3"><table className="w-full text-left text-sm">
          <caption className="sr-only">Valores agregados dos gráficos financeiros</caption>
          <thead><tr><th scope="col">Gráfico</th><th scope="col">Grupo</th><th scope="col">Valor</th></tr></thead>
          <tbody>{[
            ...Object.entries(categoryTotals).map(([label, value]) => ['Despesas pagas', label, value] as const),
            ...Object.entries(paymentTotals).map(([label, value]) => ['Formas de pagamento', label, value] as const),
            ['Fluxo realizado', 'Entradas recebidas', summary.totalEntradas] as const,
            ['Fluxo realizado', 'Despesas pagas', summary.totalSaidas] as const,
          ].map(([chart, label, value]) => <tr key={`${chart}-${label}`}><td>{chart}</td><th scope="row" className="font-normal">{label}</th><td>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td></tr>)}</tbody>
        </table></div>
      </details>
    </div>
  );
};
