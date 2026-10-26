import { useCallback, useEffect, useRef } from 'react';
import { ChartTooltip } from '../../components/charts/ChartTooltip';
import { useChartTooltip } from '../../components/charts/useChartTooltip';
import type { TooltipModel } from 'chart.js';
import type { CSSProperties } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';
import { formatMoney } from './calculations';
import { formatDate } from './history';
import type { Currency, Observation } from './types';
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);
export default function CurrencyChart({
  points,
  from,
  to,
}: {
  points: Observation[];
  from: Currency;
  to: Currency;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const days =
    (Date.parse(points[points.length - 1].date) - Date.parse(points[0].date)) / 86400000 + 1;
  const chartWidth = days * 14 + 96;
  const { theme } = useTheme();
  const { tooltip, tooltipRef, showTooltip, closeTooltip } = useChartTooltip();
  const showChartTooltip = useCallback(
    (context: { chart: Chart; tooltip: TooltipModel<'line'> }) =>
      showTooltip(context, 'Histórico da cotação'),
    [showTooltip],
  );
  useEffect(() => {
    if (!canvas.current) return;
    if (scroller.current) scroller.current.scrollLeft = 0;
    const values = new Map(points.map((p) => [p.date, p.bid]));
    const labels: string[] = [];
    const day = new Date(`${points[0].date}T12:00:00Z`);
    const end = points[points.length - 1].date;
    while (day.toISOString().slice(0, 10) <= end) {
      labels.push(day.toISOString().slice(0, 10));
      day.setUTCDate(day.getUTCDate() + 1);
    }
    const color = theme === 'dark' ? '#34d399' : '#047857';
    const text = theme === 'dark' ? '#cbd5e1' : '#475569';
    const chart = new Chart(canvas.current, {
      type: 'line',
      data: {
        labels: labels.map(formatDate),
        datasets: [
          {
            label: `1 ${from} em ${to}`,
            data: labels.map((date) => values.get(date) ?? null),
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 2,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            ticks: { color: text, maxRotation: 0, autoSkipPadding: 20 },
            grid: { display: false },
          },
          y: {
            ticks: { color: text, callback: (value) => formatMoney(Number(value), to, true) },
            grid: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
          },
        },
        plugins: {
          tooltip: {
            enabled: false,
            external: showChartTooltip,
          },
        },
      },
    });
    return () => {
      chart.destroy();
      closeTooltip();
    };
  }, [points, from, to, theme, showChartTooltip, closeTooltip]);
  return (
    <>
      <p id="history-scroll-hint" className="text-sm text-slate-600 dark:text-slate-300 lg:hidden">
        Em períodos longos, deslize o gráfico para os lados para ver todas as datas.
      </p>
      <div
        ref={scroller}
        role="region"
        aria-label="Gráfico com rolagem horizontal"
        aria-describedby="history-scroll-hint"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Permite rolar o gráfico pelas setas do teclado.
        tabIndex={0}
        className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        <div
          className="relative h-72 w-full min-w-[var(--history-chart-width)] lg:min-w-0"
          style={{ '--history-chart-width': `${chartWidth}px` } as CSSProperties}
        >
          <canvas
            ref={canvas}
            role="img"
            aria-label={`Histórico de 1 ${from} em ${to}`}
            aria-describedby="history-description"
          />
        </div>
      </div>
      {tooltip && (
        <ChartTooltip
          data={tooltip}
          tooltipRef={tooltipRef}
          formatValue={(value) => formatMoney(value, to, true)}
          onClose={closeTooltip}
        />
      )}
    </>
  );
}
