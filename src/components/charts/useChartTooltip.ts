import { useCallback, useEffect, useRef, useState } from 'react';
import type { Chart, ChartType, TooltipModel } from 'chart.js';
import type { ChartTooltipData } from './ChartTooltip';

// A dependência de Chart.js é apenas de tipos: importar este hook não carrega os gráficos.
export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<ChartTooltipData | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const activeCanvas = useRef<HTMLCanvasElement | null>(null);
  const activeChart = useRef<Chart | null>(null);
  const closeTooltip = useCallback(() => {
    const chart = activeChart.current;
    activeChart.current = null;
    if (chart?.ctx) {
      chart.setActiveElements([]);
      chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
      chart.update('none');
    }
    setTooltip(null);
  }, []);
  const showTooltip = useCallback(
    <T extends ChartType>(
      { chart, tooltip: model }: { chart: Chart; tooltip: TooltipModel<T> },
      heading: string,
    ) => {
      if (!model.opacity) {
        if (!tooltipRef.current?.matches(':hover')) setTooltip(null);
        return;
      }
      activeCanvas.current = chart.canvas;
      activeChart.current = chart;
      const chartType = 'type' in chart.config ? chart.config.type : undefined;
      const rect = chart.canvas.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 32);
      const rows = model.dataPoints.flatMap((point, index) =>
        typeof point.raw === 'number' && Number.isFinite(point.raw)
          ? [
              {
                label:
                  chartType === 'line'
                    ? (chart.data.datasets[point.datasetIndex]?.label ?? '')
                    : point.label,
                value: point.raw,
                color: String(model.labelColors[index]?.backgroundColor ?? '#94a3b8'),
              },
            ]
          : [],
      );
      if (!rows.length) {
        setTooltip(null);
        return;
      }
      const height = Math.min(360, window.innerHeight - 32, 80 + rows.length * 36);
      const x = rect.left + model.caretX;
      const y = rect.top + model.caretY;
      setTooltip({
        heading,
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
  useEffect(() => {
    const dismiss = (event: Event) => {
      if (
        event.target instanceof Node &&
        (activeCanvas.current?.contains(event.target) || tooltipRef.current?.contains(event.target))
      )
        return;
      closeTooltip();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTooltip();
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('scroll', dismiss, true);
    document.addEventListener('keydown', key);
    window.addEventListener('resize', closeTooltip);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('scroll', dismiss, true);
      document.removeEventListener('keydown', key);
      window.removeEventListener('resize', closeTooltip);
    };
  }, [closeTooltip]);
  return { tooltip, tooltipRef, showTooltip, closeTooltip };
}
