import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// API du catalogue en développement (adresse modifiable : CATALOGUE_API=http://… npm run dev)
const API = process.env.CATALOGUE_API || 'http://localhost:8000';

// En développement seulement : la CSP autorise les requêtes vers le site lui-même
// (articles via le proxy /products/, rechargement à chaud). La CSP de production reste connect-src 'none'.
const devCsp: Plugin = {
  name: 'dev-csp',
  apply: 'serve',
  transformIndexHtml: (html) => html.replace("connect-src 'none'", "connect-src 'self'"),
};

export default defineConfig({
  plugins: [react(), devCsp],
  server: {
    port: 4200,
    host: '127.0.0.1',
    proxy: { '/products/': API },
  },
  build: { outDir: 'dist' },
});
