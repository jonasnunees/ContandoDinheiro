import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ThemeProvider} from './context/ThemeContext';
import './index.css';

// Encontra o espaço da página onde o React desenha o aplicativo.
// O ThemeProvider permite que todas as telas compartilhem o tema claro ou escuro.
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
