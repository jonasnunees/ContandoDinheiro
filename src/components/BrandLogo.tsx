interface BrandLogoProps {
  forceLight?: boolean;
  href?: string;
  onClick?: () => void;
}

/** Identidade visual compartilhada por todos os headers. */
export function BrandLogo({ href = '/', onClick, forceLight = false }: BrandLogoProps) {
  const content = (
    <span className="flex items-center gap-3 flex-shrink-0">
      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/20 p-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-white"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </span>
      <span>
        <span
          className={`text-base sm:text-lg font-bold text-slate-900 tracking-tight ${forceLight ? '' : 'dark:text-white'}`}
        >
          ContandoDinheiro
        </span>
        <span
          className={`hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 ${forceLight ? '' : 'dark:text-emerald-400'}`}
        >
          100% Gratuito
        </span>
      </span>
    </span>
  );
  const className =
    'inline-flex rounded-xl flex-shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600';

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${className} cursor-pointer`}
      title="Voltar para a Página Inicial"
    >
      {content}
    </button>
  ) : (
    <a href={href} className={className} title="Voltar para a Página Inicial">
      {content}
    </a>
  );
}
