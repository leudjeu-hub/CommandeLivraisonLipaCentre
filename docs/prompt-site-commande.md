# Prompt : créer un site de commande et livraison (modèle LIPACE)

À copier dans Claude Code, ouvert dans un dossier vide (ou un dépôt GitHub vide).
Adapter d'abord la section « Données de la boutique ». Tout le reste vient des décisions
et des erreurs du projet LIPACE.

---

## Rôle

Tu es développeur web senior et designer UI/UX. Tu construis un site de commande pour un
petit commerce africain dont les clients sont sur téléphone. Sois franc : si une de mes
demandes est inutile, risquée ou trop chère pour ce contexte, dis-le et propose mieux.

## Données de la boutique (à adapter)

- Nom : Librairie Papeterie du Centre — sigle LIPACE
- Activité : vente de papeterie, livres, fournitures de bureau ; livraison à domicile
- Adresse : Carrefour Abbia, face Manège, Yaoundé, Cameroun
- Téléphone et WhatsApp : +237 6 93 24 03 96 (format wa.me : 237693240396)
- Horaires : lundi–vendredi 08:00–18:00, samedi 09:00–15:00, dimanche fermé
- Paiement : à la livraison (espèces, Orange Money, MTN MoMo), aucun paiement en ligne
- Clients : parents (listes scolaires), élèves, entreprises ; Android d'entrée de gamme, 3G lente
- Langues : français (par défaut) et anglais
- Couleurs : bleu marine #16325c, crème #f7f4ec, ocre #e5ab55 ; logo fourni dans `logo/`
- Livraison (zones par quartier) :
  1 Centre 1 000 FCFA · 2 Proche 2 000 · 3 Éloigné 3 000 · 4 Périphérie 5 000 ;
  offerte dès 25 000 FCFA en zones 1–2 ; commande minimum 2 000 FCFA
- Catalogue : je fournis `catalogue.csv` ; sinon crée 8 articles de démonstration
  clairement signalés comme tels

## Objectif

Le client doit passer de « je cherche un cahier » à « ma commande est partie sur WhatsApp »
en moins d'une minute, sur un téléphone de 360 px. Tout ce qui ne sert pas ce parcours attend.

## Contraintes techniques (non négociables)

- HTML, CSS et JavaScript **sans framework ni bundler** (pas de React, pas de TypeScript).
  Seule dépendance de développement : Playwright pour les tests.
- Page complète < 100 Ko ; aucune police, CDN, image ou script externe.
- CSP stricte (`script-src 'self'; style-src 'self'`) : pas de script ni de style en ligne,
  pas d'attribut `style=` ou `onclick=` ; styles dynamiques via `element.style`.
- Tout texte inséré avec `innerHTML` passe par une fonction `escapeHtml`.
- Données séparées du code : `catalogue/catalogue.csv` et `catalogue/livraison.csv`
  (séparateur `;` ou `,`, UTF-8), convertis par un script Node qui **refuse les erreurs
  avec le numéro de ligne** (id en double, prix invalide, quartier dans deux zones…).
  Réglages (WhatsApp, catégories, règles de livraison) dans `src/js/config.js`.
- Bilingue : texte français dans le HTML (`data-i18n="clé"`), traductions dans `src/js/i18n.js` ;
  choix mémorisé, lien direct `?lang=en` ; un test échoue si une clé manque.
- Hébergement GitHub Pages via GitHub Actions : tests puis publication, rien n'est publié si un test échoue.

## Fonctionnalités

**Indispensables**
1. Catalogue avec recherche insensible aux accents et filtres par catégorie ; prix vide = « sur devis ».
2. Panier mémorisé (`localStorage`), quantités, minimum de commande.
3. Formulaire : nom, téléphone, quartier (liste par zone + « Autre »), repère, créneau, paiement ;
   frais de livraison et total affichés dès le choix du quartier.
4. Récapitulatif envoyé par bouton « Envoyer par WhatsApp » (lien wa.me pré-rempli),
   plus Télécharger / Copier ; proposer (jamais automatiquement) de vider le panier après l'envoi.
5. Demande de devis pour les listes scolaires.
6. Pied de page : adresse, téléphone cliquable, horaires ; bouton flottant « Nous trouver » (Google Maps).

**Importantes**
7. En-tête collant avec menu ☰ sur mobile ; grille des frais dans la section Livraison.
8. Aperçu de partage (Open Graph, image PNG 1200×630), favicon, icône d'écran d'accueil.

## Qualité exigée

- Accessibilité WCAG 2.2 AA : un seul `<h1>`, labels, focus clavier visible, contraste ≥ 4,5:1
  (texte) et ≥ 3:1 (bordures de champs), **cibles tactiles ≥ 44 px**.
- Rien ne dépasse de l'écran à **320 et 360 px** de large.
- Tests : `npm test` (structure HTML, ressources locales, catalogue, traductions, générateurs)
  et `npm run test:browser` (Playwright, ordinateur + iPhone : parcours complet jusqu'au lien
  WhatsApp, frais par zone, gratuité, minimum, menu, fenêtres et leur fond sombre, largeur 320 px).
- Chaque bug corrigé reçoit un test qui l'aurait détecté.

## Structure attendue

```
src/  index.html · css/style.css · js/{config,i18n,script}.js · js/{products,delivery}.js (générés) · img/
catalogue/  catalogue.csv · livraison.csv · LISEZMOI.md (mode d'emploi pour le personnel)
scripts/  catalogue.cjs · build.cjs · serve.cjs
tests/  site.test.cjs · browser/site.spec.cjs
.github/workflows/  main.yml · deploy.yml
README.md · AGENTS.md · CLAUDE.md · .gitignore
```

## Méthode de travail

1. Avant de coder : reformule le besoin en 5 lignes et liste au maximum 5 questions
   bloquantes. Pour le reste, fais des hypothèses explicites et continue.
2. Construis par étapes testables (squelette → catalogue → panier → formulaire → WhatsApp
   → livraison → bilingue → finitions). Après chaque étape : tests, puis capture à 360 px.
3. N'invente jamais une donnée présentée comme réelle (prix, numéro, adresse) : marque-la
   « démonstration » ou demande-la.
4. Ne dis pas « terminé » sans avoir lancé les deux suites de tests. Si tu n'as pas pu
   vérifier quelque chose (vrai téléphone, envoi WhatsApp réel), dis-le.
5. Ne committe pas et ne pousse pas sans que je le demande ; donne-moi la commande.

## Format de ta réponse finale

- Ce qui a été construit (5 lignes maximum) et comment l'ouvrir en local.
- Hypothèses prises et points à valider par la boutique.
- Résultat des tests (nombre) et limites de la vérification.
- Les 3 prochaines améliorations au meilleur rapport impact / effort.
