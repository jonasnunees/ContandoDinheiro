import type { Ref } from 'react';

export interface ChartTooltipData {
  heading: string;
  title: string;
  rows: { label: string; value: number; color: string }[];
  left: number;
  top: number;
  width: number;
}

export function ChartTooltip({
  data,
  tooltipRef,
  formatValue,
  onClose,
}: {
  data: ChartTooltipData;
  tooltipRef: Ref<HTMLDivElement>;
  formatValue: (value: number) => string;
  onClose: () => void;
}) {
  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-label={`Detalhes de ${data.title}`}
      style={{
        position: 'fixed',
        left: data.left,
        top: data.top,
        width: data.width,
        maxHeight: 'min(360px, calc(100dvh - 32px))',
      }}
      className="z-[80] overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {data.heading}
          </p>
          <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-white">
            {data.title}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar detalhes do gráfico"
          onClick={onClose}
          className="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-lg text-slate-500 dark:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          ×
        </button>
      </div>
      <div className="space-y-1 p-2">
        {data.rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 text-xs"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="min-w-0 flex-1 break-words text-slate-600 dark:text-slate-300">
              {row.label}
            </span>
            <span className="max-w-full break-words font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatValue(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
