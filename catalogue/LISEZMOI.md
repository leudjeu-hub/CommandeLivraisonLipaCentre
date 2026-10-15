# Catalogue des articles

**Tous les articles du site se gèrent dans `catalogue.csv`.** C’est un tableau qui s’ouvre
avec Excel, Numbers, LibreOffice ou Google Sheets. Inutile de toucher au code.

> ⚠️ Le tableau contient pour l’instant les **8 articles de démonstration** du site.
> Il faut le compléter avec les vrais articles et les vrais prix avant l’ouverture.

## Les colonnes

| Colonne | Obligatoire | À remplir | Exemple |
|---|---|---|---|
| `id` | oui | Numéro unique de l’article. **Ne jamais le changer ni le réutiliser** (les paniers des clients s’en servent). | `12` |
| `categorie` | oui | `Scolaire`, `Bureau` ou `Livres` | `Scolaire` |
| `prix` | oui* | Prix en FCFA, nombre entier. **Laisser vide** pour un article « sur devis ». | `1500` ou `1 500` |
| `nom` | oui | Nom affiché | `Cahier A4 · 200 pages` |
| `description` | oui | Une phrase courte | `Quadrillé, pour les cours.` |
| `vignette` | non | Texte sur l’image du produit, 2 lignes max séparées par ` / `. Vide = créé à partir du nom. | `CAHIER / 200 PAGES` |
| `nom_en` | non | Nom en anglais. Vide = le nom français est affiché aussi en anglais. | `A4 notebook` |
| `description_en` | non | Description en anglais (à remplir avec `nom_en`) | `Squared paper.` |
| `vignette_en` | non | Vignette en anglais | `NOTEBOOK / 200 PAGES` |
| `couleur` | non | Couleur de la vignette (`#RRGGBB`). Vide = couleur de la catégorie. | `#31574b` |
| `disponible` | non | `non` pour **masquer** un article (rupture de stock) sans le supprimer. Vide = `oui`. | `non` |

\* La colonne doit exister, mais la case peut être vide (= sur devis).

## Modifier le catalogue

1. Ouvrir `catalogue.csv` dans le tableur.
2. Ajouter, modifier ou masquer des lignes. Pour un nouvel article : prendre un `id` jamais utilisé.
3. Enregistrer **au format CSV** (garder le même nom de fichier ; séparateur `;` ou `,`, les deux sont acceptés) :
   - **Excel** : *Fichier → Enregistrer sous*, format **CSV UTF-8** ;
   - **Numbers** : *Fichier → Exporter vers → CSV…*, encodage **Unicode (UTF-8)** ;
   - **Google Sheets** : *Fichier → Télécharger → CSV*, puis remplacer `catalogue.csv`.
4. Vérifier puis publier :
   ```sh
   npm test
   git add catalogue/catalogue.csv src/js/products.js
   git commit -m "catalogue : mise à jour des prix"
   git push
   ```

`npm test` reconstruit le site à partir du tableau. **S’il y a une erreur, il indique la ligne
exacte** (prix non numérique, id en double, catégorie inconnue, nom vide…) et la mise en ligne
est bloquée : un tableau faux ne peut pas arriver sur le site public.

## Bon à savoir

- Le fichier `src/js/products.js` est **généré** à partir du tableau : ne pas le modifier à la main,
  il serait écrasé.
- Les accents s’affichent mal ? Le fichier a été enregistré dans un autre encodage :
  réenregistrer en **CSV UTF-8**.
- Ajouter une **nouvelle catégorie** demande un petit changement dans `src/js/config.js` et
  `src/js/i18n.js` (demander à Claude : `/ingenieur-exigences` ou directement).
