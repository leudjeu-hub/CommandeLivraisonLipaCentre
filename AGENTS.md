# AGENTS.md

Consignes pour les assistants IA qui travaillent sur ce dépôt.

## Build & dev

- Node >= 22. React 19 + TypeScript, Vite, MUI, react-router, i18next.
- Dev : `npm run dev` (Vite) sert l’application sur http://127.0.0.1:4200.
- Build : `npm run build` (`tsc -b && vite build`) produit `dist/`. `npm run preview` le sert.
- Images (photos, logo, favicon) : `public/img/`, copiées telles quelles dans `dist/img/`. Dans le code,
  les préfixer par `import.meta.env.BASE_URL` (le site publié vit sous `/CommandeLivraisonLipaCentre/`).
- GitHub Pages : `deploy.yml` construit avec `BASE_PATH=/CommandeLivraisonLipaCentre/` ; le build copie
  `index.html` en `404.html` pour que les liens directs (`/catalogue`, `/panier`…) fonctionnent.
  Navigation interne : toujours via react-router (`Link`, `navigate`), jamais `window.location`.

## Catalogue et API

- API (dépôt `CommandeLivraisonLipaCentreBackend`) : en développement l'API locale, relayée par le
  proxy Vite (`CATALOGUE_API=http://… npm run dev`) ; sur le site publié l'API Render
  https://papeterie-api-kshr.onrender.com, appelée directement (`PROD_API_URL` au build). Le préfixe
  est `import.meta.env.VITE_API_URL` (défini dans `vite.config.ts`, vide en dev) ; le plugin `api-csp`
  ajoute l'API à `connect-src` du build, et `scripts/serve.cjs` reprend la CSP du `index.html` construit.
- Articles : `useProducts()` (`src/data/useProducts.ts`) affiche d'abord `src/data/catalogue.ts`, puis les
  articles de `GET /products/` dès qu'ils arrivent (serveur Render en veille : ~40 s). API injoignable →
  avertissement console, `catalogue.ts` reste affiché. Zones de livraison, catégories et WhatsApp :
  `src/data/catalogue.ts`.
- Ne pas importer `PRODUCTS` directement dans une page : passer par `useProducts()`.
- Comptes : `/connexion`, `/inscription`,
  `/compte` (`src/pages/AuthPage.tsx`, `AccountPage.tsx`), session dans `src/context/AuthContext.tsx`
  (jeton `centre-auth-token` dans localStorage, envoyé en `Authorization: Bearer` par `request()` de
  `src/data/productsApi.ts`). Rôles : `user` (client) et `admin`. Commander reste possible sans compte.
- Gestion (articles et utilisateurs) : `/gestion` (`src/pages/AdminPage.tsx`), **administrateurs
  uniquement** (l'API le vérifie aussi). Premier admin : `uv run python -m app.scripts.create_admin`
  dans le dépôt de l'API ; un admin peut ensuite en promouvoir d'autres (onglet « Utilisateurs »).
- Tests : projet Playwright `admin` (Vite sur 4201, API simulée : `admin.spec.cjs`, `auth.spec.cjs`) ;
  `site.spec.cjs` (build de production) simule l'API Render (indisponible par défaut, `mockApi()`).
  `npm test` vérifie que le build n'appelle que l'API Render (CSP, pas de `localhost:8000`).
- Les zones de livraison ne viennent pas de l’API (elle n’en fournit pas).

## Tests

- `npm test` : `node --test tests/*.test.cjs` (structure HTML, ressources, catalogue, traductions, frais).
- `npm run test:browser` : Playwright, projets `desktop` et `mobile` (iPhone 13).
  Le `webServer` lance `npm run build` puis `scripts/serve.cjs dist` (en-têtes de production).
- Toute requête vers un autre hôte que 127.0.0.1:4200 fait échouer les tests navigateur.

## À faire / à ne pas faire

- Pas de script en ligne ni de ressource externe (polices, CDN, analytics) sans mettre à jour la CSP et les tests.
  Styles : `style-src 'self' 'unsafe-inline'` (MUI/Emotion injecte ses styles) ; scripts : `'self'` uniquement.
- Ne jamais committer de secrets (`.env` est ignoré).
- Site bilingue FR/EN : tout nouveau texte visible passe par `t('…')` avec une clé dans
  `src/locales/fr.json` et `src/locales/en.json`.
- Interface en français par défaut ; conserver les avertissements « version de présentation »
  tant que les commandes ne sont pas réellement transmises.
- Après toute modification : `npm test` puis `npm run test:browser`.
