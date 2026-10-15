# Commande & Livraison – Librairie Papeterie du Centre

Site statique en français pour la **Librairie Papeterie du Centre** à Yaoundé (Cameroun).
Les clients composent un panier de livres et de fournitures, indiquent leur adresse de
livraison et obtiennent un **récapitulatif à télécharger ou copier**, à transmettre à la
librairie par téléphone ou WhatsApp.

> **Statut : version de présentation.** Articles et prix illustratifs. Aucune commande
> n’est transmise et aucun paiement n’est encaissé. Le site n’est pas indexé (`robots.txt`).

## Fonctionnalités

- Catalogue avec recherche et filtres (Scolaire, Bureau, Livres), prix en FCFA
- Panier mémorisé dans le navigateur (`localStorage`)
- Formulaire de livraison : quartier, repère, créneau, paiement à la réception
  (espèces, Orange Money, MTN MoMo)
- Demande de devis pour les listes scolaires et les livres « sur devis »
- Récapitulatif en `.txt` (téléchargement ou copie)
- Mise en page responsive (mobile, tablette, ordinateur)

## Structure du projet

```
.
├── src/                    # code source du site
│   ├── index.html          # la page
│   ├── css/style.css       # styles
│   ├── js/products.js      # catalogue (articles, prix, catégories)
│   ├── js/script.js        # logique : catalogue, panier, formulaire
│   └── img/favicon.svg
├── public/                 # fichiers copiés tels quels dans dist/
│   └── robots.txt
├── scripts/
│   ├── build.cjs           # construit dist/ (src/ + public/)
│   └── serve.cjs           # serveur local avec en-têtes de sécurité (CSP)
├── tests/
│   ├── site.test.cjs       # tests statiques (Node, sans navigateur)
│   └── browser/site.spec.cjs  # tests navigateur (Playwright, desktop + mobile)
├── .github/workflows/main.yml # CI : tests à chaque push / pull request
├── playwright.config.cjs
├── package.json
├── AGENTS.md               # consignes pour les assistants IA (Claude, etc.)
└── dev.md                  # notes personnelles d’apprentissage
```

## Développement

Prérequis : **Node.js 22** ou plus récent. Aucune dépendance n’est nécessaire pour
développer ; Playwright sert uniquement aux tests navigateur.

```sh
npm run dev        # sert src/ sur http://127.0.0.1:4200
```

On peut aussi ouvrir `src/index.html` directement dans le navigateur.

## Vérification

```sh
npm test                     # tests statiques
npm run build                # construit dist/
npm install                  # une fois, pour Playwright
npx playwright install chromium
npm run test:browser         # tests navigateur sur dist/
```

Les tests vérifient notamment : un seul `<h1>`, aucune ressource externe ni code en ligne
(compatibilité CSP), des identifiants et ancres valides, un catalogue cohérent, et le
parcours complet panier → formulaire → récapitulatif.

## Modifier le catalogue

Tout se trouve dans `src/js/products.js` :

```js
{ id: 1, name: 'Cahier A4 · 200 pages', cat: 'Scolaire',
  desc: 'Quadrillé, pour les cours et les exercices.',
  price: 1500, color: '#31574b', label: 'CAHIER\n200 PAGES' }
```

- `price: null` → article affiché « Sur devis »
- `cat` doit être une des catégories de `CATEGORIES`
- `id` doit être unique — `npm test` le vérifie

## Avant l’ouverture commerciale

- [x] Renseigner adresse et téléphone professionnels
- [ ] Confirmer si le +237 6 93 24 03 96 est aussi joignable sur WhatsApp
- [ ] Intégrer les vrais articles, prix et stocks
- [ ] Transmettre réellement les commandes (lien WhatsApp, e-mail ou back-end)
- [ ] Définir les zones et frais de livraison
- [ ] Faire valider mentions légales, conditions de vente et confidentialité
- [ ] Choisir un hébergement et autoriser l’indexation (`public/robots.txt`)
- [ ] Choisir une licence

## Auteur

Alain Bienvenu Leudjeu

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` teste, construit puis publie `dist/` à chaque
push sur `main`. Adresse : https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/

Configuration initiale (une seule fois) : **Settings → Pages → Build and deployment →
Source : GitHub Actions**.
