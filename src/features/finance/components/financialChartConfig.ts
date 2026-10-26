import { formatCurrency } from '../formatCurrency.ts';
import type { ChartConfiguration, ChartOptions } from 'chart.js';

const initialPalette: Record<string, string> = {
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
export const CATEGORY_PALETTE: Record<string, string> = new Proxy(initialPalette, {
  get(target, key: string) {
    if (Object.hasOwn(target, key)) return target[key];
    let hash = 0;
    for (const char of key) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
    return `hsl(${hash % 360} 65% 45%)`;
  },
});

export const PAYMENT_PALETTE: Record<string, string> = {
  Pix: '#10b981',
  'Cartão de Crédito': '#f43f5e',
  'Cartão de Débito': '#0ea5e9',
  Dinheiro: '#eab308',
  Boleto: '#8b5cf6',
  Transferência: '#06b6d4',
  Outro: '#64748b',
};

// Cada chamada cria opções próprias: Chart.js pode modificar a configuração recebida.
// Tema e movimento reduzido são lidos ao recriar o gráfico, sem compartilhar estado mutável.
function chartAppearance(isLight: boolean) {
  return {
    textColor: isLight ? '#475569' : '#94a3b8',
    gridColor: isLight ? '#e2e8f0' : '#1e293b',
    doughnutBorder: isLight ? '#ffffff' : '#0f172a',
  };
}

// As barras compartilham eixos e comportamento, mas preservam tipografia e tooltip próprios.
function barOptions(
  isLight: boolean,
  tooltipPrefix: string,
  tickSize?: number,
): ChartOptions<'bar'> {
  const { textColor, gridColor } = chartAppearance(isLight);
  const font = tickSize === undefined ? undefined : { size: tickSize };
  return {
    responsive: true,
    animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${tooltipPrefix}${(context.raw as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font } },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font, callback: (value) => `R$ ${value}` },
      },
    },
  };
}

export function createCategoryChartConfig(
  totals: Record<string, number>,
  isLight: boolean,
): ChartConfiguration<'doughnut'> {
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const backgroundColor = labels.map((label) => CATEGORY_PALETTE[label] || '#94a3b8');
  const { textColor, doughnutBorder } = chartAppearance(isLight);
  return {
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
  };
}

export function createPaymentChartConfig(
  totals: Record<string, number>,
  isLight: boolean,
  title = 'Despesas pagas por forma de pagamento',
): ChartConfiguration<'bar', number[]> {
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const backgroundColor = labels.map((label) => PAYMENT_PALETTE[label] || '#64748b');
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          backgroundColor,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: barOptions(isLight, ' Total: R$ ', 10),
  };
}

function monthlyLineConfig(
  labels: string[],
  series: { label: string; data: number[]; color: string }[],
  isLight: boolean,
): ChartConfiguration<'line', number[]> {
  const { textColor, gridColor } = chartAppearance(isLight);
  return {
    type: 'line',
    data: {
      labels,
      datasets: series.map(({ color, ...series }) => ({
        ...series,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHitRadius: 20,
        pointBorderWidth: 2,
        pointBorderColor: isLight ? '#ffffff' : '#0f172a',
        tension: 0,
      })),
    },
    options: {
      color: isLight ? '#334155' : '#e2e8f0',
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
      layout: { padding: { top: 16, left: 8, right: 8 } },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatCurrency(context.raw as number)}`,
          },
        },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          ticks: { color: textColor, autoSkip: false, maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grace: '20%',
          grid: { color: gridColor },
          ticks: { color: textColor, callback: (value) => `R$ ${value}` },
        },
      },
    },
  };
}

export function createMonthlyCashflowChartConfig(
  months: { label: string; totalEntradas: number; totalSaidas: number }[],
  isLight: boolean,
): ChartConfiguration<'line', number[]> {
  return monthlyLineConfig(
    months.map((month) => month.label),
    [
      {
        label: 'Receitas recebidas',
        data: months.map((month) => month.totalEntradas),
        color: isLight ? '#047857' : '#34d399',
      },
      {
        label: 'Despesas pagas',
        data: months.map((month) => month.totalSaidas),
        color: isLight ? '#be123c' : '#fb7185',
      },
    ],
    isLight,
  );
}

// Uma série por grupo, com as mesmas cores dos gráficos de distribuição.
export function createGroupedMonthlyChartConfig(
  months: { label: string; categories: Record<string, number> }[],
  isLight: boolean,
  kind: 'category' | 'payment' = 'category',
): ChartConfiguration<'line', number[]> {
  const palette = kind === 'payment' ? PAYMENT_PALETTE : CATEGORY_PALETTE;
  const labels = Object.keys(palette).filter((label) =>
    months.some((month) => (month.categories[label] ?? 0) > 0),
  );
  return monthlyLineConfig(
    months.map((month) => month.label),
    labels.map((label) => ({
      label,
      data: months.map((month) => month.categories[label] ?? 0),
      color: palette[label],
    })),
    isLight,
  );
}

export function createSingleCategoryChartConfig(
  months: { label: string; categories: Record<string, number> }[],
  category: string,
  isLight: boolean,
): ChartConfiguration<'line', number[]> {
  return monthlyLineConfig(
    months.map((month) => month.label),
    [
      {
        label: `Despesas pagas: ${category}`,
        data: months.map((month) => month.categories[category] ?? 0),
        color: isLight ? '#c2410c' : '#fb923c',
      },
    ],
    isLight,
  );
}
