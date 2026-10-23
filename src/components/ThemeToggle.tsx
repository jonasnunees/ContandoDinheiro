import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  // Lê o tema compartilhado e usa o comando que alterna entre claro e escuro.
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center relative group ${
        isLight
          ? 'bg-white border-slate-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300 shadow-sm'
          : 'bg-slate-900 border-slate-800 text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 hover:border-slate-700'
      } ${className}`}
      title={
        isLight
          ? 'Tema Claro ativo — Clique para Tema Escuro'
          : 'Tema Escuro ativo — Clique para Tema Claro'
      }
      aria-label={isLight ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      {isLight ? (
        <Sun className="w-4 h-4 transition-transform group-hover:rotate-45 text-amber-800" />
      ) : (
        <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12 text-indigo-300" />
      )}
    </button>
  );
};
