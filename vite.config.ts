import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    // Prepara o React, os estilos do Tailwind e a instalação do site como aplicativo.
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Atualiza o service worker automaticamente. O cache é dos arquivos da aplicação;
        // esta configuração não cria uma fila offline nem um cache de transações da conta.
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        // Define nome, ícones e aparência do aplicativo instalado.
        manifest: {
          id: '/',
          name: 'ContandoDinheiro — Gestão Financeira',
          short_name: 'ContandoDinheiro',
          description: 'Dashboard financeiro completo com Supabase, receitas, despesas e gráficos.',
          theme_color: '#047857',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // DISABLE_HMR=true desativa a atualização automática da tela no desenvolvimento.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Na mesma condição, para de observar arquivos para reduzir trabalho do servidor.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
