import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { DELIVERY, DELIVERY_RULES } from './src/data/catalogue';

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

// Une copie d'index.html par page (catalogue.html…) : GitHub Pages sert /catalogue avec un code 200,
// donc les moteurs de recherche indexent la page, avec son propre titre et sa propre description.
// Les pages sans intérêt pour la recherche (panier, compte, gestion…) sont marquées noindex.
// 404.html (copie aussi) laisse le routeur répondre pour toute autre adresse.
const SITE_URL = 'https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/';
const fr = JSON.parse(fs.readFileSync(new URL('./src/locales/fr.json', import.meta.url), 'utf8'));
const PAGES: { route: string; title: string; description?: string; noindex?: boolean }[] = [
  { route: 'catalogue', title: fr.seo.catalogue, description: 'Cahiers, stylos, géométrie, papier, classement, dictionnaires, livres scolaires, sacs et cartables : prix en FCFA. Livraison à Yaoundé, paiement à la réception.' },
  { route: 'livraison', title: fr.seo.delivery, description: deliveryDescription() },
  { route: 'panier', title: fr.seo.cart, noindex: true },
  { route: 'commander', title: fr.seo.order, noindex: true },
  { route: 'connexion', title: fr.seo.other, noindex: true },
  { route: 'inscription', title: fr.seo.other, noindex: true },
  { route: 'compte', title: fr.seo.other, noindex: true },
  { route: 'gestion', title: fr.seo.other, noindex: true },
];
// Chiffres tirés de la grille de livraison (src/data/catalogue.ts), comme sur la page
function deliveryDescription() {
  const fees = DELIVERY.map((z) => z.fee);
  const fcfa = (n: number) => n.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  const sameDay = DELIVERY.filter((z) => z.en.delay === 'Same day').map((z) => z.name).join(' et ');
  return `Frais de livraison par quartier à Yaoundé, de ${fcfa(Math.min(...fees))} à ${fcfa(Math.max(...fees))}, le jour même en zones ${sameDay}, offerte dès ${fcfa(DELIVERY_RULES.freeFrom)}. Paiement à la réception.`;
}
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let outDir = 'dist';
const spaFallback: Plugin = {
  name: 'spa-fallback',
  apply: 'build',
  configResolved: (config) => {
    outDir = path.resolve(config.root, config.build.outDir);
  },
  closeBundle: () => {
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    fs.writeFileSync(path.join(outDir, '404.html'), html.replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex" />'));
    for (const page of PAGES) {
      let out = html
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escapeAttr(page.title)}`)
        .replace(/(<link rel="canonical" href=")[^"]*/, `$1${SITE_URL}${page.route}`)
        .replace(/(<meta property="og:url" content=")[^"]*/, `$1${SITE_URL}${page.route}`);
      if (page.description) out = out.replace(/(<meta name="description" content=")[^"]*/, `$1${escapeAttr(page.description)}`);
      if (page.noindex) out = out.replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex" />');
      fs.writeFileSync(path.join(outDir, `${page.route}.html`), out);
    }
  },
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
