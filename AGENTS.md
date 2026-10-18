# AGENTS.md

Consignes pour les assistants IA qui travaillent sur ce dépôt.

## Build & dev

- Node >= 22. React 19 + TypeScript, Vite, MUI, react-router, i18next.
- Dev : `npm run dev` (Vite) sert l’application sur http://127.0.0.1:4200.
- Build : `npm run build` (`tsc -b && vite build`) produit `dist/`. `npm run preview` le sert.

## Catalogue et API

- Production : articles, zones de livraison, catégories et numéro WhatsApp dans `src/data/catalogue.ts`.
- Développement : les pages lisent les articles via `useProducts()` (`src/data/useProducts.ts`),
  qui appelle `GET /products/`. Vite relaie `/products/` vers l’API http://localhost:8000
  (`vite.config.ts`, modifiable : `CATALOGUE_API=http://… npm run dev`). En dev seulement, la CSP
  passe à `connect-src 'self'` (plugin `dev-csp`). API injoignable → avertissement console et
  repli sur `catalogue.ts`. Le code d’appel à l’API est retiré du build de production.
- Ne pas importer `PRODUCTS` directement dans une page : passer par `useProducts()`.
- Les zones de livraison ne viennent pas de l’API (elle n’en fournit pas).

## Tests

- `npm test` : `node --test tests/*.test.cjs` (structure HTML, ressources, catalogue, traductions, frais).
- `npm run test:browser` : Playwright, projets `desktop` et `mobile` (iPhone 13).
  Le `webServer` lance `npm run build` puis `scripts/serve.cjs dist` (en-têtes de production).
- Toute requête vers un autre hôte que 127.0.0.1:4200 fait échouer les tests navigateur.

## À faire / à ne pas faire

- Pas de script en ligne ni de ressource externe (polices, CDN, analytics) sans mettre à jour la CSP et les tests.
- Ne jamais committer de secrets (`.env` est ignoré).
- Site bilingue FR/EN : tout nouveau texte visible passe par `t('…')` avec une clé dans
  `src/locales/fr.json` et `src/locales/en.json`.
- Interface en français par défaut ; conserver les avertissements « version de présentation »
  tant que les commandes ne sont pas réellement transmises.
- Après toute modification : `npm test` puis `npm run test:browser`.
