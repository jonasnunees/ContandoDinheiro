import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function FeatureCarousel({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const [position, setPosition] = useState(count);
  const [animated, setAnimated] = useState(false);
  const [moving, setMoving] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [visible, setVisible] = useState(() =>
    window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1,
  );
  const viewport = useRef<HTMLDivElement>(null);
  const active = (((position - count) % count) + count) % count;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setReduced(motion.matches);
      setPaused(true);
    };
    const updateVisibility = () => setHidden(document.hidden);
    const observer = new ResizeObserver(([entry]) => {
      setAnimated(false);
      setVisible(entry.contentRect.width >= 900 ? 3 : entry.contentRect.width >= 540 ? 2 : 1);
    });
    if (viewport.current) observer.observe(viewport.current);
    motion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  // A cópia nas extremidades mantém o movimento contínuo ao completar a volta.
  useEffect(() => {
    if (!moving) return;
    const timer = window.setTimeout(
      () => {
        setAnimated(false);
        setPosition(count + active);
        setMoving(false);
      },
      reduced ? 0 : 450,
    );
    return () => window.clearTimeout(timer);
  }, [moving, count, active, reduced]);

  useEffect(() => {
    if (paused || hovered || hidden || reduced || moving) return;
    const timer = window.setTimeout(() => {
      setAnimated(true);
      setMoving(true);
      setPosition((value) => value + 1);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [paused, hovered, hidden, reduced, moving, position]);

  function goTo(next: number) {
    if (moving) return;
    setAnimated(!reduced);
    setMoving(true);
    setPosition(next);
  }

  const control =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-600/30 bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer';
  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Recursos do ContandoDinheiro"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className={control}
          aria-label="Recurso anterior"
          aria-controls="feature-slides"
          onClick={() => goTo(position - 1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div ref={viewport} className="min-w-0 flex-1 overflow-hidden py-2">
          <div
            id="feature-slides"
            className="flex"
            style={{
              transform: `translateX(-${(position * 100) / visible}%)`,
              transition: animated ? 'transform 450ms ease' : 'none',
            }}
          >
            {[...cards, ...cards, ...cards].map((card, index) => {
              const shown = index >= position && index < position + visible;
              return (
                <div
                  key={index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${(index % count) + 1} de ${count}`}
                  aria-hidden={!shown}
                  inert={!shown}
                  className="shrink-0 px-2 sm:px-3 flex [&>div]:w-full"
                  style={{ width: `${100 / visible}%` }}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className={control}
          aria-label="Próximo recurso"
          aria-controls="feature-slides"
          onClick={() => goTo(position + 1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
        <div role="group" aria-label="Escolher recurso" className="flex">
          {cards.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir para recurso ${index + 1} de ${count}`}
              aria-current={active === index ? 'true' : undefined}
              className="flex h-11 w-8 items-center justify-center rounded cursor-pointer"
              onClick={() => goTo(count + index)}
            >
              <span
                className={`h-2.5 rounded-full ${active === index ? 'w-5 bg-emerald-700 dark:bg-emerald-400' : 'w-2.5 bg-slate-400 dark:bg-slate-500'}`}
              />
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live={paused || reduced ? 'polite' : 'off'} aria-atomic="true">
        Recurso {active + 1} de {count}
      </p>
    </div>
  );
}
