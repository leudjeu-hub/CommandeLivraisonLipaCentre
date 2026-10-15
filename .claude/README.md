# Dossier `.claude`

Configuration de Claude Code pour ce projet.

```
.claude/
├── README.md                          # ce fichier
├── commands/
│   └── analyser-site.md               # /analyser-site : analyse complète + rapport priorisé
├── skills/
│   ├── ingenieur-exigences/SKILL.md   # /ingenieur-exigences : besoin → exigences testables
│   └── designer-web/SKILL.md          # /designer-web : revue et décisions UI/UX
└── scripts/
    └── captures.cjs                   # captures 360/768/1280 px FR+EN + mesures (utilisé par /analyser-site)
```

## Utilisation

Dans Claude Code, à la racine du projet :

| Commande | Quand l'utiliser |
|---|---|
| `/analyser-site` | Audit complet du site (design, mobile, accessibilité, performance, contenu) |
| `/analyser-site panier` | Audit centré sur une zone ou un thème |
| `/designer-web <question>` | Avis ou proposition design avant de toucher au CSS |
| `/ingenieur-exigences <idée>` | Transformer une idée de fonctionnalité en exigences avant de coder |

Les skills se déclenchent aussi automatiquement quand la demande correspond à leur description.

## Captures

```sh
npm install && npx playwright install chromium   # une fois
npm start                                        # terminal 1 : sert le site
node .claude/scripts/captures.cjs                # terminal 2 : images + rapport dans captures/
```

Le dossier `captures/` est ignoré par Git.

## Maintenance

Les skills décrivent le contexte du projet (adresse, couleurs, contraintes techniques).
Mets-les à jour quand ce contexte change, sinon Claude travaillera avec des informations fausses.
