# AGENTS.md

Consignes pour les assistants IA qui travaillent sur ce dépôt.

## Build & dev

- Node >= 22. Aucune dépendance d’exécution ; seul `@playwright/test` est en devDependency.
- Dev : `npm run dev` génère `src/js/products.js` depuis l’API http://localhost:8000/ (`scripts/catalogue-api.cjs`, variable `CATALOGUE_API`) puis sert `src/` sur http://127.0.0.1:4200. Sans API : `npm run dev:csv`. Tests et build restent sur `catalogue/catalogue.csv`.
- Build : `npm run build` (`scripts/build.cjs`) copie `src/` puis `public/` dans `dist/`.
- `npm start` construit puis sert `dist/` avec les en-têtes de production.

## Tests

- `npm test` : `node --test tests/*.test.cjs` (structure HTML, ressources locales, CSP, catalogue).
- `npm run test:browser` : Playwright, projets `desktop` et `mobile` (iPhone 13).
  Le `webServer` reconstruit `dist/` avant de servir.
- Toute requête vers un autre hôte que 127.0.0.1:4200 fait échouer les tests navigateur.

## Architecture

- Une seule page : `src/index.html`. Pas de framework, pas de bundler.
- `src/js/config.js` définit `window.CATEGORIES` et `window.SHOP` ; `src/js/products.js` (généré) définit `window.PRODUCTS` ; `src/js/script.js`
  contient toute la logique (IIFE, scripts classiques `defer` — fonctionne aussi en `file://`).
- CSP stricte (`script-src 'self'; style-src 'self'`) dans la balise meta et dans `scripts/serve.cjs`.

## À faire / à ne pas faire

- Ne pas ajouter de script ou de style en ligne, ni d’attribut `style=` ou `onclick=` :
  appliquer les styles dynamiques via `element.style` (voir `renderProducts`).
- Ne pas charger de ressource externe (polices, CDN, analytics) sans mettre à jour la CSP et les tests.
- Ne jamais committer de secrets (`.env` est ignoré).
- Catalogue : source unique `catalogue/catalogue.csv` ; `src/js/products.js` est GÉNÉRÉ par `scripts/catalogue.cjs` (lancé par `pretest` et `build`) — ne jamais l’éditer à la main. Catégories et WhatsApp : `src/js/config.js`.
- Site bilingue FR/EN : tout nouveau texte visible reçoit `data-i18n` et une traduction dans `src/js/i18n.js` (sinon `npm test` échoue).
- Interface en français par défaut ; conserver les avertissements « version de présentation »
  tant que les commandes ne sont pas réellement transmises.
- Après toute modification : `npm test` puis `npm run test:browser`.
