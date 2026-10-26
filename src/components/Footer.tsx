import { Github } from 'lucide-react';
import { LegalLinks } from '../features/legal/LegalLinks';

interface FooterProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function Footer({ onOpenLogin, onOpenRegister }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 px-4 sm:px-8 text-xs text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
            C
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-300">ContandoDinheiro</span>
          <span>— Gestão Financeira Pessoal Gratuita</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
          <LegalLinks />
          <a
            href="/#notas-da-versao"
            className="rounded underline underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            Notas da versão
          </a>
          <a
            href="https://github.com/jonasnunees/ContandoDinheiro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded hover:text-emerald-600 dark:hover:text-emerald-400 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
            aria-label="Projeto no GitHub (abre em uma nova aba)"
          >
            <Github className="w-4 h-4 shrink-0" aria-hidden="true" />
            Projeto no GitHub
          </a>
          <span aria-hidden="true">•</span>
          <button
            onClick={onOpenLogin}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
          >
            Login
          </button>
          <span>•</span>
          <button
            onClick={onOpenRegister}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
          >
            Cadastro
          </button>
          <span>•</span>
          <a
            href="/demo"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
          >
            Acessar Painel
          </a>
        </div>
      </div>
    </footer>
  );
}
