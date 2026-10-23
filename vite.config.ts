import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// API (articles, connexion, comptes).
// - Développement : l'API locale, relayée par le proxy Vite (CATALOGUE_API=http://… npm run dev).
// - Site publié : l'API sur Render, appelée directement (PROD_API_URL=https://… npm run build).
const DEV_API = process.env.CATALOGUE_API || 'http://localhost:8000';
const PROD_API = (process.env.PROD_API_URL || 'https://papeterie-api-kshr.onrender.com').replace(/\/$/, '');

// Build : la CSP autorise aussi l'API (connect-src) ; en développement, 'self' suffit (proxy)
const apiCsp: Plugin = {
  name: 'api-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace("connect-src 'self'", `connect-src 'self' ${PROD_API}`),
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

export default defineConfig(({ command }) => ({
  // Sur GitHub Pages, le site est servi sous /CommandeLivraisonLipaCentre/ (BASE_PATH, voir deploy.yml)
  base: process.env.BASE_PATH || '/',
  plugins: [react(), apiCsp, spaFallback],
  // Préfixe des appels à l'API (src/data/productsApi.ts) : vide en développement (même origine, proxy)
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify(command === 'build' ? PROD_API : '') },
  server: {
    port: 4200,
    host: '127.0.0.1',
    // /auth/… et /users/… : connexion et comptes (pages /connexion, /compte, /gestion) ; /time/… : pointage
    proxy: { '/products/': DEV_API, '/auth/': DEV_API, '/users/': DEV_API, '/time/': DEV_API },
  },
  // Icônes de la page de gestion (chargée à la demande) : pré-optimisées, sinon Vite les découvre
  // au premier affichage, recharge la page et React plante (« useContext » de null)
  optimizeDeps: { include: ['@mui/icons-material/Add', '@mui/icons-material/Edit', '@mui/icons-material/Delete'] },
  build: {
    outDir: 'dist',
    // React dans un fichier à part : il change rarement, le navigateur le garde d'une mise en ligne
    // à l'autre. (Pas MUI : regroupé, il ramènerait dans la première visite les composants des
    // pages chargées à part.)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
}));
