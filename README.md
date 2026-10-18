# Commande & Livraison – Librairie Papeterie du Centre

**🌐 Voir le site : [leudjeu-hub.github.io/CommandeLivraisonLipaCentre](https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/)**

Site statique en français pour la **Librairie Papeterie du Centre** à Yaoundé (Cameroun).
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
- **Frais de livraison par quartier** (4 zones, 1 000 à 5 000 FCFA), affichés avant l’envoi ; grille modifiable dans `catalogue/livraison.csv`
- Récapitulatif envoyé par WhatsApp à la librairie, ou téléchargé / copié
- Site bilingue **français / anglais** (bouton de langue, choix mémorisé, lien direct `?lang=en`)
- Mise en page responsive (mobile, tablette, ordinateur)

## Structure du projet

```
.
├── src/                    # code source du site
│   ├── index.html          # la page
│   ├── css/style.css       # styles
│   ├── js/config.js        # catégories, numéro WhatsApp, règles de livraison
│   ├── js/delivery.js      # GÉNÉRÉ depuis catalogue/livraison.csv
│   ├── js/products.js      # GÉNÉRÉ depuis catalogue/catalogue.csv
│   ├── js/i18n.js          # traductions anglaises de la page et de l’interface
│   ├── js/script.js        # logique : catalogue, panier, formulaire
│   └── img/favicon.svg
├── public/                 # fichiers copiés tels quels dans dist/
│   └── robots.txt
├── catalogue/            # catalogue.csv (articles et prix) + LISEZMOI.md
├── scripts/
│   ├── catalogue.cjs       # tableau CSV → src/js/products.js (avec vérifications)
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
npm run dev        # catalogue lu depuis l’API http://localhost:8000/, sert src/ sur http://127.0.0.1:4200
npm run dev:csv    # idem, mais catalogue lu depuis catalogue/catalogue.csv (sans API)
```

En développement, les articles viennent de l’API (`GET /products/`, adresse modifiable avec
`CATALOGUE_API=http://… npm run dev`) et passent par les mêmes vérifications que le tableau.
`npm test` et `npm run build` utilisent toujours `catalogue/catalogue.csv`.

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

Les articles se gèrent dans **`catalogue/catalogue.csv`**, un tableau à ouvrir avec Excel, Numbers
ou Google Sheets (mode d’emploi : [`catalogue/LISEZMOI.md`](catalogue/LISEZMOI.md)).

```sh
# après avoir modifié et enregistré le tableau :
npm test       # régénère src/js/products.js et vérifie le catalogue (ligne exacte en cas d’erreur)
git add -A && git commit -m "catalogue : mise à jour" && git push
```

- Prix vide → article « sur devis » ; `disponible` = `non` → article masqué.
- Traduction anglaise facultative (repli sur le français).
- `src/js/products.js` est **généré** : ne pas le modifier à la main.
- Catégories et numéro WhatsApp : `src/js/config.js`.

## Traductions

Le français est écrit directement dans `src/index.html`. Chaque texte traduisible porte
`data-i18n="clé"` ; sa version anglaise se trouve dans `src/js/i18n.js` (`PAGE.en`).
Les textes générés par le JavaScript (boutons, messages, récapitulatif) sont dans `UI.fr` / `UI.en`,
et les noms d’articles anglais dans le champ `en` de chaque produit.
`npm test` échoue si une traduction manque.

## Avant l’ouverture commerciale

- [x] Renseigner adresse et téléphone professionnels
- [ ] Intégrer les vrais articles, prix et stocks
- [x] Transmettre les commandes par WhatsApp (numéro dans `src/js/products.js` → `SHOP.whatsapp`)
- [x] Définir les zones et frais de livraison (à valider avec le livreur)
- [ ] Faire valider mentions légales, conditions de vente et confidentialité
- [ ] Choisir un hébergement et autoriser l’indexation (`public/robots.txt`)
- [ ] Choisir une licence

## Auteur

Alain Bienvenu Leudjeu

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` teste, construit puis publie `dist/` à chaque
push sur `main`. Adresse : <https://leudjeu-hub.github.io/CommandeLivraisonLipaCentre/>

Configuration initiale (une seule fois) : **Settings → Pages → Build and deployment →
Source : GitHub Actions**.
