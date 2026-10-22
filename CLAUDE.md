# CLAUDE.md — Librairie Papeterie du Centre

Site de commande et de livraison de la Librairie Papeterie du Centre (Yaoundé, Cameroun).
Les règles détaillées (build, tests, architecture, à faire / à ne pas faire) sont dans
**[AGENTS.md](AGENTS.md)**. Lis-le avant toute modification.

## L’essentiel

- **Stack** : React 19 + TypeScript, Vite, MUI, react-router, i18next. Clients mobiles en 3G :
  pas de nouvelle dépendance sans accord explicite.
- **Fichiers** : `index.html` (racine, CSP), `src/main.tsx`, `src/App.tsx` (routes), `src/pages/`,
  `src/components/`, `src/context/CartContext.tsx` (panier),
  `src/data/catalogue.ts` (livraison, catégories, WhatsApp, frais),
  `src/data/useProducts.ts` (articles : uniquement l'API, dernière liste gardée dans le navigateur), `src/locales/{fr,en}.json` (traductions).
- **Commandes** : `npm run dev` · `npm test` · `npm run build` · `npm run test:browser`.
- **Avant de dire « terminé »** : `npm test` et `npm run test:browser` passent.
- **Interface en français**, montants en FCFA, numéros au format +237.
- **CSP stricte** (`index.html`, `scripts/serve.cjs`) : pas de script en ligne, pas de ressource
  externe ; `connect-src` limité au site et à l'API Render. Pas de `dangerouslySetInnerHTML`.
- **API** : locale en développement (`npm run dev`, http://localhost:8000), Render sur le site publié
  (connexion, comptes, articles ; voir AGENTS.md).
- **Déploiement** : GitHub Pages, automatiquement à chaque push sur `main`.

## Façon de travailler

- Comprendre avant de modifier ; suivre les conventions existantes ; changements petits et ciblés.
- Être honnête : si quelque chose n’a pas été testé, le dire.
- Outils du projet (voir `.claude/README.md`) :
  - `/ingenieur-exigences` : analyser une nouvelle fonctionnalité avant de coder ;
  - `/designer-web` : décisions et revues UI/UX avant de modifier le CSS ;
  - `/analyser-site` : audit complet du site avec rapport priorisé.
- Commits au format Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…).
