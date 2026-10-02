import React, { useEffect, useRef } from 'react';
import { Transaction } from '../types/finance';
import { useTheme } from '../context/ThemeContext';
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

// Register Chart.js components
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

  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paymentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cashflowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const categoryChartInstance = useRef<ChartJS | null>(null);
  const paymentChartInstance = useRef<ChartJS | null>(null);
  const cashflowChartInstance = useRef<ChartJS | null>(null);

  // Filter expenses for category chart
  const expenses = transactions.filter((t) => t.tipo === 'despesa');
  const revenues = transactions.filter((t) => t.tipo === 'receita');

  const textColor = isLight ? '#475569' : '#94a3b8';
  const gridColor = isLight ? '#e2e8f0' : '#1e293b';
  const doughnutBorder = isLight ? '#ffffff' : '#0f172a';

  // 1. Category Chart Effect
  useEffect(() => {
    if (!categoryCanvasRef.current) return;

    if (categoryChartInstance.current) {
      categoryChartInstance.current.destroy();
      categoryChartInstance.current = null;
    }

    if (expenses.length === 0) return;

    // Aggregate by category
    const catTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      catTotals[t.categoria] = (catTotals[t.categoria] || 0) + t.valor;
    });

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
  }, [expenses, isLight, textColor, doughnutBorder]);

  // 2. Payment Method Chart Effect
  useEffect(() => {
    if (!paymentCanvasRef.current) return;

    if (paymentChartInstance.current) {
      paymentChartInstance.current.destroy();
      paymentChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    // Aggregate all transactions by payment method
    const pmTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      pmTotals[t.forma_pagamento] = (pmTotals[t.forma_pagamento] || 0) + t.valor;
    });

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
  }, [transactions, isLight, textColor, gridColor]);

  // 3. Cash Flow (Entradas vs Saídas)
  useEffect(() => {
    if (!cashflowCanvasRef.current) return;

    if (cashflowChartInstance.current) {
      cashflowChartInstance.current.destroy();
      cashflowChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    const totalEntradas = revenues.reduce((acc, t) => acc + t.valor, 0);
    const totalSaidas = expenses.reduce((acc, t) => acc + t.valor, 0);

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
  }, [revenues, expenses, transactions, isLight, textColor, gridColor]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 5.3 Gráfico de Rosca: Despesas por Categoria */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
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

        <div className="flex-1 min-h-[260px] relative flex items-center justify-center pt-3">
          {expenses.length === 0 ? (
            <div className="text-center p-6 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>Sem registros de despesas no período selecionado.</span>
            </div>
          ) : (
            <canvas ref={categoryCanvasRef} />
          )}
        </div>
      </div>

      {/* 5.4 Gráfico de Barras: Distribuição por Forma de Pagamento */}
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

        <div className="flex-1 min-h-[260px] relative flex items-center justify-center pt-3">
          {transactions.length === 0 ? (
            <div className="text-center p-6 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>Nenhuma transação cadastrada no período.</span>
            </div>
          ) : (
            <canvas ref={paymentCanvasRef} />
          )}
        </div>
      </div>

      {/* Comparativo de Fluxo: Entradas vs Saídas */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl flex flex-col transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fluxo de Caixa Geral</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total de Entradas vs Saídas</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Comparativo
          </span>
        </div>

        <div className="flex-1 min-h-[260px] relative flex items-center justify-center pt-3">
          {transactions.length === 0 ? (
            <div className="text-center p-6 text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <span>Sem dados de fluxo para este período.</span>
            </div>
          ) : (
            <canvas ref={cashflowCanvasRef} />
          )}
        </div>
      </div>
    </div>
  );
};
