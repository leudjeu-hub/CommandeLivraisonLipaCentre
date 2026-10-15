---
description: Analyse complète du site (design, ergonomie mobile, accessibilité, performance, contenu, parcours de commande) avec un rapport priorisé
argument-hint: "[zone ou thème à approfondir, ex. : mobile, panier, accessibilité]"
---

# Analyser le site de la Librairie Papeterie du Centre

Fais une analyse complète et **honnête** du site. Ne modifie aucun fichier du site pendant
l'analyse : tu produis un rapport, les corrections viennent ensuite si je les demande.

Point d'attention demandé : **$ARGUMENTS** (si vide : analyse générale).

Adopte deux regards :
- le skill **designer-web** (`.claude/skills/designer-web/SKILL.md`) pour l'interface et l'ergonomie ;
- le skill **ingenieur-exigences** (`.claude/skills/ingenieur-exigences/SKILL.md`) pour le besoin métier,
  les cas oubliés et la testabilité.

## Étapes

1. **Contexte** : lis `README.md`, `AGENTS.md`, `CLAUDE.md`, puis `src/index.html`,
   `src/css/style.css`, `src/js/script.js`, `src/js/products.js`, `src/js/i18n.js`.

2. **Santé technique** : lance `npm test` puis `npm run test:browser`. Note tout échec.
   Si Playwright n'est pas installé : `npm install && npx playwright install chromium`.

3. **Captures et mesures** :
   - `npm start` dans un terminal séparé (site sur http://127.0.0.1:4200) ;
   - `node .claude/scripts/captures.cjs` → images dans `captures/` (360, 768, 1280 px, FR et EN)
     et `captures/rapport.json` (poids, débordement horizontal, cibles tactiles trop petites) ;
   - regarde chaque capture, n'invente rien que tu n'as pas vu.

4. **Analyse**, axe par axe :
   - **Parcours de commande** : du premier écran à l'envoi WhatsApp, combien d'étapes, où ça bloque ?
     Teste aussi la demande de devis, le panier vide, une recherche sans résultat.
   - **Design et hiérarchie** : l'action principale est-elle évidente ? Cohérence des couleurs, tailles, espacements.
   - **Mobile** : 360 px, cibles tactiles, en-tête collant, menu, longueur des formulaires.
   - **Accessibilité (WCAG 2.2 AA)** : contrastes (calcule les ratios des couleurs de `:root`),
     labels, focus clavier, `lang`, textes alternatifs, ordre de lecture.
   - **Performance** : poids total, nombre de requêtes, ressources bloquantes.
   - **Bilingue** : textes non traduits, débordements en FR ou EN, cohérence du vocabulaire.
   - **Contenu et confiance** : prix, frais, horaires, adresse, mentions « démonstration » encore justifiées ?
   - **SEO de base** : titre, description, `noindex` (voulu tant que le site est en démonstration).
   - **Sécurité / confidentialité** : CSP, données envoyées, stockage local.

5. **Rapport** au format ci-dessous, en français, enregistré dans
   `docs/analyses/analyse-AAAA-MM-JJ.md` (crée le dossier si besoin), puis résumé dans la réponse.

## Format du rapport

~~~markdown
# Analyse du site — <date>

## Verdict
Note globale /10 et 3 phrases franches.

## Notes par axe
| Axe | Note /10 | En une phrase |
|---|---|---|

## Problèmes priorisés
| # | Gravité | Axe | Problème constaté (où, comment le reproduire) | Recommandation | Effort S/M/L |
|---|---|---|---|---|---|

## Points forts à préserver

## Plan d'action
1. Cette semaine (fort impact, faible effort)
2. Ce mois-ci
3. Plus tard / à décider

## Limites de l'analyse
Ce qui n'a pas pu être vérifié (ex. : vrai téléphone Android, vraie 3G, envoi WhatsApp réel).
~~~

## Règles

- Chaque problème doit être **constaté** (capture, mesure, ligne de code), pas supposé.
- Distingue clairement **bloquant**, **majeur** et **mineur**.
- Pas plus de 15 problèmes : regroupe, ne fais pas de liste interminable.
- Termine en proposant de corriger les 3 premiers points du plan d'action.
