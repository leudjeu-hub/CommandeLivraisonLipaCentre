// Articles écrits dans le HTML publié du catalogue et des pages de catégorie (catalogue.html,
// fournitures-scolaires.html…), et petite sélection pour l'accueil (selection.json). Appelé par
// catalogue-snapshot.mjs au déploiement, une fois la liste reçue de l'API : sans JavaScript (moteurs
// de recherche, assistants IA, Opera Mini), ces pages montrent les articles et leurs prix au lieu
// du seul écran de démarrage. React remplace ce contenu dès qu'il démarre.
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORY_PAGES } from '../src/data/catalogue.ts';
import { byFamilyOrder } from '../src/data/photosFamilles.ts';

const fr = JSON.parse(fs.readFileSync(new URL('../src/locales/fr.json', import.meta.url), 'utf8'));
// Au-delà, la page publiée deviendrait lourde en 3G : le reste est dans le catalogue complet
const MAX_PER_PAGE = 300;
// Accueil : comme HomePage (les 4 premiers articles avec un prix)
const SELECTION = 4;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fcfa = (n) => `${Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA`;

function listHtml(products) {
  const groups = new Map();
  for (const p of products.slice(0, MAX_PER_PAGE)) {
    const key = p.family || fr.catalogue.otherFamily;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const keys = [...groups.keys()].sort((a, b) => (a === fr.catalogue.otherFamily ? 1 : b === fr.catalogue.otherFamily ? -1 : byFamilyOrder(a, b)));
  const sections = keys.map((family) => `<h2>${esc(family)}</h2><ul>${groups.get(family)
    .map((p) => `<li>${esc(p.name)} : <strong>${p.price === null ? esc(fr.common.onQuote) : fcfa(p.price)}</strong></li>`)
    .join('')}</ul>`);
  const rest = products.length - MAX_PER_PAGE;
  return sections.join('') + (rest > 0 ? `<p>… et ${rest} autres articles dans le catalogue.</p>` : '');
}

/** Écrit les articles dans les pages publiées de `dir` et selection.json. */
export function writeStaticCatalogue(dir, products) {
  const sorted = [...products].sort((a, b) => a.id - b.id);
  const pages = [{ route: 'catalogue', title: fr.catalogue.title, items: sorted }, ...CATEGORY_PAGES.map(({ cat, route }) => ({
    route, title: fr.catalogue[`title${cat}`], items: sorted.filter((p) => p.category === cat),
  }))];
  for (const page of pages) {
    const file = path.join(dir, `${page.route}.html`);
    if (!fs.existsSync(file) || page.items.length === 0) continue;
    const html = fs.readFileSync(file, 'utf8');
    // Le titre de la page, puis ses articles sous les coordonnées de l'écran de démarrage (WhatsApp et
    // téléphone restent en haut)
    const out = html
      .replace(/<h1>[^<]*<\/h1>/, `<h1>${esc(page.title)}</h1>`)
      .replace(/(<p class="shell-info">[\s\S]*?<\/p>)/, `$1<div class="shell-list"><p>${esc(fr.catalogue.noteLive)}.</p>${listHtml(page.items)}</div>`);
    fs.writeFileSync(file, out);
  }
  const selection = sorted.filter((p) => p.price !== null).slice(0, SELECTION);
  fs.writeFileSync(path.join(dir, 'selection.json'), JSON.stringify(selection));
}
