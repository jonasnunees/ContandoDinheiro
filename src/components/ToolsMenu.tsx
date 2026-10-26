import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
const tools = [{ href: '/ferramentas/conversor-de-moedas', label: 'Conversor de moedas' }];
export function ToolsMenu({
  inline = false,
  onNavigate,
}: {
  inline?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div ref={root} className="relative text-sm">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
      >
        Ferramentas <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && (
        <nav
          id={id}
          aria-label="Ferramentas"
          className={`${inline ? 'mt-1' : 'absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)]'} z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-lg`}
        >
          {tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="block rounded-lg px-3 py-3 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              {tool.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
