// Gestion des articles (développement) : l'API est simulée en mémoire, la vraie API n'est pas touchée.
// Un administrateur est connecté (jeton dans localStorage, /auth/me simulé) ; voir auth.spec.cjs.
const { test, expect } = require('@playwright/test');

const article = (id, name, extra = {}) => ({
  id, category: 'Scolaire', price: 1500, name, family: null, description: 'Desc.', label: null, name_en: null,
  description_en: null, label_en: null, color: null, available: true, status: null, image: null, stock: 3, ...extra
});

test.beforeEach(async ({ page }) => {
  const db = new Map([[1, article(1, 'Cahier A4')], [2, article(2, 'Stylo bleu', { price: 500 })]]);
  let nextId = 3;
  page.on('pageerror', (e) => { throw e; });
  await page.addInitScript(() => localStorage.setItem('centre-auth-token', 'jeton-admin'));
  await page.route('**/auth/me', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ id: 1, email: 'admin@exemple.cm', role: 'admin', created_at: '2026-10-19T08:00:00' })
  }));
  await page.route(/\/products\/(\d+)?$/, async (route) => {
    const req = route.request();
    const id = Number(new URL(req.url()).pathname.split('/')[2]);
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'GET') return json(200, [...db.values()]);
    if (req.method() === 'POST') {
      const p = { ...article(nextId++, ''), ...req.postDataJSON() };
      db.set(p.id, p);
      return json(201, p);
    }
    if (!db.has(id)) return json(404, { detail: 'Product not found' });
    if (req.method() === 'PUT') {
      db.set(id, { ...db.get(id), ...req.postDataJSON() });
      return json(200, db.get(id));
    }
    db.delete(id);
    return route.fulfill({ status: 204 });
  });
});

const rows = (page) => page.getByTestId('admin-row');

test('créer, modifier et supprimer un article', async ({ page }) => {
  await page.goto('/gestion');
  await expect(rows(page)).toHaveCount(2);

  // Créer
  await page.getByRole('button', { name: 'Nouvel article' }).click();
  await page.getByLabel('Nom', { exact: false }).first().fill('Gomme blanche');
  await page.getByLabel('Prix (FCFA)').fill('250');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).nth(2)).toContainText('Gomme blanche');
  await expect(rows(page).nth(2)).toContainText('250 FCFA');

  // Modifier : prix vidé → « sur devis », article masqué
  await page.getByRole('button', { name: 'Modifier Stylo bleu' }).click();
  await expect(page.getByLabel('Prix (FCFA)')).toHaveValue('500');
  await page.getByLabel('Prix (FCFA)').fill('');
  await page.getByLabel('Disponible (affiché dans le catalogue)').uncheck();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page).nth(1)).toContainText('Sur devis');
  await expect(rows(page).nth(1)).toContainText('Masqué');

  // Supprimer (avec confirmation)
  await page.getByRole('button', { name: 'Supprimer Cahier A4' }).click();
  await expect(page.getByRole('dialog')).toContainText('Supprimer « Cahier A4 » ?');
  await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByText('Cahier A4')).toHaveCount(0);
});

test('le formulaire refuse les valeurs invalides sans appeler l’API', async ({ page }) => {
  let writes = 0;
  page.on('request', (r) => r.method() !== 'GET' && r.url().includes('/products/') && writes++);
  await page.goto('/gestion');
  await page.getByRole('button', { name: 'Nouvel article' }).click();
  await page.getByLabel('Prix (FCFA)').fill('12,5');
  await page.getByLabel('Couleur de la vignette').fill('rouge');
  await page.getByLabel('Photo').fill('https://exemple.com/a.jpg');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Le nom est obligatoire.')).toBeVisible();
  await expect(page.getByText('Nombre entier supérieur à 0, ou vide.')).toBeVisible();
  await expect(page.getByText('Format #RRGGBB.')).toBeVisible();
  await expect(page.getByText(/Chemin local commençant par img\//)).toBeVisible();
  expect(writes).toBe(0);
});

test('les articles modifiés apparaissent dans le catalogue', async ({ page }) => {
  await page.goto('/gestion');
  await page.getByRole('button', { name: 'Modifier Cahier A4' }).click();
  await page.getByLabel('Disponible (affiché dans le catalogue)').uncheck();
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(rows(page).first()).toContainText('Masqué');
  await page.getByRole('link', { name: 'Le catalogue', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card')).toContainText('Stylo bleu');
});

test('importer un CSV : aperçu, erreurs par ligne, puis import', async ({ page }) => {
  const calls = [];
  // L'API (simulée ici) vérifie le fichier ; on contrôle ce que le site envoie et affiche
  await page.route('**/products/import', async (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    const errors = body.content.includes('abc')
      ? [{ line: 3, code: 'invalid_price', column: 'prix', value: 'abc' }, { line: 4, code: 'unknown_id', column: 'id', value: '99' }]
      : [];
    const report = { created: 1, updated: 1, unchanged: 0, errors, applied: !body.dry_run && !errors.length };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(report) });
  });
  await page.goto('/gestion');
  await page.getByRole('button', { name: 'Importer (CSV)' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Importer', exact: true })).toBeDisabled();

  // Fichier Excel en Windows-1252 (« é » = 0xE9) : relu correctement
  const latin1 = Buffer.from('id;prix;nom\n2;abc;Stylo\n99;100;Crayon\n;100;Gomme \xe9l\xe9gante\n', 'latin1');
  await page.getByTestId('import-file').setInputFiles({ name: 'catalogue.csv', mimeType: 'text/csv', buffer: latin1 });
  await expect(page.getByTestId('import-errors')).toContainText('2 erreurs');
  await expect(page.getByTestId('import-errors')).toContainText('Ligne 3 : prix « abc » invalide');
  await expect(page.getByTestId('import-errors')).toContainText('Ligne 4 : aucun article n\'a l\'id « 99 »');
  await expect(dialog.getByRole('button', { name: 'Importer', exact: true })).toBeDisabled();
  expect(calls[0].dry_run).toBe(true);
  expect(calls[0].content).toContain('Gomme élégante');

  // Fichier corrigé : aperçu puis import
  const fixed = Buffer.from('﻿id;prix;nom\n2;600;Stylo\n;100;Gomme\n', 'utf8');
  await page.getByTestId('import-file').setInputFiles({ name: 'catalogue.csv', mimeType: 'text/csv', buffer: fixed });
  await expect(page.getByTestId('import-preview')).toContainText('1 nouvel(s) article(s), 1 modifié(s), 0 inchangé(s)');
  await dialog.getByRole('button', { name: 'Importer', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Import terminé : 1 créé(s), 1 modifié(s).')).toBeVisible();
  expect(calls.map((c) => c.dry_run)).toEqual([true, true, false]);
});

test('exporter le catalogue en CSV', async ({ page }) => {
  await page.goto('/gestion');
  await expect(rows(page)).toHaveCount(2);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter (CSV)' }).click()]);
  const text = require('fs').readFileSync(await download.path(), 'utf8');
  expect(text.startsWith('﻿id;categorie;prix;nom;')).toBe(true);
  expect(text).toContain('2;Scolaire;500;Stylo bleu;;Desc.;');
});

test('rechercher un article et afficher la liste par pages', async ({ page }) => {
  // Remplace la liste simulée par 120 articles
  await page.route(/\/products\/$/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(Array.from({ length: 120 }, (_, i) => article(i + 1, `Article ${i + 1}`, { family: i % 2 ? 'Stylos' : 'Cahiers' })))
  }));
  await page.goto('/gestion');
  await expect(rows(page)).toHaveCount(50);
  await page.getByRole('button', { name: /Afficher plus \(70/ }).click();
  await expect(rows(page)).toHaveCount(120);
  await page.getByLabel('Rechercher (article, réf., famille)').fill('#7');
  await expect(rows(page)).toHaveCount(11); // #7 et #70 à #79
  await page.getByLabel('Rechercher (article, réf., famille)').fill('stylos');
  await expect(rows(page)).toHaveCount(50);
});

test('commandes : filtrer, voir le détail, changer le statut', async ({ page }) => {
  const order = (id, extra = {}) => ({
    id, kind: 'order', customer_name: 'Awa', phone: '+237 690 00 00 00', status: 'new', total: 3000,
    delivery_fee: 1000, area: 'Bastos', address: 'Près de l’ambassade', slot: 'Matin', payment: 'Orange Money',
    notes: null, created_at: '2026-10-24T08:30:00Z', status_changed_at: null,
    items: [{ id: 1, product_id: 2, product_name: 'Stylo bleu', quantity: 6, unit_price: 500, line_total: 3000 }], ...extra,
  });
  const orders = [
    order(3, { customer_name: 'Zoé', status: 'cancelled', status_changed_at: '2026-10-24T10:00:00Z' }),
    order(2, { notes: 'Référence : LC-2410-4821\nSonner deux fois' }), order(1, { customer_name: 'Paul', status: 'delivered', kind: 'quote', items: [], total: 0 }),
  ];
  const patches = [];
  await page.route(/\/orders\/(\d+\/status)?$/, (route) => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(orders) });
    const id = Number(new URL(req.url()).pathname.split('/')[2]);
    patches.push([id, req.postDataJSON().status]);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...orders.find((o) => o.id === id), ...req.postDataJSON() }) });
  });
  await page.goto('/gestion');
  await page.getByRole('tab', { name: 'Commandes' }).click();

  const orderRows = page.getByTestId('order-row');
  // « À traiter » par défaut : la commande livrée est masquée
  await expect(orderRows).toHaveCount(1);
  // La référence citée par le client sur WhatsApp sert de titre ; le N° de Gestion reste en dessous
  await expect(orderRows.first()).toContainText('LC-2410-4821 · Awa');
  await expect(orderRows.first()).toContainText('N° 2 · 24/10/2026');
  await expect(orderRows.first()).toContainText('4 000 FCFA');
  await page.getByRole('button', { name: /Toutes \(3\)/ }).click();
  await expect(orderRows).toHaveCount(3);
  await expect(orderRows.nth(2)).toContainText('Devis');
  await page.getByRole('button', { name: /Annulées \(1\)/ }).click();
  await expect(page.getByText('supprimées définitivement 30 jours')).toBeVisible();
  await expect(orderRows).toHaveCount(1);
  await expect(orderRows.first()).toContainText('Supprimée le 23/11/2026');
  await page.getByRole('button', { name: /À traiter \(1\)/ }).click();

  await orderRows.first().getByRole('button', { name: 'Détails' }).click();
  await expect(orderRows.first()).toContainText('6 × Stylo bleu (Réf. 2) : 3 000 FCFA');
  await expect(orderRows.first()).toContainText('Orange Money');
  await expect(orderRows.first()).toContainText('Remarques : Sonner deux fois');
  await expect(orderRows.first().getByText(/Remarques :.*Référence/)).toHaveCount(0);
  await expect(orderRows.first().getByRole('link', { name: 'Écrire sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/237690000000');
  await orderRows.first().getByRole('combobox', { name: 'Statut' }).click();
  await page.getByRole('option', { name: 'Confirmée' }).click();
  await expect(orderRows.first()).toContainText('Confirmée');
  expect(patches).toEqual([[2, 'confirmed']]);
  await expect(page.getByText('Commande LC-2410-4821 : Confirmée.')).toBeVisible();

  // Recherche : référence (même partielle), nom ou téléphone, tous statuts confondus
  const search = page.getByLabel('Rechercher (référence LC-…, nom, téléphone)');
  await search.fill('4821');
  await expect(orderRows).toHaveCount(1);
  await expect(orderRows.first()).toContainText('LC-2410-4821');
  await search.fill('paul');
  await expect(orderRows).toHaveCount(1);
  await expect(page.getByText('1 commande trouvée, tous statuts confondus')).toBeVisible();
  await search.fill('690 00');
  await expect(orderRows).toHaveCount(3);
  await search.fill('LC-9999');
  await expect(orderRows).toHaveCount(0);
  await search.fill('');
  await expect(orderRows).toHaveCount(1);
});
