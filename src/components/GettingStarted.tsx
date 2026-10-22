import { useEffect, useRef } from 'react';
import { Compass, UserRoundCheck, Wallet } from 'lucide-react';

const steps = [
  {
    title: 'Experimente sem login',
    description: 'Abra a demonstração com exemplos fictícios. Suas alterações ficam somente neste navegador, separadas dos dados da sua conta.',
    Icon: Compass,
  },
  {
    title: 'Entre na sua conta',
    description: 'Entre com sua conta Google para salvar seus próprios lançamentos e acessá-los em outro dispositivo.',
    Icon: UserRoundCheck,
  },
  {
    title: 'Registre e planeje',
    description: 'Adicione receitas, despesas, recorrências e parcelas. Ao confirmar pagamentos e recebimentos, informe a data efetiva para atualizar seu saldo realizado.',
    Icon: Wallet,
  },
];

export function GettingStarted() {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!list || motion.matches || !('IntersectionObserver' in window)) return;

    const items = Array.from(list.children);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.removeAttribute('data-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach((item) => {
      // O conteúdo permanece visível sem suporte à animação ou ao JavaScript.
      if (item.getBoundingClientRect().top >= window.innerHeight) {
        item.setAttribute('data-pending', '');
      }
      observer.observe(item);
    });

    const revealAll = () => {
      if (motion.matches) {
        items.forEach((item) => item.removeAttribute('data-pending'));
        observer.disconnect();
      }
    };
    motion.addEventListener('change', revealAll);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', revealAll);
      items.forEach((item) => item.removeAttribute('data-pending'));
    };
  }, []);

  return (
    <section aria-labelledby="getting-started-title" className="py-16 sm:py-20 px-4 sm:px-8 bg-slate-100/60 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Passo a passo simples</p>
          <h2 id="getting-started-title" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">Como começar a organizar seu dinheiro</h2>
        </div>
        {/* Safari precisa do papel explícito para preservar listas sem marcadores visuais. */}
        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
        <ol ref={listRef} className="getting-started-timeline" role="list">
          {steps.map(({ title, description, Icon }, index) => (
            <li key={title} className="getting-started-step">
              <div className="getting-started-marker bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
              <div className="getting-started-card rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
                <span aria-hidden="true" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-lg mb-5">{index + 1}</span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">{title}</h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
              </div>
              <div className="getting-started-icon text-slate-300 dark:text-slate-600" aria-hidden="true">
                <Icon size={80} strokeWidth={1.5} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
