# Commande & Livraison – Librairie Papeterie du Centre

**🌐 Voir le site : [leudjeu-hub.github.io/CommandeLivraisonLipaCentre](https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/)**

Site en français (React + TypeScript, Vite, MUI) pour la **Librairie Papeterie du Centre** à Yaoundé (Cameroun).
Les clients composent un panier de livres et de fournitures, indiquent leur adresse de
livraison et **envoient leur commande par WhatsApp** à la librairie, qui la confirme.

> **Statut : version de présentation.** Articles et prix illustratifs. Les commandes sont
> confirmées par la librairie ; aucun paiement n’est encaissé en ligne. Le site n’est pas
> indexé par les moteurs de recherche (`robots.txt`).

## Fonctionnalités

- Catalogue avec recherche et filtres (Scolaire, Bureau, Livres), prix en FCFA
- Panier mémorisé dans le navigateur (`localStorage`)
- Formulaire de livraison : quartier, repère, créneau, paiement à la réception
  (espèces, Orange Money, MTN MoMo)
- Demande de devis pour les listes scolaires et les livres « sur devis »
- **Frais de livraison par quartier** (4 zones, 1 000 à 5 000 FCFA), affichés avant l’envoi ; grille modifiable dans `src/data/catalogue.ts`
- Récapitulatif envoyé par WhatsApp à la librairie, ou téléchargé / copié
- Site bilingue **français / anglais** (bouton de langue, choix mémorisé)
- Mise en page responsive (mobile, tablette, ordinateur)

## Structure du projet

```
.
├── index.html              # page d'entrée (CSP, métadonnées)
├── src/
│   ├── main.tsx            # démarrage : thème MUI, routeur, panier
│   ├── App.tsx             # routes : /, /catalogue, /livraison, /panier, /commander
│   ├── pages/              # une page par route
│   ├── components/         # en-tête, pied de page, notifications…
│   ├── context/CartContext.tsx  # panier (mémorisé dans localStorage)
│   ├── data/catalogue.ts   # articles, zones de livraison, catégories, WhatsApp, calcul des frais
│   ├── data/useProducts.ts # articles : API en développement, catalogue.ts en production
│   ├── i18n.ts             # configuration i18next
│   └── locales/            # traductions fr.json / en.json
├── public/                 # copié tel quel dans dist/ : img/ (photos, logo, favicon), robots.txt
├── scripts/serve.cjs       # sert dist/ avec les en-têtes de sécurité (tests navigateur)
├── tests/
│   ├── site.test.cjs       # tests statiques (Node, sans navigateur)
│   ├── fees.test.cjs       # calcul des frais de livraison
│   └── browser/site.spec.cjs  # tests navigateur (Playwright, desktop + mobile)
├── .github/workflows/      # main.yml : vérifications ; deploy.yml : GitHub Pages
├── vite.config.ts · tsconfig.json · playwright.config.cjs · package.json
├── AGENTS.md               # consignes pour les assistants IA (Claude, etc.)
└── dev.md                  # notes personnelles d’apprentissage
```

## Développement

Prérequis : **Node.js 22.18** ou plus récent.

```sh
npm install
npm run dev        # http://127.0.0.1:4200, articles lus depuis l’API http://localhost:8000/
```

En développement, les articles viennent de l’API (`GET /products/`, relayée par Vite ; adresse
modifiable avec `CATALOGUE_API=http://… npm run dev`). Si l’API est arrêtée, le site affiche les
articles de `src/data/catalogue.ts` (avertissement dans la console). Le site publié utilise
toujours `src/data/catalogue.ts`.

## Vérification

```sh
npm run build                # construit dist/
npm test                     # tests statiques (après le build : ils vérifient dist/)
npx playwright install chromium   # une fois
npm run test:browser         # tests navigateur sur dist/ (desktop + mobile)
```

Les tests vérifient notamment : aucune ressource externe ni script en ligne (CSP), des
traductions FR/EN complètes, le calcul des frais de livraison, et le parcours complet
catalogue → panier → formulaire → message WhatsApp.

## Modifier le catalogue

Articles, prix, zones de livraison, catégories et numéro WhatsApp : **`src/data/catalogue.ts`**.

- `price: null` → article « sur devis » ; champ `en` facultatif (repli sur le français).
- Photos : déposer le fichier dans `public/img/produits/` et le référencer (`image: 'img/produits/….webp'`).
- Règles de livraison (gratuité, minimum de commande) : `DELIVERY_RULES`.

## Traductions

Les textes de l'interface sont dans `src/locales/fr.json` et `src/locales/en.json`
(utilisés via `t('clé')`). `npm test` échoue si une clé manque dans l'une des deux langues.

## Avant l’ouverture commerciale

- [x] Renseigner adresse et téléphone professionnels
- [ ] Intégrer les vrais articles, prix et stocks
- [x] Transmettre les commandes par WhatsApp (numéro dans `src/data/catalogue.ts` → `SHOP.whatsapp`)
- [x] Définir les zones et frais de livraison (à valider avec le livreur)
- [ ] Faire valider mentions légales, conditions de vente et confidentialité
- [ ] Choisir un hébergement et autoriser l’indexation (`public/robots.txt`)
- [ ] Choisir une licence

## Auteur

Alain Bienvenu Leudjeu

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit (sous `/CommandeLivraisonLipaCentre/`), teste puis publie `dist/` à chaque
push sur `main`. Adresse : <https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/>

Configuration initiale (une seule fois) : **Settings → Pages → Build and deployment →
Source : GitHub Actions**.
