# AGENTS.md

Consignes pour les assistants IA qui travaillent sur ce dépôt.

## Build & dev

- Node >= 22. React 19 + TypeScript, Vite, MUI, react-router, i18next.
- Dev : `npm run dev` (Vite) sert l’application sur http://127.0.0.1:4200.
- Build : `npm run build` (`tsc -b && vite build`) produit `dist/`. `npm run preview` le sert.
- Poids (clients en 3G) : seul l'accueil est dans le fichier principal ; les autres pages sont chargées
  à part (`lazy` dans `src/App.tsx`) et celles du parcours de commande préchargées après l'affichage.
  React et react-router sont dans un fichier `react-*.js` séparé (gardé en cache d'une mise en ligne à
  l'autre). Avant React, `#root` contient un écran statique (`index.html` + `src/shell.css` : titre,
  WhatsApp, téléphone), remplacé au premier rendu ; c'est aussi la page vue sans JavaScript. Ne pas regrouper MUI dans un fichier à part : cela ramènerait tous ses composants dans la
  première visite.
- Images (photos, logo, favicon) : `public/img/`, copiées telles quelles dans `dist/img/`. Dans le code,
  les préfixer par `import.meta.env.BASE_URL` (le site publié vit sous `/CommandeLivraisonLipaCentre/`).
- Photos par famille d'articles : `public/img/produits/famille-*.webp` (Unsplash, 480 × 480), liste et crédits
  des photographes dans `src/data/photosFamilles.ts`. Une photo par famille, pas une par article.
- GitHub Pages : `deploy.yml` construit avec `BASE_PATH=/CommandeLivraisonLipaCentre/` ; le build copie
  `index.html` en `404.html` pour que les liens directs (`/catalogue`, `/panier`…) fonctionnent.
  Navigation interne : toujours via react-router (`Link`, `navigate`), jamais `window.location`.

## Catalogue et API

- API (dépôt `CommandeLivraisonLipaCentreBackend`) : en développement l'API locale, relayée par le
  proxy Vite (`CATALOGUE_API=http://… npm run dev`) ; sur le site publié l'API Render
  https://papeterie-api-kshr.onrender.com, appelée directement (`PROD_API_URL` au build). Le préfixe
  est `import.meta.env.VITE_API_URL` (défini dans `vite.config.ts`, vide en dev) ; le plugin `api-csp`
  ajoute l'API à `connect-src` du build, et `scripts/serve.cjs` reprend la CSP du `index.html` construit.
- Articles : `useCatalogue()` / `useProducts()` (`src/data/useProducts.ts`). La dernière liste reçue de
  `GET /products/` est gardée dans localStorage (`centre-catalogue`) et affichée tout de suite au retour,
  puis remplacée par la réponse de l'API (serveur Render en veille : ~40 s). Première visite : la copie
  `catalogue.json` publiée avec le site s'affiche (statut `cache`) en attendant l'API ; sans copie, statut
  `loading` (« Chargement du catalogue… », avec un lien WhatsApp) ; `GET /products/` est abandonné après
  60 s (`PRODUCTS_TIMEOUT`). API injoignable et ni mémoire ni copie → statut `unavailable` :
  message avec « Commander par WhatsApp » et « Réessayer » (`src/components/CatalogueUnavailable.tsx`),
  jamais d'articles inventés (décision d'Alain, 2026-10-22 ; `catalogue.ts` n'a plus d'articles).
- Copie du catalogue (décision d'Alain, 2026-10-25) : `public/catalogue.json` vaut `[]` dans le dépôt
  et dans les tests ; `deploy.yml` la remplit après le build avec `scripts/catalogue-snapshot.mjs`
  (`GET /products/`, articles disponibles, sans `stock`), à chaque push et toutes les 3 heures. API
  injoignable au déploiement → copie vide, le déploiement continue. Les prix de la copie peuvent dater
  de 3 h : l'API les remplace dès qu'elle répond, et `POST /orders/submit` recalcule les prix.
- Réveil de l'API : `.github/workflows/reveil-api.yml` appelle `GET /` toutes les 10 min de 5 h à 23 h
  (heure de Yaoundé) pour que Render ne se mette pas en veille (~570 h/mois sur 750 h gratuites).
- Catalogue (~1 500 articles) : `/catalogue` affiche 24 cartes puis « Afficher plus » ; Gestion > Articles
  50 lignes, avec une recherche (nom, n°, famille). Ne jamais afficher toute la liste d'un coup (téléphones
  d'entrée de gamme en 3G). Zones de livraison, catégories et WhatsApp :
  `src/data/catalogue.ts`.
- Familles (sous-catégories, champ `family` de l'API, texte libre) : sur `/catalogue`, une 2e ligne de puces
  filtre par famille dans la catégorie choisie, et les articles sont affichés par sections (une par famille,
  « Autres articles » à la fin). Sans aucune famille, affichage à plat.
- Articles : toujours via `useCatalogue()` / `useProducts()`. Tests navigateur : `tests/browser/products.json`
  (8 articles au format de l'API) est servi par défaut pour `GET /products/`.
- Comptes : `/connexion`, `/inscription`,
  `/compte` (`src/pages/AuthPage.tsx`, `AccountPage.tsx`), session dans `src/context/AuthContext.tsx`
  (jeton `centre-auth-token` dans localStorage, envoyé en `Authorization: Bearer` par `request()` de
  `src/data/productsApi.ts`). Rôles : `user` (client) et `admin`. Commander reste possible sans compte.
  Seul un 401 de l'API efface la session ; API injoignable → session gardée, `SessionWait` propose de réessayer.
- Gestion (articles, commandes et utilisateurs) : `/gestion` (`src/pages/AdminPage.tsx`), **administrateurs
  uniquement** (les responsables n'y voient que les commandes et les heures) (l'API le vérifie aussi). Premier admin : `uv run python -m app.scripts.create_admin`
  dans le dépôt de l'API ; un admin peut ensuite en promouvoir d'autres (onglet « Utilisateurs »).
- Commandes : le formulaire (`CheckoutPage.tsx`) enregistre chaque commande ou devis via le
  `POST /orders/submit` public de l'API (`src/data/ordersApi.ts`), une fois par récapitulatif, au premier
  envoi (WhatsApp, e-mail, copie, téléchargement), sans attendre la réponse (`keepalive`) : API en veille
  ou en erreur → la commande part quand même par WhatsApp / e-mail. Pas de retrait de stock. Gestion >
  Commandes (`src/pages/OrdersAdmin.tsx`, admins et responsables) : filtre par statut (« À traiter » = nouvelle +
  confirmée), détail, changement de statut, lien WhatsApp vers le client. Les commandes annulées
  sont supprimées par l'API 30 jours après l'annulation (date affichée sur la commande).
- Import / export CSV des articles (Gestion > Articles, `src/pages/CatalogueImport.tsx`) : l'export et le modèle
  sont générés dans le navigateur (`;`, BOM UTF-8 pour Excel) ; l'import envoie le texte du fichier à
  `POST /products/import` (aperçu `dry_run`, puis import). C'est l'API qui vérifie et renvoie les erreurs par
  ligne sous forme de codes, traduits par `admin.importErr.*`. Fichier non UTF-8 → relu en Windows-1252.
- Rôles : `user` (client), `employee`, `manager` (responsable : onglets « Commandes » et « Heures » de `/gestion`,
  ne corrige pas ses propres heures), `admin`. Un admin bloque / débloque ou supprime un compte
  (Gestion > Utilisateurs) ; l'API refuse de supprimer un compte qui a des heures (409 → le bloquer).
- Pointage des employés : rôle `employee` (attribué dans Gestion > Utilisateurs). Sur `/compte`,
  `src/components/TimeClock.tsx` (entrée / sortie, totaux jour, semaine, mois) ; dans `/gestion`, onglet
  « Heures » (`src/pages/HoursAdmin.tsx` : totaux par employé, détail, correction, export CSV). API `/time/…`
  via `src/data/timeApi.ts`. L'heure est celle du serveur ; une pause = sortie puis entrée (non comptée) ;
  un pointage ouvert depuis plus de 14 h est signalé et non compté.
- Tests : projet Playwright `admin` (Vite sur 4201, API simulée : `admin.spec.cjs`, `auth.spec.cjs`, `time.spec.cjs`) ;
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
