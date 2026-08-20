import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'AgapeFood',
        short_name: 'AgapeFood',
        description: 'Painel administrativo AgapeFood - pedidos, cardápio, caixa e gestão do restaurante.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // Nunca cacheia chamadas de API/socket - painel de pedido/caixa em tempo real nao pode
        // servir dado velho do cache. So os arquivos estaticos do build (JS/CSS/HTML) sao
        // pre-cacheados, com hash de conteudo, entao cada deploy novo invalida o cache sozinho.
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        runtimeCaching: []
      }
    })
  ],
  server: {
    port: 5173
  }
});
