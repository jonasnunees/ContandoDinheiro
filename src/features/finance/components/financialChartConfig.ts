import type { ChartConfiguration, ChartOptions } from 'chart.js';

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
): ChartConfiguration<'bar'> {
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const backgroundColor = labels.map((label) => PAYMENT_PALETTE[label] || '#64748b');
  return {
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
    options: barOptions(isLight, ' Total: R$ ', 10),
  };
}

export function createCashflowChartConfig(
  totalEntradas: number,
  totalSaidas: number,
  isLight: boolean,
): ChartConfiguration<'bar'> {
  return {
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
    options: barOptions(isLight, ' R$ '),
  };
}
