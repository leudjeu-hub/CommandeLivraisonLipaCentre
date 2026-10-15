# CLAUDE.md — Librairie Papeterie du Centre

Site de commande et de livraison de la Librairie Papeterie du Centre (Yaoundé, Cameroun).
Les règles détaillées (build, tests, architecture, à faire / à ne pas faire) sont dans
**[AGENTS.md](AGENTS.md)**. Lis-le avant toute modification.

## L’essentiel

- **Stack** : HTML, CSS et JavaScript sans framework, sans bundler, sans dépendance d’exécution.
  Pas de TypeScript, pas de React : c’est un choix délibéré (une page, clients mobiles en 3G).
  N’en ajoute pas sans accord explicite.
- **Fichiers** : `src/index.html`, `src/css/style.css`, `src/js/script.js` (logique),
  `src/js/products.js` (catalogue et numéro WhatsApp dans `SHOP`).
- **Commandes** : `npm run dev` · `npm test` · `npm run build` · `npm run test:browser`.
- **Avant de dire « terminé »** : `npm test` et `npm run test:browser` passent.
- **Interface en français**, montants en FCFA, numéros au format +237.
- **CSP stricte** : pas de script ni de style en ligne, pas d’attribut `style=` ou `onclick=`,
  pas de ressource externe. Tout texte inséré via `innerHTML` passe par `escapeHtml`.
- **Déploiement** : GitHub Pages, automatiquement à chaque push sur `main`.

## Façon de travailler

- Comprendre avant de modifier ; suivre les conventions existantes ; changements petits et ciblés.
- Être honnête : si quelque chose n’a pas été testé, le dire.
- Outils du projet (voir `.claude/README.md`) :
  - `/ingenieur-exigences` : analyser une nouvelle fonctionnalité avant de coder ;
  - `/designer-web` : décisions et revues UI/UX avant de modifier le CSS ;
  - `/analyser-site` : audit complet du site avec rapport priorisé.
- Commits au format Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…).
