import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    // Prepara o React, os estilos do Tailwind e a instalação do site como aplicativo.
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inline-app-styles',
        // O estilo da primeira tela acompanha o HTML, evitando uma espera extra na rede.
        apply: 'build',
        transformIndexHtml: {
          order: 'post',
          handler(html, context) {
            return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
              const href = tag.match(/href="([^"]+)"/)?.[1];
              const asset = href && context.bundle?.[href.replace(/^\//, '')];
              if (!asset || asset.type !== 'asset' || typeof asset.source !== 'string') return tag;
              return `<style>${asset.source.replace(/<\/style/gi, '<\\/style')}</style>`;
            });
          },
        },
      },
      VitePWA({
        // Atualiza o service worker automaticamente. O cache é dos arquivos da aplicação;
        // esta configuração não cria uma fila offline nem um cache de transações da conta.
        registerType: 'autoUpdate',
        workbox: {
          // Essas telas são guardadas para uso offline após o primeiro acesso,
          // em vez de disputar a conexão com a página inicial na instalação.
          globIgnores: [
            '**/AccountWorkspace-*.js',
            '**/FinancialCharts-*.js',
            '**/ReleaseNotes-*.js',
            '**/*.css',
          ],
          runtimeCaching: [
            {
              // Cotações pertencem exclusivamente ao cache em memória do conversor.
              urlPattern: /^https:\/\/economia\.awesomeapi\.com\.br\//,
              handler: 'NetworkOnly',
            },
            {
              // O Vite exige o CSS compartilhado ao abrir componentes sob demanda.
              urlPattern: /\/assets\/[^/]+\.css$/,
              handler: 'CacheFirst',
              options: { cacheName: 'app-styles', expiration: { maxEntries: 5 } },
            },
            {
              urlPattern: /\/assets\/(?:AccountWorkspace|FinancialCharts|ReleaseNotes)-[^/]+\.js$/,
              handler: 'CacheFirst',
              options: { cacheName: 'optional-screens', expiration: { maxEntries: 10 } },
            },
          ],
        },
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
