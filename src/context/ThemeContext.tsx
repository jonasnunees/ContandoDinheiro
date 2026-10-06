import { readStorage, writeStorage } from '../services/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// O contexto compartilha o tema entre componentes, sem passá-lo de tela em tela.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'gf_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Recupera a preferência salva apenas na primeira montagem deste componente.
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = readStorage(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Sem preferência salva, começa com o tema escuro.
    return 'dark';
  });

  // Quando o tema muda, atualiza as classes da página e salva a preferência no navegador.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.setAttribute('data-theme', theme);
    try { writeStorage(THEME_STORAGE_KEY, theme); } catch { /* A aparência muda mesmo se o navegador não permitir salvar a preferência. */ }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Dá acesso ao tema e aos comandos de troca dentro do ThemeProvider.
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
