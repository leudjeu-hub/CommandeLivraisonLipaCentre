import fs from 'node:fs';
import path from 'node:path';
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

// GitHub Pages renvoie 404.html pour /catalogue, /panier… : une copie d'index.html laisse le routeur répondre
let outDir = 'dist';
const spaFallback: Plugin = {
  name: 'spa-fallback',
  apply: 'build',
  configResolved: (config) => {
    outDir = path.resolve(config.root, config.build.outDir);
  },
  closeBundle: () => fs.copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html')),
};

export default defineConfig({
  // Sur GitHub Pages, le site est servi sous /CommandeLivraisonLipaCentre/ (BASE_PATH, voir deploy.yml)
  base: process.env.BASE_PATH || '/',
  plugins: [react(), devCsp, spaFallback],
  server: {
    port: 4200,
    host: '127.0.0.1',
    proxy: { '/products/': API },
  },
  build: { outDir: 'dist' },
});
