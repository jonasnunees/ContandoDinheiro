import {
  createCategoryChartConfig,
  createPaymentChartConfig,
  createCashflowChartConfig,
} from './financialChartConfig';
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
  BarController,
);

interface FinancialChartsProps {
  transactions: Transaction[];
}

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
  const expenses = useMemo(
    () => transactions.filter((t) => t.tipo === 'despesa' && t.status === 'pago'),
    [transactions],
  );

  const categoryTotals = useMemo(() => groupTransactionValues(expenses, 'categoria'), [expenses]);
  const paymentTotals = useMemo(
    () => groupTransactionValues(transactions, 'forma_pagamento'),
    [transactions],
  );
  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);

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

    categoryChartInstance.current = new ChartJS(
      ctx,
      createCategoryChartConfig(categoryTotals, isLight),
    );

    return () => {
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
        categoryChartInstance.current = null;
      }
    };
  }, [expenses, categoryTotals, isLight]);

  // Recria o gráfico que compara as formas de pagamento.
  useEffect(() => {
    if (!paymentCanvasRef.current) return;

    if (paymentChartInstance.current) {
      paymentChartInstance.current.destroy();
      paymentChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    const ctx = paymentCanvasRef.current.getContext('2d');
    if (!ctx) return;

    paymentChartInstance.current = new ChartJS(
      ctx,
      createPaymentChartConfig(paymentTotals, isLight),
    );

    return () => {
      if (paymentChartInstance.current) {
        paymentChartInstance.current.destroy();
        paymentChartInstance.current = null;
      }
    };
  }, [transactions, paymentTotals, isLight]);

  // Compara os totais já recebidos e pagos em duas barras.
  useEffect(() => {
    if (!cashflowCanvasRef.current) return;

    if (cashflowChartInstance.current) {
      cashflowChartInstance.current.destroy();
      cashflowChartInstance.current = null;
    }

    if (transactions.length === 0) return;

    const ctx = cashflowCanvasRef.current.getContext('2d');
    if (!ctx) return;

    cashflowChartInstance.current = new ChartJS(
      ctx,
      createCashflowChartConfig(summary.totalEntradas, summary.totalSaidas, isLight),
    );

    return () => {
      if (cashflowChartInstance.current) {
        cashflowChartInstance.current.destroy();
        cashflowChartInstance.current = null;
      }
    };
  }, [summary, transactions, isLight]);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        Categorias e fluxo consideram lançamentos pagos ou recebidos. Formas de pagamento incluem
        também os pendentes.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                aria-label="Despesas pagas por categoria. Valores disponíveis na tabela abaixo."
              />
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Formas de Pagamento
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Volume por método (Pix, Cartão, etc.)
                </p>
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
              <canvas
                ref={paymentCanvasRef}
                role="img"
                aria-label="Volume por forma de pagamento, incluindo pendentes. Valores disponíveis na tabela abaixo."
              />
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Fluxo de Caixa Realizado
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Entradas recebidas vs despesas pagas
                </p>
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
              <canvas
                ref={cashflowCanvasRef}
                role="img"
                aria-label="Fluxo realizado: entradas recebidas e despesas pagas. Valores disponíveis na tabela abaixo."
              />
            )}
          </div>
        </div>
      </div>
      {/* Alternativa textual ao canvas, com os mesmos totais para leitura acessível. */}
      <details className="mt-4 rounded-xl border border-slate-300 dark:border-slate-700 p-4">
        <summary className="cursor-pointer font-semibold">
          Consultar valores dos gráficos em tabela
        </summary>
        <div className="overflow-x-auto mt-3">
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
                  ([label, value]) => ['Formas de pagamento', label, value] as const,
                ),
                ['Fluxo realizado', 'Entradas recebidas', summary.totalEntradas] as const,
                ['Fluxo realizado', 'Despesas pagas', summary.totalSaidas] as const,
              ].map(([chart, label, value]) => (
                <tr key={`${chart}-${label}`}>
                  <td>{chart}</td>
                  <th scope="row" className="font-normal">
                    {label}
                  </th>
                  <td>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
